const assert=require('node:assert/strict'),fs=require('node:fs'),Module=require('node:module');
const {JSDOM}=require('jsdom'),React=require('react'),{act}=React;
const dom=new JSDOM('<div id="root"></div>');
Object.assign(global,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
const {createRoot}=require('react-dom/client');
(async()=>{
 const swc=require('next/dist/build/swc');await swc.loadBindings();
 const {code}=await swc.transform(fs.readFileSync('legacy/components/NarratorPicker.tsx','utf8'),{filename:'NarratorPicker.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const existing=[{id:'saved-one',name:'محمد بن عبد الكريم',display_name:'',archived:false},{id:'saved-two',name:'محمد بن عبد الحميد',display_name:'',archived:false}];
 const lib={people:existing,chains:[],suggestions:[]},created=[],selected=[];
 const UI=React.createContext(false);
 const Input=React.forwardRef((props,ref)=>React.createElement('input',{...props,ref}));
 const mod=new Module(__filename,module);mod.paths=module.paths;mod.require=id=>{
  if(id==='./NarratorLinkStatus')return {__esModule:true,default:()=>null};
  if(id==='@project/components/ui/input')return {Input};
  if(id==='@project/components/ui/button')return {Button:({children,variant,size,...props})=>React.createElement('button',props,children)};
  if(id==='@project/components/ui/popover')return {
   Popover:({open,children})=>React.createElement(UI.Provider,{value:open},children),
   PopoverAnchor:({children})=>children,
   PopoverContent:({children})=>React.useContext(UI)?React.createElement('div',null,children):null
  };
  if(id==='../lib/narratorSelection')return {
   narratorSearchKey:v=>v.trim(),
   observedLinks:()=>[],
   rankNarrators:(people,query)=>people.filter(p=>!query||p.name.includes(query)).map(person=>({person,observed:[]})),
   possibleNarratorDuplicates:(people,query)=>people.filter(p=>p.name===query),
   unresolvedNarratorSuggestions:()=>[]
  };
  return require(id);
 };
 mod._compile(code,__filename);
 const Picker=mod.exports.default;
 const root=createRoot(document.getElementById('root'));
 const Component=()=>{
  const [node,setNode]=React.useState({name:''});
  return React.createElement(Picker,{lib,node,onChange:next=>{selected.push(next);setNode(next);},onCreate:async (name,alias,distinct)=>{
   created.push({name,alias,distinct});return {id:'new-one',name,display_name:'',archived:false};
  }});
 };
 await act(async()=>root.render(React.createElement(Component)));
 const enter=async name=>{
  const input=document.querySelector('input[aria-label="اسم الراوي بصيغة الجر"]');
  const setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
  await act(async()=>{setter.call(input,name);input.dispatchEvent(new window.Event('input',{bubbles:true}));});
 };
 const click=async element=>{assert.ok(element);await act(async()=>element.dispatchEvent(new window.MouseEvent('click',{bubbles:true})));};
 await enter('محمد');
 assert.equal(document.querySelectorAll('[role=option]').length,2,'similar saved names appear directly after typing');
 await click(document.querySelector('[role=option]'));
 assert.equal(selected.at(-1).personId,'saved-one','one click selects saved narrator identity');
 assert.equal(document.querySelector('input[role=combobox]').getAttribute('aria-expanded'),'false','picker closes after selection');
 assert.equal(created.length,0,'saved narrator selection never creates duplicates');
 await enter('عثمان بن أحمد');
 const row=document.querySelector('.narrator-picker [dir=rtl]');
 const createButton=[...row.querySelectorAll('button')].find(b=>b.textContent==='إنشاء جديد');
 assert.ok(createButton,'inline creation action is present in the same input row');
 await click(createButton);
 assert.deepEqual(created,[{name:'عثمان بن أحمد',alias:'',distinct:false}],'inline action creates only the typed narrator');
 assert.equal(selected.at(-1).personId,'new-one','new narrator is selected immediately');
 assert.equal(document.querySelector('input[role=combobox]').getAttribute('aria-expanded'),'false','picker closes immediately after creation');
 assert.equal(document.querySelector('.narrator-create-review'),null,'no second review or done dialog');
 await root.unmount();
 console.log('PASS: inline RTL narrator search, one-click select, new-person creation without duplicate confirmation');
})().catch(e=>{console.error(e);process.exitCode=1});
