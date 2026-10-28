import assert from 'node:assert/strict';
import { authReturnPath,validEmail,validPassword } from '../lib/auth.ts';
import { authMessages } from '../lib/auth-i18n.ts';
assert.equal(authReturnPath('/login'),'/login');
for(const value of ['https://evil.example','//evil.example','/auth/callback?next=//evil.example','/manage/other',null]) assert.equal(authReturnPath(value),'/');
assert.ok(validEmail('user@example.com'));
for(const value of ['bad','user@','a b@example.com','a'.repeat(255)+'@example.com'])assert.ok(!validEmail(value));
assert.ok(validPassword('long-enough-password'));
assert.ok(!validPassword('short'));
assert.ok(!validPassword('x'.repeat(1025)));
const keys=Object.keys(authMessages.en).sort();
for(const locale of ['ar','ur','en'] as const) {
 assert.deepEqual(Object.keys(authMessages[locale]).sort(),keys);
 assert.ok(Object.values(authMessages[locale]).every(value=>value.trim()));
}
console.log('PASS: auth redirect allowlist, credential validation and complete translations');
