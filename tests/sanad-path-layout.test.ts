import {placeSanad} from '../legacy/lib/sanadPlacement';
import {optimizeSanadPorts,routeSanadConnectors} from '../legacy/lib/sanadConnectorRouting';
import {sharedSanadBuses} from '../legacy/lib/sanadSharedBus';
import assert from 'node:assert/strict';
import {buildQurraTransmissionData,sharedJazariDaniPaths} from '../legacy/lib/qurraTransmissionData';
import {allHistoricalSections,historicalSection,imamCompanionIndexedGraph,rawiImamIndexedGraph,companionsProphetIndexedGraph} from '../legacy/lib/qurraHistoricalSegments';
import {RAWI_IDENTITIES,fullRawiName,rawiIdentity,savedRawiName,savedRawiPerson} from '../legacy/lib/rawiIdentity';
import {QURRA} from '../legacy/lib/qurra';
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


// Dense imam -> five intermediaries -> three Companions -> Ubayy diagrams
// use exactly the same card-edge router as the mashaykh routes. A drawing
// cannot erase genuine connections merely to eliminate difficult crossings.
const denseRows=[
 ['imam'],
 ['teacher1','teacher2','teacher3','teacher4','teacher5'],
 ['sahabi1','sahabi2','sahabi3'],
 ['ubayy'],
];
const densePoints=new Map([
 ['imam',{x:750}],['teacher1',{x:200}],['teacher2',{x:475}],
 ['teacher3',{x:750}],['teacher4',{x:1025}],['teacher5',{x:1300}],
 ['sahabi1',{x:475}],['sahabi2',{x:750}],['sahabi3',{x:1025}],
 ['ubayy',{x:750}],
]);
const denseConnections=[
 ...denseRows[1].map(to=>({from:'imam',to})),
 ...denseRows[1].flatMap(from=>denseRows[2].map(to=>({from,to}))),
 ...denseRows[2].map(from=>({from,to:'ubayy'})),
];
// The five intermediaries explicitly link to all three Companions. A shared
// visual bus replaces fifteen tangled SVG edges with five inputs and three
// outputs, but only because all fifteen original pairs really exist.
const provenBuses=sharedSanadBuses(denseRows,denseConnections);
assert.equal(provenBuses.length,1,'a complete 5×3 historical narrator graph has one justified bus');
assert.equal(provenBuses[0].rank,1);
assert.deepEqual(provenBuses[0].from,denseRows[1]);
assert.deepEqual(provenBuses[0].to,denseRows[2]);
assert.equal(provenBuses[0].edgeIndices.length,15);
for(const from of provenBuses[0].from)for(const to of provenBuses[0].to){
 assert.ok(denseConnections.some(edge=>edge.from===from&&edge.to===to),
  'a shared bus must never imply a missing sanad edge');
}
const sparseConnections=denseConnections.filter(edge=>!((edge.from==='teacher1'||edge.from==='teacher2')&&edge.to==='sahabi2'));
const safeBuses=sharedSanadBuses(denseRows,sparseConnections);
assert.ok(safeBuses.every(bus=>bus.from.every(from=>bus.to.every(to=>
 sparseConnections.some(edge=>edge.from===from&&edge.to===to)))),
 'an incomplete group may only bundle its fully connected subset');
const missingSquare=sharedSanadBuses([['a','b'],['c','d']],[
 {from:'a',to:'c'},{from:'a',to:'d'},{from:'b',to:'c'},
]);
assert.deepEqual(missingSquare,[],'incomplete 2×2 relationships must not be joined');
assert.deepEqual(sharedSanadBuses([['a','b'],['c','d']],[
 {from:'a',to:'c'},{from:'a',to:'d'},{from:'b',to:'c'},{from:'b',to:'d'},
]),[],'small simple connections retain ordinary card-edge routing');
console.log('Shared historical sanad buses require complete evidenced many-to-many links');
const densePorts=denseConnections.map(edge=>({
 ...edge,x1:densePoints.get(edge.from)!.x,x2:densePoints.get(edge.to)!.x,
}));
const denseRouting=optimizeSanadPorts(denseRows,densePoints,densePorts,1500,228,80,new Map());
assert.equal(denseRouting.connectors.length,23,'no real isnad connection is dropped');
assert.ok(denseRouting.height>denseRouting.tops[3]+80,'the bottom card fits on the canvas');
const denseRank=new Map(denseRows.flatMap((row,i)=>row.map(id=>[id,i] as const)));
const tracePoints=(d:string)=>{
 const coords=d.match(/-?\d+(?:\.\d+)?/g)?.map(Number)??[];
 const start={x:coords[0],y:coords[1]},out=[start];
 let next=2;
 for(const step of d.matchAll(/([HV])-?\d+(?:\.\d+)?/g)){
  const previous=out[out.length-1],n=coords[next++];
  out.push(step[1]==='H'?{x:n,y:previous.y}:{x:previous.x,y:n});
 }
 return out;
};
const innerCollision=(a:{x:number;y:number},b:{x:number;y:number},box:{left:number;right:number;top:number;bottom:number})=>{
 const inset=1;
 if(a.x===b.x)return a.x>box.left+inset&&a.x<box.right-inset
  &&Math.max(a.y,b.y)>box.top+inset&&Math.min(a.y,b.y)<box.bottom-inset;
 if(a.y===b.y)return a.y>box.top+inset&&a.y<box.bottom-inset
  &&Math.max(a.x,b.x)>box.left+inset&&Math.min(a.x,b.x)<box.right-inset;
 return true;
};
const crowdedHorizontalY=new Set<number>();
for(const [index,edge] of denseConnections.entries()){
 const points=tracePoints(denseRouting.connectors[index].d);
 assert.ok(points.length>=2,'every sanad connection has a complete route');
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i];
  assert.ok(a.x===b.x||a.y===b.y,'connector segments remain orthogonal');
  for(const [id,at] of densePoints){
   if(id===edge.from||id===edge.to)continue;
   const rank=denseRank.get(id)!;
   const box={left:at.x-114,right:at.x+114,top:denseRouting.tops[rank],bottom:denseRouting.tops[rank]+80};
   assert.ok(!innerCollision(a,b,box),'the '+edge.from+' -> '+edge.to+' line must not cross '+id+' card');
  }
  if(denseRank.get(edge.from)===1&&denseRank.get(edge.to)===2&&a.y===b.y&&a.x!==b.x){
   crowdedHorizontalY.add(a.y);
  }
 }
}
assert.ok(crowdedHorizontalY.size>=5,'dense historical links use several distinct horizontal corridors');
console.log('Dense source-backed historical diagram preserves every edge, with card clearance and separate lanes');


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
assert.equal(qurraEvidence.witnesses.length,7);
const tenReaderRoutes=qurraEvidence.witnesses.filter(w=>w.stage==='all-ten');
assert.equal(tenReaderRoutes.length,3,'combined ten-reader view includes every saved full-path route');
assert.deepEqual(tenReaderRoutes.find(w=>w.routeId==='qalun')?.ids,
 ['jazari','bookTeacher','shatibi','beforeDani','dani','afterDani']);
assert.deepEqual(tenReaderRoutes.find(w=>w.routeId==='three-route')?.ids,
 ['jazari','threeTeacher']);
assert.ok(tenReaderRoutes.every(w=>!w.completeToRawi),
 'ten-reader overview must never fake an unrecorded imam connection');
const sharedWitnesses=qurraEvidence.witnesses.filter(w=>w.stage==='jazari-dani');
assert.equal(sharedWitnesses.length,1);
const sharedDuplicate={...sharedWitnesses[0],id:'same-shared-chain-different-riwayah',routeId:'other-route',rawi:'ورش'};
assert.equal(sharedJazariDaniPaths([...qurraEvidence.witnesses,sharedDuplicate]).length,1,
 'Jazari to Dani is shared, even when the same exact chain is cited for several riwayat');
assert.deepEqual(sharedJazariDaniPaths([...qurraEvidence.witnesses,sharedDuplicate])[0].ids,
 ['jazari','bookTeacher','shatibi','beforeDani','dani']);
const sharedVariant={...sharedDuplicate,id:'real-distinct-branch',ids:['jazari','bookTeacher','shatibi','dani']};
assert.equal(sharedJazariDaniPaths([...qurraEvidence.witnesses,sharedDuplicate,sharedVariant]).length,2,
 'Distinct saved historical edges remain separate and are not invented or discarded');
assert.equal(sharedJazariDaniPaths(qurraEvidence.witnesses.filter(w=>w.stage==='dani-seven')).length,0,
 'A reader-specific segment cannot be displayed in the shared first stage');
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

assert.equal(RAWI_IDENTITIES.length,20,'all twenty riwayah slots must have full narrator names');
assert.equal(new Set(RAWI_IDENTITIES.map(p=>p.key)).size,19,'same historical al-Duri serves two riwayat');
for(const q of QURRA)for(const rawi of q.rawis){
 const identity=rawiIdentity(q.id,rawi);
 assert.ok(identity, 'missing canonical identity for '+q.id+'/'+rawi);
 assert.ok(identity!.fullName.length>identity!.shortName.length+10,'a full real name, not a nickname, should be displayed');
}
assert.equal(fullRawiName('nafi','قالون'),'أبي موسى عيسى بن مينا بن وردان المدني المعروف بقالون');
assert.equal(rawiIdentity('abiamr','حفص الدوري')?.key,rawiIdentity('kisai','حفص الدوري')?.key);
assert.equal(fullRawiName('hamza','خلف'),'أبي محمد خلف بن هشام البزار البغدادي');
assert.equal(fullRawiName('khalaf','إدريس'),'أبي الحسن إدريس بن عبد الكريم الحداد');
console.log('Full historical names for all twenty riwayat and shared narrator identities passed');

const originalQalun={
 id:'saved-qalun',name:'قالون عيسى بن مينا',display_name:'قالون',archived:false,
 aliases:[{name:fullRawiName('nafi','قالون'),key:'ابي موسي عيسي بن مينا بن وردان المدني المعروف بقالون'}],
};
assert.equal(savedRawiPerson([originalQalun],'nafi','قالون')?.id,originalQalun.id,
 'A user-preferred preexisting name must be reused from its full-name alias');
assert.equal(savedRawiName([originalQalun],'nafi','قالون'),originalQalun.name,
 'Show a saved preferred spelling, not an imposed catalog rewrite');
assert.equal(savedRawiPerson([originalQalun],'abujafar','ابن وردان'),undefined,
 'Qalun and Ibn Wardan are separate even though both are Isa and mention Wardan');
const dizwayh={
 id:'existing-dizwayh',name:'أبي عمر عبد الله بن أحمد الدمشقي',display_name:'',archived:false,
 aliases:[{name:'أبي عمر عبد الله بن أحمد بن ديزويه الدمشقي',key:'ابي عمر عبد الله بن احمد بن ديزويه الدمشقي'}],
};
const ibnDhakwan={
 id:'saved-ibn-dhakwan',name:fullRawiName('ibnamir','ابن ذكوان'),display_name:'ابن ذكوان',archived:false,
 aliases:[],
};
assert.equal(savedRawiPerson([dizwayh],'ibnamir','ابن ذكوان'),undefined,
 'Ibn Dizwayh is not Ibn Dhakwan even though both are Abu Umar Abdullah bin Ahmad al-Dimashqi');
assert.equal(savedRawiPerson([dizwayh,ibnDhakwan],'ibnamir','ابن ذكوان')?.id,ibnDhakwan.id,
 'Select Ibn Dhakwan by historical identity and preserve Ibn Dizwayh unchanged');
assert.equal(savedRawiPerson([originalQalun,{...originalQalun,id:'another-qalun'}],'nafi','قالون'),undefined,
 'Two possible full-identity records require reviewed deduplication instead of an automatic choice');
const duri={id:'saved-duri',name:fullRawiName('abiamr','حفص الدوري'),display_name:'الدوري',archived:false,aliases:[{name:'حفص الدوري',key:'حفص الدوري'}]};
assert.equal(savedRawiPerson([duri],'abiamr','حفص الدوري')?.id,duri.id);
assert.equal(savedRawiPerson([duri],'kisai','حفص الدوري')?.id,duri.id);
console.log('Full-name aliases, preferred saved spellings and historical lookalike safeguards passed');

const sourceTexts=[
 {id:'n1',title:'CHAIN:nafi:قالون',body:'عن أبي الفتح فارس بن أحمد، عن قالون عيسى بن مينا، عن الإمام نافع المدني.'},
 {id:'n2',title:'CHAIN:nafi:sahaba',body:'عن أبي جعفر يزيد بن القعقاع، وأبي داود عبد الرحمن بن هرمز، وأخذ هؤلاء عن أبي هريرة، وعبد الله بن عباس.'},
 {id:'n3',title:'CHAIN:nafi:prophet',body:'وَقَرَأَ أُبَيُّ بْنُ كَعْبٍ عَلَى رَسُولِ الله مُحَمَّدِ بْنِ عَبْدِ الله ﷺ.'},
 {id:'h1',title:'CHAIN:hamza:sahaba',body:'وقرأ حمزة على جعفر بن محمد، عن أبيه محمد بن علي. وقرأ حمزة أيضًا على سليمان بن مهران، عن زر بن حبيش.'},
 {id:'x1',title:'CHAIN:nafi:ورش',body:'عن إسماعيل بن عبد الله، عن ورش عثمان بن سعيد، عن نافع المدني.'},
];
assert.equal(allHistoricalSections(sourceTexts,'rawi-imam').length,2);
assert.equal(allHistoricalSections(sourceTexts,'imam-sahaba').length,2);
assert.equal(allHistoricalSections(sourceTexts,'sahaba-prophet').length,1);
assert.equal(historicalSection(sourceTexts,'nafi','قالون','rawi-imam')?.id,'n1');
assert.equal(historicalSection(sourceTexts,'nafi','ورش','rawi-imam')?.id,'x1');
assert.equal(historicalSection(sourceTexts,'nafi','قالون','imam-sahaba')?.body,sourceTexts[1].body);
assert.equal(historicalSection(sourceTexts,'hamza','خلف','imam-sahaba')?.branches.length,2);
assert.equal(historicalSection(sourceTexts,'nafi','قالون','sahaba-prophet')?.id,'n3');
assert.equal(historicalSection(sourceTexts,'nafi','ورش','sahaba-prophet')?.id,'n3',
 'The imam-level Prophet source must be shared by both riwayat without duplication');
assert.equal(historicalSection(sourceTexts,'abujafar','ابن وردان','rawi-imam'),null,
 'Never invent a missing historical source');
assert.ok(allHistoricalSections(sourceTexts,'imam-sahaba').every(s=>s.status==='source-text-review'));
console.log('Historical sanad sources, variants and review-only graph extraction passed');

const nafiCompanions=historicalSection(sourceTexts,'nafi','','imam-sahaba')!;
assert.ok(nafiCompanions.paths.length>1,
 'Rijal index has the teacher and Companion branches missing from the historical diagram');
assert.ok(nafiCompanions.paths.every(path=>path[0]==='imam:nafi'),
 'Only the selected imam can be the source of the displayed graph');
assert.ok(nafiCompanions.paths.some(path=>path.includes('sahabi:abuhurayra')&&path.includes('sahabi:ubayy')),
 'Nafi → Tabiun → Abu Hurayrah → Ubayy branch is present');
assert.ok(nafiCompanions.paths.every(path=>new Set(path).size===path.length),
 'Rijal-derived paths must be acyclic');
assert.ok(nafiCompanions.paths.every(path=>!path.includes('prophet')),
 'Imam → Companions section must not add unseen edges to the Prophet');
assert.ok(Object.keys(nafiCompanions.names).some(id=>id==='imam:nafi'));
assert.ok(Object.keys(nafiCompanions.names).some(id=>id==='sahabi:ubayy'));
const hamzaCompanions=historicalSection(sourceTexts,'hamza','','imam-sahaba')!;
assert.ok(hamzaCompanions.paths.some(p=>p.includes('person:zirr')),
 'Hamza must retain the alternative Aʿmash → Zirr branch');
assert.deepEqual(imamCompanionIndexedGraph({id:'bad',title:'CHAIN:asim:sahaba',body:'عن عثمان بن عفان'},'nafi').paths,[],
 'Never display a chain from another imam as the selected imam');
assert.deepEqual(imamCompanionIndexedGraph({id:'bad',title:'CHAIN:nafi:sahaba',body:''},'nafi').paths,[],
 'Never display a graph when the source is absent');
console.log('Rijal-index Imam-to-Companions graph, branching, source isolation and cycle safeguards passed');

for(const imam of QURRA){
 const source={id:'synthetic:'+imam.id,title:'CHAIN:'+imam.id+':sahaba',
  body:'Test-only section fixture for the source-scoped Rijal diagram'};
 const graph=imamCompanionIndexedGraph(source,imam.id);
 assert.ok(graph.paths.length>0,'Missing Rijal branch graph for imam '+imam.id);
 assert.ok(graph.paths.every(path=>path[0]==='imam:'+imam.id),'Cross-reader links in '+imam.id);
 assert.ok(graph.paths.every(path=>path.length>=2&&new Set(path).size===path.length),'Invalid path for '+imam.id);
 assert.ok(graph.paths.length<=120,'Historical branch preview exceeds safety cap for '+imam.id);
}
console.log('All ten Imam-to-Companions source-indexed graph layouts passed');

// The selected rawi must match the literal «صاحب الرواية» clause. The
// actual arrows must come from this CHAIN's Rijal teacher index only.
const labelledQalun={
 id:'r-nafi-qalun',title:'CHAIN:nafi:قالون',
 body:'عن أبي الفتح فارس بن أحمد، عن الإمام أبي موسى عيسى بن مينا بن وردان المدني صاحب الرواية، عن الإمام أبي عبد الرحمن نافع بن عبد الرحمن المدني صاحب القراءة',
};
const qalunIndexed=rawiImamIndexedGraph(labelledQalun,'nafi','قالون');
assert.ok(qalunIndexed.paths.some(p=>p[0]==='rawi:qalun'&&p.at(-1)==='imam:nafi'),
 'Qalun → Nafi must use two indexed identities from the same source');
assert.ok(qalunIndexed.names['rawi:qalun']?.includes('عيسى'));
assert.deepEqual(rawiImamIndexedGraph(labelledQalun,'nafi','ورش').paths,[],
 'A different rawi cannot borrow this source or its edges');

const baziBranched={
 id:'r-ibnkathir-bazzi',title:'CHAIN:ibnkathir:البزّي',
 body:'عن الإمام أبي الحسن أحمد بن محمد المكي المعروف بـ البزّي صاحب الرواية، وقرأ البزي على أبي الإخرِيط وهْب بن واضح المكّي، وأبي القاسم عكرمة بن سليمان بن كثير المكي، وعبد الله بن زياد المكي، وهم قرأوا على أبي داود شبل بن عباد المكي، وأبي إسحاق إسماعيل بن عبد الله القسط المكي، وأبي الوليد معروف بن مشكان المكي، وهم قرأوا على الإمام أبي معبد عبد الله بن كثير المكي صاحب القراءة',
};
const bazziIndexed=rawiImamIndexedGraph(baziBranched,'ibnkathir','البزّي');
assert.ok(bazziIndexed.paths.length>=2,
 'The Bazzī parallel teacher branches must be drawn, not left as source-only text');
assert.ok(bazziIndexed.paths.every(p=>p.at(-1)==='imam:ibnkathir'),
 'No Bazzī route may lead to a different reader');

const companionList={
 id:'p-ibnkathir',title:'CHAIN:ibnkathir:prophet',
 body:'وَهَؤُلَاءِ الثَّلَاثَةُ: عُمَرُ بْنُ الْخَطَّابِ، وَأُبَيُّ بْنُ كَعْبٍ، وَزَيْدُ بْنُ ثَابِتٍ قَرَأُوا عَلَى رَسُولِ الله مُحَمَّدِ بْنِ عَبْدِ الله ﷺ، الآخِذِ عَنْ جِبْرِيلَ.',
};
const companionGraph=companionsProphetIndexedGraph(companionList,'ibnkathir');
assert.equal(companionGraph.paths.length,3,
 'Show exactly the three named Companions and no additional endpoint');
assert.deepEqual(new Set(companionGraph.paths.map(p=>p[0])),new Set(['sahabi:umar','sahabi:ubayy','sahabi:zayd']));
assert.ok(companionGraph.paths.every(p=>p[1]==='prophet'&&p.length===2));
assert.deepEqual(companionsProphetIndexedGraph({...companionList,body:'رسول الله محمد بن عبد الله ﷺ'},'ibnkathir').paths,[],
 'Mention of the Prophet without an explicit recitation relation is not an arrow');
assert.deepEqual(companionsProphetIndexedGraph(companionList,'nafi').paths,[],
 'Never leak the Companions from another qiraah source');
const abuMusaNominative={
 id:'p-abiamr',title:'CHAIN:abiamr:prophet',
 body:'وَهَؤُلَاءِ السِّتَّةُ: أَبُو مُوسَى الأَشْعَرِيُّ قَرَأُوا عَلَى رَسُولِ الله مُحَمَّدِ بْنِ عَبْدِ الله ﷺ.',
};
assert.ok(companionsProphetIndexedGraph(abuMusaNominative,'abiamr').paths
 .some(path=>path[0]==='sahabi:abumusa'&&path[1]==='prophet'),
 'Nominative أبو موسى must match indexed genitive أبي موسى without merging identities');

const preferredName='أبي موسى عيسى بن مينا بن وردان المدني المعروف بقالون';
const preferredQalun=historicalSection([labelledQalun],'nafi','قالون','rawi-imam',
 [{...person('saved-qalun',preferredName),display_name:'قالون'}]);
assert.equal(preferredQalun?.names['rawi:qalun'],preferredName,
 'Show an existing audited full person name without altering route identities');
console.log('Source-only Rijal rawi/imam, branching, Companion/Prophet and preferred-name tests passed');

