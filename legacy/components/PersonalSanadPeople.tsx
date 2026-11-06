import {arabicDigits} from '../lib/arabicDigits';
import SanadPathView from './SanadPathView';
import PreparedSanadGraph from './PreparedSanadGraph';
import {preparedSanadGraph} from '../lib/preparedSanadGraph';
import {GitFork,Plus} from 'lucide-react';
import {useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import {Button} from '@project/components/ui/button';
import {workspaceHeaders} from '../lib/workspaceSelection';
import {sanadKey} from '../lib/unifiedSanad';
import {preparedSanadText,type PreparedSanadPeople} from '../lib/preparedSanadPeople';
import type {BuilderLibrary,BuilderPerson} from '../lib/bookBuilder';
import ChainNarratorRow from './ChainNarratorRow';
type Node={name:string;personId?:string;key:string};
export default function PersonalSanadPeople({library,onPersonCreated,onApply,initialPersonIds=[],onPendingChange,beforeApply,preparation,showOnward=false,readOnly=false}:{library:BuilderLibrary;onPersonCreated:(person:BuilderPerson)=>void;onApply:(text:string,ids:string[])=>void;initialPersonIds?:string[];onPendingChange?:(pending:boolean)=>void;beforeApply?:ReactNode|((move:(name:string,changing:boolean)=>boolean)=>ReactNode);preparation?:PreparedSanadPeople|null;showOnward?:boolean;readOnly?:boolean}){
 const matches=(name:string)=>library.people.filter(p=>!p.archived&&[p.name,...(Array.isArray(p.aliases)?p.aliases:[]).flatMap(a=>a&&typeof a.name==='string'?[a.name]:[])].some(value=>sanadKey(value)===sanadKey(name)));
 const [nodes,setNodes]=useState<Node[]>(()=>preparation?preparation.tokens.map((t,i)=>{const found=matches(t.name);return {key:`prepared-${i}`,name:t.name,personId:initialPersonIds.length===preparation.tokens.length?initialPersonIds[i]:found.length===1?found[0].id:undefined};}):initialPersonIds.length?initialPersonIds.map((id,i)=>({key:`saved-${i}`,personId:id,name:library.people.find(p=>p.id===id)?.name||'راوٍ غير متاح'})):[{name:'',key:'first'}]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [parallel,setParallel]=useState<{origin:string;join:string;nodes:Node[]}|null>(null);
 const changeParallel=(value:typeof parallel)=>{setParallel(value);onPendingChange?.(true);};
 const blankNarrator=()=>({name:'',key:crypto.randomUUID()});
 const viewportAnchor=useRef<{row:string;top:number}|null>(null);
 const keepRowInPlace=(row:string)=>{
  const element=document.querySelector(`[data-personal-rawi="${row}"]`);
  if(element)viewportAnchor.current={row,top:element.getBoundingClientRect().top};
 };
 useLayoutEffect(()=>{
  const anchor=viewportAnchor.current;
  if(!anchor)return;
  viewportAnchor.current=null;
  const element=document.querySelector(`[data-personal-rawi="${anchor.row}"]`);
  if(element)window.scrollBy({top:element.getBoundingClientRect().top-anchor.top,behavior:'instant'});
 },[nodes]);
 const create=async(name:string,alias:string,distinct:boolean)=>{const response=await fetch('/api/book-builder',{method:'POST',headers:{'content-type':'application/json',...workspaceHeaders()},body:JSON.stringify({action:'person',name,displayName:alias,distinct})});const person=await response.json();if(!response.ok)throw Error(person.error||'تعذر حفظ الراوي');onPersonCreated(person);return person as BuilderPerson;};
 const update=(fn:(v:Node[])=>Node[])=>{onPendingChange?.(true);setNodes(fn);};
 const moveMeetingPoint=(name:string,changing:boolean)=>{
  setError('');
  const key=sanadKey(name);
  const same=(value:string)=>{const candidate=sanadKey(value);return candidate===key||candidate.endsWith(' '+key);};
  if(same(nodes.at(-1)?.name||''))return true;
  const existing=nodes.findLastIndex(n=>same(n.name));
  if(existing>=0&&!preparation){update(v=>v.slice(0,existing+1));return true;}
  const found=matches(name);
  const endpoint={key:crypto.randomUUID(),name:found.length===1?found[0].name:name,personId:found.length===1?found[0].id:undefined};
  update(v=>{
   if(preparation||changing)return [...v.slice(0,-1),{...endpoint,key:v.at(-1)?.key||endpoint.key}];
   return [...v.filter(n=>n.name.trim()),endpoint];
  });
  return true;
 };
 const insert=(index:number)=>{
  const key=crypto.randomUUID();
  update(v=>[...v.slice(0,index),{name:'',key},...v.slice(index)]);
  window.requestAnimationFrame?.(()=>{
   const row=document.getElementById('personal-rawi-'+key);
   row?.querySelector('input')?.focus({preventScroll:true});
   row?.scrollIntoView?.({block:'nearest'});
  });
 };
 const adopt=async()=>{
  setError('');setBusy(true);
  try{
   const next=nodes.map(n=>({...n})),created=new Map<string,BuilderPerson>();
   for(const node of next){
    if(node.personId&&library.people.some(p=>p.id===node.personId&&!p.archived))continue;
    if(!preparation)throw Error('اختر أو احفظ كل راوٍ قبل استخدام السند');
    if(node.name.trim().length<2)throw Error('أكمل اسم كل راوٍ قبل التأكيد');
    const existing=matches(node.name);if(existing.length>1)throw Error('يوجد أكثر من شخص بهذا الاسم؛ اختر الهوية الصحيحة: '+node.name);
    const person=existing[0]||created.get(sanadKey(node.name))||await create(node.name,'',false);
    created.set(sanadKey(node.name),person);node.personId=person.id;
   }
   setNodes(next);
   const text=preparation?preparedSanadText(preparation,next.map(n=>n.name)):'كما أخذته عن '+next.map(n=>library.people.find(p=>p.id===n.personId)!.name).join('، عن ');
   if(parallel){
    const origin=next.findIndex(n=>n.key===parallel.origin),join=next.findIndex(n=>n.key===parallel.join);
    if(origin<0||join<=origin+1)throw Error('اختر راويًا لاحقًا تلتقي عنده الفروع بعد راوٍ واحد على الأقل');
    const alternate=parallel.nodes.map(n=>library.people.find(p=>p.id===n.personId&&!p.archived));
    if(!alternate.length||alternate.some(p=>!p))throw Error('اختر أو احفظ كل راوٍ في الفرع الموازي');
    const ids=[...next.slice(0,join+1).map(n=>n.personId!),...alternate.map(p=>p!.id),...next.slice(join).map(n=>n.personId!)];
    if(ids.length>100)throw Error('الحد الأقصى مئة خانة راوٍ');
    if(new Set(alternate.map(p=>p!.id)).size!==alternate.length||alternate.some(p=>next.some(n=>n.personId===p!.id)))throw Error('اختر نقطة التقاء الفرعين من القائمة بدل تكرار راوٍ من السند الأصلي');
    const first=next.slice(0,join+1).map(n=>n.name).join('، عن ');
    const second=[...alternate.map(p=>p!.name),...next.slice(join).map(n=>n.name)].join('، عن ');
    onApply('كما أخذته عن '+first+' (ح). وقرأ '+next[origin].name+' أيضًا على '+second,ids);
    return;
   }
   onApply(text,next.map(n=>n.personId!));
  }catch(e){setError(e instanceof Error?e.message:'تعذر اعتماد الرواة');}finally{setBusy(false);}
 };
 const graph=preparation?preparedSanadGraph(preparation,nodes):null;
 const renderRow=(i:number,ordinal:number|null=i+1,indices=[i],labels?:string[],turn=false)=>{const node=nodes[i];return <ChainNarratorRow node={{...node,editorKey:node.key,source:false}} number={ordinal} badgeLabels={labels} sourceMarker={turn?'(ح)':undefined} index={i} count={nodes.length} lib={library} roles={false} readOnly={readOnly} lockedLayout={!!preparation} initialEditing={preparation?false:undefined} previous={preparation?undefined:nodes[i-1]?.personId} next={preparation?undefined:nodes[i+1]?.personId} onCreate={create} onPersonUpdated={(sourceId,person)=>{const source=library.people.find(p=>p.id===sourceId);if(source&&sourceId!==person.id)onPersonCreated({...source,archived:true});onPersonCreated(person);update(v=>v.map(n=>n.personId===sourceId?{...n,personId:person.id,name:person.name}:n));}} onChange={value=>{if(value.personId)keepRowInPlace(node.key);update(v=>v.map((n,j)=>indices.includes(j)?{...n,...value}:n));}} onRemove={()=>update(v=>v.filter((_,j)=>j!==i))} onMove={direction=>update(v=>{const next=[...v];[next[i],next[i+direction]]=[next[i+direction],next[i]];return next;})}/>;};
 const addAfter=(index:number)=><div className="flex justify-end gap-2">{!parallel&&index<nodes.length-1&&nodes[index-1]?.personId&&<Button type="button" size="sm" variant="outline" className="h-8 w-8 rounded-full p-0" aria-label="إضافة شيخ موازٍ" title="إضافة شيخ موازٍ" onClick={()=>changeParallel({origin:nodes[index-1].key,join:'',nodes:[blankNarrator()]})}><GitFork aria-hidden="true"/></Button>}<Button type="button" size="icon" variant="outline" className="h-8 w-8 rounded-full p-0" title="إضافة راوٍ بعده" disabled={nodes.length>=100} onClick={()=>insert(index)}><Plus aria-hidden="true" className="h-4 w-4"/><span className="sr-only">إضافة راوٍ بعده</span></Button></div>;
 const origin=parallel?nodes.findIndex(node=>node.key===parallel.origin):-1;
 const join=parallel?nodes.findIndex(node=>node.key===parallel.join):-1;
 const mainPath=nodes.map(node=>node.key);
 const parallelPath=parallel&&origin>=0&&join>origin+1&&parallel.nodes.length
  ? [...mainPath.slice(0,origin+1),...parallel.nodes.map(node=>node.key),...mainPath.slice(join)]
  : null;
 const renderParallel=(key:string,positions:number[])=>{if(!parallel)return null;const i=parallel.nodes.findIndex(node=>node.key===key),node=parallel.nodes[i];return <ChainNarratorRow number={positions[0]} node={{...node,source:false}} index={i} count={parallel.nodes.length} lib={library} roles={false} onCreate={create} onChange={value=>changeParallel({...parallel,nodes:parallel.nodes.map((n,j)=>j===i?{...n,...value}:n)})} onMove={direction=>{const ordered=[...parallel.nodes];[ordered[i],ordered[i+direction]]=[ordered[i+direction],ordered[i]];changeParallel({...parallel,nodes:ordered});}} onRemove={()=>changeParallel({...parallel,nodes:parallel.nodes.filter((_,j)=>j!==i)})}/>;};
 return <fieldset disabled={busy} className="space-y-3 min-w-0" aria-busy={busy}>
 {!readOnly&&<p className="text-xs text-muted-foreground">{preparation?'الرواة مُعدّون من النص السابق للمراجعة. تبقى ألفاظ الاتصال والفروع والتكرارات كما كُتبت، وتُحفظ الأسماء عند التأكيد.':'أضف شيوخ سندك بالترتيب، من شيخك المباشر حتى نهاية سندك الشخصي.'}</p>}
 {graph?<PreparedSanadGraph graph={graph} renderNode={(entry,ordinal,labels)=>renderRow(entry.indices[0],ordinal,entry.indices,labels,entry.turn)}/>:<SanadPathView paths={preparation?[]:parallelPath?[mainPath,parallelPath]:[mainPath]} unconnected={preparation?nodes.map(node=>node.key):undefined} renderPerson={(key,positions)=>{
  const i=nodes.findIndex(node=>node.key===key);
  if(i<0)return renderParallel(key,positions);
  return <>{preparation&&i>0&&<p className="text-xs text-muted-foreground">{preparation.tokens[i].before.trim()}</p>}{renderRow(i,positions[0]??null,[i],positions.map(arabicDigits))}</>;
 }} afterPerson={!readOnly&&!preparation?key=>mainPath.includes(key)?addAfter(mainPath.indexOf(key)+1):null:undefined}/>}
 {!readOnly&&parallel&&<section className="space-y-3 rounded-lg border border-primary/30 p-3" aria-label="الفرع الموازي">
 <h4 className="font-semibold">الفرع الموازي من {nodes.find(n=>n.key===parallel.origin)?.name}</h4>
 {!parallelPath&&parallel.nodes.length>0&&<SanadPathView paths={[parallel.nodes.map(node=>node.key)]} renderPerson={renderParallel}/>}
 <Button type="button" size="sm" variant="outline" onClick={()=>changeParallel({...parallel,nodes:[...parallel.nodes,blankNarrator()]})}>إضافة راوٍ للفرع</Button>
 <label className="block text-sm">التقاء الفرعين<select className="block w-full rounded-lg border bg-background p-2" value={parallel.join} onChange={e=>changeParallel({...parallel,join:e.target.value})}><option value="">اختر الراوي المشترك</option>{nodes.slice(nodes.findIndex(n=>n.key===parallel.origin)+2).filter(n=>n.personId).map(n=><option key={n.key} value={n.key}>{n.name}</option>)}</select></label>
 <Button type="button" size="sm" variant="outline" onClick={()=>changeParallel(null)}>إلغاء الفرع</Button>
 </section>}
 {!readOnly&&<>{showOnward&&nodes.at(-1)?.personId&&<p role="status" className="text-xs text-muted-foreground">
  {library.sharedBridgeGraphs?.some(bridge=>bridge.routes.some(path=>path.slice(0,-1).some(node=>node.id===nodes.at(-1)?.personId)))
   ?'له اتصال إسنادي محفوظ. يمكنك إنهاء السند هنا.'
   :'يمكنك حفظ السند حتى هذا الراوي. لا تتوفر له تتمة معتمدة بعد.'}
 </p>}{typeof beforeApply==='function'?beforeApply(moveMeetingPoint):beforeApply}<Button type="button" onClick={()=>void adopt()}>{busy?'جارٍ حفظ الأسماء…':preparation?'تأكيد الرواة من النص السابق':'اعتماد ترتيب الرواة'}</Button>
 <p className="text-xs text-muted-foreground">راجع السند المركب ثم احفظ الإجازة.</p></>}{!readOnly&&error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
 </fieldset>;
}
