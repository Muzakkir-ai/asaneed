import {QURRA} from './qurra';
import {sanadKey,type ContinuationSection} from './unifiedSanad';
import {fullRawiName} from './rawiIdentity';
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
 const index=kind==='imam-sahaba'?imamCompanionIndexedGraph(section,qariId):null;
 const names:Record<string,string>=index?.names||{};
 const paths:string[][]=index?.paths||[];
 // The only auto-drawn historical edges are an explicitly written,
 // unbranched sequence AFTER «صاحب الرواية» and «عن», ending in
 // «صاحب القراءة». Branches and plural pronouns need human review.
 if(kind==='rawi-imam'){
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

export function allHistoricalSections(sections:readonly ContinuationSection[],kind:HistoricalSegmentKind){
 return QURRA.flatMap(q=>{
  const labels=kind==='rawi-imam'?q.rawis:[''];
  return labels.flatMap(rawi=>{
   const match=historicalSection(sections,q.id,rawi,kind);
   return match?[match]:[];
  });
 });
}
