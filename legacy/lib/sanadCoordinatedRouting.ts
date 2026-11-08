import {sharedSanadBuses} from './sanadSharedBus';

/** Read-only orthogonal geometry. The graph, IDs and route membership remain
 * owned by combinedSanad / the narrator database, never by these SVG paths. */
export type SanadDiagramEdge={
 from:string;to:string;routes?:readonly number[];id?:string;originalIndex?:number;
};
type Kind='complete'|'fan-in'|'fan-out'|'single';
export type SanadVisualGroup={
 kind:Kind;from:string[];to:string[];edgeIndices:number[];
 fromRank:number;toRank:number;busY?:number;
};
export type SanadVisualPart={
 key:string;d:string;role:'feed'|'bus'|'drop'|'single';arrow:boolean;
 edgeIndices:number[];from?:string;to?:string;
};
export type SanadVisualEdgePath={
 edgeIndex:number;from:string;to:string;d:string;routes:readonly number[];id?:string;
};
export type SanadCoordinatedPlan={
 tops:number[];height:number;groups:SanadVisualGroup[];
 parts:SanadVisualPart[];edgePaths:SanadVisualEdgePath[];
 valid:boolean;collisions:string[];
};

type Task={key:string;rank:number;left:number;right:number;priority:number};
type LocalGroup={kind:Kind;from:string[];to:string[];indices:number[];fromRank:number;toRank:number};
type Card={id:string;left:number;right:number;top:number;bottom:number};
const margin=10,trackStep=20;
const key=(from:string,to:string)=>JSON.stringify([from,to]);
const pathFrom=(points:{x:number;y:number}[])=>{
 const clean=points.filter((p,i)=>!i||p.x!==points[i-1].x||p.y!==points[i-1].y);
 if(!clean.length)return '';
 return 'M'+clean[0].x+' '+clean[0].y+clean.slice(1).map((p,i)=>{
  const previous=clean[i];
  if(previous.x!==p.x&&previous.y!==p.y)throw Error('Non-orthogonal diagram geometry');
  return previous.x===p.x?' V'+p.y:' H'+p.x;
 }).join('');
};

/** Decompose only the actual saved relationships. This procedure never
 * synthesizes the Cartesian product of two groups unless every pair exists. */
export function groupSanadConnections(
 rows:readonly (readonly string[])[],edges:readonly SanadDiagramEdge[]
):SanadVisualGroup[]{
 const rankOf=new Map(rows.flatMap((row,rank)=>row.map(id=>[id,rank] as const)));
 const used=new Set<number>();
 const groups:LocalGroup[]=[];
 const append=(kind:Kind,indices:number[])=>{
  const from=[...new Set(indices.map(i=>edges[i].from))],to=[...new Set(indices.map(i=>edges[i].to))];
  const fromRank=rankOf.get(from[0])!,toRank=rankOf.get(to[0])!;
  groups.push({kind,from,to,indices,fromRank,toRank});
  indices.forEach(i=>used.add(i));
 };
 const shared=sharedSanadBuses(rows,edges);
 for(const bus of shared){
  const indices=bus.edgeIndices.filter(i=>!used.has(i));
  if(indices.length!==bus.edgeIndices.length)continue;
  if(bus.from.some(from=>bus.to.some(to=>!indices.some(i=>edges[i].from===from&&edges[i].to===to))))continue;
  // A partially overlapping biclique would leave another connection entering
  // the same child as a second arrow. Only bundle an entire rank-gap component.
  const completeIncoming=bus.to.every(to=>edges.every(e=>
   rankOf.get(e.from)!==bus.rank||e.to!==to||bus.from.includes(e.from)));
  const completeOutgoing=bus.from.every(from=>edges.every(e=>
   rankOf.get(e.to)!==bus.rank+1||e.from!==from||bus.to.includes(e.to)));
  if(!completeIncoming||!completeOutgoing)continue;
  append('complete',indices);
 }
 // A complete 2x2 relationship set is also safe, even though the legacy bus
 // heuristic used to skip it for lack of line-count savings.
 for(let rank=0;rank<rows.length-1;rank++){
  for(const [a,source] of rows[rank].entries())for(const other of rows[rank].slice(a+1)){
   const available=rows[rank+1].filter(target=>
    [source,other].every(from=>edges.some((e,i)=>!used.has(i)&&e.from===from&&e.to===target)));
   if(available.length<2)continue;
   const indices=[source,other].flatMap(from=>available.map(target=>
    edges.findIndex((e,i)=>!used.has(i)&&e.from===from&&e.to===target)));
   const completelyLinked=indices.every(i=>i>=0)
    &&available.every(to=>edges.every(e=>rankOf.get(e.from)!==rank||e.to!==to||[source,other].includes(e.from)))
    &&[source,other].every(from=>edges.every(e=>rankOf.get(e.to)!==rank+1||e.from!==from||available.includes(e.to)));
   if(completelyLinked)append('complete',indices);
  }
 }
 for(let rank=0;rank<rows.length-1;rank++){
  while(true){
   const remaining=edges.flatMap((e,i)=>!used.has(i)&&rankOf.get(e.from)===rank&&rankOf.get(e.to)===rank+1?[i]:[]);
   let best:{kind:'fan-in'|'fan-out';indices:number[]}|null=null;
   // In a non-complete many-to-many graph, give all of a target's real
   // incoming edges one final arrow. A source fan-out still gets one bus
   // when its children do not have competing incoming transmissions.
   for(const id of rows[rank+1]){
    const indices=remaining.filter(i=>edges[i].to===id);
    if(indices.length>=2&&(!best||indices.length>best.indices.length))best={kind:'fan-in',indices};
   }
   if(!best)for(const id of rows[rank]){
    const indices=remaining.filter(i=>edges[i].from===id);
    if(indices.length>=2&&(!best||indices.length>best.indices.length))best={kind:'fan-out',indices};
   }
   if(!best)break;
   append(best.kind,best.indices);
  }
 }
 edges.forEach((_,i)=>{if(!used.has(i))append('single',[i]);});
 const indexes=groups.flatMap(g=>g.indices);
 // Exactly one owning visual group per actual edge, including overlapping
 // route memberships attached to that edge.
 if(indexes.length!==edges.length||new Set(indexes).size!==edges.length)
  throw Error('Sanad geometry must not add, drop or duplicate a source-target edge');
 return groups.map(g=>({...g,edgeIndices:g.indices.map(i=>edges[i].originalIndex??i)}));
}

/** Generate a fully routed graph from explicit edges and measured card sizes.
 * Each fan-in merges near the source row and has one arrow before its target.
 * Each fan-out starts with a centered trunk and one level horizontal bus.
 * Unrelated groups never share a bus or a relationship ID. */
export function planCoordinatedSanad(
 rows:string[][],
 centers:ReadonlyMap<string,{x:number}>,
 edges:readonly SanadDiagramEdge[],
 width:number,cardWidth:number,cardHeight:number,
 cardHeights:ReadonlyMap<string,number>=new Map(),
):SanadCoordinatedPlan{
 if(!rows.length)return {tops:[],height:0,groups:[],parts:[],edgePaths:[],valid:true,collisions:[]};
 const rankOf=new Map(rows.flatMap((row,rank)=>row.map(id=>[id,rank] as const)));
 const xOf=(id:string)=>centers.get(id)?.x??width/2;
 const heightOf=(id:string)=>cardHeights.get(id)??cardHeight;
 const localGroups=groupSanadConnections(rows,edges);
 const groups=localGroups.map(g=>({...g}));
 const sourceOwners=new Map<string,number[]>(),targetOwners=new Map<string,number[]>();
 for(const [i,group] of groups.entries()){
  for(const id of group.from)sourceOwners.set(id,[...(sourceOwners.get(id)||[]),i]);
  for(const id of group.to)targetOwners.set(id,[...(targetOwners.get(id)||[]),i]);
 }
 const attach=(id:string,group:number,side:'source'|'target')=>{
  const owners=(side==='source'?sourceOwners:targetOwners).get(id)||[group];
  const index=owners.indexOf(group);
  const step=Math.min(16,(cardWidth-28)/(owners.length+1));
  return Math.round((xOf(id)+(index-(owners.length-1)/2)*step)*100)/100;
 };
 const spans=new Map<string,{sources:Map<string,number>;targets:Map<string,number>}>();
 for(const [i,g] of groups.entries())spans.set(String(i),{
  sources:new Map(g.from.map(id=>[id,attach(id,i,'source')])),
  targets:new Map(g.to.map(id=>[id,attach(id,i,'target')])),
 });
 const corridors=new Map<number,number>();
 // Skipped-rank edges use a clear vertical channel around every intervening
 // card, including long narrations that would otherwise run behind a card.
 for(const [gi,g] of groups.entries()){
  if(g.toRank<=g.fromRank+1)continue;
  const sx=spans.get(String(gi))!.sources.get(g.from[0])!;
  const tx=spans.get(String(gi))!.targets.get(g.to[0])!;
  const blocked=rows.slice(g.fromRank+1,g.toRank).flat().map(id=>xOf(id));
  const half=cardWidth/2+margin;
  const candidates=[sx,tx,(sx+tx)/2,8,width-8,
   ...blocked.flatMap(cx=>[cx-half,cx+half])];
  const safe=[...new Set(candidates.map(x=>Math.round(x*100)/100))]
   .filter(x=>x>=8&&x<=width-8&&blocked.every(cx=>Math.abs(cx-x)>=half-.01));
  const chosen=(safe.length?safe:[8,width-8]).sort((a,b)=>{
   const score=(x:number)=>Math.abs(sx-x)+Math.abs(tx-x)+
    [...corridors].reduce((cost,[other,otherX])=>{
     const og=groups[other];
     const overlaps=og.fromRank<g.toRank&&og.toRank>g.fromRank;
     return cost+(overlaps&&Math.abs(otherX-x)<14?200:0);
    },0);
   return score(a)-score(b);
  })[0];
  corridors.set(gi,chosen);
 }
 const tasks:Task[]=[];
 const gapTask=(key:string,rank:number,a:number,b:number,priority:number)=>{
  if(rank<0||rank>=rows.length-1)return;
  tasks.push({key,rank,left:Math.min(a,b),right:Math.max(a,b),priority});
 };
 for(const [i,g] of groups.entries()){
  const ports=spans.get(String(i))!;
  const xs=[...ports.sources.values(),...ports.targets.values()];
  if(g.kind!=='single'){
   gapTask(i+':bus',g.fromRank,Math.min(...xs),Math.max(...xs),g.kind==='fan-in'?0:1);
   continue;
  }
  const sx=xs[0],tx=xs[1];
  if(g.toRank===g.fromRank+1){
   if(Math.abs(sx-tx)>0.5)gapTask(i+':single',g.fromRank,sx,tx,2);
  }else{
   const corridor=corridors.get(i)!;
   gapTask(i+':exit',g.fromRank,sx,corridor,3);
   gapTask(i+':entry',g.toRank-1,corridor,tx,3);
  }
 }
 // Overlapping unrelated horizontal segments receive distinct rank-gap
 // lanes. Disjoint intervals may reuse a height without appearing joined.
 const lanes=rows.map(()=>[] as {left:number;right:number}[][]);
 const assignments=new Map<string,number>();
 for(const task of tasks.sort((a,b)=>a.rank-b.rank||a.priority-b.priority||a.left-b.left)){
  const at=lanes[task.rank];
  let lane=at.findIndex(spans=>spans.every(span=>
   task.right+12<=span.left||task.left>=span.right+12));
  if(lane<0){lane=at.length;at.push([]);}
  at[lane].push({left:task.left,right:task.right});
  assignments.set(task.key,lane);
 }
 const rowHeights=rows.map(row=>Math.max(...row.map(heightOf)));
 const tops=[0];
 for(let rank=0;rank<rows.length;rank++){
  const count=lanes[rank].length;
  const gap=rank===rows.length-1?0:Math.max(64,55+trackStep*Math.max(0,count-1));
  tops.push(tops[rank]+rowHeights[rank]+gap);
 }
 const bottom=(id:string)=>tops[rankOf.get(id)!]+heightOf(id);
 const arrival=(id:string)=>tops[rankOf.get(id)!]-1;
 const yFor=(task:string,rank:number)=>tops[rank]+rowHeights[rank]+18+
  trackStep*(assignments.get(task)??0);
 const parts:SanadVisualPart[]=[],edgePaths:SanadVisualEdgePath[]=[];
 const sourceEdges=(g:SanadVisualGroup,id:string)=>g.edgeIndices.filter(index=>
  edges.some((edge,i)=>(edge.originalIndex??i)===index&&edge.from===id));
 const targetEdges=(g:SanadVisualGroup,id:string)=>g.edgeIndices.filter(index=>
  edges.some((edge,i)=>(edge.originalIndex??i)===index&&edge.to===id));
 for(const [i,g] of groups.entries()){
  const ports=spans.get(String(i))!,all=g.edgeIndices;
  if(g.kind!=='single'){
   const y=yFor(i+':bus',g.fromRank);
   g.busY=y;
   const xs=[...ports.sources.values(),...ports.targets.values()];
   for(const id of g.from){
    const px=ports.sources.get(id)!;
    parts.push({key:i+':feed:'+id,d:pathFrom([{x:px,y:bottom(id)},{x:px,y}]),
     role:'feed',arrow:false,from:id,edgeIndices:sourceEdges(g,id)});
   }
   parts.push({key:i+':bus',d:pathFrom([{x:Math.min(...xs),y},{x:Math.max(...xs),y}]),
    role:'bus',arrow:false,edgeIndices:all});
   for(const id of g.to){
    const px=ports.targets.get(id)!;
    parts.push({key:i+':drop:'+id,d:pathFrom([{x:px,y},{x:px,y:arrival(id)}]),
     role:'drop',arrow:true,to:id,edgeIndices:targetEdges(g,id)});
   }
   for(const index of all){
    const edge=edges.find((candidate,j)=>(candidate.originalIndex??j)===index)!;
    const sx=ports.sources.get(edge.from)!,tx=ports.targets.get(edge.to)!;
    const d=pathFrom([{x:sx,y:bottom(edge.from)},{x:sx,y},{x:tx,y},{x:tx,y:arrival(edge.to)}]);
    edgePaths.push({edgeIndex:index,from:edge.from,to:edge.to,d,routes:edge.routes??[],id:edge.id});
   }
  }else{
   const index=all[0],edge=edges.find((candidate,j)=>(candidate.originalIndex??j)===index)!;
   const sx=ports.sources.get(edge.from)!,tx=ports.targets.get(edge.to)!;
   const fromY=bottom(edge.from),toY=arrival(edge.to);
   let coords:{x:number;y:number}[];
   if(g.toRank===g.fromRank+1){
    const y=yFor(i+':single',g.fromRank);
    coords=Math.abs(sx-tx)<=.5?[{x:sx,y:fromY},{x:tx,y:toY}]:
     [{x:sx,y:fromY},{x:sx,y},{x:tx,y},{x:tx,y:toY}];
   }else{
    const channel=corridors.get(i)!;
    const exit=yFor(i+':exit',g.fromRank),entry=yFor(i+':entry',g.toRank-1);
    coords=[{x:sx,y:fromY},{x:sx,y:exit},{x:channel,y:exit},
     {x:channel,y:entry},{x:tx,y:entry},{x:tx,y:toY}];
   }
   const d=pathFrom(coords);
   parts.push({key:i+':single',d,role:'single',arrow:true,from:edge.from,to:edge.to,edgeIndices:all});
   edgePaths.push({edgeIndex:index,from:edge.from,to:edge.to,d,routes:edge.routes??[],id:edge.id});
  }
 }
 const cards:Card[]=rows.flatMap((row,rank)=>row.map(id=>({
  id,left:xOf(id)-cardWidth/2,right:xOf(id)+cardWidth/2,
  top:tops[rank],bottom:tops[rank]+heightOf(id),
 })));
 const collisions:string[]=[];
 const matches=(d:string)=>{
  const out:{x:number;y:number}[]=[];
  const entries=d.match(/[MHV]-?[\d.]+(?: -?[\d.]+)?/g)||[];
  for(const entry of entries){
   const command=entry[0],coords=entry.slice(1).trim().split(' ').map(Number);
   const previous=out[out.length-1];
   if(command==='M')out.push({x:coords[0],y:coords[1]});
   else if(command==='H'&&previous)out.push({x:coords[0],y:previous.y});
   else if(command==='V'&&previous)out.push({x:previous.x,y:coords[0]});
  }
  return out;
 };
 // A skipped-rank edge may require an outer bypass. Repair that single
 // edge locally instead of invalidating every safe shared bus in the graph.
 // Both outer corridors are outside the 10px padded narrator rectangles.
 const hitsUnrelatedCard=(edge:SanadVisualEdgePath,d=edge.d)=>{
  const vertices=matches(d);
  for(let j=1;j<vertices.length;j++){
   const a=vertices[j-1],b=vertices[j];
   for(const card of cards){
    if(card.id===edge.from||card.id===edge.to)continue;
    if(a.x===b.x&&a.x>card.left-margin&&a.x<card.right+margin
     &&Math.max(a.y,b.y)>card.top-margin&&Math.min(a.y,b.y)<card.bottom+margin)return true;
    if(a.y===b.y&&a.y>card.top-margin&&a.y<card.bottom+margin
     &&Math.max(a.x,b.x)>card.left-margin&&Math.min(a.x,b.x)<card.right+margin)return true;
   }
  }
  return false;
 };
 for(const edge of edgePaths){
  if(!hitsUnrelatedCard(edge))continue;
  const gi=groups.findIndex(group=>group.kind==='single'&&group.edgeIndices.includes(edge.edgeIndex));
  if(gi<0)continue;
  const g=groups[gi];
  if(g.toRank<=g.fromRank+1)continue;
  const ports=spans.get(String(gi))!;
  const sx=ports.sources.get(edge.from)!,tx=ports.targets.get(edge.to)!;
  const fromY=bottom(edge.from),toY=arrival(edge.to);
  const exit=yFor(gi+':exit',g.fromRank),entry=yFor(gi+':entry',g.toRank-1);
  // A rerouted line never passes behind an intervening card, even when
  // two independent lines must cross in open space.
  const alternatives=[8,width-8].sort((a,b)=>
   Math.abs(sx-a)+Math.abs(tx-a)-Math.abs(sx-b)-Math.abs(tx-b));
  for(const corridor of alternatives){
   const d=pathFrom([{x:sx,y:fromY},{x:sx,y:exit},{x:corridor,y:exit},
    {x:corridor,y:entry},{x:tx,y:entry},{x:tx,y:toY}]);
   if(hitsUnrelatedCard(edge,d))continue;
   edge.d=d;
   const part=parts.find(part=>part.key===gi+':single');
   if(part)part.d=d;
   break;
  }
 }
 for(const edge of edgePaths){
  const vertices=matches(edge.d);
  for(let j=1;j<vertices.length;j++){
   const a=vertices[j-1],b=vertices[j];
   for(const card of cards){
    if(card.id===edge.from||card.id===edge.to)continue;
    if(a.x===b.x&&a.x>card.left-margin&&a.x<card.right+margin
     &&Math.max(a.y,b.y)>card.top-margin&&Math.min(a.y,b.y)<card.bottom+margin)
     collisions.push(key(edge.from,edge.to)+' crosses '+card.id);
    else if(a.y===b.y&&a.y>card.top-margin&&a.y<card.bottom+margin
     &&Math.max(a.x,b.x)>card.left-margin&&Math.min(a.x,b.x)<card.right+margin)
     collisions.push(key(edge.from,edge.to)+' crosses '+card.id);
   }
  }
 }
 const original=edges.map((edge,i)=>edge.originalIndex??i).sort((a,b)=>a-b);
 const kept=edgePaths.map(edge=>edge.edgeIndex).sort((a,b)=>a-b);
 const valid=JSON.stringify(original)===JSON.stringify(kept)&&collisions.length===0;
 return {tops,height:tops.at(-1)!,groups,parts,edgePaths,valid,collisions};
}
