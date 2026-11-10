import assert from 'node:assert/strict';
import {
  FIRST_ELECTION_MINISTER_LEVERAGE,
  MINISTER_COSTS,
  MINISTER_MINIMUM_COST,
  TOTAL_CORTES_SEATS,
  TOTAL_MINISTER_COST,
  getMinisterLeverage,
} from '../src/game/rules/ministerAllocation';
import { POST_1933_CORTES_SEATS } from '../src/game/utils/election';

assert.equal(Object.keys(MINISTER_COSTS).length, 12, 'There must be 12 cabinet portfolios.');
assert.equal(TOTAL_MINISTER_COST, 100, 'The canonical cabinet cost must total 100.');
assert.equal(TOTAL_CORTES_SEATS, 470, 'The 1931 Constituent Cortes had 470 seats.');
assert.equal(POST_1933_CORTES_SEATS, 473, 'The 1933 and 1936 Cortes had 473 seats.');
assert.equal(MINISTER_MINIMUM_COST, 5, 'The cheapest portfolio costs 5 leverage.');

assert.equal(getMinisterLeverage({}, true), FIRST_ELECTION_MINISTER_LEVERAGE);
assert.equal(getMinisterLeverage({ PRRevS: 0 }, true), 15);
assert.equal(getMinisterLeverage({ PRRevS: 0 }), 0);
assert.equal(getMinisterLeverage({}), 0);
assert.equal(getMinisterLeverage({ PRRevS: 1 }), 0);
assert.equal(getMinisterLeverage({ PRRevS: 47 }), 10);
assert.equal(getMinisterLeverage({ PRRevS: 94 }), 20);
assert.equal(getMinisterLeverage({ PRRevS: 236 }), 50);
assert.equal(getMinisterLeverage({ PRRevS: 470 }), 100);
assert.equal(getMinisterLeverage({ PRRevS: 469 }), 99);

// 1933/1936: 473 seats, so the same seat share is slightly cheaper.
assert.equal(getMinisterLeverage({ PRRevS: 47 }, false, POST_1933_CORTES_SEATS), 9);
assert.equal(getMinisterLeverage({ PRRevS: 94 }, false, POST_1933_CORTES_SEATS), 19);
assert.equal(getMinisterLeverage({ PRRevS: 236 }, false, POST_1933_CORTES_SEATS), 49);
assert.equal(getMinisterLeverage({ PRRevS: 473 }, false, POST_1933_CORTES_SEATS), 100);

console.log('minister allocation tests passed');
