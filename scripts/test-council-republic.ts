import assert from 'node:assert/strict';
import { createScenarioState } from '../src/game/scenarios';
import {
  CEC_SEATS,
  COUNCIL_CONGRESS_SEATS,
  buildCecSeats,
  buildCongressSeats,
  buildCouncilGovernment,
  getCouncilChips,
} from '../src/game/rules/councilRepublic';
import { councilRepublicTransition } from '../src/game/events/council_republic';
import { calculateMonthlyEventQueue } from '../src/game/rules/monthlyPipeline';
import { MINISTER_COSTS } from '../src/game/rules/ministerAllocation';

const base = createScenarioState('1931', 'normal', 'zh');
const congress = buildCongressSeats(base);
assert.equal(
  Object.values(congress).reduce((sum, seats) => sum + seats, 0),
  COUNCIL_CONGRESS_SEATS,
  'The Congress of Councils must contain 400 seats.',
);
assert(congress.CNT > 0, 'The CNT must have a union delegation in the Congress.');

const cec = buildCecSeats(congress);
assert.equal(
  Object.values(cec).reduce((sum, seats) => sum + seats, 0),
  CEC_SEATS,
  'The CEC must contain 81 seats.',
);
assert.equal(
  getCouncilChips({ ...cec, CNT: 21 }, 'CNT'),
  Math.floor((21 / CEC_SEATS) * 100),
  'CNT leverage must be its CEC seat share of the 100-point commissariat budget.',
);

const government = buildCouncilGovernment(base);
assert.equal(government.polity?.type, 'council_republic');
assert.equal(government.government?.type, 'Council Republic');
assert.equal(government.ministers && Object.keys(government.ministers).length, 12);
assert.equal(
  Object.keys(government.ministers ?? {}).every((office) => office in MINISTER_COSTS),
  true,
  'Every commissariat must map to a known portfolio.',
);

const settled: typeof base = {
  ...base,
  asturiasVictory: {
    regime: 'council_republic',
    completedAt: { year: base.year, month: base.month },
  },
};
assert.equal(
  councilRepublicTransition.condition?.(settled),
  true,
  'A completed Council Republic settlement must queue the transition.',
);
const queued = calculateMonthlyEventQueue(settled, settled, settled.year, settled.month);
assert(
  queued.some((event) => event.id === 'council_republic_transition'),
  'The monthly event queue must surface the Council Republic transition.',
);
const transition = councilRepublicTransition.options[0].effect(settled);
const next = { ...settled, ...transition };
assert.equal(next.polity?.type, 'council_republic');
assert.equal(next.government?.type, 'Council Republic');
assert(
  next.currentEvent?.id === 'minister_allocation' || next.leverage === 0,
  'A CNT with enough leverage must open the commissar allocation; otherwise it stays outside.',
);
const councilWithDueElection = {
  ...next,
  year: 1937,
  month: 11,
  generalElectionSchedule: {
    ...next.generalElectionSchedule,
    nextElectionAt: { year: 1937, month: 11 },
  },
};
const councilQueue = calculateMonthlyEventQueue(
  councilWithDueElection,
  councilWithDueElection,
  1937,
  11,
);
assert.equal(
  councilQueue.some((event) => event.id === 'elections_1933'
    || event.id === 'elections_1936'
    || event.id === 'general_election_campaign'),
  false,
  'A Council Republic must not queue parliamentary elections.',
);

const noCnt = {
  ...base,
  unionShare: {
    CNT: 0, UGT: 0, UR: 0, ELA: 0, CNCA: 0, CONS: 0, other: 0, unorganized: 100,
  },
  classes: Object.fromEntries(
    Object.entries(base.classes).map(([classId, classState]) => [
      classId,
      {
        ...classState,
        support: Object.fromEntries(
          Object.entries(classState.support).map(([party, support]) => [
            party,
            party === 'CNT_FAI' ? 0 : support,
          ]),
        ),
      },
    ]),
  ) as typeof base.classes,
};
const noCntGovernment = buildCouncilGovernment(noCnt);
assert.equal(getCouncilChips(buildCecSeats(buildCongressSeats(noCnt)), 'CNT'), 0);
assert.equal(noCntGovernment.leverage, 0);
assert.equal(noCntGovernment.cntStance, 'cooperate');

console.log('council republic tests passed');
