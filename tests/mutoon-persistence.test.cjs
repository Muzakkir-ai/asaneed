const assert=require('node:assert/strict'),fs=require('fs'),Module=require('module'),swc=require('next/dist/build/swc');
(async()=>{
 await swc.loadBindings();const original=Module._load,rows={templates:[],holdings:[]};
 const entity=key=>({findOne:async({id})=>rows[key].find(x=>x.id===id),findAll:async()=>({records:rows[key]}),create:async({record})=>{const row={...record,id:key+'-'+rows[key].length};rows[key].push(row);return row;},update:async({id,record})=>Object.assign(rows[key].find(x=>x.id===id),record)});
 Module._load=function(id){if(id==='zitejs/backend')return {createEndpoint:x=>x,ZiteError:class extends Error{}};if(id==='zitejs/db')return {zite:{mutoonTextTemplates:entity('templates'),mutoonHoldings:entity('holdings')}};return original.apply(this,arguments);};
 require.extensions['.ts']=(m,p)=>m._compile(swc.transformSync(fs.readFileSync(p,'utf8'),{filename:p,jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}}).code,p);
 try{
  const template=require('../legacy/api/mutoonTemplates.ts').default,holding=require('../legacy/api/mutoonHoldings.ts').default;
  const context={user:{id:'owner'}},text=' \nأحمد عن محمد\n ',format=JSON.stringify([{start:2,end:6,text:'أحمد',bold:true,color:'primary',center:false,indent:0}]);
  await template.execute({context,input:{action:'save',name:'Test',kind:'introduction',body:text,formatting:format}});
  assert.equal(rows.templates[0].body,text);assert.equal(rows.templates[0].formatting,format);
  await template.execute({context,input:{action:'save',id:rows.templates[0].id,body:text+'next',formatting:format}});
  assert.equal(rows.templates[0].body,text+'next');
  await assert.rejects(()=>template.execute({context:{user:{id:'other'}},input:{action:'save',id:rows.templates[0].id,body:'not allowed'}}));
  await holding.execute({context,input:{action:'save',name:'Test',category:'Test',sanadText:text,wordingText:text,sanadFormatting:format}});
  assert.equal(rows.holdings[0].sanadText,text);assert.equal(rows.holdings[0].wordingText,text);assert.equal(rows.holdings[0].sanadFormatting,format);
  await assert.rejects(()=>holding.execute({context,input:{action:'save',name:'Blank',category:'Test',sanadText:'  \n '}}));
  console.log('PASS: template/holding save-reopen preserves exact text and formatting offsets; blank text and other-owner update denied');
 }finally{Module._load=original;}
})().catch(e=>{console.error(e);process.exitCode=1});
