import assert from 'node:assert/strict';
import {displayRawi,shortReadingLabel,shortQariName} from '../legacy/lib/qurra';
assert.equal(shortReadingLabel('nafi','ورش'),'ورش عن نافع');
assert.equal(displayRawi('abiamr','حفص الدوري'),'الدوري');
assert.equal(displayRawi('kisai','حفص الدوري'),'حفص الدوري');
assert.equal(displayRawi('kisai','الدوري'),'حفص الدوري');
assert.equal(displayRawi('hamza','خلف'),'خلف');
assert.equal(shortQariName('khalaf'),'خلف البزار');
console.log('PASS: permanent compact reader/narrator naming conventions');
