import assert from 'node:assert/strict';
import {requestContext, type Context} from '../legacy/compat/context';
import {zite} from '../legacy/compat/database';

const firstStudent='00000000-0000-4000-8000-000000000001';
const secondStudent='00000000-0000-4000-8000-000000000002';
let created:Record<string,unknown>|undefined;
const draft={id:'draft',student_id:secondStudent,sanad_id:'sanad',issuer_id:'issuer',status:'draft',draft:{}};
const tables:Record<string,Record<string,unknown>[]>={
 students:[{id:firstStudent,display_name:'أَحْمَد الاختبار'},{id:secondStudent,display_name:'احمد الاختبار'}],
 certificates:[draft],
 sanads:[{id:'sanad',issuer_id:'issuer',body:{chain:'【بيان القراءة:رواية حفص عن الإمام عاصم】 عن شيخ الاختبار'}}],
};
const writes:{table:string;patch:Record<string,unknown>}[]=[];
const client={
 rpc:async()=>({data:[],error:null}),
 from:(table:string)=>({
  select:()=>({
   range:async()=>({data:tables[table]||[],error:null}),
   eq:(field:string,value:string)=>{
    const result=async()=>({data:tables[table]?.find(row=>row[field]===value),error:null});
    return {single:result,maybeSingle:result};
   },
  }),
  update:(patch:Record<string,unknown>)=>({
   eq:()=>({select:()=>({single:async()=>{
    writes.push({table,patch});
    Object.assign(draft,patch);
    return {data:draft,error:null};
   }})}),
  }),
  insert:(patch:Record<string,unknown>)=>{
   writes.push({table,patch});
   assert.equal(table,'certificates');
   created={...patch,id:'created-'+writes.length};
   tables.certificates.push(created);
   return {select:()=>({single:async()=>({data:created,error:null})})};
  },
 }),
};
const context={
 client,user:{id:'issuer',name:'Fixture issuer',email:'issuer@example.invalid',image:null},
 account:{id:'fixture',role:'admin',active:true},
} as unknown as Context;

requestContext.run(context,async()=>{
 await assert.rejects(()=>zite.certificates.create({record:{sanad:'sanad',studentName:'أحمد الاختبار'}}),/أكثر من طالب/);
 assert.equal(writes.length,0,'Ambiguous creation writes neither a student nor a certificate');
 await zite.certificates.update({id:draft.id,record:{studentName:'أحمد الاختبار',notes:'Updated draft'}});
 assert.equal(writes.length,1);
 assert.equal(writes[0].table,'certificates');
 assert.equal(writes[0].patch.student_id,secondStudent);
 const reloaded=await zite.certificates.findOne({id:draft.id});
 assert.equal(reloaded.studentId,secondStudent);
 for(const studentId of [firstStudent,secondStudent]){
  const saved=await zite.certificates.create({record:{sanad:'sanad',studentName:'أحمد الاختبار',studentId}});
  assert.equal(saved.studentId,studentId);
  assert.equal(created?.student_id,studentId);
 }
 await assert.rejects(()=>zite.certificates.create({record:{sanad:'sanad',studentName:'طالب مختلف',studentId:firstStudent}}),/غير متاح/);
 await assert.rejects(()=>zite.certificates.create({record:{sanad:'sanad',studentName:'أحمد الاختبار',studentId:'stale'}}),/غير متاح/);
 assert.equal(writes.length,3);
 console.log('PASS: distinct IDs save independently; stale and mismatched choices are rejected; ambiguous new certificate blocked and an existing draft reloads with its student ID');
}).catch(error=>{console.error(error);process.exitCode=1;});
