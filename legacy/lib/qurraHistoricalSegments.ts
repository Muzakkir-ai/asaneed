import {QURRA} from './qurra';
import {sanadKey,type ContinuationSection} from './unifiedSanad';
import {buildNarratorDirectory} from './narratorDirectory';

export type HistoricalSegmentKind='rawi-imam'|'imam-sahaba'|'sahaba-prophet';
export type HistoricalSectionView={
 id:string; title:string; body:string;kind:HistoricalSegmentKind;
 qariId:string; rawi:string;
 branches:string[];paths:string[][];names:Record<string,string>;
 /** Extracted from unreviewed source prose: never a confirmed sanad. */
 status:'source-text-review';
};

const parts=(body:string)=>{
 const pieces=body
  .split(/(?=\s*\(ح\)\s*[.،]?\s*(?:وَقَرَأَ|وقرأ|وأخذ))|(?=\s*(?:وَقَرَأَ|وقرأ)\s+[^.،]{2,110}?(?:أيضًا|ايضا)\s+)/gu)
  .map(p=>p.trim()).filter(Boolean);
 return pieces.length?pieces:[body];
};

/** Use saved CHAIN sections without rewriting them.
 * Diagrams are read-only interpretations of links represented by
 * the existing narrator directory extractor; full source is always retained.
 * Never synthesize an historical edge by joining independent source sections.
 */
export function historicalSection(
 sections:readonly ContinuationSection[],
 qariId:string,rawi:string,kind:HistoricalSegmentKind,
):HistoricalSectionView|null{
 const catalog=QURRA.find(q=>q.id===qariId);
 if(!catalog)return null;
 const suffix=kind==='imam-sahaba'?'sahaba':kind==='sahaba-prophet'?'prophet':rawi;
 if(kind==='rawi-imam'&&!catalog.rawis.some(r=>sanadKey(r)===sanadKey(rawi)))return null;
 const title=['CHAIN',qariId,suffix].join(':');
 const section=sections.find(s=>sanadKey(s.title)===sanadKey(title)&&s.body?.trim());
 if(!section)return null;
 const {people}=buildNarratorDirectory([{id:section.id,title:section.title,body:section.body}]);
 const names=Object.fromEntries(people.map(person=>[person.id,person.name]));
 const byId=new Map(people.map(p=>[p.id,p]));
 const incoming=new Set(people.flatMap(p=>p.teachers));
 const roots=people.filter(p=>!incoming.has(p.id));
 const paths:string[][]=[];
 let unsafe=false;
 function walk(id:string,current:string[]){
  if(current.includes(id)||current.length>35||paths.length>64){unsafe=true;return;}
  const path=[...current,id],next=byId.get(id)?.teachers.filter(t=>byId.has(t))||[];
  if(!next.length){if(path.length>1)paths.push(path);return;}
  for(const teacher of next)walk(teacher,path);
 }
 for(const person of roots)walk(person.id,[]);
 // Don't guess around source prose that cannot be represented as an
 // unambiguous acyclic graph. Exact clauses remain as branch cards.
 const accepted=!unsafe&&paths.length<=64?paths:[];
 return {
  id:section.id,title:section.title,body:section.body,
  kind,qariId,rawi,branches:parts(section.body),
  paths:accepted,names,status:'source-text-review',
 };
}

export function allHistoricalSections(sections:readonly ContinuationSection[],kind:HistoricalSegmentKind){
 return QURRA.flatMap(q=>{
  const labels=kind==='rawi-imam'?q.rawis:[''];
  return labels.flatMap(rawi=>{
   const match=historicalSection(sections,q.id,rawi,kind);
   return match?[match]:[];
  });
 });
}
