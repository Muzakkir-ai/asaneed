import {QURRA} from './qurra';
import {builderNameKey} from './bookBuilder';
import {standardRouteSources} from './standardRouteSources';
import {sanadTitleRanges} from './sanadTitleRanges';
export type ImportSection={id:string;title:string;body:string};
export type PlannedRoute={qariId:string;rawi:string;title:string;branches:string[][];continuation:string;sources:string[];sourceIds:string[]};
export type PlannedBook={title:string;author:string;parent:string[];routes:PlannedRoute[]};
const stripEnd=(s:string)=>s.trim().replace(/[،.\s]+$/u,'');
/** Parse only an explicit linear list, refusing plural/branch prose in a person name. */
function linear(text:string):string[]{
 return stripEnd(text).split(/،\s*/u).filter(Boolean).map(clause=>{
  if(!/^عن\s+/u.test(clause))throw Error('Nonlinear source requires explicit branch handling');
  const name=clause.replace(/^عن\s+/u,'').trim();
  if(!name||name.length>250||/[.؛\n()]|وهما|وقرأ|أيضًا|صاحب الرواية|صَاحِبِ/u.test(name))throw Error('Ambiguous narrator clause');
  return name;
 });
}
export function planSughraImport(sections:ImportSection[]):PlannedBook[]{
 const get=(title:string)=>{const matches=sections.filter(s=>s.title===title&&s.body.trim());if(matches.length!==1)throw Error('Missing or ambiguous source: '+title);return matches[0];};
 const common=get('من الإمام ابن الجزري إلى الإمام الداني — القراء السبعة');
 const commonNames=linear(common.body),authorIndex=commonNames.findIndex(n=>builderNameKey(n).includes('الشاطبي'));
 if(authorIndex<1||authorIndex>=commonNames.length-1)throw Error('Shatibi boundary missing');
 const bridge=get('من إبراهيم العُبيدي إلى ابن الجزري — فرعا السند');
 const jazari=bridge.body.match(/إِمَامِ المُقرِئِينَ[^،]+الجَزَرِيِّ/u)?.[0];
 if(!jazari)throw Error('Explicit Ibn al-Jazari author name missing');
 const books:PlannedBook[]=[{title:'الشاطبية',author:commonNames[authorIndex],parent:commonNames.slice(0,authorIndex),routes:[]},{title:'الدرة',author:jazari,parent:[],routes:[]}];
 for(const q of QURRA)for(const rawi of q.rawis){
  const source=get(`CHAIN:${q.id}:${rawi}`),sahaba=get(`CHAIN:${q.id}:sahaba`),prophet=get(`CHAIN:${q.id}:prophet`);
  const range=sanadTitleRanges(source.body)[0];if(!range)throw Error('Rawi boundary missing: '+source.title);
  let before=source.body.slice(0,range.start).replace(/(?:عن|على)\s*$/u,'').trim();
  let branches:string[][];
  if(q.id==='khalaf'&&rawi==='إسحاق'){
   const match=before.match(/^عن ([^،]+)، و([^،]+)، وهما قرءا على ([^،]+)،([\s\S]*)$/u);
   if(!match)throw Error('Ishaq branch syntax changed');
   const rest=linear(match[4]);branches=[[match[1].trim(),match[3].trim(),...rest],[match[2].trim(),match[3].trim(),...rest]];
  }else if(q.id==='khalaf'&&rawi==='إدريس'){
   const split=before.split(/\s*\(ح\)\. وقرأ سبط الخياط أيضًا على\s*/u);if(split.length!==2)throw Error('Idris branch syntax changed');
   const first=linear(split[0]),junction=first.findIndex(n=>builderNameKey(n).includes('سبط الخياط'));
   const second=split[1].split(/، وقرأ /u);if(junction<0||second.length!==2)throw Error('Idris reunion missing');
   const secondNames=linear('عن '+second[0]);
   branches=[first,[...first.slice(0,junction+1),...secondNames]];
  }else branches=[linear(before)];
  const seven=q.family==='seven';
  if(seven)branches=branches.map(b=>[...commonNames.slice(authorIndex+1),...b]);
  const continuation=['عن '+source.body.slice(range.start).trim(),sahaba.body,prophet.body].join('، ');
  const sources=standardRouteSources(q.id,rawi);
  for(const role of sources)if(!branches.some(b=>b.some(n=>builderNameKey(n)===builderNameKey(role))))throw Error('Source role absent: '+source.title+' / '+role);
  books[seven?0:1].routes.push({qariId:q.id,rawi,title:rawi+' — '+q.reading,branches,continuation,sources,sourceIds:[...(seven?[common.id]:[]),source.id,sahaba.id,prophet.id]});
 }
 if(books[0].routes.length!==14||books[1].routes.length!==6)throw Error('Expected 14 + 6 riwayat');
 return books;
}
