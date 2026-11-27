import assert from 'node:assert/strict';
import {sourceRoleName,readingIdentityLink,qariIdentity,routeIdentityLinks,linkExistingGraph} from '../legacy/lib/qurraRouteIdentities';
import {historicalSection} from '../legacy/lib/qurraHistoricalSegments';
import type {BuilderPerson,BuilderChain} from '../legacy/lib/bookBuilder';
const person=(id:string,name:string,aliases:string[]=[]):BuilderPerson=>({id,name,display_name:'',archived:false,aliases:aliases.map(name=>({name,key:name}))});
const people=[person('nafi-id','أبي عبد الرحمن نافع بن عبد الرحمن المدني',['نافع بن عبد الرحمن المدني']),person('qalun-id','أبي موسى عيسى بن مينا بن وردان المدني الملقب بـ قالون'),person('warsh-id','أبي سعيد عثمان بن سعيد المصري الملقب بـ ورش'),person('duri-id','أبي عمر حفص بن عمر بن عبد العزيز البغدادي الدوري',['أبي عمر حفص بن عمر البغدادي الدوري']),person('amr-id','أبي عمرو زبان بن العلاء التميمي البصري'),person('kisai-id','أبي الحسن علي بن حمزة الكسائي الكوفي'),person('khalaf-id','أبي محمد خلف بن هشام البزار الكوفي',['أبي محمد خلف بن هشام البزار']),person('hamza-id','أبي عمارة حمزة بن حبيب الزيات الكوفي'),person('idris-id','أبي الحسن إدريس بن عبد الكريم الحداد الكوفي')];
const sections=[
{id:'qalun',title:'CHAIN:nafi:قالون',body:'عن أبي موسى عيسى بن مينا بن وردان المدني الملقب بـ قالون صاحب الرواية، عن إمام المدينة -زادها الله شرفًا- أبي عبد الرحمن نافع بن عبد الرحمن المدني صاحب القراءة'},
{id:'warsh',title:'CHAIN:nafi:ورش',body:'عن أبي سعيد عثمان بن سعيد المصري الملقب بـ ورش صاحب الرواية، عن إمام المدينة -زادها الله شرفًا- نافع بن عبد الرحمن المدني صاحب القراءة'},
{id:'duri-a',title:'CHAIN:abiamr:حفص الدوري',body:'عن أبي عمر حفص بن عمر بن عبد العزيز البغدادي الدوري صاحب الرواية، عن أبي محمد يحيى بن المبارك اليزيدي، عن إمام البصرة أبي عمرو زبان بن العلاء التميمي البصري صاحب القراءة'},
{id:'duri-k',title:'CHAIN:kisai:حفص الدوري',body:'عن أَبِي عُمَرَ حَفصِ بنِ عُمَرَ البَغدَادِيِّ الدُّورِيِّ صَاحِبِ الرِّوَايَةِ، عن أبي الحسن علي بن حمزة الكسائي الكوفي صاحب القراءة'},
{id:'khalaf',title:'CHAIN:hamza:خلف',body:'عن أبي محمد خلف بن هشام البزار الكوفي صاحب الرواية، عن أبي عيسى سليم بن عيسى الكوفي الحنفي، عن أبي عمارة حمزة بن حبيب الزيات الكوفي صاحب القراءة'},
{id:'idris',title:'CHAIN:khalaf:إدريس',body:'وقرأ المطوعي والقطيعي على الإمام أبي الحسن إدريس بن عبد الكريم الحداد الكوفي صاحب الرواية، عن الإمام أبي محمد خلف بن هشام البزار صاحب القراءة'},
];
const original=JSON.stringify(sections);
assert.equal(readingIdentityLink(sections,people,'nafi','قالون')?.qariPersonId,'nafi-id');
assert.equal(qariIdentity(sections,people,'nafi')?.id,'nafi-id');
assert.equal(readingIdentityLink(sections,people,'abiamr','حفص الدوري')?.rawiPersonId,'duri-id');
assert.equal(readingIdentityLink(sections,people,'kisai','حفص الدوري')?.rawiPersonId,'duri-id');
assert.equal(readingIdentityLink(sections,people,'hamza','خلف')?.rawiPersonId,'khalaf-id');
assert.equal(readingIdentityLink(sections,people,'khalaf','إدريس')?.qariPersonId,'khalaf-id');
assert.equal(readingIdentityLink(sections,[...people,person('duplicate',people[0].name)],'nafi','قالون'),undefined);
assert.equal(readingIdentityLink([...sections,{...sections[0],id:'duplicate'}],people,'nafi','قالون'),undefined);
assert.equal(readingIdentityLink(sections,people.map(p=>p.id==='qalun-id'?{...p,archived:true}:p),'nafi','قالون'),undefined);
assert.equal(sourceRoleName('عن أ، صاحب القراءة','qari'),'');
const routes=[{id:'r1',kind:'route',archived:false,qari_id:'nafi',rawi:'قالون'},{id:'r2',kind:'route',archived:false,qari_id:'nafi',rawi:'قالون'},{id:'r3',kind:'route',archived:true,qari_id:'nafi',rawi:'قالون'}] as BuilderChain[];
assert.deepEqual(Object.keys(routeIdentityLinks(routes,sections,people)),['r1','r2']);
const graph=[['rawi','teacher-a','imam'],['rawi','teacher-b','imam']];
const map={rawi:{id:'rawi-id',name:'الراوي'},imam:{id:'imam-id',name:'الإمام'}};
const linked=linkExistingGraph(graph,{},map);
assert.deepEqual(linked.paths,[['rawi-id','teacher-a','imam-id'],['rawi-id','teacher-b','imam-id']]);
assert.equal(linkExistingGraph(graph,{}, {...map,imam:{id:'teacher-a',name:'الإمام'}}).linked,false);
const view=historicalSection(sections,'abiamr','حفص الدوري','rawi-imam',people);
assert.ok(view);assert.equal(view.body,sections[2].body);assert.equal(view.status,'source-text-review');
assert.ok(view.paths.length>0);assert.equal(view.rawiPersonId,'duri-id');assert.equal(view.qariPersonId,'amr-id');assert.ok(view.paths.every(p=>p.length>=3),'intermediate teacher not bypassed');
assert.equal(JSON.stringify(sections),original);
console.log('PASS source-role identity matching, shared Duri and Khalaf identities, ambiguity/archive rejection, route mapping, original prose and exact intermediate edges');
