import {QURRA} from './qurra';
import {sanadKey,type ContinuationSection} from './unifiedSanad';
import {fullRawiName} from './rawiIdentity';

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
 const names:Record<string,string>={};
 const paths:string[][]=[];
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
