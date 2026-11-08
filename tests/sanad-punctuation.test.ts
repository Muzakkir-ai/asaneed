import assert from 'node:assert/strict';
import {cleanSanadPunctuation,cleanSanadPartStart,cleanAllahSpelling} from '../legacy/lib/sanadPunctuation';
import {diagramSanadText} from '../legacy/lib/diagramSanadText';
assert.equal(cleanSanadPunctuation('عن الإمام صاحب القراءة.، عن شيخه.'),'عن الإمام صاحب القراءة، عن شيخه.');
assert.equal(cleanSanadPunctuation('صَاحِبِ القِرَاءَةِ.، عن شيخه'),'صَاحِبِ القِرَاءَةِ، عن شيخه');
assert.equal(cleanSanadPunctuation('زيد.، وَهَؤُلَاءِ قرأوا على رسول الله ﷺ.'),'زيد. وَهَؤُلَاءِ قرأوا على رسول الله ﷺ.');
assert.equal(cleanSanadPartStart(' ، وهؤلاء'),'وهؤلاء');
assert.equal(cleanSanadPunctuation('(ح). وقرأ فلان على فلان.'),'(ح). وقرأ فلان على فلان.');
assert.equal(cleanSanadPunctuation(cleanSanadPunctuation('صاحب القراءة.، عن شيخه.، وهؤلاء')),'صاحب القراءة، عن شيخه. وهؤلاء');
console.log('Qari title stops, vocalized titles, mixed separators and prophet section boundary: PASS');

assert.equal(cleanAllahSpelling('اللّٰه اللَّهُ الله اَللّٰهِ باللهِ واللهُ عبد اللّٰه'),'الله الله الله الله بالله والله عبد الله');
assert.equal(cleanAllahSpelling('اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ'),'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ','other words retain their marks');

const diagramNames={
 j:'الإمام ابن الجزري',t:'عن الشيخ عبد الرحمن،',s:'الشيخ محمد بن أحمد',
} as const;
assert.equal(diagramSanadText(['j','t','s'],diagramNames),
 'عن الشيخ محمد بن أحمد، عن الشيخ عبد الرحمن، عن الإمام ابن الجزري',
 'diagram text reverses the graph ordering, preserving explicit transmission edges');
assert.equal(diagramSanadText(['j','t'],diagramNames),
 'عن الشيخ عبد الرحمن، عن الإمام ابن الجزري','duplicate عن and final commas are normalized');
assert.equal(diagramSanadText(['j','unknown'],diagramNames),null,
 'unidentified narrator prevents generation');
assert.equal(diagramSanadText(['j','t','j'],diagramNames),null,
 'cyclic/repeated narrator identities require review');
assert.equal(diagramSanadText([],diagramNames),null);
console.log('Read-only diagram sanad text, ordering, punctuation and unresolved identities: PASS');
