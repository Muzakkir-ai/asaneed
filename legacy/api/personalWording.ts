import {z} from 'zod';
import {createEndpoint} from 'zitejs/backend';
import {zite} from 'zitejs/db';
export default createEndpoint({
 description:'Create a personal kalimat al-ijazah template for the signed-in teacher, without modifying shared admin text',
 authenticated:true,
 inputSchema:z.object({title:z.string().trim().min(2).max(200),body:z.string().trim().min(10).max(30000)}),
 outputSchema:z.object({id:z.string(),title:z.string()}),
 execute:async({input,context})=>{
  const owner=context.user.id;
  const {records}=await zite.sanadSections.findAll({limit:2000});
  if(records.some(s=>s.sectionType==='wording'&&s.ownerId===owner&&s.title===input.title))throw new Error('You already have a wording with this title');
  const created=await zite.sanadSections.create({record:{title:input.title,body:input.body,sectionType:'wording',ownerId:owner,sortOrder:0,parentId:'',formatting:''}});
  await zite.sanadSectionVersions.create({record:{name:input.title,sectionId:created.id,revision:1,body:input.body,formatting:'',savedBy:owner,savedAt:new Date().toISOString()}});
  return {id:created.id,title:input.title};
 }
});
