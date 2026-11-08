const assert=require('node:assert/strict'),fs=require('node:fs'),Module=require('node:module');
const {JSDOM}=require('jsdom'),React=require('react'),{act}=React;
const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost'});
Object.assign(global,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
const {createRoot}=require('react-dom/client');

(async()=>{
 const shaykh={id:'one',name:'شيخ تجريبي',email:'',qualification:'قارئ',teachingRole:'',madrasaName:'',madrasaPlace:'',personalChain:'',junction:'jazari',individualSughra:true,sharedSughraSanad:false,libraryKubra:false,readings:[{qariId:'asim',rawi:'حفص'}],routes:[],variants:[],mutoon:[]};
 const approvedText='كما أخذته عن الشيخ محمد بن أحمد، عن الإمام ابن الجزري';
 const approvedIds=['00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002'];
 let rows=[],failSave=false,writes=[],successes=[],failures=[];
 const api={
  additionalShaykhs:async()=>({sheikhs:[shaykh]}),
  contentManagement:async()=>({catalog:[]}),
  mutoonTemplates:async()=>({templates:[]}),
  additionalReadingSanads:async input=>{
   if(input.action==='save'){
    writes.push({...input,personalPersonIds:[...input.personalPersonIds]});
    if(failSave)throw Error('راجع نقطة الالتقاء');
    rows=[{id:'saved',qariId:input.qariId,rawi:input.rawi,sanadText:input.sanadText,personalPersonIds:input.personalPersonIds,junction:input.junction,continuationId:input.continuationId}];
   }
   return {sanads:rows};
  }
 };
 const Button=({children,variant,size,...props})=>React.createElement('button',props,children);
 const box=({children,...props})=>React.createElement('div',props,children);
 global.fetch=async()=>({ok:true,json:async()=>({chains:[],people:[],books:[]})});
 const swc=require('next/dist/build/swc');await swc.loadBindings();
 const transform=async path=>(await swc.transform(fs.readFileSync(path,'utf8'),{filename:path,jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}})).code;
 const frameCode=await transform('legacy/components/EditorPage.tsx'),pageCode=await transform('legacy/components/AdditionalShaykhsPage.tsx');
 const mod=new Module(__filename,module);mod.paths=module.paths;
 let frameExports;
 mod.require=id=>{
  if(id==='./EditorPage')return frameExports;
  if(id==='react'||id==='react/jsx-runtime')return require(id);
  if(id==='../lib/api')return api;
  if(id==='../lib/ijazahCoverage')return {compactReadingCount:()=> 'رواية واحدة'};
  if(id==='../lib/workspaceSelection')return {workspaceHeaders:()=>({})};
  if(id==='../lib/qurra')return {QURRA:[{id:'asim',reading:'عاصم',rawis:['حفص']}],displayRawi:(_,r)=>r,shortReadingLabel:(_,r)=>r,shortQariName:()=> 'عاصم'};
  if(id==='./ShaykhReadingsList')return {__esModule:true,default:({onEdit})=>React.createElement('button',{onClick:()=>onEdit?.({qariId:'asim',rawi:'حفص'})},'افتح سند حفص')};
  if(id==='./PersonalSanadInput')return {__esModule:true,default:({adoptLabel,onApply})=>React.createElement('button',{onClick:()=>onApply(approvedText,approvedIds,'jazari',null)},adoptLabel)};
  if(id==='sonner')return {toast:{error:s=>failures.push(s),success:s=>successes.push(s)}};
  if(id==='lucide-react')return new Proxy({},{get:()=>()=>null});
  if(id.endsWith('/button'))return {Button};
  if(id.endsWith('/input'))return {Input:p=>React.createElement('input',p)};
  if(id.endsWith('/textarea'))return {Textarea:p=>React.createElement('textarea',p)};
  if(id.endsWith('/card'))return {Card:box,CardContent:box};
  if(id.endsWith('/dialog'))return {Dialog:({open,children})=>open?React.createElement('div',{role:'dialog'},children):null,DialogContent:box,DialogHeader:box,DialogTitle:box};
  if(id==='../lib/matnPresentation')return {readMatnPresentation:()=>({}),writeMatnPresentation:()=> '[]'};
  if(id.startsWith('../lib/'))return {};
  return {__esModule:true,default:()=>null,MatnPreview:()=>null,parseMatnFormat:()=>[]};
 };
 const fm=new Module(__filename,module);fm.paths=module.paths;fm.require=mod.require;fm._compile(frameCode,__filename);frameExports=fm.exports;mod._compile(pageCode,__filename);
 const root=createRoot(document.getElementById('root'));
 await act(async()=>root.render(React.createElement(mod.exports.default,{onSaved(){}})));
 const click=async label=>{
  const b=label==='عرض ملف الشيخ'?document.querySelector('[role=button]'):[...document.querySelectorAll('button')].find(b=>b.textContent===label||b.getAttribute('aria-label')===label);
  assert.ok(b,'Missing button: '+label);
  await act(async()=>b.click());
 };
 await click('عرض ملف الشيخ');
 await click('افتح سند حفص');
 assert.ok(document.body.textContent.includes('اعتماد وحفظ السند'),'riwayah adoption clearly saves');
 await click('اعتماد وحفظ السند');
 assert.equal(writes.length,1,'adoption triggers database save automatically exactly once');
 assert.equal(writes[0].sanadText,approvedText,'save receives approved text directly, not stale React state');
 assert.deepEqual(writes[0].personalPersonIds,approvedIds,'save receives approved narrator IDs');
 assert.equal(writes[0].continuationId,null,'new sanad does not inherit an unverified reference');
 assert.equal(writes[0].unifiedSanad,null,'new sanad does not inherit an old route reference');
 assert.equal(successes.length,1,'successful save gives confirmation');

 failSave=true;
 await click('افتح سند حفص');
 await click('اعتماد وحفظ السند');
 assert.equal(writes.length,2,'a second adoption attempts save');
 assert.ok(document.querySelector('[role=alert]')?.textContent.includes('راجع نقطة الالتقاء'),'server rejection remains visible beside the editor');
 assert.ok(document.body.textContent.includes('اعتماد وحفظ السند'),'failed save keeps narrator editor open');

 failSave=false;
 await click('حفظ السند');
 assert.equal(writes.length,3,'manual Save can retry after rejected adoption');
 assert.equal(writes[2].sanadText,approvedText,'retry uses the adopted text');
 assert.deepEqual(writes[2].personalPersonIds,approvedIds);
 assert.equal(successes.length,2,'retry succeeds and confirms persistence');
 await act(async()=>root.unmount());
 console.log('PASS: adopt-and-save writes current sanad IDs immediately, clears stale references, reports failures, and supports retry');
})().catch(e=>{console.error(e);process.exitCode=1});
