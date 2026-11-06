import {useState} from 'react';
import {Button} from '@project/components/ui/button';
import {additionalShaykhs,type AdditionalShaykhsOutputType} from '../lib/api';
import PersonalSanadInput from './PersonalSanadInput';
type Sheikh=AdditionalShaykhsOutputType['sheikhs'][number];
export default function SharedShaykhSanad({shaykh,onSaved,kubra=false}:{shaykh:Sheikh;kubra?:boolean;onSaved:(items:Sheikh[])=>void}){
 const [chain,setChain]=useState(kubra?shaykh.kubraPersonalChain:shaykh.personalChain),[ids,setIds]=useState(kubra?shaykh.kubraPersonalPersonIds:shaykh.personalPersonIds),[junction,setJunction]=useState(kubra?shaykh.kubraJunction:shaykh.junction),[pending,setPending]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [continuationId,setContinuationId]=useState(kubra?shaykh.kubraContinuationId:shaykh.continuationId);
 const [editing,setEditing]=useState(!chain&&!ids.length&&(kubra||!shaykh.preparedShared));
 const save=async()=>{setBusy(true);setError('');try{const result=await additionalShaykhs({action:'saveShared',id:shaykh.id,personalChain:chain,personalPersonIds:ids,continuationId,junction,sanadScope:kubra?'kubra':'sughra'});onSaved(result.sheikhs);}catch(e){setError(e instanceof Error?e.message:'تعذر حفظ السند');}finally{setBusy(false);}};
 return <section data-shared-sanad className="rounded-xl border bg-card p-4 space-y-4"><header><h3 className="font-bold text-lg">{kubra?'السند الشخصي المشترك للكبرى':'السند الشخصي المشترك'}</h3>{editing&&<p className="text-sm text-muted-foreground">أضف السند الشخصي للشيخ مرة واحدة.</p>}</header>

 <PersonalSanadInput saveContinuation continuationId={continuationId} onEditingChange={setEditing} value={chain} personIds={ids} preparation={kubra?null:shaykh.preparedShared} onPendingChange={setPending} onApply={(text,people,end,reference)=>{setContinuationId(reference);setChain(text);setIds(people);setJunction(end);}}/>
 {editing&&<div className="flex flex-wrap gap-3"><Button type="button" disabled={busy||pending||!chain||!ids.length} onClick={()=>void save()}>{busy?'جارٍ الحفظ…':'حفظ السند المشترك'}</Button></div>}{editing&&error&&<p role="alert" className="text-sm text-destructive">{error}</p>}</section>;
}
