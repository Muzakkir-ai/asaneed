const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const swc = require('next/dist/build/swc');

async function load(file, stubs = {}) {
  const {code} = await swc.transform(fs.readFileSync(file, 'utf8'), {
    filename:file, jsc:{parser:{syntax:'typescript'}}, module:{type:'commonjs'},
  });
  const mod = new Module(__filename,module);
  mod.paths = module.paths;
  mod.require = id=>Object.hasOwn(stubs,id) ? stubs[id] : require(id);
  mod._compile(code,__filename);
  return mod.exports;
}

const origin = 'https://asaneed.example.invalid';
const post = (path,body,headers={})=>new Request(origin+path,{
  method:'POST',headers:{origin,...headers},
  ...(typeof body==='string' ? {body} : {body,duplex:'half'}),
});

async function workspaceTests() {
  const actorId = '10000000-0000-4000-8000-000000000001';
  const accountId = '10000000-0000-4000-8000-000000000002';
  const issuerId = '10000000-0000-4000-8000-000000000003';
  const authId = '20000000-0000-4000-8000-000000000001';
  let uid = null;
  let actor;
  let rpcError;
  const calls = [];
  const client = {
    auth:{
      getClaims:async()=>({data:{claims:uid ? {sub:uid} : null}}),
      getUser:async()=>({data:{user:uid ? {id:uid} : null}}),
    },
    from:table=>{
      assert.equal(table,'accounts');
      return {select:()=>({eq:(key,value)=>{
        assert.equal(key,'auth_user_id');
        assert.equal(value,authId);
        const get = async()=>({data:actor});
        return {single:get,maybeSingle:get};
      }})};
    },
    rpc:async(name,args)=>{
      calls.push([name,args]);
      return {data:[],error:rpcError};
    },
  };
  const bounded = await load('lib/bounded-json.ts');
  const scope = await load('lib/workspace-scope.ts');
  const server = {createClient:async()=>client};
  const assignment = await load('app/api/workspace-scope/route.ts',{
    '../../../lib/bounded-json':bounded,'../../../lib/supabase/server':server,
    '../../../legacy/lib/issuerNames':{},
  });
  const setup = await load('app/api/account-setup/route.ts',{
    '../../../lib/bounded-json':bounded,'../../../lib/supabase/server':server,
    '../../../lib/account-setup':{newSetupCode:()=> 'fixture-code',hashSetupCode:()=> 'fixture-hash'},
  });
  const workspace = await load('app/api/workspace/[endpoint]/route.ts',{
    '../../../../lib/bounded-json':bounded,'../../../../lib/supabase/server':server,
    '../../../../lib/issuance-target':{issuanceTargetScope:async(_client,value)=>value},
    '../../../../lib/workspace-scope':{
      ...scope,
      resolveWorkspaceScope:async(_client,_actor,request)=>{
        const inspection = Boolean(request.headers.get('x-workspace-account'));
        return {inspection,readOnly:inspection,authUserId:inspection?'target-auth':authId};
      },
    },
    '../../../../legacy/compat/context':{requestContext:{run:(context,execute)=>{
      assert.equal(context.account.id,actorId);
      assert.equal(context.user.id,context.scope.authUserId);
      return execute();
    }}},
    '../../../../legacy/compat/endpoints':{endpoints:Object.fromEntries(
      ['getDashboard','saveProfile','manageUsers','prepareIjazah'].map(key=>[key,{invoke:async()=>({ok:true})}]).concat([['verifyCertificate',{inputSchema:{parse:value=>{if(typeof value?.token!=='string')throw Error('invalid');return value;}}}]]),
    )},
  });
  const assign = (headers,body=JSON.stringify({accountId,issuerId,enabled:true}))=>
    assignment.POST(post('/api/workspace-scope',body,headers));
  const revoke = (headers,body=JSON.stringify({action:'revoke',username:'fixture_user'}))=>
    setup.POST(post('/api/account-setup',body,headers));
  const call = (endpoint,headers={},body='{}')=>
    workspace.POST(post('/api/workspace/'+endpoint,body,headers),{params:Promise.resolve({endpoint})});
  assert.equal((await assign()).status,401);
  assert.equal((await revoke()).status,401);
  assert.equal((await call('getDashboard')).status,401);
  uid = authId;
  for (const account of [null,{role:'student',active:false},{role:'shaykh',active:false},{role:'student',active:true},{role:'shaykh',active:true,can_issue:false},{role:'shaykh',active:true,can_issue:true}]) {
    actor = account && {id:actorId,...account};
    assert.equal((await assign()).status,403);
    assert.equal((await revoke()).status,403);
    assert.equal((await call('getDashboard')).status,account?.active ? 200 : 403);
    assert.equal((await call('prepareIjazah')).status,account?.can_issue ? 200 : 403);
  }
  actor = {id:actorId,role:'admin',active:true,can_issue:true};
  const inspection = {'x-workspace-account':accountId};
  for (const headers of [inspection,{...inspection,'x-workspace-edit':'confirmed'}]) {
    assert.equal((await assign(headers)).status,403);
    assert.equal((await revoke(headers)).status,403);
  }
  assert.equal((await call('getDashboard',inspection)).status,200);
  assert.equal((await call('saveProfile',inspection)).status,403);
  assert.equal((await call('manageUsers',inspection)).status,403);
  for(const key of ['constructor','__proto__','toString'])assert.equal((await call(key)).status,404);
  for(const body of ['null','[]','false','{'])assert.equal((await call('getDashboard',{},body)).status,400);
  assert.equal((await assign({origin:'https://other.invalid'})).status,403);
  assert.equal((await assign({},'{')).status,400);
  assert.equal((await revoke({},'null')).status,400);
  const oversized = ()=>new ReadableStream({start(controller){
    controller.enqueue(new TextEncoder().encode('ع'.repeat(2600)));
    controller.close();
  }});
  assert.equal((await assign({},oversized())).status,413);
  assert.equal((await revoke({},oversized())).status,413);
  assert.equal((await call('getDashboard',{'content-length':'15000001'})).status,413);
  const big=()=>new ReadableStream({start(c){const chunk=new TextEncoder().encode('ع'.repeat(500000));for(let i=0;i<16;i++)c.enqueue(chunk);c.close();}});
  assert.equal((await call('getDashboard',{},big())).status,413);
  assert.equal((await call('verifyCertificate',{},big())).status,413);
  assert.deepEqual(calls,[]);
  assert.equal((await call('verifyCertificate',{},JSON.stringify({token:'fixture-token'}))).status,200);
  assert.deepEqual(calls.pop(),['verify_certificate_token',{token:'fixture-token'}]);
  assert.equal((await assign({'x-workspace-account':actorId})).status,200);
  assert.deepEqual(calls.pop(),['set_issuer_assignment',{target:accountId,issuer:issuerId,enabled:true}]);
  const setupGet=(query='',headers={})=>setup.GET(new Request(origin+'/api/account-setup'+query,{headers}));
  assert.equal((await setupGet('?issuerId=bad')).status,400);
  assert.equal((await setupGet('',inspection)).status,403);
  assert.equal((await setupGet()).headers.get('cache-control'),'no-store');
  assert.deepEqual(calls.pop(),['manage_account_setup',{action:'list',record:{}}]);
  const beforeKey=process.env.USERNAME_LOOKUP_KEY;process.env.USERNAME_LOOKUP_KEY='fixture-only-'.repeat(5);
  try{const created=await revoke({},JSON.stringify({action:'create',username:'fixture_user',name:'Synthetic student',role:'student'}));assert.equal(created.status,200);assert.equal((await created.json()).code,'fixture-code');assert.equal(created.headers.get('cache-control'),'no-store');const creation=calls.pop();assert.equal(creation[0],'manage_account_setup');assert.equal(creation[1].record.codeHash,'fixture-hash');assert.equal(calls.pop()[0],'account_setup_state');}finally{if(beforeKey===undefined)delete process.env.USERNAME_LOOKUP_KEY;else process.env.USERNAME_LOOKUP_KEY=beforeKey;}
  assert.equal((await revoke()).status,200);
  assert.deepEqual(calls.pop(),['manage_account_setup',{action:'revoke',record:{username:'fixture_user'}}]);
  actor.role = 'student';
  assert.equal((await assign()).status,403,'Open session uses current account role');
  actor.role = 'admin';
  rpcError = {code:'42501',message:'private diagnostic'};
  assert.equal((await assign()).status,403);
  rpcError = {code:'XX000',message:'private diagnostic'};
  for (const response of [await assign(),await revoke()]) {
    assert.equal(response.status,500);
    assert.doesNotMatch(await response.text(),/private diagnostic/);
  }
}


(async()=>{await swc.loadBindings();await workspaceTests();console.log('PASS: onboarding invitation creation/revocation, role gates, inspection, own-property dispatch, public verification and streamed byte limits');})().catch(e=>{console.error(e);process.exitCode=1;});
