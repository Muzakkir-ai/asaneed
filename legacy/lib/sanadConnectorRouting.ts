export type SanadPort={from:string;to:string;x1:number;x2:number};
type Track={left:number;right:number};
const spacing=14;

/** Route in rank gaps and reserve clear vertical lanes for edges that skip cards. */
export function routeSanadConnectors(rows:string[][],centers:ReadonlyMap<string,{x:number}>,ports:SanadPort[],width:number,cardWidth:number,cardHeight:number,grouped:boolean,cardHeights?:ReadonlyMap<string,number>){
 const ranks=new Map(rows.flatMap((row,rank)=>row.map(id=>[id,rank] as const)));
 const gaps=rows.map(()=>[] as Track[][]);
 const vertical:{x:number;from:number;to:number}[]=ports.flatMap(edge=>{
  const from=ranks.get(edge.from)!,to=ranks.get(edge.to)!;
  return edge.x1===edge.x2&&to===from+1?[{x:edge.x1,from,to}]:[];
 });
 const track=(rank:number,a:number,b:number)=>{
  if(a===b)return null;
  const left=Math.min(a,b),right=Math.max(a,b),tracks=gaps[rank];
  let index=tracks.findIndex(lane=>lane.every(span=>right+spacing<=span.left||left>=span.right+spacing));
  if(index<0){index=tracks.length;tracks.push([]);}
  tracks[index].push({left,right});
  return index;
 };
 const routes=ports.map(edge=>{
  const from=ranks.get(edge.from)!,to=ranks.get(edge.to)!;
  if(to===from+1)return {edge,from,to,x:edge.x2,exit:track(from,edge.x1,edge.x2),entry:null};
  const obstacles=rows.slice(from+1,to).flat().map(id=>centers.get(id)!.x);
  const clearance=cardWidth/2+8;
  const conflicts=vertical.filter(lane=>lane.from<to&&lane.to>from);
  const candidates=[edge.x1,edge.x2,(edge.x1+edge.x2)/2,...obstacles.flatMap(x=>[x-clearance,x+clearance]),...conflicts.flatMap(lane=>[lane.x-spacing,lane.x+spacing]),8,width-8];
  const clear=candidates.filter(x=>x>=8&&x<=width-8&&obstacles.every(center=>Math.abs(center-x)>=clearance));
  const separated=clear.filter(x=>conflicts.every(lane=>Math.abs(lane.x-x)>=spacing));
  const distance=(x:number)=>Math.abs(x-edge.x1)+Math.abs(x-edge.x2);
  const x=(separated.length?separated:clear).sort((a,b)=>distance(a)-distance(b)||Math.abs(a-edge.x1)-Math.abs(b-edge.x1))[0]??8;
  vertical.push({x,from,to});
  return {edge,from,to,x,exit:track(from,edge.x1,x),entry:track(to-1,x,edge.x2)};
 });
 const heightOf=(id:string)=>cardHeights?.get(id)??cardHeight;
 const rowHeights=rows.map(row=>Math.max(...row.map(heightOf)));
 const tops=[0];
 for(let rank=0;rank<rows.length;rank++)tops.push(tops[rank]+rowHeights[rank]+Math.max(48,20+spacing*gaps[rank].length)+(grouped&&rank===0?28:0));
 const connectors=routes.map(({edge,from,to,x,exit,entry})=>{
  const start=tops[from]+heightOf(edge.from),end=tops[to]-1;
  const y=(rank:number,lane:number)=>tops[rank]+rowHeights[rank]+10+lane*spacing;
  let d=`M${edge.x1} ${start}`;
  if(exit!==null)d+=` V${y(from,exit)} H${x}`;
  if(entry!==null)d+=` V${y(to-1,entry)} H${edge.x2}`;
  return {d:`${d} V${end}`,bypass:to>from+1?x:undefined};
 });
 return {tops,height:tops.at(-1)!,connectors};
}

type Point={x:number;y:number};
type Segment={a:Point;b:Point};
const segments=(points:Point[]):Segment[]=>points.slice(1).flatMap((b,i)=>{
 const a=points[i];return a.x===b.x&&a.y===b.y?[]:[{a,b}];
});
const bounds=({a,b}:Segment)=>({left:Math.min(a.x,b.x),right:Math.max(a.x,b.x),top:Math.min(a.y,b.y),bottom:Math.max(a.y,b.y)});
const length=({a,b}:Segment)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);

/** Keep narrator coordinates fixed and improve the complete set of routed connectors. */
export function optimizeSanadPorts(rows:string[][],centers:ReadonlyMap<string,{x:number}>,ports:SanadPort[],width:number,cardWidth:number,cardHeight:number,cardHeights:ReadonlyMap<string,number>){
 const base=routeSanadConnectors(rows,centers,ports,width,cardWidth,cardHeight,false,cardHeights);
 const heightOf=(id:string)=>cardHeights.get(id)??cardHeight;
 const ranks=new Map(rows.flatMap((row,rank)=>row.map(id=>[id,rank] as const)));
 const bottoms=rows.map((row,i)=>base.tops[i]+Math.max(...row.map(heightOf)));
 const cards=rows.flatMap((row,rank)=>row.map(id=>({
  id,left:centers.get(id)!.x-cardWidth/2,right:centers.get(id)!.x+cardWidth/2,top:base.tops[rank],bottom:base.tops[rank]+heightOf(id),
 })));
 const parse=(d:string)=>{
  const [x,y,...rest]=d.match(/-?[\d.]+/g)!.map(Number);
  const points=[{x,y}];
  [...d.matchAll(/([HV])-?[\d.]+/g)].forEach((match,i)=>{
   const p=points.at(-1)!;
   points.push(match[1]==='H'?{x:rest[i],y:p.y}:{x:p.x,y:rest[i]});
  });
  return segments(points);
 };
 const routed=base.connectors.map(connector=>parse(connector.d));
 const interaction=(a:ReturnType<typeof bounds>,b:ReturnType<typeof bounds>)=>{
  const dx=Math.max(a.left,b.left)-Math.min(a.right,b.right);
  const dy=Math.max(a.top,b.top)-Math.min(a.bottom,b.bottom);
  if(dx<=0&&dy<=0)return dx<0||dy<0?((a.left===a.right)===(b.left===b.right)?3:1):1;
  return (dx<=0&&dy<10)||(dy<=0&&dx<10)?0.08:0;
 };
 for(let pass=0;pass<2;pass++){
  const order=ports.map((_,i)=>i);
  if(pass)order.reverse();
  for(const i of order){
   const edge=ports[i],from=ranks.get(edge.from)!,to=ranks.get(edge.to)!;
   if(from+1===to&&edge.x1===edge.x2&&routed[i].length===1)continue;
   const obstacles=cards.filter(card=>card.id!==edge.from&&card.id!==edge.to&&card.top>=base.tops[from]&&card.top<=base.tops[to]);
   const others=routed.flatMap((route,j)=>j===i?[]:route.map(bounds)).filter(b=>b.bottom>=base.tops[from]&&b.top<=base.tops[to]);
   const score=(route:Segment[])=>{
    let collisions=0,touches=0;
    for(const segment of route){
     const b=bounds(segment);
     collisions+=obstacles.filter(card=>b.right>=card.left-4&&b.left<=card.right+4&&b.bottom>card.top&&b.top<card.bottom).length;
     for(const other of others)touches+=interaction(b,other);
    }
    return collisions*1e9+touches*1e5+route.reduce((sum,s)=>sum+length(s),0)+route.length*12;
   };
   let best=routed[i],bestScore=score(best);
   const candidate=(points:Point[])=>{
    const route=segments(points),cost=score(route);
    if(cost<bestScore-.001){best=route;bestScore=cost;}
   };
   const start=base.tops[from]+heightOf(edge.from),end=base.tops[to]-1;
   const options=(id:string,original:number)=>{
    const center=centers.get(id)!.x,offset=Math.round(cardWidth*.33);
    return [original,center,center-offset,center+offset];
   };
   const gaps=(rank:number)=>[...new Set([bottoms[rank]+10,bottoms[rank]+24,base.tops[rank+1]-10])].sort((a,b)=>a-b);
   const sourcePorts=options(edge.from,edge.x1),destinationPorts=options(edge.to,edge.x2);
   for(const x1 of sourcePorts)for(const x2 of destinationPorts){
    if(from+1===to){
     for(const y of gaps(from))candidate([{x:x1,y:start},{x:x1,y},{x:x2,y},{x:x2,y:end}]);
     continue;
    }
    const intermediate=obstacles.filter(card=>card.top>base.tops[from]&&card.top<base.tops[to]);
    const clear=(x:number)=>intermediate.every(card=>x<=card.left-8||x>=card.right+8);
    const channels=[...new Set([x1,x2,(x1+x2)/2,base.connectors[i].bypass!,...intermediate.flatMap(card=>[card.left-8,card.right+8]),8,width-8])]
     .filter(x=>x>=8&&x<=width-8&&clear(x)).sort((a,b)=>Math.abs(a-x1)+Math.abs(a-x2)-Math.abs(b-x1)-Math.abs(b-x2));
    for(const x of channels.slice(0,8))for(const exit of gaps(from))for(const entry of gaps(to-1)){
     candidate([{x:x1,y:start},{x:x1,y:exit},{x,y:exit},{x,y:entry},{x:x2,y:entry},{x:x2,y:end}]);
    }
   }
   routed[i]=best;
  }
 }
 return {...base,connectors:routed.map(route=>{
  const {a}=route[0],{b}=route.at(-1)!;
  const d='M'+a.x+' '+a.y+route.map(({a,b})=>a.x===b.x?' V'+b.y:' H'+b.x).join('');
  return {d,x1:a.x,x2:b.x};
 })};
}
