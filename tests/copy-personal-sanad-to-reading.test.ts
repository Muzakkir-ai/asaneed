import assert from 'node:assert/strict';
import {copyPersonalSanadToReading} from '../legacy/lib/copyPersonalSanadToReading';

const saved={
 id:'source-riwayah',
 qariId:'nafi',
 rawi:'قالون',
 sanadText:'كما أخذته عن الشيخ محمد، عن الشيخ خالد',
 personalPersonIds:['n1','n2'],
 continuationId:'old-riwayah-reviewed-source',
 preparedPeople:null,
 junction:'jazari',
 unifiedSanad:null
} as unknown as Parameters<typeof copyPersonalSanadToReading>[0];
const snapshot=JSON.stringify(saved);
const copied=copyPersonalSanadToReading(saved);
assert.equal(copied.text,saved.sanadText);
assert.deepEqual(copied.personIds,saved.personalPersonIds);
assert.notEqual(copied.personIds,saved.personalPersonIds);
assert.equal(copied.continuationId,null,'an original riwayah continuation is never silently transferred');
assert.equal(copied.unifiedSanad,null);
assert.equal(copied.junction,'jazari');
copied.personIds.push('different');
assert.equal(JSON.stringify(saved),snapshot,'copy cannot mutate source sanad identities or linkage');
console.log('PASS: copying a saved sanad preserves narrators and wording without inheriting incompatible riwayah references');
