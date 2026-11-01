import assert from 'node:assert/strict';
import {cleanSanadPunctuation,cleanSanadPartStart,cleanAllahSpelling} from '../legacy/lib/sanadPunctuation';
assert.equal(cleanSanadPunctuation('عن الإمام صاحب القراءة.، عن شيخه.'),'عن الإمام صاحب القراءة، عن شيخه.');
assert.equal(cleanSanadPunctuation('صَاحِبِ القِرَاءَةِ.، عن شيخه'),'صَاحِبِ القِرَاءَةِ، عن شيخه');
assert.equal(cleanSanadPunctuation('زيد.، وَهَؤُلَاءِ قرأوا على رسول الله ﷺ.'),'زيد. وَهَؤُلَاءِ قرأوا على رسول الله ﷺ.');
assert.equal(cleanSanadPartStart(' ، وهؤلاء'),'وهؤلاء');
assert.equal(cleanSanadPunctuation('(ح). وقرأ فلان على فلان.'),'(ح). وقرأ فلان على فلان.');
assert.equal(cleanSanadPunctuation(cleanSanadPunctuation('صاحب القراءة.، عن شيخه.، وهؤلاء')),'صاحب القراءة، عن شيخه. وهؤلاء');
console.log('Qari title stops, vocalized titles, mixed separators and prophet section boundary: PASS');

assert.equal(cleanAllahSpelling('اللّٰه اللَّهُ الله اَللّٰهِ باللهِ واللهُ عبد اللّٰه'),'الله الله الله الله بالله والله عبد الله');
assert.equal(cleanAllahSpelling('اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ'),'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ','other words retain their marks');
