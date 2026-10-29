import {readingIdentityFromHeading} from '../lib/riwayahSvgHeading';
import {z} from 'zod';
import {createEndpoint} from 'zitejs/backend';
import {zite} from 'zitejs/db';
import {displayReadingLabel} from '../lib/qurra';
const first=(s?:string|string[])=>Array.isArray(s)?s[0]:s||'';
const publishedCert=z.object({
  id:z.string(),studentName:z.string(),completionDate:z.string(),hijriDayOffset:z.number(),
  sanadId:z.string(),qiraahName:z.string(),notes:z.string(),certificateNumber:z.number(),registrationNumber:z.string(),issuerKey:z.string(),qariId:z.string(),rawi:z.string(),
  publicationStatus:z.literal('final'),shaykhId:z.string(),shaykhName:z.string(),additionalShaykh:z.string(),
  snapshotChain:z.string(),snapshotHeading:z.string(),snapshotFormatting:z.string(),
});
export default createEndpoint({
 description:'Return only finalized certificates expressly linked to the authenticated recipient',
 authenticated:true,inputSchema:z.object({}),
 outputSchema:z.object({canBuildSanad:z.boolean(),importedCertificateIds:z.array(z.string()),certificates:z.array(publishedCert)}),
 execute:async({context})=>{
  const {records:all}=await zite.certificates.findAll({filters:{studentAccount:context.user.id},limit:2000});
  const mine=all.filter(c=>c.studentAccount===context.user.id&&c.publicationStatus==='final');
  const [snapshots,users,extras,asaneed]=await Promise.all([
   zite.certificateSnapshots.findAll({limit:2000}),
   zite.auth.findAllUsers({appIds:['qkvfmeznbu'],limit:2000}),
   zite.additionalShaykhs.findAll({limit:2000}),
   zite.asaneed.findAll({limit:2000}),
  ]);
  const names=new Map(users.records.map(x=>[x.id,x.name||x.email||'']));
  const guestNames=new Map(extras.records.map(x=>[x.id,x.name||'']));
  const headings=new Map(asaneed.records.map(a=>[a.id,(a.chain||'').match(/^【بيان القراءة:([^】]+)】/)?.[1]||'']));
  const list:z.infer<typeof publishedCert>[]=[];
  for(const c of mine){
   const snapshot=snapshots.records.find(x=>x.certificateId===c.id&&x.ownerId===first(c.shaykh)&&!!x.chain);
   if(!snapshot)continue;
   list.push({id:c.id,studentName:c.studentName||'',completionDate:c.completionDate||'',
     hijriDayOffset:c.hijriDayOffset||0,sanadId:first(c.sanad),
     qiraahName:displayReadingLabel(snapshot.heading||headings.get(first(c.sanad))||''),notes:c.notes||'',
     registrationNumber:c.registrationNumber||'',certificateNumber:c.shahadaNumber||c.certificateNumber||0,publicationStatus:'final' as const,
     issuerKey:c.additionalShaykh?'guest:'+c.additionalShaykh:'user:'+first(c.shaykh),qariId:readingIdentityFromHeading(snapshot.heading||headings.get(first(c.sanad))||'')?.qariId||'',rawi:readingIdentityFromHeading(snapshot.heading||headings.get(first(c.sanad))||'')?.rawi||'',
     shaykhId:first(c.shaykh),additionalShaykh:c.additionalShaykh||'',shaykhName:(()=>{try{const f=JSON.parse(snapshot.formatting||'{}');return f.footerProfile?.printedName||f.issuerDisplayName||(c.additionalShaykh&&guestNames.get(c.additionalShaykh))||'';}catch{return '';}})(),
     snapshotChain:snapshot.chain||'',snapshotHeading:snapshot.heading||'',snapshotFormatting:snapshot.formatting||''});
  }
  const {records:holdings}=context.account.role==='student'?{records:[]}:await zite.ijazahHoldings.findAll({filters:{ownerId:context.user.id},limit:2000});
  return {canBuildSanad:context.account.role!=='student'&&!context.scope?.inspection,importedCertificateIds:holdings.map(h=>h.sourceCertificateId||'').filter(Boolean),certificates:list.sort((a,b)=>b.certificateNumber-a.certificateNumber)};
 }
});
