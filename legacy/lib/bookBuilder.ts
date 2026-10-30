import {reachesJunction} from './personalSanadValidation';
export type BuilderPerson={id:string;name:string;display_name:string;archived:boolean};
export type BuilderBook={id:string;title:string;author_id:string;archived:boolean};
export type BuilderNode={person_id:string;route_source:boolean;source_level?:'upper'|'branch'|null};
export type BuilderChain={id:string;book_id:string;book_chain_id:string|null;route_code:string;kind:'book'|'route';title:string;qari_id:string;rawi:string;continuation:string;confirmed:boolean;archived:boolean;revision:number;upper_route_name?:string;branch_route_name?:string;reading_scope?:'unspecified'|'sughra'|'kubra';branches:BuilderNode[][]};
export type BuilderLibrary={people:BuilderPerson[];books:BuilderBook[];chains:BuilderChain[];suggestions:string[];continuations:Record<string,string>;prefixContinuations?:import('./builderPrefix').BuilderPrefixContinuation[]};
export const builderNameKey=(s:string)=>s.normalize('NFKC').replace(/[\u064b-\u065f\u0670\u0640\u06d6-\u06ed]/gu,'').replace(/[أإآٱ]/gu,'ا').replace(/ى/gu,'ي').replace(/\s+/gu,' ').trim();
export function builderPreview(book:BuilderBook,parent:BuilderChain,route:BuilderChain,people:BuilderPerson[],prefix=''){
 const person=(id:string)=>{const p=people.find(p=>p.id===id);if(!p?.name.trim())throw Error('أكمل اسم الراوي');return p.name;};
 const author=person(book.author_id);
 const segments:string[]=[];
 for(const a of parent.branches)for(const b of route.branches){
  const ids=[...a.map(n=>n.person_id),book.author_id,...b.map(n=>n.person_id)];
  const adjacent=ids.filter((id,i)=>!i||id!==ids[i-1]);
  // al-Durrah's author is the junction itself; the personal prefix already includes him.
  if(adjacent[0]===book.author_id&&/محمد بن محمد.*الجزري/u.test(builderNameKey(author))&&reachesJunction({personalChain:prefix,junction:'jazari'}))adjacent.shift();
  segments.push([prefix.trim().replace(/[،.\s]+$/u,''),adjacent.map(id=>'عن '+person(id)).join('، '),route.continuation.trim()].filter(Boolean).join('، '));
 }
 return {text:segments.join('\n\n(ح)\n\n'),author,sources:[...new Set(route.branches.flatMap(b=>b.filter(n=>n.route_source).map(n=>person(n.person_id))))]};
}

export const builderRouteName=(book:BuilderBook,route:BuilderChain)=>[book.title,route.upper_route_name,route.branch_route_name,route.title].filter((v,i,all)=>v&&all.indexOf(v)===i).join(' — ');
