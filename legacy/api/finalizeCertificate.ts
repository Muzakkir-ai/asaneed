import {ensureCertificateRegistration} from '../lib/certificateRegistration';
import {isAppAdmin} from '../lib/admin';
import {z} from 'zod';
import {createEndpoint} from 'zitejs/backend';
import {zite} from 'zitejs/db';
import {context as requestContext} from '../compat/context';
import {getDraftSanadForCertificate,collectSnapshotFormatting} from '../lib/certificateSnapshot';

const font=z.enum(['KSA Regular','Sakkal Kitab','Majalla','Bahij Muna','Amiri']);
const color=z.enum(['primary','secondary','charcoal']);
const typography=z.object({font,size:z.number().min(6).max(30),color});
const style=z.object({borderColor:z.string().regex(/^#[0-9a-fA-F]{6}$/),accentColor:z.string().regex(/^#[0-9a-fA-F]{6}$/),typography:z.object({reading:typography,sanad:typography,conclusion:typography,shaykh:typography}),phrases:z.array(z.object({text:z.string().min(1).max(300),font,size:z.number().min(6).max(30),color})).max(80)});
const first=(v?:string|string[])=>Array.isArray(v)?v[0]:v;

export default createEndpoint({
 description:'Publish a drafted shahada and permanently snapshot its text and selected print settings',
 authenticated:true,
 inputSchema:z.object({certificateId:z.string(),settings:style,printMode:z.enum(['number','none','qr']).default('number')}),
 outputSchema:z.object({chain:z.string(),heading:z.string(),formatting:z.string()}),
 execute:async({input,context})=>{
  const cert=await zite.certificates.findOne({id:input.certificateId}).catch(()=>null);
  if(!cert)throw new Error('الشهادة غير موجودة');
  const issuer=first(cert.shaykh);
  const admin=(await isAppAdmin(context.user.email));
  if(!issuer||(!admin&&issuer!==context.user.id))throw new Error('لا تملك صلاحية اعتماد هذه الشهادة');
  if(cert.publicationStatus!=='draft')throw new Error('هذه الشهادة نُشرت بالفعل');
  const {records:existing}=await zite.certificateSnapshots.findAll({filters:{certificateId:cert.id},limit:100});
  if(existing.some(s=>s.ownerId!==issuer))throw new Error('صاحب النسخة المحفوظة لا يطابق المُجيز');
  const previous=existing.find(s=>s.ownerId===issuer);
  const sanadId=first(cert.sanad);
  if(!sanadId)throw new Error('لا يوجد سند لهذه الشهادة');
  const chain=(await getDraftSanadForCertificate(sanadId,issuer,cert.id)).chain;
  const current=JSON.parse(await collectSnapshotFormatting(sanadId,issuer,chain));
  const [{records:profiles},{records:extras}]=await Promise.all([zite.shaykhPrintProfiles.findAll({filters:{ownerId:cert.additionalShaykh?'guest:'+cert.additionalShaykh:issuer},limit:50}),zite.additionalShaykhs.findAll({limit:2000})]);
  const profile=profiles.find(p=>p.ownerId===(cert.additionalShaykh?'guest:'+cert.additionalShaykh:issuer));
  const guest=extras.find(x=>x.id===cert.additionalShaykh);
  if(cert.additionalShaykh&&!guest)throw new Error('بيانات المُجيز الإضافي غير موجودة');
  const footerProfile={
   footerLineStyles:guest?'':profile?.footerLineStyles||'',scientificQualification:guest?(guest.qualification||''):(profile?.scientificQualification||''),
   showScientificQualification:guest?true:(profile?.showScientificQualification??true),printedName:guest?(guest.name||''):(profile?.printedName||''),
   teachingRole:guest?(guest.teachingRole||''):(profile?.teachingRole||''),madrasaName:guest?(guest.madrasaName||''):(profile?.madrasaName||''),madrasaPlace:guest?(guest.madrasaPlace||''):(profile?.madrasaPlace||''),
   centerStampText:guest?'':profile?.centerStampText||'',showTeachingRole:guest?true:(profile?.showTeachingRole??true),
   showMadrasaName:guest?true:(profile?.showMadrasaName??true),showMadrasaPlace:guest?true:(profile?.showMadrasaPlace??true),
  };
  const users=await zite.auth.findAllUsers({appIds:['qkvfmeznbu'],limit:2000});
  const u=users.records.find(u=>u.id===issuer);
  const issuerDisplayName=guest?.name||u?.name||[u?.firstName,u?.lastName].filter(Boolean).join(' ')||u?.email||'';
  const registrationNumber=await ensureCertificateRegistration(cert.id);
  const verificationToken=cert.verificationToken||crypto.randomUUID();
  const formatting=JSON.stringify({phrases:current.phrases||[],settings:input.settings,footerProfile,issuerDisplayName,registrationNumber,verificationToken,printMode:input.printMode});
  const heading=chain.match(/^【بيان القراءة:([^】]+)】/)?.[1]||'';
  const record={name:'شهادة '+cert.id,certificateId:cert.id,ownerId:issuer,chain,heading,formatting,issuedAt:new Date().toISOString()};
  const {client}=requestContext();
  const {error}=await client.rpc('finalize_certificate',{certificate_id:cert.id,snapshot:{chain,heading,formatting}});
  if(error)throw new Error(error.message);
  const {data,error:readError}=await client.from('certificate_snapshots').select('content').eq('certificate_id',cert.id).single();
  if(readError)throw new Error(readError.message);
  return {chain:data.content.chain,heading:data.content.heading,formatting:data.content.formatting};
 }
});
