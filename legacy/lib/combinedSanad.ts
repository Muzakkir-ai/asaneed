/** Keep route membership on each saved edge. A cycle cannot be drawn as a ranked tree. */
export function combinedSanad(paths:string[][]){
 const nodes=new Map<string,{id:string;rank:number;incoming:number;outgoing:Set<string>}>();
 const edges=new Map<string,{from:string;to:string;routes:number[]}>();
 for(const [route,path] of paths.entries()){
  if(new Set(path).size!==path.length)return null;
  for(const [i,id] of path.entries()){
   if(!nodes.has(id))nodes.set(id,{id,rank:0,incoming:0,outgoing:new Set()});
   if(!i)continue;
   const from=path[i-1],key=JSON.stringify([from,id]);
   const existing=edges.get(key);
   if(existing)existing.routes.push(route);
   else{
    edges.set(key,{from,to:id,routes:[route]});
    nodes.get(from)!.outgoing.add(id);
    nodes.get(id)!.incoming++;
   }
  }
 }
 const ready=[...nodes.values()].filter(node=>node.incoming===0),rows:string[][]=[];
 for(let i=0;i<ready.length;i++){
  const node=ready[i];
  (rows[node.rank]??=[]).push(node.id);
  for(const id of node.outgoing){
   const next=nodes.get(id)!;
   next.rank=Math.max(next.rank,node.rank+1);
   if(--next.incoming===0)ready.push(next);
  }
 }
 if(ready.length!==nodes.size)return null;
 const lengths=[...new Set(paths.map(path=>path.length).filter(Boolean))].sort((a,b)=>a-b);
 const directStudents=paths.length&&paths.every(path=>path[0]===paths[0][0])
  ?[...new Set(paths.flatMap(path=>path[1]?[path[1]]:[]))]:[];
 return {rows,edges:[...edges.values()],lengths,shortestRoutes:paths.flatMap((path,i)=>path.length===lengths[0]?[i]:[]),directStudents};
}
