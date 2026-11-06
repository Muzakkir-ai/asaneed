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
export default function PersonalSanadInput({value,personIds=[],complete=false,preparation:initialPreparation,onApply,onPendingChange,onEditingChange,routeId,readOnly=false}:{readOnly?:boolean;routeId?:string;value:string;preparation?:PreparedSanadPeople|null;personIds?:string[];complete?:boolean;onApply:(text:string,ids:string[],junction:'jazari')=>void;onPendingChange?:(pending:boolean)=>void;onEditingChange?:(editing:boolean)=>void}){
 const [editing,setEditing]=useState(!readOnly&&!value&&!personIds.length&&!initialPreparation);
 const [preparation,setPreparation]=useState(initialPreparation);
 const [library,setLibrary]=useState<BuilderLibrary|null>(null),[error,setError]=useState(''),[draft,setDraft]=useState(value),[selected,setSelected]=useState(''),[pending,setPending]=useState(false),[revision,setRevision]=useState(0);
 const preselected=useRef(false);
 const markPending=(next:boolean)=>{setPending(next);onPendingChange?.(next);};
 const load=async()=>{setError('');try{const response=await fetch('/api/book-builder',{headers:workspaceHeaders()});const data=await response.json();if(!response.ok)throw Error(data.error||'تعذر تحميل الرواة');setLibrary(data);}catch(e){setError(e instanceof Error?e.message:'تعذر تحميل الرواة');}};
 useEffect(()=>{void load();},[]);
 useEffect(()=>{onEditingChange?.(editing);if(editing&&preparation&&!preparation.reviewed)markPending(true);},[editing]);
 useEffect(()=>{if(library&&!complete&&!preselected.current&&(preparation||personIds.length)){preselected.current=true;const saved=savedPrefixSelection(value,personIds,library.people,library.prefixContinuations);if(saved){
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
 const savedBranch=personIds.length>0&&draft.includes('(ح)');
 const fullPreparation=savedBranch?prepareSavedSanadPeople(draft,true,'end'):null;
 const activePreparation=preparation||(fullPreparation?.tokens.length===personIds.length?fullPreparation:null);
 const unresolvedBranch=savedBranch&&!activePreparation;
 const route=routeId?library?.chains.find(chain=>chain.id===routeId&&chain.kind==='route'&&!chain.archived):undefined;
 const apply=(text:string,ids:string[])=>{setError('');try{const composed=complete?text:resolveBuilderPrefix(text,library?.prefixContinuations,selected).text;if(complete&&composed.trim().length<100)throw Error('أكمل رواة السند إلى النبي ﷺ ثم اعتمد الترتيب');onApply(composed,ids,'jazari');setDraft(composed);markPending(false);}catch(e){markPending(true);setError(e instanceof Error?e.message:'راجع نقطة الالتقاء');}};
 return <section className="space-y-3" aria-label="محرر السند الشخصي بالرواة" data-sanad-mode={editing?"edit":"view"}>{!readOnly&&<div className="flex justify-end"><Button type="button" variant="outline" onClick={()=>setEditing(v=>!v)}>{editing?"عرض السند":"تعديل السند"}</Button></div>}{editing&&!complete&&!preparation&&draft&&!personIds.length&&<Button type="button" variant="outline" onClick={()=>{const prepared=prepareSavedSanadPeople(draft);if(!prepared){setError('راجع الرواة والفروع قبل إعداد هذا السند.');return;}setPreparation(prepared);markPending(true);setRevision(v=>v+1);}}>إعداد الرواة من السند السابق للمراجعة</Button>}{editing&&preparation&&<p className="text-sm text-muted-foreground">راجع الرواة والفروع حتى نقطة الالتقاء قبل التأكيد.</p>}{editing&&complete&&!preparation&&<p className="text-sm text-muted-foreground">هذا سند كامل: أدخل الرواة بالترتيب إلى النبي ﷺ. راجع السند قبل حفظه.</p>}{library?<>{route&&<details open className="rounded-lg border p-3"><summary className="cursor-pointer text-sm">إسناد الكتاب والطريق من المكتبة</summary><SavedRouteGraph library={library} route={route}/></details>}<BuilderPrefixInput readOnly={!editing||unresolvedBranch} key={revision+'|'+Boolean(activePreparation)} value={draft} library={library} preparation={activePreparation} initialPersonIds={unresolvedBranch?[]:personIds} onPendingChange={markPending} showJunction={!complete} names={library.people.filter(p=>!p.archived).map(p=>p.name)} onPersonCreated={person=>setLibrary(v=>v?{...v,people:[...v.people.filter(p=>p.id!==person.id),person]}:v)} continuations={library.prefixContinuations} selectedId={selected} onSelect={id=>{setSelected(id);markPending(true);}} onChange={text=>{setDraft(text);markPending(true);}} onAssemble={apply} onCreated={source=>setLibrary(v=>v?{...v,prefixContinuations:[...(v.prefixContinuations||[]),source]}:v)}/>{editing&&pending&&value&&<Button type="button" variant="outline" size="sm" onClick={()=>{setDraft(value);setPreparation(initialPreparation);setSelected('');setError('');setRevision(v=>v+1);markPending(false);}}>إلغاء بناء الرواة واستخدام السند المحفوظ</Button>}</>:!error?<p role="status">جارٍ تحميل محرر الرواة…</p>:<Button type="button" variant="outline" onClick={load}>إعادة تحميل الرواة</Button>}{editing&&error&&<p role="alert" className="text-sm text-destructive">{error}</p>}</section>;
}
