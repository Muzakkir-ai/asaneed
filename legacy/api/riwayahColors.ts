import {isAppAdmin} from '../lib/admin';
import {z} from 'zod';
import {createEndpoint} from 'zitejs/backend';
import {zite} from 'zitejs/db';
import {QURRA} from '../lib/qurra';
const hex=z.string().regex(/^#[0-9a-fA-F]{6}$/);
const item=z.object({qariId:z.string(),rawi:z.string(),primaryColor:hex,secondaryColor:hex});
export default createEndpoint({
 description:'Read the shared riwayah certificate palettes and let only the administrator set each primary and secondary color',
 authenticated:true,
 inputSchema:z.object({action:z.enum(['list','save']).default('list'),entry:item.optional()}),
 outputSchema:z.object({entries:z.array(item)}),
 execute:async({input,context})=>{
  if(input.action==='save'){
   if(!(await isAppAdmin(context.user.email)))throw new Error('تعديل الألوان للمدير فقط');
   const entry=input.entry;
   if(!entry||!QURRA.some(q=>q.id===entry.qariId&&q.rawis.some(r=>r===entry.rawi)))throw new Error('رواية غير صحيحة');
   const {records}=await zite.riwayahPrintColors.findAll({filters:{qariId:entry.qariId},limit:100});
   const existing=records.find(x=>x.rawi===entry.rawi);
   if(existing)await zite.riwayahPrintColors.update({id:existing.id,record:{primaryColor:entry.primaryColor,secondaryColor:entry.secondaryColor}});
   else await zite.riwayahPrintColors.create({record:{name:entry.rawi+' — '+entry.qariId,...entry}});
  }
  const {records}=await zite.riwayahPrintColors.findAll({limit:2000});
  return {entries:records.filter(x=>QURRA.some(q=>q.id===x.qariId&&q.rawis.some(r=>r===x.rawi))).map(x=>({qariId:x.qariId||'',rawi:x.rawi||'',primaryColor:x.primaryColor||'#926e35',secondaryColor:x.secondaryColor||'#075f69'}))};
 }
});
