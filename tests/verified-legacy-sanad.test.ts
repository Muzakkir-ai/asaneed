import assert from 'node:assert/strict';
import {combinedSanad} from '../legacy/lib/combinedSanad';
import {verifiedLegacySanad} from '../legacy/lib/verifiedLegacySanad';
import type {ReviewedSharedBridge} from '../legacy/lib/sharedBridge';

const people=['root','a','b','junction','c','d','end'].map(id=>({id,name:id,display_name:'',archived:false}));
people[0].display_name='رَاوٍ';
const paths=[['root','a','junction','c','end'],['root','b','junction','d','end']];
const sources:ReviewedSharedBridge[]=paths.map((path,i)=>({
 source:{id:String(i),body:'',title:'Source '+i},unresolved:[],
 routes:[[...path].reverse().map(id=>({id,name:id}))],
}));
assert.deepEqual(verifiedLegacySanad(['راو','a','junction','c','end'],people,sources)?.ids,paths[0]);
assert.equal(verifiedLegacySanad(['root','a','junction','d','end'],people,sources),null);
assert.equal(verifiedLegacySanad(['root','unknown'],people,sources),null);
const ambiguousPeople=[...people,{id:'other',name:'a',display_name:'',archived:false}];
const ambiguousSources=[...sources,{...sources[0],routes:[sources[0].routes[0].map(node=>node.id==='a'?{id:'other',name:'a'}:node)]}];
assert.equal(verifiedLegacySanad(paths[0],ambiguousPeople,ambiguousSources),null);
const graph=combinedSanad(paths)!;
assert.equal(graph.rows.flat().length,new Set(paths.flat()).size);
for(const [i,path] of paths.entries()){
 assert.deepEqual(graph.edges.filter(edge=>edge.routes.includes(i)).map(edge=>[edge.from,edge.to]),path.slice(1).map((id,j)=>[path[j],id]));
}
assert.equal(combinedSanad([['a','b'],['b','a']]),null);
