import {normalizeName} from '../../lib/manage';
import {isAppAdmin} from '../lib/admin';
import {context as requestContext} from '../compat/context';
import {z} from 'zod';
import {createEndpoint} from 'zitejs/backend';
import {zite} from 'zitejs/db';
const normalized=(name:string)=>name.normalize('NFKC').trim().replace(/\s+/gu,' ');
async function readAll<T>(client:{findAll:(input:{limit:number;offset:number})=>Promise<{records:T[];hasMore:boolean}>}){
 const records:T[]=[];for(let offset=0;;){const page=await client.findAll({limit:2000,offset});records.push(...page.records);if(!page.hasMore)return records;if(!page.records.length)throw Error('تعذر تحميل قائمة الطلاب');offset+=page.records.length;}
}
export default createEndpoint({
 description:'Student directory keyed by stable student identity',
 authenticated:true,
 inputSchema:z.object({action:z.enum(['list','delete']).default('list'),studentId:z.string().uuid().optional(),name:z.string().trim().min(1).optional(),ownerId:z.string().optional()}),
 outputSchema:z.object({students:z.array(z.string()),entries:z.array(z.object({id:z.string(),name:z.string(),label:z.string(),certificateCount:z.number(),canDelete:z.boolean()})),canManageStudents:z.boolean()}),
 execute:async({input,context})=>{
  const admin=await isAppAdmin(context.user.email);
  const [saved,issued]=await Promise.all([readAll(zite.students),readAll(zite.certificates)]);
  const counts=new Map<string,number>(),legacyNames=new Set<string>();
  for(const cert of issued){if(cert.studentId)counts.set(cert.studentId,(counts.get(cert.studentId)||0)+1);else legacyNames.add(normalizeName(cert.studentName||''));}
  const request=requestContext();
  // Admin directory uses the RLS-backed student-account link table. Never cascade-delete a login link.
  const linked=new Set<string>();
  if(admin){for(let offset=0;;offset+=1000){const result=await request.client.from('student_accounts').select('student_id').order('student_id').range(offset,offset+999);if(result.error)throw Error('تعذر تحميل روابط الطلاب');for(const row of result.data||[])linked.add(row.student_id);if((result.data||[]).length<1000)break;}}
  let remaining=saved;
  if(input.action==='delete'){
   if(!admin||request.scope?.inspection)throw Error('حذف الطلاب متاح للمدير في مساحته فقط');
   if(!input.studentId)throw Error('اختر الطالب بمعرّفه؛ لا يمكن الحذف بالاسم');
   const target=saved.find(row=>row.id===input.studentId);
   if(!target)throw Error('الطالب غير موجود في القائمة');
   if(counts.get(target.id)||linked.has(target.id)||legacyNames.has(normalizeName(target.name||'')))throw Error('لا يمكن حذف طالب مرتبط بشهادة أو حساب');
   const current=await request.client.from('certificates').select('id').eq('student_id',target.id).limit(1);
   const links=await request.client.from('student_accounts').select('student_id').eq('student_id',target.id).limit(1);
   if(current.error||links.error)throw Error('تعذر التحقق من روابط الطالب');
   if(current.data?.length||links.data?.length)throw Error('لا يمكن حذف طالب مرتبط بشهادة أو حساب');
   await zite.students.delete({id:target.id});remaining=saved.filter(row=>row.id!==target.id);
  }
  const same=new Map<string,number>();for(const row of remaining){const key=normalizeName(row.name||'');same.set(key,(same.get(key)||0)+1);}
  const entries=remaining.flatMap(row=>{const name=normalized(row.name||'');if(!name)return [];const key=normalizeName(name),count=counts.get(row.id)||0;return [{id:row.id,name,label:(same.get(key)||0)>1?name+' · '+row.id:name,certificateCount:count,canDelete:admin&&!request.scope?.inspection&&!count&&!linked.has(row.id)&&!legacyNames.has(key)}];}).sort((a,b)=>a.name.localeCompare(b.name,'ar')||a.id.localeCompare(b.id));
  return {students:[...new Set([...entries.map(e=>e.name),...issued.map(c=>normalized(c.studentName||'')).filter(Boolean)])],entries,canManageStudents:admin&&!request.scope?.inspection};
 },
});
