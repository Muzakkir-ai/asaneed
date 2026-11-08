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
import {composePersonalSanadBranches} from '../lib/personalSanadBranches';
type Node={name:string;personId?:string;key:string};
export default function PersonalSanadPeople({library,onPersonCreated,onApply,initialPersonIds=[],onPendingChange,beforeApply,preparation,onwardIds,readOnly=false}:{library:BuilderLibrary;onPersonCreated:(person:BuilderPerson)=>void;onApply:(text:string,ids:string[])=>void;initialPersonIds?:string[];onPendingChange?:(pending:boolean)=>void;beforeApply?:ReactNode|((move:(name:string,changing:boolean)=>boolean)=>ReactNode);preparation?:PreparedSanadPeople|null;onwardIds?:ReadonlySet<string>;readOnly?:boolean}){
 const matches=(name:string)=>library.people.filter(p=>!p.archived&&[p.name,...(Array.isArray(p.aliases)?p.aliases:[]).flatMap(a=>a&&typeof a.name==='string'?[a.name]:[])].some(value=>sanadKey(value)===sanadKey(name)));
 const [nodes,setNodes]=useState<Node[]>(()=>preparation?preparation.tokens.map((t,i)=>{const found=matches(t.name);return {key:`prepared-${i}`,name:t.name,personId:initialPersonIds.length===preparation.tokens.length?initialPersonIds[i]:found.length===1?found[0].id:undefined};}):initialPersonIds.length?initialPersonIds.map((id,i)=>({key:`saved-${i}`,personId:id,name:library.people.find(p=>p.id===id)?.name||'راوٍ غير متاح'})):[{name:'',key:'first'}]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 type Parallel={id:string;origin:string;join:string;nodes:Node[]};
 const [parallels,setParallels]=useState<Parallel[]>([]);
 const changeParallels=(fn:(current:Parallel[])=>Parallel[])=>{onPendingChange?.(true);setParallels(fn);};
 const blankNarrator=():Node=>({name:'',key:crypto.randomUUID()});
 const addParallel=(origin:string)=>{if(parallels.length>=10){setError('الحد الأقصى عشرة فروع في هذا النموذج');return;}setError('');changeParallels(current=>[...current,{id:crypto.randomUUID(),origin,join:'',nodes:[blankNarrator()]}]);};
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
   if(parallels.length){
    const saved=next.map(node=>library.people.find(person=>person.id===node.personId&&!person.archived));
    if(saved.some(person=>!person))throw Error('اختر كل راوٍ في السند الأساسي من الأسماء المحفوظة');
    const branches=parallels.map((branch,index)=>{
     const alternate=branch.nodes.map(node=>library.people.find(person=>person.id===node.personId&&!person.archived));
     if(alternate.some(person=>!person))throw Error('الفرع '+(index+1)+': اختر كل راوٍ من الأسماء المحفوظة');
     return {originId:next.find(node=>node.key===branch.origin)?.personId||'',joinId:next.find(node=>node.key===branch.join)?.personId||'',narrators:alternate.map(person=>({id:person!.id,name:person!.name}))};
    });
    const assembled=composePersonalSanadBranches(saved.map(person=>({id:person!.id,name:person!.name})),branches);
    onApply(assembled.text,assembled.ids);
    return;
   }
   onApply(text,next.map(n=>n.personId!));
  }catch(e){setError(e instanceof Error?e.message:'تعذر اعتماد الرواة');}finally{setBusy(false);}
 };
 const graph=preparation?preparedSanadGraph(preparation,nodes):null;
 const renderRow=(i:number,ordinal:number|null=i+1,indices=[i],labels?:string[],turn=false)=>{const node=nodes[i];return <ChainNarratorRow node={{...node,editorKey:node.key,source:false}} number={ordinal} badgeLabels={labels} sourceMarker={turn?'(ح)':undefined} index={i} count={nodes.length} lib={library} roles={false} readOnly={readOnly} lockedLayout={!!preparation} initialEditing={preparation?false:undefined} previous={preparation?undefined:nodes[i-1]?.personId} next={preparation?undefined:nodes[i+1]?.personId} onCreate={create} onPersonUpdated={(sourceId,person)=>{const source=library.people.find(p=>p.id===sourceId);if(source&&sourceId!==person.id)onPersonCreated({...source,archived:true});onPersonCreated(person);update(v=>v.map(n=>n.personId===sourceId?{...n,personId:person.id,name:person.name}:n));}} onChange={value=>{if(value.personId)keepRowInPlace(node.key);update(v=>v.map((n,j)=>indices.includes(j)?{...n,...value}:n));}} onRemove={()=>update(v=>v.filter((_,j)=>j!==i))} onMove={direction=>update(v=>{const next=[...v];[next[i],next[i+direction]]=[next[i+direction],next[i]];return next;})}/>;};
 const addAfter=(index:number)=>{
  const origin=nodes[index-1];
  const canBranch=index<nodes.length-1&&!!origin?.personId;
  return <div className="flex flex-wrap items-center justify-end gap-2 py-1">
   {canBranch&&<Button type="button" size="sm" variant="outline" className="h-8 gap-1.5" aria-label={'إضافة فرع من '+origin.name} title={'إضافة فرع من '+origin.name} onClick={()=>addParallel(origin.key)}><GitFork aria-hidden="true" className="h-4 w-4"/>إضافة فرع</Button>}
   <Button type="button" size="icon" variant="outline" className="h-8 w-8 rounded-full p-0" title="إضافة راوٍ بعده" disabled={nodes.length>=100} onClick={()=>insert(index)}><Plus aria-hidden="true" className="h-4 w-4"/><span className="sr-only">إضافة راوٍ بعده</span></Button>
  </div>;
 };
 const mainPath=nodes.map(node=>node.key);
 const completeParallels=parallels.filter(branch=>{
  const origin=nodes.findIndex(node=>node.key===branch.origin),join=nodes.findIndex(node=>node.key===branch.join);
  return origin>=0&&join>origin+1&&branch.nodes.length>0&&branch.nodes.every(node=>node.personId);
 });
 const displayPaths=[mainPath,...completeParallels.map(branch=>{
  const origin=nodes.findIndex(node=>node.key===branch.origin),join=nodes.findIndex(node=>node.key===branch.join);
  return [...mainPath.slice(0,origin+1),...branch.nodes.map(node=>node.key),...mainPath.slice(join)];
 })];
 const renderParallel=(key:string,positions:number[])=>{
  const branch=parallels.find(item=>item.nodes.some(node=>node.key===key));
  if(!branch)return null;
  const i=branch.nodes.findIndex(node=>node.key===key),node=branch.nodes[i];
  return <ChainNarratorRow number={positions[0]} node={{...node,source:false}} index={i} count={branch.nodes.length} lib={library} roles={false} onCreate={create} onChange={value=>changeParallels(current=>current.map(item=>item.id===branch.id?{...item,nodes:item.nodes.map((n,j)=>j===i?{...n,...value}:n)}:item))} onMove={direction=>changeParallels(current=>current.map(item=>{if(item.id!==branch.id)return item;const ordered=[...item.nodes];[ordered[i],ordered[i+direction]]=[ordered[i+direction],ordered[i]];return {...item,nodes:ordered};}))} onRemove={()=>changeParallels(current=>current.map(item=>item.id===branch.id?{...item,nodes:item.nodes.filter((_,j)=>j!==i)}:item))}/>;
 };
 return <fieldset disabled={busy} className="space-y-3 min-w-0" aria-busy={busy}>
 {!readOnly&&<p className="text-xs text-muted-foreground">{preparation?'الرواة مُعدّون من النص السابق للمراجعة. تبقى ألفاظ الاتصال والفروع والتكرارات كما كُتبت، وتُحفظ الأسماء عند التأكيد.':'أضف شيوخ سندك بالترتيب، من شيخك المباشر حتى نهاية سندك الشخصي.'}</p>}
 {graph?<PreparedSanadGraph graph={graph} renderNode={(entry,ordinal,labels)=>renderRow(entry.indices[0],ordinal,entry.indices,labels,entry.turn)}/>:<SanadPathView paths={preparation?[]:displayPaths} unconnected={preparation?nodes.map(node=>node.key):undefined} renderPerson={(key,positions)=>{
  const i=nodes.findIndex(node=>node.key===key);
  if(i<0)return renderParallel(key,positions);
  return <>{preparation&&i>0&&<p className="text-xs text-muted-foreground">{preparation.tokens[i].before.trim()}</p>}{renderRow(i,positions[0]??null,[i],positions.map(arabicDigits))}</>;
 }} afterPerson={!readOnly&&!preparation?key=>mainPath.includes(key)?addAfter(mainPath.indexOf(key)+1):null:undefined}/>}
 {!readOnly&&!preparation&&parallels.map((branch,index)=>{
  const origin=nodes.find(node=>node.key===branch.origin);
  const isVisible=completeParallels.some(item=>item.id===branch.id);
  const change=(update:(item:Parallel)=>Parallel)=>changeParallels(current=>current.map(item=>item.id===branch.id?update(item):item));
  return <section key={branch.id} className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-3" aria-label={'تحرير الفرع '+arabicDigits(index+1)}>
   <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-semibold">الفرع {arabicDigits(index+1)} — من {origin?.name||'راوٍ غير محدد'}</h4><Button type="button" size="sm" variant="ghost" onClick={()=>changeParallels(current=>current.filter(item=>item.id!==branch.id))}>حذف هذا الفرع</Button></div>
   <p className="text-xs text-muted-foreground">١. أضف الرواة الذين يختلف بهم هذا الفرع. ٢. اختر الراوي الذي يلتقي عنده مع السند الأساسي. لا تكرر الراوي المشترك داخل الفرع.</p>
   {!isVisible&&branch.nodes.length>0&&<SanadPathView paths={[branch.nodes.map(node=>node.key)]} renderPerson={renderParallel}/>}
   <Button type="button" size="sm" variant="outline" onClick={()=>change(item=>({...item,nodes:[...item.nodes,blankNarrator()]}))}><Plus aria-hidden="true" className="me-1 h-4 w-4"/>إضافة راوٍ داخل الفرع</Button>
   <label className="block space-y-1 text-sm"><span className="font-medium">نقطة التقاء الفرع بالسند الأساسي</span><select aria-label={'نقطة التقاء الفرع '+arabicDigits(index+1)} className="block w-full rounded-lg border bg-background p-2" value={branch.join} onChange={event=>change(item=>({...item,join:event.target.value}))}><option value="">اختر راوياً مشتركاً موجوداً في السند الأساسي</option>{nodes.slice(nodes.findIndex(node=>node.key===branch.origin)+2).filter(node=>node.personId).map(node=><option key={node.key} value={node.key}>{node.name}</option>)}</select></label>
   <p className="text-xs text-muted-foreground">{isVisible?'الفرع متصل ويظهر في معاينة السند أعلاه. يمكنك إضافة فرع آخر قبل الاعتماد.':'أكمل رواة الفرع وحدد نقطة الالتقاء لتظهر وصلاته في المعاينة.'}</p>
  </section>;
 })}
 {!readOnly&&<>{onwardIds&&nodes.at(-1)?.personId&&<p role="status" className="text-xs text-muted-foreground">
  {onwardIds.has(nodes.at(-1)!.personId!)
   ?'له اتصال إسنادي محفوظ. يمكنك إنهاء السند هنا.'
   :'يمكنك حفظ السند حتى هذا الراوي. لا تتوفر له تتمة معتمدة بعد.'}
 </p>}{typeof beforeApply==='function'?beforeApply(moveMeetingPoint):beforeApply}<Button type="button" onClick={()=>void adopt()}>{busy?'جارٍ حفظ الأسماء…':preparation?'تأكيد الرواة من النص السابق':'اعتماد ترتيب الرواة'}</Button>
 <p className="text-xs text-muted-foreground">راجع السند المركب ثم احفظ الإجازة.</p></>}{!readOnly&&error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
 </fieldset>;
}
