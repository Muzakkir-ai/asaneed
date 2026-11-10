const assert = require('node:assert/strict');
const fs = require('node:fs');
const { Client } = require('pg');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const migrations = path.resolve(__dirname, '../supabase/migrations');
const dataDir = process.env.ASANEED_QA_DATA_DIR;
assert.ok(dataDir && path.isAbsolute(dataDir), 'Set ASANEED_QA_DATA_DIR to a dedicated local PostgreSQL data directory');
const files = fs.readdirSync(migrations).filter(f => f.endsWith('.sql')).sort();
const candidate = files.filter(f => f >= '20261109221703');
const id = n => 'f1210000-0000-4000-8000-' + String(n).padStart(12, '0');
const [admin, issuer, other, recipient, stranger, disabled] = [1,2,3,4,5,6].map(id);
const [owned, foreign, student, historical, first, second, third] = [12,13,14,15,16,17,18].map(id);
const connect = async database => {
  const client = new Client({host:'127.0.0.1',port:35432,user:require('node:os').userInfo().username,database,statement_timeout:10000});
  await client.connect();
  return client;
};
const row = async (db, sql, args) => (await db.query(sql,args)).rows[0];
const migrate = (db, file) => db.query(fs.readFileSync(path.join(migrations,file),'utf8'));
const apply = async (db, list) => { for (const file of list) await migrate(db,file); };
const actor = async (db, uid) => {
  await db.query('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[uid]);
  await db.query('set role authenticated');
};
const verify = async (db, number) => (await row(db,'select public.verify_ijazah($1) as result',[number])).result;
const token = async (db, value) => (await row(db,'select public.verify_certificate_token($1) as result',[value])).result;
const issue = async (db, cert, chain, printMode='number') => (await row(db,
  'select public.finalize_certificate($1,$2) as number',[cert,{chain,formatting:JSON.stringify({printMode})}])).number;
const state = (db, cert) => row(db,`select to_jsonb(c) as certificate,s.content,to_jsonb(v) as projection
  from public.certificates c left join public.certificate_snapshots s on c.id=s.certificate_id
  left join private.ijazah_verification_index v on c.id=v.certificate_id where c.id=$1`,[cert]);
async function bootstrap(db,list) {
  await db.query(`create schema auth;
    create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb,raw_app_meta_data jsonb);
    create function auth.uid() returns uuid language sql as $$
      select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),
        nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid
    $$;
    grant usage on schema auth to anon,authenticated;`);
  await db.query('insert into auth.users(id) select unnest($1::uuid[])',[[admin,issuer,other,recipient,stranger,disabled]]);
  for (const file of list) {
    if (file.startsWith('20261029035054')) {
      await db.query(`insert into public.issuers(id,display_name,issuer_code) values
       ('b6e2ffe2-a5c5-4a20-881f-c29a495e2bc7','Synthetic prerequisite A','93'),
       ('9d28ba95-2b03-438e-b570-787ea46fceb2','Synthetic prerequisite B','94'),
       ('d5044cff-5782-4117-9ec4-109c2da93050','Synthetic prerequisite C','95')`);
    }
    await migrate(db,file);
    if(file.startsWith('20261027195210')) {
      await db.query("insert into public.accounts(id,auth_user_id,display_name,role,active) values($1,$2,'Synthetic admin','admin',true)",[id(51),admin]);
      await db.query(`insert into public.accounts(id,auth_user_id,display_name,role,active)
        select x.id,x.uid,'Synthetic actor',x.role,true
        from unnest($1::uuid[],$2::uuid[],$3::text[]) x(id,uid,role)`,
        [[52,53,54,55,56].map(id),[issuer,other,recipient,stranger,disabled],['shaykh','shaykh','student','student','shaykh']]);

    }
  }
  await db.query('update public.accounts set can_issue=false where auth_user_id=$1',[disabled]);
}
const schema = async db => (await db.query(`select kind, object, definition from (
 select 'function' as kind,n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')' as object,
   pg_get_functiondef(p.oid)||coalesce(p.proacl::text,'') as definition
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.prokind='f'
 union all select 'policy',schemaname||'.'||tablename||'.'||policyname,to_jsonb(p)::text
 from pg_policies p where schemaname in ('public','private')
 union all select 'relation',n.nspname||'.'||c.relname,c.relkind::text||c.relrowsecurity::text||coalesce(c.relacl::text,'')
 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private')
 union all select 'column',table_schema||'.'||table_name||'.'||column_name,(to_jsonb(c)-ARRAY['table_catalog','udt_catalog','domain_catalog','scope_catalog','collation_catalog'])::text
 from information_schema.columns c where table_schema in ('public','private')
 ) s order by kind,object`)).rows;

async function run() {
  const ctl = await connect('postgres');
  const sessions = [];
  const created = [];
  const open = async name => { const db = await connect(name); sessions.push(db); return db; };
  const suffix = Date.now().toString(36);
  const upgraded = 'qa121_upgrade_'+suffix;
  const fresh = 'qa121_fresh_'+suffix;
  const names = [upgraded,fresh];
  try {
    const server = await row(ctl,`select current_setting('data_directory') as directory,
      current_setting('asaneed.qa_disposable',true) as disposable`);
    assert.equal(server.directory,fs.realpathSync(dataDir));
    assert.equal(server.disposable,'release-qa');
    for (const role of ['anon','authenticated','service_role']) {
      if (!await row(ctl,'select rolname from pg_roles where rolname=$1',[role])) await ctl.query('create role '+role);
    }
    for(const name of names) {
      await ctl.query('create database '+name);
      created.push(name);
    }
    const a = await open(upgraded), b = await open(fresh);
    await bootstrap(a,files.filter(f=>!candidate.includes(f)));
    await bootstrap(b,files);
    const baselineFinalizer = (await row(a,"select pg_get_functiondef('private.finalize_certificate(uuid,jsonb)'::regprocedure) as sql")).sql;
    await a.query(`insert into public.issuers(id,display_name,issuer_code) values ($1,'Synthetic issuer A','92'),($2,'Synthetic issuer B','91')`,[owned,foreign]);
    await a.query('insert into public.issuer_accounts values ($1,$3),($2,$4),($1,$5)',[owned,foreign,id(52),id(53),id(56)]);
    await a.query("insert into public.students(id,display_name) values ($1,'Synthetic recipient')",[student]);
    await a.query(`insert into public.certificates(id,issuer_id,student_id,riwayah_code,completion_date)
      select x,$1,$2,'10','2098-01-01'::date + (ord-1)::int from unnest($3::uuid[]) with ordinality t(x,ord)`,
      [owned,student,[historical,first,second,third]]);
    await actor(a,admin);
    await a.query('select public.set_student_account($1,$2)',[student,id(54)]);
    const oldNumber = await issue(a,historical,'Historical synthetic chain','qr');
    await a.query('reset role');
    const old = await state(a,historical);
    await apply(a,candidate);
    assert.deepEqual(await state(a,historical),old);
    assert.deepEqual(await schema(a),await schema(b));
    console.log('PASS all '+files.length+' migrations: fresh vs upgrade functions, policies, grants, relations and columns; historical snapshot unchanged');
    await actor(a,issuer);
    assert.ok(await row(a,'select id from public.certificates where id=$1',[first]));
    for (const uid of [other,recipient,stranger]) {
      await actor(a,uid);
      assert.equal(await row(a,'select id from public.certificates where id=$1',[first]),undefined);
      await assert.rejects(issue(a,first,'Denied'),{code:'42501'});
    }
    await actor(a,disabled);
    await assert.rejects(issue(a,first,'Disabled'),{code:'42501'});
    const peer = await open(upgraded);
    await actor(a,issuer); await actor(peer,issuer);
    await a.query('begin');
    const newNumber = await issue(a,first,'First approval wins');
    const pending = issue(peer,first,'Concurrent approval must lose').then(number=>({number}),error=>({error}));
    let waiting;
    for(let i=0;i<50&&!waiting;i++) {
      const status=await row(ctl,"select wait_event_type from pg_stat_activity where pid=$1",[peer.processID]);
      waiting=status?.wait_event_type==='Lock';
      if(!waiting) await new Promise(resolve=>setTimeout(resolve,20));
    }
    await a.query('commit');
    const concurrent=await pending;
    if(concurrent.error) throw concurrent.error;
    assert.ok(waiting,'Second session waited on a PostgreSQL lock');
    assert.equal(concurrent.number,newNumber);
    const [number2,number3] = await Promise.all([issue(a,second,'Distinct A'),issue(peer,third,'Distinct B')]);
    assert.equal(new Set([newNumber,number2,number3]).size,3);
    await a.query('reset role');
    const frozen = await state(a,first);
    assert.equal(frozen.content.chain,'First approval wins');
    assert.deepEqual(await state(a,historical),old);
    for (const uid of [issuer,recipient,other,stranger]) {
      await actor(a,uid);
      const canRead = uid===issuer||uid===recipient;
      assert.equal(Boolean(await row(a,'select id from public.certificates where id=$1',[first])),canRead);
      assert.equal(Boolean(await row(a,'select certificate_id from public.certificate_snapshots where certificate_id=$1',[first])),canRead);
      if(uid!==issuer) await assert.rejects(issue(a,first,'Denied retry'),{code:'42501'});
    }
    console.log('PASS assigned issuer and linked recipient reads, unrelated and disabled denial, same-draft lock wait, distinct concurrent approval and immutable retry');
    await actor(a,admin);
    const started = performance.now();
    const backup = (await row(a,'select public.full_application_backup() as data')).data;
    await actor(b,admin);
    const restore = () => row(b,'select public.restore_application_backup($1,false) as result',[backup]);
    await assert.rejects(restore(),{code:'23505',constraint:'issuers_issuer_code_key'});
    assert.equal((await row(b,'select count(*)::int as total from public.certificates')).total,0);
    await b.query('reset role');
    // The independent replay seeded an empty code-02 placeholder with a different ID.
    await b.query("delete from public.issuer_accounts where issuer_id=(select id from public.issuers where issuer_code='02')");
    const placeholders = await b.query(`delete from public.issuers i
      using jsonb_populate_recordset(null::public.issuers,$1) source
      where i.issuer_code=source.issuer_code and i.id<>source.id returning i.issuer_code`,[JSON.stringify(backup.issuers)]);
    assert.deepEqual(placeholders.rows,[{issuer_code:'02'}]);
    await actor(b,admin);
    assert.equal((await restore()).result.success,true);

    await b.query('reset role');
    for(const cert of [historical,first,second,third]) {
      await a.query('reset role');
      assert.deepEqual(await state(b,cert),await state(a,cert));
    }
    for(const table of ['annual_issuer_counters','annual_certificate_allocations']) {
      assert.deepEqual((await b.query('select * from private.'+table+' where issuer_id=$1 order by 1,2',[owned])).rows,
        (await a.query('select * from private.'+table+' where issuer_id=$1 order by 1,2',[owned])).rows);
    }
    await actor(b,recipient);
    assert.ok(await row(b,'select certificate_id from public.certificate_snapshots where certificate_id=$1',[first]));
    await actor(b,stranger);
    assert.equal(await row(b,'select certificate_id from public.certificate_snapshots where certificate_id=$1',[first]),undefined);
    await b.query('reset role; set role anon');
    assert.equal((await verify(b,newNumber)).status,'verified');
    assert.equal((await token(b,old.certificate.verification_token)).certificate.registrationNumber,oldNumber);
    console.log('PASS application JSON backup and restore into separate database with exact certificates, snapshots, projection, counters, access and tokens ('+Math.round(performance.now()-started)+' ms)');
    await b.query('reset role');
    await b.query(baselineFinalizer);
    await actor(b,issuer);
    await assert.rejects(issue(b,first,'Rollback retry must preserve snapshot'),/already finalized/);
    await b.query('reset role');
    assert.deepEqual(await state(b,first),frozen);
    await migrate(b,candidate.at(-1));
    await actor(b,issuer);
    assert.equal(await issue(b,first,'Reapplied retry must preserve snapshot'),newNumber);
    await b.query('reset role; set role anon');
    assert.equal((await verify(b,newNumber)).status,'verified');
    assert.equal((await token(b,old.certificate.verification_token)).verified,true);
    console.log('PASS scoped rollback to main finalization function and reapply; issued snapshot, registration number and historical link retained');
  } finally {
    await Promise.all(sessions.map(db=>db.end()));
    for(const name of created) await ctl.query('drop database '+name);
    await ctl.end();
  }
}
run().catch(error=>{console.error(error);process.exitCode=1;});
