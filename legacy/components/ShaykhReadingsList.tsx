import {ijazahCoverage} from '../lib/ijazahCoverage';
import {shortReadingLabel} from '../lib/qurra';
import {compactRouteBook} from '../lib/bookBuilder';
import {Button} from '@project/components/ui/button';
import {PenLine} from 'lucide-react';
type Reading={qariId:string;rawi:string};
type Route=Reading&{tariqNumber:string;tariqName:string;sanadText?:string};
export default function ShaykhReadingsList({readings,routes,onEdit,labelRoute,generalPrefix=''}:{readings:Reading[];routes:Route[];onEdit?:(r:Reading)=>void;labelRoute:(number:string,name:string)=>string;generalPrefix?:string}){
 const complete=ijazahCoverage(readings).count===10;
 const extra=routes.filter(r=>!!r.tariqNumber&&!['الشاطبية والتيسير','الدرة والتحبير'].includes(compactRouteBook(r.tariqName)));
 const normalized=(text:string)=>text.trim().replace(/[،.\s]+$/u,'');
 const specific=(r:Reading)=>routes.some(t=>!t.tariqNumber&&t.qariId===r.qariId&&t.rawi===r.rawi&&t.sanadText&&generalPrefix&&normalized(t.sanadText)!==normalized(generalPrefix));
 const row=(r:Reading,label?:string,key=r.qariId+'|'+r.rawi)=><div key={key} className="rounded-xl border bg-card p-3 flex items-center justify-between gap-3"><div><p className="font-medium text-sm">{shortReadingLabel(r.qariId,r.rawi)}</p>{(label||specific(r))&&<p className="text-xs text-muted-foreground">{label||'سند مختلف لهذه الرواية'}</p>}</div>{onEdit&&<Button type="button" variant="outline" size="sm" onClick={()=>onEdit(r)}><PenLine className="h-4 w-4"/>تعديل السند</Button>}</div>;
 const original=<div className="grid gap-2 sm:grid-cols-2">{readings.map(r=>row(r))}</div>;
 return <div className="space-y-3">{complete?<details className="rounded-xl border p-4"><summary className="cursor-pointer font-semibold">القراءات العشر الصغرى <span className="block mt-1 text-xs font-normal text-muted-foreground">الشاطبية والتيسير · الدرة والتحبير</span></summary><div className="mt-3">{original}</div></details>:original}{extra.length>0&&<section className="space-y-2"><h4 className="font-semibold text-sm">الطرق الأخرى</h4><div className="grid gap-2 sm:grid-cols-2">{extra.map((r,i)=>row(r,labelRoute(r.tariqNumber,r.tariqName),r.qariId+'|'+r.rawi+'|'+r.tariqNumber+'|'+i))}</div></section>}</div>;
}
