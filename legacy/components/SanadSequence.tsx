import type {ReactNode} from 'react';
import SanadNodePresentation from './SanadNodePresentation';
import {sanadPresentation} from '../lib/sanadPresentation';

/** Shared straight connector and editor action slot. The action never creates an edge. */
export function SanadConnectorGap({connector,action}:{connector:'arrow'|'stem'|null;action?:ReactNode}){
 return <div className="sanad-graph-gap">
  {connector&&<span aria-hidden="true" className={connector==='arrow'?'sanad-graph-arrow':'sanad-graph-stem'}/>}
  {action!=null&&<div className="sanad-graph-action">{action}</div>}
 </div>;
}
/** An exact route is always displayed in the saved order, including repeated
 * occurrences when the graph cannot be safely combined. */
export default function SanadSequence({path,renderPerson,afterPerson,preview=false,label='مسار السند المختار',compact=false}:{path:string[];renderPerson:(id:string,positions:number[])=>ReactNode;afterPerson?:(id:string)=>ReactNode;preview?:boolean;label?:string;compact?:boolean}){
 const labels=sanadPresentation([path]);
 return <ol aria-label={label} className={compact?'mx-auto max-w-md':'min-w-0'}>
  {path.map((id,i)=><li key={i+':'+id} data-sanad-node={id}>
   <SanadNodePresentation labels={labels.get(id)?.filter(p=>p.position===i+1)||[]} preview={preview}>{renderPerson(id,[i+1])}</SanadNodePresentation>
   {(i<path.length-1||afterPerson)&&<SanadConnectorGap connector={i<path.length-1?'arrow':null} action={afterPerson?.(id)}/>}
  </li>)}
 </ol>;
}
