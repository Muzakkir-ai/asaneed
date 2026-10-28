import {z} from 'zod';
import {createEndpoint,ZiteError} from 'zitejs/backend';
import {zite} from 'zitejs/db';
const item=z.object({id:z.string(),name:z.string(),category:z.string(),sanadText:z.string(),wordingText:z.string(),introductionId:z.string(),conclusionId:z.string(),sanadFormatting:z.string()});
export default createEndpoint({
 description:'Manage personal scholarly-matn isnads with reusable certificate wording tokens',
 authenticated:true,
 inputSchema:z.object({action:z.enum(['list','save','delete']).default('list'),id:z.string().optional(),name:z.string().optional(),category:z.string().optional(),sanadText:z.string().optional(),wordingText:z.string().optional(),introductionId:z.string().optional(),conclusionId:z.string().optional(),sanadFormatting:z.string().optional()}),
 outputSchema:z.object({holdings:z.array(item)}),
 execute:async({input,context})=>{
  const ownerId=context.user.id;
  if(input.action!=='list'){
   const existing=input.id?await zite.mutoonHoldings.findOne({id:input.id}).catch(()=>null):null;
   if(input.id&&(!existing||existing.ownerId!==ownerId))throw new ZiteError({code:'NOT_FOUND',message:'Matn not found'});
   if(input.action==='delete'){if(!existing)throw new Error('Not found');await zite.mutoonHoldings.delete({id:existing.id});}
   if(input.action==='save'){
    const name=(input.name??existing?.name??'').trim(), category=(input.category??existing?.category??'').trim();
    const sanadText=(input.sanadText??existing?.sanadText??'').trim(),wordingText=(input.wordingText??existing?.wordingText??'').trim();
    if(!name||!category||!sanadText)throw new Error('Matn name, category and complete sanad are required');
    if(name.length>200||category.length>120||sanadText.length>60000||wordingText.length>30000)throw new Error('Text too long');
    const record={name,category,sanadText,wordingText,introductionId:input.introductionId??existing?.introductionId??'',conclusionId:input.conclusionId??existing?.conclusionId??'',sanadFormatting:input.sanadFormatting??existing?.sanadFormatting??'',ownerId,createdAtText:existing?.createdAtText||new Date().toISOString()};
    if(existing)await zite.mutoonHoldings.update({id:existing.id,record});
    else await zite.mutoonHoldings.create({record});
   }
  }
  const {records}=await zite.mutoonHoldings.findAll({filters:{ownerId},limit:2000});
  return {holdings:records.filter(r=>r.ownerId===ownerId).map(r=>({id:r.id,name:r.name||'',category:r.category||'',sanadText:r.sanadText||'',wordingText:r.wordingText||'',introductionId:r.introductionId||'',conclusionId:r.conclusionId||'',sanadFormatting:r.sanadFormatting||''}))};
 }
});
