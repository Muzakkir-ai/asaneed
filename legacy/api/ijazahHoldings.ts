import {assembleHoldingIjazah,resolveHoldingSanad} from '../lib/assembleHoldingIjazah';
import {isAppAdmin} from '../lib/admin';
import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { QURRA,displayRawi } from '../lib/qurra';
import {sectionFormatting,formattingForSavedText} from '../lib/sanadFormatting';
import {reachesJunction} from '../lib/personalSanadValidation';
const unified=z.object({version:z.literal(1),routeId:z.string().uuid(),prefixPersonIds:z.array(z.string().uuid()).max(100).optional(),prefix:z.string().trim().min(25).max(10000)});
const item = z.object({shortName:z.string(),personalPersonIds:z.array(z.string().uuid()).max(100).optional(),unifiedSanad:unified.nullable().optional(), chainMode:z.enum(['junction','complete']),sourceCertificateId:z.string(),sourceTeacherName:z.string(),bookAuthor:z.string(),routeSource:z.string(),tariqNumber:z.string(),tariqName:z.string(),id:z.string(),ownerId:z.string(),name:z.string(),qariId:z.string(),rawi:z.string(),personalChain:z.string(),junction:z.string(),introductionId:z.string(),wordingId:z.string(),formatting:z.string(),personalSanadConfirmed:z.boolean() });
export default createEndpoint({
  description:'List and manage a signed-in teacher’s held ijazahs and personal sanad up to their chosen junction',
  authenticated:true,
  inputSchema:z.object({personalPersonIds:z.array(z.string().uuid()).max(100).optional(),unifiedSanad:unified.nullable().optional(),chainMode:z.enum(['junction','complete']).optional(),shortName:z.string().trim().max(80).optional(),mergeIds:z.array(z.string().uuid()).min(2).max(5).optional(),action:z.enum(['list','save','delete','deleteAll','mergePreview']).default('list'),id:z.string().optional(),bookAuthor:z.string().trim().max(250).optional(),routeSource:z.string().trim().max(250).optional(),tariqNumber:z.string().regex(/^[0-9]{2,4}$/).or(z.literal('')).optional(),tariqName:z.string().trim().max(200).optional(),qariId:z.string().optional(),rawi:z.string().optional(),personalChain:z.string().optional(),junction:z.enum(['ubaydi','jazari']).optional(),introductionId:z.string().optional(),wordingId:z.string().optional(),formatting:sectionFormatting.optional(),personalSanadConfirmed:z.boolean().optional(),ownerId:z.string().optional()}),
  outputSchema:z.object({holdings:z.array(item),merged:z.object({personalChain:z.string(),qariId:z.string(),rawi:z.string(),tariqNumber:z.string(),tariqName:z.string(),introductionId:z.string(),wordingId:z.string(),bookAuthor:z.string(),routeSource:z.string(),shortName:z.string()}).optional()}),
  execute:async({input,context})=>{
    const uid=context.user.id;
    const admin=(await isAppAdmin(context.user.email));
    const owner=(admin&&input.action==='list'&&input.ownerId)?input.ownerId:uid;
    if(input.action==='mergePreview'){
      if(!input.mergeIds||new Set(input.mergeIds).size!==input.mergeIds.length)throw Error('اختر سندين مختلفين على الأقل');
      const {records}=await zite.ijazahHoldings.findAll({filters:{ownerId:uid},limit:2000});
      const selected=input.mergeIds.map(id=>records.find(h=>h.id===id&&h.ownerId===uid));
      if(selected.some(h=>!h))throw Error('أحد الأسانيد غير متاح');
      const first=selected[0]!;
      if(!first.rawi||selected.some(h=>h!.qariId!==first.qariId||h!.rawi!==first.rawi||(h!.tariqNumber||'')!==(first.tariqNumber||'')||(h!.tariqName||'')!==(first.tariqName||'')))throw Error('ادمج أسانيد الرواية والطريق نفسيهما فقط');
      const {records:sections}=await zite.sanadSections.findAll({limit:2000});
      const paths=await Promise.all(selected.map(async holding=>{
        const h=holding!;const result=await assembleHoldingIjazah({...h,qariId:h.qariId||'',personalChain:h.personalChain||'',junction:h.junction||'ubaydi',introductionId:'',wordingId:''},sections.filter(s=>s.sectionType!=='conclusion').map(s=>({id:s.id,title:s.title||'',body:s.body||'',sectionType:s.sectionType||''})));
        if(result.missing.length)throw Error('أكمل السند قبل الدمج: '+result.missing.join('، '));
        return result.chain.replace(/^【بيان القراءة:[^】]*】\n/u,'');
      }));
      const personalChain=paths.join('\n\n(ح)\n\n');if(personalChain.length>30000)throw Error('السند المدمج أطول من الحد المتاح؛ اختر أسانيد أقل');
      return {holdings:[],merged:{personalChain,qariId:first.qariId||'',rawi:first.rawi,tariqNumber:first.tariqNumber||'',tariqName:first.tariqName||'',introductionId:first.introductionId||'',wordingId:first.wordingId||'',bookAuthor:first.bookAuthor||'',routeSource:first.routeSource||'',shortName:selected.map(h=>h!.shortName||h!.sourceTeacherName||'سند').join(' + ').slice(0,80)}};
    }
    if(input.action==='deleteAll'){
      // All mutations are scoped to the authenticated account. Retain issued
      // certificate snapshots and any sanad records referenced by a certificate.
      const {records:mine}=await zite.ijazahHoldings.findAll({filters:{ownerId:uid},limit:2000});
      const {records:prepared}=await zite.preparedIjazahs.findAll({filters:{ownerId:uid},limit:2000});
      const {records:certs}=await zite.certificates.findAll({filters:{shaykh:uid},limit:2000});
      const referenced=new Set(certs.map(c=>Array.isArray(c.sanad)?c.sanad[0]:c.sanad).filter(Boolean));
      const {records:sanads}=await zite.asaneed.findAll({filters:{shaykh:uid},limit:2000});
      for(const record of mine)await zite.ijazahHoldings.delete({id:record.id});
      for(const record of prepared)await zite.preparedIjazahs.delete({id:record.id});
      for(const record of sanads){const sanadOwner=Array.isArray(record.shaykh)?record.shaykh[0]:record.shaykh;if(sanadOwner===uid&&!referenced.has(record.id))await zite.asaneed.delete({id:record.id});}
    }
    if(input.action==='save'||input.action==='delete'){
      const existing=input.id?await zite.ijazahHoldings.findOne({id:input.id}).catch(()=>null):undefined;
      if(input.id&&(!existing||existing.ownerId!==uid)) throw new ZiteError({code:'NOT_FOUND',message:'Holding not found',userFacingMessage:'الإجازة غير متاحة'});
      if(input.action==='delete'){
        if(!existing)throw new Error('Missing ijazah');
        await zite.ijazahHoldings.delete({id:existing.id});
      }else{
        const chainMode=input.chainMode??existing?.chainMode??'junction';
        if(!existing&&chainMode==='junction'&&!input.unifiedSanad)throw Error('اختر طريقًا محفوظًا معتمدًا؛ الإدخال اليدوي المتقدم يتطلب سندًا كاملًا');
        const tariqNumber=input.tariqNumber??existing?.tariqNumber??'';
        const tariqName=input.tariqName??existing?.tariqName??'';
        if(Boolean(tariqNumber)!==Boolean(tariqName))throw Error('أدخل رقم الطريق واسمه معًا');
        const qariId=input.qariId||existing?.qariId||'';
        const rawi=input.rawi??existing?.rawi??'';
        const q=QURRA.find(q=>q.id===qariId);
        if(!q||rawi&&!q.rawis.some(x=>x===rawi))throw new Error('Invalid imam or narrator');
        const personalChain=(input.personalChain??existing?.personalChain??'').trim();
        if(!personalChain||personalChain.length>30000)throw new Error('Personal sanad is required (max 30000 characters)');
        const junction=input.junction||existing?.junction||'ubaydi';
        if((chainMode==='complete'||tariqNumber)?personalChain.length<100:!reachesJunction({personalChain,junction}))throw new Error('يجب أن يصل السند إلى نقطة الالتقاء المختارة: إبراهيم العُبيدي أو الإمام ابن الجزري');
        const sections=await zite.sanadSections.findAll({limit:2000});
        const introductionId=input.introductionId??existing?.introductionId??'';
        const wordingId=input.wordingId??existing?.wordingId??'';
        if(introductionId&&!sections.records.some(s=>s.id===introductionId&&s.sectionType==='introduction'))throw new Error('Invalid introduction');
        if(wordingId&&!sections.records.some(s=>s.id===wordingId&&s.sectionType==='wording'))throw new Error('Invalid ijazah wording');
        if(input.unifiedSanad){const expected=await resolveHoldingSanad({qariId,rawi,personalChain,junction,unifiedSanad:input.unifiedSanad});if(expected!==personalChain)throw Error('تغير الطريق بعد المعاينة؛ أعد اختياره قبل الحفظ');}
        const shortName=input.shortName??existing?.shortName??'';
        const record={personalPersonIds:input.personalPersonIds??(input.personalChain!==undefined&&input.personalChain.trim()!==existing?.personalChain?[]:existing?.personalPersonIds||[]),shortName,...(input.unifiedSanad!==undefined?{unifiedSanad:input.unifiedSanad}:{}),...(input.unifiedSanad===undefined&&existing?.unifiedSanad&&((input.personalChain!==undefined&&input.personalChain.trim()!==existing.personalChain)||qariId!==existing.qariId||rawi!==existing.rawi)?{unifiedSanad:null}:{}),chainMode,bookAuthor:input.bookAuthor??existing?.bookAuthor??'',routeSource:input.routeSource??existing?.routeSource??'',tariqNumber,tariqName,personalSanadConfirmed:input.personalSanadConfirmed??existing?.personalSanadConfirmed??false,introductionId,wordingId,formatting:input.formatting?JSON.stringify(formattingForSavedText(personalChain,input.formatting)):existing?.formatting||'',name:(rawi?`رواية ${displayRawi(q.id,rawi)} عن ${q.imam}`:`قراءة ${q.reading}`)+(tariqName?' — '+tariqName:''),ownerId:uid,qariId,rawi,personalChain,junction};
        if(existing)await zite.ijazahHoldings.update({id:existing.id,record});
        else {
          const {records}=await zite.ijazahHoldings.findAll({filters:{ownerId:uid},limit:2000});
          if(records.some(r=>r.qariId===qariId&&(r.rawi||'')===rawi&&(r.tariqNumber||'')===tariqNumber&&(r.shortName||'')===shortName))throw new Error('لهذه الرواية سند بالاسم المختصر نفسه؛ اكتب اسماً مميزاً للسند الجديد');
          await zite.ijazahHoldings.create({record});
        }
      }
    }
    const {records}=await zite.ijazahHoldings.findAll({filters:{ownerId:owner},limit:2000});
    return {holdings:records.filter(x=>x.ownerId===owner).map(x=>({personalPersonIds:x.personalPersonIds||[],shortName:x.shortName||'',unifiedSanad:x.unifiedSanad||null,chainMode:x.chainMode||'junction',sourceCertificateId:x.sourceCertificateId||'',sourceTeacherName:x.sourceTeacherName||'',bookAuthor:x.bookAuthor||'',routeSource:x.routeSource||'',tariqNumber:x.tariqNumber||'',tariqName:x.tariqName||'',id:x.id,ownerId:x.ownerId||'',name:x.name||'',qariId:x.qariId||'',rawi:x.rawi||'',personalChain:x.personalChain||'',junction:x.junction||'ubaydi',introductionId:x.introductionId||'',wordingId:x.wordingId||'',formatting:x.formatting||'',personalSanadConfirmed:(x as typeof x & {personalSanadConfirmed?:boolean}).personalSanadConfirmed===true}))};
  },
});
