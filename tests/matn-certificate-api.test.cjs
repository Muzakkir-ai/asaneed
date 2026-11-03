const assert=require('node:assert/strict');
const fs=require('node:fs');
const swc=require('next/dist/build/swc');
const Module=require('node:module');
// Run the actual endpoint with issuer-scoped in-memory entities; no production writes.
const created=[],certificates=[],sources=[{id:'held',ownerId:'teacher',name:'الجزرية',category:'تجويد',sanadText:'عن شيخي عن الأول',wordingText:'أجزت {{mujaaz}} في {{kitab_name}}'}];
const ctx={user:{id:'teacher',email:'teacher@example.test'},account:{role:'shaykh'},scope:{accountId:'account'},client:{from:()=>({select:async()=>({data:[{id:'issuer',print_profile:{personalAccount:'account'}}],error:null})}),rpc:async()=>({data:'21',error:null})}};
const zite={mutoonHoldings:{findAll:async()=>({records:sources})},mutoonTextTemplates:{findAll:async()=>({records:[]})},asaneed:{create:async({record})=>{const r={...record,id:'sanad'};created.push(r);return r},delete:async()=>{}},certificates:{create:async({record})=>{const r={...record,id:'certificate'};certificates.push(r);return r},delete:async()=>{}}};
const helperPath=require('node:path').resolve('.vercel/matn-tests/legacy/lib/matnCertificate.js');
const stubs={'zitejs/backend':{createEndpoint:x=>x},'zitejs/db':{zite},'../lib/admin':{isAppAdmin:async()=>false},'../lib/matnCertificate':require(helperPath),'../lib/certificateRegistration':{ensureCertificateRegistration:async()=>{}},'../lib/shahadaSequence':{nextShahadaNumber:async()=>1},'../compat/context':{context:()=>ctx}};
async function main(){
await swc.loadBindings();
const {code}=await swc.transform(fs.readFileSync('legacy/api/matnCertificates.ts','utf8'),{filename:'matnCertificates.ts',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});
const mod=new Module(__filename,module);mod.filename=__filename;mod.paths=module.paths;mod.require=id=>id in stubs?stubs[id]:require(id);mod._compile(code,__filename);const endpoint=mod.exports.default;
const call=value=>endpoint.execute({input:endpoint.inputSchema.parse(value),context:ctx});

 const list=await call({action:'options',issuerKey:'user:teacher'});assert.equal(list.options.length,1);
 await assert.rejects(()=>call({action:'options',issuerKey:'user:other'}),/خارج/);
 await assert.rejects(()=>call({action:'options',issuerKey:'guest:someone'}),/إضافي/);
 await assert.rejects(()=>call({action:'save',issuerKey:'user:teacher',matnId:'other',studentName:'الطالب',completionDate:'2026-11-03'}),/اختر متن/);
 await assert.rejects(()=>call({action:'save',issuerKey:'user:teacher',matnId:'held',studentName:'الطالب',completionDate:'2026-02-30'}),/التاريخ|تاريخ/);
 const r=await call({action:'save',issuerKey:'user:teacher',matnId:'held',studentName:'الطالب',completionDate:'2026-11-03'});
 assert.equal(r.certificateId,'certificate');assert.equal(created[0].matnCode,'21');assert.ok(created[0].chain.includes('أجزت mujaaz في الجزرية'));assert.equal(certificates[0].sanad,'sanad');assert.equal(certificates[0].publicationStatus,'draft');
 console.log('PASS: actual matn endpoint options, ownership, unknown holding/date rejection, token assembly and draft linkage');
}
main().catch(e=>{console.error(e);process.exitCode=1});
