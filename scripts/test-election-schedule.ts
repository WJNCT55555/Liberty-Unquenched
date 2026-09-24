import assert from 'node:assert/strict';
import { createScenarioState } from '../src/game/scenarios';
import {
  formatGeneralElectionViewModel,
  selectGeneralElectionViewModel,
} from '../src/game/selectors';
import {
  checkCoalitionDissolve,
  formCoalition,
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
  MINISTER_ALLOCATION_LEVERAGE,
  elections1931Results,
  ministerAllocation,
} from '../src/game/events/elections_1931_results';
import {
  cnt_third_congress_1,
  cnt_third_congress_6,
} from '../src/game/events/cnt_third_congress';
import {
  cedaRadicalUnderstanding,
  nationalCounterrevolutionaryFront,
} from '../src/game/events/electoral_coalition_formations';
import {
  generalElectionCampaign,
  generalElectionCampaignOptions,
  generalElectionResultOptions,
  hungParliamentFormation,
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

const june1931 = { ...initial1931, year: 1931, month: 6 };
assert.equal(
  getDueGeneralElectionKind(june1931),
  null,
  'The constituent election belongs to the Third CNT Congress chain, not the generic scheduler.',
);
assert.equal(generalElectionCampaign.condition?.(june1931), false);
const june1931Queue = calculateMonthlyEventQueue(
  { ...initial1931, month: 5 },
  june1931,
  1931,
  6,
);
assert(
  june1931Queue.some((event) => event.id === cnt_third_congress_1.id),
  'The Third CNT Congress must remain the sole scheduled root for the 1931 constituent-election chain.',
);
assert.equal(
  june1931Queue.some((event) => event.id === generalElectionCampaign.id),
  false,
  'June 1931 must not enqueue a second, generic election campaign.',
);
const congressClosure = cnt_third_congress_6.options[0].effect({
  ...june1931,
  currentEvent: cnt_third_congress_6,
  pendingEvents: [],
});
assert.equal(congressClosure.pendingEvents?.[0]?.id, elections1931Results.id);
const repeatedCongressClosure = cnt_third_congress_6.options[0].effect({
  ...june1931,
  currentEvent: cnt_third_congress_6,
  pendingEvents: [{ ...elections1931Results }],
});
assert.equal(
  repeatedCongressClosure.pendingEvents?.filter((event) => event.id === elections1931Results.id).length,
  1,
  'Closing the congress must leave exactly one 1931 election-result event in the queue.',
);

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
const october1933 = {
  ...historical1933,
  ...setOrganizationEstablished({ ...historical1933, ceda_formed: true }, 'AP'),
  year: 1933,
  month: 10,
  ceda_formed: true,
};
assert.equal(cedaRadicalUnderstanding.condition?.(october1933), true);
const cedaAgreement = cedaRadicalUnderstanding.options[0].effect(october1933);
const historical1933WithAlliance = { ...historical1933, ...cedaAgreement };
const historicalAbstention = elections1933.options[0].effect(historical1933WithAlliance);
assert.equal(
  summarizeGeneralElection({ ...historical1933WithAlliance, ...historicalAbstention }).leadingCoalitionId,
  'ceda_radical',
  'The historical 1933 abstention route must leave the event-formed CEDA-Radical alliance as the leading government candidate.',
);
const cedaOutcome1933 = summarizeGeneralElection({ ...historical1933WithAlliance, ...historicalAbstention });
assert.equal(
  cedaOutcome1933.coalitionCandidates.some(candidate => candidate.coalitionId === 'ceda_radical'),
  true,
  'An alliance-formation event, rather than a year check, must expose CEDA-Radical in the election result.',
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
const withoutCeda = {
  ...historical1936,
  activeCoalitions: historical1936.activeCoalitions.filter(coalition => coalition.activeId !== 'ceda_radical'),
};
assert.equal(nationalCounterrevolutionaryFront.condition?.({ ...withoutCeda, year: 1936, month: 1 }), true);
const nationalFrontAgreement = nationalCounterrevolutionaryFront.options[0].effect({ ...withoutCeda, year: 1936, month: 1 });
const contested1936 = formCoalition({ ...withoutCeda, ...nationalFrontAgreement }, 'popular_front');
const absoluteAbstention1936 = elections1936.options[1].effect(contested1936);
const amnestyMobilization1936 = elections1936.options[0].effect(contested1936);
const abstentionOutcome1936 = summarizeGeneralElection({ ...contested1936, ...absoluteAbstention1936 });
const amnestyOutcome1936 = summarizeGeneralElection({ ...contested1936, ...amnestyMobilization1936 });
assert.deepEqual(
  new Set(abstentionOutcome1936.coalitionCandidates.map(candidate => candidate.coalitionId)),
  new Set(['popular_front', 'national_front']),
  'The 1936 result must display both event-formed electoral fronts instead of inventing either from the year.',
);
assert(
  (amnestyOutcome1936.coalitionCandidates.find(candidate => candidate.coalitionId === 'popular_front')?.seats ?? 0)
    >= (abstentionOutcome1936.coalitionCandidates.find(candidate => candidate.coalitionId === 'popular_front')?.seats ?? 0),
  'Anti-right mobilization must not reduce the Popular Front seat total.',
);

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
assert.equal(hungOutcome.formation, 'hung');
assert.equal(hungOutcome.leadingCoalitionId, null, 'Blocs must not invent an alliance that was never formed by an event.');

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
const resultStateWithPopularFront = formCoalition(resultState, 'popular_front');
const resolvedElection = independentCampaign.pendingEvents?.[0]?.options[0].effect(resultStateWithPopularFront);
assert.deepEqual(resolvedElection?.generalElectionSchedule, {
  lastElectionAt: { year: 1935, month: 6 },
  nextElectionAt: { year: 1939, month: 6 },
  reason: 'term_expiry',
});
assert.equal(resolvedElection?.earlyElectionInProgress, false);
assert.equal(
  resolvedElection?.pendingEvents?.some(event => event.id === 'coalition_dissolved_popular_front'),
  false,
  'Promoting an already-formed alliance into government must not emit a false dissolution notice for that same alliance.',
);
const resultStateWithWorkersAlliance = formCoalition(resultState, 'workers_alliance');
const cntCabinet = generalElectionResultOptions[2].effect({
  ...resultStateWithWorkersAlliance,
  pendingEvents: [],
});
assert.equal(cntCabinet.cntStance, 'govern');
assert.equal(cntCabinet.leverage, MINISTER_ALLOCATION_LEVERAGE);
assert(
  cntCabinet.pendingEvents?.some((event) => event.id === ministerAllocation.id),
  'A CNT cabinet formed after any later election must queue free ministerial allocation.',
);
assert.equal(
  Object.values(cntCabinet.ministers || {}).includes('CNT'),
  false,
  'Later elections must let the player choose CNT portfolios instead of assigning fixed ministries.',
);
const repeatElection = hungParliamentFormation.options[1].effect({
  ...resultState,
  pendingEvents: [],
});
assert.deepEqual(repeatElection.generalElectionSchedule, {
  lastElectionAt: { year: 1935, month: 6 },
  nextElectionAt: { year: 1935, month: 7 },
  reason: 'failed_formation',
});
assert.equal(repeatElection.rulingCoalition, null);
const abstentionCampaign = generalElectionCampaignOptions[0].effect(withPrrevs);
const abstentionVotes = calculateRawVotes({ ...withPrrevs, ...abstentionCampaign });
assert.equal(abstentionVotes.PRRevS, 0, 'An abstention strategy must not silently elect PRRevS deputies.');

console.log('General-election scheduling, bloc calculation, PRRevS strategy, and presentation tests passed.');
