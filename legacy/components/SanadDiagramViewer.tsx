import {useId,useState,type ComponentProps} from 'react';
import {ChevronDown,ChevronUp,GitBranch,Route} from 'lucide-react';
import CombinedSanadView from './CombinedSanadView';
import SanadSequence from './SanadSequence';
import {arabicDigits} from '../lib/arabicDigits';
type Props=ComponentProps<typeof CombinedSanadView>&{selectedRoute?:number;onRouteChange?:(index:number)=>void};
/** One exact saved sequence at a time. The overview retains all original paths. */
export default function SanadDiagramViewer({selectedRoute,onRouteChange,...props}:Props){
 const [network,setNetwork]=useState(false),[localRoute,setLocalRoute]=useState(0),[folded,setFolded]=useState(false);
 const panel=useId();
 const index=Math.min(selectedRoute??localRoute,Math.max(0,props.paths.length-1));
 const path=props.paths[index]??[];
 return <section className="min-w-0 space-y-3" aria-label="عارض مسارات الأسانيد">
  <button type="button" className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-sm" aria-expanded={!folded} aria-controls={panel} onClick={()=>setFolded(v=>!v)}>{folded?<ChevronDown size={16}/>:<ChevronUp size={16}/>}السند المتصل — {folded?'عرض الرواة':'طيّ السند'}</button>
  <div id={panel} className={folded?'hidden':'space-y-3'}>
  <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/30 p-2">
   <button type="button" aria-pressed={!network} onClick={()=>setNetwork(false)} className={'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm '+(!network?'bg-primary text-primary-foreground':'hover:bg-background')}><Route size={16}/> مسار واضح</button>
   <button type="button" aria-pressed={network} onClick={()=>setNetwork(true)} className={'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm '+(network?'bg-primary text-primary-foreground':'hover:bg-background')}><GitBranch size={16}/> جميع الروابط</button>
   {!network&&props.paths.length>1&&<label className="ms-auto flex min-w-0 items-center gap-2 text-sm">المسار<select aria-label="اختيار مسار محفوظ" className="w-full max-w-xs rounded-lg border bg-background p-2" value={index} onChange={event=>{const next=Number(event.target.value);setLocalRoute(next);onRouteChange?.(next);}}>{props.paths.map((_,i)=><option key={i} value={i}>{arabicDigits(i+1)} · {props.routeLabels?.[i]||'مسار محفوظ'}</option>)}</select></label>}
  </div>
  {network?<CombinedSanadView {...props}/>:<div className="rounded-xl border bg-background p-3 sm:p-5">
   {props.source&&<p className="mb-3 text-center text-xs text-muted-foreground">{props.source}</p>}
   {props.review&&<p className="mb-3 text-center text-xs text-muted-foreground">من النص المحفوظ · يحتاج مراجعة</p>}
   <SanadSequence path={path} renderPerson={props.renderPerson} compact preview/>
   {!path.length&&<p role="status" className="text-sm text-muted-foreground">لا يوجد مسار محفوظ للعرض.</p>}
  </div>}
  </div>
 </section>;
}
