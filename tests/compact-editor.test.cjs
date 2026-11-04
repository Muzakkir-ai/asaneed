const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const {JSDOM}=require('jsdom');
const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://asaneed.test'});
for(const k of ['window','document','Node','NodeFilter','HTMLElement','Text','localStorage','InputEvent','KeyboardEvent'])global[k]=dom.window[k];
global.IS_REACT_ACT_ENVIRONMENT=true;
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client'),{renderToStaticMarkup}=require('react-dom/server');
const swc=require('next/dist/build/swc');
async function main(){
 await swc.loadBindings();
 const cache=new Map();
 async function compile(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const {code}=await swc.transform(fs.readFileSync(file,'utf8'),{filename:file,jsc:{parser:{syntax:'typescript',tsx:file.endsWith('tsx')},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});const m=new Module(file,module);m.filename=file;m.paths=module.paths;cache.set(file,m.exports);const deps={};for(const match of code.matchAll(/require\("(\.[^"]+)"\)/g)){let target=path.resolve(path.dirname(file),match[1]);if(fs.existsSync(target+'.ts'))deps[match[1]]=await compile(target+'.ts');else if(fs.existsSync(target+'.tsx')&&!target.endsWith('sakkalPrintNodes'))deps[match[1]]=await compile(target+'.tsx');}
 m.require=id=>id==='zitejs/auth'?{useAuth:()=>({})}:id==='../lib/assets'?{currentArtwork:()=>[],assetBase:()=>''}:id==='../lib/sakkalPrintNodes'?{sakkalPrintNodes:x=>x}:id==='@project/components/ui/button'?{Button:({size,variant,...p})=>React.createElement('button',p)}:deps[id]||require(id);m._compile(code,file);cache.set(file,m.exports);return m.exports;}
 // Avoid loading artwork network helpers for this isolated editing story.
 cache.set(path.resolve('legacy/lib/assets.ts'),{currentArtwork:()=>[],assetBase:()=>''});
 const engine=await compile('legacy/lib/matnRichText.ts'),adapter=await compile('legacy/lib/richDocument.ts');
 const {scopedPhraseRanges,parseFormatting,sectionMatnFormats,sectionPrintPhrases,formattingForSavedText,rebaseSectionFormatting}=await compile('legacy/lib/sanadFormatting.ts');
 const source='قال أَحْمَدُ عن أَحْمَدُ';const start=source.indexOf('أَحْمَدُ'),end=start+'أَحْمَدُ'.length;
 const initial=engine.setMatnStyle(source,[],start,end,{bold:true,color:'primary',center:false,indent:0});
 assert.deepEqual(adapter.toLegacy(adapter.fromLegacy(source,initial)),{text:source,formats:initial});
 const changedDoc=adapter.fromLegacy(source,initial);changedDoc.paragraphs[0].children[0].text='ثم ';const converted=adapter.toLegacy(changedDoc);assert.ok(converted.formats.every(f=>typeof f.bold==='boolean'&&typeof f.center==='boolean'));
 const overlapping=[...initial,{...initial[0],start:0,end:source.length,text:source,lineSpacing:1.8}];assert.equal(adapter.toLegacy(adapter.fromLegacy(source,overlapping)).formats.length,2);
 assert.deepEqual(adapter.safeSelection('أَحْمَدُ',1,2),{start:0,end:2});
 const token='س {{mujaaz}} ص';assert.deepEqual(adapter.safeSelection(token,4,5),{start:2,end:12});
 const phrase={text:source.slice(start,end),scope:source,start,end,font:'Sakkal Kitab',size:12,color:'primary'};
 assert.deepEqual(scopedPhraseRanges(source,[phrase]),[{start,end,index:0}]);
 assert.equal(scopedPhraseRanges('different source',[phrase]).length,0);
 assert.equal(parseFormatting(JSON.stringify({font:'KSA Regular',size:9,color:'charcoal',phrases:[phrase]})).phrases[0].start,start);
 const legacy={font:'KSA Regular',size:9,color:'charcoal',phrases:[{text:'أَحْمَدُ',font:'Sakkal Kitab',size:12,color:'primary'}]};assert.equal(sectionMatnFormats(source,legacy).length,2);const rich={...legacy,rich:{text:source,formats:initial}};assert.deepEqual(sectionPrintPhrases(source,parseFormatting(JSON.stringify(rich)))[0].rich,initial);
 const padded='  '+source+'  ';const paddedStyle={...legacy,rich:{text:padded,formats:initial.map(f=>({...f,start:f.start+2,end:f.end+2}))}};assert.deepEqual(formattingForSavedText(source,paddedStyle).rich.formats,initial,'save trim rebases exact spans');
 const {default:Editor,MatnPreview}=await compile('legacy/components/MatnFormatting.tsx');
 let value={text:source,formats:initial};
 function Harness(){const [text,setText]=React.useState(value.text),[formats,setFormats]=React.useState(value.formats);value={text,formats};return React.createElement(Editor,{sanad:text,onChange:setText,formats,onFormatsChange:setFormats,label:'اختبار'});}
 const root=createRoot(document.getElementById('root'));await act(async()=>root.render(React.createElement(Harness)));
 const primary=document.querySelector('.matn-primary-toolbar');assert.equal(primary.children.length,8,'primary toolbar has only eight compact controls');assert.equal(primary.querySelector('[aria-label="حفظ النص والتنسيق"]'),null,'save is outside formatting toolbar');assert.equal(primary.querySelectorAll(':scope > button').length,4);
 const box=()=>document.querySelector('[contenteditable]');
 function select(start,end=start){const el=box();el.focus();const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);function point(n){for(const node of nodes){if(n<=node.length)return [node,n];n-=node.length;}return [nodes.at(-1),nodes.at(-1).length];}const r=document.createRange();r.setStart(...point(start));r.setEnd(...point(end));window.getSelection().removeAllRanges();window.getSelection().addRange(r);el.dispatchEvent(new dom.window.MouseEvent('mouseup',{bubbles:true}));}
 async function click(label){await act(async()=>document.querySelector(`button[aria-label="${label}"]`).click());}
 // A size change at a caret updates the current paragraph; selection changes only its range.
 await act(async()=>select(0));await act(async()=>{const el=document.querySelector('select[aria-label="حجم النص"]');el.value='150';el.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});assert.ok(value.formats.every(f=>f.sizePercent===150));assert.ok(box().querySelector('span').style.fontSize==='150%');await click('تراجع');
 await act(async()=>select(start,end));await act(async()=>{const el=document.querySelector('select[aria-label="حجم النص بالنقاط"]');el.value='24';el.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});assert.equal(value.formats.find(f=>f.text==='أَحْمَدُ').sizePt,24);assert.ok([...box().querySelectorAll('span')].some(el=>el.style.fontSize==='24pt'));const ptPrint=renderToStaticMarkup(React.createElement(MatnPreview,{bare:true,sanad:source,formats:value.formats}));assert.ok(ptPrint.includes('font-size:24pt'));assert.deepEqual(adapter.toLegacy(adapter.fromLegacy(source,value.formats)).formats,value.formats);assert.equal(parseFormatting(JSON.stringify({...legacy,rich:{text:source,formats:value.formats}})).rich.formats.find(f=>f.sizePt===24).sizePt,24);await click('تراجع');
 await act(async()=>select(0));await click('مسح التنسيق');assert.deepEqual(value.formats,initial,'collapsed clear preserves document');
 await act(async()=>{box().dispatchEvent(new InputEvent('beforeinput',{bubbles:true,cancelable:true,inputType:'insertText',data:'ثم '}));});assert.equal(value.text,'ثم '+source);
 await click('تراجع');assert.equal(value.text,source);assert.deepEqual(value.formats,initial);
 await click('إعادة');assert.equal(value.text,'ثم '+source);await click('تراجع');
 const second=source.lastIndexOf('أَحْمَدُ');await act(async()=>select(second,source.length));assert.ok(document.querySelector('[aria-label="تنسيق النص المحدد"]'));
 await click('غامق');assert.equal(value.formats.filter(f=>f.bold).length,2);assert.equal(value.formats[0].color,'primary');
 await click('تراجع');assert.deepEqual(value.formats,initial);
 await act(async()=>select(0));await click('توسيط');assert.equal(value.formats[0].alignment,'center');assert.equal(window.getSelection().toString(),'','paragraph operation preserves caret');
 for(const [label,last] of [['ضبط — آخر سطر وسط','center'],['ضبط — آخر سطر يمين','right']]){await click(label);assert.equal(value.formats[0].alignment,'justify');assert.equal(value.formats[0].lastLineAlignment,last);assert.equal(window.getSelection().toString(),'');const output=renderToStaticMarkup(React.createElement(MatnPreview,{bare:true,sanad:source,formats:value.formats}));assert.ok(output.includes('text-align:justify;text-align-last:'+last));await act(async()=>box().dispatchEvent(new dom.window.MouseEvent('mouseup',{bubbles:true})));assert.equal(document.querySelector(`button[aria-label="${label}"]`).getAttribute('aria-pressed'),'true');}
 await click('تراجع');await click('تراجع');
 await act(async()=>select(source.length));await click('غامق');const beforeTyping=value.text;
 await act(async()=>box().dispatchEvent(new dom.window.KeyboardEvent('keyup',{bubbles:true,key:'Shift'})));
 await act(async()=>box().dispatchEvent(new InputEvent('beforeinput',{bubbles:true,cancelable:true,inputType:'insertText',data:' بَ'})));
 await act(async()=>box().dispatchEvent(new dom.window.KeyboardEvent('keyup',{bubbles:true,key:'ب'})));
 await act(async()=>box().dispatchEvent(new InputEvent('beforeinput',{bubbles:true,cancelable:true,inputType:'insertText',data:'رَ'})));
 assert.ok(value.formats.find(f=>f.text.includes('بَرَ')&&f.bold),'pending style survives keyup and subsequent Arabic typing');
 await click('تراجع');await click('تراجع');assert.equal(value.text,beforeTyping);
 await act(async()=>select(0));await click('غامق');await act(async()=>select(source.length));await act(async()=>box().dispatchEvent(new InputEvent('beforeinput',{bubbles:true,cancelable:true,inputType:'insertText',data:' س'})));assert.ok(!value.formats.find(f=>f.text.endsWith(' س')&&f.bold),'moving caret clears pending style');await click('تراجع');
 const print=renderToStaticMarkup(React.createElement(MatnPreview,{bare:true,justifyParagraphs:true,sanad:source,formats:value.formats}));assert.ok(print.includes('text-align:center'),'explicit center wins over default justify');
 await act(async()=>select(source.length));await act(async()=>{document.querySelector('summary[aria-label="المزيد من التنسيق"]').click();Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='إدراج اسم المُجاز').click();});assert.ok(value.text.endsWith('{{mujaaz}}'));assert.equal(box().querySelector('bdi').contentEditable,'false');
 await act(async()=>box().dispatchEvent(new InputEvent('beforeinput',{bubbles:true,cancelable:true,inputType:'deleteContentBackward'})));assert.equal(value.text,source);
 const flow=await compile('legacy/components/RichSanadFlow.tsx');
 const sizedFlow=renderToStaticMarkup(flow.renderRichSanadFlow(source,'#123456','#654321',sectionPrintPhrases(source,{...legacy,rich:{text:source,formats:[{...initial[0],sizePt:24}]}}),t=>t));assert.ok(sizedFlow.includes('calc(24pt *'));
 const printFile='legacy/components/CertificatePrint.tsx';const transformed=await swc.transform(fs.readFileSync(printFile,'utf8')+'\nexport {renderSanadWithConclusion};',{filename:printFile,jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});const printModule=new Module(path.resolve(printFile),module);printModule.paths=module.paths;printModule.require=id=>id==='./RichSanadFlow'?flow:id==='./MatnFormatting'?{MatnPreview}:id==='../lib/sanadFormatting'?{scopedPhraseRanges}:id==='../lib/prophetChainRanges'?{prophetChainRanges:()=>[]}:id.startsWith('.')||id.startsWith('@project/')?{}:require(id);printModule._compile(transformed.code,path.resolve(printFile));
 const printRich=renderToStaticMarkup(printModule.exports.renderSanadWithConclusion(source,'#123456','#654321',{},sectionPrintPhrases(source,rich)));assert.equal((printRich.match(/font-weight:700/g)||[]).length,1,'precise repeated-name formatting survives real certificate renderer');assert.ok(printRich.includes('أَحْمَدُ'));
 const multi=source+'\n'+source;const multiRich={...legacy,rich:{text:multi,formats:engine.applyMatnPatch(multi,[],0,source.length,{alignment:'center',lineSpacing:1.8})}};const multiPrint=renderToStaticMarkup(printModule.exports.renderSanadWithConclusion(multi,'#123456','#654321',{},sectionPrintPhrases(multi,multiRich)));assert.ok(multiPrint.includes('text-align:center'));assert.equal((multiPrint.match(/أَحْمَدُ/g)||[]).length,4,'multiline rich scopes preserve every source name');
 const continuous=renderToStaticMarkup(printModule.exports.renderSanadWithConclusion('قبل '+source+' بعد','#123456','#654321',{},sectionPrintPhrases(source,rich)));assert.equal((continuous.match(/certificate-sanad-paragraph/g)||[]).length,1,'rich source boundaries must not split a continuous paragraph');assert.ok(!/<span[^>]*>\s*<div/u.test(continuous),'no block nested in inline wrapper');assert.equal((multiPrint.match(/certificate-sanad-paragraph/g)||[]).length,2,'only explicit newlines split paragraphs');
 const rebased=rebaseSectionFormatting(source,'ثم '+source+' رحمه الله',{...legacy,phrases:[phrase],rich:{text:source,formats:initial}});assert.equal(rebased.phrases[0].start,start+3);assert.equal(scopedPhraseRanges('ثم '+source+' رحمه الله',rebased.phrases)[0].start,start+3);assert.equal(sectionMatnFormats('ثم '+source+' رحمه الله',rebased)[0].text,'أَحْمَدُ');
 const bidi=renderToStaticMarkup(React.createElement(MatnPreview,{bare:true,sanad:'الرقم AB-12 بتاريخ 2026/11/04'}));assert.ok(bidi.includes('<bdi dir="ltr">AB-12</bdi>'));
 const oldPrint=renderToStaticMarkup(printModule.exports.renderSanadWithConclusion(source,'#123456','#654321',{},legacy.phrases));assert.equal((oldPrint.match(/font-weight:700/g)||[]).length,2,'legacy all-occurrence styling retains old semantics');
 await act(async()=>root.unmount());
 console.log('PASS compact editor: repeated Arabic names, tashkeel, legacy roundtrip, scoped phrases, clear, typing, undo/redo, paragraph caret, RTL, atomic variables, print alignment');
}
main().catch(e=>{console.error(e);process.exitCode=1});
