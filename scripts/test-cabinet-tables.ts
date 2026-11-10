import assert from 'node:assert/strict';
import { HISTORICAL_CABINETS, getCabinetTable } from '../src/game/events/cabinetTables';

const offices = [
  'labor', 'health', 'justice', 'industry', 'commerce', 'interior',
  'war', 'agriculture', 'education', 'publicWorks', 'finance', 'estado',
] as const;

for (const [profile, cabinet] of Object.entries(HISTORICAL_CABINETS)) {
  assert.deepEqual(
    Object.keys(cabinet).sort(),
    [...offices].sort(),
    `${profile} must define all 12 portfolios.`,
  );
  if (profile !== 'prrevs_parliamentary_majority') {
    assert.equal(
      Object.values(cabinet).includes('CNT'),
      false,
      `${profile} must not preset a CNT portfolio.`,
    );
  }
}

assert.equal(
  Object.values(HISTORICAL_CABINETS.popular_front).includes('CNT'),
  false,
  'The peacetime Popular Front must not preset a CNT portfolio.',
);
assert.equal(
  Object.values(HISTORICAL_CABINETS.workers_alliance).includes('CNT'),
  false,
  'The Workers’ Alliance must not preset a CNT portfolio.',
);
assert.equal(
  Object.values(HISTORICAL_CABINETS.national_front).includes('CNT'),
  false,
  'The National Front must not preset a CNT portfolio.',
);
assert.equal(
  Object.values(HISTORICAL_CABINETS.prrevs_parliamentary_majority).every(party => party === 'CNT'),
  true,
  'A PRRevS single-party majority government is entirely CNT.',
);
assert.equal(getCabinetTable('ceda_radical'), HISTORICAL_CABINETS.radical_ceda);
assert.equal(getCabinetTable('popular_front'), HISTORICAL_CABINETS.popular_front);
assert.equal(getCabinetTable('national_front'), HISTORICAL_CABINETS.national_front);
assert.equal(getCabinetTable('workers_alliance'), HISTORICAL_CABINETS.workers_alliance);
assert.equal(getCabinetTable('prrevs_parliamentary_majority'), HISTORICAL_CABINETS.prrevs_parliamentary_majority);

console.log('cabinet table tests passed');
