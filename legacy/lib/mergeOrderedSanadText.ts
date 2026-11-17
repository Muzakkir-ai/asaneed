import type {SanadBranch} from './orderedSanads';
import {sanadPathLayout,type SanadPathBlock} from './sanadPathLayout';

/** Compress only identity-backed paths that reproduce exactly the original
 * selected routes. Ambiguous text, unrelated continuations and crossing
 * selections fall back to the unchanged literal sources. */
export function mergeOrderedSanadText(texts:string[],branches:Pick<SanadBranch,'paths'|'names'>[]):string|null {
 if(texts.length<2||texts.length!==branches.length)return null;
 const routes:{ids:string[];tail:string}[]=[],names=new Map<string,string>();
 const normalize=(s:string)=>s.normalize('NFKC').replace(/[\u064b-\u065f\u0670\u0640\u06d6-\u06ed]/gu,'')
  .replace(/[أإآٱ]/gu,'ا').replace(/ى/gu,'ي').replace(/\s+/gu,' ').trim();
 const comparable=(s:string)=>normalize(s).replace(/[.،؛\s]+$/u,'')
  .replace(/^(?:(?:الشيخ|الشيخة|المقرئ|الإمام|الامام|السيد)\s+)+/u,'');
 let opening:string|undefined;
 for(let i=0;i<texts.length;i++){
  const pathList=branches[i].paths.map(path=>[...path].reverse());
  const segments=texts[i].split(/\s*\(ح\)\s*/u).map(s=>s.trim()).filter(Boolean);
  if(!pathList.length||segments.length!==pathList.length)return null;
  const unused=new Set(pathList.map((_,index)=>index));
  for(const segment of segments){
   const m=/^(كما أخذته عن|عن)\s+(.+)$/su.exec(segment);
   if(!m)return null;
   const words=m[2].split(/،\s*عن\s+/u),matches:number[]=[];
   for(const j of unused){
    const ids=pathList[j];
    if(ids.length<2||new Set(ids).size!==ids.length||words.length<ids.length)continue;
    if(ids.every((id,k)=>{
     const name=branches[i].names[id];
     return !!id&&!!name&&comparable(words[k])===comparable(name);
    }))matches.push(j);
   }
   if(matches.length!==1)return null;
   const index=matches[0],ids=pathList[index];unused.delete(index);
   if(opening!==undefined&&opening!==m[1])return null;
   opening=m[1];
   for(const id of ids){
    const name=branches[i].names[id],existing=names.get(id);
    if(existing!==undefined&&comparable(existing)!==comparable(name))return null;
    if(!existing)names.set(id,name);
   }
   const trailing=words.slice(ids.length).join('، عن ');
   routes.push({ids,tail:trailing?'، عن '+trailing:''});
  }
  if(unused.size)return null;
 }
 if(!routes.length||routes.some(r=>r.ids.at(-1)!==routes[0].ids.at(-1)))return null;
 const suffixes=[...new Set(routes.map(r=>r.tail).filter(s=>s.trim()))];
 if(suffixes.length>1)return null;
 const suffix=suffixes[0]||'';
 // Never attach a novel short extension from just one selected route to all
 // of them. Only a common explicit continuation up to the Prophet qualifies.
 if(suffix&&!/(?:رسول\s*الله|رَسُولِ\s*الله|النبي)/u.test(suffix))return null;
 const inputRoutes=[...new Set(routes.map(r=>JSON.stringify(r.ids)))].map(s=>JSON.parse(s) as string[]);
 const outgoing=new Map<string,Set<string>>(),incoming=new Map<string,Set<string>>(),all=new Set<string>();
 for(const path of inputRoutes)for(let i=0;i<path.length;i++){
  const id=path[i];all.add(id);
  if(i+1<path.length){
   const to=path[i+1];
   if(!outgoing.has(id))outgoing.set(id,new Set());
   outgoing.get(id)!.add(to);
   if(!incoming.has(to))incoming.set(to,new Set());
   incoming.get(to)!.add(id);
  }
 }
 const roots=[...all].filter(id=>!incoming.get(id)?.size);
 if(!roots.length||all.size>256||inputRoutes.length>128)return null;
 // Check DAG closure rather than just edge counts. This prevents silently
 // inventing a sanad by crossing two correlated choices.
 const closed:string[][]=[];let invalid=false;
 function walk(node:string,path:string[]){
  if(invalid||path.includes(node)||closed.length>128){invalid=true;return;}
  const next=[...path,node],children=[...(outgoing.get(node)||[])];
  if(!children.length){closed.push(next);return;}
  for(const child of children)walk(child,next);
 }
 for(const root of roots)walk(root,[]);
 const key=(ids:string[])=>JSON.stringify(ids);
 if(invalid||closed.length!==inputRoutes.length||
   new Set(closed.map(key)).size!==inputRoutes.length||
   inputRoutes.some(p=>!closed.some(q=>key(p)===key(q))))return null;
 const indegree=new Map([...all].map(id=>[id,incoming.get(id)?.size||0]));
 const work=[...roots],order:string[]=[];
 while(work.length){
  const id=work.shift()!;order.push(id);
  for(const to of outgoing.get(id)||[]){
   indegree.set(to,indegree.get(to)!-1);
   if(indegree.get(to)===0)work.push(to);
  }
 }
 if(order.length!==all.size)return null;
 // Encounter meeting points from the living student toward older teachers.
 const joins=order.filter(id=>(incoming.get(id)?.size||0)>1);
 const terminal=inputRoutes[0].at(-1)!;
 if(!joins.includes(terminal))joins.push(terminal);
 const mentioned=new Set<string>(),paragraphs:string[]=[];
 const person=(id:string)=>(names.get(id)||'').replace(/[،.\s]+$/u,'').replace(/^أبو(?=\s)/u,'أبي');
 const subject=(id:string)=>person(id).replace(/^أَبِي(?=\s)/u,'أَبُو').replace(/^أبي(?=\s)/u,'أبو');
 function renderBlocks(blocks:SanadPathBlock[],starter:string,pivot:string|null):string {
  let out='',first=true,current=pivot;
  for(const block of blocks){
   if(block.kind==='person'){
    if(first&&mentioned.has(block.id)){
     out='ومن طريق '+person(block.id);current=block.id;first=false;continue;
    }
    out+=(out?'، عن ':starter+' ')+person(block.id);
    current=block.id;first=false;continue;
   }
   const lanes=block.lanes;
   if(!lanes.length)return '';
   // 2, 3 or 4 parallel direct links between the same student/teacher
   // form one named group, not multiple (ح) branches.
   if(lanes.every(l=>l.length===1&&l[0].kind==='person')){
    const ids=lanes.map(l=>(l[0] as {kind:'person';id:string}).id);
    out+=(out?'، عن ':starter+' ')+ids.map(person).join('، و');
    current=null;first=false;continue;
   }
   const rendered=lanes.map((lane,i)=>{
    const intro=i===0?(out?'عن':starter):(current?'وقرأ '+subject(current)+' أيضًا على':'كما أخذته عن');
    return renderBlocks(lane,intro,null);
   }).filter(Boolean);
   if(!rendered.length)continue;
   out+=(out?'، ':'')+rendered.join(' (ح) ');
   current=null;first=false;
  }
  return out;
 }
 for(const meeting of joins){
  const partials:string[][]=[],seen=new Set<string>();
  function backward(current:string,rev:string[]){
   if(rev.includes(current))throw Error('invalid loop');
   const next=[...rev,current];
   if(mentioned.has(current)||!incoming.get(current)?.size){
    const path=next.reverse(),k=JSON.stringify(path);
    if(!seen.has(k)){seen.add(k);partials.push(path);}
    return;
   }
   for(const parent of incoming.get(current)!)backward(parent,next);
  }
  for(const parent of incoming.get(meeting)||[])backward(parent,[]);
  if(!partials.length)continue;
  const blocks=sanadPathLayout(partials,true);
  if(!blocks)return null;
  const section=renderBlocks(blocks,'كما أخذته عن',null).trim();
  if(section)paragraphs.push((paragraphs.length&&new Set(partials.map(p=>p[0])).size>1?'(ح) ':'')+section);
  paragraphs.push('ثم تلتقي الطرق عند '+person(meeting));
  for(const path of partials)path.forEach(id=>mentioned.add(id));
  mentioned.add(meeting);
 }
 const text=paragraphs.join('، ').replace(/،\s*\./gu,'.')+(suffix||'.');
 return text&&text.length<=30000?text:null;
}
