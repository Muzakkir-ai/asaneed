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
  const server={createClient:async()=>client};
  const assignment=await load('app/api/workspace-scope/route.ts',{'../../../lib/bounded-json':bounded,'../../../lib/supabase/server':server,'../../../legacy/lib/issuerNames':{}});
  const assign=(headers={},body=JSON.stringify({accountId,issuerId,enabled:true}))=>assignment.POST(post('/api/workspace-scope',body,headers));
  assert.equal((await assign()).status,401);
  uid=authId;
  for(const a of [null,{role:'admin',active:false},{role:'student',active:true},{role:'shaykh',active:true}]){actor=a&&{id:actorId,...a};assert.equal((await assign()).status,403);}
  actor={id:actorId,role:'admin',active:true};
  for(const h of [{'x-workspace-account':accountId},{'x-workspace-account':accountId,'x-workspace-edit':'confirmed'},{origin:'https://other.invalid'}])assert.equal((await assign(h)).status,403);
  assert.equal((await assign({},'{')).status,400);
  assert.equal((await assign({},JSON.stringify({accountId:'invalid',issuerId,enabled:true}))).status,400);
  const oversized=()=>new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('ع'.repeat(2600)));c.close();}});
  assert.equal((await assign({},oversized())).status,413);
  assert.equal((await assign({'content-length':'5001'})).status,413);
  assert.deepEqual(calls,[]);
  assert.equal((await assign({'x-workspace-account':actorId})).status,200);
  assert.deepEqual(calls.pop(),['set_issuer_assignment',{target:accountId,issuer:issuerId,enabled:true}]);
  assert.equal((await assign()).status,200);
  actor.role='student';assert.equal((await assign()).status,403);
  actor.role='admin';rpcError={code:'42501',message:'private diagnostic'};assert.equal((await assign()).status,403);
  rpcError={code:'XX000',message:'private diagnostic'};const response=await assign();assert.equal(response.status,500);assert.doesNotMatch(await response.text(),/private diagnostic/);
}
(async()=>{await swc.loadBindings();await workspaceTests();console.log('PASS issuer assignment actor/target boundary, streamed byte limit and sanitized errors');})().catch(e=>{console.error(e);process.exitCode=1;});
