import {BACKUP_TABLES,BACKUP_READ_ONLY} from '../lib/backupManifest';
import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { isAppAdmin } from '../lib/admin';

const BACKUP_SCHEMA_VERSION = 3;
const APP_TAG = 'asaneed-ijazat-platform';

type Rec = Record<string, unknown> & { id: string };
type Client = {
  findAll: (p: { limit: number; offset: number }) => Promise<{ records: Rec[]; hasMore: boolean }>;
  bulkCreate: (p: { records: Record<string, unknown>[] }) => Promise<{ records: Rec[] }>;
  update: (p: { id: string; record: Record<string, unknown> }) => Promise<unknown>;
  delete: (p: { id: string }) => Promise<unknown>;
};

// Order matters: parents first. Inverse link sides are listed in SKIP so they are rebuilt from the owning side.
const TABLES=BACKUP_TABLES;
type TableName = (typeof TABLES)[number];
const client = (t: TableName) => (zite as unknown as Record<string, Client>)[t];
const READ_ONLY=BACKUP_READ_ONLY;
const INVERSE_LINKS: Record<string, string[]> = { qiraat: ['asaneed'], asaneed: ['certificates'] };
const LINKS: Record<string, string[]> = { asaneed: ['qiraah'], certificates: ['sanad'] };

type Account = { id: string; name: string; email: string; firstName?: string; lastName?: string; image: string | null };
async function readAccounts(): Promise<Account[]> {
  const out: Account[] = [];
  for (let offset = 0; ; offset += 500) {
    const res = await zite.auth.findAllUsers({ appIds: ['qkvfmeznbu'], limit: 500, offset });
    // Profile fields only: no passwords, sessions or auth secrets are read.
    out.push(...res.records.map((u) => ({ id: u.id, name: u.name, email: u.email, firstName: u.firstName, lastName: u.lastName, image: u.image ?? null })));
    if (!res.hasMore || res.records.length === 0) break;
  }
  return out;
}

async function readAll(t: TableName) {
  const out: Rec[] = [];
  for (let offset = 0; ; offset += 2000) {
    const { records, hasMore } = await client(t).findAll({ limit: 2000, offset });
    out.push(...records);
    if (!hasMore || records.length === 0) break;
  }
  return out;
}

function writable(t: TableName, r: Rec, includeLinks: boolean) {
  const skip = new Set(['id', ...(READ_ONLY[t] ?? []), ...(INVERSE_LINKS[t] ?? []), ...(includeLinks ? [] : LINKS[t] ?? [])]);
  const o: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(r)) if (!skip.has(k)) o[k] = v ?? null;
  // Preserve externally visible codes and ordering when database auto-numbers regenerate.
  if(t==='certificateIssuers'&&!o.issuerCode&&typeof r.issuerNumber==='number')o.issuerCode=String(r.issuerNumber).padStart(2,'0');
  if(t==='certificateRegistrations'&&!o.sequenceOrder&&typeof r.reservationOrder==='number')o.sequenceOrder=r.reservationOrder;
  return o;
}

// Replace every old record id (UUID) that appears inside strings / arrays / JSON text with its new id.
function remap(v: unknown, map: Map<string, string>): unknown {
  if (typeof v === 'string') {
    if (map.has(v)) return map.get(v);
    return v.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, (m) => map.get(m) ?? m);
  }
  if (Array.isArray(v)) return v.map((x) => remap(x, map));
  if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,value])=>[k,remap(value,map)]));
  return v;
}

const norm = (v: unknown) => JSON.stringify(Array.isArray(v) ? [...v].sort() : v ?? null);
const differs = (t: TableName, a: Rec, b: Rec) => {
  const A = writable(t, a, true), B = writable(t, b, true);
  return [...new Set([...Object.keys(A), ...Object.keys(B)])].some((k) => norm(A[k]) !== norm(B[k]));
};

async function inBatches<T>(items: T[], n: number, fn: (x: T) => Promise<unknown>) {
  for (let i = 0; i < items.length; i += n) await Promise.all(items.slice(i, i + n).map(fn));
}

const backupSchema = z.object({
  app: z.string(),
  schemaVersion: z.number(),
  exportedAt: z.string(),
  tables: z.record(z.string(), z.array(z.record(z.string(), z.any()))),
  accounts: z.array(z.object({ id: z.string(), name: z.string(), email: z.string(), firstName: z.string().optional(), lastName: z.string().optional(), image: z.string().nullable() })).optional(),
});
const accountStatSchema = z.object({ inBackup: z.number(), matched: z.number(), changed: z.number(), missing: z.number(), missingEmails: z.array(z.string()) });

const statSchema = z.object({ table: z.string(), inBackup: z.number(), missing: z.number(), conflicts: z.number(), identical: z.number(), onlyInDatabase: z.number() });

export default createEndpoint({
  description: 'Admin-only full export, import preview and restore of all app data',
  authenticated: true,
  inputSchema: z.object({
    action: z.enum(['export', 'preview', 'restore']),
    backup: backupSchema.optional(),
    mode: z.enum(['addMissing', 'restore']).optional(),
    confirmOverwrite: z.boolean().optional(),
  }),
  outputSchema: z.object({
    backup: backupSchema.optional(),
    stats: z.array(statSchema).optional(),
    accountStats: accountStatSchema.optional(),
    warnings: z.array(z.string()).optional(),
    result: z.object({ created: z.number(), updated: z.number(), deleted: z.number(), accountsUpdated: z.number() }).optional(),
  }),
  execute: async ({ input, context }) => {
    if (!(await isAppAdmin(context.user.email))) throw new ZiteError({ code: 'FORBIDDEN', message: 'Not admin', userFacingMessage: 'هذه العملية متاحة للمدير فقط' });

    const current = {} as Record<TableName, Rec[]>;
    for (const t of TABLES) current[t] = await readAll(t);

    if (input.action === 'export') {
      // Only application tables are exported. Auth passwords, sessions and integration credentials live outside these tables.
      return { backup: { app: APP_TAG, schemaVersion: BACKUP_SCHEMA_VERSION, exportedAt: new Date().toISOString(), tables: current, accounts: await readAccounts() } };
    }

    const backup = input.backup;
    if (!backup) throw new ZiteError({ code: 'BAD_REQUEST', message: 'No backup', userFacingMessage: 'لم يتم اختيار ملف' });
    if (backup.app !== APP_TAG) throw new ZiteError({ code: 'BAD_REQUEST', message: 'Wrong app', userFacingMessage: 'هذا الملف ليس نسخة احتياطية لهذه المنصة' });
    if (backup.schemaVersion > BACKUP_SCHEMA_VERSION) throw new ZiteError({ code: 'BAD_REQUEST', message: 'Newer schema', userFacingMessage: 'هذه النسخة من إصدار أحدث من المنصة' });

    const warnings: string[] = [];
    if (backup.schemaVersion < BACKUP_SCHEMA_VERSION) warnings.push(`نسخة قديمة (الإصدار ${backup.schemaVersion})`);
    const unknown = Object.keys(backup.tables).filter((k) => !(TABLES as readonly string[]).includes(k));
    if (unknown.length) warnings.push(`جداول غير معروفة سيتم تجاهلها: ${unknown.join('، ')}`);

    const omitted=TABLES.filter(t=>!Object.prototype.hasOwnProperty.call(backup.tables,t));
    if(omitted.length)warnings.push('جداول غير موجودة في هذه النسخة ولن تُعدّل أو تُحذف: '+omitted.join('، '));
    const plan = TABLES.filter(t=>Object.prototype.hasOwnProperty.call(backup.tables,t)).map((t) => {
      const rows = (backup.tables[t] ?? []) as Rec[];
      const byId = new Map(current[t].map((r) => [r.id, r]));
      const ids = new Set(rows.map((r) => r.id));
      const missing = rows.filter((r) => !byId.has(r.id));
      const conflicts = rows.filter((r) => byId.has(r.id) && differs(t, r, byId.get(r.id)!));
      return { t, rows, missing, conflicts, identical: rows.length - missing.length - conflicts.length, extra: current[t].filter((r) => !ids.has(r.id)) };
    });
    const stats = plan.map((p) => ({ table: p.t, inBackup: p.rows.length, missing: p.missing.length, conflicts: p.conflicts.length, identical: p.identical, onlyInDatabase: p.extra.length }));
    const liveAccounts = new Map((await readAccounts()).map((a) => [a.id, a]));
    const bAccounts = backup.accounts ?? [];
    const changedAccounts = bAccounts.filter((a) => { const l = liveAccounts.get(a.id); return l && ((a.firstName ?? '') !== (l.firstName ?? '') || (a.lastName ?? '') !== (l.lastName ?? '') || (a.image ?? null) !== (l.image ?? null)); });
    const missingAccounts = bAccounts.filter((a) => !liveAccounts.has(a.id));
    const accountStats = { inBackup: bAccounts.length, matched: bAccounts.length - missingAccounts.length, changed: changedAccounts.length, missing: missingAccounts.length, missingEmails: missingAccounts.map((a) => a.email).slice(0, 50) };
    if (missingAccounts.length) warnings.push(`${missingAccounts.length} حساب في النسخة غير موجود حالياً؛ ستُستعاد سجلاته لكن لن ترتبط بصاحبها حتى يُعاد إنشاء الحساب بنفس المعرّف.`);
    if (input.action === 'preview') return { stats, warnings, accountStats };

    const mode = input.mode ?? 'addMissing';
    if (mode === 'restore' && !input.confirmOverwrite) throw new ZiteError({ code: 'BAD_REQUEST', message: 'Confirmation required', userFacingMessage: 'يجب تأكيد الاستبدال أولاً' });

    // Phase 1: create missing records (without links), building old→new id map. Existing ids map to themselves.
    const idMap = new Map<string, string>();
    let created = 0, updated = 0, deleted = 0;
    const createdPairs: { t: TableName; old: Rec; newId: string }[] = [];
    for (const p of plan) {
      for (const r of p.rows) if (!p.missing.includes(r)) idMap.set(r.id, r.id);
      for (let i = 0; i < p.missing.length; i += 100) {
        const chunk = p.missing.slice(i, i + 100);
        const res = await client(p.t).bulkCreate({ records: chunk.map((r) => writable(p.t, r, false)) });
        res.records.forEach((nr, j) => { idMap.set(chunk[j].id, nr.id); createdPairs.push({ t: p.t, old: chunk[j], newId: nr.id }); });
        created += res.records.length;
      }
    }

    for(const p of plan){
      for(const old of p.rows.filter(r=>!p.missing.includes(r))){
        const patch:Record<string,unknown>={};
        for(const [key,value] of Object.entries(writable(p.t,old,true))){
          const mapped=remap(value,idMap);
          if(norm(value)!==norm(mapped))patch[key]=mapped;
        }
        if(Object.keys(patch).length)await client(p.t).update({id:old.id,record:patch});
      }
    }
    // Phase 2: rewrite id references + links on newly created records.
    await inBatches(createdPairs, 10, async ({ t, old, newId }) => {
      const full = writable(t, old, true);
      const patch: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(full)) {
        const nv = remap(v, idMap);
        if ((LINKS[t] ?? []).includes(k) || norm(nv) !== norm(v)) patch[k] = nv;
      }
      if (Object.keys(patch).length) await client(t).update({ id: newId, record: patch });
    });

    if (mode === 'restore') {
      // Overwrite records that differ, then remove records not present in the backup.
      const conflicts = plan.flatMap((p) => p.conflicts.map((r) => ({ t: p.t, r })));
      await inBatches(conflicts, 10, async ({ t, r }) => {
        const rec = writable(t, r, true);
        for (const k of Object.keys(rec)) rec[k] = remap(rec[k], idMap);
        await client(t).update({ id: r.id, record: rec });
        updated++;
      });
      const extras = [...plan].reverse().flatMap((p) => p.extra.map((r) => ({ t: p.t, id: r.id })));
      await inBatches(extras, 10, async ({ t, id }) => { await client(t).delete({ id }); deleted++; });
    }
    let accountsUpdated = 0;
    if (mode === 'restore') {
      await inBatches(changedAccounts, 5, async (a) => { await zite.auth.updateUserProfile(a.id, { firstName: a.firstName, lastName: a.lastName, image: a.image ?? undefined }); accountsUpdated++; });
    }
    return { stats, warnings, accountStats, result: { created, updated, deleted, accountsUpdated } };
  },
});
