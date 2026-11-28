const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),swc=require('next/dist/build/swc');
async function main(){
 await swc.loadBindings();
 const modules=new Map(),aliases={'zitejs/backend':'legacy/compat/backend.ts','zitejs/db':'legacy/compat/database.ts'};
 function load(filename){
  if(modules.has(filename))return modules.get(filename).exports;
  const full=path.resolve(filename),entry=new Module(full,module);entry.paths=module.paths;modules.set(filename,entry);
  entry.require=id=>{if(aliases[id])return load(aliases[id]);if(id.startsWith('.')){const target=path.relative(process.cwd(),path.resolve(path.dirname(full),id));if(fs.existsSync(target+'.ts'))return load(target+'.ts');if(fs.existsSync(target))return require(path.resolve(target));}return require(id);};
  entry._compile(swc.transformSync(fs.readFileSync(full,'utf8'),{filename:full,jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}}).code,full);
  return entry.exports;
 }
 const {requestContext}=load('legacy/compat/context.ts'),{zite}=load('legacy/compat/database.ts'),directory=load('legacy/api/studentDirectory.ts').default;
 const ids=Array.from({length:6},(_,i)=>'00000000-0000-4000-8000-'+String(i+1).padStart(12,'0'));
 const [first,second,unused,linked,fresh,stale]=ids;
 const tables={students:[{id:first,display_name:'أَحْمَد الاختبار'},{id:second,display_name:'احمد الاختبار'},{id:unused,display_name:'أحمد الاختبار'},{id:linked,display_name:'طالب مرتبط'}],certificates:[{id:'draft',student_id:second,sanad_id:'sanad',issuer_id:'issuer',status:'draft',draft:{}}],sanads:[{id:'sanad',issuer_id:'issuer',body:{chain:'【بيان القراءة:رواية حفص عن الإمام عاصم】 عن شيخ الاختبار'}}],issuers:[{id:'issuer',print_profile:{}}],student_accounts:[{student_id:linked,account_id:'linked-account'}]};
 const writes=[];
 const clone=x=>structuredClone(x);
 const client={rpc:async()=>({data:[],error:null}),from(name){
  const table=tables[name]||[],query={mode:'read',filters:[],fields:'*',patch:null,max:Infinity,
   select(fields='*'){this.fields=fields;return this;},
   eq(key,value){this.filters.push(r=>r[key]===value);return this;},
   order(){return this;},limit(n){this.max=n;return this;},
   range(a,b){return Promise.resolve({data:clone(this.rows().slice(a,b+1)),error:null});},
   rows(){let rows=table.filter(r=>this.filters.every(fn=>fn(r))).slice(0,this.max);if(name==='certificates'&&this.fields.includes('editor:draft'))rows=rows.map(r=>({...r,editor:r.draft?.editor,source:r.draft?.source,studentName:r.draft?.studentName}));return rows;},
   insert(patch){this.mode='insert';this.patch=patch;return this;},
   update(patch){this.mode='update';this.patch=patch;return this;},
   delete(){this.mode='delete';return this;},
   async single(){if(this.mode==='insert'){const row={id:this.patch.id||'created-'+writes.length,...this.patch};writes.push([name,'insert',clone(row)]);table.push(row);return {data:clone(row),error:null};}const row=this.rows()[0];if(!row)return {data:null,error:{message:'missing'}};if(this.mode==='update'){writes.push([name,'update',clone(this.patch)]);Object.assign(row,this.patch);}if(this.mode==='delete'){writes.push([name,'delete',row.id]);table.splice(table.indexOf(row),1);}return {data:clone(row),error:null};},
   async maybeSingle(){return {data:clone(this.rows()[0]||null),error:null};},
   then(resolve,reject){return Promise.resolve({data:clone(this.rows()),error:null}).then(resolve,reject);}
  };return query;
 }};
 const ctx={client,user:{id:'issuer',name:'Fixture issuer',email:'issuer@example.invalid',image:null},account:{id:'fixture',role:'admin',active:true,can_issue:true}};
 await requestContext.run(ctx,async()=>{
  const base={sanad:'sanad',studentName:'أحمد الاختبار',completionDate:'2026-01-01'};
  await assert.rejects(()=>zite.certificates.create({record:base}),/أكثر من طالب/);assert.equal(writes.length,0);
  await zite.certificates.update({id:'draft',record:{studentName:base.studentName,notes:'Updated draft'}});
  assert.equal((await zite.certificates.findOne({id:'draft'})).studentId,second);
  for(const studentId of [first,second]){const cert=await zite.certificates.create({record:{...base,studentId}});assert.equal(cert.studentId,studentId);}
  const before=writes.length;
  await assert.rejects(()=>zite.certificates.create({record:{...base,studentId:stale}}),/غير متاح/);
  await assert.rejects(()=>zite.certificates.create({record:{...base,studentId:first,studentName:'طالب مختلف'}}),/غير متاح/);assert.equal(writes.length,before);
  tables.certificates[0].recipient_account_id='linked-recipient';
  await assert.rejects(()=>zite.certificates.update({id:'draft',record:{...base,studentId:first}}),/مرتبطة/);
  for(let i=0;i<2;i++){const cert=await zite.certificates.create({record:{...base,studentId:fresh,createStudent:true}});assert.equal(cert.studentId,fresh);}
  assert.equal(tables.students.filter(r=>r.id===fresh).length,1,'new same-name student is distinct and the stable ID is reused');
  const list=await directory.invoke({});assert.equal(list.entries.length,5);assert.equal(new Set(list.entries.map(e=>e.label)).size,5);
  assert.equal(list.entries.find(e=>e.id===first).certificateCount,1);
  assert.equal(list.entries.find(e=>e.id===second).certificateCount,2);
  assert.equal(list.entries.find(e=>e.id===linked).canDelete,false);
  assert.equal(list.entries.find(e=>e.id===unused).canDelete,true);
  await assert.rejects(()=>directory.invoke({action:'delete',name:base.studentName}),/بمعرّفه/);
  await assert.rejects(()=>directory.invoke({action:'delete',studentId:first}),/مرتبط/);
  await assert.rejects(()=>directory.invoke({action:'delete',studentId:linked}),/مرتبط/);
  ctx.account.role='shaykh';await assert.rejects(()=>directory.invoke({action:'delete',studentId:unused}),/للمدير/);ctx.account.role='admin';
  await directory.invoke({action:'delete',studentId:unused});
  assert.ok(!tables.students.some(s=>s.id===unused));assert.ok(tables.students.some(s=>s.id===first)&&tables.students.some(s=>s.id===second));
  assert.equal(writes.filter(x=>x[1]==='delete').length,1);assert.deepEqual(writes.at(-1),['students','delete',unused]);
  assert.equal(tables.certificates.length,5);
 });
 console.log('PASS: stable student IDs, ambiguous/stale selection denial, draft preservation, recipient protection, distinct new identity reuse and exact unused-ID deletion');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
