const assert=require('node:assert/strict');
const fs=require('node:fs');
// Start a fresh, localhost-only PostgreSQL cluster on port 35439 with
// -c asaneed.qa_disposable=matn-review. Install pg in external test tooling
// and expose it through NODE_PATH, as in the release QA PostgreSQL fixture.
const {Client}=require('pg');
const connection={host:'127.0.0.1',user:require('node:os').userInfo().username,port:35439,database:'postgres',statement_timeout:10000};
(async()=>{
 const a=new Client(connection), b=new Client(connection);
 await Promise.all([a.connect(),b.connect()]);
 try {
  assert.equal((await a.query("select current_setting('asaneed.qa_disposable',true) as marker")).rows[0].marker,'matn-review');
  for(const file of ['tests/fixtures/catalog-database.sql','supabase/migrations/20261104125019_unified_matn_catalog.sql'])await a.query(fs.readFileSync(file,'utf8'));
  await a.query("update accounts set role='admin' where display_name='Other shaykh'");
  const actor=async(db,n)=>{await db.query('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",['10000000-0000-4000-8000-00000000000'+n]);await db.query('set role authenticated');};
  await actor(a,2);
  const {rows:[{id}]}=await a.query('select submit_matn_request($1) id',[{title:'متن للاختبار',category:'الفقه'}]);
  await Promise.all([actor(a,1),actor(b,3)]);
  const {rows:[{pid}]}=await b.query('select pg_backend_pid() pid');
  await a.query('begin');
  const {rows:[{catalog_id}]}=await a.query("select review_matn_request($1,'approved') catalog_id",[id]);
  const second=assert.rejects(b.query("select review_matn_request($1,'rejected',null,null,'Synthetic')",[id]),/Pending request required/);
  let blocked=false;
  for(let i=0;i<50&&!blocked;i++){
   blocked=(await a.query('select pg_backend_pid()=any(pg_blocking_pids($1)) blocked',[pid])).rows[0].blocked;
   if(!blocked)await new Promise(resolve=>setTimeout(resolve,20));
  }
  await a.query('commit');
  await second;
  assert.ok(blocked);
  assert.deepEqual((await a.query('select status,catalog_id,(select count(*)::int from content_audit where target_id=$1) decisions from matn_requests where id=$1',[id])).rows,[{status:'approved',catalog_id,decisions:1}]);
  assert.equal((await a.query('select count(*)::int n from matn_catalog')).rows[0].n,1);
  console.log('PASS two authenticated admins, observed lock wait, one publication and one audit decision');
 }finally{await Promise.all([a.end(),b.end()]);}
})().catch(e=>{console.error(e);process.exitCode=1});
