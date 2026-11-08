import {Waypoints} from 'lucide-react';
import {placeSanad} from '../lib/sanadPlacement';
import {optimizeSanadPorts} from '../lib/sanadConnectorRouting';
import {sharedSanadBuses} from '../lib/sanadSharedBus';
import {planCoordinatedSanad} from '../lib/sanadCoordinatedRouting';
import {useEffect,useLayoutEffect,useMemo,useId,useRef,useState,type ReactNode} from 'react';
import {arabicDigits} from '../lib/arabicDigits';
import {combinedSanad} from '../lib/combinedSanad';
import {sanadPositions} from '../lib/sanadPathLayout';
import {groupSimilarSanadRoutes} from '../lib/sanadRouteGrouping';

const initialCardHeight=80;

export default function CombinedSanadView({paths,routeLabels,renderPerson,source,review,spacious=false,sharedSanads=false,personNames}:{paths:string[][];routeLabels?:string[];renderPerson:(id:string,positions:number[])=>ReactNode;groupJazariStudents?:boolean;source?:string;review?:boolean;spacious?:boolean;sharedSanads?:boolean;personNames?:Record<string,string>}){
 const cell=spacious?276:224,cardWidth=spacious?228:192;
 const [route,setRoute]=useState<number|null>(null);
 const [focused,setFocused]=useState<string|null>(null);
 // Reversible client-side switch, plus an emergency deployment kill-switch.
 // NEXT_PUBLIC_SHARED_BUS_ROUTING=false forces the tested legacy diagram.
 const routingAllowed=process.env.NEXT_PUBLIC_SHARED_BUS_ROUTING!=='false';
 const [coordinated,setCoordinated]=useState(routingAllowed);
 const arrow=useId(),graph=useMemo(()=>combinedSanad(paths),[paths]);
 const routeGroups=useMemo(()=>groupSimilarSanadRoutes(paths),[paths]);
 const commonNarrators=useMemo(()=>new Set(paths[0]?.filter(id=>paths.every(path=>path.includes(id)))??[]),[paths]);
 const sharedGroupLabel=(indices:number[],index:number)=>{
  const representative=paths[indices[0]]||[];
  const distinct=representative.slice(1,-1).filter(id=>!commonNarrators.has(id));
  const labels=(distinct.length?distinct:representative.slice(1,-1)).slice(0,2);
  const names=labels.map(id=>personNames?.[id]||id).join('، ');
  return 'السند '+arabicDigits(index+1)+(names?' · '+names:'');
 };
 const currentIndices=route===null?paths.map((_,i)=>i):routeGroups[route]??[];
 const shownPaths=currentIndices.map(i=>paths[i]);
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
 const coordinatedPlan=useMemo(()=>{
  if(!graph?.rows.length||!coordinated||!routingAllowed)return null;
  const indices=route===null?paths.map((_,i)=>i):routeGroups[route]??[];
  const visible=graph.edges.flatMap((edge,i)=>
   route===null||edge.routes.some(index=>indices.includes(index))
    ?[{...edge,originalIndex:i}]:[]);
  const plan=planCoordinatedSanad(graph.rows,
   new Map([...centers].map(([id,x])=>[id,{x}])),
   visible,width,cardWidth,initialCardHeight,cardHeights);
  return plan.valid?plan:null;
 },[graph,coordinated,routingAllowed,route,routeGroups,paths,centers,width,cardWidth,cardHeights]);
 const compact=available>0&&available<width;
 // Large historical branching diagrams must keep full-size Arabic names.
 // Allow horizontal scrolling instead of shrinking every narrator card.
 const scale=spacious?1:compact&&!zoomed?available/width:1;
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
 const fallback=coordinatedPlan?null:optimizeSanadPorts(graph.rows,points,ports,width,cardWidth,initialCardHeight,cardHeights);
 const tops=coordinatedPlan?.tops??fallback!.tops;
 const height=coordinatedPlan?.height??fallback!.height;
 const connectors=fallback?.connectors??[];
 // Consolidate complete many-to-many adjacencies only while showing ALL
 // saved paths. A filtered sanad always uses its individual actual edges.
 const buses=!coordinatedPlan&&route===null?sharedSanadBuses(graph.rows,graph.edges):[];
 const bundledEdges=new Set(buses.flatMap(bus=>bus.edgeIndices));
 const busesAtRank=(rank:number)=>buses.filter(bus=>bus.rank===rank);
 const busY=(rank:number,index:number)=>{
  const bottom=Math.max(...graph.rows[rank].map(id=>tops[rank]+(cardHeights.get(id)??initialCardHeight)));
  const count=busesAtRank(rank).length;
  return Math.round(bottom+(tops[rank+1]-bottom)*(index+1)/(count+1));
 };
 graph.rows.forEach((row,rank)=>row.forEach(id=>points.set(id,{...points.get(id)!,y:tops[rank]})));
 return <section dir="rtl" aria-label="السند المتصل" className="min-w-0 space-y-3">
  {paths.length>1&&<details className="rounded-lg border p-2">
   <summary className="cursor-pointer text-sm">{sharedSanads?'تفاصيل أسانيد ابن الجزري إلى الداني':'تفاصيل فروع السند'}</summary>
  <div className="flex flex-wrap items-center gap-3">
   <select aria-label={sharedSanads?'اختيار السند المشترك':'عرض المسارات'} value={route??''} onChange={event=>setRoute(event.target.value===''?null:Number(event.target.value))} className="max-w-full rounded border bg-background p-1 text-sm">
    <option value="">{sharedSanads?'عرض جميع الأسانيد':'عرض الكل'}</option>
    {routeGroups.map((indices,i)=><option value={i} key={i}>{sharedSanads?sharedGroupLabel(indices,i):'المسار '+arabicDigits(i+1)+' · '+(indices.length>1?arabicDigits(indices.length)+' فروع متقاربة':arabicDigits(paths[indices[0]].length)+' رواة')}</option>)}
   </select>
  </div>
  {routeGroups.length<paths.length&&<p className="text-xs text-muted-foreground">{sharedSanads?'أسانيد مميّزة: '+arabicDigits(routeGroups.length)+'، مع بقاء '+arabicDigits(paths.length)+' وجه محفوظ مستقلًّا.':'مسارات معروضة: '+arabicDigits(routeGroups.length)+'، تضم '+arabicDigits(paths.length)+' أوجه محفوظة.'} يُجمع اختلاف راوٍ أو راويين بين الشيخ والتلميذ في مسار واحد دون تغيير أي سند.</p>}
  {routeLabels&&paths.length>1&&<p className="text-xs text-muted-foreground">{sharedSanads?'اختر سندًا بحسب رجال إسناده، لا بحسب الرواية أو الطريق.':'اختر مسارًا لتتبّع اتصالاته.'} اجتماع الفروع في الرسم لا يعني ثبوت مسار جديد.</p>}

   {route!==null&&routeLabels&&<p className="text-xs text-muted-foreground">{[...new Set((routeGroups[route]??[]).map(i=>routeLabels[i]).filter(Boolean))].join(' / ')}</p>}
  </details>}
  {focused!==null&&<p role="status" className="flex flex-wrap items-center gap-2 text-xs text-primary">اتصالات الراوي المحدد · {routeGroups.flatMap((indices,i)=>indices.some(index=>paths[index].includes(focused))?['المسار '+arabicDigits(i+1)]:[]).join('، ')} <button type="button" className="rounded border px-2 py-1" onClick={()=>setFocused(null)}>إلغاء التحديد</button></p>}
  {review&&<p className="text-xs text-muted-foreground">عرض من النص المحفوظ · هويات الرواة أو مواضع الالتقاء تحتاج مراجعة.</p>}
  {source&&<p className="text-xs text-muted-foreground">{source}</p>}
  {routingAllowed&&<div className="flex flex-wrap items-center gap-2">
   <button type="button" data-sanad-routing-switch="" aria-pressed={!!coordinatedPlan}
    className="rounded-md border bg-background px-2 py-1 text-xs hover:bg-muted"
    onClick={()=>setCoordinated(value=>!value)}>
    {coordinated?'العودة إلى توجيه الخطوط السابق':'استخدام التوصيلات المشتركة'}
   </button>
   {coordinated&&!coordinatedPlan&&<span role="status" className="text-xs text-muted-foreground">تعذر توفير مسار آمن؛ يُعرض التخطيط السابق دون تعديل السند.</span>}
  </div>}
  {compact&&!spacious&&<div className="flex flex-wrap items-center gap-2">
   <button type="button" aria-pressed={zoomed} className="rounded border px-2 py-1 text-xs" onClick={()=>setZoomed(value=>!value)}>{zoomed?'عرض الرسم كاملًا':'تكبير لقراءة الأسماء'}</button>
   {zoomed&&<span className="text-xs text-muted-foreground">مرّر أفقيًا لرؤية الفروع.</span>}
  </div>}
  <div ref={viewport} className="overflow-x-auto rounded-lg border p-2" dir="ltr" data-sanad-viewport="">
   <div className="relative mx-auto overflow-hidden" style={{width:width*scale,height:height*scale}}>
   <div ref={canvas} className="absolute left-0 top-0 origin-top-left" style={{width,height,transform:`scale(${scale})`}}>
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 text-muted-foreground" width={width} height={height}>
     <defs><marker id={arrow} markerUnits="userSpaceOnUse" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7" fill="none" stroke="currentColor"/></marker></defs>
     {coordinatedPlan&&<>
      {coordinatedPlan.parts.map(part=>{
       const highlighted=focused===null||part.edgeIndices.some(index=>
        graph.edges[index]?.from===focused||graph.edges[index]?.to===focused);
       const members=[...new Set(part.edgeIndices.flatMap(index=>graph.edges[index]?.routes||[]))];
       return <g key={part.key} data-routing-part={part.role} data-edge-indices={part.edgeIndices.join(',')}
        data-route-indices={members.join(',')} opacity={highlighted?1:.17}>
        <path d={part.d} fill="none" stroke="hsl(var(--background))" strokeWidth="5"/>
        <path d={part.d} fill="none" stroke="currentColor" strokeWidth={focused!==null&&highlighted?2:1}
         markerEnd={part.arrow?`url(#${arrow})`:undefined}/>
       </g>;
      })}
      {coordinatedPlan.edgePaths.map(edge=><path key={'edge-'+edge.edgeIndex}
       data-from={edge.from} data-to={edge.to} data-routes={edge.routes.join(',')}
       data-edge-index={edge.edgeIndex} data-edge-id={edge.id||undefined}
       d={edge.d} fill="none" stroke="none" pointerEvents="none"/>)}
      {focused!==null&&coordinatedPlan.edgePaths.filter(edge=>edge.from===focused||edge.to===focused)
       .map(edge=><path key={'focused-'+edge.edgeIndex} d={edge.d} fill="none"
        stroke="currentColor" strokeWidth="2" opacity=".95" pointerEvents="none"
        markerEnd={`url(#${arrow})`}/>)}
     </>}
     {!coordinatedPlan&&graph.edges.map(({from,to,routes},index)=>{
      if(bundledEdges.has(index))return null;
      const active=route===null||routes.some(index=>currentIndices.includes(index));
      if(!active)return null;
      const {x1,x2,d:connector}=connectors[index];
      const traced=focused===null||from===focused||to===focused;
      return <g key={JSON.stringify([from,to])} opacity={traced?1:.15}>
       <path d={connector} fill="none" stroke="hsl(var(--background))" strokeWidth="5"/>
       <path data-from={from} data-to={to} data-routes={routes.join(',')} data-start={x1} data-end={x2} d={connector} fill="none" stroke="currentColor" strokeWidth={route!==null&&active||focused!==null&&traced?2:1} opacity={traced?1:.15} markerEnd={`url(#${arrow})`}/>
      </g>;
     })}
     {buses.map((bus,index)=>{
      const rankBuses=busesAtRank(bus.rank);
      const y=busY(bus.rank,rankBuses.indexOf(bus));
      const xOf=(id:string)=>points.get(id)!.x;
      const xs=[...bus.from,...bus.to].map(xOf);
      const left=Math.min(...xs),right=Math.max(...xs);
      const traced=focused===null||bus.from.includes(focused)||bus.to.includes(focused);
      const sourcePaths=bus.from.map(id=>'M'+xOf(id)+' '+(tops[bus.rank]+(cardHeights.get(id)??initialCardHeight))+' V'+y);
      const targetPaths=bus.to.map(id=>'M'+xOf(id)+' '+y+' V'+(tops[bus.rank+1]-1));
      return <g key={'shared-'+bus.rank+'-'+index} data-sanad-bus={bus.rank} data-bundled-edges={bus.edgeIndices.join(',')} opacity={traced?1:.15}>
       {[...sourcePaths,'M'+left+' '+y+' H'+right,...targetPaths].map((d,j)=><path key={'clear-'+j} d={d} fill="none" stroke="hsl(var(--background))" strokeWidth="5"/>)}
       {sourcePaths.map((d,j)=><path key={'in-'+j} d={d} data-bus-source={bus.from[j]} fill="none" stroke="currentColor" strokeWidth={focused!==null&&traced?2:1}/>)}
       <path d={'M'+left+' '+y+' H'+right} data-bus-trunk="" stroke="currentColor" fill="none" strokeWidth={focused!==null&&traced?2:1}/>
       {targetPaths.map((d,j)=><path key={'out-'+j} d={d} data-bus-target={bus.to[j]} fill="none" stroke="currentColor" strokeWidth={focused!==null&&traced?2:1} markerEnd={`url(#${arrow})`}/>)}
      </g>;
     })}
    </svg>
    {[...points].map(([id,point])=><div key={id} data-combined-narrator={id} dir="rtl" className={(route!==null&&!shownPaths.some(path=>path.includes(id))?'absolute opacity-40':'absolute')+(spacious?' [&_.narrator-person-card]:shadow-sm [&_.narrator-person-card_p]:text-[15px] [&_.narrator-person-card_p]:leading-7':'')} style={{left:point.x-cardWidth/2,top:point.y,width:cardWidth}}>
     <button type="button" data-trace-person={id} aria-label="تتبّع اتصالات الراوي" aria-pressed={focused===id} title="تتبّع اتصالات الراوي" onClick={()=>setFocused(current=>current===id?null:id)} style={{right:19,top:48,width:20,height:20,minWidth:20,maxWidth:20,minHeight:20,maxHeight:20,padding:0}} className={"absolute z-10 inline-flex items-center justify-center rounded-md border bg-background/95 text-primary shadow-sm transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 "+(focused===id?"border-primary bg-primary/10":"border-primary/20")}><Waypoints size={12} strokeWidth={2} aria-hidden="true"/></button>
     <div className={"[&>article>div:first-child]:min-h-20 [&>article>div>div:last-child]:hidden"+(focused!==null&&focused!==id&&!graph.edges.some(edge=>edge.from===focused&&edge.to===id||edge.to===focused&&edge.from===id)?' opacity-50':'')}>{renderPerson(id,sanadPositions(shownPaths,id))}</div>
    </div>)}
   </div>
  </div>
  </div>
 </section>;
}
