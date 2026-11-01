import {Link2,Link2Off} from 'lucide-react';
export default function NarratorLinkStatus({connected}:{connected:boolean}){
 const label=connected?'صلة مسجلة مع راوٍ مجاور في سند محفوظ':'لا توجد صلة مسجلة مع الراوي المجاور';
 const Icon=connected?Link2:Link2Off;
 return <span role="img" aria-label={label} title={label} className={`inline-flex shrink-0 items-center justify-center ${connected?'text-emerald-600 dark:text-emerald-400':'text-muted-foreground'}`}><Icon aria-hidden="true" className="h-4 w-4"/></span>;
}
