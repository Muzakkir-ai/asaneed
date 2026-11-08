import {Waypoints} from 'lucide-react';
import {placeSanad} from '../lib/sanadPlacement';
import {optimizeSanadPorts} from '../lib/sanadConnectorRouting';
import {useEffect,useLayoutEffect,useMemo,useId,useRef,useState,type ReactNode} from 'react';
import {arabicDigits} from '../lib/arabicDigits';
import {combinedSanad} from '../lib/combinedSanad';
import {sanadPositions} from '../lib/sanadPathLayout';

const cell=224,cardWidth=192,initialCardHeight=80;

export default function CombinedSanadView({paths,routeLabels,renderPerson,source,review}:{paths:string[][];routeLabels?:string[];renderPerson:(id:string,positions:number[])=>ReactNode;groupJazariStudents?:boolean;source?:string;review?:boolean}){
 const [route,setRoute]=useState<number|null>(null);
 const [focused,setFocused]=useState<string|null>(null);
 const arrow=useId(),graph=useMemo(()=>combinedSanad(paths),[paths]);
 const viewport=useRef<HTMLDivElement>(null);
 const canvas=useRef<HTMLDivElement>(null);
 const [cardHeights,setCardHeights]=useState<ReadonlyMap<string,number>>(new Map());
 useLayoutEffect(()=>{
  const cards=Array.from(canvas.current?.querySelectorAll<HTMLElement>('[data-combined-narrator]')??[]);
  if(!cards.length)return;
  const measure=()=>{
   const heights=new Map(cards.map(card=>[card.dataset.combinedNarrator!,card.offsetHeight]));
   setCardHeights(previous=>previous.size===heights.size&&[...heights].every(([id,height])=>previous.get(id)===height)?previous:heights);
  };
  measure();
  const observer=new ResizeObserver(measure);
  cards.forEach(card=>observer.observe(card));
  return ()=>observer.disconnect();
 },[paths]);
 const [available,setAvailable]=useState(0);
 const [zoomed,setZoomed]=useState(false);
 const width=graph?.rows.length?Math.max(...graph.rows.map(row=>row.length))*cell+48:0;
 const centers=useMemo(()=>graph?.rows.length?placeSanad(graph.rows,graph.edges,width,cell):new Map<string,number>(),[graph,width]);
 const compact=available>0&&available<width;
 const scale=compact&&!zoomed?available/width:1;
 useEffect(()=>{
  const element=viewport.current;
  if(!element)return;
  const measure=()=>setAvailable(Math.max(0,element.clientWidth-16));
  measure();
  const observer=new ResizeObserver(measure);
  observer.observe(element);
  return ()=>observer.disconnect();
 },[width]);
 useEffect(()=>{
  const element=viewport.current;
  if(element)element.scrollLeft=(element.scrollWidth-element.clientWidth)/2;
 },[scale,width]);
 if(!graph?.rows.length)return <section dir="rtl" aria-label="مسارات السند المحفوظة" className="min-w-0 space-y-3 rounded-lg border p-3">
  <p role="status" className="text-sm text-muted-foreground">تعذر تكوين رسم واحد لهذه المسارات؛ قد تحتوي على تكرار أو حلقة أو اتصال غير متوافق. تُعرض أدناه المسارات المحفوظة منفصلة دون إنشاء روابط جديدة.</p>
  {paths.map((path,i)=><section key={i} className="space-y-2 rounded-lg border p-2" aria-label={'المسار '+arabicDigits(i+1)}>
   <h4 className="text-sm font-semibold">المسار {arabicDigits(i+1)}</h4>
   {path.map((id,j)=><div key={i+'-'+j+'-'+id}>{renderPerson(id,[j+1])}</div>)}
  </section>)}
 </section>;
 const points=new Map(graph.rows.flatMap((row,rank)=>row.map(id=>[id,{x:centers.get(id)!,y:rank}] as const)));
 const outgoing=new Map<string,typeof graph.edges>(),incoming=new Map<string,typeof graph.edges>();
 for(const edge of graph.edges){
  outgoing.set(edge.from,[...(outgoing.get(edge.from)??[]),edge]);
  incoming.set(edge.to,[...(incoming.get(edge.to)??[]),edge]);
 }
 for(const edges of outgoing.values())edges.sort((a,b)=>points.get(a.to)!.x-points.get(b.to)!.x);
 for(const edges of incoming.values())edges.sort((a,b)=>points.get(a.from)!.x-points.get(b.from)!.x);
 const port=(edges:typeof graph.edges,edge:typeof graph.edges[number])=>{
  const straight=edges.find(candidate=>points.get(candidate.from)!.x===points.get(candidate.to)!.x
   &&points.get(candidate.to)!.y-points.get(candidate.from)!.y===1);
  const step=Math.min(16,cardWidth/(edges.length+1));
  return (edges.indexOf(edge)-(straight?edges.indexOf(straight):(edges.length-1)/2))*step;
 };
 const ports=graph.edges.map(edge=>({from:edge.from,to:edge.to,
  x1:points.get(edge.from)!.x+port(outgoing.get(edge.from)!,edge),
  x2:points.get(edge.to)!.x+port(incoming.get(edge.to)!,edge)}));
 const {tops,height,connectors}=optimizeSanadPorts(graph.rows,points,ports,width,cardWidth,initialCardHeight,cardHeights);
 graph.rows.forEach((row,rank)=>row.forEach(id=>points.set(id,{...points.get(id)!,y:tops[rank]})));
 return <section dir="rtl" aria-label="السند المتصل" className="min-w-0 space-y-3">
  {paths.length>1&&<details className="rounded-lg border p-2">
   <summary className="cursor-pointer text-sm">تفاصيل فروع السند</summary>
  <div className="flex flex-wrap items-center gap-3">
   <select aria-label="عرض المسارات" value={route??''} onChange={event=>setRoute(event.target.value===''?null:Number(event.target.value))} className="max-w-full rounded border bg-background p-1 text-sm">
    <option value="">عرض الكل</option>
    {paths.map((path,i)=><option value={i} key={i}>المسار {arabicDigits(i+1)} · {arabicDigits(path.length)} رواة</option>)}
   </select>
  </div>
  {routeLabels&&paths.length>1&&<p className="text-xs text-muted-foreground">اختر مسارًا لتتبّع اتصالاته. اجتماع الفروع في الرسم لا يعني ثبوت مسار جديد.</p>}

   {route!==null&&routeLabels?.[route]&&<p className="text-xs text-muted-foreground">{routeLabels[route]}</p>}
  </details>}
  {focused!==null&&<p role="status" className="flex flex-wrap items-center gap-2 text-xs text-primary">اتصالات الراوي المحدد · {paths.flatMap((path,i)=>path.includes(focused)?['المسار '+arabicDigits(i+1)]:[]).join('، ')} <button type="button" className="rounded border px-2 py-1" onClick={()=>setFocused(null)}>إلغاء التحديد</button></p>}
  {review&&<p className="text-xs text-muted-foreground">عرض من النص المحفوظ · هويات الرواة أو مواضع الالتقاء تحتاج مراجعة.</p>}
  {source&&<p className="text-xs text-muted-foreground">{source}</p>}
  {compact&&<div className="flex flex-wrap items-center gap-2">
   <button type="button" aria-pressed={zoomed} className="rounded border px-2 py-1 text-xs" onClick={()=>setZoomed(value=>!value)}>{zoomed?'عرض الرسم كاملًا':'تكبير لقراءة الأسماء'}</button>
   {zoomed&&<span className="text-xs text-muted-foreground">مرّر أفقيًا لرؤية الفروع.</span>}
  </div>}
  <div ref={viewport} className="overflow-x-auto rounded-lg border p-2" dir="ltr" data-sanad-viewport="">
   <div className="relative mx-auto overflow-hidden" style={{width:width*scale,height:height*scale}}>
   <div ref={canvas} className="absolute left-0 top-0 origin-top-left" style={{width,height,transform:`scale(${scale})`}}>
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 text-muted-foreground" width={width} height={height}>
     <defs><marker id={arrow} markerUnits="userSpaceOnUse" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7" fill="none" stroke="currentColor"/></marker></defs>
     {graph.edges.map(({from,to,routes},index)=>{
      const active=route===null||routes.includes(route);
      if(!active)return null;
      const {x1,x2,d:connector}=connectors[index];
      const traced=focused===null||from===focused||to===focused;
      return <g key={JSON.stringify([from,to])} opacity={traced?1:.15}>
       <path d={connector} fill="none" stroke="hsl(var(--background))" strokeWidth="5"/>
       <path data-from={from} data-to={to} data-routes={routes.join(',')} data-start={x1} data-end={x2} d={connector} fill="none" stroke="currentColor" strokeWidth={route!==null&&active||focused!==null&&traced?2:1} opacity={traced?1:.15} markerEnd={`url(#${arrow})`}/>
      </g>;
     })}
    </svg>
    {[...points].map(([id,point])=><div key={id} data-combined-narrator={id} dir="rtl" className={route!==null&&!paths[route]?.includes(id)?'absolute opacity-40':'absolute'} style={{left:point.x-cardWidth/2,top:point.y,width:cardWidth}}>
     <button type="button" data-trace-person={id} aria-label="تتبّع اتصالات الراوي" aria-pressed={focused===id} title="تتبّع اتصالات الراوي" onClick={()=>setFocused(current=>current===id?null:id)} className={"absolute right-4 top-12 z-10 inline-flex h-6 w-6 items-center justify-center rounded-md border bg-background/95 text-primary shadow-sm transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 "+(focused===id?"border-primary bg-primary/10":"border-primary/20")}><Waypoints size={12} strokeWidth={2} aria-hidden="true"/></button>
     <div className={"[&>article>div:first-child]:min-h-20 [&>article>div>div:last-child]:hidden"+(focused!==null&&focused!==id&&!graph.edges.some(edge=>edge.from===focused&&edge.to===id||edge.to===focused&&edge.from===id)?' opacity-50':'')}>{renderPerson(id,sanadPositions(route===null?paths:[paths[route]],id))}</div>
    </div>)}
   </div>
  </div>
  </div>
 </section>;
}
