import {verifiedOnwardSources} from '../lib/verifiedOnwardSources';
import {composeReferencedPersonalSanad,personalSanadEndsAtSavedNarrator} from '../lib/sharedBridge';
import {guestKubraRoutes,usesLibraryKubra} from '../lib/guestKubra';
import {loadBuilderLibrary} from '../../lib/sanad-library';
import {context as requestContext} from '../compat/context';
import {usesSharedSughra} from '../lib/sharedShaykhSanad';
import {prepareSavedSanadPeople} from '../lib/preparedSanadPeople';
import {resolveHoldingSanad} from '../lib/assembleHoldingIjazah';
import {z} from 'zod';
import {createEndpoint} from 'zitejs/backend';
import {zite} from 'zitejs/db';
import {isAppAdmin} from '../lib/admin';
import {QURRA} from '../lib/qurra';
import {reachesJunction} from '../lib/personalSanadValidation';

const unified=z.object({version:z.literal(1),routeId:z.string().uuid(),prefixPersonIds:z.array(z.string().uuid()).max(100).optional(),prefix:z.string().trim().min(25).max(10000)});
const preparation=z.object({version:z.literal(1),tokens:z.array(z.object({before:z.string(),name:z.string()})),suffix:z.string(),reviewed:z.boolean()});
const record=z.object({continuationId:z.string().uuid().nullable().optional(),variantName:z.string().optional(),preparedPeople:preparation.nullable().optional(),personalPersonIds:z.array(z.string().uuid()).max(100).optional(),unifiedSanad:unified.nullable().optional(),bookAuthor:z.string(),routeSource:z.string(),tariqNumber:z.string(),tariqName:z.string(),id:z.string(),qariId:z.string(),rawi:z.string(),sanadText:z.string(),junction:z.enum(['ubaydi','jazari'])});
export default createEndpoint({
 authenticated:true,
 description:'Admin-managed separate personal sanad for each additional sheikh qiraah and riwayah',
 inputSchema:z.object({continuationId:z.string().uuid().nullable().optional(),variantId:z.string().uuid().optional(),variantName:z.string().trim().min(1).max(80).optional(),personalPersonIds:z.array(z.string().uuid()).max(100).optional(),unifiedSanad:unified.nullable().optional(),action:z.enum(['list','save']).default('list'),shaykhId:z.string(),bookAuthor:z.string().trim().max(250).optional(),routeSource:z.string().trim().max(250).optional(),tariqNumber:z.string().regex(/^[0-9]{2,4}$/).or(z.literal('')).optional(),tariqName:z.string().trim().max(200).optional(),qariId:z.string().optional(),rawi:z.string().optional(),sanadText:z.string().optional(),junction:z.enum(['ubaydi','jazari']).optional()}),
 outputSchema:z.object({sanads:z.array(record)}),
 execute:async({input,context})=>{
  if(!await isAppAdmin(context.user.email))throw new Error('Permission denied');
  const shaykh=await zite.additionalShaykhs.findOne({id:input.shaykhId}).catch(()=>null);
  if(!shaykh)throw new Error('Sheikh not found');
  const {records:all}=await zite.additionalShaykhReadingSanads.findAll({filters:{shaykhId:shaykh.id},limit:2000});
  if(input.action==='save'){
   if(!input.variantName&&usesSharedSughra(shaykh,input.tariqNumber))throw Error('حرر السند المشترك من الصفحة الأولى للشيخ، أو أوقف استخدامه لجميع الروايات أولًا');
   const q=QURRA.find(q=>q.id===input.qariId);
   if(!q||!input.rawi||!q.rawis.includes(input.rawi as never))throw new Error('Invalid reading');
   const selections=JSON.parse(shaykh.readingsJson||'[]') as {qariId:string;rawi:string}[];
   const allowed=selections.some(x=>x.qariId===input.qariId&&x.rawi===input.rawi);
   if(!allowed&&!(input.variantName&&usesLibraryKubra(shaykh)&&guestKubraRoutes(await loadBuilderLibrary(requestContext().client)).some(r=>r.qariId===input.qariId&&r.rawi===input.rawi)))throw Error('أضف الرواية إلى إجازات الشيخ أولًا');
   if((input.variantId&&!input.variantName)||(input.variantName&&(input.tariqNumber||input.unifiedSanad)))throw Error('احفظ السند الشخصي مستقلًا عن الطريق');
   const tariqNumber=input.tariqNumber||'',tariqName=input.tariqName||'';
   if(Boolean(tariqNumber)!==Boolean(tariqName))throw Error('أدخل رقم الطريق واسمه معًا');
   const sanadText=(input.sanadText||'').trim(),junction=input.junction||'ubaydi';

   const matching=all.filter(x=>x.shaykhId===shaykh.id&&x.qariId===input.qariId&&x.rawi===input.rawi&&(x.tariqNumber||'')===tariqNumber);
   const existing=input.variantName?matching.find(x=>x.variantName&&x.id===input.variantId):matching.find(x=>!x.variantName);
   const continuationId=input.continuationId===undefined?existing?.continuationId:input.continuationId;
   if(continuationId){
    if(tariqNumber||input.unifiedSanad)throw Error('احفظ التتمة مستقلة عن الطريق');
    const library=await loadBuilderLibrary(requestContext().client);
    composeReferencedPersonalSanad(sanadText,input.personalPersonIds??existing?.personalPersonIds??[],verifiedOnwardSources(library,{qariId:input.qariId,rawi:input.rawi,shaykhId:shaykh.id}),continuationId);
   }else if(!tariqNumber&&input.continuationId===null&&input.personalPersonIds?.length){
    if(!personalSanadEndsAtSavedNarrator(sanadText,input.personalPersonIds))throw Error('راجع الرواة ونقطة الالتقاء');
   }else if(tariqNumber?sanadText.length<100:!reachesJunction({personalChain:sanadText,junction}))throw Error('Complete the sanad up to its selected junction');
   if(input.variantId&&!existing)throw Error('السند الشخصي غير متاح لهذه الرواية');
   if(input.unifiedSanad){const expected=await resolveHoldingSanad({qariId:input.qariId!,rawi:input.rawi,personalChain:sanadText,junction,unifiedSanad:input.unifiedSanad});if(expected!==sanadText)throw Error('تغير الطريق بعد المعاينة؛ أعد اختياره');}
   const row={...(input.continuationId===undefined?{}:{continuationId}),...(input.variantName?{variantName:input.variantName}:{}),...(existing?.prepareNarratorBoxes?{personalPeopleReviewed:!!input.personalPersonIds?.length}:{}),personalPersonIds:input.personalPersonIds??(sanadText!==existing?.sanadText?[]:existing?.personalPersonIds||[]),...(input.unifiedSanad!==undefined?{unifiedSanad:input.unifiedSanad}:{}),...(input.unifiedSanad===undefined&&existing?.unifiedSanad&&sanadText!==existing.sanadText?{unifiedSanad:null}:{}),bookAuthor:input.bookAuthor||'',routeSource:input.routeSource||'',tariqNumber,tariqName,name:q.reading+' — '+input.rawi,shaykhId:shaykh.id,qariId:input.qariId,rawi:input.rawi,sanadText,junction};
   if(existing)await zite.additionalShaykhReadingSanads.update({id:existing.id,record:row});
   else await zite.additionalShaykhReadingSanads.create({record:row});
  }
  const {records:result}=await zite.additionalShaykhReadingSanads.findAll({filters:{shaykhId:shaykh.id},limit:2000});
  return {sanads:result.filter(x=>x.shaykhId===shaykh.id).map(x=>({continuationId:x.continuationId,variantName:x.variantName,preparedPeople:x.prepareNarratorBoxes?prepareSavedSanadPeople(x.sanadText||'',x.personalPeopleReviewed===true):null,personalPersonIds:x.personalPersonIds||[],unifiedSanad:x.unifiedSanad||null,bookAuthor:x.bookAuthor||'',routeSource:x.routeSource||'',tariqNumber:x.tariqNumber||'',tariqName:x.tariqName||'',id:x.id,qariId:x.qariId||'',rawi:x.rawi||'',sanadText:x.sanadText||'',junction:x.junction==='jazari'?'jazari' as const:'ubaydi' as const}))};
 }
});
