import {z} from 'zod';
import {createHash} from 'node:crypto';
import {createEndpoint} from 'zitejs/backend';
import {zite} from 'zitejs/db';
import {extractTeacherTransmission,receivedPersonalChain} from '../lib/receivedTransmission';
import {readingIdentityFromHeading} from '../lib/riwayahSvgHeading';
import {arabicSearchKey} from '../lib/arabicSearch';
import {QURRA,displayRawi,routeFor} from '../lib/qurra';
export default createEndpoint({
 description:'Review and save an editable personal sanad derived from an owned finalized received certificate',authenticated:true,
 inputSchema:z.object({action:z.enum(['preview','save']),certificateId:z.string().uuid(),personalChain:z.string().trim().min(100).max(30000).optional(),confirmed:z.boolean().optional()}),
 outputSchema:z.object({personalChain:z.string(),heading:z.string(),teacherName:z.string(),registrationNumber:z.string(),holdingId:z.string(),created:z.boolean()}),
 execute:async({input,context})=>{
  if(context.account.role==='student'||context.scope?.inspection||context.scope?.readOnly)throw Error('هذه العملية لصاحب حساب الشيخ في مساحته الشخصية');
  const {client}=context;
  const {data:account,error:accountError}=await client.from('accounts').select('id').eq('auth_user_id',context.user.id).single();
  if(accountError||!account)throw Error('الحساب غير متاح');
  const {data:certificate,error}=await client.from('certificates').select('id,status,student_id,recipient_account_id,registration_number').eq('id',input.certificateId).single();
  if(error||!certificate||certificate.status!=='finalized')throw Error('اختر شهادة نهائية مستلمة في حسابك');
  if(certificate.recipient_account_id!==account.id){
   if(certificate.recipient_account_id)throw Error('الشهادة مرتبطة بحساب آخر');
   const {data:link}=await client.from('student_accounts').select('account_id').eq('student_id',certificate.student_id).eq('account_id',account.id).maybeSingle();
   if(!link)throw Error('الشهادة ليست من شهاداتك المستلمة');
  }
  const {data:snapshot,error:snapshotError}=await client.from('certificate_snapshots').select('content').eq('certificate_id',certificate.id).single();
  if(snapshotError||!snapshot)throw Error('لا توجد نسخة نهائية محفوظة');
  const content=snapshot.content as {chain?:string;heading?:string;formatting?:string};
  const formatting=JSON.parse(content.formatting||'{}');
  const identity=readingIdentityFromHeading(content.heading||'');if(!identity)throw Error('تعذر تحديد القراءة والرواية من الشهادة');
  const storedRoute=arabicSearchKey(content.heading||'').match(/من طريق(?:ي|ين)? (.+)$/u)?.[1];
  const defaultRoute=arabicSearchKey(routeFor([identity.qariId])).replace(/^من طريق(?:ي|ين)? /u,'');
  if(storedRoute&&storedRoute!==defaultRoute&&!formatting.transmission?.tariqNumber)throw Error('بيانات هذا الطريق غير محفوظة في الشهادة القديمة؛ أضفه يدويًا مع رقم الطريق الصحيح');
  const teacherName=String(formatting.footerProfile?.printedName||formatting.issuerDisplayName||'').trim();if(!teacherName)throw Error('اسم المجيز غير محفوظ في الشهادة');
  const {records:sections}=await zite.sanadSections.findAll({limit:2000});
  const teacherChain=formatting.transmission?.chain||extractTeacherTransmission(content.chain||'','',sections.filter(s=>s.sectionType==='conclusion').map(s=>s.body||''));
  const suggested=receivedPersonalChain(teacherName,teacherChain);
  const {records:holdings}=await zite.ijazahHoldings.findAll({filters:{ownerId:context.user.id},limit:2000});
  const existing=holdings.find(h=>h.sourceCertificateId===certificate.id);
  let holdingId=existing?.id||'',created=false;
  if(input.action==='save'&&!existing){
   if(!input.confirmed||!input.personalChain)throw Error('راجع السند وأكد حفظ النسخة القابلة للتعديل');
   const q=QURRA.find(q=>q.id===identity.qariId)!;
   const record=await zite.ijazahHoldings.create({record:{ownerId:context.user.id,qariId:identity.qariId,rawi:identity.rawi,name:`رواية ${displayRawi(identity.qariId,identity.rawi)} عن ${q.imam} — عن ${teacherName}`,personalChain:input.personalChain,chainMode:'complete',junction:'jazari',personalSanadConfirmed:true,tariqNumber:formatting.transmission?.tariqNumber||'',tariqName:formatting.transmission?.tariqName||'',introductionId:sections.find(s=>s.sectionType==='introduction')?.id||'',wordingId:sections.find(s=>s.title==='كلمات الإجازة'&&s.sectionType==='wording')?.id||'',formatting:'',sourceCertificateId:certificate.id,sourceTeacherName:teacherName,sourceRegistrationNumber:certificate.registration_number||'',sourceSnapshotHash:createHash('sha256').update(JSON.stringify(content)).digest('hex'),bookAuthor:formatting.routeEmphasis?.bookAuthor||'',routeSource:formatting.routeEmphasis?.routeSource||''}});
   holdingId=record.id;created=true;
  }
  return {personalChain:existing?.personalChain||suggested,heading:content.heading||'',teacherName,registrationNumber:certificate.registration_number||'',holdingId,created};
 }
});
