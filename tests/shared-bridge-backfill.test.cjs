const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {PGlite}=require('@electric-sql/pglite');
(async()=>{
 const db=new PGlite();
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'shared-bridge-'));
 try{
  await db.exec("create table builder_people(id uuid primary key, archived boolean not null); create table workspace_records(id uuid primary key, kind text not null, payload jsonb not null);");
  const names=['البقري','محمد','خالد','أحمد','زيد','عمرو','ابن الجزري'];
  const people=names.map((name,i)=>({id:'11111111-1111-4111-8111-11111111111'+i,name,archived:false}));
  const source={id:'22222222-2222-4222-8222-222222222222',body:'عن البقري، عن محمد، عن خالد (ح). وقرأ محمد أيضًا على أحمد، عن مشايخ؛ منهم زيد، وعمرو، وهم على ابن الجزري'};
  const payload={body:source.body,title:'من إبراهيم العُبيدي إلى ابن الجزري — فرعا السند',formatting:'unchanged'};
  for(const person of people)await db.query('insert into builder_people values ($1,false)',[person.id]);
  await db.query("insert into workspace_records values ($1,'sanadSections',$2)",[source.id,payload]);
  const identities=people.map(person=>({name:person.name,personId:person.id,evidence:"reviewed ' $$ source"}));
  const input=path.join(tmp,'review.json');
  fs.writeFileSync(input,JSON.stringify({source,people,identities}));
  const generate=(...args)=>execFileSync(process.execPath,['scripts/plan-shared-bridge-backfill.cjs',input,...args],{encoding:'utf8'});
  await db.exec(generate());
  const {rows:[dryRun]}=await db.query('select payload from workspace_records where id=$1',[source.id]);
  assert.deepEqual(dryRun.payload,payload,'dry run must roll back');
  const plan=generate('--apply');
  await db.exec(plan);
  await db.exec(plan);
  const {rows:[saved]}=await db.query('select payload from workspace_records where id=$1',[source.id]);
  assert.deepEqual(saved.payload,{...payload,sharedBridgeReview:{version:1,sourceBody:source.body,identities}});
  await db.query('update builder_people set archived=true where id=$1',[people[0].id]);
  await assert.rejects(db.exec(plan),/Narrator registry changed/);
  await db.exec('rollback');
  await db.query('update builder_people set archived=false where id=$1',[people[0].id]);
  await db.query("update workspace_records set payload=jsonb_set(payload,'{body}',to_jsonb('changed'::text)) where id=$1",[source.id]);
  await assert.rejects(db.exec(plan),/Shared source or review changed/);
  await db.exec('rollback');
  console.log('PASS persisted shared bridge review, repeat execution, archived ID guard, stale source guard and exact wording');
 }finally{
  await db.close();
  fs.unlinkSync(path.join(tmp,'review.json'));
  fs.rmdirSync(tmp);
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
