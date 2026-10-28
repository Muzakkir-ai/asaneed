import {isAppAdmin} from '../lib/admin';
import {z} from 'zod';
import {createEndpoint} from 'zitejs/backend';
import {zite} from 'zitejs/db';
export default createEndpoint({
 description:'List archived revisions of a reusable shared sanad section for administrators',
 authenticated:true,
 inputSchema:z.object({sectionId:z.string()}),
 outputSchema:z.object({versions:z.array(z.object({id:z.string(),revision:z.number(),body:z.string(),formatting:z.string(),savedAt:z.string()}))}),
 execute:async({input,context})=>{
  if(!(await isAppAdmin(context.user.email)))throw new Error('غير مصرح');
  const section=await zite.sanadSections.findOne({id:input.sectionId}).catch(()=>null);
  if(!section)throw new Error('المقطع غير موجود');
  const {records}=await zite.sanadSectionVersions.findAll({filters:{sectionId:input.sectionId},limit:2000});
  return {versions:records.sort((a,b)=>(b.revision||0)-(a.revision||0)).map(v=>({id:v.id,revision:v.revision||1,body:v.body||'',formatting:v.formatting||'',savedAt:v.savedAt||''}))};
 }
});
