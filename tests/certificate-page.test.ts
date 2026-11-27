import assert from 'node:assert/strict';
import {certificatePage,type ListCertificate} from '../legacy/lib/certificatePage';
import {defaultCertificateFilters as filters} from '../legacy/lib/certificateFilters';
const rows:ListCertificate[]=Array.from({length:10001},(_,i)=>({id:String(i).padStart(6,'0'),studentName:i<2?'مُحَمَّد أَحْمَد':'طالب '+i,completionDate:i%2?'2025-01-01':'2026-01-01',certificateNumber:i+1,registrationNumber:'2601-'+String(i+1).padStart(4,'0'),issuerKey:i%2?'user:one':'guest:two',qariId:'asim',rawi:'حفص',publicationStatus:i%2?'draft':'final',qiraahName:'رواية حفص عن عاصم',shaykhName:'الشيخ إبراهيم'}));
const first=certificatePage(rows,{...filters,sort:'added'},'certificates',0);
assert.equal(first.certificates.length,15);assert.equal(first.totalCertificates,10001);assert.equal(first.pages,667);
assert.equal(first.certificates[0].certificateNumber,10001);
const last=certificatePage(rows,{...filters,sort:'added'},'certificates',1000000);
assert.equal(last.page,666);assert.equal(last.certificates.length,11);
const ids=new Set<string>();for(let p=0;p<first.pages;p++){for(const row of certificatePage(rows,{...filters,sort:'added'},'certificates',p).certificates){assert.ok(!ids.has(row.id));ids.add(row.id);}}
assert.equal(ids.size,rows.length);
assert.deepEqual(first.years,['2026','2025']);
const search=certificatePage(rows,{...filters,query:'احمد محمد'},'students',0);
assert.equal(search.totalCertificates,2);assert.equal(search.students.length,1);assert.equal(search.students[0].length,2);
const narrow=certificatePage(rows,{...filters,issuer:'user:one',year:'2025',status:'draft',qari:'asim',rawi:'asim|حفص'},'certificates',0);
assert.equal(narrow.totalCertificates,5000);assert.ok(narrow.certificates.every(r=>r.issuerKey==='user:one'&&r.publicationStatus==='draft'));
assert.equal(certificatePage(rows,{...filters,query:'مفقود'},'certificates',20).page,0);
assert.equal(certificatePage(rows,{...filters,query:'مفقود'},'certificates',20).totalCertificates,0);
console.log('PASS: 10001 records, no omissions or duplicate page membership, Arabic search, grouped students, combined filters, empty results and clamped pages');
