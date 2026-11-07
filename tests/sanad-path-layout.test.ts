import {placeSanad} from '../legacy/lib/sanadPlacement';
import {optimizeSanadPorts,routeSanadConnectors} from '../legacy/lib/sanadConnectorRouting';
import assert from 'node:assert/strict';
import {sanadPathLayout,sanadPositions} from '../legacy/lib/sanadPathLayout';
const paths=[['j','a','s','q','i'],['j','b','s','m','i']];
const before=JSON.stringify(paths),blocks=sanadPathLayout(paths)!;
assert.deepEqual(blocks.map(b=>b.kind),['person','split','person','split','person']);
assert.deepEqual(blocks.filter(b=>b.kind==='person').map(b=>b.id),['j','s','i']);
assert.equal(JSON.stringify(paths),before);
assert.equal(sanadPathLayout([['j','a','b'],['j','b','a']]),null);
assert.deepEqual(sanadPathLayout([['j','a'],['j','a']]),[{kind:'person',id:'j'},{kind:'person',id:'a'}]);
assert.equal(sanadPathLayout([['j','a','j']]),null);
console.log('Repeated split/join layout, identity and unsafe topology tests passed');

assert.equal(sanadPathLayout(paths,true),null,'paired split choices cannot imply two additional routes');
const independent=[...paths,['j','a','s','m','i'],['j','b','s','q','i']];
assert.ok(sanadPathLayout(independent,true),'a complete set of choices can use two shared junctions');
const unequal=[['j','a','i'],['j','b','c','i']];
assert.ok(sanadPathLayout(unequal,true));
assert.deepEqual(sanadPositions(unequal,'i'),[3,4]);
assert.deepEqual(sanadPositions([unequal[1]],'i'),[4]);

const reconvergingPaths=[
 ['root','shared','tail'],
 ['root','a','shared','tail'],
 ['root','b','shared','tail'],
 ['root','a','c','shared','tail'],
 ['root','b','d','e','shared','tail'],
];
assert.deepEqual(sanadPositions(reconvergingPaths,'root'),[1]);
assert.deepEqual(sanadPositions(reconvergingPaths,'shared'),[2,3,4,5]);
assert.deepEqual(sanadPositions(reconvergingPaths,'tail'),[3,4,5,6]);

import './verified-legacy-sanad.test';

const placementRows=[['root'],['a','b'],['d','c'],['end']];
const placementEdges=[{from:'root',to:'a'},{from:'root',to:'b'},{from:'a',to:'c'},{from:'b',to:'d'},{from:'c',to:'end'},{from:'d',to:'end'}];
const placement=placeSanad(placementRows,placementEdges,496,224);
assert.equal(placement.get('a'),placement.get('c'));
assert.equal(placement.get('b'),placement.get('d'));
assert.equal(placement.get('end'),248);
const routed=routeSanadConnectors([['root'],['child']],new Map([['root',{x:100}],['child',{x:140}]]),[{from:'root',to:'child',x1:100,x2:140}],300,192,80,false,new Map([['root',180],['child',60]]));
assert.match(routed.connectors[0].d,/^M100 180 V190 H140 V227$/);

const portRows=[['jazari'],['uqabi','umyuti','nuwayri']];
const portCenters=new Map([['jazari',{x:350}],['uqabi',{x:126}],['umyuti',{x:350}],['nuwayri',{x:574}]]);
const testPorts=portRows[1].map(to=>({from:'jazari',to,x1:350,x2:portCenters.get(to)!.x}));
const routedPorts=optimizeSanadPorts(portRows,portCenters,testPorts,700,192,80,new Map()).connectors;
assert.equal(new Set(routedPorts.map(x=>x.x1)).size,3);
assert.equal(routedPorts[1].x1,350);
assert.equal(routedPorts[1].x2,350);
assert.ok(routedPorts[0].x1<350&&routedPorts[2].x1>350);
