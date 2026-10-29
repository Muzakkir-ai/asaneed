import {readingIdentityFromHeading} from '../lib/riwayahSvgHeading';
import {isAppAdmin} from '../lib/admin';
import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import {displayReadingLabel} from '../lib/qurra';

const first = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v) ?? '';

export default createEndpoint({
  description: "Loads the signed-in shaykh's asaneed and the certificates he has issued",
  authenticated: true,
  inputSchema: z.object({}),
  outputSchema: z.object({
    isAdmin:z.boolean(),
    issuers:z.array(z.object({id:z.string(),name:z.string()})),
    shaykhs:z.array(z.object({id:z.string(),name:z.string()})),
    asaneed: z.array(z.object({ id: z.string(), title: z.string(), qiraahName: z.string(), chain: z.string(), shaykhId:z.string() })),
    certificates: z.array(z.object({
      id: z.string(), studentName: z.string(), completionDate: z.string(), hijriDayOffset:z.number(), sanadId: z.string(),
      qiraahName: z.string(), notes: z.string(), certificateNumber: z.number(), registrationNumber:z.string(),issuerKey:z.string(),qariId:z.string(),rawi:z.string(), publicationStatus:z.enum(['draft','final']), shaykhId:z.string(), shaykhName:z.string(), additionalShaykh:z.string(), snapshotChain:z.string(), snapshotHeading:z.string(), snapshotFormatting:z.string(),
    })),
  }),
  execute: async ({ context }) => {
    const admin=(await isAppAdmin(context.user.email));
    const [{ records: qiraat }, { records: asaneed }, { records: certs },{records:snapshots},users,extras,holdings,profiles] = await Promise.all([
      zite.qiraat.findAll({ limit: 2000 }),
      // Admins list certificates from all issuers, so resolve their linked sanads as well.
      // Only the signed-in issuer's sanads are exposed in the editable asaneed list.
      zite.asaneed.findAll(admin?{limit:2000}:{ filters: { shaykh: context.user.id }, limit: 2000 }),
      zite.certificates.findAll(admin?{limit:2000}:{ filters: { shaykh: context.user.id }, limit: 2000 }),
      zite.certificateSnapshots.findAll(admin?{limit:2000}:{filters:{ownerId:context.user.id},limit:2000}),
      admin?zite.auth.findAllUsers({appIds:['qkvfmeznbu'],limit:2000}):Promise.resolve({records:[context.user]}),
      zite.additionalShaykhs.findAll({limit:2000}),
      zite.ijazahHoldings.findAll(admin?{limit:2000}:{filters:{ownerId:context.user.id},limit:2000}),
      zite.shaykhPrintProfiles.findAll(admin?{limit:2000}:{filters:{ownerId:context.user.id},limit:2000}),
    ]);
    const accountNames=users.records.map(u=>({id:u.id,name:profiles.records.find(p=>p.ownerId===u.id)?.printedName||u.name||[u.firstName,u.lastName].filter(Boolean).join(' ')||u.email||'شيخ غير مسمى'}));
    const shaykhs=accountNames.filter(u=>profiles.records.some(p=>p.ownerId===u.id)||holdings.records.some(h=>h.ownerId===u.id)||certs.some(c=>!c.additionalShaykh&&first(c.shaykh)===u.id));
    const issuerMap=new Map<string,string>(extras.records.map(g=>['guest:'+g.id,g.name||'شيخ إضافي'] as [string,string]));
    for(const u of shaykhs)issuerMap.set('user:'+u.id,u.name);
    const issuers=[...issuerMap].map(([id,name])=>({id,name})).sort((a,b)=>a.name.localeCompare(b.name,'ar'));
    const shaykhNames=new Map(accountNames.map(u=>[u.id,u.name]));
    const guestNames=new Map<string,string>(extras.records.map(x=>[x.id,x.name||''] as [string,string]));
    // Enforce account isolation independently of the database query filter.
    const owns=(value:string|string[]|undefined)=>Array.isArray(value)?value.includes(context.user.id):value===context.user.id;
    const ownAsaneed=asaneed;
    const ownCerts=admin?certs:certs.filter(c=>owns(c.shaykh));
    const ownSnapshots=admin?snapshots:snapshots.filter(s=>s.ownerId===context.user.id);
    const qName = new Map(qiraat.map((q) => [q.id, q.name ?? '']));
    const sanads = ownAsaneed.map((a) => ({
      id: a.id,
      title: a.title ?? '',
      qiraahName: qName.get(first(a.qiraah)) ?? '',
      chain: a.chain ?? '',
      shaykhId:first(a.shaykh),
    }));
    const readingBySanad = new Map(asaneed.map(a=>[
      a.id,
      displayReadingLabel((a.chain||'').match(/^【بيان القراءة:([^】]+)】/)?.[1]?.trim() || qName.get(first(a.qiraah)) || ''),
    ]));
    const snapMap=new Map(ownSnapshots.map(s=>[s.certificateId,s]));
    return {
      isAdmin:admin,
      shaykhs,issuers,
      asaneed: sanads,
      certificates: ownCerts
        .map((c) => ({
          id: c.id,
          studentName: c.studentName ?? '',
          completionDate: c.completionDate ?? '',
          hijriDayOffset:c.hijriDayOffset??0,
          sanadId: first(c.sanad),
          qiraahName: readingBySanad.get(first(c.sanad)) || snapMap.get(c.id)?.heading || '',
          notes: c.notes ?? '',
          registrationNumber:c.registrationNumber||'',
          certificateNumber: c.shahadaNumber ?? c.certificateNumber ?? 0,
          publicationStatus:c.publicationStatus==='draft'?'draft':'final' as const,
          shaykhId:first(c.shaykh),
          additionalShaykh:c.additionalShaykh||'',
          issuerKey:c.additionalShaykh?'guest:'+c.additionalShaykh:'user:'+first(c.shaykh),
          qariId:readingIdentityFromHeading(readingBySanad.get(first(c.sanad))||snapMap.get(c.id)?.heading||'')?.qariId||'',
          rawi:readingIdentityFromHeading(readingBySanad.get(first(c.sanad))||snapMap.get(c.id)?.heading||'')?.rawi||'',
          shaykhName:(c.additionalShaykh&&guestNames.get(c.additionalShaykh))||shaykhNames.get(first(c.shaykh))||'شيخ غير مسمى',
          snapshotChain:snapMap.get(c.id)?.chain||'',
          snapshotHeading:snapMap.get(c.id)?.heading||'',
          snapshotFormatting:snapMap.get(c.id)?.formatting||'',
        }))
        .sort((a, b) => b.certificateNumber - a.certificateNumber),
    };
  },
});
