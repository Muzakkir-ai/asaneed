import assert from 'node:assert/strict';
import {prepareSavedSanadPeople,preparedSanadText} from '../legacy/lib/preparedSanadPeople';
import {preparedSanadGraph,preparedGraphLevels} from '../legacy/lib/preparedSanadGraph';
const text='كما أخذته عن الشيخ الأول، عن الشيخ الثاني، عن الشيخ الملتقى(ح). وأخذ الشيخ الثاني أيضًا عن الشيخ الثالث، عن الشيخ الملتقى(ح). وأخذ الشيخ الثالث أيضًا عن الشيخ الرابع، عن الشيخ الملتقى، عن الشيخ الخامس، عن الشيخ السادس، عن الشيخ إبراهيم العُبَيدِي';
const prepared=prepareSavedSanadPeople(text)!;assert.ok(prepared);
const people=prepared.tokens.map((t,i)=>({name:t.name,personId:t.name==='الشيخ الملتقى'?'meeting':'person-'+i}));
const graph=preparedSanadGraph(prepared,people)!;assert.ok(graph);assert.equal(graph.paths.length,3);assert.deepEqual(graph.paths.map(p=>p.length),[6,7,8]);assert.equal(graph.nodes.filter(n=>n.id==='meeting').length,1);assert.equal(graph.nodes.find(n=>n.id==='meeting')!.indices.length,3);assert.equal(graph.nodes.length,8);assert.equal(preparedSanadText(prepared),text,'graph layout cannot change source prose');
const unresolved=people.map((p,i)=>({...p,personId:'different-'+i}));assert.equal(preparedSanadGraph(prepared,unresolved),null,'unidentified repeated names are not silently merged');
const cycle={...prepared,tokens:prepared.tokens.slice(0,2)};assert.equal(preparedSanadGraph(cycle,[{name:'أول',personId:'one'},{name:'أول',personId:'one'}]),null,'self-transmission is not erased or drawn as a shortcut');
const ambiguous=prepareSavedSanadPeople('كما أخذته عن الشيخ الأول، عن الشيخ عبد الله المشترك، عن الشيخ أحمد المشترك(ح). وأخذ المشترك أيضًا عن الشيخ الثاني، عن الشيخ إبراهيم العُبَيدِي')!;assert.equal(preparedSanadGraph(ambiguous,ambiguous.tokens.map((t,i)=>({name:t.name,personId:String(i)}))),null,'ambiguous origin abbreviations stay in literal review');
console.log('PASS: explicit branch origins, merged stable IDs, shortest paths, full common tail, unchanged source, and cycle/ambiguity safeguards');

const linear=prepareSavedSanadPeople('كما أخذته عن الشيخ الأول، عن الشيخ الثاني، عن الشيخ إبراهيم العُبَيدِي')!;assert.equal(preparedSanadGraph(linear,linear.tokens.map((t,i)=>({name:t.name,personId:String(i)})))?.paths.length,1,'simple saved chains share the same card/arrow layout');

const joint=prepareSavedSanadPeople('كما أخذته عن الشيخ الأول، عن الشيخ الثاني والشيخة الثالثة، وهما عن الشيخ إبراهيم العُبَيدِي')!;const jointGraph=preparedSanadGraph(joint,joint.tokens.map((t,i)=>({name:t.name,personId:String(i)})))!;assert.deepEqual(jointGraph.paths,[['0','1','3'],['0','2','3']],'joint teachers are parallel sources at the same transmission depth');

const jointLevels=preparedGraphLevels(jointGraph);assert.deepEqual(jointLevels.get('1'),[{level:2,suffix:'أ'}]);assert.deepEqual(jointLevels.get('2'),[{level:2,suffix:'ب'}]);assert.deepEqual(jointLevels.get('3'),[{level:1,suffix:''}]);assert.deepEqual(jointLevels.get('0'),[{level:3,suffix:''}]);
const multi=preparedGraphLevels(graph);assert.deepEqual(multi.get('person-0')!.map(r=>r.level),[6],'All view keeps only the highest rank (fewest transmitters to the junction)');assert.deepEqual(preparedGraphLevels(graph,graph.paths[0]).get('person-0')!.map(r=>r.level),[6],'single view shows the selected route distance');assert.deepEqual(preparedGraphLevels(graph,graph.paths[0]).get('person-9'),[{level:1,suffix:''}]);assert.equal(preparedSanadText(prepared),text,'numbering never rewrites source text');

assert.deepEqual(multi.get('person-0'),[{level:6,suffix:''}],'a highest-rank singleton has no peer suffix');assert.deepEqual(multi.get('person-1'),[{level:5,suffix:'أ'}]);assert.deepEqual(multi.get('person-3'),[{level:5,suffix:'ب'}]);assert.deepEqual(multi.get('person-5'),[{level:5,suffix:'ج'}]);assert.equal(preparedGraphLevels(graph,graph.paths[2]).get('person-0')![0].level,8,'longer selected route retains its actual rank');
