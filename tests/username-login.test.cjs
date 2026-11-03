const assert=require('node:assert/strict'),fs=require('node:fs'),Module=require('node:module'),swc=require('next/dist/build/swc');
async function main(){
 await swc.loadBindings();
 const {code}=await swc.transform(fs.readFileSync('lib/username-login.ts','utf8'),{filename:'username-login.ts',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});
 const stubs={'server-only':{},'./auth':{validEmail:s=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)&&s.length<=254},'./usernames':{normalizeUsername:s=>s.trim().toLowerCase(),validUsername:s=>/^[a-z][a-z0-9_]{2,29}$/.test(s)}};
 const mod=new Module(__filename,module);mod.filename=__filename;mod.paths=module.paths;mod.require=id=>id in stubs?stubs[id]:require(id);mod._compile(code,__filename);
 const {loginEmail}=mod.exports;let calls=0;
 const client={rpc:async(name,args)=>{calls++;assert.equal(name,'resolve_account_username');assert.equal(args.login_username,'my_name');return {data:'person@example.test',error:null};}};
 assert.equal(await loginEmail(client,'person@example.test'),'person@example.test');assert.equal(calls,0);
 delete process.env.USERNAME_LOOKUP_KEY;
 assert.equal(await loginEmail(client,'my_name'),null);assert.equal(calls,0,'Missing configuration must fail closed');
 process.env.USERNAME_LOOKUP_KEY='test-only-placeholder-not-a-real-credential';
 assert.equal(await loginEmail(client,' MY_Name '),'person@example.test');assert.equal(calls,1);
 assert.equal(await loginEmail(client,'bad name'),null);
 assert.equal(await loginEmail({rpc:async()=>({data:'person@example.test',error:{message:'denied'}})},'my_name'),null);
 assert.equal(await loginEmail({rpc:async()=>({data:'invalid-email',error:null})},'my_name'),null);
 delete process.env.USERNAME_LOOKUP_KEY;
 console.log('PASS: unchanged email login, server-only normalized alias lookup, missing-key failure and no email/error leakage');
}
main().catch(e=>{console.error(e);process.exitCode=1});
