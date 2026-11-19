import {useEffect,useState} from 'react';
import {Button} from '@project/components/ui/button';
import {arabicDigits} from '../lib/arabicDigits';
import {maxOrderedSanads,type OrderedSanadPreview} from '../lib/orderedSanads';
import SanadPathView from './SanadPathView';

type Option={id:string;name:string};
type PickerProps={options:Option[];ids:string[];onChange:(ids:string[])=>void;disabled?:boolean;loadCount?:(id:string)=>Promise<number|null>};

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

export default function OrderedSanadPicker({options,ids,onChange,disabled,loadCount}:PickerProps) {
 const [counts,setCounts]=useState<Record<string,number|null>>({});
 const optionKey=JSON.stringify(options.map(option=>option.id));
 useEffect(()=>{
  if(!loadCount)return;
  let active=true,index=0;
  setCounts({});
  const pending=JSON.parse(optionKey) as string[];
  async function worker(){
   while(active&&index<pending.length){
    const id=pending[index++];
    const count=await loadCount!(id).catch(()=>null);
    if(active)setCounts(previous=>({...previous,[id]:count}));
   }
  }
  void Promise.all([worker(),worker()]);
  return()=>{active=false;};
 },[optionKey,loadCount]);
 const allSelected=options.length>0&&options.every(option=>ids.includes(option.id));
 return <fieldset className="space-y-3 rounded-xl border bg-card p-3 text-sm" disabled={disabled}>
  <legend className="px-1 font-semibold">الأسانيد المحفوظة لهذه الرواية</legend>
  <div className="flex flex-wrap items-center justify-between gap-2">
   <span className="text-xs text-muted-foreground" role="status">{arabicDigits(ids.length)} محدد</span>
   <Button type="button" size="sm" variant="ghost" disabled={disabled} onClick={()=>onChange(allSelected?[]:options.map(option=>option.id))}>{allSelected?'مسح التحديد':'تحديد الكل'}</Button>
  </div>
  <div className="grid gap-2 sm:grid-cols-2">
   {options.map(option=>{
    const selected=ids.includes(option.id),count=counts[option.id];
    return <label key={option.id} className={'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors '+(selected?'border-primary bg-primary/5':'bg-background hover:bg-muted/40')}>
     <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]" checked={selected} disabled={disabled||!selected&&ids.length>=maxOrderedSanads}
      onChange={()=>onChange(selected?ids.filter(id=>id!==option.id):[...ids,option.id])}/>
     <span className="min-w-0 space-y-1"><span className="block font-medium leading-6">{option.name}</span>
      {loadCount&&<span className="block text-xs text-muted-foreground" title="أطول مسار بحسب النصوص المحفوظة، من أول شيخ مذكور، دون احتساب النبي ﷺ. ليس حكمًا على صحة السند.">{count===undefined?'حساب الرواة…':count===null?'العدد يحتاج مراجعة':arabicDigits(count)+' راوياً إلى النبي ﷺ'}</span>}
     </span>
    </label>;
   })}
  </div>
  {ids.length>1&&<p className="text-xs text-muted-foreground">الالتقاء الأقرب أولًا عند اكتمال روابط الرواة.</p>}
 </fieldset>;
}
