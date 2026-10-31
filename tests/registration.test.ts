import assert from 'node:assert/strict';
import { normalizeRegistration, isRegistration, arabicDigits } from '../lib/registration.ts';
import { isVerificationResult } from '../lib/verification.ts';
for (const value of ['2601-1002','٢٦٠١-١٠٠٢','۲۶۰۱-۱۰۰۲','26011002','٢٦٠١١٠٠٢','\u2066٢٦٠١-١٠٠٢\u2069',' ٢٦٠١ – ١٠٠٢ ']) {
 assert.equal(normalizeRegistration(value),'2601-1002');
 assert.ok(isRegistration(normalizeRegistration(value)));
}
for (const value of ['','2601-100','2601-1002<script>','%','abcd-1002']) assert.equal(isRegistration(normalizeRegistration(value)),false);
assert.equal(arabicDigits('2601-1002'),'٢٦٠١-١٠٠٢');
assert.equal(isVerificationResult({status:'preparing'}),true);
assert.equal(isVerificationResult({status:'not_found'}),true);
assert.equal(isVerificationResult({status:'verified',certificate:{}}),false);
assert.equal(isVerificationResult({status:'error'}),false);
console.log('PASS: Arabic/Persian/English digits, bidi normalization, group order, invalid input and response validation');

assert.equal(normalizeRegistration('٢٦٠١١٠٠١٨'),'2601-10018');
assert.ok(isRegistration('2601-10018'));
assert.ok(isRegistration('2701-10101'));
assert.ok(!isRegistration('2601-'+ '1'.repeat(22)));
