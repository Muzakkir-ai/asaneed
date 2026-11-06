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
