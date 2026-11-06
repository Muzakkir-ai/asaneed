export type BuilderPerson={aliases?:{name:string;key:string}[];id:string;name:string;display_name:string;archived:boolean};
export type BuilderBook={artwork_number?:string;id:string;title:string;author_id:string;archived:boolean};
export type BuilderNode={person_id:string;route_source:boolean;source_level?:'upper'|'branch'|null};
export type BuilderChain={id:string;book_id:string;book_chain_id:string|null;route_code:string;kind:'book'|'route';title:string;qari_id:string;rawi:string;continuation:string;continuation_ids?:string[]|null;continuation_override?:boolean;confirmed:boolean;archived:boolean;revision:number;upper_route_name?:string;branch_route_name?:string;reading_scope?:'unspecified'|'sughra'|'kubra';branches:BuilderNode[][]};
export type QuranMeetingPerson={id:string;name:string;sources:string[]};
export type BuilderLibrary={reviewedPersonalGraphs?:import('./sharedBridge').ReviewedSharedBridge[];sharedBridgeGraphs?:NonNullable<ReturnType<typeof import('./sharedBridge').reviewedSharedBridge>>[];quranMeetingPeople?:QuranMeetingPerson[];canManage?:boolean;unificationReady?:boolean;people:BuilderPerson[];books:BuilderBook[];chains:BuilderChain[];suggestions:string[];continuations:Record<string,string>;continuationSections?:import('./unifiedSanad').ContinuationSection[];prefixContinuations?:import('./builderPrefix').BuilderPrefixContinuation[]};
export {sanadKey as builderNameKey} from './unifiedSanad';
import {sanadKey as builderNameKey,composeStructuredSanad} from './unifiedSanad';
export const builderPreview=composeStructuredSanad;

export const builderRouteName=(book:BuilderBook,route:BuilderChain)=>[book.title,route.upper_route_name,route.branch_route_name,route.title].filter((v,i,all)=>v&&all.indexOf(v)===i).join(' — ');

/** Compact UI labels only; full stored names remain unchanged for sanad/print. */
export function compactRouteBook(title:string){const book=title.split(/\s*[—–]\s*/u)[0].trim();const key=builderNameKey(book);return key.includes('الشاطبية')?'الشاطبية والتيسير':key.includes('الدرة')?'الدرة والتحبير':book;}
export function builderCompactRouteName(book:BuilderBook,route:BuilderChain,people:BuilderPerson[]){
 const title=compactRouteBook(book.title);if(route.reading_scope==='sughra')return title;
 const sources=[...new Set(route.branches.flatMap(b=>b.filter(n=>n.route_source).map(n=>people.find(p=>p.id===n.person_id)?.display_name.trim()||'')).filter(Boolean))];
 return title+(sources.length?' عن '+sources.join(' و'):'');
}

/** Preserve selected narrator identities when previewing unsaved route edits. */
export function builderDraftPreviewNodes(people:BuilderPerson[],draft:{name:string;personId?:string;source:boolean}[][]){
 const previewPeople=[...people];
 const branches=draft.map((branch,bi)=>branch.map((node,ni)=>{
  const saved=node.personId?people.find(p=>p.id===node.personId&&!p.archived):undefined;
  if(saved)return {person_id:saved.id,route_source:node.source};
  // Freely typed matching names are not proof of shared identity.
  const id=`draft-${bi}-${ni}`;
  previewPeople.push({id,name:node.name,display_name:'',archived:false});
  return {person_id:id,route_source:node.source};
 }));
 return {people:previewPeople,branches};
}

/** Infer a new-route default only when existing book classification is unambiguous. */
export function builderBookScope(book:BuilderBook|undefined,chains:BuilderChain[]):'unspecified'|'sughra'|'kubra'{
 if(!book)return 'unspecified';
 const scopes=[...new Set(chains.filter(c=>c.book_id===book.id&&!c.archived).map(c=>c.reading_scope).filter((s):s is 'sughra'|'kubra'=>s==='sughra'||s==='kubra'))];
 if(scopes.length===1)return scopes[0];
 if(scopes.length>1)return 'unspecified';
 const title=compactRouteBook(book.title);
 return title==='الشاطبية والتيسير'||title==='الدرة والتحبير'?'sughra':'unspecified';
}
export function builderParentSelection(parents:Pick<BuilderChain,'id'>[],current:string){return parents.some(p=>p.id===current)?current:parents.length===1?parents[0].id:'';}
