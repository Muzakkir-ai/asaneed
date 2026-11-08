import NarratorLinkStatus from './NarratorLinkStatus';
import {useId,useMemo,useRef,useState} from 'react';
import {Input} from '@project/components/ui/input';
import {Button} from '@project/components/ui/button';
import {Popover,PopoverAnchor,PopoverContent} from '@project/components/ui/popover';
import {narratorSearchKey,observedLinks,rankNarrators,possibleNarratorDuplicates,unresolvedNarratorSuggestions} from '../lib/narratorSelection';
import type {BuilderLibrary,BuilderPerson} from '../lib/bookBuilder';

/** A single inline search/create field. Creating a narrator never creates a sanad. */
export default function NarratorPicker({lib,node,previous,next,onChange,onCreate}:{lib:BuilderLibrary;node:{name:string;personId?:string};previous?:string;next?:string;onChange:(v:{name:string;personId?:string})=>void;onCreate:(name:string,alias:string,distinct:boolean)=>Promise<BuilderPerson>}){
 const [open,setOpen]=useState(false),[active,setActive]=useState(-1),[limit,setLimit]=useState(20),[all,setAll]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const id=useId(),input=useRef<HTMLInputElement>(null);
 const links=useMemo(()=>observedLinks(lib),[lib]);
 const ranked=rankNarrators(lib.people,all?'':node.name,links,previous,next);
 const matches=node.name.trim()||all?ranked.slice(0,limit):[];
 const suggested=node.name.trim()?unresolvedNarratorSuggestions(lib.people,lib.suggestions,node.name).slice(0,10):[];
 const duplicates=possibleNarratorDuplicates(lib.people,node.name);
 const exact=duplicates.filter(person=>[person.name,person.display_name,...(person.aliases||[]).map(alias=>alias.name)].some(value=>value&&narratorSearchKey(value)===narratorSearchKey(node.name)));
 const choose=(person:BuilderPerson)=>{onChange({name:person.name,personId:person.id});setOpen(false);setAll(false);setActive(-1);setError('');};
 const create=async()=>{
  const name=node.name.trim();
  if(busy||node.personId)return;
  if(name.length<2){setError('اكتب اسم الراوي أولًا');return;}
  // Identical saved names must reuse their identity; ambiguous identities require an explicit selection.
  if(exact.length===1){choose(exact[0]);return;}
  if(exact.length>1){setError('يوجد أكثر من راوٍ محفوظ بهذا الاسم؛ اختر الشخص الصحيح من القائمة');setOpen(true);return;}
  setBusy(true);setError('');
  try{choose(await onCreate(name,'',false));}
  catch(e){setError(e instanceof Error?e.message:'تعذر إنشاء الراوي');setOpen(true);}
  finally{setBusy(false);}
 };
 return <div className="narrator-picker space-y-1">
  <Popover open={open} onOpenChange={setOpen}>
   <PopoverAnchor asChild>
    <div dir="rtl" className="flex w-full items-center gap-1 rounded-md border bg-background p-1 focus-within:ring-1 focus-within:ring-ring">
     <Input ref={input} dir="rtl" role="combobox" aria-label="اسم الراوي بصيغة الجر" aria-expanded={open} aria-controls={id} aria-autocomplete="list" aria-activedescendant={open&&active>=0&&active<matches.length?id+'-'+active:undefined} autoComplete="off" maxLength={250} className="min-w-0 flex-1 border-0 shadow-none focus-visible:ring-0" placeholder="ابحث عن راوٍ أو اكتب اسمًا جديدًا" value={node.name}
      onFocus={()=>{setAll(false);setLimit(20);setOpen(true);setActive(-1);}}
      onChange={e=>{onChange({name:e.target.value,personId:undefined});setAll(false);setLimit(20);setActive(-1);setOpen(true);setError('');}}
      onKeyDown={e=>{
       if(e.key==='Escape'&&open){e.preventDefault();e.stopPropagation();setOpen(false);}
       if(e.key==='Tab')setOpen(false);
       if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();setOpen(true);const i=matches.length?(e.key==='ArrowDown'?(active+1)%matches.length:(active<=0?matches.length-1:active-1)):-1;setActive(i);requestAnimationFrame(()=>document.getElementById(id+'-'+i)?.scrollIntoView({block:'nearest'}));}
       if(e.key==='Enter'&&open){e.preventDefault();if(active>=0&&matches[active])choose(matches[active].person);}
      }}/>
     <Button type="button" size="sm" variant="outline" className="shrink-0" disabled={busy||!!node.personId||node.name.trim().length<2} onMouseDown={e=>e.preventDefault()} onClick={()=>void create()}>{busy?'جارٍ الإنشاء…':'إنشاء جديد'}</Button>
    </div>
   </PopoverAnchor>
   <PopoverContent dir="rtl" align="start" side="bottom" sideOffset={4} className="max-h-80 w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-24px)] overflow-y-auto p-2 text-right" onOpenAutoFocus={e=>e.preventDefault()} onCloseAutoFocus={e=>e.preventDefault()} onInteractOutside={e=>{if(e.target===input.current)e.preventDefault();}}>
    <p className="p-1 text-xs text-muted-foreground">اختر راوياً محفوظاً مباشرةً؛ الأسماء ذات الصلة بالسند تظهر أولاً.</p>
    <div role="listbox" id={id} aria-label="الرواة المحفوظون">
     {matches.map(({person,observed},i)=><div key={person.id}>
      {(i===0||Boolean(matches[i-1].observed.length)!==Boolean(observed.length))&&<p className="p-2 text-xs font-semibold">{observed.length?'رواة لهم صلة مسجلة':'أسماء محفوظة أخرى'}</p>}
      <button type="button" role="option" aria-selected={active===i} id={id+'-'+i} onMouseDown={e=>e.preventDefault()} onMouseEnter={()=>setActive(i)} onClick={()=>choose(person)} className={'block w-full rounded p-2 text-right text-sm break-words '+(active===i?'bg-secondary text-secondary-foreground':'hover:bg-muted')}>
       <span className="flex items-start justify-between gap-2"><span>{person.name}</span><NarratorLinkStatus connected={observed.length>0}/></span>
       {person.display_name&&<span className="block text-xs">{person.display_name}</span>}
      </button>
     </div>)}
    </div>
    {node.name.trim()&&!matches.length&&<p className="p-2 text-xs">لا يوجد راوٍ محفوظ بهذا الاسم. يمكنك إنشاء راوٍ جديد من الزر يسار الحقل.</p>}
    {ranked.length>limit&&<Button type="button" size="sm" variant="ghost" onClick={()=>setLimit(v=>v+20)}>عرض المزيد</Button>}
    {!all&&<Button type="button" size="sm" variant="ghost" onClick={()=>{setAll(true);setLimit(20);setActive(-1);}}>عرض جميع الأسماء</Button>}
    {suggested.length>0&&<details className="p-2 text-xs"><summary>أسماء مذكورة في النصوص ولم تُحفظ كأشخاص</summary>{suggested.map(name=><button key={name} type="button" className="block w-full p-2 text-right hover:bg-muted" onClick={()=>{onChange({name,personId:undefined});setAll(false);setOpen(true);}}>{name}</button>)}</details>}
   </PopoverContent>
  </Popover>
  {node.personId&&<p role="status" className="px-1 text-xs text-primary">تم اختيار راوٍ محفوظ</p>}
  {error&&<p role="alert" className="px-1 text-xs text-destructive">{error}</p>}
 </div>;
}
