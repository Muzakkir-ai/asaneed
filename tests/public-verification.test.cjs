const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const swc = require('next/dist/build/swc');

const migrations = 'supabase/migrations';
const hardening = '20261109221703_restrict_verification_projection_reads.sql';
const gateMigration = '20261112122627_guard_certificate_number_lookup.sql';
const capability = 'a'.repeat(64);
const authId = 'f1000000-0000-4000-8000-000000000001';
const issuerId = 'f1000000-0000-4000-8000-000000000002';
const studentId = 'f1000000-0000-4000-8000-000000000003';
const draftId = 'f1000000-0000-4000-8000-000000000004';
const issueId = 'f1000000-0000-4000-8000-000000000005';

async function loadRoute() {
  await swc.loadBindings();
  const cache = new Map();
  async function compile(file) {
    const filename = path.resolve(file);
    const { code } = await swc.transform(fs.readFileSync(filename, 'utf8'), {
      filename, jsc: { parser: { syntax: 'typescript' } }, module: { type: 'commonjs' },
    });
    const mod = new Module(filename, module);
    mod.filename = filename;
    mod.paths = module.paths;
    mod.require = (id) => cache.has(id) ? cache.get(id) : require(id);
    mod._compile(code, filename);
    return mod.exports;
  }
  for (const name of ['registration', 'verification']) {
    cache.set(`../../../lib/${name}`, await compile(`lib/${name}.ts`));
  }
  return (await compile('app/api/verify/route.ts')).POST;
}

async function main() {
  const { PGlite } = await import('@electric-sql/pglite');
  const db = new PGlite();
  const row = async (sql, params = []) => (await db.query(sql, params)).rows[0];
  const lookup = async (number) => (await row('select public.verify_ijazah($1) as result', [number])).result;
  const migration = (file) => db.exec(fs.readFileSync(path.join(migrations, file), 'utf8'));
  const realFetch = global.fetch;

  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create role service_role;
      create schema auth;
      create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb, raw_app_meta_data jsonb);
      create function auth.uid() returns uuid language sql as $$
        select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
          nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'sub')::uuid;
      $$;
      grant usage on schema auth to anon, authenticated;
    `);
    for (const file of fs.readdirSync(migrations).sort()) {
      // The production-only issuer correction expects existing real profiles.
      if (file.startsWith('20261029035054') || file >= hardening) continue;
      await migration(file);
      if (file.startsWith('20261027195210')) {
        await db.exec(`
          insert into auth.users(id) values ('${authId}');
          insert into public.accounts(auth_user_id, display_name, role, active)
          values ('${authId}', 'Synthetic admin', 'admin', true);
        `);
      }
    }

    await db.exec(`
      insert into public.issuers(id, display_name, issuer_code) values ('${issuerId}', 'Synthetic issuer', '92');
      insert into public.students(id, display_name) values ('${studentId}', 'Synthetic recipient');
      insert into private.annual_certificate_allocations(certificate_id, issuer_id, year, serial)
      select gen_random_uuid(), '${issuerId}', 2098, serial from generate_series(1, 99) serial;
      insert into public.certificates(id, issuer_id, student_id, riwayah_code, completion_date, draft) values
        ('${issueId}', '${issuerId}', '${studentId}', '01', '2098-01-01', '{"internal":"private fixture"}'),
        ('${draftId}', '${issuerId}', '${studentId}', '01', '2098-01-02', '{}');
    `);
    await db.exec('set role anon');
    assert.deepEqual(await lookup('9892-10001'), { status: 'preparing' });
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${authId}', false); set role authenticated;`);
    const number = (await row(
      'select public.finalize_certificate($1, $2) as number',
      [issueId, { chain: 'Synthetic private chain', formatting: '{"printMode":"qr"}' }],
    )).number;
    assert.equal(number, '9892-10001');

    await db.exec('reset role');
    const before = await row(
      'select content, verification_token from public.certificate_snapshots join public.certificates on id=certificate_id where id=$1',
      [issueId],
    );
    const draft = await row('select registration_number from public.certificates where id=$1', [draftId]);
    await migration(hardening);
    const after = await row(
      'select content, verification_token from public.certificate_snapshots join public.certificates on id=certificate_id where id=$1',
      [issueId],
    );
    assert.deepEqual(after, before, 'migration preserves existing issued snapshot and token');
    assert.equal(JSON.parse(after.content.formatting).printMode, 'qr');

    const expected = {
      status: 'verified',
      certificate: {
        registration_number: number,
        student_name: 'Synthetic recipient',
        issuer_name: 'Synthetic issuer',
        qiraah_name: (await row("select q.display_name from public.qiraat q join public.riwayat r on q.id=r.qiraah_id where r.code='01'")).display_name,
        riwayah_name: (await row("select display_name from public.riwayat where code='01'")).display_name,
        completion_date: '2098-01-01',
      },
    };
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`set role ${role}`);
      await assert.rejects(db.query('select * from private.ijazah_verification_index'), { code: '42501' });
      assert.deepEqual(await lookup(number), expected);
      assert.deepEqual(await lookup(draft.registration_number), { status: 'not_found' });
      assert.deepEqual(await lookup('0000-0000'), { status: 'not_found' });
      for (const invalid of ['9892-%', '9892-10001,9892-10101', '۹۸۹۲-۱۰۰۰۱', null]) {
        await assert.rejects(lookup(invalid), { code: '22023' });
      }
      const historical = await row('select public.verify_certificate_token($1) as result', [before.verification_token]);
      assert.equal(historical.result.verified, true);
      assert.equal(historical.result.certificate.registrationNumber, number);
      await db.exec('reset role');
    }
    await db.exec('set role anon');
    await assert.rejects(db.query('select id from public.certificates'), { code: '42501' });
    await assert.rejects(db.query('select content from public.certificate_snapshots'), { code: '42501' });

    await db.exec('reset role');
    await migration(gateMigration);
    const guardedLookup = async (number, key, secret = capability) => (
      await row('select public.lookup_certificate_number($1, $2, $3) as result', [number, key, secret])
    ).result;
    const historicalLink = async () => (await row(
      'select public.verify_certificate_token($1) as result', [before.verification_token]
    )).result;
    await db.exec('set role anon');
    await assert.rejects(guardedLookup(number, 'b'.repeat(64)), { code: '42501' });
    await db.exec('reset role');
    await db.query(
      "insert into private.verification_lookup_capability(secret_hash) values (sha256(convert_to($1, 'UTF8')))",
      [capability],
    );
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`set role ${role}`);
      await assert.rejects(lookup(number), { code: '42501' });
      await assert.rejects(db.query('select private.verify_ijazah_number($1)', [number]), { code: '42501' });
      await assert.rejects(guardedLookup(number, 'b'.repeat(64), 'c'.repeat(64)), { code: '42501' });
      await assert.rejects(db.query('select * from private.verification_lookup_budget'), { code: '42501' });
      await assert.rejects(db.query('select * from private.verification_lookup_capability'), { code: '42501' });
      assert.equal((await historicalLink()).certificate.registrationNumber, number);
      await db.exec('reset role');
    }
    await db.exec('set role anon');
    await assert.rejects(guardedLookup('%', 'b'.repeat(64)), { code: '22023' });

    process.env.VERCEL = '1';
    process.env.CERTIFICATE_LOOKUP_CAPABILITY = capability;
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://synthetic.example.test';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'synthetic-test-key';
    let rpcCalls = 0;
    let unavailable = false;
    let mismatch = false;
    global.fetch = async (url, init) => {
      assert.equal(String(url), 'https://synthetic.example.test/rest/v1/rpc/lookup_certificate_number');
      rpcCalls++;
      if (unavailable) throw new Error('private transport error');
      const { p_number, p_client_key, p_capability } = JSON.parse(init.body);
      assert.match(p_client_key, /^[a-f0-9]{64}$/);
      assert.equal(p_capability, capability);
      const result = await guardedLookup(p_number, p_client_key, p_capability);
      if (result.status === 'verified') {
        result.certificate.internal = 'private fixture';
        if (mismatch) result.certificate.registration_number = '0000-0000';
      }
      return Response.json({ ...result, internal: 'private fixture' });
    };

    const post = await loadRoute();
    const request = async (body, status, expectedBody, headers = { 'x-vercel-forwarded-for': '192.0.2.1' }) => {
      const response = await post(new Request('http://localhost/api/verify', { method: 'POST', body, headers }));
      if (status === 429) assert.equal(response.headers.get('Retry-After'), '60');
      assert.equal(response.status, status);
      assert.equal(response.headers.get('Cache-Control'), 'no-store');
      assert.deepEqual(await response.json(), expectedBody);
    };
    for (const input of [number, '٩٨٩٢–١٠٠٠١', '۹۸۹۲۱۰۰۰۱']) {
      await request(JSON.stringify({ number: input }), 200, expected);
    }
    for (const missing of [draft.registration_number, '0000-0000']) {
      await request(JSON.stringify({ number: missing }), 200, { status: 'not_found' });
    }
    const beforeInvalid = rpcCalls;
    for (const input of ['{', '{"number":1}', '{"number":"9892-%"}', '{"number":["9892-10001"]}']) {
      await request(input, 400, { error: 'invalid_number' });
    }
    assert.equal(rpcCalls, beforeInvalid);
    await request(JSON.stringify({ number }), 503, { error: 'unavailable' }, { 'x-forwarded-for': '192.0.2.1' });
    delete process.env.CERTIFICATE_LOOKUP_CAPABILITY;
    await request(JSON.stringify({ number }), 503, { error: 'unavailable' });
    process.env.CERTIFICATE_LOOKUP_CAPABILITY = capability;
    assert.equal(rpcCalls, beforeInvalid);
    mismatch = true;
    await request(JSON.stringify({ number }), 503, { error: 'unavailable' });
    unavailable = true;
    await request(JSON.stringify({ number }), 503, { error: 'unavailable' });
    unavailable = false;
    mismatch = false;

    // Freeze the window for the synthetic test. The HTTP calls share the database budget.
    await db.exec(`
      reset role;
      truncate private.verification_lookup_budget;
      begin;
      insert into private.verification_lookup_budget
        values (floor(extract(epoch from transaction_timestamp()) / 60)::bigint - 1, 'global', 60);
      set local role anon;
    `);
    const body = JSON.stringify({ number });
    const caller = { 'x-vercel-forwarded-for': '2001:db8::1' };
    const responses = await Promise.all(Array.from({ length: 12 }, () =>
      post(new Request('http://localhost/api/verify', { method: 'POST', body, headers: caller }))));
    assert.equal(responses.filter(response => response.status === 200).length, 10);
    assert.equal(responses.filter(response => response.status === 429).length, 2);
    await request(body, 429, { error: 'rate_limited' }, {
      'x-vercel-forwarded-for': '2001:0db8:0:0:0:0:0:1',
      'x-forwarded-for': '192.0.2.50',
    });

    for (let i = 0; i < 50; i++) {
      assert.equal((await guardedLookup('0000-0000', i.toString(16).padStart(64, '0'))).status, 'not_found');
    }
    await request(body, 429, { error: 'rate_limited' });
    assert.equal((await historicalLink()).verified, true, 'historical tokens survive budget exhaustion');
    await db.exec('rollback');

    await db.exec('reset role; update private.ijazah_verification_index set published=false; set role anon');
    await request(JSON.stringify({ number }), 200, { status: 'preparing' });
    const hidden = await row('select public.verify_certificate_token($1) as result', [before.verification_token]);
    assert.deepEqual(hidden.result, { verified: false, certificate: null });
    await db.exec('reset role; set role authenticated');
    const newNumber = (await row(
      'select public.finalize_certificate($1, $2) as number',
      [draftId, { chain: 'Synthetic private chain', formatting: '{"printMode":"number"}' }],
    )).number;
    await db.exec('reset role; set role anon');
    assert.equal((await guardedLookup(newNumber, 'd'.repeat(64))).status, 'verified');
    assert.deepEqual(await guardedLookup(number, 'd'.repeat(64)), { status: 'not_found' });

  } finally {
    global.fetch = realFetch;
    await db.close();
  }
}

main().then(() => console.log('PASS: public verification HTTP handler, shared budgets, RPC bypass denial, publication, privacy and historical link'))
  .catch((error) => { console.error(error); process.exitCode = 1; });
