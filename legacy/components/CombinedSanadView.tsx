import {useEffect,useId,useRef,useState,type ReactNode} from 'react';
import {arabicDigits} from '../lib/arabicDigits';
import {combinedSanad} from '../lib/combinedSanad';
import {sanadPositions} from '../lib/sanadPathLayout';

const cell=208,rowHeight=166,cardWidth=192,cardHeight=118;

export default function CombinedSanadView({paths,renderPerson,groupJazariStudents,source}:{paths:string[][];renderPerson:(id:string,positions:number[])=>ReactNode;groupJazariStudents?:boolean;source?:string}){
 const [route,setRoute]=useState<number|null>(null);
 const arrow=useId(),graph=combinedSanad(paths);
 const viewport=useRef<HTMLDivElement>(null);
 const [available,setAvailable]=useState(0);
 const [zoomed,setZoomed]=useState(false);
 const width=graph?.rows.length?Math.max(...graph.rows.map(row=>row.length))*cell+48:0;
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
 if(!graph?.rows.length)return null;
 const grouped=groupJazariStudents&&graph.directStudents.length>1;
 const points=new Map(graph.rows.flatMap((row,y)=>row.map((id,x)=>[id,{x:width/2+(row.length/2-x-.5)*cell,y:y*rowHeight+(grouped&&y>0?28:0)}] as const)));
 const height=graph.rows.length*rowHeight+(grouped?28:0);
 const outgoing=new Map<string,typeof graph.edges>(),incoming=new Map<string,typeof graph.edges>();
 for(const edge of graph.edges){
  outgoing.set(edge.from,[...(outgoing.get(edge.from)??[]),edge]);
  incoming.set(edge.to,[...(incoming.get(edge.to)??[]),edge]);
 }
 for(const edges of outgoing.values())edges.sort((a,b)=>points.get(a.to)!.x-points.get(b.to)!.x);
 for(const edges of incoming.values())edges.sort((a,b)=>points.get(a.from)!.x-points.get(b.from)!.x);
 const port=(edges:typeof graph.edges,edge:typeof graph.edges[number])=>(edges.indexOf(edge)-(edges.length-1)/2)*Math.min(16,cardWidth/(edges.length+1));
 const lanes=new Map<number,typeof graph.edges>();
 for(const edge of graph.edges){
  const y=points.get(edge.from)!.y;
  lanes.set(y,[...(lanes.get(y)??[]),edge]);
 }
 return <section dir="rtl" aria-label="السند المتصل" className="min-w-0 space-y-3">
  <div className="flex flex-wrap items-center gap-3">
   <span className="text-sm font-semibold">أعلى سند <strong className="ms-1 rounded-full bg-primary px-3 py-1 text-lg text-primary-foreground">{arabicDigits(graph.lengths[0])}</strong></span>
   {graph.shortestRoutes.length>1&&<span className="text-xs text-muted-foreground">{arabicDigits(graph.shortestRoutes.length)} مسارات في أعلى سند</span>}
   {graph.lengths.slice(1).map(length=><span key={length} aria-label={'طول سند '+arabicDigits(length)} className="rounded-full border px-2 py-0.5 text-xs">{arabicDigits(length)}</span>)}
   <select aria-label="عرض المسارات" value={route??''} onChange={event=>setRoute(event.target.value===''?null:Number(event.target.value))} className="max-w-full rounded border bg-background p-1 text-sm">
    <option value="">عرض الكل</option>
    {paths.map((path,i)=><option value={i} key={i}>المسار {arabicDigits(i+1)} · {arabicDigits(path.length)} رواة</option>)}
   </select>
  </div>
  {source&&<p className="text-xs text-muted-foreground">{source}</p>}
  {compact&&<div className="flex flex-wrap items-center gap-2">
   <button type="button" aria-pressed={zoomed} className="rounded border px-2 py-1 text-xs" onClick={()=>setZoomed(value=>!value)}>{zoomed?'عرض الرسم كاملًا':'تكبير لقراءة الأسماء'}</button>
   {zoomed&&<span className="text-xs text-muted-foreground">مرّر أفقيًا لرؤية الفروع.</span>}
  </div>}
  <div ref={viewport} className="overflow-x-auto rounded-lg border p-2" dir="ltr" data-sanad-viewport="">
   <div className="relative mx-auto overflow-hidden" style={{width:width*scale,height:height*scale}}>
   <div className="absolute left-0 top-0 origin-top-left" style={{width,height,transform:`scale(${scale})`}}>
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 text-muted-foreground" width={width} height={height}>
     <defs><marker id={arrow} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7" fill="none" stroke="currentColor"/></marker></defs>
     {graph.edges.map((edge)=>{
      const {from,to,routes}=edge;
      const a=points.get(from)!,b=points.get(to)!;
      const active=route===null||routes.includes(route);
      const out=outgoing.get(from)!,ins=incoming.get(to)!,row=lanes.get(a.y)!;
      const x1=a.x+port(out,edge),x2=b.x+port(ins,edge);
      const start=a.y+cardHeight,end=b.y-5;
      const mid=start+6+(row.indexOf(edge)+1)*22/(row.length+1);
      const connector=b.y-a.y>rowHeight+28
       ? `M${x1} ${start} V${mid} H${8+graph.edges.indexOf(edge)*12/(graph.edges.length+1)} V${end-6-ins.indexOf(edge)*3} H${x2} V${end}`
       : `M${x1} ${start} V${mid} H${x2} V${end}`;
      return <g key={JSON.stringify([from,to])} opacity={active?1:.15}>
       <path d={connector} fill="none" stroke="hsl(var(--background))" strokeWidth="5"/>
       <path data-from={from} data-to={to} data-routes={routes.join(',')} data-start={x1} data-end={x2} d={connector} fill="none" stroke="currentColor" strokeWidth={route!==null&&active?2:1} opacity={active?1:.15} markerEnd={`url(#${arrow})`}/>
      </g>;
     })}
    </svg>
    {grouped&&<p dir="rtl" className="absolute right-5 text-sm font-semibold text-primary" style={{top:rowHeight}}>أصحاب ابن الجزري</p>}
    {[...points].map(([id,point])=><div key={id} data-combined-narrator={id} dir="rtl" className={route!==null&&!paths[route]?.includes(id)?'absolute opacity-40':'absolute'} style={{left:point.x-cardWidth/2,top:point.y,width:cardWidth,height:cardHeight}}>
     <div className="h-full overflow-y-auto [&>article]:min-h-full [&>article>div>div:last-child]:hidden">{renderPerson(id,sanadPositions(route===null?paths:[paths[route]],id))}</div>
    </div>)}
   </div>
  </div>
  </div>
 </section>;
}
