import {strict as assert} from 'node:assert';
import {assemblePersonalSanadBranches,type PersonalSanadBranch} from '../legacy/lib/personalSanadBranches';
import {prepareSavedSanadPeople} from '../legacy/lib/preparedSanadPeople';
import {preparedSanadGraph} from '../legacy/lib/preparedSanadGraph';
import {personalSanadEndsAtSavedNarrator} from '../legacy/lib/sharedBridge';

const main=[
 {key:'a',name:'الشيخ أحمد',personId:'person-a'},
 {key:'b',name:'الشيخ محمد',personId:'person-b'},
 {key:'c',name:'الشيخ محمود',personId:'person-c'},
 {key:'d',name:'الإمام ابن الجزري',personId:'person-d'}
];
const single=assemblePersonalSanadBranches(main,[]);
assert.equal(single.text,'كما أخذته عن الشيخ أحمد، عن الشيخ محمد، عن الشيخ محمود، عن الإمام ابن الجزري');
assert.deepEqual(single.ids,main.map(n=>n.personId));
assert.equal(single.paths.length,1);

const branches:PersonalSanadBranch[]=[
 {id:'x',origin:'b',join:'c',nodes:[{key:'x',name:'الشيخ خالد',personId:'person-x'}]},
 {id:'y',origin:'c',join:'d',nodes:[{key:'y',name:'الشيخ حسن',personId:'person-y'}]}
];
const generated=assemblePersonalSanadBranches(main,branches);
assert.equal(generated.text.match(/\(ح\)/gu)?.length,2,'each branch must serialize as a distinct transmission turn');
assert.equal(generated.ids.length,9,'each turn repeats the joined main suffix by identity, not by a new person');
assert.ok(personalSanadEndsAtSavedNarrator(generated.text,generated.ids),'backend accepts a new, unlinked but complete personal sanad');
const recovered=prepareSavedSanadPeople(generated.text,true,'end');
assert.ok(recovered,'generated text reopens with exact Arabic transmission separators');
assert.equal(recovered?.tokens.length,generated.ids.length);
const graph=recovered&&preparedSanadGraph(recovered,recovered.tokens.map((t,i)=>({name:t.name,personId:generated.ids[i]})));
assert.ok(graph);
assert.equal(graph?.paths.length,4,'two connected turns generate the four valid combinations');
assert.ok(graph?.paths.every(path=>path.at(-1)==='person-d'),'all branches rejoin at the final reviewed narrator');

assert.throws(()=>assemblePersonalSanadBranches(main,[{id:'bad',origin:'d',join:'b',nodes:branches[0].nodes}]),/نقطة الالتقاء/);
assert.throws(()=>assemblePersonalSanadBranches(main,[{id:'bad',origin:'b',join:'c',nodes:[{key:'bad',name:'غير محفوظ'}]}]),/أكمل رواة الفرع/);
assert.throws(()=>assemblePersonalSanadBranches(main,[{id:'bad',origin:'b',join:'c',nodes:[{key:'bad',name:'الشيخ أحمد',personId:'person-a'}]}]),/كرر الفرع راوياً/);
assert.throws(()=>assemblePersonalSanadBranches(main,[branches[0],{...branches[0],id:'duplicate'}]),/مكرر/);
console.log('PASS: create new sanad with one or several connected branches, save without stale continuation, reopen diagram, and reject broken merges');
