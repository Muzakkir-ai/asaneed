import {z} from 'zod';
import {createEndpoint} from 'zitejs/backend';
import {context} from '../compat/context';
import {buildNarratorDirectory,type SourceSection} from '../lib/narratorDirectory';

const reading=z.object({qariId:z.string(),rawi:z.string()});
const profile=z.object({id:z.string(),name:z.string(),teachers:z.array(z.string()),students:z.array(z.string()),readings:z.array(reading),sources:z.array(z.string())});

const sharedTitles=new Set([
 'من الإمام ابن الجزري إلى الإمام الداني — القراء السبعة',
 'من إبراهيم العُبيدي إلى ابن الجزري — فرعا السند',
 'إسناد الشيخ ذكاء الله إلى إبراهيم العُبيدي — مرجع مستقل',
]);

export default createEndpoint({
 description:'Read-only index of historical teachers and pupils from shared sanad sources',
 authenticated:true,
 inputSchema:z.object({}),
 outputSchema:z.object({people:z.array(profile),links:z.number(),sections:z.number()}),
 execute:async()=>{
  const {client}=context();
  const sections:SourceSection[]=[];
  const pageSize=1000;
  for(let offset=0;;offset+=pageSize){
   const {data,error}=await client.from('workspace_records')
    .select('id,payload')
    .eq('kind','sanadSections')
    .or('payload->>ownerId.is.null,payload->>ownerId.eq.""')
    .order('id')
    .range(offset,offset+pageSize-1);
   if(error||!data)throw Error('تعذر تحميل مصادر رجال الأسانيد');
   for(const {id,payload} of data){
    if(payload.ownerId||typeof payload.title!=='string')continue;
    if(payload.title.startsWith('CHAIN:')||sharedTitles.has(payload.title)){
     sections.push({id,title:payload.title,body:typeof payload.body==='string'?payload.body:''});
    }
   }
   if(data.length<pageSize)break;
  }
  return buildNarratorDirectory(sections);
 },
});
