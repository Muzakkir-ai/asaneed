import {z} from 'zod';
import {createEndpoint,ZiteError} from 'zitejs/backend';
import {zite} from 'zitejs/db';
export default createEndpoint({
 description:'Save and reuse named introductions and conclusions for personal Mutoon ijazahs',
 authenticated:true,
 inputSchema:z.object({action:z.enum(['list','save']).default('list'),id:z.string().optional(),name:z.string().optional(),kind:z.enum(['introduction','conclusion']).optional(),body:z.string().optional(),formatting:z.string().optional()}),
 outputSchema:z.object({templates:z.array(z.object({id:z.string(),name:z.string(),kind:z.string(),body:z.string(),formatting:z.string()}))}),
 execute:async({input,context})=>{
  const ownerId=context.user.id;
  if(input.action==='save'){
   const previous=input.id?await zite.mutoonTextTemplates.findOne({id:input.id}).catch(()=>null):null;
   if(input.id&&(!previous||previous.ownerId!==ownerId))throw new ZiteError({code:'NOT_FOUND',message:'Template not found'});
   const name=(input.name??previous?.name??'').trim(),body=(input.body??previous?.body??'').trim(),kind=input.kind??previous?.kind,formatting=input.formatting??previous?.formatting??'[]';
   if(!name||!body||!kind||name.length>150||body.length>30000)throw new Error('Name and template body are required');
   if(previous)await zite.mutoonTextTemplates.update({id:previous.id,record:{name,body,kind,ownerId,formatting}});
   else await zite.mutoonTextTemplates.create({record:{name,body,kind,ownerId,formatting}});
  }
  const {records}=await zite.mutoonTextTemplates.findAll({filters:{ownerId},limit:2000});
  return {templates:records.filter(x=>x.ownerId===ownerId).map(x=>({id:x.id,name:x.name||'',kind:x.kind||'',body:x.body||'',formatting:x.formatting||'[]'}))};
 }
});
