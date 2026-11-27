import {sanadKey,type ContinuationSection} from './unifiedSanad';
import type {BuilderPerson,BuilderChain} from './bookBuilder';
import {QURRA} from './qurra';

/** Resolve names only from explicit role clauses in the preserved source.
 * A name link is not an approval of a transmission edge. */
export function sourceRoleName(body:string,role:'rawi'|'qari'):string{
 const marker=role==='rawi'?'صاحب الرواية':'صاحب القراءة';
 const text=sanadKey(body);
 const end=text.indexOf(marker);
 if(end<0||text.indexOf(marker,end+marker.length)>=0)return '';
 const clause=text.slice(text.lastIndexOf('،',end)+1,end);
 const relation=clause.match(/^.*?(?:عن |علي )/u);
 if(!relation)return '';
 return clause.slice(relation[0].length).trim().replace(/^(?:الامام\s+|امام (?:المدينة|البصرة|الكوفة|مكة)\s*(?:-زادها الله شرفا-\s*)?)/u,'').trim();
}
function exactPerson(people:readonly BuilderPerson[],key:string){
 if(!key)return undefined;
 const hits=people.filter(p=>!p.archived&&[p.name,...(p.aliases||[]).map(a=>a.name)].some(n=>sanadKey(n)===key));
 return hits.length===1?hits[0]:undefined;
}
export type ReadingIdentityLink={sourceSectionId:string;rawiPersonId:string;qariPersonId:string;rawiName:string;qariName:string};
export function readingIdentityLink(sections:readonly ContinuationSection[],people:readonly BuilderPerson[],qariId:string,rawi:string):ReadingIdentityLink|undefined{
 const catalog=QURRA.find(q=>q.id===qariId);
 if(!catalog||!catalog.rawis.some(r=>sanadKey(r)===sanadKey(rawi)))return undefined;
 const matching=sections.filter(s=>sanadKey(s.title)===sanadKey('CHAIN:'+qariId+':'+rawi)&&s.body.trim());
 if(matching.length!==1)return undefined;
 const source=matching[0],rp=exactPerson(people,sourceRoleName(source.body,'rawi')),qp=exactPerson(people,sourceRoleName(source.body,'qari'));
 if(!rp||!qp||rp.id===qp.id)return undefined;
 return {sourceSectionId:source.id,rawiPersonId:rp.id,qariPersonId:qp.id,rawiName:rp.name,qariName:qp.name};
}
export function qariIdentity(sections:readonly ContinuationSection[],people:readonly BuilderPerson[],qariId:string){
 const q=QURRA.find(q=>q.id===qariId);
 if(!q)return undefined;
 const links=q.rawis.map(r=>readingIdentityLink(sections,people,qariId,r));
 if(links.some(l=>!l)||new Set(links.map(l=>l?.qariPersonId)).size!==1)return undefined;
 return people.find(p=>!p.archived&&p.id===links[0]?.qariPersonId);
}
export function routeIdentityLinks(chains:readonly BuilderChain[],sections:readonly ContinuationSection[],people:readonly BuilderPerson[]){
 return Object.fromEntries(chains.filter(c=>c.kind==='route'&&!c.archived).flatMap(c=>{
  const link=readingIdentityLink(sections,people,c.qari_id,c.rawi);
  return link?[[c.id,link] as const]:[];
 }));
}
/** Relabel existing graph IDs bijectively: no new edges, paths or joins.
 * Refuse a mapping that collapses two independently indexed identities. */
export function linkExistingGraph(paths:readonly string[][],names:Record<string,string>,mapping:Record<string,{id:string;name:string}>){
 const used=[...new Set(paths.flat())],next=used.map(id=>mapping[id]?.id||id);
 if(new Set(next).size!==used.length)return {paths:paths.map(p=>[...p]),names:{...names},linked:false};
 return {paths:paths.map(p=>p.map(id=>mapping[id]?.id||id)),names:{...names,...Object.fromEntries(used.filter(id=>mapping[id]).map(id=>[mapping[id].id,mapping[id].name]))},linked:true};
}
