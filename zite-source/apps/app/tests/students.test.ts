import assert from 'node:assert/strict';
import endpoint from '../src/api/studentDirectory';
import {rows} from './mockDb';
const context={user:{id:'admin',email:'admin@example.test'}};
rows.appUsers=[{id:'admin-profile',email:'admin@example.test',role:'Admin',active:true}];
rows.students=[
 {id:'protected',name:'مُحَمَّد مُذَكِّر',ownerId:'shaykh-a'},
 {id:'unused-a',name:'سَعُود',ownerId:'shaykh-a'},
 {id:'unused-b',name:'سعود',ownerId:'shaykh-b'},
 {id:'other',name:'عُمَر',ownerId:'shaykh-b'},
];
rows.certificates=[{id:'cert',studentName:'محمد مذكر',publicationStatus:'draft'}];
const list=await endpoint.execute({input:{action:'list'},context});
assert.equal(list.students.length,3);
assert.equal(list.entries.find((s:any)=>s.name==='محمد مذكر')?.canDelete,false);
await assert.rejects(()=>endpoint.execute({input:{action:'delete',name:'مُحَمَّد مذكر'},context}),/إجازة/);
assert.equal(rows.students.length,4);
await assert.rejects(()=>endpoint.execute({input:{action:'delete',name:'سعود'},context:{user:{id:'other-user',email:'other@example.test'}}}),/للمدير/);
assert.equal(rows.students.length,4);
await endpoint.execute({input:{action:'delete',name:'سُعُود'},context});
assert.equal(rows.students.length,2);
assert.ok(!rows.students.some(s=>s.id.startsWith('unused')));
assert.equal(rows.certificates.length,1);
assert.equal(rows.certificates[0].id,'cert');
console.log('PASS students: shared deduplication, diacritic-insensitive deletion, administrator check, certificate protection, no certificate deletion.');
