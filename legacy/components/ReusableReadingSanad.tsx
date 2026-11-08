import {useRef} from 'react';
import {Button} from '@project/components/ui/button';
import {shortReadingLabel} from '../lib/qurra';
import {reachesJunction} from '../lib/personalSanadValidation';
import type {AdditionalReadingSanadsOutputType} from '../lib/api';
type Source=AdditionalReadingSanadsOutputType['sanads'][number];

/** The chosen source is copied into the CURRENT reading editor, never opened or changed in place. */
export default function ReusableReadingSanad({sources,current,onUse,onNew}:{sources:Source[];current:{qariId:string;rawi:string};onUse:(source:Source)=>void;onNew:()=>void}){
 const picker=useRef<HTMLDetailsElement>(null);
 const choices=sources.filter(s=>!s.tariqNumber&&!s.unifiedSanad&&(s.qariId!==current.qariId||s.rawi!==current.rawi)&&(s.continuationId||reachesJunction({personalChain:s.sanadText,junction:s.junction})));
 return <section className="space-y-2 min-w-0" aria-label="اختيار السند الشخصي">
  <div className="flex flex-wrap items-start gap-2">
   <Button type="button" variant="outline" onClick={()=>{if(picker.current)picker.current.open=false;onNew();}}>إنشاء سند جديد</Button>
   {choices.length>0&&<details ref={picker} className="min-w-0 flex-1 rounded-lg border px-3 py-2">
    <summary className="cursor-pointer font-semibold text-sm">استخدام سند محفوظ</summary>
    <p className="mt-2 text-xs text-muted-foreground">اختر سندًا لنسخ رواته ونقطة التقائه إلى هذه الرواية. لا يتغير السند الأصلي، ولن تحفظ النسخة حتى تضغط «حفظ السند».</p>
    <div className="mt-3 grid gap-2 sm:grid-cols-2">{choices.map(source=><Button key={source.id} type="button" variant="outline" className="h-auto min-h-11 w-full min-w-0 whitespace-normal text-start justify-start" onClick={()=>{onUse(source);if(picker.current)picker.current.open=false;}}>نسخ سند {shortReadingLabel(source.qariId,source.rawi)}</Button>)}</div>
   </details>}
  </div>
 </section>;
}
