import {isAppAdmin} from '../lib/admin';
import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { QURRA,displayRawi } from '../lib/qurra';
import {sectionFormatting} from '../lib/sanadFormatting';
import {reachesJunction} from '../lib/personalSanadValidation';
const item = z.object({ bookAuthor:z.string(),routeSource:z.string(),tariqNumber:z.string(),tariqName:z.string(),id:z.string(),ownerId:z.string(),name:z.string(),qariId:z.string(),rawi:z.string(),personalChain:z.string(),junction:z.string(),introductionId:z.string(),wordingId:z.string(),formatting:z.string(),personalSanadConfirmed:z.boolean() });
export default createEndpoint({
  description:'List and manage a signed-in teacher’s held ijazahs and personal sanad up to their chosen junction',
  authenticated:true,
  inputSchema:z.object({action:z.enum(['list','save','delete','deleteAll']).default('list'),id:z.string().optional(),bookAuthor:z.string().trim().max(250).optional(),routeSource:z.string().trim().max(250).optional(),tariqNumber:z.string().regex(/^[0-9]{2,4}$/).or(z.literal('')).optional(),tariqName:z.string().trim().max(200).optional(),qariId:z.string().optional(),rawi:z.string().optional(),personalChain:z.string().optional(),junction:z.enum(['ubaydi','jazari']).optional(),introductionId:z.string().optional(),wordingId:z.string().optional(),formatting:sectionFormatting.optional(),personalSanadConfirmed:z.boolean().optional(),ownerId:z.string().optional()}),
  outputSchema:z.object({holdings:z.array(item)}),
  execute:async({input,context})=>{
    const uid=context.user.id;
    const admin=(await isAppAdmin(context.user.email));
    const owner=(admin&&input.action==='list'&&input.ownerId)?input.ownerId:uid;
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
        if(tariqNumber?personalChain.length<100:!reachesJunction({personalChain,junction}))throw new Error('يجب أن يصل السند إلى نقطة الالتقاء المختارة: إبراهيم العُبيدي أو الإمام ابن الجزري');
        const sections=await zite.sanadSections.findAll({limit:2000});
        const introductionId=input.introductionId??existing?.introductionId??'';
        const wordingId=input.wordingId??existing?.wordingId??'';
        if(introductionId&&!sections.records.some(s=>s.id===introductionId&&s.sectionType==='introduction'))throw new Error('Invalid introduction');
        if(wordingId&&!sections.records.some(s=>s.id===wordingId&&s.sectionType==='wording'))throw new Error('Invalid ijazah wording');
        const record={bookAuthor:input.bookAuthor??existing?.bookAuthor??'',routeSource:input.routeSource??existing?.routeSource??'',tariqNumber,tariqName,personalSanadConfirmed:input.personalSanadConfirmed??existing?.personalSanadConfirmed??false,introductionId,wordingId,formatting:input.formatting?JSON.stringify(input.formatting):existing?.formatting||'',name:(rawi?`رواية ${displayRawi(q.id,rawi)} عن ${q.imam}`:`قراءة ${q.reading}`)+(tariqName?' — '+tariqName:''),ownerId:uid,qariId,rawi,personalChain,junction};
        if(existing)await zite.ijazahHoldings.update({id:existing.id,record});
        else {
          const {records}=await zite.ijazahHoldings.findAll({filters:{ownerId:uid},limit:2000});
          if(records.some(r=>r.qariId===qariId&&(r.rawi||'')===rawi&&(r.tariqNumber||'')===tariqNumber))throw new Error('This ijazah is already saved; edit the existing one');
          await zite.ijazahHoldings.create({record});
        }
      }
    }
    const {records}=await zite.ijazahHoldings.findAll({filters:{ownerId:owner},limit:2000});
    return {holdings:records.filter(x=>x.ownerId===owner).map(x=>({bookAuthor:x.bookAuthor||'',routeSource:x.routeSource||'',tariqNumber:x.tariqNumber||'',tariqName:x.tariqName||'',id:x.id,ownerId:x.ownerId||'',name:x.name||'',qariId:x.qariId||'',rawi:x.rawi||'',personalChain:x.personalChain||'',junction:x.junction||'ubaydi',introductionId:x.introductionId||'',wordingId:x.wordingId||'',formatting:x.formatting||'',personalSanadConfirmed:(x as typeof x & {personalSanadConfirmed?:boolean}).personalSanadConfirmed===true}))};
  },
});
