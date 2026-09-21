import assert from 'node:assert/strict';
import { createScenarioState } from '../src/game/scenarios';
import {
  formatGeneralElectionViewModel,
  selectGeneralElectionViewModel,
} from '../src/game/selectors';
import {
  checkCoalitionDissolve,
  formRulingCoalitionFromElection,
} from '../src/game/utils/coalition';
import {
  GENERAL_ELECTION_BLOC_PARTIES,
  calculateRawVotes,
  summarizeGeneralElection,
} from '../src/game/utils/election';
import { getDueGeneralElectionKind } from '../src/game/rules/electionSchedule';
import { calculateMonthlyEventQueue } from '../src/game/rules/monthlyPipeline';
import { elections1933 } from '../src/game/events/elections_1933';
import { elections1936 } from '../src/game/events/elections_1936';
import {
  generalElectionCampaign,
  generalElectionCampaignOptions,
} from '../src/game/events/general_election';
import { presidentialDissolutionOfCortes } from '../src/game/events/presidential_dissolution';
import { setOrganizationEstablished } from '../src/game/organizations';
import type { Party } from '../src/game/types';

const initial1931 = createScenarioState('1931', 'normal', 'en');
assert.deepEqual(initial1931.generalElectionSchedule, {
  lastElectionAt: null,
  nextElectionAt: { year: 1931, month: 6 },
  reason: 'constituent',
});

const elected1931 = formRulingCoalitionFromElection(
  { ...initial1931, year: 1931, month: 6 },
  'republican_socialist',
);
assert.deepEqual(elected1931.generalElectionSchedule, {
  lastElectionAt: { year: 1931, month: 6 },
  nextElectionAt: { year: 1935, month: 6 },
  reason: 'term_expiry',
});
assert.equal(
  formatGeneralElectionViewModel(selectGeneralElectionViewModel(elected1931), false),
  'June 1935 (4-Year Term)',
);
const stableNovember1933 = { ...elected1931, year: 1933, month: 11 };
assert.equal(getDueGeneralElectionKind(stableNovember1933), null);
assert.equal(elections1933.condition?.(stableNovember1933), false, 'A stable first legislature must not be forced into the historical 1933 election.');
const stableTermElection = { ...elected1931, year: 1935, month: 6 };
assert.equal(getDueGeneralElectionKind(stableTermElection), 'general');
assert.equal(generalElectionCampaign.condition?.(stableTermElection), true);
assert.equal(elections1933.condition?.(stableTermElection), false);
assert.equal(elections1936.condition?.(stableTermElection), false);

const collapsed1933 = checkCoalitionDissolve({
  ...elected1931,
  year: 1933,
  month: 1,
  activeCoalitions: elected1931.activeCoalitions.map((coalition) => (
    coalition.activeId === 'republican_socialist'
      ? { ...coalition, cohesion: 0 }
      : coalition
  )),
});
assert.deepEqual(collapsed1933.generalElectionSchedule, {
  lastElectionAt: { year: 1931, month: 6 },
  nextElectionAt: { year: 1933, month: 11 },
  reason: 'government_crisis',
  crisis: {
    coalitionId: 'republican_socialist',
    sequence: 1,
  },
});
assert.equal(
  formatGeneralElectionViewModel(selectGeneralElectionViewModel(collapsed1933), true),
  '1933年11月 (因内阁危机提前大选)',
);
const dissolved = presidentialDissolutionOfCortes.options[0].effect(collapsed1933);
assert.equal(dissolved.earlyElectionInProgress, true);
assert.equal(dissolved.dissolutionCount, 1);
assert.equal(dissolved.pendingEvents, undefined, 'Dissolution must wait for the scheduled election date.');
const historical1933 = {
  ...collapsed1933,
  ...dissolved,
  year: 1933,
  month: 11,
};
assert.equal(getDueGeneralElectionKind(historical1933), 'historical_1933');
assert.equal(elections1933.condition?.(historical1933), true);
assert.equal(generalElectionCampaign.condition?.(historical1933), false);
const historicalAbstention = elections1933.options[0].effect(historical1933);
assert.equal(
  summarizeGeneralElection({ ...historical1933, ...historicalAbstention }).coalitionId,
  'ceda_radical',
  'The historical 1933 abstention route must leave a viable CEDA-Radical majority.',
);
const antiRightMobilization = elections1933.options[1].effect(historical1933);
assert.notEqual(
  summarizeGeneralElection({ ...historical1933, ...antiRightMobilization }).coalitionId,
  'ceda_radical',
  'CNT electoral intervention must be capable of averting the historical 1933 outcome.',
);

const immediateCrisis = {
  ...collapsed1933,
  year: 1934,
  month: 4,
  generalElectionSchedule: {
    ...collapsed1933.generalElectionSchedule,
    nextElectionAt: { year: 1934, month: 4 },
  },
};
const crisisQueue = calculateMonthlyEventQueue(
  { ...immediateCrisis, year: 1934, month: 3 },
  immediateCrisis,
  1934,
  4,
);
assert.equal(crisisQueue[0]?.id, 'presidential_dissolution_of_cortes');
assert.equal(crisisQueue.some((event) => event.id === 'general_election_campaign'), false);

const initial1933 = createScenarioState('1933', 'normal', 'en');
assert.deepEqual(initial1933.generalElectionSchedule, {
  lastElectionAt: { year: 1933, month: 11 },
  nextElectionAt: { year: 1937, month: 11 },
  reason: 'term_expiry',
});
assert.equal(initial1933.governmentCrisisSequence, 1);
const collapsed1936 = checkCoalitionDissolve({
  ...initial1933,
  year: 1935,
  month: 11,
  activeCoalitions: initial1933.activeCoalitions.map((coalition) => (
    coalition.activeId === 'ceda_radical' ? { ...coalition, cohesion: 0 } : coalition
  )),
});
assert.equal(collapsed1936.generalElectionSchedule.crisis?.sequence, 2);
const secondDissolution = presidentialDissolutionOfCortes.options[0].effect(collapsed1936);
const historical1936 = {
  ...collapsed1936,
  ...secondDissolution,
  year: 1936,
  month: 2,
};
assert.equal(getDueGeneralElectionKind(historical1936), 'historical_1936');
assert.equal(elections1936.condition?.(historical1936), true);
assert.equal(generalElectionCampaign.condition?.(historical1936), false);
const absoluteAbstention1936 = elections1936.options[1].effect(historical1936);
assert.equal(summarizeGeneralElection({ ...historical1936, ...absoluteAbstention1936 }).coalitionId, 'national_front');
const amnestyMobilization1936 = elections1936.options[0].effect(historical1936);
assert.equal(summarizeGeneralElection({ ...historical1936, ...amnestyMobilization1936 }).coalitionId, 'popular_front');

const initial1936 = createScenarioState('1936', 'normal', 'zh');
assert.equal(
  formatGeneralElectionViewModel(selectGeneralElectionViewModel(initial1936), true),
  '已停摆 (内战爆发)',
);
assert.equal(initial1936.governmentCrisisSequence, 2);

const emptyCortes = Object.fromEntries(
  Object.values(GENERAL_ELECTION_BLOC_PARTIES).flat().map((party) => [party, 0]),
) as Record<Party, number>;
const hungCortes: Record<Party, number> = {
  ...emptyCortes,
  PSOE: 150,
  PRR: 100,
  AP: 150,
  PRRevS: 70,
};
const hungOutcome = summarizeGeneralElection({
  ...stableTermElection,
  generalElectionSchedule: {
    ...stableTermElection.generalElectionSchedule,
    participation: 'prrevs_independent',
  },
}, hungCortes);
assert.equal(Object.values(hungOutcome.blocSeats).reduce((sum, seats) => sum + seats, 0), 470);
assert.equal(hungOutcome.blocSeats.right, 150, 'AP seats must belong to one bloc only.');
assert.equal(hungOutcome.majorityBloc, null);
assert.equal(hungOutcome.formation, 'negotiated');

const withPrrevs = {
  ...stableTermElection,
  ...setOrganizationEstablished(stableTermElection, 'PRRevS'),
};
assert.equal(generalElectionCampaignOptions[2].condition?.(withPrrevs), true);
const independentCampaign = generalElectionCampaignOptions[2].effect(withPrrevs);
assert.equal(independentCampaign.generalElectionSchedule?.participation, 'prrevs_independent');
assert.equal(independentCampaign.pendingEvents?.[0]?.id, 'general_election_results');
const independentVotes = calculateRawVotes({ ...withPrrevs, ...independentCampaign });
assert(independentVotes.PRRevS > 0, 'An independent PRRevS campaign must retain CNT electoral votes.');
const resultState = {
  ...withPrrevs,
  ...independentCampaign,
  year: 1935,
  month: 6,
};
const resolvedElection = independentCampaign.pendingEvents?.[0]?.options[0].effect(resultState);
assert.deepEqual(resolvedElection?.generalElectionSchedule, {
  lastElectionAt: { year: 1935, month: 6 },
  nextElectionAt: { year: 1939, month: 6 },
  reason: 'term_expiry',
});
assert.equal(resolvedElection?.earlyElectionInProgress, false);
const abstentionCampaign = generalElectionCampaignOptions[0].effect(withPrrevs);
const abstentionVotes = calculateRawVotes({ ...withPrrevs, ...abstentionCampaign });
assert.equal(abstentionVotes.PRRevS, 0, 'An abstention strategy must not silently elect PRRevS deputies.');

console.log('General-election scheduling, bloc calculation, PRRevS strategy, and presentation tests passed.');
