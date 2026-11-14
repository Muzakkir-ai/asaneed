import {useState} from 'react';
import {Button} from '@project/components/ui/button';
import {arabicDigits} from '../lib/arabicDigits';
import {maxOrderedSanads,type OrderedSanadPreview} from '../lib/orderedSanads';
import SanadPathView from './SanadPathView';

type Option={id:string;name:string};
type PickerProps={options:Option[];ids:string[];onChange:(ids:string[])=>void;disabled?:boolean};

export function OrderedSanadOrder({options,ids,onChange,disabled}:PickerProps) {
 const move=(index:number,direction:number)=>{
  const next=[...ids],target=index+direction;
  [next[index],next[target]]=[next[target],next[index]];
  onChange(next);
 };
 return <ol className="space-y-2">{ids.map((id,index)=>{
  const name=options.find(option=>option.id===id)?.name||'سند لم يعد متاحًا';
  return <li key={id} className="flex flex-wrap items-center gap-2">
   <span className="flex-1">{arabicDigits(index+1)}. {name}</span>
   <Button type="button" size="sm" variant="outline" disabled={disabled||index===0} aria-label={'رفع '+name} onClick={()=>move(index,-1)}>↑</Button>
   <Button type="button" size="sm" variant="outline" disabled={disabled||index===ids.length-1} aria-label={'خفض '+name} onClick={()=>move(index,1)}>↓</Button>
   <Button type="button" size="sm" variant="ghost" disabled={disabled} aria-label={'إزالة '+name} onClick={()=>onChange(ids.filter(value=>value!==id))}>إزالة</Button>
  </li>;
 })}</ol>;
}

export function OrderedSanadPreviewPanel({load,disabled,buttonLabel='معاينة السند المجمّع'}:{
 load:()=>Promise<OrderedSanadPreview|undefined>;disabled?:boolean;buttonLabel?:string;
}) {
 const [preview,setPreview]=useState<OrderedSanadPreview>();
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(false);
 const open=async()=>{
  setLoading(true);setError('');setPreview(undefined);
  try{const result=await load();if(!result)throw Error('تعذر تحميل المعاينة');setPreview(result);}
  catch(reason){setError(reason instanceof Error?reason.message:'تعذر تحميل المعاينة');}
  finally{setLoading(false);}
 };
 return <div className="space-y-2">
  <Button type="button" size="sm" variant="outline" disabled={disabled||loading} onClick={()=>void open()}>{loading?'جارٍ تحميل المعاينة…':buttonLabel}</Button>
  {error&&<p role="alert" className="text-destructive">{error}</p>}
  {preview&&<div className="space-y-3">
   <p className="whitespace-pre-wrap break-words rounded border p-3 leading-loose">{preview.chain.replace(/^【بيان القراءة:[^】]+】\s*/u,'')}</p>
   {!!preview.branches.length&&<details className="rounded border p-3">
    <summary>مسارات السند الشخصي ونقاط الالتقاء</summary>
    {preview.branches.map((branch,index)=><section className="mt-3 space-y-1" key={branch.sourceId}>
     <h4>{arabicDigits(index+1)}. {branch.label}</h4>
     {branch.paths.length?<SanadPathView paths={branch.paths} renderPerson={id=><span className="block rounded border bg-background p-2">{branch.names[id]}</span>}/>
      :<p>تتوفر صيغة هذا السند في المعاينة النصية.</p>}
    </section>)}
   </details>}
  </div>}
 </div>;
}

export default function OrderedSanadPicker({options,ids,onChange,disabled}:PickerProps) {
 const available=options.filter(option=>!ids.includes(option.id));
 return <fieldset className="space-y-2 rounded border p-3 text-sm" disabled={disabled}>
  <legend>الأسانيد المحفوظة لهذه الرواية</legend>
  <OrderedSanadOrder options={options} ids={ids} onChange={onChange} disabled={disabled}/>
  {!!available.length&&ids.length<maxOrderedSanads&&<select aria-label="إضافة سند إلى المعاينة" className="w-full rounded border bg-background p-2" value="" onChange={event=>{if(event.target.value)onChange([...ids,event.target.value]);}}>
   <option value="">إضافة سند محفوظ</option>
   {available.map(option=><option key={option.id} value={option.id}>{option.name}</option>)}
  </select>}
 </fieldset>;
}
