import {isAppAdmin} from '../lib/admin';
import {z} from 'zod';
import {createEndpoint} from 'zitejs/backend';
import {zite} from 'zitejs/db';

const one=(v?:string|string[])=>Array.isArray(v)?v[0]:v;
export default createEndpoint({
 description:'Verify issuer-owned documented personal sanad before displaying or printing a certificate',
 authenticated:true,
 inputSchema:z.object({certificateId:z.string()}),
 outputSchema:z.object({allowed:z.boolean(),message:z.string()}),
 execute:async({input,context})=>{
  const certificate=await zite.certificates.findOne({id:input.certificateId}).catch(()=>null);
  if(!certificate)return {allowed:false,message:'الشهادة غير موجودة'};
  const issuer=one(certificate.shaykh);
  const admin=(await isAppAdmin(context.user.email));
  const recipient=certificate.studentAccount===context.user.id;
  if(!issuer||(!admin&&issuer!==context.user.id&&!recipient))return {allowed:false,message:'ليس لديك تصريح لطباعة هذه الشهادة'};
  if(certificate.publicationStatus==='draft')return {allowed:false,message:'هذه شهادة مسودة؛ اعتمدها نهائيًا أولًا'};
  const {records:snaps}=await zite.certificateSnapshots.findAll({filters:{certificateId:certificate.id},limit:100});
  // Once finalized, the certificate's owned immutable snapshot stands alone.
  // Later changes to a user's editable source sanad cannot rewrite it.
  const snapshot=snaps.find(r=>r.ownerId===issuer&&!!r.chain?.trim());
  if(!snapshot)return {allowed:false,message:'لا توجد نسخة نهائية لهذه الشهادة'};
  return {allowed:true,message:''};
 }
});
