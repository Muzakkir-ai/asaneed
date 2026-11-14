import assert from 'node:assert/strict';
import {requestContext, type Context} from '../legacy/compat/context';
import {zite} from '../legacy/compat/database';

const firstStudent='00000000-0000-4000-8000-000000000001';
const secondStudent='00000000-0000-4000-8000-000000000002';
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
    return {data:draft,error:null};
   }})}),
  }),
  insert:(patch:Record<string,unknown>)=>{
   writes.push({table,patch});
   throw Error('Unexpected insert');
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
 console.log('PASS: ambiguous new certificate blocked and existing draft retains its student ID');
}).catch(error=>{console.error(error);process.exitCode=1;});
