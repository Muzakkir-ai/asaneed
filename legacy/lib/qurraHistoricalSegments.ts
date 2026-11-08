import {QURRA} from './qurra';
import {sanadKey,type ContinuationSection} from './unifiedSanad';
import {fullRawiName,savedRawiPerson} from './rawiIdentity';
import type {BuilderPerson} from './bookBuilder';
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

/** Rijāl al-Asānīd already indexes the explicit imam/teacher/Companion
 * relationships for each CHAIN:*:sahaba source. Reuse exactly that ONE
 * section's directed edges, not links from the global directory or other
 * readings. These are source-based previews, never approved certificates.
 *
 * A child node points to its teachers. Enumerating root-to-leaf paths lets
 * the same CombinedSanadView layout connect split and meeting narrators
 * without inventing an edge between unrelated source segments.
 */
export function imamCompanionIndexedGraph(
 section:{id:string;title:string;body:string},qariId:string,
):{paths:string[][];names:Record<string,string>}{
 if(section.title!=='CHAIN:'+qariId+':sahaba'||!section.body.trim())return {paths:[],names:{}};
 const directory=buildNarratorDirectory([section]);
 const byId=new Map(directory.people.map(p=>[p.id,p]));
 const imam='imam:'+qariId;
 if(!byId.has(imam))return {paths:[],names:{}};
 const names=Object.fromEntries(directory.people.map(p=>[p.id,p.name]));
 const paths:string[][]=[],unique=new Set<string>();
 let unsafe=false;
 const visit=(id:string,path:string[])=>{
  if(unsafe)return;
  if(path.includes(id)||path.length>=24){unsafe=true;return;}
  const next=[...new Set(byId.get(id)?.teachers||[])].filter(k=>byId.has(k));
  const extended=[...path,id];
  if(!next.length){
   if(extended.length>1){
    const key=JSON.stringify(extended);
    if(!unique.has(key)){unique.add(key);paths.push(extended);}
    if(paths.length>120)unsafe=true;
   }
   return;
  }
  for(const nextId of next)visit(nextId,extended);
 };
 visit(imam,[]);
 return {paths:unsafe?[]:paths,names};
}


/** Match spelling variants for locating a named person in the ORIGINAL
 * source clause. This is not an identity-merge heuristic: graph identities
 * still come exclusively from the source-scoped Rijal directory. */
const sourceKey=(value:string)=>sanadKey(value)
 .replace(/[،؛.:()\-ـ]/gu,' ').replace(/\s+/gu,' ').trim();

/** Follow only explicitly indexed teacher edges within one CHAIN source.
 * Fail closed on cycles, missing endpoints or pathological fan-out.
 * In particular, do not join paths across separate qira'at sections. */
function indexedRoutes(
 directory:ReturnType<typeof buildNarratorDirectory>,root:string,target:string,
):string[][]{
 const people=new Map(directory.people.map(person=>[person.id,person]));
 if(!people.has(root)||!people.has(target)||root===target)return [];
 const paths:string[][]=[],seen=new Set<string>();
 let unsafe=false;
 const walk=(id:string,visited:string[])=>{
  if(unsafe)return;
  if(visited.includes(id)||visited.length>=24){unsafe=true;return;}
  const next=[...visited,id];
  if(id===target){
   const key=JSON.stringify(next);
   if(!seen.has(key)){seen.add(key);paths.push(next);}
   if(paths.length>120)unsafe=true;
   return;
  }
  for(const teacher of new Set(people.get(id)?.teachers||[])){
   if(people.has(teacher))walk(teacher,next);
  }
 };
 walk(root,[]);
 return unsafe?[]:paths;
}

/** A literal «صاحب الرواية» clause identifies which Rijal person is the
 * selected rawi. The teacher edges are then read from that same CHAIN only.
 * No fuzzy guess from a short rawi label and no invented rawi→imam edge. */
export function rawiImamIndexedGraph(
 section:{id:string;title:string;body:string},qariId:string,rawi:string,
):{paths:string[][];names:Record<string,string>}{
 if(sanadKey(section.title)!==sanadKey('CHAIN:'+qariId+':'+rawi)||!section.body.trim())return {paths:[],names:{}};
 const clauses=section.body.split(/[،؛.]/u);
 const label=clauses.find(clause=>sourceKey(clause).includes('صاحب الرواية'));
 if(!label)return {paths:[],names:{}};
 const directory=buildNarratorDirectory([section]);
 const target='imam:'+qariId;
 const inClause=sourceKey(label);
 const matches=directory.people.filter(person=>{
  const name=sourceKey(person.name);
  return person.id!==target&&name.length>=12&&inClause.includes(name);
 }).sort((a,b)=>sourceKey(b.name).length-sourceKey(a.name).length);
 const best=matches[0];
 // Never decide between two distinct identities with the same source witness.
 if(!best||(matches.length>1&&sourceKey(matches[1].name).length===sourceKey(best.name).length))return {paths:[],names:{}};
 const paths=indexedRoutes(directory,best.id,target);
 return {paths,names:paths.length?Object.fromEntries(directory.people.map(p=>[p.id,p.name])):{}};
}

/** The Prophet section states which named Companions read to the Prophet.
 * Rijal provides their stable IDs, but each candidate must ALSO occur in
 * this very section's preserved text before a visible arrow is created. */
export function companionsProphetIndexedGraph(
 section:{id:string;title:string;body:string},qariId:string,
):{paths:string[][];names:Record<string,string>}{
 if(section.title!=='CHAIN:'+qariId+':prophet'||!section.body.trim())return {paths:[],names:{}};
 const original=sourceKey(section.body);
 if(!original.includes('علي رسول الله'))return {paths:[],names:{}};
 const directory=buildNarratorDirectory([section]);
 const prophet=directory.people.find(person=>person.id==='prophet');
 if(!prophet)return {paths:[],names:{}};
 const companions=directory.people.filter(person=>
  person.id.startsWith('sahabi:')&&person.teachers.includes('prophet')
  &&sourceKey(person.name).length>=7&&original.includes(sourceKey(person.name))
 );
 const paths=companions.map(person=>[person.id,'prophet']);
 return {paths,names:paths.length?Object.fromEntries(directory.people.map(p=>[p.id,p.name])):{}};
}

/** Use saved CHAIN sections without rewriting them.
 * Diagrams are read-only interpretations of links represented by
 * the existing narrator directory extractor; full source is always retained.
 * Never synthesize an historical edge by joining independent source sections.
 */
export function historicalSection(
 sections:readonly ContinuationSection[],
 qariId:string,rawi:string,kind:HistoricalSegmentKind,
 people:readonly BuilderPerson[]=[],
):HistoricalSectionView|null{
 const catalog=QURRA.find(q=>q.id===qariId);
 if(!catalog)return null;
 const suffix=kind==='imam-sahaba'?'sahaba':kind==='sahaba-prophet'?'prophet':rawi;
 if(kind==='rawi-imam'&&!catalog.rawis.some(r=>sanadKey(r)===sanadKey(rawi)))return null;
 const title=['CHAIN',qariId,suffix].join(':');
 const section=sections.find(s=>sanadKey(s.title)===sanadKey(title)&&s.body?.trim());
 if(!section)return null;
 const index=kind==='imam-sahaba'?imamCompanionIndexedGraph(section,qariId)
  :kind==='rawi-imam'?rawiImamIndexedGraph(section,qariId,rawi)
  :companionsProphetIndexedGraph(section,qariId);
 const names:Record<string,string>=index?.names||{};
 const paths:string[][]=index?.paths||[];
 if(kind==='rawi-imam'&&paths.length){
  // Prefer the database's audited full name for the same selected rawi;
  // this changes a label, never the historical source edge or person ID.
  const saved=savedRawiPerson(people,qariId,rawi);
  if(saved)names[paths[0][0]]=saved.name;
 }
 // The only auto-drawn historical edges are an explicitly written,
 // unbranched sequence AFTER «صاحب الرواية» and «عن», ending in
 // «صاحب القراءة». Branches and plural pronouns need human review.
 if(kind==='rawi-imam'&&!paths.length){
  const body=section.body.trim();
  const pivot=body.search(/صَ?ا?حِ?ب[ِ ]+\s*(?:الرِّ?وَايَةِ?|الرواية)/u);
  const suffix=pivot>=0?body.slice(pivot).replace(/^.*?(?:الرِّ?وَايَةِ?|الرواية)\s*[،.]?\s*/u,''):'';
  const parts=suffix.split(/(?:^|[،.؛])\s*عن\s+/u).map(x=>x.trim()).filter(Boolean);
  const hasBranches=/\b(?:وهما|وهم|قرأوا|قرؤوا|وقرأ|وقرؤوا)\b/u.test(suffix)
   ||/[\(\)]/u.test(suffix);
  if(parts.length>0&&parts.length<=7&&!hasBranches&&/صَ?ا?حِ?ب[ِ ]+\s*(?:القراءة|القِرَاءَةِ?)/u.test(parts.at(-1)||'')){
   const texts=[fullRawiName(qariId,rawi),...parts.map(x=>x.replace(/\s*(?:صَ?ا?حِ?ب[ِ ]+\s*(?:القراءة|القِرَاءَةِ?)).*$/u,'').replace(/[،.؛\s]+$/u,'').trim())];
   if(texts.every(t=>t.length>=4&&t.length<=180)&&new Set(texts.map(sanadKey)).size===texts.length){
    const ids=texts.map((_,i)=>'source:'+section.id+':'+i);
    ids.forEach((id,i)=>names[id]=texts[i]);
    paths.push(ids);
   }
  }
 }
 return {
  id:section.id,title:section.title,body:section.body,
  kind,qariId,rawi,branches:parts(section.body),
  paths,names,status:'source-text-review',
 };
}

export function allHistoricalSections(sections:readonly ContinuationSection[],kind:HistoricalSegmentKind,people:readonly BuilderPerson[]=[]){
 return QURRA.flatMap(q=>{
  const labels=kind==='rawi-imam'?q.rawis:[''];
  return labels.flatMap(rawi=>{
   const match=historicalSection(sections,q.id,rawi,kind,people);
   return match?[match]:[];
  });
 });
}
