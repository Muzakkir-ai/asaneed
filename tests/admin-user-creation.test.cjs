const assert=require('node:assert/strict'),fs=require('node:fs'),Module=require('node:module'),swc=require('next/dist/build/swc');
async function main(){
 await swc.loadBindings();let admin=false,signupCalls=0;
 const records=[{id:'actor',authUserId:'actor-auth',name:'Actor',email:'actor@example.test',role:'Admin',active:true}],rows=[{id:'actor',auth_user_id:'actor-auth',username:'actor_name'}];
 const ctx={user:{id:'actor-auth',email:'actor@example.test'},cache:new Map(),client:{from:()=>({select:()=>{const q={eq:(key,value)=>({maybeSingle:async()=>({data:rows.find(r=>r[key]===value)||null,error:null}),single:async()=>({data:rows.find(r=>r[key]===value)||null,error:null})}),then:(resolve,reject)=>Promise.resolve({data:rows,error:null}).then(resolve,reject)};return q;}}),rpc:async(name,args)=>{if(name==='admin_set_account_username')rows.find(r=>r.id===args.target_account).username=args.new_username;return {data:[],error:null};}}};
 const zite={appUsers:{findAll:async()=>({records}),update:async({id,record})=>Object.assign(records.find(r=>r.id===id),record)}};
 const stubs={'@supabase/supabase-js':{createClient:(url,key,options)=>{assert.deepEqual(options.auth,{persistSession:false,autoRefreshToken:false});return {auth:{signUp:async()=>{signupCalls++;rows.push({id:'new-account',auth_user_id:'new-auth',username:''});records.push({id:'new-account',authUserId:'new-auth',name:'New',email:'new@example.test',role:'Student',active:false});return {data:{user:{id:'new-auth',identities:[{}]},session:null},error:null};}}};}},'../../lib/auth':{appOrigin:'https://asaneed.vercel.app'},'../compat/context':{context:()=>ctx},'zitejs/backend':{createEndpoint:v=>v,ZiteError:Error},'zitejs/db':{zite},'../lib/admin':{isAppAdmin:async()=>admin}};
 const {code}=await swc.transform(fs.readFileSync('legacy/api/manageUsers.ts','utf8'),{filename:'manageUsers.ts',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});
 const mod=new Module(__filename,module);mod.filename=__filename;mod.paths=module.paths;mod.require=id=>id in stubs?stubs[id]:require(id);mod._compile(code,__filename);const endpoint=mod.exports.default;
 const call=value=>endpoint.execute({input:endpoint.inputSchema.parse(value),context:ctx});
 await assert.rejects(()=>call({action:'create',name:'New',email:'new@example.test',password:'test-password'}));assert.equal(signupCalls,0);
 admin=true;
 await assert.rejects(()=>call({action:'create',name:'Actor',email:'actor@example.test',password:'test-password'}),/حساب بالفعل/);assert.equal(signupCalls,0);
 const result=await call({action:'create',name:'New',email:'new@example.test',password:'test-password',username:'new_user',role:'Shaykh'});
 assert.equal(signupCalls,1);assert.equal(result.createdUserId,'new-account');assert.equal(result.users.find(u=>u.id==='new-account').username,'new_user');assert.equal(records[1].role,'Shaykh');assert.equal(ctx.user.id,'actor-auth');
 await call({action:'username',id:'new-account',username:'changed_name'});assert.equal(rows[1].username,'changed_name');
 console.log('PASS: admin-only account creation, duplicate protection, role/username assignment and unchanged administrator session');
}
main().catch(e=>{console.error(e);process.exitCode=1});
