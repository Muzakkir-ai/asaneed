import {ijazahCoverage} from '../lib/ijazahCoverage';
import {QURRA,shortReadingLabel} from '../lib/qurra';
import {compactRouteBook} from '../lib/bookBuilder';
import {BookOpen,ArrowUpLeft} from 'lucide-react';
type Reading={qariId:string;rawi:string;tariqNumber?:string;tariqName?:string;automatic?:boolean;variantId?:string;newVariant?:boolean};
type Route=Reading&{tariqNumber:string;tariqName:string;sanadText?:string};
export default function ShaykhReadingsList({readings,routes,onEdit,labelRoute,generalPrefix='',shared=false,variants=[]}:{shared?:boolean;variants?:{id:string;name:string;qariId:string;rawi:string}[];readings:Reading[];routes:Route[];onEdit?:(r:Reading)=>void;labelRoute:(number:string,name:string)=>string;generalPrefix?:string}){
 const complete=ijazahCoverage(readings).count===10;
 const extra=routes.filter(r=>!!r.tariqNumber&&!['الشاطبية والتيسير','الدرة والتحبير'].includes(compactRouteBook(r.tariqName)));
 const normalized=(text:string)=>text.trim().replace(/[،.\s]+$/u,'');
 const specific=(r:Reading)=>routes.some(t=>!t.tariqNumber&&t.qariId===r.qariId&&t.rawi===r.rawi&&t.sanadText&&generalPrefix&&normalized(t.sanadText)!==normalized(generalPrefix));
 const row=(r:Reading,label?:string,key=r.qariId+'|'+r.rawi)=>{
  const editable=onEdit&&!r.automatic&&!(shared&&!r.tariqNumber);
  const alternatives=variants.filter(v=>v.qariId===r.qariId&&v.rawi===r.rawi);
  const name=shortReadingLabel(r.qariId,r.rawi),className="workspace-action-card workspace-book-card w-full h-auto min-w-0 items-start justify-start gap-3 whitespace-normal text-start";
  const family=QURRA.find(q=>q.id===r.qariId)?.family;
  const book=label||(family==='seven'?'الشاطبية والتيسير':family==='three'?'الدرة والتحبير':'');
  const content=<><span className="workspace-card-icon" aria-hidden="true"><BookOpen className="h-5 w-5"/></span><span className="min-w-0 flex-1 space-y-1"><span className="workspace-card-title block font-bold">{name}</span><span className="block text-xs text-muted-foreground">{(r.automatic||shared&&!r.tariqNumber)?'السند الشخصي المشترك':specific(r)?'سند مختلف لهذه الرواية':'إجازة قراءات'}</span>{book&&<span className="workspace-card-badge">{book}</span>}</span>{editable&&<span className="workspace-card-arrow" aria-hidden="true"><ArrowUpLeft className="h-4 w-4"/></span>}</>;
  const card=editable?<button key={key} type="button" className={className} aria-label={'فتح سند '+name+(label?' — '+label:'')} onClick={()=>onEdit(r)}>{content}</button>:<article key={key} className={className} style={{cursor:'default'}}>{content}</article>;
  return <div key={key}>{card}{onEdit&&(!r.tariqNumber||r.automatic&&!readings.some(x=>x.qariId===r.qariId&&x.rawi===r.rawi)&&extra.find(x=>x.automatic&&x.qariId===r.qariId&&x.rawi===r.rawi)===r)&&<details className="mt-2 rounded-lg border p-2 text-sm">
    <summary className="cursor-pointer">الأسانيد الشخصية للرواية{alternatives.length?` (${alternatives.length})`:''}</summary>
    <div className="mt-2 flex flex-wrap gap-2">
     {alternatives.map(v=><button key={v.id} type="button" className="rounded border px-2 py-1" onClick={()=>onEdit({qariId:r.qariId,rawi:r.rawi,variantId:v.id})}>{v.name}</button>)}
     <button type="button" className="rounded border px-2 py-1" onClick={()=>onEdit({qariId:r.qariId,rawi:r.rawi,newVariant:true})}>إضافة سند شخصي</button>
    </div>
   </details>}</div>;
 };
 const original=<div className="grid gap-2 sm:grid-cols-2">{readings.map(r=>row(r))}</div>;
 return <div className="space-y-3">{complete?<details className="rounded-xl border p-4"><summary className="cursor-pointer font-semibold">القراءات العشر الصغرى <span className="block mt-1 text-xs font-normal text-muted-foreground">{shared?'سند شخصي واحد · الشاطبية والتيسير · الدرة والتحبير':'الشاطبية والتيسير · الدرة والتحبير'}</span></summary><div className="mt-3">{original}</div></details>:original}{extra.length>0&&<details className="rounded-xl border p-4"><summary className="cursor-pointer font-semibold">الطرق من العشر الكبرى</summary><div className="mt-3 grid gap-2 sm:grid-cols-2">{extra.map((r,i)=>row(r,labelRoute(r.tariqNumber,r.tariqName),r.qariId+'|'+r.rawi+'|'+r.tariqNumber+'|'+i))}</div></details>}</div>;
}
