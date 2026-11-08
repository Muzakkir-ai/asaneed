import {placeSanad} from '../legacy/lib/sanadPlacement';
import {optimizeSanadPorts,routeSanadConnectors} from '../legacy/lib/sanadConnectorRouting';
import assert from 'node:assert/strict';
import {buildQurraTransmissionData} from '../legacy/lib/qurraTransmissionData';
import type {BuilderLibrary,BuilderChain} from '../legacy/lib/bookBuilder';
import {sanadPathLayout,sanadPositions} from '../legacy/lib/sanadPathLayout';
import {groupSimilarSanadRoutes} from '../legacy/lib/sanadRouteGrouping';
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


// Similar alternate narrators between the same teacher and student count as
// one DISPLAYED masar, even when the actual saved branches are distinct.
const jazariStudentVariants=[
 ['jazari','uqabi','samdasi','shaykh','end'],
 ['jazari','nuwayri','samdasi','shaykh','end'],
 ['jazari','umyuti','samdasi','shaykh','end'],
];
assert.deepEqual(groupSimilarSanadRoutes(jazariStudentVariants),[[0,1,2]],
 'different Jazari students sharing a successor are displayed as one group');
assert.deepEqual(groupSimilarSanadRoutes([
 ['jazari','nuwayri','umyuti','samdasi','end'],
 ['jazari','umyuti','samdasi','end'],
]),[[0,1]],'an additional narrator within a short parallel segment is also grouped');
assert.deepEqual(groupSimilarSanadRoutes([
 ['j','a','b','m','end'],['j','x','b','m','end'],
 ['j','x','y','z','end'],
]),[[0,1],[2]],'pairwise grouping must not transitively hide a larger change');
assert.deepEqual(groupSimilarSanadRoutes([
 ['jazari','student1','teacher','end'],
 ['jazari','student2','differentTeacher','differentEnd'],
]),[[0],[1]],'different terminal identities remain separate');
assert.deepEqual(groupSimilarSanadRoutes([
 ['jazari','a','b','c','end'],
 ['jazari','x','b','y','end'],
]),[[0],[1]],'two disjoint changes are not treated as one local narrator alternative');
assert.deepEqual(groupSimilarSanadRoutes([['j','a','end'],['j','a','end']]),[[0,1]],
 'identical saved paths share a display group but remain distinct source paths');
assert.deepEqual(groupSimilarSanadRoutes([]),[],'empty sanads have no display groups');
console.log('Near-identical sanad grouping preserves every original route identity');

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


// A standalone Qurra diagram joins only identities from explicit book-parent
// and riwayah branch records. Unreviewed book segments are flagged; no
// implied imam, rawi or sahabi is inserted at the end of a saved route.
const person=(id:string,name:string)=>({id,name,display_name:'',archived:false});
const savedPeople=[
 person('jazari','الإمام محمد بن محمد الجزري'),
 person('dani','الحافظ أبو عمرو عثمان بن سعيد الداني'),
 person('shatibi','الإمام القاسم بن فيره الشاطبي'),
 person('bookTeacher','أبو محمد عبد الرحمن'),
 person('beforeDani','أبو داود سليمان'),
 person('afterDani','أبو الفتح فارس'),
 person('branchOther','أبو الحسين المكي'),
 person('threeTeacher','أبو إسحاق البغدادي'),
];
const bookParent:BuilderChain={id:'parent-seven',book_id:'seven',book_chain_id:null,
 kind:'book',title:'سند الكتاب',route_code:'',qari_id:'',rawi:'',
 continuation:'',confirmed:false,archived:false,revision:1,
 branches:[[{person_id:'bookTeacher',route_source:false}]]};
const threeParent:BuilderChain={...bookParent,id:'parent-three',book_id:'three',branches:[[]]};
const sevenRoute:BuilderChain={...bookParent,id:'qalun',kind:'route',book_chain_id:bookParent.id,
 qari_id:'nafi',rawi:'قالون',confirmed:true,
 branches:[['beforeDani','dani','afterDani'].map(person_id=>({person_id,route_source:false}))]};
const otherSeven:BuilderChain={...sevenRoute,id:'warsh',rawi:'ورش',
 branches:[['beforeDani','branchOther'].map(person_id=>({person_id,route_source:false}))]};
const threeRoute:BuilderChain={...sevenRoute,id:'three-route',book_id:'three',book_chain_id:threeParent.id,
 qari_id:'abujafar',rawi:'ابن وردان',
 branches:[[{person_id:'threeTeacher',route_source:false}]]};
const fixtureLibrary:BuilderLibrary={
 people:savedPeople,
 books:[{id:'seven',title:'الشاطبية',author_id:'shatibi',archived:false},
 {id:'three',title:'الدرة',author_id:'jazari',archived:false}],
 chains:[bookParent,threeParent,sevenRoute,otherSeven,threeRoute],
 suggestions:[],continuations:{},
};
const qurraEvidence=buildQurraTransmissionData(fixtureLibrary);
assert.equal(qurraEvidence.jazariId,'jazari');
assert.equal(qurraEvidence.daniId,'dani');
assert.equal(qurraEvidence.witnesses.length,4);
assert.deepEqual(qurraEvidence.witnesses.find(w=>w.stage==='jazari-dani')?.ids,
 ['jazari','bookTeacher','shatibi','beforeDani','dani']);
assert.deepEqual(qurraEvidence.witnesses.find(w=>w.stage==='dani-seven')?.ids,['dani','afterDani']);
assert.deepEqual(qurraEvidence.witnesses.find(w=>w.stage==='jazari-three')?.ids,['jazari','threeTeacher']);
assert.deepEqual(qurraEvidence.witnesses.find(w=>w.stage==='other-seven')?.ids,
 ['shatibi','beforeDani','branchOther']);
assert.ok(qurraEvidence.witnesses.every(w=>!w.completeToRawi),
 'endpoints must not pretend to reach the imam or Sahaba');
assert.equal(qurraEvidence.witnesses.find(w=>w.stage==='jazari-dani')?.parentConfirmed,false,
 'book-level sanad review must be visible even when the riwayah is confirmed');
const changedToDraft={...fixtureLibrary,chains:fixtureLibrary.chains.map(c=>c.id==='qalun'?{...c,confirmed:false}:c)};
const draftWitnesses=buildQurraTransmissionData(changedToDraft).witnesses.filter(w=>w.routeId==='qalun');
assert.ok(draftWitnesses.length>0,'an edited route remains visible as a saved review draft');
assert.ok(draftWitnesses.every(w=>!w.routeConfirmed),'edited route must not remain falsely approved');
const archivedRoute={...fixtureLibrary,chains:fixtureLibrary.chains.map(c=>c.id==='qalun'?{...c,archived:true}:c)};
assert.ok(!buildQurraTransmissionData(archivedRoute).witnesses.some(w=>w.routeId==='qalun'),
 'archived routes must not appear in the transmission diagram');
const orphaned={...fixtureLibrary,chains:fixtureLibrary.chains.filter(c=>c.id!=='parent-seven')};
assert.equal(buildQurraTransmissionData(orphaned).witnesses.filter(w=>w.stage==='dani-seven').length,0,
 'do not use a route detached from its declared saved book chain');
const incomplete={...fixtureLibrary,people:fixtureLibrary.people.filter(p=>p.id!=='dani')};
assert.equal(buildQurraTransmissionData(incomplete).witnesses.some(w=>w.stage==='jazari-dani'),false,
 'missing named narrator identity must not be substituted');
assert.deepEqual(savedPeople.map(p=>p.name),fixtureLibrary.people.map(p=>p.name),
 'source names remain untouched by diagram construction');
console.log('Qurra staged identity-backed diagrams and incomplete-link safeguards passed');
