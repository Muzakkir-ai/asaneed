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
 const terminal=inputRoutes[0].at(-1)!;
 const joins=order.filter(id=>{
  const parents=[...(incoming.get(id)??[])];
  if(parents.length<2)return false;
  const students=incoming.get(parents[0]);
  // Keep a direct teacher group inside its route to the next meeting.
  return id===terminal||students?.size!==1||!parents.every(parent=>
   outgoing.get(parent)?.size===1&&incoming.get(parent)?.size===1&&
   incoming.get(parent)?.has([...students][0]));
 });
 if(!joins.includes(terminal))joins.push(terminal);
 const mentioned=new Set<string>();
 let text='',previousMeeting:string|undefined;
 const person=(id:string)=>(names.get(id)||'').replace(/[،.\s]+$/u,'').replace(/^أبو(?=\s)/u,'أبي');
 const subject=(id:string)=>person(id).replace(/^أَبِي(?=\s)/u,'أَبُو').replace(/^أبي(?=\s)/u,'أبو');
 const alternateIntro=()=> 'وكما أخذته أيضًا عن ';
 function renderBlocks(blocks:SanadPathBlock[],intro:string,pivot?:string):string {
  let out='',current=pivot;
  for(let index=0;index<blocks.length;index++){
   const block=blocks[index];
   if(block.kind==='person'){
    if(index===0&&intro===alternateIntro()&&mentioned.has(block.id)){
     out='وقرأ '+subject(block.id)+' أيضًا على ';
     const rest=renderBlocks(blocks.slice(1),'',block.id);
     return rest?out+rest:'';
    }
    out+=(out?'، عن ':intro)+person(block.id);
    current=block.id;
    continue;
   }
   const meeting=blocks[index+1];
   if(meeting?.kind!=='person')return '';
   // Immediate alternative teachers with the same student and teacher share one phrase.
   if(current&&block.lanes.every(lane=>lane.length===1&&lane[0].kind==='person')){
    const teachers=block.lanes.map(lane=>person((lane[0] as {kind:'person';id:string}).id));
    out+=(out?'، عن ':intro)+teachers.join('، و');
    current=undefined;
    continue;
   }
   // Repeat the shared narrator in each lane so every switch comes after its meeting.
   const rendered=block.lanes.map((lane,laneIndex)=>renderBlocks([...lane,meeting],
    laneIndex===0?(out?'، عن ':intro):
     current?'وقرأ '+subject(current)+' أيضًا على ':alternateIntro()));
   if(rendered.some(lane=>!lane))return '';
   out+=rendered.join(' (ح) ');
   current=meeting.id;
   index++;
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
  // Put the route that continues the previous meeting before independent arrivals.
  const ordered=partials.filter(path=>path[0]===previousMeeting)
   .concat(partials.filter(path=>path[0]!==previousMeeting));
  const blocks=sanadPathLayout(ordered,true);
  if(!blocks)return null;
  const first=blocks[0];
  const meetingBlock={kind:'person' as const,id:meeting};
  if(first?.kind==='split'&&first.lanes[0][0]?.kind==='person'&&
    first.lanes[0][0].id===previousMeeting){
   // The previous meeting is already at the end of the current sentence.
   const nextMeeting=blocks[1]??meetingBlock;
   if(nextMeeting.kind!=='person')return null;
   const continuation=renderBlocks([...first.lanes[0].slice(1),nextMeeting],'، عن ',previousMeeting);
   const alternatives=first.lanes.slice(1).map(lane=>renderBlocks([...lane,nextMeeting],alternateIntro()));
   const remaining=blocks.length>1?[...blocks.slice(2),meetingBlock]:[];
   const tail=renderBlocks(remaining,'، عن ',nextMeeting.id);
   if(!continuation||alternatives.some(lane=>!lane)||(remaining.length&&!tail))return null;
   text+=[continuation,...alternatives].join(' (ح) ')+tail;
  }else{
   const continues=first?.kind==='person'&&first.id===previousMeeting;
   const section=renderBlocks([...(continues?blocks.slice(1):blocks),meetingBlock],
    continues?'، عن ':text?alternateIntro():(opening??'كما أخذته عن')+' ',
    continues?previousMeeting:undefined);
   if(!section)return null;
   text+=(text&&!continues?' (ح) ':'')+section;
  }
  previousMeeting=meeting;
  for(const path of partials)path.forEach(id=>mentioned.add(id));
  mentioned.add(meeting);
 }
 text+=suffix||'.';
 return text&&text.length<=30000?text:null;
}
