const assert=require('node:assert/strict'),fs=require('fs'),Module=require('module'),swc=require('next/dist/build/swc');
(async()=>{
 await swc.loadBindings();const original=Module._load,rows={templates:[],holdings:[]};
 const catalogId='00000000-0000-4000-8000-000000000021';
 const catalog={id:catalogId,title:'Test',category:'Test',status:'published'};
 const entity=key=>({findOne:async({id})=>rows[key].find(x=>x.id===id),findAll:async()=>({records:rows[key]}),create:async({record})=>{const row={...record,id:key+'-'+rows[key].length};rows[key].push(row);return row;},update:async({id,record})=>Object.assign(rows[key].find(x=>x.id===id),record)});
 Module._load=function(id){if(id==='../compat/context')return {context:()=>({client:{from:()=>({select:()=>({eq:(_key,id)=>({single:async()=>({data:id===catalogId?catalog:null})})})})}})};if(id==='zitejs/backend')return {createEndpoint:x=>x,ZiteError:class extends Error{}};if(id==='zitejs/db')return {zite:{mutoonTextTemplates:entity('templates'),mutoonHoldings:entity('holdings')}};return original.apply(this,arguments);};
 require.extensions['.ts']=(m,p)=>m._compile(swc.transformSync(fs.readFileSync(p,'utf8'),{filename:p,jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}}).code,p);
 try{
  const template=require('../legacy/api/mutoonTemplates.ts').default,holding=require('../legacy/api/mutoonHoldings.ts').default;
  const context={user:{id:'owner'}},text=' \nأحمد عن محمد\n ',format=JSON.stringify([{start:2,end:6,text:'أحمد',bold:true,color:'primary',center:false,indent:0,sizePercent:85,lineSpacing:1.4,paragraphSpacing:8,firstLineIndent:6,alignment:'right'}]);
  await template.execute({context,input:{action:'save',name:'Test',kind:'introduction',body:text,formatting:format}});
  assert.equal(rows.templates[0].body,text);assert.equal(rows.templates[0].formatting,format);
  await template.execute({context,input:{action:'save',id:rows.templates[0].id,body:text+'next',formatting:format}});
  assert.equal(rows.templates[0].body,text+'next');
  await assert.rejects(()=>template.execute({context:{user:{id:'other'}},input:{action:'save',id:rows.templates[0].id,body:'not allowed'}}));
  const holdingInput={action:'save',name:'Test',category:'Test',sanadText:text,wordingText:text,sanadFormatting:format};
  await assert.rejects(()=>holding.execute({context,input:holdingInput}),/اختر متنًا منشورًا/);
  await holding.execute({context,input:{...holdingInput,catalogId}});
  assert.equal(rows.holdings[0].sanadText,text);assert.equal(rows.holdings[0].wordingText,text);assert.equal(rows.holdings[0].sanadFormatting,format);
  await assert.rejects(()=>holding.execute({context,input:{action:'save',name:'Blank',category:'Test',sanadText:'  \n '}}));
  const presentation=JSON.stringify({version:2,formats:JSON.parse(format),heading:{version:1,mainHeightPt:60,secondaryHeightPt:30,lineGapMm:4,afterGapMm:8}});await holding.execute({context,input:{action:'save',id:rows.holdings[0].id,sanadFormatting:presentation}});assert.equal(rows.holdings[0].sanadFormatting,presentation);await holding.execute({context,input:{action:'save',id:rows.holdings[0].id,wordingText:'Updated'}});assert.equal(rows.holdings[0].sanadFormatting,presentation,'unrelated edits preserve saved heading');
  rows.holdings.push({id:'legacy',ownerId:'owner',name:'Legacy',category:'Test',sanadText:text});
  await holding.execute({context,input:{action:'save',id:'legacy',name:'Renamed legacy'}});
  assert.equal(rows.holdings.at(-1).name,'Renamed legacy');
  console.log('PASS: template/holding save-reopen preserves exact text and formatting offsets; blank text and other-owner update denied');
 }finally{Module._load=original;}
})().catch(e=>{console.error(e);process.exitCode=1});
