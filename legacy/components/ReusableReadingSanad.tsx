import {Button} from '@project/components/ui/button';
import {shortReadingLabel} from '../lib/qurra';
import {reachesJunction} from '../lib/personalSanadValidation';
import type {AdditionalReadingSanadsOutputType} from '../lib/api';
type Source=AdditionalReadingSanadsOutputType['sanads'][number];
/** Copy a saved personal prefix only; the target keeps its own reading/route metadata. */
export default function ReusableReadingSanad({sources,current,onUse,onNew}:{sources:Source[];current:{qariId:string;rawi:string};onUse:(source:Source)=>void;onNew:()=>void}){
 const choices=sources.filter(s=>!s.tariqNumber&&!s.unifiedSanad&&(s.qariId!==current.qariId||s.rawi!==current.rawi)&&reachesJunction({personalChain:s.sanadText,junction:s.junction}));
 return <section className="space-y-3 min-w-0" aria-label="اختيار السند الشخصي"><Button type="button" variant="outline" onClick={onNew}>إنشاء سند جديد</Button>{choices.length>0&&<details className="rounded-lg border p-3"><summary className="cursor-pointer font-semibold text-sm">استخدام سند محفوظ</summary><p className="text-xs text-muted-foreground mt-2">اختر سندًا لهذا الشيخ، ثم راجعه واحفظه لهذه الرواية. يمكنك تعديل الرواة ونقطة الالتقاء.</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{choices.map(source=><Button key={source.id} type="button" variant="outline" className="h-auto min-h-11 w-full min-w-0 whitespace-normal text-start justify-start" onClick={()=>onUse(source)}>{shortReadingLabel(source.qariId,source.rawi)}</Button>)}</div></details>}</section>;
}
