import PreparedSanadGraph from './PreparedSanadGraph';
import {preparedSanadGraph} from '../lib/preparedSanadGraph';
import {Plus} from 'lucide-react';
import {useState,type ReactNode} from 'react';
import {Button} from '@project/components/ui/button';
import {workspaceHeaders} from '../lib/workspaceSelection';
import {sanadKey} from '../lib/unifiedSanad';
import {preparedSanadText,type PreparedSanadPeople} from '../lib/preparedSanadPeople';
import type {BuilderLibrary,BuilderPerson} from '../lib/bookBuilder';
import ChainNarratorRow from './ChainNarratorRow';
type Node={name:string;personId?:string;key:string};
export default function PersonalSanadPeople({library,onPersonCreated,onApply,initialPersonIds=[],onPendingChange,beforeApply,preparation}:{library:BuilderLibrary;onPersonCreated:(person:BuilderPerson)=>void;onApply:(text:string,ids:string[])=>void;initialPersonIds?:string[];onPendingChange?:(pending:boolean)=>void;beforeApply?:ReactNode;preparation?:PreparedSanadPeople|null}){
 const matches=(name:string)=>library.people.filter(p=>!p.archived&&[p.name,...(Array.isArray(p.aliases)?p.aliases:[]).flatMap(a=>a&&typeof a.name==='string'?[a.name]:[])].some(value=>sanadKey(value)===sanadKey(name)));
 const [nodes,setNodes]=useState<Node[]>(()=>preparation?preparation.tokens.map((t,i)=>{const found=matches(t.name);return {key:`prepared-${i}`,name:t.name,personId:initialPersonIds.length===preparation.tokens.length?initialPersonIds[i]:found.length===1?found[0].id:undefined};}):initialPersonIds.length?initialPersonIds.map((id,i)=>({key:`saved-${i}`,personId:id,name:library.people.find(p=>p.id===id)?.name||'راوٍ غير متاح'})):[{name:'',key:'first'}]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const create=async(name:string,alias:string,distinct:boolean)=>{const response=await fetch('/api/book-builder',{method:'POST',headers:{'content-type':'application/json',...workspaceHeaders()},body:JSON.stringify({action:'person',name,displayName:alias,distinct})});const person=await response.json();if(!response.ok)throw Error(person.error||'تعذر حفظ الراوي');onPersonCreated(person);return person as BuilderPerson;};
 const update=(fn:(v:Node[])=>Node[])=>{onPendingChange?.(true);setNodes(fn);};
 const insert=(index:number)=>update(v=>[...v.slice(0,index),{name:'',key:crypto.randomUUID()},...v.slice(index)]);
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
   onApply(text,next.map(n=>n.personId!));
  }catch(e){setError(e instanceof Error?e.message:'تعذر اعتماد الرواة');}finally{setBusy(false);}
 };
 const graph=preparation?preparedSanadGraph(preparation,nodes):null;
 const renderRow=(i:number,ordinal=i+1,indices=[i])=>{const node=nodes[i];return <ChainNarratorRow node={{...node,source:false}} number={ordinal} index={i} count={nodes.length} lib={library} roles={false} lockedLayout={!!preparation} previous={preparation?undefined:nodes[i-1]?.personId} next={preparation?undefined:nodes[i+1]?.personId} onCreate={create} onChange={value=>update(v=>v.map((n,j)=>indices.includes(j)?{...n,...value}:n))} onRemove={()=>update(v=>v.filter((_,j)=>j!==i))} onMove={direction=>update(v=>{const next=[...v];[next[i],next[i+direction]]=[next[i+direction],next[i]];return next;})}/>;};
 return <fieldset disabled={busy} className="space-y-3 rounded-lg border p-3" aria-busy={busy}>
 <p className="text-xs text-muted-foreground">{preparation?'الرواة مُعدّون من النص السابق للمراجعة. تبقى ألفاظ الاتصال والفروع والتكرارات كما كُتبت، وتُحفظ الأسماء عند التأكيد.':'أضف شيوخ سندك بالترتيب، من شيخك المباشر حتى نهاية سندك الشخصي.'}</p>
 {graph?<PreparedSanadGraph graph={graph} renderNode={(entry,ordinal)=>renderRow(entry.indices[0],ordinal,entry.indices)}/>:nodes.map((node,i)=><div key={node.key} className="space-y-2">{preparation&&i>0&&<p className="text-xs text-muted-foreground">{preparation.tokens[i].before.trim()==='و'?'مع الراوي السابق — في الفرع نفسه':preparation.tokens[i].before.trim().replace(/^،\s*/u,'')}</p>}{renderRow(i)}{!preparation&&<Button type="button" size="sm" variant="outline" disabled={nodes.length>=100} onClick={()=>insert(i+1)}><Plus aria-hidden="true" className="h-4 w-4"/>إضافة راوٍ بعده</Button>}</div>)}
 {beforeApply}<Button type="button" onClick={()=>void adopt()}>{busy?'جارٍ حفظ الأسماء…':preparation?'تأكيد الرواة من النص السابق':'اعتماد ترتيب الرواة'}</Button>
 <p className="text-xs text-muted-foreground">راجع السند المركب ثم احفظ الإجازة.</p>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
 </fieldset>;
}
