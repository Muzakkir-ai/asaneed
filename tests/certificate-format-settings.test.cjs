const assert=require('node:assert/strict'),fs=require('node:fs'),Module=require('node:module'),path=require('node:path'),swc=require('next/dist/build/swc');
(async()=>{
 await swc.loadBindings();let saved=null;
 const zite={asaneed:{findOne:async()=>({id:'sanad',shaykh:['owner']})},sanadPrintStyles:{findAll:async()=>({records:saved?[saved]:[]}),create:async({record})=>(saved={id:'style',...record}),update:async({record})=>Object.assign(saved,record)}};
 const load=async(file)=>{const {code}=await swc.transform(fs.readFileSync(file,'utf8'),{filename:file,jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});const mod=new Module(path.resolve(file),module);mod.paths=module.paths;mod.require=id=>id==='zitejs/backend'?{createEndpoint:x=>x}:id==='zitejs/db'?{zite}:id.startsWith('../')?{}:require(id);mod._compile(code,path.resolve(file));return mod.exports.default;};
 const draft=await load('legacy/api/sanadPrintStyle.ts'),final=await load('legacy/api/finalizeCertificate.ts');
 const t={font:'KSA Regular',size:9.5,color:'primary',scalePercent:85,lineSpacing:1.4,paragraphSpacing:8,firstLineIndent:6,alignment:'right'};
 const settings={borderColor:'#123456',accentColor:'#654321',typography:{reading:t,sanad:t,conclusion:{...t,alignment:'center'},shaykh:t},phrases:[]};
 const input=draft.inputSchema.parse({action:'save',sanadId:'sanad',settings});
 await draft.execute({context:{user:{id:'owner'}},input});
 const reopened=draft.outputSchema.parse(await draft.execute({context:{user:{id:'owner'}},input:{action:'get',sanadId:'sanad'}}));
 assert.deepEqual(reopened.settings,settings);
 const frozen=final.inputSchema.parse({certificateId:'draft',settings:reopened.settings});assert.deepEqual(frozen.settings,settings);
 await assert.rejects(()=>draft.execute({context:{user:{id:'other'}},input}));
 for(const patch of [{scalePercent:0},{lineSpacing:10},{paragraphSpacing:-1},{firstLineIndent:100}])assert.equal(draft.inputSchema.safeParse({...input,settings:{...settings,typography:{...settings.typography,sanad:{...t,...patch}}}}).success,false);
 console.log('PASS: actual print-style endpoint saves/reopens all layout controls, finalization preserves them, unauthorized writes and invalid values denied');
})().catch(e=>{console.error(e);process.exitCode=1});
