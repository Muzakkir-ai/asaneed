import {readMatnPresentation,DEFAULT_MATN_HEADING,resolveMatnHeading} from '../lib/matnPresentation';
import {z} from 'zod';
import {createEndpoint} from 'zitejs/backend';
import {zite} from 'zitejs/db';
import {isAppAdmin} from '../lib/admin';
import {assembleMatnCertificate,defaultMatnWording,matnFormats,type MatnSource} from '../lib/matnCertificate';
import {ensureCertificateRegistration} from '../lib/certificateRegistration';
import {nextShahadaNumber} from '../lib/shahadaSequence';
import {context as requestContext} from '../compat/context';
const option=z.object({id:z.string(),name:z.string(),category:z.string(),sanadText:z.string(),wordingText:z.string()});
export default createEndpoint({
 description:'Create matn ijazah certificates from an explicitly selected issuer-owned matn',authenticated:true,
 inputSchema:z.object({action:z.enum(['options','save']),issuerKey:z.string().regex(/^(?:user|guest):[^:]+$/),matnId:z.string().optional(),id:z.string().optional(),studentName:z.string().trim().min(2).max(300).optional(),completionDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),hijriDayOffset:z.number().int().min(-2).max(2).default(0),notes:z.string().max(10000).default('')}),
 outputSchema:z.object({options:z.array(option),certificateId:z.string().optional()}),
 execute:async({input,context})=>{
  const admin=await isAppAdmin(context.user.email);
  const guestId=input.issuerKey.startsWith('guest:')?input.issuerKey.slice(6):'';
  const uid=input.issuerKey.startsWith('user:')?input.issuerKey.slice(5):context.user.id;
  if(!guestId&&uid!==context.user.id)throw Error('المُجيز خارج المساحة المحددة');
  if(guestId&&!admin)throw Error('إصدار شهادة لشيخ إضافي متاح للإدارة');
  let sources:(MatnSource & {id:string;category:string})[]=[];
  if(guestId){
   const guest=await zite.additionalShaykhs.findOne({id:guestId}).catch(()=>null);
   if(!guest)throw Error('الشيخ غير متاح');
   const {records}=await zite.additionalShaykhExtensions.findAll({filters:{shaykhId:guestId},limit:100});
   const parsed=z.array(z.object({catalogId:z.string().uuid().optional(),name:z.string(),category:z.string().default(''),sanadText:z.string(),wordingText:z.string().default(''),introductionId:z.string().default(''),conclusionId:z.string().default(''),sanadFormatting:z.string().default('')})).parse(JSON.parse(records.find(r=>r.shaykhId===guestId)?.mutoonJson||'[]'));
   sources=parsed.map((m,i)=>({...m,id:String(i)}));
  }else{
   const {records}=await zite.mutoonHoldings.findAll({filters:{ownerId:uid},limit:2000});
   sources=records.filter(m=>m.ownerId===uid).map(m=>({...m,name:m.name||'',category:m.category||'',sanadText:m.sanadText||''}));
  }
  const options=sources.filter(m=>m.name.trim()&&m.sanadText.trim()).map(m=>({id:m.id,name:m.name,category:m.category,sanadText:m.sanadText,wordingText:m.wordingText||''}));
  if(input.action==='options')return {options};
  if(!input.studentName||!input.completionDate)throw Error('اختر الطالب وتاريخ الإتمام');
  if(!Number.isFinite(Date.parse(input.completionDate))||new Date(input.completionDate).toISOString().slice(0,10)!==input.completionDate)throw Error('تاريخ الإتمام غير صحيح');
  if(input.id){
   const existing=await zite.certificates.findOne({id:input.id}).catch(()=>null);
   if(!existing||existing.publicationStatus!=='draft')throw Error('المسودة غير متاحة');
   const owner=Array.isArray(existing.shaykh)?existing.shaykh[0]:existing.shaykh;
   if(guestId?existing.additionalShaykh!==guestId:!!existing.additionalShaykh||owner!==uid)throw Error('لا يمكن تغيير المُجيز');
   const sid=Array.isArray(existing.sanad)?existing.sanad[0]:existing.sanad;
   const sanad=await zite.asaneed.findOne({id:sid||''});
   if(!sanad?.matnCode)throw Error('هذه ليست شهادة متن');
   await zite.certificates.update({id:existing.id,record:{studentName:input.studentName,completionDate:input.completionDate,hijriDayOffset:input.hijriDayOffset,notes:input.notes}});
   await ensureCertificateRegistration(existing.id);
   return {options,certificateId:existing.id};
  }
  const source=sources.find(m=>m.id===input.matnId);
  if(!source||!source.sanadText.trim())throw Error('اختر متنًا محفوظًا بسند كامل لهذا المُجيز');
  let catalog:any=null;
  if(source.catalogId){const {data,error}=await requestContext().client.from('matn_catalog').select('*').eq('id',source.catalogId).single();if(error||!data||data.status!=='published')throw Error('المتن المشترك غير متاح للإصدار');catalog=data;source.name=data.title;}
  const {records:templates}=await zite.mutoonTextTemplates.findAll({limit:2000});
  const intro=templates.find(t=>t.id===source.introductionId),end=templates.find(t=>t.id===source.conclusionId);
  if(source.introductionId&&!intro||source.conclusionId&&!end)throw Error('نموذج المقدمة أو الخاتمة غير متاح');
  const client=requestContext().client;
  let issuerId=guestId;
  if(!issuerId){
   const {data,error}=await client.from('issuers').select('id,print_profile');if(error)throw error;
   issuerId=(data||[]).find((i:any)=>i.print_profile?.personalAccount===requestContext().scope?.accountId)?.id||'';
   if(!issuerId)throw Error('أكمل ملف المُجيز الشخصي أولًا');
  }
  const {data:code,error}=await client.rpc('register_matn_subject',{target_issuer:issuerId,matn_name:source.name});if(error)throw error;
  const chain=assembleMatnCertificate(source,intro?.body||'',end?.body||'');
  const document={editorVersion:2,sourceMatn:{id:source.id,ownerId:uid,guestId,name:source.name},headingArtworkNumber:catalog?.artwork_number||undefined,heading:resolveMatnHeading(catalog?.heading??DEFAULT_MATN_HEADING,readMatnPresentation(source.sanadFormatting).heading??null,undefined,{}),bookName:source.name,intro:intro?.body||'',wording:source.wordingText?.trim()||defaultMatnWording,sanad:source.sanadText,end:end?.body||'',formats:matnFormats(source.sanadFormatting),introFormats:matnFormats(intro?.formatting),endFormats:matnFormats(end?.formatting)};
  const formatting=JSON.stringify({document,formats:source.sanadFormatting||'[]',intro:intro?.body||'',introFormats:intro?.formatting||'[]',end:end?.body||'',endFormats:end?.formatting||'[]'});
  const sanad=await zite.asaneed.create({record:{title:source.name,chain,shaykh:uid,additionalShaykh:guestId,matnCode:String(code),matnName:source.name,matnFormatting:formatting}});
  let certificateId='';
  try{
   const created=await zite.certificates.create({record:{studentName:input.studentName,completionDate:input.completionDate,hijriDayOffset:input.hijriDayOffset,notes:input.notes,sanad:sanad.id,shaykh:uid,additionalShaykh:guestId,shahadaNumber:await nextShahadaNumber(),publicationStatus:'draft'}});
   certificateId=created.id;await ensureCertificateRegistration(created.id);
   return {options,certificateId:created.id};
  }catch(e){if(certificateId)await zite.certificates.delete({id:certificateId}).catch(()=>{});await zite.asaneed.delete({id:sanad.id}).catch(()=>{});throw e;}
 }
});
