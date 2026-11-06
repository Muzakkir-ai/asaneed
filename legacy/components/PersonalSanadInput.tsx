import {Tabs,TabsContent,TabsList,TabsTrigger} from '@project/components/ui/tabs';
import SanadPathView from './SanadPathView';
import BranchPersonCard from './BranchPersonCard';
import {arabicDigits} from '../lib/arabicDigits';
import {automaticSharedBridgeId,recoverSharedBridgePrefix,savedSharedBridgeDiagram} from '../lib/sharedBridge';
import SavedRouteGraph from './SavedRouteGraph';
import {prepareSavedSanadPeople,type PreparedSanadPeople} from '../lib/preparedSanadPeople';
import {UBAYDI_BRIDGE_TITLE} from '../lib/builderPrefix';
import {useEffect,useRef,useState} from 'react';
import {Button} from '@project/components/ui/button';
import BuilderPrefixInput from './BuilderPrefixInput';
import type {BuilderLibrary} from '../lib/bookBuilder';
import {resolveBuilderPrefix,savedPrefixSelection} from '../lib/builderPrefix';
import {workspaceHeaders} from '../lib/workspaceSelection';
/** Direct personal-sanad entry: saved narrator identities and a reviewed meeting point; existing prose stays readable. */
export default function PersonalSanadInput({value,personIds=[],complete=false,preparation:initialPreparation,onApply,onPendingChange,onEditingChange,routeId,issuer,personalPrefix,continuationId,saveContinuation=false,readOnly=false} :{personalPrefix?:{text:string;ids:string[]};continuationId?:string|null;saveContinuation?:boolean;issuer?:{id:string;name:string};readOnly?:boolean;routeId?:string;value:string;preparation?:PreparedSanadPeople|null;personIds?:string[];complete?:boolean;onApply:(text:string,ids:string[],junction:'jazari',continuationId?:string|null)=>void;onPendingChange?:(pending:boolean)=>void;onEditingChange?:(editing:boolean)=>void}){
 const [editing,setEditing]=useState(!readOnly&&!value&&!personIds.length&&!initialPreparation);
 const [preparation,setPreparation]=useState(initialPreparation);
 const [library,setLibrary]=useState<BuilderLibrary|null>(null),[error,setError]=useState(''),[draft,setDraft]=useState(value),[selected,setSelected]=useState(''),[pending,setPending]=useState(false),[revision,setRevision]=useState(0);
 const preselected=useRef(false);
 const markPending=(next:boolean)=>{setPending(next);onPendingChange?.(next);};
 const load=async()=>{setError('');try{const response=await fetch('/api/book-builder',{headers:workspaceHeaders()});const data=await response.json();if(!response.ok)throw Error(data.error||'تعذر تحميل الرواة');setLibrary(data);}catch(e){setError(e instanceof Error?e.message:'تعذر تحميل الرواة');}};
 useEffect(()=>{void load();},[]);
 useEffect(()=>{onEditingChange?.(editing);if(editing&&preparation&&!preparation.reviewed)markPending(true);},[editing]);
 useEffect(()=>{if(library&&!complete&&!preselected.current&&(preparation||personIds.length)){preselected.current=true;const saved=savedPrefixSelection(value,personIds,library.people,library.prefixContinuations);const storedChoice=continuationId&&library.prefixContinuations?.find(option=>option.id.startsWith('shared-bridge:'+continuationId+':')&&option.anchorName===library.people.find(person=>person.id===personIds.at(-1))?.name);
  if(storedChoice){setSelected(storedChoice.id);return;}
  if(saved){
   setSelected(saved);
   const continuation=library.prefixContinuations?.find(c=>c.id===saved);
   const body=continuation?.body.trim();
   if(!preparation&&value.includes('(ح)')){
    const text=body&&value.trim().endsWith(body)?value.trim().slice(0,-body.length).replace(/[،\s]+$/u,''):value;
    const reopened=prepareSavedSanadPeople(text,true,'end');
    if(reopened?.tokens.length===personIds.length)setPreparation(reopened);
   }
   return;
  }if(preparation){const bridges=library.prefixContinuations?.filter(c=>c.title===UBAYDI_BRIDGE_TITLE)||[];if(bridges.length===1)setSelected(bridges[0].id);}}},[library,complete,preparation]);
 const resolved=savedSharedBridgeDiagram(personalPrefix?.text??value,personalPrefix?.ids??personIds,library?.sharedBridgeGraphs??[],initialPreparation,issuer,continuationId||undefined);
 const diagram=resolved?.diagram;
 const recovered=issuer&&library?recoverSharedBridgePrefix(personalPrefix?.text??value,personalPrefix?.ids??personIds,(library.sharedBridgeGraphs??[]).map(bridge=>bridge.source)):null;
 const savedBranch=personIds.length>0&&draft.includes('(ح)');
 const fullPreparation=savedBranch?prepareSavedSanadPeople(draft,true,'end'):null;
 const activePreparation=preparation||diagram?.preparation||recovered||(fullPreparation?.tokens.length===personIds.length?fullPreparation:null);
 const unresolvedBranch=savedBranch&&!activePreparation;
 const route=routeId?library?.chains.find(chain=>chain.id===routeId&&chain.kind==='route'&&!chain.archived):undefined;
 const apply=(text:string,ids:string[])=>{setError('');try{
  if(!complete&&saveContinuation){
   const sourceId=automaticSharedBridgeId(text,ids,library?.sharedBridgeGraphs??[]);
   onApply(text,ids,'jazari',sourceId);setDraft(text);markPending(false);return;
  }
  const composed=complete?text:resolveBuilderPrefix(text,library?.prefixContinuations,selected).text;if(complete&&composed.trim().length<100)throw Error('أكمل رواة السند إلى النبي ﷺ ثم اعتمد الترتيب');if(!complete&&(saveContinuation||diagram?.personalText===value.trim())&&composed!==text.trim())throw Error('اختر تتمة مشتركة معتمدة مرتبطة بهوية راوي نقطة الالتقاء لحفظها مستقلة عن السند الشخصي.');onApply(composed,ids,'jazari',saveContinuation?null:undefined);setDraft(composed);markPending(false);}catch(e){markPending(true);setError(e instanceof Error?e.message:'راجع نقطة الالتقاء');}};
 return <section className="space-y-3" aria-label="محرر السند الشخصي بالرواة" data-sanad-mode={editing?"edit":"view"}>{!readOnly&&<div className="flex justify-end"><Button type="button" variant="outline" onClick={()=>setEditing(v=>!v)}>{editing?"عرض السند":"تعديل السند"}</Button></div>}{editing&&!complete&&!preparation&&draft&&!personIds.length&&<Button type="button" variant="outline" onClick={()=>{const prepared=prepareSavedSanadPeople(draft);if(!prepared){setError('راجع الرواة والفروع قبل إعداد هذا السند.');return;}setPreparation(prepared);markPending(true);setRevision(v=>v+1);}}>إعداد الرواة من السند السابق للمراجعة</Button>}{editing&&preparation&&<p className="text-sm text-muted-foreground">راجع الرواة والفروع حتى نقطة الالتقاء قبل التأكيد.</p>}{editing&&complete&&!preparation&&<p className="text-sm text-muted-foreground">هذا سند كامل: أدخل الرواة بالترتيب إلى النبي ﷺ. راجع السند قبل حفظه.</p>}{library?<>{issuer&&!editing?<Tabs defaultValue="personal" dir="rtl">
  <TabsList aria-label="نوع عرض السند" className="grid h-auto w-full grid-cols-2">
   <TabsTrigger value="personal" className="whitespace-normal">السند الشخصي</TabsTrigger>
   <TabsTrigger value="complete" className="whitespace-normal">السند المتصل الكامل</TabsTrigger>
  </TabsList>
  <TabsContent value="personal">
   {complete&&!personalPrefix?<p className="text-sm text-muted-foreground">لم يُحفظ حدّ السند الشخصي منفصلًا لهذا الطريق.</p>:<BuilderPrefixInput readOnly={!editing||unresolvedBranch} key={revision+'|'+Boolean(activePreparation)} value={diagram?.personalText??personalPrefix?.text??draft} library={library} preparation={personalPrefix?(diagram?.preparation??recovered??undefined):activePreparation} initialPersonIds={personalPrefix?.ids??(unresolvedBranch?[]:personIds)} onPendingChange={markPending} showJunction={!complete&&!saveContinuation} showOnward={!complete&&saveContinuation} names={library.people.filter(p=>!p.archived).map(p=>p.name)} onPersonCreated={person=>setLibrary(v=>v?{...v,people:[...v.people.filter(p=>p.id!==person.id),person]}:v)} continuations={library.prefixContinuations} selectedId={selected} onSelect={id=>{setSelected(id);markPending(true);}} onChange={text=>{setDraft(text);markPending(true);}} onAssemble={apply} onCreated={source=>setLibrary(v=>v?{...v,prefixContinuations:[...(v.prefixContinuations||[]),source]}:v)}/>}
  </TabsContent>
  <TabsContent value="complete">{diagram?<><SanadPathView paths={diagram.paths} renderPerson={(id,positions)=><BranchPersonCard name={diagram.names[id]} number={positions[0]} badgeLabels={positions.map(arabicDigits)}/>}/><details className="rounded border p-3"><summary>السند المحفوظ / المعاينة النصية</summary><p className="whitespace-pre-wrap leading-loose">{value}</p></details></>:<p className="text-sm text-muted-foreground">لا يمكن عرض السند الكامل حتى تتوفر تتمة مشتركة معتمدة تطابق هوية راوي نقطة الالتقاء.</p>}</TabsContent>
 </Tabs>:<>{route&&<details open className="rounded-lg border p-3"><summary className="cursor-pointer text-sm">إسناد الكتاب والطريق من المكتبة</summary><SavedRouteGraph library={library} route={route}/></details>}<BuilderPrefixInput readOnly={!editing||unresolvedBranch} key={revision+'|'+Boolean(activePreparation)} value={draft} library={library} preparation={activePreparation} initialPersonIds={unresolvedBranch?[]:personIds} onPendingChange={markPending} showJunction={!complete&&!saveContinuation} showOnward={!complete&&saveContinuation} names={library.people.filter(p=>!p.archived).map(p=>p.name)} onPersonCreated={person=>setLibrary(v=>v?{...v,people:[...v.people.filter(p=>p.id!==person.id),person]}:v)} continuations={library.prefixContinuations} selectedId={selected} onSelect={id=>{setSelected(id);markPending(true);}} onChange={text=>{setDraft(text);markPending(true);}} onAssemble={apply} onCreated={source=>setLibrary(v=>v?{...v,prefixContinuations:[...(v.prefixContinuations||[]),source]}:v)}/></>}
{editing&&pending&&value&&<Button type="button" variant="outline" size="sm" onClick={()=>{setDraft(value);setPreparation(initialPreparation);setSelected('');setError('');setRevision(v=>v+1);markPending(false);}}>إلغاء بناء الرواة واستخدام السند المحفوظ</Button>}</>:!error?<p role="status">جارٍ تحميل محرر الرواة…</p>:<Button type="button" variant="outline" onClick={load}>إعادة تحميل الرواة</Button>}{editing&&error&&<p role="alert" className="text-sm text-destructive">{error}</p>}</section>;
}
