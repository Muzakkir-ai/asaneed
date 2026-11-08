'use client';

import {useMemo,useState} from 'react';
import {ArrowDown,ArrowUp,Check,Plus,Save,Trash2,X} from 'lucide-react';
import NarratorPicker from '../../../legacy/components/NarratorPicker';
import {workspaceHeaders} from '../../../legacy/lib/workspaceSelection';
import {displayRawi,shortQariName} from '../../../legacy/lib/qurra';
import {fullRawiName,rawiIdentity} from '../../../legacy/lib/rawiIdentity';
import {builderNameKey} from '../../../legacy/lib/bookBuilder';
import type {BuilderChain,BuilderLibrary,BuilderNode,BuilderPerson} from '../../../legacy/lib/bookBuilder';

type EditNode={key:string;name:string;personId?:string;source:boolean;sourceLevel:'upper'|'branch'|null};
const newNode=():EditNode=>({key:crypto.randomUUID(),name:'',source:false,sourceLevel:null});
const clone=(route:BuilderChain,people:BuilderPerson[]):EditNode[][]=>
 route.branches.map(branch=>branch.map(node=>({
  key:crypto.randomUUID(),
  name:people.find(p=>p.id===node.person_id)?.name||'',
  personId:node.person_id,source:node.route_source,sourceLevel:node.source_level||null,
 })));
const ids=(branches:BuilderNode[][])=>branches.map(branch=>branch.map(node=>node.person_id));
const equal=(a:BuilderNode[][],b:BuilderNode[][])=>JSON.stringify(ids(a))===JSON.stringify(ids(b))
 &&JSON.stringify(a)===JSON.stringify(b);
async function builderApi(body?:unknown){
 const response=await fetch('/api/book-builder',{
  method:body?'POST':'GET',
  headers:{'content-type':'application/json',...workspaceHeaders()},
  cache:'no-store',...(body?{body:JSON.stringify(body)}:{}),
 });
 const result=await response.json();
 if(!response.ok)throw Error(result.error||'تعذر حفظ السند');
 return result;
}

/** Edit only the selected saved route's narrator IDs.
 * All book, source and other branches are retained; nothing is invented.
 * The existing save_builder_chain RPC performs permission and revision checks.
 */
export default function SimpleRouteEditor({library,route,onSaved,onClose}:{
 library:BuilderLibrary;route:BuilderChain;onSaved:()=>Promise<void>|void;onClose:()=>void;
}){
 const [branches,setBranches]=useState<EditNode[][]>(()=>clone(route,library.people));
 const [people,setPeople]=useState(library.people);
 const [branchIndex,setBranchIndex]=useState(0);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [changed,setChanged]=useState(false);
 const workingLibrary=useMemo(()=>({...library,people}),[library,people]);
 const book=library.books.find(b=>b.id===route.book_id);
 const author=people.find(p=>p.id===book?.author_id)?.name||'صاحب الكتاب';
 const active=branches[branchIndex]||[];
 const target=rawiIdentity(route.qari_id,route.rawi);
 const targetPerson=target&&people.find(p=>!p.archived&&builderNameKey(p.name)===builderNameKey(target.fullName));
 const targetLinked=!!targetPerson&&active.some(node=>node.personId===targetPerson.id);
 const modify=(change:(branch:EditNode[])=>EditNode[])=>{
  setBranches(previous=>previous.map((branch,index)=>index===branchIndex?change(branch):branch));
  setChanged(true);setError('');
 };
 const createPerson=async(name:string,alias:string,distinct:boolean)=>{
  const result=await builderApi({action:'person',name,displayName:alias,distinct}) as BuilderPerson;
  setPeople(previous=>[...previous.filter(p=>p.id!==result.id),result]);
  return result;
 };
 const cancel=()=>{if(!changed||window.confirm('إغلاق التعديل دون حفظ التغييرات؟'))onClose();};
 const save=async()=>{
  if(busy)return;
  const currentPeople=new Set(people.filter(p=>!p.archived).map(p=>p.id));
  const nodes:BuilderNode[][]=branches.map(branch=>branch.map(n=>({
   person_id:n.personId||'',route_source:n.source,source_level:n.source?n.sourceLevel:null,
  })));
  if(nodes.some((row,i)=>row.some((n,j)=>!n.person_id||!currentPeople.has(n.person_id)||!branches[i][j].name.trim()))){
   setError('اختر كل راوٍ من القائمة المحفوظة، أو أنشئه من الزر يسار حقل الاسم أولاً.');return;
  }
  if(nodes.some(row=>new Set(row.map(n=>n.person_id)).size!==row.length)){
   setError('يوجد راوٍ مكرر داخل الفرع نفسه؛ تحقق من ترتيب السند.');return;
  }
  if(!book||!route.book_chain_id){setError('إسناد الكتاب المرتبط بهذا الطريق غير متاح؛ لا يمكن التعديل دون مصدره.');return;}
  if(!changed){onClose();return;}
  setBusy(true);setError('');
  try{
   const record={
    id:route.id,revision:route.revision,book_id:route.book_id,
    book_chain_id:route.book_chain_id,kind:'route' as const,title:route.title,
    qari_id:route.qari_id,rawi:route.rawi,continuation:route.continuation,
    continuation_ids:route.continuation_ids||null,
    continuation_override:!!route.continuation_override,confirmed:false,
    upper_route_name:route.upper_route_name||'',branch_route_name:route.branch_route_name||'',
    reading_scope:route.reading_scope||'unspecified',branches:nodes,
   };
   await builderApi({action:'chain',record});
   const latest=await builderApi() as BuilderLibrary;
   const persisted=latest.chains.find(c=>c.id===route.id&&!c.archived);
   if(!persisted||!equal(persisted.branches,nodes)||persisted.confirmed){
    throw Error('تم إرسال التعديل لكن تعذر التحقق من النسخة المحفوظة؛ افتح السند من جديد قبل إجراء تعديلات أخرى.');
   }
   await onSaved();
   onClose();
  }catch(e){setError(e instanceof Error?e.message:'تعذر حفظ السند');}
  finally{setBusy(false);}
 };
 return <section className="space-y-4 rounded-xl border bg-card p-3 sm:p-5" dir="rtl" aria-label="محرر السند المبسط">
  <header className="flex flex-wrap items-start justify-between gap-3">
   <div className="space-y-1">
    <h2 className="text-lg font-bold">تعديل السند</h2>
    <p className="text-sm text-muted-foreground">{shortQariName(route.qari_id)} — {displayRawi(route.qari_id,route.rawi)} · {book?.title}</p>
   </div>
   <button type="button" onClick={cancel} disabled={busy} className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-muted"><X size={16}/> إلغاء</button>
  </header>
  <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm">ابدأ من <strong>{author}</strong>، ثم أضف من أخذ عنه كل راوٍ بالترتيب. <strong>لا تُنشئ أسماء مكررة</strong>: اختر الاسم المحفوظ من الاقتراحات.</p>
  {branches.length>1&&<div className="flex flex-wrap items-center gap-2" role="group" aria-label="اختيار فرع السند">
   {branches.map((_,index)=><button key={index} type="button" aria-pressed={index===branchIndex} onClick={()=>setBranchIndex(index)}
    className={'rounded-md border px-3 py-2 text-sm '+(index===branchIndex?'border-primary bg-primary/10 font-semibold':'hover:bg-muted')}>الفرع {index+1}</button>)}
   <span className="text-xs text-muted-foreground">كل فرع محفوظ مستقلًا.</span>
  </div>}
  <div className="space-y-2">
   <div className="rounded-lg border border-dashed p-3 text-sm"><strong>بداية الطريق:</strong> {author}</div>
   {active.map((node,index)=><div key={node.key} className="space-y-1">
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2 rounded-lg border p-2 sm:p-3">
     <span className="min-w-6 pt-2 text-center text-xs text-muted-foreground">{index+1}</span>
     <div className="min-w-0">
      <NarratorPicker lib={workingLibrary} node={node} previous={index?active[index-1]?.personId:book?.author_id}
       next={active[index+1]?.personId} onCreate={createPerson}
       onChange={value=>modify(row=>row.map((current,i)=>i===index?{...current,...value}:current))}/>
     </div>
     <div className="flex flex-col gap-1">
      <button type="button" title="نقل للأعلى" aria-label={'نقل الراوي '+(index+1)+' للأعلى'} disabled={busy||index===0} onClick={()=>modify(row=>{const copy=[...row];[copy[index-1],copy[index]]=[copy[index],copy[index-1]];return copy;})} className="rounded border p-1.5 disabled:opacity-30 hover:bg-muted"><ArrowUp size={14}/></button>
      <button type="button" title="نقل للأسفل" aria-label={'نقل الراوي '+(index+1)+' للأسفل'} disabled={busy||index===active.length-1} onClick={()=>modify(row=>{const copy=[...row];[copy[index+1],copy[index]]=[copy[index],copy[index+1]];return copy;})} className="rounded border p-1.5 disabled:opacity-30 hover:bg-muted"><ArrowDown size={14}/></button>
      <button type="button" title="حذف" aria-label={'حذف الراوي '+(index+1)} disabled={busy} onClick={()=>modify(row=>row.filter((_,i)=>i!==index))} className="rounded border p-1.5 text-destructive hover:bg-muted"><Trash2 size={14}/></button>
     </div>
    </div>
    <div className="flex justify-start">
     <button type="button" disabled={busy} onClick={()=>modify(row=>[...row.slice(0,index+1),newNode(),...row.slice(index+1)])}
      className="inline-flex items-center gap-1 rounded-md border border-dashed px-2 py-1 text-xs text-primary hover:bg-primary/10"><Plus size={13}/> إضافة راوٍ بعده</button>
    </div>
   </div>)}
   {!active.length&&<p className="rounded border border-dashed p-4 text-sm text-muted-foreground">لا يوجد راوٍ في هذا الفرع بعد. ابدأ بإضافة أول راوٍ من القائمة المحفوظة.</p>}
   <button type="button" disabled={busy} onClick={()=>modify(row=>[...row,newNode()])} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/5 p-3 text-sm font-semibold text-primary hover:bg-primary/10"><Plus size={16}/> إضافة الراوي التالي</button>
   <div className="space-y-2 rounded-lg border border-dashed p-3 text-sm">
    <p className="text-xs text-muted-foreground">الراوي صاحب الرواية</p>
    <strong className="block text-base leading-8">{fullRawiName(route.qari_id,route.rawi)}</strong>
    {targetLinked?<p className="text-xs text-muted-foreground">هذا الراوي موجود داخل الفرع بالفعل.</p>:targetPerson?
     <button type="button" disabled={busy} onClick={()=>modify(row=>[...row,{...newNode(),name:targetPerson.name,personId:targetPerson.id}])}
      className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm text-primary hover:bg-primary/10"><Plus size={14}/> إضافة هذا الراوي إلى السند</button>:
     <p className="text-xs text-muted-foreground">لم تُطابق هوية هذا الراوي في المكتبة. استخدم خانة «إضافة الراوي التالي» وابحث عن اسمه.</p>}
    <p className="text-xs text-muted-foreground">راجع اتصال هذا الراوي بمن قبله قبل الحفظ. ويمكنك بعد ذلك إضافة الإمام من قائمة الأسماء المحفوظة.</p>
   </div>
  </div>
  {changed&&<p role="status" className="text-xs text-muted-foreground">لديك تغييرات غير محفوظة. سيُحفظ الطريق بوصفه «قيد المراجعة» حتى تُراجع التتمة المعتمدة بصورة مستقلة.</p>}
  {error&&<p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
  <div className="flex flex-wrap gap-2 border-t pt-3">
   <button type="button" disabled={busy||!changed} onClick={()=>void save()} className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 font-semibold text-primary-foreground disabled:opacity-40"><Save size={16}/>{busy?'جارٍ الحفظ…':'حفظ التغييرات'}</button>
   <button type="button" disabled={busy} onClick={cancel} className="rounded-md border px-4 py-2.5 text-sm hover:bg-muted">إلغاء</button>
  </div>
 </section>;
}
