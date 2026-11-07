type Edge={from:string;to:string};

/** Sweep in both directions, retaining only layouts that improve the whole graph. */
export function placeSanad(rows:string[][],edges:Edge[],width:number,cell:number){
 const ranks=new Map(rows.flatMap((row,rank)=>row.map(id=>[id,rank] as const)));
 let order=rows.map(row=>[...row].reverse());
 const positions=new Map<string,number>();
 const placeRow=(row:string[])=>row.forEach((id,i)=>positions.set(id,width/2+(i-(row.length-1)/2)*cell));
 order.forEach(placeRow);
 const links=new Map<string,string[]>();
 for(const {from,to} of edges){
  links.set(from,[...(links.get(from)??[]),to]);
  links.set(to,[...(links.get(to)??[]),from]);
 }
 const x=(id:string)=>positions.get(id)!;
 const spans=edges.map(edge=>({...edge,start:ranks.get(edge.from)!,end:ranks.get(edge.to)!}));
 const pairs=spans.flatMap((a,i)=>spans.slice(i+1).flatMap(b=>{
  const start=Math.max(a.start,b.start),end=Math.min(a.end,b.end);
  return start<end?[{a,b,start,end}]:[];
 }));
 const at=(edge:typeof spans[number],rank:number)=>x(edge.from)+(x(edge.to)-x(edge.from))*(rank-edge.start)/(edge.end-edge.start);
 const score=()=>{
  let crossings=0;
  for(const {a,b,start,end} of pairs){
   if((at(a,start)-at(b,start))*(at(a,end)-at(b,end))<-.01)crossings++;
  }
  return [crossings,edges.reduce((sum,edge)=>sum+Math.abs(x(edge.from)-x(edge.to)),0)];
 };
 const improves=(a:number[],b:number[])=>a[0]<b[0]||(a[0]===b[0]&&a[1]<b[1]-.01);
 let best=score();
 for(let pass=0;pass<8;pass++){
  const sweep=order.map((_,i)=>i);
  if(pass%2)sweep.reverse();
  for(const rank of sweep){
   const previous=order[rank];
   const center=(id:string)=>{
    const neighbors=links.get(id)??[];
    return neighbors.length?neighbors.reduce((sum,next)=>sum+x(next),0)/neighbors.length:x(id);
   };
   const next=[...previous].sort((a,b)=>center(a)-center(b));
   placeRow(next);
   const result=score();
   if(improves(result,best)){best=result;order[rank]=next;}
   else placeRow(previous);
  }
 }
 for(let pass=0;pass<4;pass++){
  const sweep=pass%2?[...order].reverse():order;
  for(const row of sweep){
   for(const [i,id] of row.entries()){
    const neighbors=links.get(id)??[];
    if(!neighbors.length)continue;
    const previous=x(id);
    const lower=i?x(row[i-1])+cell:cell/2+24;
    const upper=i<row.length-1?x(row[i+1])-cell:width-cell/2-24;
    const targets=neighbors.map(x).sort((a,b)=>a-b);
    const mean=targets.reduce((sum,target)=>sum+target,0)/targets.length;
    for(const target of [mean,targets[Math.floor(targets.length/2)]]){
     positions.set(id,Math.round(Math.max(lower,Math.min(upper,target))));
     const result=score();
     if(improves(result,best))best=result;
     else positions.set(id,previous);
     if(x(id)!==previous)break;
    }
   }
  }
 }
 return positions;
}
