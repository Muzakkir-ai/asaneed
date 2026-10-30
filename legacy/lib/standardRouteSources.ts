import sources from './standardRouteSources.json';
import {QURRA} from './qurra';

/** User-reviewed display roles, never a replacement for the preserved chain. */
export function standardRouteSources(qariId:string,rawi?:string):string[]{
 const entries=(sources as Record<string,Record<string,string[]>>)[qariId];
 if(!entries)return [];
 const keys=rawi?[rawi]:QURRA.find(q=>q.id===qariId)?.rawis||[];
 return [...new Set(keys.flatMap(key=>entries[key]||entries[key==='أبو الحارث'?'أبو الحارث':key]||[]))];
}
