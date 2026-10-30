import assert from 'node:assert/strict';
import {observedLinks,rankNarrators,possibleNarratorDuplicates} from '../legacy/lib/narratorSelection';
import type {BuilderLibrary,BuilderChain} from '../legacy/lib/bookBuilder';
const people=[{id:'a',name:'أَبِي عَمْـرٍو',display_name:'الإمام البصري',archived:false},{id:'b',name:'محمد الأول',display_name:'أبو زيد',archived:false},{id:'c',name:'محمد الآخر',display_name:'',archived:false},{id:'d',name:'محمد الآخر',display_name:'',archived:false},{id:'hidden',name:'محمد',display_name:'',archived:true}];
const chain={id:'chain',kind:'route',book_id:'book',archived:false,branches:[[{person_id:'b',route_source:false},{person_id:'c',route_source:false}]]} as BuilderChain;
const lib={people,books:[{id:'book',author_id:'a',title:'كتاب',archived:false}],chains:[chain],suggestions:[],continuations:{}} as BuilderLibrary;
const before=JSON.stringify(lib),links=observedLinks(lib);
assert.deepEqual(links,[{from:'a',to:'b',chainId:'chain'},{from:'b',to:'c',chainId:'chain'}]);
assert.equal(rankNarrators(people,'محمد',links,'a')[0].person.id,'b');
assert.ok(rankNarrators(people,'محمد',links,'a').some(r=>r.person.id==='d'&&!r.observed.length),'unconnected and duplicate-name identities remain selectable');
assert.equal(rankNarrators(people,'ابي زيد',links)[0].person.id,'b','kunyah alias');
assert.equal(rankNarrators(people,'ابي عمرو',links)[0].person.id,'a','diacritic and alif normalization');
assert.equal(rankNarrators(people,'البصري',links)[0].person.id,'a','display title');
assert.equal(rankNarrators(people,'',links,'c').find(r=>r.person.id==='b')?.observed.length,0,'never infer reverse direction');
assert.equal(rankNarrators(people,'',links,undefined,'c')[0].person.id,'b','between/before context');
assert.ok(!rankNarrators(people,'',links).some(r=>r.person.id==='hidden'));
assert.equal(JSON.stringify(lib),before);
assert.equal(observedLinks({...lib,chains:[{...chain,archived:true}]}).length,0);
const parent={...chain,id:'parent',kind:'book',branches:[[{person_id:'c',route_source:false}]]} as BuilderChain;
assert.deepEqual(observedLinks({...lib,chains:[parent]}),[{from:'c',to:'a',chainId:'parent'}]);
console.log('Narrator ranking, aliases, identity ambiguity, directed source references, boundaries and immutability: PASS');

assert.ok(possibleNarratorDuplicates(people,'محمد الأول البصري').some(p=>p.id==='b'),'near duplicate review keeps identity explicit');

const ordered=rankNarrators(people,'',links,'a');
assert.equal(ordered[0].person.id,'b','opening with no search shows connected teachers first');
assert.ok(ordered.slice(1).every(r=>!r.observed.length),'other saved names follow connected teachers');
assert.equal(rankNarrators(people,'محمد الآخر',links,'a').length,2,'typing still searches unconnected people');
