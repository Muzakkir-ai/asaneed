import {sanadPathLayout} from './sanadPathLayout';
/** Render the names of one explicitly ordered path. */
export function renderSanadSequence(names:string[]){
 return names.map(name=>'عن '+name.trim().replace(/^(?:عن\s+)+/u,'').replace(/[،.؛\s]+$/u,'')).join('، ');
}
/** Render explicit splits and joins, preserving free-text fallbacks. */
export function renderBranchedSanad(paths:string[][],name:(id:string)=>string,subject:(id:string)=>string,prefix:string,continuation:string){
 const head=prefix.trim().replace(/[،.\s]+$/u,''),tail=continuation.trim();
 const chain=(ids:string[])=>renderSanadSequence(ids.map(name));
 const join=(...parts:string[])=>parts.filter(Boolean).join('، ');
 const complete=()=>paths.map(ids=>join(head,chain(ids),tail)).join('\n\n(ح)\n\n');
 if(paths.length<2)return complete();
 const blocks=sanadPathLayout(paths);
 if(!blocks||blocks[0]?.kind!=='person'||!/^عن\s+/u.test(tail))return complete();
 if(blocks.some(b=>b.kind==='split'&&b.lanes.some(l=>!l.length||l.some(n=>n.kind!=='person'))))return complete();
 let text=head,lead=head?'، عن ':'عن ',pivot='';
 for(const block of blocks){
  if(block.kind==='person'){text+=lead+name(block.id);lead='، عن ';pivot=block.id;continue;}
  const lanes=block.lanes.map(l=>l.map(n=>(n as {kind:'person';id:string}).id));
  if(lanes.every(l=>l.length===1)){
   text+=lead+lanes.map(l=>name(l[0])).join('، و');
   lead=lanes.length===2?'، وهما قرآ على ':'، وهم قرؤوا على ';
  }else{
   text+=lead+chain(lanes[0]).replace(/^عن /u,'');
   for(const lane of lanes.slice(1))text+=' (ح). وقرأ '+subject(pivot)+' أيضًا على '+name(lane[0])+(lane.length>1?'، '+chain(lane.slice(1)):'');
   text+='.';lead=' وقرأ '+lanes.map(l=>subject(l[l.length-1])).join(' و')+' على ';
  }
 }
 return text+lead+tail.replace(/^عن\s+/u,'');
}
/** Saved familiar name when available; change the explicit Abu genitive for a verb subject. */
export const sanadSubjectName=(name:string)=>(name.match(/(?:المعروف|الشهير)\s+بـ?\s+(.+)$/u)?.[1]||name).replace(/^أَبِي(?=\s)/u,'أَبُو').replace(/^أبي(?=\s)/u,'أبو');
