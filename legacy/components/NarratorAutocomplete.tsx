import {useEffect,useId,useRef,useState} from 'react';
import {Input} from '@project/components/ui/input';
import {Popover,PopoverAnchor,PopoverContent} from '@project/components/ui/popover';
import {builderNameKey} from '../lib/bookBuilder';

/** Editable Arabic name field; suggestions reuse saved names without forcing a selection. */
export default function NarratorAutocomplete({value,onChange,names,label,placeholder}:{value:string;onChange:(value:string)=>void;names:string[];label:string;placeholder?:string}){
 const [open,setOpen]=useState(false),[active,setActive]=useState(-1);
 const id=useId(),input=useRef<HTMLInputElement>(null);
 const query=builderNameKey(value);
 const matches=[...new Set(names)].filter(n=>builderNameKey(n).includes(query)).slice(0,30);
 const choose=(name:string)=>{onChange(name);input.current?.focus();setOpen(false);setActive(-1);};
 useEffect(()=>{if(open&&active>=0)document.getElementById(`${id}-${active}`)?.scrollIntoView({block:'nearest'});},[active,open,id]);
 return <Popover open={open} onOpenChange={setOpen}><PopoverAnchor asChild><Input ref={input} dir="rtl" role="combobox" aria-label={label} aria-expanded={open} aria-controls={id} aria-autocomplete="list" aria-activedescendant={open&&active>=0&&active<matches.length?`${id}-${active}`:undefined} autoComplete="off" maxLength={250} placeholder={placeholder} value={value} onFocus={()=>{setOpen(true);setActive(-1);}} onChange={e=>{onChange(e.target.value);setOpen(true);setActive(-1);}} onKeyDown={e=>{
  if(e.key==='Escape'&&open){e.preventDefault();e.stopPropagation();setOpen(false);return;}
  if(e.key==='Tab'){setOpen(false);return;}
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();setOpen(true);setActive(i=>matches.length?(e.key==='ArrowDown'?(i+1)%matches.length:(i<=0?matches.length-1:i-1)):-1);return;}
  if(e.key==='Enter'&&open&&active>=0&&matches[active]){e.preventDefault();choose(matches[active]);}
 }}/></PopoverAnchor><PopoverContent role="listbox" id={id} aria-label="اقتراحات أسماء الرواة" dir="rtl" align="start" sideOffset={5} className="p-1 w-[var(--radix-popover-anchor-width)] max-w-[calc(100vw-24px)] max-h-64 overflow-y-auto text-right" onOpenAutoFocus={e=>e.preventDefault()} onCloseAutoFocus={e=>e.preventDefault()} onInteractOutside={e=>{if(e.target===input.current)e.preventDefault();}}>
 {matches.length?matches.map((name,i)=><button type="button" role="option" aria-selected={i===active} id={`${id}-${i}`} key={name} tabIndex={-1} onMouseDown={e=>e.preventDefault()} onMouseEnter={()=>setActive(i)} onClick={()=>choose(name)} className={`block w-full rounded-md px-3 py-2 text-right text-sm leading-relaxed whitespace-normal break-words ${i===active?'bg-secondary text-secondary-foreground':'hover:bg-muted'}`}>{name}</button>):<p className="px-3 py-2 text-xs text-muted-foreground">لا يوجد اسم مطابق؛ يمكنك كتابة اسم جديد بصيغة الجر.</p>}
 </PopoverContent></Popover>;
}
