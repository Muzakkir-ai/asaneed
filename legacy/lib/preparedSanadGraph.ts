import type {PreparedSanadPeople} from './preparedSanadPeople';
import {sanadKey} from './unifiedSanad';
export type PreparedGraphNode={id:string;indices:number[];name:string;turn:boolean};
export type PreparedGraph={nodes:PreparedGraphNode[];edges:{from:string;to:string}[];paths:string[][]};
/** Resolve explicit source references only. Ambiguous origins, cycles and dangling branches fall back to the literal source editor. */
export function preparedSanadGraph(source:PreparedSanadPeople,people:{name:string;personId?:string}[]):PreparedGraph|null{
 if(source.tokens.length!==people.length)return null;
 if(people.some((person,i)=>people.some((other,j)=>j<i&&sanadKey(other.name)===sanadKey(person.name)&&(!person.personId||!other.personId))))return null;
 const nodes:PreparedGraphNode[]=[],ids:string[]=[],edges:PreparedGraph['edges']=[];
 for(let i=0;i<people.length;i++){const id=people[i].personId||'occurrence:'+i;ids.push(id);const existing=nodes.find(n=>n.id===id);if(existing)existing.indices.push(i);else nodes.push({id,indices:[i],name:people[i].name,turn:/\(ح\)/u.test(source.tokens[i].before)});}
 const key=(value:string)=>sanadKey(value).replace(/^(?:الشيخ|المقرئ|الإمام|الامام)\s+/u,'');
 const add=(from:string,to:string)=>{if(from===to)return false;if(!edges.some(e=>e.from===from&&e.to===to))edges.push({from,to});return true;};
 let joint:string[]=[];
 for(let i=1;i<people.length;i++){
  const before=source.tokens[i].before,branch=/\(ح\)\.\s*وأخذ\s+(.+?)\s+أيضًا\s+عن/u.exec(before);
  if(branch){const origin=key(branch[1]);const candidates=nodes.filter(n=>n.indices.some(j=>j<i)&&n.indices.some(j=>j<i&&(' '+key(people[j].name)+' ').includes(' '+origin+' ')));if(candidates.length!==1||!add(candidates[0].id,ids[i]))return null;joint=[];}
  else if(before.trim()==='و'){if(i<2||!add(ids[i-2],ids[i]))return null;joint=[ids[i-1],ids[i]];}
  else if(/وهما\s+عن/u.test(before)){if(joint.length!==2||joint.some(from=>!add(from,ids[i])))return null;joint=[];}
  else{if(!add(ids[i-1],ids[i]))return null;joint=[];}
 }
 const root=ids[0],end=ids.at(-1);if(!root||!end)return null;
 const paths:string[][]=[];let invalid=false;
 function walk(id:string,path:string[]){if(path.includes(id)||paths.length>=32){invalid=true;return;}const next=[...path,id],out=edges.filter(e=>e.from===id);if(!out.length){if(id!==end)invalid=true;else paths.push(next);return;}for(const edge of out)walk(edge.to,next);}
 walk(root,[]);if(invalid||paths.length<1||nodes.some(n=>!paths.some(p=>p.includes(n.id))))return null;
 const depth=new Map<string,number>();for(const path of paths)path.forEach((id,i)=>depth.set(id,Math.max(depth.get(id)||0,i)));
 nodes.sort((a,b)=>(depth.get(a.id)||0)-(depth.get(b.id)||0)||a.indices[0]-b.indices[0]);paths.sort((a,b)=>a.length-b.length);
 return {nodes,edges,paths};
}
