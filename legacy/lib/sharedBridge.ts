import {prepareSavedSanadPeople} from './preparedSanadPeople';
import {preparedSanadGraph} from './preparedSanadGraph';
import type {BuilderPerson} from './bookBuilder';
import {sanadKey} from './unifiedSanad';

export type SharedBridgeSource={id:string;body:string};
export type SharedBridgeReview={version:1;sourceBody:string;identities:{name:string;personId:string;evidence:string}[]};

/** Parse the explicit shared source grammar, preserving the source spelling of each narrator. */
export function sharedBridgePaths(source:string){
 const match=/^(.*?)\s*\(ح\)\.\s*وقرأ (.+?) أيضًا على (.+?)،\s*عن مشايخ؛\s*منهم (.+?)،\s*وهم على (.+?)\s*$/u.exec(source.trim());
 if(!match)return null;
 const [,first,origin,second,teachers,end]=match;
 const names=(text:string)=>text.split(/،\s*عن\s+/u).map(name=>name.replace(/^عن\s+/u,'').trim());
 const main=names(first),rest=names(second),parallel=teachers.split(/،\s*و/u);
 const pivots=main.flatMap((name,i)=>sanadKey(name)===sanadKey(origin)?[i]:[]);
 if(pivots.length!==1||parallel.length<2)return null;
 const routes=[[...main,end],...parallel.map(teacher=>[...main.slice(0,pivots[0]+1),...rest,teacher,end])];
 return routes.every(route=>route.every(name=>name.length>=2&&name.length<=250&&!/[،؛.()\n]/u.test(name)))?routes:null;
}

export function linkSharedBridge(source:SharedBridgeSource,people:BuilderPerson[]){
 const paths=sharedBridgePaths(source.body);
 if(!paths)return null;
 const registry=new Map<string,Set<string>>();
 for(const person of people){
  if(person.archived)continue;
  for(const name of [person.name,person.display_name,...(person.aliases??[]).map(alias=>alias.name)]){
   const key=sanadKey(name||'');
   if(!key)continue;
   const ids=registry.get(key)??new Set<string>();
   ids.add(person.id);
   registry.set(key,ids);
  }
 }
 const names=[...new Set(paths.flat())];
 const unresolved=names.flatMap(name=>{
  const ids=[...(registry.get(sanadKey(name))??[])];
  return ids.length===1?[]:[{name,ids}];
 });
 const routes=unresolved.length?null:paths.map(path=>path.map(name=>({name,id:[...registry.get(sanadKey(name))!][0]})));
 return {source,routes,unresolved};
}

/** Resolve only whole-source suffixes beginning at a transmission boundary. */
export function matchesSharedBridgeSuffix(source:string,tail:string){
 const body=source.trim();
 return body===tail||[...body.matchAll(/،\s*(?=عن\s)/gu)].some(match=>body.slice(match.index+match[0].length)===tail);
}

/** Recover the saved personal graph only at an exact, published continuation boundary. */
export function recoverSharedBridgePrefix(source:string,ids:string[],bridges:SharedBridgeSource[]){
 if(!ids.length||ids.some(id=>!id))return null;
 const text=source.trim();
 for(const match of text.matchAll(/،\s*(?=عن\s)/gu)){
  const tail=text.slice(match.index+match[0].length);
  if(!bridges.some(bridge=>matchesSharedBridgeSuffix(bridge.body,tail)))continue;
  const head=prepareSavedSanadPeople(text.slice(0,match.index),true,'end');
  if(head?.tokens.length!==ids.length)continue;
  const graph=preparedSanadGraph(head,head.tokens.map((token,i)=>({...token,personId:ids[i]})));
  if(graph)return {...head,suffix:text.slice(match.index)};
 }
 return null;
}

/** Join only paths whose first teacher follows the saved meeting identity. */
export function linkedBridgeTails(bridge:NonNullable<ReturnType<typeof linkSharedBridge>>,tail:string,meetingId:string){
 if(!bridge.routes||!matchesSharedBridgeSuffix(bridge.source.body,tail))return null;
 const sourcePaths=sharedBridgePaths(tail);
 if(!sourcePaths)return null;
 const paths=sourcePaths.map(path=>{
  for(const route of bridge.routes!){
   const junction=route.findIndex(node=>node.id===meetingId);
   if(junction<0)continue;
   const rest=route.slice(junction+1);
   if(rest.length===path.length&&rest.every((node,i)=>sanadKey(node.name)===sanadKey(path[i])))return rest;
  }
  return null;
 });
 return paths.every(path=>path!==null)?paths:null;
}

/** A persisted review is bound to the exact source. Ignore stale and incomplete reviews. */
export function reviewedSharedBridge(source:SharedBridgeSource,review:unknown,people:BuilderPerson[]){
 if(!review||typeof review!=='object')return null;
 const candidate=review as Partial<SharedBridgeReview>;
 if(candidate.version!==1||candidate.sourceBody!==source.body||!Array.isArray(candidate.identities))return null;
 const paths=sharedBridgePaths(source.body);
 if(!paths)return null;
 const active=new Set(people.filter(person=>!person.archived).map(person=>person.id));
 const names=new Set(paths.flat());
 const ids=new Map<string,string>();
 for(const entry of candidate.identities){
  if(!entry||!names.has(entry.name)||ids.has(entry.name)||!active.has(entry.personId)||typeof entry.evidence!=='string'||!entry.evidence.trim())return null;
  ids.set(entry.name,entry.personId);
 }
 if(ids.size!==names.size)return null;
 const routes=paths.map(path=>path.map(name=>({name,id:ids.get(name)!})));
 if(routes.some(path=>new Set(path.map(node=>node.id)).size!==path.length))return null;
 return {source,routes,unresolved:[]};
}
