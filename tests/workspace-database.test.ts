import assert from 'node:assert/strict';
import {requestContext,type Context} from '../legacy/compat/context';
import {zite} from '../legacy/compat/database';
const tables:Record<string,any[]>={
 issuers:['one','two','other'].map(id=>({id,display_name:id,print_profile:{}})),
 certificates:['one','two','other'].map((issuer_id,i)=>({id:'c'+i,issuer_id,student_id:'s',sanad_id:'sanad'+i,completion_date:'2026-01-01',draft:{},recipient_account_id:i===2?'account':null})),
 sanads:['one','two','other'].map((issuer_id,i)=>({id:'sanad'+i,issuer_id,title:'Sanad',body:{chain:'preserved'}})),students:[{id:'s',display_name:'Student'}],
 workspace_records:[{id:'own-holding',kind:'ijazahHoldings',payload:{ownerId:'auth'}},{id:'guest-one',kind:'additionalShaykhExtensions',payload:{shaykhId:'one'}},{id:'guest-other',kind:'additionalShaykhExtensions',payload:{shaykhId:'other'}},{id:'other-holding',kind:'ijazahHoldings',payload:{ownerId:'another'}}]
};
tables.student_accounts=[{student_id:'linked-student',account_id:'account'}];
tables.certificates.push({id:'linked-cert',issuer_id:'other',student_id:'linked-student',completion_date:'2026-01-01',draft:{},recipient_account_id:null,status:'finalized'});
const client:any={rpc:async()=>({data:[{id:'account',auth_user_id:'auth',display_name:'Admin',role:'admin',active:true}],error:null}),from:(name:string)=>({select:()=>({range:async()=>({data:tables[name]||[],error:null}),eq:async(field:string,value:string)=>({data:(tables[name]||[]).filter(r=>r[field]===value),error:null})})})};
const ctx:Context={client,user:{id:'auth',name:'Admin',email:'admin@example.invalid',image:null},account:{id:'account',role:'admin',active:true},scope:{accountId:'account',authUserId:'auth',name:'Admin',role:'admin',issuerIds:['one','two'],inspection:false,readOnly:false,system:false}};
async function main(){
await requestContext.run(ctx,async()=>{
 assert.deepEqual((await zite.certificates.findAll()).records.map(r=>r.id),['c0','c1']);
 assert.deepEqual((await zite.additionalShaykhs.findAll()).records.map(r=>r.id),['one','two']);
 assert.deepEqual((await zite.ijazahHoldings.findAll()).records.map(r=>r.id),['own-holding']);
 await assert.rejects(()=>zite.additionalShaykhs.update({id:'other',record:{name:'forbidden'}}),/outside/);
});
await requestContext.run({...ctx,cache:undefined,scope:{...ctx.scope!,system:true}},async()=>{
 assert.equal((await zite.additionalShaykhs.findAll()).records.length,3,'Admin directory keeps all RLS-authorized profiles');
 assert.equal((await zite.asaneed.findAll()).records.length,3,'Administrative sanad directory is not narrowed by a certificate filter');
 assert.equal((await zite.additionalShaykhExtensions.findAll()).records.length,2);
});
await requestContext.run({...ctx,cache:undefined,scope:{...ctx.scope!,certificateAccess:'recipient'}},async()=>{
 assert.deepEqual((await zite.certificates.findAll()).records.map(r=>r.id),['c2','linked-cert'],'Received certificates are account-specific, independent of issuer assignments');
});
console.log('PASS: multi-issuer authorization, unassigned mutation rejection, full administrative profiles/sanads and recipient-specific certificates');

}
main().catch(error=>{console.error(error);process.exitCode=1;});
