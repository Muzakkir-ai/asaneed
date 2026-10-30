import {builderNameKey,type BuilderLibrary,type BuilderPerson} from './bookBuilder';
export type ObservedLink={from:string;to:string;chainId:string};
/** Direction follows written order (reader -> teacher); no historical verification. */
export function observedLinks(lib:BuilderLibrary):ObservedLink[]{
 return lib.chains.filter(c=>!c.archived).flatMap(c=>{
  const author=lib.books.find(b=>b.id===c.book_id&&!b.archived)?.author_id;
  return c.branches.flatMap(branch=>{
   const ids=c.kind==='route'?[...(author?[author]:[]),...branch.map(n=>n.person_id)]:[...branch.map(n=>n.person_id),...(author?[author]:[])];
   return ids.slice(1).flatMap((to,i)=>ids[i]===to?[]:[{from:ids[i],to,chainId:c.id}]);
  });
 });
}
export const narratorSearchKey=(value:string)=>builderNameKey(value).replace(/^(?:الشيخ|الإمام|الامام)\s+/u,'').replace(/(^|\s)(?:ابو|ابي)(?=\s|$)/gu,'$1ابي');
export function rankNarrators(people:BuilderPerson[],query:string,links:ObservedLink[],previous?:string,next?:string){
 const key=narratorSearchKey(query);
 return people.filter(p=>!p.archived&&[p.name,p.display_name].some(n=>narratorSearchKey(n||'').includes(key))).map(person=>({person,observed:links.filter(l=>(l.from===previous&&l.to===person.id)||(l.from===person.id&&l.to===next))})).sort((a,b)=>Number(b.observed.length>0)-Number(a.observed.length>0)||a.person.name.localeCompare(b.person.name,'ar'));
}
/** Review hints only: shared name tokens never establish identity. */
export function possibleNarratorDuplicates(people:BuilderPerson[],query:string){
 const key=narratorSearchKey(query),tokens=key.split(' ').filter(t=>t.length>1);
 if(!key)return [];
 return people.filter(p=>!p.archived&&[p.name,p.display_name].some(n=>{const candidate=narratorSearchKey(n||'');const parts=candidate.split(' ');return candidate.includes(key)||key.includes(candidate)&&candidate.length>2||tokens.length>=2&&tokens.filter(t=>parts.includes(t)).length>=Math.max(2,Math.ceil(tokens.length*.6));}));
}
