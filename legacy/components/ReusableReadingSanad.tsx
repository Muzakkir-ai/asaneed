import {useRef} from 'react';
import {Copy,Plus} from 'lucide-react';
import {Button} from '@project/components/ui/button';
import {shortReadingLabel} from '../lib/qurra';
import {reachesJunction} from '../lib/personalSanadValidation';
import type {AdditionalReadingSanadsOutputType} from '../lib/api';
type Source=AdditionalReadingSanadsOutputType['sanads'][number];

/** The chosen source is copied into the CURRENT reading editor, never opened or changed in place. */
export default function ReusableReadingSanad({sources,current,shaykhName,onUse,onNew}:{shaykhName:string;sources:Source[];current:{qariId:string;rawi:string};onUse:(source:Source)=>void;onNew:()=>void}){
 const picker=useRef<HTMLDetailsElement>(null);
 const choices=sources.filter(s=>!s.tariqNumber&&!s.unifiedSanad&&(s.qariId!==current.qariId||s.rawi!==current.rawi)&&(s.continuationId||reachesJunction({personalChain:s.sanadText,junction:s.junction})));
 return <section className="space-y-2 min-w-0" aria-label="اختيار السند الشخصي">
  <div className="grid gap-3">
   <Button type="button" variant="outline" onClick={()=>{if(picker.current)picker.current.open=false;onNew();}}><Plus className="h-4 w-4" aria-hidden="true"/>إنشاء سند جديد</Button>
   {choices.length>0&&<details ref={picker} className="min-w-0 flex-1 rounded-lg border px-3 py-2">
    <summary className="cursor-pointer font-semibold text-sm">استخدام سند محفوظ</summary>
    <p className="mt-2 text-xs text-muted-foreground">اختر نسخة من أسانيد {shaykhName} ثم راجع الرواة واحفظ.</p>
    <div className="mt-3 grid gap-2 sm:grid-cols-2">{choices.map(source=><Button key={source.id} type="button" variant="outline" className="h-auto min-h-16 w-full min-w-0 whitespace-normal text-start justify-start gap-3" onClick={()=>{onUse(source);if(picker.current)picker.current.open=false;}}><Copy className="h-4 w-4 shrink-0" aria-hidden="true"/><span className="min-w-0"><span className="block font-semibold">{shaykhName} · {shortReadingLabel(source.qariId,source.rawi)}</span><span className="block text-xs text-muted-foreground">{source.variantName||'السند الأساسي'}</span></span></Button>)}</div>
   </details>}
  </div>
 </section>;
}
