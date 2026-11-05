import {resolveHoldingSanad} from '../lib/assembleHoldingIjazah';
import {z} from 'zod';
import {createEndpoint} from 'zitejs/backend';
import {zite} from 'zitejs/db';
import {isAppAdmin} from '../lib/admin';
import {QURRA} from '../lib/qurra';
import {reachesJunction} from '../lib/personalSanadValidation';

const unified=z.object({version:z.literal(1),routeId:z.string().uuid(),prefixPersonIds:z.array(z.string().uuid()).max(100).optional(),prefix:z.string().trim().min(25).max(10000)});
const record=z.object({personalPersonIds:z.array(z.string().uuid()).max(100).optional(),unifiedSanad:unified.nullable().optional(),bookAuthor:z.string(),routeSource:z.string(),tariqNumber:z.string(),tariqName:z.string(),id:z.string(),qariId:z.string(),rawi:z.string(),sanadText:z.string(),junction:z.enum(['ubaydi','jazari'])});
export default createEndpoint({
 authenticated:true,
 description:'Admin-managed separate personal sanad for each additional sheikh qiraah and riwayah',
 inputSchema:z.object({personalPersonIds:z.array(z.string().uuid()).max(100).optional(),unifiedSanad:unified.nullable().optional(),action:z.enum(['list','save']).default('list'),shaykhId:z.string(),bookAuthor:z.string().trim().max(250).optional(),routeSource:z.string().trim().max(250).optional(),tariqNumber:z.string().regex(/^[0-9]{2,4}$/).or(z.literal('')).optional(),tariqName:z.string().trim().max(200).optional(),qariId:z.string().optional(),rawi:z.string().optional(),sanadText:z.string().optional(),junction:z.enum(['ubaydi','jazari']).optional()}),
 outputSchema:z.object({sanads:z.array(record)}),
 execute:async({input,context})=>{
  if(!await isAppAdmin(context.user.email))throw new Error('Permission denied');
  const shaykh=await zite.additionalShaykhs.findOne({id:input.shaykhId}).catch(()=>null);
  if(!shaykh)throw new Error('Sheikh not found');
  const {records:all}=await zite.additionalShaykhReadingSanads.findAll({filters:{shaykhId:shaykh.id},limit:2000});
  if(input.action==='save'){
   const q=QURRA.find(q=>q.id===input.qariId);
   if(!q||!input.rawi||!q.rawis.includes(input.rawi as never))throw new Error('Invalid reading');
   const selections=JSON.parse(shaykh.readingsJson||'[]') as {qariId:string;rawi:string}[];
   if(!selections.some(x=>x.qariId===input.qariId&&x.rawi===input.rawi))throw new Error('Save this riwayah in the sheikh profile first');
   const tariqNumber=input.tariqNumber||'',tariqName=input.tariqName||'';
   if(Boolean(tariqNumber)!==Boolean(tariqName))throw Error('أدخل رقم الطريق واسمه معًا');
   const sanadText=(input.sanadText||'').trim(),junction=input.junction||'ubaydi';
   if(tariqNumber?sanadText.length<100:!reachesJunction({personalChain:sanadText,junction}))throw new Error('Complete the sanad up to its selected junction');
   const existing=all.find(x=>x.qariId===input.qariId&&x.rawi===input.rawi&&(x.tariqNumber||'')===tariqNumber);
   if(input.unifiedSanad){const expected=await resolveHoldingSanad({qariId:input.qariId!,rawi:input.rawi,personalChain:sanadText,junction,unifiedSanad:input.unifiedSanad});if(expected!==sanadText)throw Error('تغير الطريق بعد المعاينة؛ أعد اختياره');}
   const row={personalPersonIds:input.personalPersonIds??(sanadText!==existing?.sanadText?[]:existing?.personalPersonIds||[]),...(input.unifiedSanad!==undefined?{unifiedSanad:input.unifiedSanad}:{}),...(input.unifiedSanad===undefined&&existing?.unifiedSanad&&sanadText!==existing.sanadText?{unifiedSanad:null}:{}),bookAuthor:input.bookAuthor||'',routeSource:input.routeSource||'',tariqNumber,tariqName,name:q.reading+' — '+input.rawi,shaykhId:shaykh.id,qariId:input.qariId,rawi:input.rawi,sanadText,junction};
   if(existing)await zite.additionalShaykhReadingSanads.update({id:existing.id,record:row});
   else await zite.additionalShaykhReadingSanads.create({record:row});
  }
  const {records:result}=await zite.additionalShaykhReadingSanads.findAll({filters:{shaykhId:shaykh.id},limit:2000});
  return {sanads:result.filter(x=>x.shaykhId===shaykh.id).map(x=>({personalPersonIds:x.personalPersonIds||[],unifiedSanad:x.unifiedSanad||null,bookAuthor:x.bookAuthor||'',routeSource:x.routeSource||'',tariqNumber:x.tariqNumber||'',tariqName:x.tariqName||'',id:x.id,qariId:x.qariId||'',rawi:x.rawi||'',sanadText:x.sanadText||'',junction:x.junction==='jazari'?'jazari' as const:'ubaydi' as const}))};
 }
});
