import type {QiraatHeadingSettings} from '../lib/qiraatHeadingSettings';
import {DEFAULT_QIRAAT_HEADING} from '../lib/qiraatHeadingSettings';

/** Compact, print-accurate controls shared by Qurra/qira'ah certificates.
 * Sliders and numeric inputs edit the same canonical millimetre values. */
function NumberSetting({label,value,min,max,step=0.5,onChange}:{label:string;value:number;min:number;max:number;step?:number;onChange:(n:number)=>void}){
 return <label className="flex min-w-[170px] flex-1 flex-col gap-1 text-sm">
  <span className="font-medium">{label} (مم)</span>
  <div className="flex items-center gap-2">
   <input aria-label={label+' — شريط'} type="range" className="min-w-0 flex-1" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/>
   <input aria-label={label} type="number" className="w-20 rounded-md border bg-background px-2 py-1" dir="ltr" min={min} max={max} step={step} value={value} onChange={e=>{
    const n=e.target.valueAsNumber;if(Number.isFinite(n))onChange(Math.max(min,Math.min(max,n)));
   }}/>
  </div>
 </label>;
}
export default function QiraatHeadingControls({value,onChange,onReset}:{value:QiraatHeadingSettings;onChange:(value:QiraatHeadingSettings)=>void;onReset:()=>void}){
 const v={...DEFAULT_QIRAAT_HEADING,...value};
 const change=(key:keyof QiraatHeadingSettings,n:number)=>onChange({...value,[key]:n});
 return <div className="space-y-3 rounded-lg border p-3" dir="rtl" data-testid="qiraat-svg-controls">
  <div>
   <p className="font-semibold">رسوم عنوان الإجازة</p>
   <p className="text-xs text-muted-foreground">اضبط رسم «إجازة» وسطر الرواية والقراءة والطريق كلًّا على حدة. تتم المحافظة على أبعاد الحروف الأصلية.</p>
  </div>
  <div className="grid gap-3 sm:grid-cols-2">
   <fieldset className="space-y-2 rounded-md border p-3">
    <legend className="px-1 font-semibold">رسم إجازة SVG</legend>
    <NumberSetting label="عرض رسم إجازة" min={55} max={145} step={0.5} value={v.ijazahWidthMm!} onChange={n=>change('ijazahWidthMm',n)}/>
    <NumberSetting label="رفع أو خفض رسم إجازة" min={-8} max={8} value={v.ijazahOffsetMm!} onChange={n=>change('ijazahOffsetMm',n)}/>
   </fieldset>
   <fieldset className="space-y-2 rounded-md border p-3">
    <legend className="px-1 font-semibold">سطر الرواية والقراءة والطريق SVG</legend>
    <NumberSetting label="ارتفاع سطر الرواية" min={5} max={16} step={0.25} value={v.riwayahHeightMm!} onChange={n=>change('riwayahHeightMm',n)}/>
    <NumberSetting label="المسافة بين الرسم وسطر الرواية" min={0} max={20} value={v.riwayahGapMm!} onChange={n=>change('riwayahGapMm',n)}/>
    <NumberSetting label="رفع أو خفض سطر الرواية" min={-8} max={8} value={v.riwayahOffsetMm!} onChange={n=>change('riwayahOffsetMm',n)}/>
   </fieldset>
  </div>
  <details className="rounded-md border p-3">
   <summary className="cursor-pointer font-semibold">خيارات إضافية — البسملة والمسافة بعد العنوان</summary>
   <div className="mt-3 grid gap-3 sm:grid-cols-2">
    <NumberSetting label="عرض البسملة" min={15} max={80} value={v.basmalahWidthMm!} onChange={n=>change('basmalahWidthMm',n)}/>
    <NumberSetting label="المسافة بعد البسملة" min={0} max={20} value={v.basmalahGapMm!} onChange={n=>change('basmalahGapMm',n)}/>
    <NumberSetting label="المسافة بعد العنوان كاملًا" min={0} max={20} value={v.afterGapMm!} onChange={n=>change('afterGapMm',n)}/>
   </div>
  </details>
  <div className="flex flex-wrap items-center justify-between gap-2">
   <span className="text-xs text-muted-foreground">القيم السالبة ترفع، والموجبة تخفض. يمكن استعادة الرسم الأصلي دون تغيير نص الإجازة.</span>
   <button type="button" className="rounded-md border px-3 py-1.5 text-sm" onClick={onReset}>استعادة أحجام ومسافات SVG الأصلية</button>
  </div>
 </div>;
}
