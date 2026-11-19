import assert from 'node:assert/strict';
import {roundedSanadConnector as round} from '../legacy/lib/roundedSanadConnector';
assert.equal(round('M0 0 V100'),'M0 0 V100');
assert.equal(round('M0 0 V40 H60 V80'),'M0 0 L0 33 Q0 40 7 40 L53 40 Q60 40 60 47 L60 80');
assert.equal(round('M0 0 V2 H2 V4'),'M0 0 L0 1 Q0 2 1 2 L1 2 Q2 2 2 3 L2 4');
assert.equal(round('M0 0 L10 20 L20 30'),'M0 0 L10 20 L20 30','unsupported non-orthogonal input stays unchanged');
assert.equal(round('M0 0 C1 2 3 4 5 6'),'M0 0 C1 2 3 4 5 6');
assert.match(round('M-10.5 4 V30 H90'),/^M-10.5 4 .* L90 30$/,'exact source and target ports remain unchanged');
console.log('PASS rounded sanad corridors retain endpoint ports, bound corner radius and preserve unsupported geometry');
