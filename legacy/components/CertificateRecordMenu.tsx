import {useRef,useState} from 'react';
import {MoreHorizontal,Info,Trash2} from 'lucide-react';
import {Button} from '@project/components/ui/button';
import {Popover,PopoverContent,PopoverTrigger} from '@project/components/ui/popover';
export default function CertificateRecordMenu({name,onDetails,onDelete}:{name:string;onDetails:()=>void;onDelete?:()=>void}){
 const [open,setOpen]=useState(false),handoff=useRef(false);
 const act=(fn:()=>void)=>{handoff.current=true;setOpen(false);fn();};
 return <Popover open={open} onOpenChange={value=>{if(value)handoff.current=false;setOpen(value);}}><PopoverTrigger asChild><Button variant="ghost" size="icon" aria-label={'إجراءات شهادة '+name}><MoreHorizontal className="h-5 w-5"/></Button></PopoverTrigger><PopoverContent className="w-48 p-1" align="end" role="menu" aria-label="إجراءات الشهادة" dir="rtl" onCloseAutoFocus={e=>{if(handoff.current)e.preventDefault();}} onKeyDown={e=>{const items=Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role=menuitem]'));const index=items.indexOf(document.activeElement as HTMLButtonElement);const next=e.key==='ArrowDown'?(index+1)%items.length:e.key==='ArrowUp'?(index-1+items.length)%items.length:e.key==='Home'?0:e.key==='End'?items.length-1:-1;if(next>=0){e.preventDefault();items[next]?.focus();}}}><button type="button" role="menuitem" className="certificate-menu-item" onClick={()=>act(onDetails)}><Info size={16}/>تفاصيل الشهادة</button>{onDelete&&<button type="button" role="menuitem" className="certificate-menu-item text-destructive" onClick={()=>act(onDelete)}><Trash2 size={16}/>حذف المسودة</button>}</PopoverContent></Popover>;
}
