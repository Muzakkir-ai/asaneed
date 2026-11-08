/** Merge lines visually only for a *complete* explicitly saved bipartite set.
 * A bus with sources S and destinations T represents every S → T pair.
 * Never form a bus for incomplete / merely overlapping isnad relations.
 * Edge indices refer to the unchanged original graph for tracing and filters.
 */
export type SanadBus={rank:number;from:string[];to:string[];edgeIndices:number[]};

export function sharedSanadBuses(
 rows:readonly (readonly string[])[],
 edges:readonly {from:string;to:string}[]
):SanadBus[]{
 const rankOf=new Map(rows.flatMap((row,rank)=>row.map(id=>[id,rank] as const)));
 const buses:SanadBus[]=[];
 const used=new Set<number>();
 for(let rank=0;rank<rows.length-1;rank++){
  const candidates=edges.flatMap((edge,i)=>!used.has(i)&&rankOf.get(edge.from)===rank&&rankOf.get(edge.to)===rank+1?[i]:[]);
  const sources=rows[rank];
  const targets=rows[rank+1];
  const bySource=new Map(sources.map(id=>[id,new Set(
   candidates.filter(i=>edges[i].from===id).map(i=>edges[i].to)
  )] as const));
  // Each pair of sources supplies a seed. Expand only to a *fully*
  // connected biclique; greedy disjoint selection avoids double-drawing.
  while(true){
   let best:SanadBus|null=null,bestGain=0;
   for(let a=0;a<sources.length;a++)for(let b=a+1;b<sources.length;b++){
    const sa=bySource.get(sources[a])!,sb=bySource.get(sources[b])!;
    const common=targets.filter(id=>sa.has(id)&&sb.has(id));
    if(common.length<2)continue;
    const from=sources.filter(id=>common.every(target=>bySource.get(id)!.has(target)));
    if(from.length<2)continue;
    const to=targets.filter(id=>from.every(source=>bySource.get(source)!.has(id)));
    const indices=from.flatMap(source=>to.map(target=>
     candidates.find(i=>edges[i].from===source&&edges[i].to===target)
    ));
    if(indices.some(i=>i===undefined)||indices.some(i=>used.has(i!)))continue;
    const gain=indices.length-from.length-to.length;
    if(gain>bestGain){bestGain=gain;best={rank,from,to,edgeIndices:indices as number[]};}
   }
   if(!best)break;
   buses.push(best);
   for(const i of best.edgeIndices)used.add(i);
   for(const source of best.from)for(const target of best.to)bySource.get(source)!.delete(target);
  }
 }
 return buses;
}
