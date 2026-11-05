import {ijazahCoverage} from '../lib/ijazahCoverage';
import {shortReadingLabel} from '../lib/qurra';
import {compactRouteBook} from '../lib/bookBuilder';
import {BookOpen,ArrowUpLeft} from 'lucide-react';
type Reading={qariId:string;rawi:string;tariqNumber?:string;tariqName?:string};
type Route=Reading&{tariqNumber:string;tariqName:string;sanadText?:string};
export default function ShaykhReadingsList({readings,routes,onEdit,labelRoute,generalPrefix='',shared=false}:{shared?:boolean;readings:Reading[];routes:Route[];onEdit?:(r:Reading)=>void;labelRoute:(number:string,name:string)=>string;generalPrefix?:string}){
 const complete=ijazahCoverage(readings).count===10;
 const extra=routes.filter(r=>!!r.tariqNumber&&!['الشاطبية والتيسير','الدرة والتحبير'].includes(compactRouteBook(r.tariqName)));
 const normalized=(text:string)=>text.trim().replace(/[،.\s]+$/u,'');
 const specific=(r:Reading)=>routes.some(t=>!t.tariqNumber&&t.qariId===r.qariId&&t.rawi===r.rawi&&t.sanadText&&generalPrefix&&normalized(t.sanadText)!==normalized(generalPrefix));
 const row=(r:Reading,label?:string,key=r.qariId+'|'+r.rawi)=>{
  const editable=onEdit&&!(shared&&!r.tariqNumber);
  const name=shortReadingLabel(r.qariId,r.rawi),className="workspace-action-card workspace-book-card w-full h-auto min-w-0 items-start justify-start gap-3 whitespace-normal text-start";
  const content=<><span className="workspace-card-icon" aria-hidden="true"><BookOpen className="h-5 w-5"/></span><span className="min-w-0 flex-1 space-y-1"><span className="workspace-card-title block font-bold">{name}</span><span className="block text-xs text-muted-foreground">{shared&&!r.tariqNumber?'نفس السند المشترك':specific(r)?'سند مختلف لهذه الرواية':'إجازة قراءات'}</span><span className="workspace-card-badge">{label||(shared?'السند المشترك':'الطريق الأصلي')}</span></span>{editable&&<span className="workspace-card-arrow" aria-hidden="true"><ArrowUpLeft className="h-4 w-4"/></span>}</>;
  return editable?<button key={key} type="button" className={className} aria-label={'فتح سند '+name+(label?' — '+label:'')} onClick={()=>onEdit(r)}>{content}</button>:<article key={key} className={className} style={{cursor:'default'}}>{content}</article>;
 };
 const original=<div className="grid gap-2 sm:grid-cols-2">{readings.map(r=>row(r))}</div>;
 return <div className="space-y-3">{complete?<details className="rounded-xl border p-4"><summary className="cursor-pointer font-semibold">القراءات العشر الصغرى <span className="block mt-1 text-xs font-normal text-muted-foreground">{shared?'سند شخصي واحد · الشاطبية والتيسير · الدرة والتحبير':'الشاطبية والتيسير · الدرة والتحبير'}</span></summary><div className="mt-3">{original}</div></details>:original}{extra.length>0&&<section className="space-y-2"><h4 className="font-semibold text-sm">الطرق الأخرى</h4><div className="grid gap-2 sm:grid-cols-2">{extra.map((r,i)=>row(r,labelRoute(r.tariqNumber,r.tariqName),r.qariId+'|'+r.rawi+'|'+r.tariqNumber+'|'+i))}</div></section>}</div>;
}
