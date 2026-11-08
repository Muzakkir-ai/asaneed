import {renderSanadSequence} from './branchedSanad';
import {contextualOnwardIds,type OnwardContext} from './verifiedOnwardSources';
import {preparedSanadText,prepareSavedSanadPeople} from './preparedSanadPeople';
import {preparedSanadGraph} from './preparedSanadGraph';
import type {BuilderPerson} from './bookBuilder';
import {sanadKey} from './unifiedSanad';

export type SharedBridgeSource={id:string;body:string;title?:string;kind?:'book'|'route'|'personal';shaykhId?:string;bookId?:string;parentId?:string;qariId?:string;rawi?:string};
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
 const parallel=/^(.*?)،\s*عن مشايخ؛\s*منهم (.+?)،\s*وهم على (.+?)$/u.exec(tail);
 const sourcePaths=sharedBridgePaths(tail)??(parallel&&!/\(ح\)|وقرأ|وأخذ/u.test(parallel[1])
  ?parallel[2].split(/،\s*و/u).map(teacher=>[...parallel[1].split(/،\s*عن\s+/u).map(name=>name.replace(/^عن\s+/u,'')),teacher,parallel[3]])
  :null);
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

/** A personal path must end at the reviewed junction and must not revisit a shared narrator. */
export function joinSharedBridgeRoutes(personalPaths:string[][],tails:{id:string}[][],meetingId:string){
 if(!personalPaths.length||!tails.length||personalPaths.some(path=>path.at(-1)!==meetingId))return null;
 const joined=personalPaths.flatMap(path=>tails.map(tail=>[...path,...tail.map(node=>node.id)]));
 return joined.every(path=>new Set(path).size===path.length)?joined:null;
}

/** Compose a saved personal sanad and its exact reviewed continuation for any viewer. */
export function savedSharedBridgeDiagram(source:string,ids:string[],bridges:ReviewedSharedBridge[],preparation?:ReturnType<typeof recoverSharedBridgePrefix>,issuer?:{id:string;name:string},continuationId?:string,context:OnwardContext={}){
 const separated=prepareSavedSanadPeople(source,true,'end');
 const personal=preparation?.reviewed&&preparedSanadText(preparation).trim()===source.trim()
  ?preparation:recoverSharedBridgePrefix(source,ids,bridges.map(bridge=>bridge.source))??(separated?.tokens.length===ids.length?separated:null);
 if(!personal||!ids.length||ids.length!==personal.tokens.length||ids.some(id=>!id))return null;
 const graph=preparedSanadGraph(personal,personal.tokens.map((token,i)=>({...token,personId:ids[i]})));
 if(!graph)return null;
 const meetingId=ids.at(-1)!;
 const tail=personal.suffix.replace(/^\s*،\s*/u,'').trim();
 const options=bridges.flatMap(bridge=>{
  const paths=tail?linkedBridgeTails(bridge,tail,meetingId):bridge.routes.flatMap(route=>{
   const index=route.findIndex(node=>node.id===meetingId);
   return index>=0&&index<route.length-1?[route.slice(index+1)]:[];
  });
  if(!paths?.length)return [];
  const unique=[...new Map(paths.map(path=>[JSON.stringify(path.map(node=>node.id)),path])).values()];
  const joined=joinSharedBridgeRoutes(graph.paths,unique,meetingId);
  return joined?[{id:bridge.source.id,paths:unique,joined}]:[];
 });
 const preferred=contextualOnwardIds(options.map(option=>option.id),bridges,context);
 const match=options.find(option=>option.id===(continuationId||(preferred.length===1?preferred[0]:undefined)));
 if(!match)return {options:options.map(option=>option.id),diagram:null};
 const {joined,paths}=match;
 const names=Object.fromEntries([...paths.flat(),...graph.nodes].map(node=>[node.id,node.name]));
 const issuerId=issuer?'shaykh:'+issuer.id:null;
 if(issuerId&&issuer)names[issuerId]=issuer.name;
 return {options:options.map(option=>option.id),diagram:{sourceId:match.id,names,paths:joined.map(path=>issuerId?[...path].reverse().concat(issuerId):[...path].reverse()),preparation:personal,personalText:preparedSanadText({...personal,suffix:''})}};
}

export type ReviewedSharedBridge=NonNullable<ReturnType<typeof reviewedSharedBridge>>;

/** Validate the stored prefix and preserve the exact reviewed transmission wording for issuance. */
export function composeReferencedPersonalSanad(text:string,ids:string[],bridges:ReviewedSharedBridge[],continuationId:string){
 const selected=bridges.filter(bridge=>bridge.source.id===continuationId);
 const resolved=savedSharedBridgeDiagram(text,ids,selected,undefined,undefined,continuationId)?.diagram;
 if(!resolved)throw Error('راجع الرواة ونقطة الالتقاء والتتمة المشتركة المختارة');
 const prepared=resolved.preparation;
 const linear=prepared.tokens.slice(1).every(token=>/^،\s*عن\s+$/u.test(token.before));
 const personal=linear?prepared.tokens[0].before+renderSanadSequence(prepared.tokens.map(token=>token.name)).replace(/^عن /u,''):resolved.personalText;
 if(prepared.suffix.replace(/^\s*،\s*/u,'').trim())return personal+prepared.suffix;
 const bridge=selected[0];
 const meeting=ids.at(-1)!;
 if(bridge.source.kind){
  const tails=new Map<string,string>();
  for(const route of bridge.routes){
   const index=route.findIndex(node=>node.id===meeting);
   if(index<0||index===route.length-1)continue;
   const tail=route.slice(index+1);
   tails.set(JSON.stringify(tail.map(node=>node.id)),renderSanadSequence(tail.map(node=>node.name)));
  }
  return [...tails.values()].map(tail=>personal+'، '+tail).join('\n\n(ح)\n\n');
 }
 const keys=new Set(bridge.routes.flatMap(route=>{
  const index=route.findIndex(node=>node.id===meeting);
  return index<0?[]:[JSON.stringify(route.slice(index+1).map(node=>node.id))];
 }));
 const source=bridge.source.body.trim();
 const tails=[source,...[...source.matchAll(/،\s*(?=عن\s)/gu)].map(boundary=>source.slice(boundary.index+boundary[0].length))];
 for(const tail of tails){
  const paths=linkedBridgeTails(bridge,tail,meeting);
  if(paths&&new Set(paths.map(path=>JSON.stringify(path.map(node=>node.id)))).size===keys.size){
   return personal+'، '+tail;
  }
 }
 throw Error('لا يوجد نص مشترك معتمد يطابق جميع مسارات نقطة الالتقاء');
}

/** A saved personal path is complete as an entry even when its onward path is unavailable. */
export function personalSanadEndsAtSavedNarrator(text:string,ids:string[]){
 const prepared=prepareSavedSanadPeople(text,true,'end');
 return !!prepared&&ids.length>0&&ids.length===prepared.tokens.length&&ids.every(Boolean)
  &&!!preparedSanadGraph(prepared,prepared.tokens.map((token,i)=>({...token,personId:ids[i]})));
}

export function automaticSharedBridgeId(text:string,ids:string[],bridges:ReviewedSharedBridge[],context:OnwardContext={}){
 if(!personalSanadEndsAtSavedNarrator(text,ids))return null;
 const options=contextualOnwardIds(savedSharedBridgeDiagram(text,ids,bridges)?.options??[],bridges,context);
 if(options.length!==1)return null;
 try{composeReferencedPersonalSanad(text,ids,bridges,options[0]);return options[0];}catch{return null;}
}
