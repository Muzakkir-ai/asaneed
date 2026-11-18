import {z} from 'zod';
import {createEndpoint,ZiteError} from 'zitejs/backend';
import {zite} from 'zitejs/db';
export default createEndpoint({
 description:'Save and reuse named introductions and conclusions for personal Mutoon ijazahs',
 authenticated:true,
 inputSchema:z.object({action:z.enum(['list','save']).default('list'),id:z.string().optional(),name:z.string().optional(),shared:z.boolean().default(false),reusable:z.boolean().optional(),status:z.enum(['draft','published']).default('published'),kind:z.enum(['introduction','conclusion','wording']).optional(),body:z.string().optional(),formatting:z.string().optional()}),
 outputSchema:z.object({savedId:z.string().optional(),templates:z.array(z.object({id:z.string(),shared:z.boolean(),editable:z.boolean().optional(),reusable:z.boolean().optional(),status:z.string(),name:z.string(),kind:z.string(),body:z.string(),formatting:z.string()}))}),
 execute:async({input,context})=>{
  const admin=context.account?.role==='admin'&&context.account.active;const ownerId=input.shared?'':context.user.id;if(input.shared&&!admin&&input.action==='save')throw Error('Administrator required');
  let savedId:string|undefined;
  if(input.action==='save'){
   if(input.reusable&&!admin&&!(context.account?.active&&context.account?.role==='shaykh'))throw Error('إتاحة النصوص للآخرين متاحة للمجيزين');
   const previous=input.id?await zite.mutoonTextTemplates.findOne({id:input.id}).catch(()=>null):null;
   if(input.id&&(!previous||(previous.ownerId||'')!==ownerId))throw new ZiteError({code:'NOT_FOUND',message:'Template not found'});
   const name=(input.name??previous?.name??'').trim(),body=(input.body??previous?.body??''),kind=input.kind??previous?.kind,formatting=input.formatting??previous?.formatting??'[]';
   if(!name||!body.trim()||!kind||name.length>150||body.length>30000)throw new Error('Name and template body are required');
   const record={name,body,kind,ownerId,formatting,...(input.reusable===undefined?{}:{reusable:input.reusable,status:'published'}),...(input.shared?{status:input.status}:{})};
   if(previous){await zite.mutoonTextTemplates.update({id:previous.id,record});savedId=previous.id;}
   else savedId=(await zite.mutoonTextTemplates.create({record})).id;
  }
  const {records}=await zite.mutoonTextTemplates.findAll({limit:2000});
  const visible=records.filter(row=>{
   const shared=!row.ownerId,published=row.status!=='draft';
   if(input.shared)return shared&&(admin||published);
   return row.ownerId===ownerId||published&&(shared||row.reusable===true);
  });
  return {savedId,templates:visible.map(row=>({
   id:row.id,shared:!row.ownerId,editable:row.ownerId===context.user.id,reusable:row.reusable===true,
   status:row.status||'published',name:row.name||'',kind:row.kind||'',body:row.body||'',formatting:row.formatting||'[]',
  }))};
 }
});
