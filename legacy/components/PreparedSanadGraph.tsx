import type {ReactNode} from 'react';
import {arabicDigits} from '../lib/arabicDigits';
import type {PreparedGraph,PreparedGraphNode} from '../lib/preparedSanadGraph';
import SanadPathView from './SanadPathView';

export default function PreparedSanadGraph({graph,renderNode,afterNode,extraPaths=[],renderExtraNode}:{graph:PreparedGraph;renderNode:(node:PreparedGraphNode,ordinal:number,labels:string[])=>ReactNode;afterNode?:(node:PreparedGraphNode)=>ReactNode;extraPaths?:string[][];renderExtraNode?:(id:string,positions:number[])=>ReactNode}){
 const entries=new Map(graph.nodes.map(node=>[node.id,node]));
 return <SanadPathView paths={[...graph.paths,...extraPaths]} renderPerson={(id,positions)=>{const entry=entries.get(id);return entry?renderNode(entry,positions[0],positions.map(arabicDigits)):renderExtraNode?.(id,positions);}} afterPerson={afterNode?id=>{const entry=entries.get(id);return entry?afterNode(entry):null;}:undefined}/>;
}
