'use client';

import {useState} from 'react';
import {BookOpen,ChevronDown} from 'lucide-react';
import CombinedSanadView from '../../../legacy/components/CombinedSanadView';
import BranchPersonCard from '../../../legacy/components/BranchPersonCard';
import {arabicDigits} from '../../../legacy/lib/arabicDigits';
import {displayRawi,shortQariName} from '../../../legacy/lib/qurra';
import type {HistoricalSectionView} from '../../../legacy/lib/qurraHistoricalSegments';

export default function QurraHistoricalPanel({section}:{
 section:HistoricalSectionView|null;
}){
 const [showSource,setShowSource]=useState(false);
 if(!section)return <div role="status" className="rounded-xl border border-dashed bg-card p-5 text-sm text-muted-foreground">
  لم يُعثر على نص محفوظ لهذا الجزء. افتح النصوص المشتركة لإضافة المصدر ومراجعته.
 </div>;
 const name=(id:string)=>section.names[id]||'هوية غير معروفة';
 return <section dir="rtl" className="space-y-3 rounded-xl border bg-card p-3 sm:p-4">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div>
    <h2 className="text-base font-semibold">{shortQariName(section.qariId)}{section.kind==='rawi-imam'?' · '+displayRawi(section.qariId,section.rawi):''}</h2>
    <p className="text-xs text-muted-foreground">{section.paths.length?'رسم من علاقات رجال الأسانيد في النص المختار · يحتاج مراجعة':'فروع نصية محفوظة · تحتاج مراجعة'}</p>
   </div>
   <button type="button" onClick={()=>setShowSource(v=>!v)} aria-expanded={showSource}
    className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted">
    <BookOpen size={15}/> {showSource?'إخفاء النص الأصلي':'عرض النص الأصلي'} <ChevronDown size={14}/>
   </button>
  </div>
  {section.paths.length?
   <div className="space-y-2">
    <p className="text-xs text-muted-foreground">الأسماء كاملة من فهرس رجال الأسانيد، مع الاحتفاظ بكل فرع وموضع التقاء. مرّر أفقيًا لقراءة المخطط دون تصغير الأسماء.</p>
    <CombinedSanadView paths={section.paths} review spacious
     routeLabels={section.paths.map((_,index)=>'الفرع '+arabicDigits(index+1))}
     renderPerson={(id,positions)=>{
      const label=id==='prophet'?'النبي ﷺ'
       :id.startsWith('sahabi:')?'صحابي'
       :section.kind==='rawi-imam'&&id==='imam:'+section.qariId?'إمام القراءة'
       :section.kind==='rawi-imam'&&section.paths.some(path=>path[0]===id)?'صاحب الرواية'
       :section.kind==='imam-sahaba'&&id==='imam:'+section.qariId?'إمام القراءة'
       :undefined;
      return <BranchPersonCard name={name(id)} label={label} number={positions[0]??null} secondaryNumbers={positions.slice(1)}/>;
     }}/>
   </div>
   :<div className="space-y-2">
    <p className="text-xs text-muted-foreground">الفروع التالية مقتبسة من النص المحفوظ؛ كل بطاقة تمثل مسارًا نصيًّا لا وصلات جديدة.</p>
    <div className="grid gap-3 sm:grid-cols-2">
     {section.branches.map((body,index)=><article key={index} className="rounded-lg border border-dashed bg-background p-3">
      <p className="mb-2 text-xs font-semibold text-primary">الفرع {arabicDigits(index+1)}</p>
      <p className="break-words whitespace-pre-wrap text-sm leading-8">{body}</p>
     </article>)}
    </div>
   </div>}
  {showSource&&<div className="space-y-2 rounded-lg border bg-muted/20 p-3">
   <p className="text-xs font-semibold text-muted-foreground">النص المحفوظ كما هو (دون تغيير)</p>
   <p className="whitespace-pre-wrap break-words text-sm leading-8">{section.body}</p>
  </div>}
  {section.paths.length>0&&section.branches.length>1&&<details className="rounded-md border px-3 py-2 text-sm">
   <summary className="cursor-pointer font-medium">تفاصيل الفروع النصية ({arabicDigits(section.branches.length)})</summary>
   <div className="mt-3 grid gap-2 sm:grid-cols-2">
    {section.branches.map((body,index)=><div key={index} className="rounded-md border bg-background p-3">
     <p className="mb-2 text-xs font-semibold text-primary">الفرع {arabicDigits(index+1)}</p>
     <p className="whitespace-pre-wrap break-words text-sm leading-7">{body}</p>
    </div>)}
   </div>
  </details>}
  <p className="text-xs text-muted-foreground">المخطط للعرض والمراجعة فقط؛ لا يغيّر روابط الأسانيد المحفوظة.</p>
 </section>;
}
