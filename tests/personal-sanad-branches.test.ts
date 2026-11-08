import assert from 'node:assert/strict';
import {composePersonalSanadBranches} from '../legacy/lib/personalSanadBranches';
import {preparedSanadGraph} from '../legacy/lib/preparedSanadGraph';
import {prepareSavedSanadPeople,preparedSanadText} from '../legacy/lib/preparedSanadPeople';

const main=[
 {id:'a',name:'الشيخ أحمد'},
 {id:'b',name:'الشيخ إبراهيم'},
 {id:'c',name:'الشيخ خالد'},
 {id:'d',name:'الشيخ يزيد'},
 {id:'e',name:'الشيخ عبد الله'}
];
const branches=[
 {originId:'a',joinId:'d',narrators:[{id:'x',name:'الشيخ صالح'}]},
 {originId:'b',joinId:'d',narrators:[{id:'y',name:'الشيخ نعيم'}]}
];
const assembled=composePersonalSanadBranches(main,branches);
assert.match(assembled.text,/\(ح\)\. وقرأ الشيخ أحمد أيضًا على الشيخ صالح/);
assert.match(assembled.text,/\(ح\)\. وقرأ الشيخ إبراهيم أيضًا على الشيخ نعيم/);
const prepared=prepareSavedSanadPeople(assembled.text,true,'end');
assert.ok(prepared,'the new sanad must reopen through the saved text parser');
assert.equal(preparedSanadText(prepared),assembled.text);
assert.equal(prepared.tokens.length,assembled.ids.length);
const graph=preparedSanadGraph(prepared,prepared.tokens.map((token,index)=>({name:token.name,personId:assembled.ids[index]})));
assert.ok(graph,'saved branches must remain a valid directed narrator graph');
assert.equal(graph.paths.length,3);
assert.deepEqual(graph.paths.sort((a,b)=>a.join().localeCompare(b.join())),[['a','b','c','d','e'],['a','b','y','d','e'],['a','x','d','e']].sort((a,b)=>a.join().localeCompare(b.join())));
const one=composePersonalSanadBranches(main,branches.slice(0,1));
assert.equal(preparedSanadGraph(prepareSavedSanadPeople(one.text,true,'end')!,prepareSavedSanadPeople(one.text,true,'end')!.tokens.map((t,i)=>({name:t.name,personId:one.ids[i]})))?.paths.length,2);
assert.throws(()=>composePersonalSanadBranches(main,[{originId:'a',joinId:'b',narrators:[{id:'x',name:'الشيخ صالح'}]}]),/نقطة|اختر/);
assert.throws(()=>composePersonalSanadBranches(main,[{originId:'a',joinId:'d',narrators:[main[2]]}]),/لا تكرره/);
assert.throws(()=>composePersonalSanadBranches(main,[{originId:'a',joinId:'d',narrators:[]}]),/أضف راوياً/);
const plain=composePersonalSanadBranches(main,[]);
assert.equal(plain.text,'كما أخذته عن '+main.map(n=>n.name).join('، عن '));
console.log('PASS: multiple explicit personal-sanad furu, stable reviewed text, valid graph reconstruction, and invalid branch protection');
