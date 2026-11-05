import NarratorLinkStatus from './NarratorLinkStatus';
import {useId,useState} from 'react';
import {ArrowUp,ArrowDown,Trash2,Pencil,ChevronUp} from 'lucide-react';
import {Button} from '@project/components/ui/button';
import {arabicDigits} from '../lib/arabicDigits';
import type {BuilderLibrary,BuilderPerson} from '../lib/bookBuilder';
import NarratorPicker from './NarratorPicker';
import NarratorShortName from './NarratorShortName';
type Node={editorKey?:string;name:string;source:boolean;personId?:string;sourceLevel?:'upper'|'branch'|null};
export default function ChainNarratorRow({node,index,count,lib,previous,next,roles,number,badgeLabels,connected,onChange,onCreate,onShortName,onMove,onRemove,onParallel,lockedLayout=false,initialEditing,readOnly=false}:{node:Node;index:number;count:number;number?:number;badgeLabels?:string[];connected?:boolean;lockedLayout?:boolean;initialEditing?:boolean;readOnly?:boolean;lib:BuilderLibrary;previous?:string;next?:string;roles:boolean;onChange:(value:Node)=>void;onCreate:(name:string,alias:string,distinct:boolean)=>Promise<BuilderPerson>;onShortName?:(id:string,value:string)=>Promise<void>;onMove:(direction:-1|1)=>void;onRemove:()=>void;onParallel?:()=>void}){
 const ordinal=number??index+1;
 const [editing,setEditing]=useState(initialEditing??!node.personId),panel=useId();
 const person=lib.people.find(p=>p.id===node.personId&&!p.archived);
 return <article className={`narrator-person-card min-w-0 rounded-lg border bg-background ${editing?'border-primary/40':''}`} dir="rtl">
 <div className="flex min-w-0 items-center gap-2 p-2 sm:p-3">
 <span data-narrator-level={badgeLabels?.join(" / ")} aria-label={badgeLabels?"الرتبة من نقطة الالتقاء: "+badgeLabels.join(" أو "):`الراوي ${ordinal}`} className={`inline-flex min-h-8 min-w-8 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 font-bold text-primary ${badgeLabels?"flex-col gap-0.5 px-2 py-1 text-xs":"h-8 w-8 text-sm"}`}>{badgeLabels?badgeLabels.map(label=><span key={label} className="whitespace-nowrap">{label}</span>):arabicDigits(ordinal)}</span>
 <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{node.name||'اختر الراوي'}</p>{node.source&&<span className="whitespace-nowrap text-xs text-primary">صاحب الطريق</span>}</div>
 {person&&connected!==undefined&&<NarratorLinkStatus connected={connected}/>}
 {!readOnly&&<Button type="button" variant={editing?'secondary':'ghost'} size="sm" aria-label={`${editing?'إغلاق تعديل':'تعديل'} الراوي ${ordinal}`} aria-expanded={editing} aria-controls={panel} onClick={()=>setEditing(v=>!v)}>{editing?<ChevronUp aria-hidden="true" className="h-4 w-4"/>:<Pencil aria-hidden="true" className="h-4 w-4"/>}</Button>}
 </div>
 {!readOnly&&editing&&<div id={panel} className="space-y-3 border-t p-3">
 <NarratorPicker lib={lib} node={node} previous={previous} next={next} onCreate={onCreate} onChange={value=>onChange({...node,...value})}/>
 {person&&<NarratorShortName key={person.id+':'+person.display_name} person={person} onSave={onShortName}/>}
 <div className="flex flex-wrap items-center gap-1">{roles&&<label className="me-auto inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm"><input type="checkbox" checked={node.source} onChange={e=>onChange({...node,source:e.target.checked,sourceLevel:e.target.checked?node.sourceLevel:null})}/>صاحب الطريق</label>}
 {!lockedLayout&&<><Button type="button" size="sm" variant="ghost" aria-label="نقل الراوي لأعلى" disabled={index===0} onClick={()=>onMove(-1)}><ArrowUp aria-hidden="true" className="h-4 w-4"/></Button>
 <Button type="button" size="sm" variant="ghost" aria-label="نقل الراوي لأسفل" disabled={index===count-1} onClick={()=>onMove(1)}><ArrowDown aria-hidden="true" className="h-4 w-4"/></Button>
 <Button type="button" size="sm" variant="ghost" aria-label="حذف الراوي" onClick={onRemove}><Trash2 aria-hidden="true" className="h-4 w-4"/></Button>
 </>}{onParallel&&<Button type="button" size="sm" variant="outline" onClick={onParallel}>إضافة شيخ موازٍ</Button>}<Button type="button" size="sm" variant="outline" onClick={()=>setEditing(false)}>تم</Button>
 </div></div>}
 </article>;
}
