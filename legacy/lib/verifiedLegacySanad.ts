import type {BuilderPerson} from './bookBuilder';
import type {ReviewedSharedBridge} from './sharedBridge';
import {sanadKey} from './unifiedSanad';

/** Resolve an explicitly parsed legacy path only against a complete verified witness.
 * Matching isolated edges could combine different transmission contexts.
 */
export function verifiedLegacySanad(names:string[],people:BuilderPerson[],sources:ReviewedSharedBridge[]){
 const active=new Set(people.filter(person=>!person.archived).map(person=>person.id));
 const aliases=new Map<string,Set<string>>();
 for(const person of people){
  if(person.archived)continue;
  for(const name of [person.name,person.display_name,...(person.aliases??[]).map(alias=>alias.name)]){
   const key=sanadKey(name);
   if(!key)continue;
   const ids=aliases.get(key)??new Set<string>();
   ids.add(person.id);
   aliases.set(key,ids);
  }
 }
 const keys=names.map(sanadKey);
 if(!keys.length||keys.some(key=>!key))return null;
 const witnesses=sources.flatMap(({source,routes})=>routes.flatMap(route=>{
  const path=route.slice(-names.length).reverse();
  return path.length===names.length&&new Set(path.map(node=>node.id)).size===path.length
   &&path.every((node,i)=>active.has(node.id)&&(aliases.get(keys[i])?.has(node.id)||sanadKey(node.name)===keys[i]))
   ?[{ids:path.map(node=>node.id),source}]:[];
 }));
 const first=witnesses[0];
 if(!first||witnesses.some(witness=>JSON.stringify(witness.ids)!==JSON.stringify(first.ids)))return null;
 return {ids:first.ids,sources:[...new Map(witnesses.map(witness=>[witness.source.id,witness.source])).values()]};
}
