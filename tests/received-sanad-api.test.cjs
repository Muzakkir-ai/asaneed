const assert=require('node:assert/strict');
const fs=require('node:fs');
const Module=require('node:module');
const path=require('node:path');
const {createHash}=require('node:crypto');
const swc=require('next/dist/build/swc');

async function main(){
 await swc.loadBindings();
 const certificateId='00000000-0000-4000-8000-000000000010';
 const studentId='00000000-0000-4000-8000-000000000020';
 const accountId='00000000-0000-4000-8000-000000000030';
 const chain='عن شيخ الاختبار، عن الإمام ابن الجزري، '.repeat(8);
 const snapshot={chain,heading:'رواية حفص عن الإمام عاصم',formatting:JSON.stringify({issuerDisplayName:'شيخ الاختبار',transmission:{chain}})};
 const original=structuredClone(snapshot);
 const certificate={id:certificateId,status:'finalized',student_id:studentId,recipient_account_id:null,registration_number:'2676-0110'};
 // This link is initially for the other student with the same display name.
 const link={student_id:'00000000-0000-4000-8000-000000000021',account_id:accountId};
 const data={accounts:[{id:accountId,auth_user_id:'fixture-auth'}],certificates:[certificate],student_accounts:[link],certificate_snapshots:[{certificate_id:certificateId,content:snapshot}]};
 const holdings=[];
 const client={from(table){return {select(){
  const filters={};
  const read=async()=>({data:data[table].find(row=>Object.entries(filters).every(([field,value])=>row[field]===value)),error:null});
  const query={eq(field,value){filters[field]=value;return query;},single:read,maybeSingle:read};
  return query;
 }}}};
 const stubs={
  'zitejs/backend':{createEndpoint:definition=>definition},
  'zitejs/db':{zite:{
   sanadSections:{findAll:async()=>({records:[]})},
   ijazahHoldings:{
    findAll:async()=>({records:holdings}),
    create:async({record})=>{const holding={...record,id:'fixture-holding'};holdings.push(holding);return holding;},
   },
  }},
 };
 const cache=new Map();
 function load(file){
  if(cache.has(file))return cache.get(file).exports;
  const {code}=swc.transformSync(fs.readFileSync(file,'utf8'),{filename:file,jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});
  const mod=new Module(file,module);
  mod.paths=module.paths;
  cache.set(file,mod);
  mod.require=id=>{
   if(id in stubs)return stubs[id];
   if(id.startsWith('.')&&!id.endsWith('.json')){
    const target=path.resolve(path.dirname(file),id);
    return load(fs.existsSync(target)?target:target+'.ts');
   }
   return Module.createRequire(file)(id);
  };
  mod._compile(code,file);
  return mod.exports;
 }
 const endpoint=load(path.resolve('legacy/api/receivedSanad.ts')).default;
 const context={client,user:{id:'fixture-auth'},account:{role:'shaykh'}};
 const invoke=async input=>endpoint.outputSchema.parse(await endpoint.execute({context,input:endpoint.inputSchema.parse(input)}));
 await assert.rejects(()=>invoke({action:'preview',certificateId}),/ليست من شهاداتك/);
 link.student_id=studentId;
 const preview=await invoke({action:'preview',certificateId});
 assert.match(preview.personalChain,/شيخ الاختبار/);
 assert.equal(holdings.length,0);
 const save={action:'save',certificateId,personalChain:preview.personalChain};
 await assert.rejects(()=>invoke(save),/أكد حفظ/);
 const imported=await invoke({...save,confirmed:true});
 assert.equal(imported.created,true);
 assert.equal(holdings[0].sourceCertificateId,certificateId);
 assert.equal(holdings[0].sourceSnapshotHash,createHash('sha256').update(JSON.stringify(original)).digest('hex'));
 const retry=await invoke({...save,confirmed:true});
 assert.equal(retry.created,false);
 assert.equal(retry.holdingId,imported.holdingId);
 assert.equal(holdings.length,1);
 assert.deepEqual(snapshot,original);
 console.log('PASS: recipient import checks stable student link, requires confirmation, reuses the saved copy and preserves the snapshot');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
