import {useState} from 'react';
import {Button} from '@project/components/ui/button';
import {additionalShaykhs,type AdditionalShaykhsOutputType} from '../lib/api';
import PersonalSanadInput from './PersonalSanadInput';
type Sheikh=AdditionalShaykhsOutputType['sheikhs'][number];
export default function SharedShaykhSanad({shaykh,onSaved}:{shaykh:Sheikh;onSaved:(items:Sheikh[])=>void}){
 const [chain,setChain]=useState(shaykh.personalChain),[ids,setIds]=useState(shaykh.personalPersonIds||[]),[junction,setJunction]=useState(shaykh.junction),[all,setAll]=useState(shaykh.sharedSughraSanad),[pending,setPending]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [editing,setEditing]=useState(!chain&&!ids.length&&!shaykh.preparedShared);
 const save=async()=>{setBusy(true);setError('');try{const result=await additionalShaykhs({action:'saveShared',id:shaykh.id,personalChain:chain,personalPersonIds:ids,junction,sharedSughraSanad:all});onSaved(result.sheikhs);}catch(e){setError(e instanceof Error?e.message:'تعذر حفظ السند');}finally{setBusy(false);}};
 return <section data-shared-sanad className="rounded-xl border bg-card p-4 space-y-4"><header><h3 className="font-bold text-lg">السند الشخصي المشترك</h3>{editing&&<p className="text-sm text-muted-foreground">أضف السند الشخصي للشيخ مرة واحدة.</p>}</header><label className="flex items-start gap-3 rounded-lg border bg-background p-3 text-sm"><input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-primary" checked={all} disabled={!editing} onChange={e=>setAll(e.target.checked)}/><span>استخدام هذا السند تلقائيًا لجميع قراءات الشيخ<span className="block text-xs text-muted-foreground">يُستخدم السند المشترك لروايات الشاطبية والتيسير والدرة والتحبير. تُحفظ أسانيد الطرق المرقّمة مستقلة.</span></span></label>

 <PersonalSanadInput onEditingChange={setEditing} value={chain} personIds={ids} preparation={shaykh.preparedShared} onPendingChange={setPending} onApply={(text,people,end)=>{setChain(text);setIds(people);setJunction(end);}}/>
 {editing&&<div className="flex flex-wrap gap-3"><Button type="button" disabled={busy||pending||!chain||!ids.length} onClick={()=>void save()}>{busy?'جارٍ الحفظ…':'حفظ السند المشترك'}</Button></div>}{editing&&error&&<p role="alert" className="text-sm text-destructive">{error}</p>}</section>;
}
