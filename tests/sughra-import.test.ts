import assert from 'node:assert/strict';
import {planSughraImport,type ImportSection} from '../legacy/lib/sughraImportPlan';
import {QURRA} from '../legacy/lib/qurra';
import {standardRouteSources} from '../legacy/lib/standardRouteSources';
import {builderPreview,type BuilderChain} from '../legacy/lib/bookBuilder';
// Synthetic transmission fixtures test parsing, not historical scholarship.
const sections:ImportSection[]=[{id:'common',title:'من الإمام ابن الجزري إلى الإمام الداني — القراء السبعة',body:'عن راو قبل الكتاب، عن أبي الحسن علي بن شجاع المعروف بـ صهر الشـاطبي، عن إِمَامِ القُرَّاءِ أَبِي مُحَمَّدٍ القَاسِـمِ بنِ فِيرُّهْ الشَّاطِبِيِّ، عن راو بعد الكتاب، عن الإمام الداني'},{id:'bridge',title:'من إبراهيم العُبيدي إلى ابن الجزري — فرعا السند',body:'عن راو، عن إِمَامِ المُقرِئِينَ أَبِي الخَيرِ مُحَمَّدِ بنِ مُحَمَّدٍ الجَزَرِيِّ'}];
for(const q of QURRA){
 for(const rawi of q.rawis){const roles=standardRouteSources(q.id,rawi);let prefix=roles.map(n=>'عن '+n).join('، ');
 if(q.id==='khalaf'&&rawi==='إسحاق')prefix='عن تلميذ أول، وأبي تلميذ ثان، وهما قرءا على راو مشترك، '+prefix;
 if(q.id==='khalaf'&&rawi==='إدريس')prefix='عن راو سبط الخياط، عن '+roles[0]+' (ح). وقرأ سبط الخياط أيضًا على '+roles[1]+'، وقرأ الراويان على';
 const connector=rawi==='إدريس'&&q.id==='khalaf'?' ':'، عن ';
 sections.push({id:q.id+rawi,title:`CHAIN:${q.id}:${rawi}`,body:prefix+connector+'الإمام الراوي صاحب الرواية، عن الإمام القارئ صاحب القراءة'});}
 for(const suffix of ['sahaba','prophet'])sections.push({id:q.id+suffix,title:`CHAIN:${q.id}:${suffix}`,body:suffix==='sahaba'?'عن الصحابي المحفوظ':'قرأ على رسول الله ﷺ'});
}
const before=JSON.stringify(sections),books=planSughraImport(sections);
assert.equal(books[0].title,'الشاطبية');assert.ok(books[0].author.includes('القَاسِـمِ'));assert.ok(!books[0].author.includes('صهر'));assert.ok(books[0].parent.at(-1)?.includes('صهر'));assert.ok(!books[0].routes[0].branches[0][0].includes('القَاسِـمِ'));assert.equal(books[0].routes.length,14);assert.equal(books[1].title,'الدرة');assert.equal(books[1].routes.length,6);
for(const r of books.flatMap(b=>b.routes))assert.ok(r.continuation.includes('صاحب الرواية')&&r.continuation.includes('رسول الله ﷺ'));
assert.equal(books[1].routes.find(r=>r.rawi==='إدريس')?.branches.length,2);
assert.equal(books[1].routes.find(r=>r.rawi==='إسحاق')?.branches.length,2);
assert.equal(JSON.stringify(sections),before);
assert.throws(()=>planSughraImport(sections.slice(1)),/Missing/u);
assert.throws(()=>planSughraImport([...sections,sections[0]]),/ambiguous/u);
const person={id:'jazari',name:books[1].author,display_name:'',archived:false};
const book={id:'durrah',title:'الدرة',author_id:person.id,archived:false};
const parent={branches:[[]]} as unknown as BuilderChain,route={branches:[[]],continuation:'عن الراوي ثم الإمام'} as unknown as BuilderChain;
const prefix='عن الشيخ عبد الله بن محمد، عن الإمام ابن الجزري';
assert.equal(builderPreview(book,parent,route,[person],prefix).text,prefix+'، عن الراوي ثم الإمام','junction author must not repeat');
assert.ok(builderPreview(book,parent,route,[person],'').text.includes(person.name),'author retained in library-only preview');
console.log('Sughra import 14+6, strict source boundaries, explicit Ishaq/Idris branches, source preservation and Jazari junction deduplication: PASS');
