import type {ReactNode} from 'react';
import {arabicDigits} from '../lib/arabicDigits';
import type {PreparedGraph,PreparedGraphNode} from '../lib/preparedSanadGraph';
import SanadPathView from './SanadPathView';

export default function PreparedSanadGraph({graph,renderNode}:{graph:PreparedGraph;renderNode:(node:PreparedGraphNode,ordinal:number,labels:string[])=>ReactNode}){
 const entries=new Map(graph.nodes.map(node=>[node.id,node]));
 return <SanadPathView paths={graph.paths} renderPerson={(id,positions)=>renderNode(entries.get(id)!,positions[0],positions.map(arabicDigits))}/>;
}
