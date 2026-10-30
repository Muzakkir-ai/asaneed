import assert from 'node:assert/strict';
import {certificateRouteBook,certificateRouteDetail,guestRouteChoice,certificateRoutePhrase,certificateRouteWording,currentPreservedRouteText} from '../legacy/lib/certificateRouteChoice';
const routes=[{name:'المستنير — طريق ابن الخشنام',number:'1079',rawi:'رَوح'},{name:'المستنير — طريق الحمامي',number:'1078',rawi:'رُويس'}];
assert.deepEqual([...new Set(routes.map(r=>certificateRouteBook(r.name)))],['المستنير']);
assert.equal(certificateRouteDetail(routes[0].name),'ابن الخشنام');
assert.equal(certificateRouteDetail(routes[1].name),'الحمامي');
for(const route of routes)assert.deepEqual(guestRouteChoice(`guest-route:${route.number}:yaqub:${encodeURIComponent(route.rawi)}`),{tariqNumber:route.number,qariId:'yaqub',rawi:route.rawi});
assert.equal(guestRouteChoice('guest-reading:yaqub:روح'),null);
assert.equal(guestRouteChoice('guest-route:%:yaqub:روح'),null);
console.log('Book grouping and separate riwayah/route identity: PASS');

assert.equal(certificateRoutePhrase('المستنير — طريق ابن الخشنام'),'من طريق المستنير');
assert.equal(certificateRoutePhrase('المصباح — الفيل'),'من طريق المصباح');
assert.equal(certificateRoutePhrase('الشاطبية — قالون'),'من طريق الشاطبية');
assert.equal(certificateRoutePhrase('كتاب غير مصنف — طريق آخر'),'من طريق كتاب غير مصنف');

assert.equal(certificateRouteWording('المستنير — طريق ابن الخشنام'),'من طريق المستنير، وهي من طرق طيبة النشر');

const oldName='المستنير — طريق ابن الخشنام';
const preserved='【بيان القراءة:رواية روح عن الإمام يعقوب من طريق '+oldName+'】\nأجزته من طريق '+oldName+'، كما أخذته عن الشيخ من طريق المستنير — طريق ابن الخشنام';
const corrected=currentPreservedRouteText(preserved,oldName);
assert.ok(corrected.startsWith('【بيان القراءة:رواية روح عن الإمام يعقوب من طريق المستنير】'));
assert.ok(corrected.includes('أجزته من طريق المستنير، وهي من طرق طيبة النشر'));
assert.equal(corrected.slice(corrected.indexOf('كما أخذته')),preserved.slice(preserved.indexOf('كما أخذته')));
assert.equal(currentPreservedRouteText(corrected,oldName),corrected,'idempotent');
assert.equal(currentPreservedRouteText('نص محفوظ بلا حد معروف',oldName),'نص محفوظ بلا حد معروف');

const single='【بيان القراءة:من طريق المستنير】 أجزته من طريق المستنير، كما أخذته عن فلان';
assert.equal(currentPreservedRouteText(currentPreservedRouteText(single,'المستنير'),'المستنير'),currentPreservedRouteText(single,'المستنير'));
const vowels=preserved.replaceAll('من طريق','مِنْ طَرِيقِ').replaceAll('كما أخذته','كَمَا أَخَذْتُهُ');
assert.ok(currentPreservedRouteText(vowels,oldName).includes('، وهي من طرق طيبة النشر'));

const previous='【بيان القراءة:رواية روح من طريق المستنير】 أجزته من طريق المستنير وهي إحدى طرق طيبة النشر، كما أخذته عن فلان';
const updated=currentPreservedRouteText(previous,'المستنير — طريق ابن الخشنام');
assert.ok(updated.includes('من طريق المستنير، وهي من طرق طيبة النشر'));
assert.ok(!updated.includes('إحدى'));
assert.equal(currentPreservedRouteText(updated,'المستنير — طريق ابن الخشنام'),updated);
