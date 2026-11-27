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
    '../../../lib/account-setup':{},
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
      ['getDashboard','saveProfile','manageUsers','prepareIjazah'].map(key=>[key,{invoke:async()=>({ok:true})}]),
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
  assert.equal((await call('constructor')).status,404);
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
  assert.deepEqual(calls,[]);
  assert.equal((await assign({'x-workspace-account':actorId})).status,200);
  assert.deepEqual(calls.pop(),['set_issuer_assignment',{target:accountId,issuer:issuerId,enabled:true}]);
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

async function authTests() {
  const email = 'fixture@example.invalid';
  let authenticated = false;
  let setupCookie = null;
  let passwordChanges = 0;
  let recoveryRequests = 0;
  const auth = {
    signUp:async input=>{
      assert.deepEqual(input.options.data,{display_name:'Synthetic student'});
      return {data:{session:null},error:null};
    },
    resetPasswordForEmail:async(address,{redirectTo})=>{
      assert.equal(address,email);
      assert.equal(redirectTo,origin+'/auth/callback?flow=recovery');
      recoveryRequests++;
      return {error:null};
    },
    exchangeCodeForSession:async()=>({error:new Error('Missing browser verifier')}),
    verifyOtp:async({token_hash,type})=>{
      authenticated = token_hash==='fixture-token' && ['email','recovery'].includes(type);
      return {error:authenticated ? null : new Error('Expired fixture')};
    },
    getUser:async()=>({data:{user:authenticated ? {email} : null}}),
    updateUser:async()=>{passwordChanges++;return {error:null};},
    signOut:async()=>{authenticated=false;},
  };
  const server = {createClient:async()=>({auth})};
  const authConfig = {appOrigin:origin,validEmail:value=>value===email,validPassword:value=>value.length>=8};
  const setup = {readSetupCookie:async()=>setupCookie};
  const routeStubs = {'../../../lib/account-setup':setup,'../../../lib/supabase/server':server,'../../../lib/auth':authConfig};
  const confirm = await load('app/auth/confirm/route.ts',routeStubs);
  const callback = await load('app/auth/callback/route.ts',routeStubs);
  const login = await load('app/login/actions.ts',{
    '../../lib/account-setup':setup,'../../lib/supabase/server':server,'../../lib/auth':authConfig,
    '../../lib/username-login':{loginEmail:async(_client,value)=>value==='fixture_user' ? email : null},
    'next/navigation':{redirect:location=>{throw Object.assign(new Error('Redirect'),{location});}},
  });
  const confirmAt = async query=>(await confirm.GET({nextUrl:new URL(origin+'/auth/confirm?'+query)})).headers.get('location');
  const form = values=>{const body=new FormData();for(const [key,value] of Object.entries(values))body.set(key,value);return body;};
  const password = {password:'fixture-password',confirmPassword:'fixture-password'};
  const redirectsTo = location=>error=>error.location===location;
  await assert.rejects(()=>login.register(form({name:'Synthetic student',email,...password})),redirectsTo('/login?notice=signup'));
  for(const identifier of ['unknown','fixture_user']) {
    await assert.rejects(()=>login.requestReset(form({email:identifier})),redirectsTo('/forgot-password?notice=sent'));
  }
  assert.equal(recoveryRequests,1);
  await assert.rejects(()=>login.updatePassword(form(password)),redirectsTo('/forgot-password?error=expired'));
  assert.equal(passwordChanges,0);
  assert.equal(await confirmAt('token_hash=expired&type=recovery'),origin+'/login?error=expired');
  assert.equal(await confirmAt('token_hash=fixture-token&type=recovery'),origin+'/reset-password');
  await assert.rejects(()=>login.updatePassword(form(password)),redirectsTo('/login?notice=password'));
  assert.equal(passwordChanges,1);
  assert.equal(authenticated,false);
  assert.equal(await confirmAt('token_hash=fixture-token&type=email'),origin+'/studio');
  setupCookie = {username:'fixture_user',code:'fixture-code'};
  assert.equal(await confirmAt('token_hash=fixture-token&type=email'),origin+'/activate-account');
  const wrongBrowser = await callback.GET({nextUrl:new URL(origin+'/auth/callback?code=fixture')});
  assert.equal(wrongBrowser.headers.get('location'),origin+'/login?error=expired');
}

(async()=>{
  await swc.loadBindings();
  await workspaceTests();
  await authTests();
  console.log('PASS: onboarding handlers, recovery, role boundaries, read-only inspection, actor/target IDs, byte limits and safe errors');
})().catch(error=>{console.error(error);process.exitCode=1;});
