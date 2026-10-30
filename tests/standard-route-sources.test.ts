import assert from 'node:assert/strict';
import {standardRouteSources} from '../legacy/lib/standardRouteSources';
import {scholarlyNameRanges} from '../legacy/lib/sanadTitleRanges';
import {QURRA} from '../legacy/lib/qurra';

for(const q of QURRA)for(const r of q.rawis)assert.ok(standardRouteSources(q.id,r).length,`${q.id}:${r}`);
const idris=standardRouteSources('khalaf','إدريس');
assert.equal(idris.length,2);
assert.ok(idris[0].includes('المُطَّوِّعِي'));
assert.ok(idris[1].includes('القَطِيعِي'));
const chain='عن '+idris[1]+' (ح). وقرأ سبط الخياط عن '+idris[0]+'، وقرأ المطوعي والقطيعي على إدريس';
const ranges=scholarlyNameRanges(chain,idris);
assert.equal(ranges.length,2);
assert.ok(ranges.every(x=>chain.slice(x.start,x.end).trim().startsWith('أبي')));
assert.equal(standardRouteSources('nafi').length,2);
assert.deepEqual(standardRouteSources('missing'),[]);
console.log('All twenty rawis have reviewed roles; both Idris branches match without changing chain text.');
