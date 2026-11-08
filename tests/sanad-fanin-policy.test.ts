import assert from 'node:assert/strict';
import {canShareSanadFanIn} from '../legacy/lib/sanadCoordinatedRouting';

const siblings=[['root'],['a','b'],['child']];
const edges=[{from:'root',to:'a'},{from:'root',to:'b'},{from:'a',to:'child'},{from:'b',to:'child'}];
const near=new Map([['a',{x:200}],['b',{x:465}]]);
const far=new Map([['a',{x:200}],['b',{x:850}]]);
assert.equal(canShareSanadFanIn(['a','b'],siblings,edges,near,228),true,
 'two close teachers with one immediate parent may share a bus');
assert.equal(canShareSanadFanIn(['a','b'],siblings,edges,far,228),false,
 'same teacher is not sufficient when narrator cards are far apart');
assert.equal(canShareSanadFanIn(['a','b'],[['root'],['a','middle','b'],['child']],edges,near,228),false,
 'intervening narrator in the same rank blocks a forced merge');
assert.equal(canShareSanadFanIn(['a','b'],[['rootA','rootB'],['a','b'],['child']],
 [{from:'rootA',to:'a'},{from:'rootB',to:'b'},...edges.slice(2)],near,228),false,
 'different direct shuyukh require separate incoming lines');
assert.equal(canShareSanadFanIn(['a','b'],[['a','b'],['child']],edges,near,228),false,
 'top-row teachers without known upstream links must not be assumed related');
assert.equal(canShareSanadFanIn(['root','a'],siblings,edges,near,228),false,
 'cross-rank source teachers always need distinct arrows');
assert.equal(canShareSanadFanIn(['a','b'],siblings,edges,new Map([['a',{x:200}]]),228),false,
 'missing measured positions must never trigger a speculative merge');
console.log('PASS conditional fan-in: sibling, rank, proximity and genuine upstream relationships');
