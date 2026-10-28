import {isAppAdmin} from '../lib/admin';
import {z} from 'zod';
import {createEndpoint} from 'zitejs/backend';
import {zite} from 'zitejs/db';
import {getDraftSanadForCertificate,collectSnapshotFormatting} from '../lib/certificateSnapshot';

const first=(v?:string|string[])=>Array.isArray(v)?v[0]:v;
const footerProfileSchema=z.object({
 footerLineStyles:z.string(),scientificQualification:z.string(),showScientificQualification:z.boolean(),
 printedName:z.string(),teachingRole:z.string(),madrasaName:z.string(),madrasaPlace:z.string(),
 centerStampText:z.string(),showTeachingRole:z.boolean(),showMadrasaName:z.boolean(),showMadrasaPlace:z.boolean(),
});
export default createEndpoint({
 description:'Resolve the latest sanad, shared formatting and colors for an unpublished certificate preview',
 authenticated:true,
 inputSchema:z.object({certificateId:z.string()}),
 outputSchema:z.object({chain:z.string(),heading:z.string(),formatting:z.string(),source:z.enum(['current','saved']),issuerName:z.string(),footerProfile:footerProfileSchema}),
 execute:async({input,context})=>{
  const cert=await zite.certificates.findOne({id:input.certificateId}).catch(()=>null);
  if(!cert)throw new Error('الشهادة غير موجودة');
  const issuer=first(cert.shaykh);
  const admin=(await isAppAdmin(context.user.email));
  if(!issuer||(!admin&&issuer!==context.user.id))throw new Error('هذه الشهادة غير متاحة');
  if(cert.publicationStatus!=='draft')throw new Error('الشهادة نهائية؛ اعرض النسخة المحفوظة');
  const sanadId=first(cert.sanad);
  if(!sanadId)throw new Error('اختر سندًا للشهادة');
  const current=await getDraftSanadForCertificate(sanadId,issuer,cert.id);
  const chain=current.chain;
  const [formatting,profiles,users,extraSheikhs]=await Promise.all([
   collectSnapshotFormatting(sanadId,issuer,chain),
   zite.shaykhPrintProfiles.findAll({filters:{ownerId:cert.additionalShaykh?'guest:'+cert.additionalShaykh:issuer},limit:50}),
   zite.auth.findAllUsers({appIds:['qkvfmeznbu'],limit:2000}),
   zite.additionalShaykhs.findAll({limit:2000}),
  ]);
  // Bind the mujeez identity to the certificate's actual issuer, never the viewer.
  const profile=profiles.records.find(p=>p.ownerId===(cert.additionalShaykh?'guest:'+cert.additionalShaykh:issuer));
  const guest=extraSheikhs.records.find(g=>g.id===cert.additionalShaykh);
  if(cert.additionalShaykh&&!guest)throw new Error('بيانات المُجيز الإضافي غير موجودة');
  const owner=users.records.find(u=>u.id===issuer);
  const issuerName=guest?.name?.trim()||profile?.printedName?.trim()||owner?.name?.trim()
    ||[owner?.firstName,owner?.lastName].filter(Boolean).join(' ').trim()||owner?.email||'';
  if(!issuerName)throw new Error('تعذر تحديد اسم المُجيز صاحب الشهادة');
  const footerProfile={
   footerLineStyles:guest?'':profile?.footerLineStyles||'',scientificQualification:guest?(guest.qualification||''):(profile?.scientificQualification||''),
   showScientificQualification:guest?true:(profile?.showScientificQualification??true),printedName:guest?(guest.name||''):(profile?.printedName||''),
   teachingRole:guest?(guest.teachingRole||''):(profile?.teachingRole||''),madrasaName:guest?(guest.madrasaName||''):(profile?.madrasaName||''),madrasaPlace:guest?(guest.madrasaPlace||''):(profile?.madrasaPlace||''),
   centerStampText:guest?'':profile?.centerStampText||'',showTeachingRole:guest?true:(profile?.showTeachingRole??true),
   showMadrasaName:guest?true:(profile?.showMadrasaName??true),showMadrasaPlace:guest?true:(profile?.showMadrasaPlace??true),
  };
  return {chain,heading:chain.match(/^【بيان القراءة:([^】]+)】/)?.[1]||'',formatting,source:current.source,issuerName,footerProfile};
 }
});
