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
