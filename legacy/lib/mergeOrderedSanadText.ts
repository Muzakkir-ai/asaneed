import {sanadPathLayout} from './sanadPathLayout';
import type {SanadBranch} from './orderedSanads';

/** Merge only fully traceable narrator-ID paths, not matching prose or similar names.
 * The shared literal continuation is copied once only when it matches exactly.
 * Any ambiguous prose, distinct continuation or correlated split stays unchanged. */
export function mergeOrderedSanadText(texts:string[],branches:Pick<SanadBranch,'paths'|'names'>[]):string|null{
 if(texts.length<2||texts.length!==branches.length)return null;
 const ids:string[][]=[],names=new Map<string,string>();
 let prefix:string|undefined,suffix:string|undefined;
 for(let i=0;i<texts.length;i++){
  const branch=branches[i],text=texts[i];
  if(branch.paths.length!==1||!text||text.includes('(ح)'))return null;
  // Stored diagram paths run from the older teacher toward the student.
  const path=[...branch.paths[0]].reverse();
  if(path.length<2||new Set(path).size!==path.length)return null;
  let cursor=0,leading='';
  for(const [index,id] of path.entries()){
   const name=branch.names[id];
   if(!id||!name||name.includes('،')||name.includes('(ح)'))return null;
   const previous=names.get(id);
   if(previous!==undefined&&previous!==name)return null;
   names.set(id,name);
   const at=text.indexOf(name,cursor);
   if(at<0)return null;
   const between=text.slice(cursor,at);
   if(index===0){
    if(!/^\s*(?:كما أخذته عن|عن)\s+$/u.test(between))return null;
    leading=between;
   }else if(!/^\s*،\s*عن\s+$/u.test(between))return null;
   cursor=at+name.length;
  }
  const trailing=text.slice(cursor);
  if(prefix!==undefined&&(prefix!==leading||suffix!==trailing))return null;
  prefix=leading;suffix=trailing;
  ids.push(path);
 }
 if(!ids.every(path=>path[path.length-1]===ids[0][ids[0].length-1]))return null;
 const blocks=sanadPathLayout(ids,true);
 if(!blocks||!blocks.length||blocks[blocks.length-1]?.kind!=='person')return null;
 const subject=(id:string)=>(names.get(id)||'').replace(/^أَبِي(?=\s)/u,'أَبُو').replace(/^أبي(?=\s)/u,'أبو');
 let result=prefix!.trimEnd(),lead=' ',pivot:string|null=null;
 for(const [index,block] of blocks.entries()){
  if(block.kind==='person'){
   result+=lead+names.get(block.id);
   lead='، عن ';pivot=block.id;
   continue;
  }
  // Nested/crossing groups cannot be stated faithfully with a single (ح) clause.
  if(index===blocks.length-1||!block.lanes.length||block.lanes.some(l=>!l.length||l.some(b=>b.kind!=='person')))return null;
  const lanes=block.lanes.map(l=>l.map(b=>(b as {kind:'person';id:string}).id));
  const clause=(lane:string[])=>lane.map(id=>names.get(id)).join('، عن ');
  // Several narrators between exactly the same student and teacher make one
  // parallel transmission group, not a separate (ح) transition per narrator.
  if(lanes.every(l=>l.length===1)){
   result+=lead+lanes.map((lane,i)=>(i?'و':'')+names.get(lane[0])).join('، ');
   lead=lanes.length===2?'، وكلاهما عن ':'، وكلهم عن ';
   pivot=null;
   continue;
  }
  // If single-hop alternatives coexist with longer independent branches,
  // group the single-hop narrators without inventing a combined route.
  const single=lanes.filter(l=>l.length===1);
  const grouped=single.length>=2;
  const rendered:string[][]=[];
  for(const lane of lanes){
   if(grouped&&lane.length===1){
    if(rendered.some(item=>item===single))continue;
    rendered.push(single);
   }else rendered.push([lane[0]]);
  }
  const expanded:string[][]=grouped?lanes.filter(l=>l.length>1).map(l=>l):lanes;
  const choices:(string[]|string[][])[]=[];
  let inserted=false;
  for(const lane of lanes){
   if(grouped&&lane.length===1){
    if(!inserted){choices.push(single);inserted=true;}
   }else choices.push(lane);
  }
  const formatChoice=(choice:string[]|string[][])=>Array.isArray(choice[0])
   ?(choice as string[][]).map(l=>names.get(l[0])).join('، و')
   :clause(choice as string[]);
  result+=lead+formatChoice(choices[0]);
  for(const choice of choices.slice(1))
   result+=' (ح). '+(pivot?'وقرأ '+subject(pivot)+' أيضًا على ':'كما أخذته أيضًا عن ')+formatChoice(choice);
  lead='، وقرأ '+lanes.map(l=>subject(l[l.length-1])).join(' و')+' على ';
  pivot=null;
 }
 result+=suffix;
 if(result.length>30000)throw Error('السند المدمج أطول من الحد المتاح؛ اختر أسانيد أقل');
 return result;
}
