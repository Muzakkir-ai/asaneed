/** Numbering is presentation-only: use the actual position on each visible saved
 * path, not a topological rank (which differs for unequal-length routes). */
export type SanadPositionLabel={position:number;parallel:string};
const alphabet=Array.from('أبجدهوزحطيكلمنسعفصقرشتثخذضظغ');
function letters(index:number):string{
 let result='';for(let n=index+1;n>0;n=Math.floor((n-1)/alphabet.length))result=alphabet[(n-1)%alphabet.length]+result;
 return result;
}
export function sanadPresentation(paths:readonly (readonly string[])[]){
 const at=new Map<number,string[]>(),positions=new Map<string,number[]>();
 for(const path of paths)path.forEach((id,i)=>{
  const position=i+1,peers=at.get(position)??[],own=positions.get(id)??[];
  if(!peers.includes(id))peers.push(id);
  if(!own.includes(position))own.push(position);
  at.set(position,peers);positions.set(id,own);
 });
 const result=new Map<string,SanadPositionLabel[]>();
 for(const [id,own] of positions)result.set(id,own.sort((a,b)=>a-b).map(position=>{
  const peers=at.get(position)!;
  return {position,parallel:peers.length>1?letters(peers.indexOf(id)):''};
 }));
 return result;
}
