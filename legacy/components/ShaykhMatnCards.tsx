import {BookOpen,ArrowUpLeft} from 'lucide-react';
import {Button} from '@project/components/ui/button';
type Matn={id?:string;name:string;category:string};
/** Same book-card treatment as the shared matn library, with one clear open action. */
export default function ShaykhMatnCards({mutoon,onOpen,onRemove}:{mutoon:Matn[];onOpen:(index:number)=>void;onRemove?:(index:number)=>void}){
 return <div className="grid gap-3 sm:grid-cols-2">{mutoon.map((m,index)=><div key={m.id||index} className="min-w-0 space-y-2"><button type="button" className="workspace-action-card workspace-book-card w-full h-auto min-w-0 items-start justify-start gap-3 whitespace-normal text-start" aria-label={'فتح متن '+m.name} onClick={()=>onOpen(index)}><span className="workspace-card-icon" aria-hidden="true"><BookOpen className="h-5 w-5"/></span><span className="min-w-0 flex-1 space-y-1"><span className="workspace-card-title block font-bold">{m.name}</span><span className="block text-xs text-muted-foreground">السند وكلمات الإجازة</span><span className="workspace-card-badge">{m.category}</span></span><span className="workspace-card-arrow" aria-hidden="true"><ArrowUpLeft className="h-4 w-4"/></span></button>{onRemove&&<Button type="button" variant="ghost" size="sm" aria-label={'إزالة متن '+m.name} onClick={()=>onRemove(index)}>إزالة المتن</Button>}</div>)}</div>;
}
