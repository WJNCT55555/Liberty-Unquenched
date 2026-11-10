import assert from 'node:assert/strict';
import { createScenarioState } from '../src/game/scenarios';
import { buildCommuneGovernment } from '../src/game/rules/communeFederation';
import {
  communeCoordinationCouncil,
  communeFederationTransition,
  communeStrategyCard,
  communeStrategyEvent,
} from '../src/game/events/commune_federation';
import { calculateMonthlyEventQueue } from '../src/game/rules/monthlyPipeline';

const base = createScenarioState('1931', 'normal', 'zh');
const union = buildCommuneGovernment(base, 'union_primacy');
assert.equal(union.polity?.type, 'free_commune_federation');
assert.equal(union.polity?.committeeStrategy, 'union_primacy');
assert.equal(union.government?.type, 'Free Commune Federation');
assert.equal(union.government?.president, '—');
assert.equal(union.government?.primeMinister, '—');
assert.equal(
  Object.values(union.polity?.congressSeats ?? {}).reduce((sum, seats) => sum + seats, 0),
  400,
  'The Federal Congress must contain 400 seats.',
);
assert.equal(
  union.polity?.cecSeats,
  undefined,
  'The Commune Federation must not create a separate Federal Council chamber.',
);
const unionMinisters = union.ministers!;
assert.equal(
  Object.values(unionMinisters).filter((party) => party === 'CNT').length,
  9,
  'Union primacy must give the CNT nine commissions.',
);
assert.equal(
  Object.keys(union.polity?.commissionFactions ?? {}).length,
  9,
  'Every CNT commission must have a named CNT tendency.',
);

const commune = buildCommuneGovernment(base, 'commune_primacy');
assert.equal(Object.values(commune.ministers!).filter((party) => party === 'CNT').length, 7);
const front = buildCommuneGovernment(base, 'united_front');
assert.equal(Object.values(front.ministers!).filter((party) => party === 'CNT').length, 6);

const settled = {
  ...base,
  asturiasVictory: {
    regime: 'free_commune_federation' as const,
    completedAt: { year: base.year, month: base.month },
  },
};
assert.equal(communeFederationTransition.condition?.(settled), true);
const queue = calculateMonthlyEventQueue(settled, settled, settled.year, settled.month);
assert(
  queue.some((event) => event.id === 'commune_federation_transition'),
  'The Commune Federation transition must enter the monthly queue.',
);
const transition = communeFederationTransition.options[0].effect(settled);
const next = { ...settled, ...transition };
assert.equal(next.polity?.type, 'free_commune_federation');
assert.equal(next.government?.president, '—');
assert.equal(next.government?.primeMinister, '—');

assert.equal(communeStrategyCard.type, 'Government');
assert.equal(communeStrategyCard.resourceCost, 1);
assert.equal(communeStrategyEvent.options.length, 4);
const strategy = communeStrategyEvent.options[1].effect(next);
assert.equal(strategy.polity?.committeeStrategy, 'union_primacy');
assert.equal(strategy.currentEvent?.id, communeCoordinationCouncil.id);

const composed = communeCoordinationCouncil.options[0].effect({
  ...next,
  ...strategy,
  polity: {
    ...next.polity!,
    ...strategy.polity,
  },
});
assert.equal(composed.polity?.committeeStrategy, 'union_primacy');
assert.equal(composed.government?.type, 'Free Commune Federation');
assert.equal(composed.currentEvent, null);

console.log('commune federation tests passed');
