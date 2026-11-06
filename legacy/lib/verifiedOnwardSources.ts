import type {BuilderLibrary} from './bookBuilder';
import {sanadKey} from './unifiedSanad';
import type {ReviewedSharedBridge} from './sharedBridge';

export type OnwardContext={qariId?:string;rawi?:string;routeId?:string;shaykhId?:string};

/** Each path belongs to one confirmed book or route. Never walk a union of its edges. */
export function verifiedOnwardSources(library:BuilderLibrary,context:OnwardContext={}):ReviewedSharedBridge[]{
 const shared=library.sharedBridgeGraphs??[];
 const active=new Map(library.people.filter(person=>!person.archived).map(person=>[person.id,person.name]));
 const terminalIds=[...new Set(shared.flatMap(source=>source.routes.map(path=>path.at(-1)?.id).filter(Boolean)))];
 const root={id:terminalIds.length===1?terminalIds[0]!:'@ibn-al-jazari',name:'الإمام ابن الجزري'};
 const books=new Map(library.books.filter(book=>!book.archived).map(book=>[book.id,book]));
 const routes=library.chains.filter(chain=>chain.kind==='route'&&chain.confirmed&&!chain.archived);
 const indexed:ReviewedSharedBridge[]=[];
 for(const parent of library.chains){
  const book=books.get(parent.book_id);
  if(parent.kind!=='book'||parent.archived||!book||!active.has(book.author_id))continue;
  const children=routes.filter(route=>route.book_chain_id===parent.id&&route.book_id===book.id);
  if(!parent.confirmed&&!children.length)continue;
  const parentPaths=parent.branches.map(branch=>{
   const ids=branch.map(node=>node.person_id);
   if(ids.at(-1)!==book.author_id)ids.push(book.author_id);
   return ids.reverse();
  });
  const add=(id:string,title:string,paths:string[][],route?:typeof parent)=>{
   const valid=paths.filter(path=>path.every(personId=>active.has(personId))
    &&new Set(path).size===path.length&&!path.slice(0,-1).includes(root.id));
   if(valid.length!==paths.length||!valid.length)return;
   indexed.push({source:{id,body:'',title,kind:route?'route':'book',bookId:book.id,parentId:parent.id,qariId:route?.qari_id,rawi:route?.rawi},
    routes:valid.map(path=>[...path.map(id=>({id,name:active.get(id)!})),...(path.at(-1)===root.id?[]:[root])]),unresolved:[]});
  };
  add(parent.id,book.title+' — '+parent.title,parentPaths);
  for(const route of children){
   if(context.routeId&&route.id!==context.routeId)continue;
   if(context.qariId&&route.qari_id!==context.qariId)continue;
   if(context.rawi&&sanadKey(route.rawi)!==sanadKey(context.rawi))continue;
   const paths=route.branches.flatMap(branch=>{
    const ids=branch.map(node=>node.person_id).reverse();
    if(ids.at(-1)===book.author_id)ids.pop();
    return parentPaths.map(parentPath=>[...ids,...parentPath]);
   });
   add(route.id,book.title+' — '+route.title,paths,route);
  }
 }
 const personal=(library.reviewedPersonalGraphs??[]).filter(graph=>graph.source.shaykhId===context.shaykhId
  &&(!context.qariId||graph.source.qariId===context.qariId)
  &&(!context.rawi||sanadKey(graph.source.rawi??'')===sanadKey(context.rawi)));
 return [...shared,...indexed,...personal];
}

/** An explicit route is strongest. Matching riwayah routes outrank general sources. */
export function contextualOnwardIds(options:string[],sources:ReviewedSharedBridge[],context:OnwardContext){
 if(context.routeId&&options.includes(context.routeId))return [context.routeId];
 const matching=context.qariId&&context.rawi?options.filter(id=>{
  const source=sources.find(item=>item.source.id===id)?.source;
  return source?.kind==='route'&&source.qariId===context.qariId&&sanadKey(source.rawi??'')===sanadKey(context.rawi!);
 }):[];
 return matching.length?matching:options;
}
