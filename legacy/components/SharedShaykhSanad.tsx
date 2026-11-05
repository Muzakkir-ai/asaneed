import {useState} from 'react';
import {Button} from '@project/components/ui/button';
import {additionalShaykhs,type AdditionalShaykhsOutputType} from '../lib/api';
import {prepareSavedSanadPeople} from '../lib/preparedSanadPeople';
import PersonalSanadInput from './PersonalSanadInput';
type Sheikh=AdditionalShaykhsOutputType['sheikhs'][number];
export default function SharedShaykhSanad({shaykh,onSaved}:{shaykh:Sheikh;onSaved:(items:Sheikh[])=>void}){
 const [chain,setChain]=useState(shaykh.personalChain),[ids,setIds]=useState(shaykh.personalPersonIds||[]),[junction,setJunction]=useState(shaykh.junction),[all,setAll]=useState(shaykh.sharedSughraSanad),[pending,setPending]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[preparation,setPreparation]=useState(shaykh.preparedShared),[revision,setRevision]=useState(0);
 const save=async()=>{setBusy(true);setError('');try{const result=await additionalShaykhs({action:'saveShared',id:shaykh.id,personalChain:chain,personalPersonIds:ids,junction,sharedSughraSanad:all});onSaved(result.sheikhs);}catch(e){setError(e instanceof Error?e.message:'تعذر حفظ السند');}finally{setBusy(false);}};
 return <section data-shared-sanad className="rounded-xl border bg-card p-4 space-y-4"><header><h3 className="font-bold text-lg">السند الشخصي المشترك</h3><p className="text-sm text-muted-foreground">أدخل الرواة مرة واحدة، واستخدمهم لجميع روايات العشر الصغرى بالطريق الأصلي. تبقى الطرق الأخرى مستقلة.</p></header><label className="flex items-start gap-3 rounded-lg border bg-background p-3 text-sm"><input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-primary" checked={all} onChange={e=>setAll(e.target.checked)}/><span>استخدام هذا السند لجميع روايات العشر الصغرى<span className="block text-xs text-muted-foreground">عند إيقافه، تُستخدم الأسانيد الخاصة المحفوظة لكل رواية، وهذا السند لمن ليس لها سند خاص.</span></span></label>
 {!preparation&&chain&&!ids.length&&<Button type="button" variant="outline" onClick={()=>{const prepared=prepareSavedSanadPeople(chain);if(!prepared)return setError('هذا النص متفرع بصيغة أخرى؛ راجعه قبل إدخاله في الرواة.');setPreparation(prepared);setRevision(v=>v+1);}}>إعداد الرواة من السند السابق للمراجعة</Button>}
 <PersonalSanadInput key={revision} value={chain} personIds={ids} preparation={preparation} onPendingChange={setPending} onApply={(text,people,end)=>{setChain(text);setIds(people);setJunction(end);}}/>
 <div className="flex flex-wrap gap-3"><Button type="button" disabled={busy||pending||!chain||!ids.length} onClick={()=>void save()}>{busy?'جارٍ الحفظ…':'حفظ السند المشترك'}</Button></div>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}</section>;
}
