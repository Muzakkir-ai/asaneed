import {routeSanadConnectors} from '../lib/sanadConnectorRouting';
import {useEffect,useId,useRef,useState,type ReactNode} from 'react';
import {arabicDigits} from '../lib/arabicDigits';
import {combinedSanad} from '../lib/combinedSanad';
import {sanadPositions} from '../lib/sanadPathLayout';

const cell=208,rowHeight=166,cardWidth=192,cardHeight=118;

export default function CombinedSanadView({paths,renderPerson,groupJazariStudents,source,review}:{paths:string[][];renderPerson:(id:string,positions:number[])=>ReactNode;groupJazariStudents?:boolean;source?:string;review?:boolean}){
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
 const outgoing=new Map<string,typeof graph.edges>(),incoming=new Map<string,typeof graph.edges>();
 for(const edge of graph.edges){
  outgoing.set(edge.from,[...(outgoing.get(edge.from)??[]),edge]);
  incoming.set(edge.to,[...(incoming.get(edge.to)??[]),edge]);
 }
 // Give a direct, unshared child its teacher's column before placing the rest.
 const columnCount=(width-48)/cell;
 const columns=Array.from({length:columnCount},(_,i)=>width/2+(i-(columnCount-1)/2)*cell);
 for(const [rank,row] of graph.rows.entries()){
  if(rank===0||row.length<2)continue;
  const reserved=new Set<number>(),placed=new Set<string>();
  const previous=graph.rows[rank-1];
  for(const id of row){
   const parents=incoming.get(id)??[];
   if(parents.length!==1||!previous.includes(parents[0].from))continue;
   const x=points.get(parents[0].from)!.x;
   if(!columns.includes(x)||reserved.has(x))continue;
   points.set(id,{...points.get(id)!,x});reserved.add(x);placed.add(id);
  }
  for(const id of row){
   if(placed.has(id))continue;
   const point=points.get(id)!;
   const x=columns.filter(x=>!reserved.has(x)).sort((a,b)=>Math.abs(a-point.x)-Math.abs(b-point.x))[0];
   points.set(id,{...point,x});reserved.add(x);
  }
 }
 for(const edges of outgoing.values())edges.sort((a,b)=>points.get(a.to)!.x-points.get(b.to)!.x);
 for(const edges of incoming.values())edges.sort((a,b)=>points.get(a.from)!.x-points.get(b.from)!.x);
 // Keep a longer branch in its original lane while its sibling skips this row.
 for(const [rank,row] of graph.rows.entries()){
  if(row.length!==1||rank===0)continue;
  const point=points.get(row[0])!;
  const parents=incoming.get(row[0])??[];
  if(parents.length!==1)continue;
  const parent=parents[0].from;
  const preceding=graph.rows[rank-1];
  if(preceding.length<2||!preceding.includes(parent))continue;
  const siblingSkips=preceding.some(id=>id!==parent&&(outgoing.get(id)??[]).some(edge=>points.get(edge.to)!.y>point.y));
  if(siblingSkips)points.set(row[0],{...point,x:points.get(parent)!.x});
 }
 const port=(edges:typeof graph.edges,edge:typeof graph.edges[number])=>{
  const straight=edges.find(candidate=>points.get(candidate.from)!.x===points.get(candidate.to)!.x
   &&points.get(candidate.to)!.y-points.get(candidate.from)!.y<=rowHeight+28);
  const step=Math.min(16,cardWidth/(edges.length+1));
  return (edges.indexOf(edge)-(straight?edges.indexOf(straight):(edges.length-1)/2))*step;
 };
 const ports=graph.edges.map(edge=>({from:edge.from,to:edge.to,
  x1:points.get(edge.from)!.x+port(outgoing.get(edge.from)!,edge),
  x2:points.get(edge.to)!.x+port(incoming.get(edge.to)!,edge)}));
 const {tops,height,connectors}=routeSanadConnectors(graph.rows,points,ports,width,cardWidth,cardHeight,Boolean(grouped));
 graph.rows.forEach((row,rank)=>row.forEach(id=>points.set(id,{...points.get(id)!,y:tops[rank]})));
 return <section dir="rtl" aria-label="السند المتصل" className="min-w-0 space-y-3">
  <div className="flex flex-wrap items-center gap-3">
   <select aria-label="عرض المسارات" value={route??''} onChange={event=>setRoute(event.target.value===''?null:Number(event.target.value))} className="max-w-full rounded border bg-background p-1 text-sm">
    <option value="">عرض الكل</option>
    {paths.map((path,i)=><option value={i} key={i}>المسار {arabicDigits(i+1)} · {arabicDigits(path.length)} رواة</option>)}
   </select>
  </div>
  {review&&<p className="text-xs text-muted-foreground">عرض من النص المحفوظ · هويات الرواة أو مواضع الالتقاء تحتاج مراجعة.</p>}
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
     {graph.edges.map(({from,to,routes},index)=>{
      const active=route===null||routes.includes(route);
      const {x1,x2}=ports[index],{d:connector,bypass}=connectors[index];
      const skipped=bypass!==undefined,laneClear=skipped&&bypass===x1;
      return <g key={JSON.stringify([from,to])} opacity={active?1:.15}>
       <path d={connector} fill="none" stroke="hsl(var(--background))" strokeWidth="5"/>
       <path data-from={from} data-to={to} data-routes={routes.join(',')} data-start={x1} data-end={x2} data-local-bypass={laneClear||undefined} data-bypass={skipped?bypass:undefined} d={connector} fill="none" stroke="currentColor" strokeWidth={route!==null&&active?2:1} opacity={active?1:.15} markerEnd={`url(#${arrow})`}/>
      </g>;
     })}
    </svg>
    {grouped&&<p dir="rtl" className="absolute right-5 text-sm font-semibold text-primary" style={{top:tops[1]-23}}>أصحاب ابن الجزري</p>}
    {[...points].map(([id,point])=><div key={id} data-combined-narrator={id} dir="rtl" className={route!==null&&!paths[route]?.includes(id)?'absolute opacity-40':'absolute'} style={{left:point.x-cardWidth/2,top:point.y,width:cardWidth,height:cardHeight}}>
     <div className="h-full overflow-y-auto [&>article]:min-h-full [&>article>div>div:last-child]:hidden">{renderPerson(id,sanadPositions(route===null?paths:[paths[route]],id))}</div>
    </div>)}
   </div>
  </div>
  </div>
 </section>;
}
