import {arabicDigits} from '../lib/arabicDigits';
import NarratorLinkStatus from './NarratorLinkStatus';
export default function BranchPersonCard({name,label,number,connected}:{name:string;label:string;number:number|null;connected?:boolean}){
 return <div className="min-w-0 rounded-lg border bg-background p-2 sm:p-3" dir="rtl"><div className="flex min-w-0 items-center gap-2"><span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-bold text-primary" aria-label={number===null?'لم يحدد':`الراوي ${number}`}>{number===null?'—':arabicDigits(number)}</span><div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{name}</p><span className="whitespace-nowrap text-xs text-primary">{label}</span></div>{connected!==undefined&&<NarratorLinkStatus connected={connected}/>}</div></div>;
}
