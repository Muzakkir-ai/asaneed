import {collectMatnUsage} from '../lib/matnUsage';
import {appearance} from '../lib/certificateAppearance';
import {z} from 'zod';
import {createEndpoint} from 'zitejs/backend';
import {context as requestContext} from '../compat/context';
import {matnHeadingSchema} from '../lib/matnPresentation';
export const matnCategories=['التجويد','القراءات','الحديث','الفقه','العقيدة','اللغة العربية','أخرى'] as const;
const entry=z.object({id:z.string().uuid().optional(),title:z.string().trim().min(2).max(200),category:z.enum(matnCategories),author:z.string().max(250).default(''),description:z.string().max(5000).default(''),artwork_number:z.string().regex(/^(?:\d{2,4})?$/).default(''),heading:matnHeadingSchema.nullable().optional(),template_ids:z.array(z.string().uuid()).max(30).default([]),status:z.enum(['draft','published']).default('draft')});
const request=z.object({title:z.string().trim().min(2).max(200),category:z.enum(matnCategories),author:z.string().max(250).default(''),reference:z.string().max(2000).default(''),notes:z.string().max(5000).default('')});

export default createEndpoint({authenticated:true,description:'Shared matn catalog, explicit content requests and personal appearance',inputSchema:z.object({action:z.enum(['list','save','request','review','ack','appearance','saveAppearance','capability','holdings']).default('list'),entry:entry.optional(),request:request.optional(),id:z.string().uuid().optional(),decision:z.enum(['approved','rejected']).optional(),catalogId:z.string().uuid().optional(),explanation:z.string().max(5000).default(''),distinct:z.boolean().default(false),appearance:appearance.optional(),enabled:z.boolean().optional()}),outputSchema:z.object({actorId:z.string(),holdings:z.array(z.object({id:z.string(),ownerName:z.string(),source:z.enum(['personal','additional']),sanadText:z.string(),wordingText:z.string(),sanadFormatting:z.string(),createdAt:z.string()})).optional(),catalog:z.array(z.any()),requests:z.array(z.any()),appearance:appearance.nullable(),capabilities:z.array(z.object({id:z.string(),display_name:z.string(),role:z.string(),can_issue:z.boolean()}))}),execute:async({input,context})=>{
 const {client,account,scope}=requestContext();const admin=account.role==='admin'&&account.active;
 const {data:actor,error:actorError}=await client.from('accounts').select('id,role,can_issue,active').eq('id',account.id).single();if(actorError||!actor?.active)throw Error('Account unavailable');
 if(!admin&&!actor.can_issue)throw Error('Shaykh or administrator required');
 const administrative=['save','review','capability','holdings'].includes(input.action);if(administrative&&!admin)throw Error('Administrator required');
 if(scope?.inspection&&input.action!=='list')throw Error('Return to your own workspace');
 if(input.action==='holdings'){
  if(!input.catalogId)throw Error('Matn required');
  const {data:matn,error:matnError}=await client.from('matn_catalog').select('id').eq('id',input.catalogId).single();if(matnError||!matn)throw Error('Matn unavailable');
  const read=async(table:string,columns:string,kind?:string)=>{const rows:any[]=[];for(let page=0;;page++){let query=client.from(table).select(columns);if(kind)query=query.eq('kind',kind);if(kind==='mutoonHoldings')query=query.eq('payload->>catalogId',input.catalogId);const {data,error}=await query.range(page*1000,page*1000+999);if(error)throw error;rows.push(...data||[]);if(!data||data.length<1000)return rows;}};
  const [personal,extensions,accounts,issuers]=await Promise.all([read('workspace_records','id,payload','mutoonHoldings'),read('workspace_records','id,payload','additionalShaykhExtensions'),read('accounts','id,display_name,auth_user_id,legacy_auth_id'),read('issuers','id,display_name')]);
  return {actorId:account.id,catalog:[],requests:[],appearance:null,capabilities:[],holdings:collectMatnUsage(input.catalogId,personal,extensions,accounts,issuers)};
 }
 const rpc=async(name:string,args:Record<string,unknown>)=>{const {data,error}=await client.rpc(name,args);if(error)throw Error(error.code==='23505'?'يوجد طلب نشط بهذا الاسم؛ راجع طلباتك.':error.message);return data;};
 if(input.action==='save'){if(!input.entry)throw Error('Matn required');await rpc('save_matn_catalog',{entry:input.entry,allow_distinct:input.distinct});}
 if(input.action==='request'){if(!input.request)throw Error('Request required');await rpc('submit_matn_request',{entry:input.request});}
 if(input.action==='review'){if(!input.id||!input.decision)throw Error('Decision required');await rpc('review_matn_request',{request_id:input.id,decision:input.decision,existing_matn:input.catalogId||null,entry:input.entry||null,explanation:input.explanation,allow_distinct:input.distinct});}
 if(input.action==='ack'){if(!input.id)throw Error('Request required');await rpc('acknowledge_matn_decision',{request_id:input.id});}
 if(input.action==='capability'){if(!input.id||input.enabled===undefined)throw Error('Account and capability required');await rpc('set_issuance_capability',{target_account:input.id,enabled:input.enabled});}
 if(input.action==='saveAppearance'){if(!actor.can_issue||!input.appearance)throw Error('Personal issuing capability required');const {data:old,error}=await client.from('workspace_records').select('id').eq('kind','certificateAppearance').eq('payload->>ownerId',context.user.id).maybeSingle();if(error)throw error;const record={kind:'certificateAppearance',payload:{ownerId:context.user.id,...input.appearance}};const saved=old?await client.from('workspace_records').update(record).eq('id',old.id):await client.from('workspace_records').insert(record);if(saved.error)throw saved.error;}
 const [{data:catalog,error:ce},{data:requests,error:re},{data:prefs,error:pe}]=await Promise.all([client.from('matn_catalog').select('*').order('title'),client.from('matn_requests').select('*').order('created_at',{ascending:false}),client.from('workspace_records').select('payload').eq('kind','certificateAppearance').eq('payload->>ownerId',context.user.id)]);if(ce||re||pe)throw ce||re||pe;
 let capabilities:any[]=[];if(admin){const result=await client.from('accounts').select('id,display_name,role,can_issue').in('role',['admin','shaykh']);if(result.error)throw result.error;capabilities=result.data||[];}
 return {actorId:account.id,catalog:catalog||[],requests:requests||[],appearance:appearance.safeParse(prefs?.[0]?.payload).data??null,capabilities};
}});
