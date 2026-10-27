import assert from 'node:assert/strict';
import { normalizeRegistration, isRegistration, arabicDigits } from '../lib/registration.ts';
import { isVerificationResult } from '../lib/verification.ts';
for (const value of ['0126-1002','٠١٢٦-١٠٠٢','۰۱۲۶-۱۰۰۲','01261002','٠١٢٦١٠٠٢','\u2066٠١٢٦-١٠٠٢\u2069',' ٠١٢٦ – ١٠٠٢ ']) {
 assert.equal(normalizeRegistration(value),'0126-1002');
 assert.ok(isRegistration(normalizeRegistration(value)));
}
for (const value of ['','0126-100','0126-10022','0126-1002<script>','%','abcd-1002']) assert.equal(isRegistration(normalizeRegistration(value)),false);
assert.equal(arabicDigits('0126-1002'),'٠١٢٦-١٠٠٢');
assert.equal(isVerificationResult({status:'preparing'}),true);
assert.equal(isVerificationResult({status:'not_found'}),true);
assert.equal(isVerificationResult({status:'verified',certificate:{}}),false);
assert.equal(isVerificationResult({status:'error'}),false);
console.log('PASS: Arabic/Persian/English digits, bidi normalization, group order, invalid input and response validation');
