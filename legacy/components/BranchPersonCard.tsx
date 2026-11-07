import type {ReactNode} from 'react';
import {arabicDigits} from '../lib/arabicDigits';
import NarratorLinkStatus from './NarratorLinkStatus';

/** The same narrator header is used for editable people and fixed endpoints. */
export default function BranchPersonCard({name,label,number,badgeLabels,secondaryNumbers,connected,controls,children,editorKey}:{name:string;label?:string;number:number|null;badgeLabels?:string[];secondaryNumbers?:number[];connected?:boolean;controls?:ReactNode;children?:ReactNode;editorKey?:string}){
 const labels=badgeLabels?.length?badgeLabels:[number===null?'—':arabicDigits(number)];
 return <article id={editorKey?'personal-rawi-'+editorKey:undefined} data-personal-rawi={editorKey} className={`narrator-person-card min-w-0 rounded-lg border bg-background${secondaryNumbers?.length?' flex flex-col':''}`} dir="rtl">
  <div className="flex min-h-16 min-w-0 items-center gap-2 p-2 sm:p-3">
   <span data-narrator-level={labels.join(' / ')} aria-label={number===null?'لم يحدد':'الموقع في السند: '+labels.join(' أو ')} className="inline-flex min-h-8 min-w-8 shrink-0 flex-col items-center justify-center rounded-full border border-primary/30 bg-primary/10 px-1 text-sm font-bold text-primary">{labels.map(label=><span key={label}>{label}</span>)}</span>
   <div className="min-w-0 flex-1">
    <p className="break-words text-sm font-medium">{name||'اختر الراوي'}</p>
    <span className="block min-h-4 text-xs text-primary">{label}</span>
   </div>
   <div className="flex w-14 shrink-0 items-center justify-end gap-1">{connected!==undefined&&<NarratorLinkStatus connected={connected}/>} {controls}</div>
  </div>
  {!!secondaryNumbers?.length&&<div className="mt-auto flex flex-wrap justify-end gap-1 px-2 pb-2" aria-label="درجات الراوي الأخرى">
   {secondaryNumbers.map(position=><span key={position} data-narrator-secondary-level="" className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border px-0.5 text-[10px] leading-none text-muted-foreground">{arabicDigits(position)}</span>)}
  </div>}
  {children}
 </article>;
}
