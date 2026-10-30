import assert from 'node:assert/strict';
import {certificateRouteBook,certificateRouteDetail,guestRouteChoice,certificateRoutePhrase} from '../legacy/lib/certificateRouteChoice';
const routes=[{name:'المستنير — طريق ابن الخشنام',number:'1079',rawi:'رَوح'},{name:'المستنير — طريق الحمامي',number:'1078',rawi:'رُويس'}];
assert.deepEqual([...new Set(routes.map(r=>certificateRouteBook(r.name)))],['المستنير']);
assert.equal(certificateRouteDetail(routes[0].name),'ابن الخشنام');
assert.equal(certificateRouteDetail(routes[1].name),'الحمامي');
for(const route of routes)assert.deepEqual(guestRouteChoice(`guest-route:${route.number}:yaqub:${encodeURIComponent(route.rawi)}`),{tariqNumber:route.number,qariId:'yaqub',rawi:route.rawi});
assert.equal(guestRouteChoice('guest-reading:yaqub:روح'),null);
assert.equal(guestRouteChoice('guest-route:%:yaqub:روح'),null);
console.log('Book grouping and separate riwayah/route identity: PASS');

assert.equal(certificateRoutePhrase('المستنير — طريق ابن الخشنام'),'من طريق المستنير وهي من طرق طيبة النشر');
assert.equal(certificateRoutePhrase('المصباح — الفيل'),'من طريق المصباح وهي من طرق طيبة النشر');
assert.equal(certificateRoutePhrase('الشاطبية — قالون'),'من طريق الشاطبية');
assert.equal(certificateRoutePhrase('كتاب غير مصنف — طريق آخر'),'من طريق كتاب غير مصنف');
