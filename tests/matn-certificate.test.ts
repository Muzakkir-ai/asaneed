import assert from 'node:assert/strict';
import {assembleMatnCertificate,isMatnHeading} from '../legacy/lib/matnCertificate';
const chain=assembleMatnCertificate({name:'المقدمة الجزرية',sanadText:'عن الشيخ الأول عن الثاني',wordingText:'أجزت {{mujaaz}} عن {{mujeez}} في {{kitab_name}}'},'المقدمة','الخاتمة');
assert.equal(chain,'【بيان القراءة:إجازة في المقدمة الجزرية】\nالمقدمة\n\nأجزت mujaaz عن mujeez في المقدمة الجزرية\n\nعن الشيخ الأول عن الثاني\n\nالخاتمة');
assert.ok(isMatnHeading('إجازة في المقدمة الجزرية'));
assert.ok(!isMatnHeading('رواية حفص عن عاصم'));
assert.throws(()=>assembleMatnCertificate({name:'متن',sanadText:' '}));
assert.ok(!assembleMatnCertificate({name:'الجزرية',sanadText:'سند',wordingText:''}).includes('القرآن'));
console.log('PASS: matn assembly preserves sanad, resolves editor tokens and separates Quran headings');
