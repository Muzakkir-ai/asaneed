import {arabicSearchKey} from '../lib/arabicSearch';
import {isAppAdmin} from '../lib/admin';
import {z} from 'zod';
import {createEndpoint} from 'zitejs/backend';
import {zite} from 'zitejs/db';

const normalized=(name:string)=>name.normalize('NFKC').trim().replace(/\s+/gu,' ');
async function readAll<T>(client:{findAll:(input:{limit:number;offset:number})=>Promise<{records:T[];hasMore:boolean}>}){
 const records:T[]=[];
 for(let offset=0;;offset+=2000){
  const page=await client.findAll({limit:2000,offset});records.push(...page.records);
  if(!page.hasMore)break;
 }
 return records;
}
export default createEndpoint({
 description:'Shared student selection; administrators may delete unused saved names without deleting certificates',
 authenticated:true,
 inputSchema:z.object({action:z.enum(['list','delete']).default('list'),name:z.string().trim().min(1).optional(),ownerId:z.string().optional()}),
 outputSchema:z.object({students:z.array(z.string()),entries:z.array(z.object({name:z.string(),certificateCount:z.number(),canDelete:z.boolean()})),canManageStudents:z.boolean()}),
 execute:async({input,context})=>{
  const admin=await isAppAdmin(context.user.email);
  const [saved,issued]=await Promise.all([readAll(zite.students),readAll(zite.certificates)]);
  const counts=new Map<string,number>();
  for(const cert of issued){
   const key=arabicSearchKey(cert.studentName||'');
   if(key)counts.set(key,(counts.get(key)||0)+1);
  }
  let remaining=saved;
  if(input.action==='delete'){
   if(!admin)throw new Error('حذف الأسماء من قائمة الطلاب المشتركة متاح للمدير فقط');
   if(!input.name)throw new Error('اختر اسم الطالب');
   const key=arabicSearchKey(input.name);
   if(counts.get(key))throw new Error('لا يمكن حذف الطالب لأن لديه إجازة محفوظة. يجب معالجة شهاداته أولًا.');
   const targets=saved.filter(row=>arabicSearchKey(row.name||'')===key);
   if(!targets.length)throw new Error('اسم الطالب غير موجود في القائمة');
   // Check again immediately before deletion so a recently issued ijazah protects the name.
   const currentCertificates=await readAll(zite.certificates);
   if(currentCertificates.some(c=>arabicSearchKey(c.studentName||'')===key))throw new Error('أُضيفت إجازة لهذا الطالب؛ لم يُحذف اسمه.');
   for(const row of targets)await zite.students.delete({id:row.id});
   remaining=saved.filter(row=>arabicSearchKey(row.name||'')!==key);
  }
  const unique=new Map<string,string>();
  for(const value of [...remaining.map(row=>row.name||''),...issued.map(row=>row.studentName||'')]){
   const name=normalized(value);if(name)unique.set(arabicSearchKey(name),name);
  }
  const entries=[...unique].map(([key,name])=>({name,certificateCount:counts.get(key)||0,canDelete:admin&&!counts.get(key)&&remaining.some(row=>arabicSearchKey(row.name||'')===key)})).sort((a,b)=>a.name.localeCompare(b.name,'ar'));
  return {students:entries.map(row=>row.name),entries,canManageStudents:admin};
 },
});
