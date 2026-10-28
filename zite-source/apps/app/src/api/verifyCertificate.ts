import {z} from 'zod';
import {createEndpoint} from 'zitejs/backend';
import {zite} from 'zitejs/db';
import {displayReadingLabel} from '../lib/qurra';
const first=(v?:string|string[])=>Array.isArray(v)?v[0]:v||'';
export default createEndpoint({
 description:'Public verification of an issued shahada by its non-guessable verification token',
 authenticated:false,
 inputSchema:z.object({token:z.string().uuid()}),
 outputSchema:z.object({verified:z.boolean(),certificate:z.object({
   certificateNumber:z.number(),registrationNumber:z.string(),studentName:z.string(),issuerName:z.string(),
   reading:z.string(),completionDate:z.string(),publishedAt:z.string(),
 }).nullable()}),
 execute:async({input})=>{
  const {records:found}=await zite.certificates.findAll({filters:{verificationToken:input.token},limit:3});
  const cert=found.find(c=>c.verificationToken===input.token&&c.publicationStatus==='final');
  if(!cert)return {verified:false,certificate:null};
  const issuer=first(cert.shaykh);
  const {records:snapshots}=await zite.certificateSnapshots.findAll({filters:{certificateId:cert.id},limit:10});
  const snapshot=snapshots.find(s=>s.certificateId===cert.id&&s.ownerId===issuer&&!!s.issuedAt);
  if(!snapshot)return {verified:false,certificate:null};
  let printedName='';
  try{
   const data=JSON.parse(snapshot.formatting||'{}');
   printedName=data.footerProfile?.printedName||data.issuerDisplayName||'';
  }catch{}
  return {verified:true,certificate:{
   registrationNumber:cert.registrationNumber||'',
   certificateNumber:cert.shahadaNumber??cert.certificateNumber??0,
   studentName:cert.studentName||'',
   issuerName:printedName,
   reading:displayReadingLabel(snapshot.heading||''),
   completionDate:cert.completionDate||'',
   publishedAt:snapshot.issuedAt||''
  }};
 }
});
