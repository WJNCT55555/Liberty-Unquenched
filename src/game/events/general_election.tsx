import React from 'react';
import type {
  CoalitionId,
  GameEvent,
  GameState,
  GeneralElectionParticipation,
  MinisterParty,
} from '../types';
import { ParliamentChart } from '../../components/ParliamentChart';
import { PARTY_COLORS } from '../constants';
import { getPartyName } from '../partyNames';
import { getParliamentSeatEntries } from '../parliamentOrder';
import {
  adjustClassSupport,
  adjustFactionDissents,
  adjustFactionInfluence,
  enterCaretakerAfterFailedElection,
  formRulingCoalitionFromElection,
  summarizeGeneralElection,
} from '../utils';
import {
  getDueGeneralElectionKind,
  setGeneralElectionParticipation,
} from '../rules/electionSchedule';
import { isOrganizationEstablished } from '../organizations';
import { applyUnionShareDelta } from '../unions';
import { clampLawLevel } from '../lawStances';
import { MINISTER_ALLOCATION_LEVERAGE, ministerAllocation } from './elections_1931_results';

const generalElectionRootMeta = {
  category: 'politics' as const,
  flow: 'inline.root' as const,
  series: ['elections', 'general_election'],
  tags: ['election', 'repeatable'],
};

const generalElectionResultMeta = {
  ...generalElectionRootMeta,
  flow: 'inline.node' as const,
};

const queueElectionResults = (
  state: GameState,
  participation: GeneralElectionParticipation,
  changes: Partial<GameState>,
): Partial<GameState> => ({
  ...changes,
  generalElectionSchedule: setGeneralElectionParticipation(state, participation),
  pendingEvents: [
    { ...generalElectionResults },
    ...state.pendingEvents.filter((event) => event.id !== generalElectionResults.id),
  ],
});

export const generalElectionCampaignOptions: GameEvent['options'] = [
  {
    text: 'Maintain complete abstention. The social revolution is not built in parliament.',
    textZh: '坚持全面弃权。社会革命绝不会诞生于议会。',
    subtitle: 'CNT voters stay outside the ballot; the anti-parliamentary factions gain influence.',
    subtitleZh: 'CNT 选民不参加投票；反议会派系的影响力上升。',
    effect: (state) => queueElectionResults(state, 'abstain', {
      cntStance: 'oppose',
      cntVotingRate: Math.max(0, state.cntVotingRate - 25),
      factions: adjustFactionInfluence(state.factions, 'Faistas', 10),
      stats: {
        ...state.stats,
        revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 10),
      },
    }),
  },
  {
    text: 'Mobilize tactically for the republican left without entering its lists.',
    textZh: '在不加入其候选名单的前提下，战术性动员支持共和左翼。',
    subtitle: 'CNT votes are transferred only to friendly left parties; this is cooperation, not a PRRevS candidacy.',
    subtitleZh: 'CNT 选票只流向关系友好的左翼政党；这是选举合作，而不是 PRRevS 独立参选。',
    effect: (state) => {
      let classes = adjustClassSupport(state.classes, 'Obreros', 'PSOE', 8);
      classes = adjustClassSupport(classes, 'PequenaBurguesia', 'IR', 4);
      return queueElectionResults(state, 'support_left', {
        classes,
        cntStance: 'cooperate',
        cntVotingRate: Math.min(100, state.cntVotingRate + 20),
        factions: adjustFactionInfluence(state.factions, 'Treintistas', 8),
        stats: {
          ...state.stats,
          revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 5),
        },
      });
    },
  },
  {
    text: 'Run an independent PRRevS list under our own programme.',
    textZh: '以我们自己的纲领推出 PRRevS 独立候选名单。',
    subtitle: 'PRRevS keeps its own seats and may negotiate after a hung election.',
    subtitleZh: 'PRRevS 保留自己的议席，并可在悬峙议会出现后参与谈判。',
    condition: (state) => isOrganizationEstablished(state, 'PRRevS'),
    unavailableSubtitle: () => 'Requires the PRRevS to be formed.',
    unavailableSubtitleZh: () => '需要先成立 PRRevS。',
    effect: (state) => queueElectionResults(state, 'prrevs_independent', {
      cntStance: 'cooperate',
      cntVotingRate: Math.min(100, state.cntVotingRate + 25),
      factions: adjustFactionDissents(state.factions, { Faistas: 12, Puristas: 15 }),
      stats: {
        ...state.stats,
        bureaucratization: Math.min(100, state.stats.bureaucratization + 5),
      },
    }),
  },
  {
    text: 'Contest the election through the already-formed Workers’ Alliance.',
    textZh: '通过已经成立的工人联盟参加选举。',
    subtitle: 'PRRevS retains its identity while its seats count toward the formal Workers’ Alliance total.',
    subtitleZh: 'PRRevS 保留独立身份，其议席计入正式工人联盟的总席位。',
    condition: (state) => isOrganizationEstablished(state, 'PRRevS')
      && state.activeCoalitions.some(coalition => coalition.activeId === 'workers_alliance')
      && (state.partyRelations.PSOE >= 50 || state.partyRelations.IR >= 50),
    unavailableSubtitle: () => 'Requires PRRevS, a formally established Workers’ Alliance, and relations of at least 50 with PSOE or IR.',
    unavailableSubtitleZh: () => '需要 PRRevS 与工人联盟均已正式成立，且与 PSOE 或 IR 的关系至少达到 50。',
    effect: (state) => queueElectionResults(state, 'prrevs_left_alliance', {
      cntStance: 'cooperate',
      cntVotingRate: Math.min(100, state.cntVotingRate + 15),
      factions: adjustFactionDissents(state.factions, { Faistas: 15, Puristas: 20 }),
      partyRelations: {
        ...state.partyRelations,
        PSOE: Math.min(100, state.partyRelations.PSOE + 8),
        IR: Math.min(100, state.partyRelations.IR + 8),
      },
    }),
  },
];

export const generalElectionCampaign: GameEvent = {
  id: 'general_election_campaign',
  meta: generalElectionRootMeta,
  condition: (state) => getDueGeneralElectionKind(state) === 'general',
  repeatable: true,
  title: (state) => `${state.year} General Election`,
  titleZh: (state) => `${state.year}年大选`,
  description: 'The constitutional election date has arrived. Unlike the exceptional elections of 1933 and 1936, this contest follows the political calendar produced by the actual government and crisis history of this campaign. The CNT must choose whether to abstain, support the republican left, or—if the PRRevS exists—contest the election in its own name.',
  descriptionZh: '宪政大选日期已经到来。与1933年和1936年的特殊历史选举不同，本次选举依照本局实际政府任期与危机历史所形成的政治日程举行。CNT 必须决定弃权、支持共和左翼，或者在 PRRevS 已成立时以自己的名义参选。',
  options: generalElectionCampaignOptions,
};

const COALITION_LABELS: Record<CoalitionId, { en: string; zh: string }> = {
  provisional_government: { en: 'Provisional Government', zh: '临时政府' },
  republican_socialist: { en: 'Republican-Socialist Coalition', zh: '共和—社会党联盟' },
  republican_coalition: { en: 'Republican Coalition', zh: '共和派联盟' },
  popular_front: { en: 'Popular Front', zh: '人民阵线' },
  popular_front_wartime: { en: 'Wartime Popular Front', zh: '战时人民阵线' },
  ceda_radical: { en: 'CEDA-Radical Coalition', zh: 'CEDA—激进党联盟' },
  workers_alliance: { en: "Workers' Alliance", zh: '工人联盟' },
  national_front: { en: 'National Front', zh: '国民阵线' },
};

const getGovernmentProfile = (coalitionId: CoalitionId): {
  type: string;
  typeZh: string;
  primeMinister: string;
  primeMinisterZh: string;
  ministerParty: MinisterParty;
} => {
  switch (coalitionId) {
    case 'republican_socialist':
      return { type: 'Republican-Socialist Cabinet', typeZh: '共和—社会党内阁', primeMinister: 'Manuel Azaña', primeMinisterZh: '曼努埃尔·阿萨尼亚', ministerParty: 'PSOE' };
    case 'popular_front':
      return { type: 'Popular Front Cabinet', typeZh: '人民阵线内阁', primeMinister: 'Manuel Azaña', primeMinisterZh: '曼努埃尔·阿萨尼亚', ministerParty: 'IR' };
    case 'ceda_radical':
      return { type: 'Radical-CEDA Government', typeZh: '激进党—CEDA政府', primeMinister: 'Alejandro Lerroux', primeMinisterZh: '亚历杭德罗·勒鲁', ministerParty: 'PRR' };
    case 'national_front':
      return { type: 'National Front Government', typeZh: '国家阵线政府', primeMinister: 'José María Gil-Robles', primeMinisterZh: '何塞·玛丽亚·吉尔-罗夫莱斯', ministerParty: 'AP' };
    case 'workers_alliance':
      return { type: "Workers' Alliance Cabinet", typeZh: '工人联盟内阁', primeMinister: 'Francisco Largo Caballero', primeMinisterZh: '弗朗西斯科·拉尔戈·卡巴列罗', ministerParty: 'PSOE' };
    default:
      return { type: 'Republican Coalition Cabinet', typeZh: '共和派联合内阁', primeMinister: 'Diego Martínez Barrio', primeMinisterZh: '迭戈·马丁内斯·巴里奥', ministerParty: 'PRR' };
  }
};

const installElectionGovernment = (
  state: GameState,
  coalitionId: CoalitionId,
  formation: 'majority' | 'minority',
  cntStanceOverride?: GameState['cntStance'],
): GameState => {
  const outcome = summarizeGeneralElection(state);
  const profile = getGovernmentProfile(coalitionId);
  const ministers = { ...state.ministers };
  for (const office of Object.keys(ministers)) {
    ministers[office as keyof typeof ministers] = profile.ministerParty;
  }
  const isRightGovernment = coalitionId === 'ceda_radical' || coalitionId === 'national_front';
  const unionLoss = coalitionId === 'national_front' ? 15 : coalitionId === 'ceda_radical' ? 10 : 0;
  const participation = state.generalElectionSchedule.participation;
  const cntStance = cntStanceOverride
    || (coalitionId === 'workers_alliance'
      ? 'govern'
      : isRightGovernment || participation === 'abstain'
        ? 'oppose'
        : 'cooperate');
  const baseState: GameState = {
    ...state,
    cortes: outcome.cortes,
    cntStance,
    ministers,
    ...(cntStance === 'govern' ? {
      leverage: MINISTER_ALLOCATION_LEVERAGE,
      pendingEvents: [
        { ...ministerAllocation },
        ...state.pendingEvents.filter((event) => event.id !== ministerAllocation.id),
      ],
    } : {}),
    government: {
      ...state.government,
      type: profile.type,
      typeZh: profile.typeZh,
      primeMinister: profile.primeMinister,
      primeMinisterZh: profile.primeMinisterZh,
    },
    domesticPolicy: isRightGovernment
      ? {
          ...state.domesticPolicy,
          land_reform_progress: Math.max(0, state.domesticPolicy.land_reform_progress - (coalitionId === 'national_front' ? 30 : 20)),
          max_hours_law: clampLawLevel('max_hours_law', state.domesticPolicy.max_hours_law - 1),
          min_wage: clampLawLevel('min_wage', state.domesticPolicy.min_wage - 1),
        }
      : state.domesticPolicy,
    ...(unionLoss > 0 ? applyUnionShareDelta(state, { CNT: -unionLoss, unorganized: unionLoss }) : {}),
  };
  const elected = formRulingCoalitionFromElection(baseState, coalitionId);
  return formation === 'minority'
    ? {
        ...elected,
        activeCoalitions: elected.activeCoalitions.map((coalition) => (
          coalition.activeId === coalitionId ? { ...coalition, cohesion: 30 } : coalition
        )),
      }
    : elected;
};

export const generalElectionResultDescription = {
  en: 'The votes have been counted. Only political alliances that were publicly formed before the election may claim their member parties’ seats. An established alliance with 236 seats may form a majority government; otherwise the Cortes enters a separate government-formation crisis.',
  zh: '选票已经清点完毕。只有在选举前已经公开成立的政党联盟，才能汇总其成员党的议席。已成立联盟达到236席即可组建多数政府；否则议会将进入独立的组阁危机。',
};

export const renderGeneralElectionResults: NonNullable<GameEvent['renderContent']> = (state) => {
  const isZh = state.language === 'zh';
  const outcome = summarizeGeneralElection(state);
  const data = getParliamentSeatEntries(outcome.cortes).map(([party, seats]) => ({
    id: party,
    name: getPartyName(state, party, isZh),
    seats,
    color: PARTY_COLORS[party] || '#9ca3af',
  }));
  const coalitionRows = outcome.coalitionCandidates.map(candidate => ({
    id: candidate.coalitionId,
    label: COALITION_LABELS[candidate.coalitionId],
    seats: candidate.seats,
    hasMajority: candidate.hasMajority,
  }));

  return React.createElement('div', { className: 'flex flex-col items-center w-full' },
    React.createElement(ParliamentChart, { data, width: 400, height: 200 }),
    React.createElement('div', { className: 'w-full mt-5 text-sm font-mono space-y-2' },
      ...coalitionRows.map((coalition) => React.createElement('div', {
        key: coalition.id,
        className: 'flex justify-between border-b border-gray-800/50 pb-1',
      },
      React.createElement('span', null, isZh ? coalition.label.zh : coalition.label.en),
      React.createElement('span', { className: 'font-bold' }, `${coalition.seats} / ${outcome.majority}${coalition.hasMajority ? ' ✓' : ''}`))),
      ...(coalitionRows.length === 0 ? [React.createElement('p', {
        key: 'no-coalitions',
        className: 'border-b border-gray-800/50 pb-2 italic',
      }, isZh ? '没有已成立的选举联盟参加本届组阁。' : 'No established electoral alliance is available to form a government.')] : []),
      React.createElement('p', { className: 'pt-2 font-bold' }, outcome.formation === 'majority'
        ? (isZh ? '至少一个已成立联盟达到绝对多数。' : 'At least one established alliance has an absolute majority.')
        : (isZh ? '无多数议会：必须进入组阁程序。' : 'Hung Cortes: a separate government-formation decision is required.')),
    ),
  );
};

const getElectionCandidate = (state: GameState, coalitionId: CoalitionId) => (
  summarizeGeneralElection(state).coalitionCandidates.find(candidate => candidate.coalitionId === coalitionId)
);

const createMajorityCoalitionOption = (coalitionId: CoalitionId): GameEvent['options'][number] => ({
  text: (state) => {
    const candidate = getElectionCandidate(state, coalitionId);
    return `${COALITION_LABELS[coalitionId].en} forms a majority government (${candidate?.seats ?? 0} seats).`;
  },
  textZh: (state) => {
    const candidate = getElectionCandidate(state, coalitionId);
    return `${COALITION_LABELS[coalitionId].zh}组建多数政府（${candidate?.seats ?? 0}席）。`;
  },
  subtitle: 'The alliance was formed before the election and now controls an absolute majority.',
  subtitleZh: '该联盟已在选举前成立，并在本届议会取得绝对多数。',
  condition: (state) => getElectionCandidate(state, coalitionId)?.hasMajority === true,
  unavailableSubtitle: (state) => {
    const candidate = getElectionCandidate(state, coalitionId);
    return candidate
      ? `The alliance has ${candidate.seats} seats; ${summarizeGeneralElection(state).majority} are required.`
      : 'This alliance was not formally established before the election.';
  },
  unavailableSubtitleZh: (state) => {
    const candidate = getElectionCandidate(state, coalitionId);
    return candidate
      ? `该联盟拥有${candidate.seats}席，需要${summarizeGeneralElection(state).majority}席。`
      : '该联盟没有在选举前正式成立。';
  },
  effect: (state) => {
    const elected = installElectionGovernment(
      state,
      coalitionId,
      'majority',
      coalitionId === 'workers_alliance' ? 'govern' : undefined,
    );
    return {
      ...elected,
      ...(coalitionId === 'workers_alliance'
        ? { factions: adjustFactionDissents(elected.factions, { Faistas: 20, Puristas: 25 }) }
        : {}),
      currentEvent: null,
    };
  },
});

export const generalElectionResultOptions: GameEvent['options'] = [
  createMajorityCoalitionOption('popular_front'),
  createMajorityCoalitionOption('ceda_radical'),
  createMajorityCoalitionOption('workers_alliance'),
  createMajorityCoalitionOption('national_front'),
  {
    text: 'No established alliance has an absolute majority. Open government-formation talks.',
    textZh: '没有已成立联盟取得绝对多数。进入组阁程序。',
    subtitle: 'The largest alliance may attempt a minority cabinet only if it controls more than one third of the Cortes; otherwise a repeat election is required.',
    subtitleZh: '只有最大联盟掌握超过三分之一议席时，才能尝试组建少数政府；否则必须重新大选。',
    condition: (state) => summarizeGeneralElection(state).majorityCoalitionIds.length === 0,
    unavailableSubtitle: () => 'At least one established alliance already has an absolute majority.',
    unavailableSubtitleZh: () => '至少一个已成立联盟已经取得绝对多数。',
    effect: (state) => {
      const outcome = summarizeGeneralElection(state);
      return {
        cortes: outcome.cortes,
        currentEvent: hungParliamentFormation,
      };
    },
  },
];

const hungParliamentMeta = {
  category: 'politics' as const,
  flow: 'inline.leaf' as const,
  series: ['elections', 'government_formation'],
  tags: ['election'],
};

export const hungParliamentFormation: GameEvent = {
  id: 'hung_parliament_formation',
  meta: hungParliamentMeta,
  condition: () => false,
  title: 'No Majority in the Cortes',
  titleZh: '议会无多数',
  description: 'No established alliance controls an absolute majority. As a simulation rule—not a literal requirement of the 1931 Constitution—the President may invite the largest alliance to attempt a minority cabinet only if it holds more than one third of the Cortes. If that minimum is not met—or if no cabinet is accepted—the outgoing administration remains in a caretaker capacity and a repeat election is called for next month.',
  descriptionZh: '没有已成立联盟掌握绝对多数。作为游戏中的可治理性规则——而不是1931年宪法的原文要求——只有当最大联盟控制超过三分之一议席时，总统才能邀请其尝试组建少数政府。如果达不到这一最低门槛，或者拒绝组阁，原行政班子将以看守身份留任，并于下月重新举行大选。',
  options: [
    {
      text: (state) => {
        const outcome = summarizeGeneralElection(state);
        const coalitionId = outcome.leadingCoalitionId;
        return coalitionId
          ? `Allow the ${COALITION_LABELS[coalitionId].en} to form a minority government (${outcome.governingSeats} seats).`
          : 'No alliance can be invited to form a minority government.';
      },
      textZh: (state) => {
        const outcome = summarizeGeneralElection(state);
        const coalitionId = outcome.leadingCoalitionId;
        return coalitionId
          ? `允许${COALITION_LABELS[coalitionId].zh}组建少数政府（${outcome.governingSeats}席）。`
          : '没有联盟可以受邀组建少数政府。';
      },
      subtitle: 'Requires the largest established alliance to control strictly more than one third of all seats.',
      subtitleZh: '要求最大的已成立联盟严格掌握超过全部议席的三分之一。',
      condition: (state) => {
        const outcome = summarizeGeneralElection(state);
        return outcome.leadingCoalitionId !== null && outcome.governingSeats > outcome.totalSeats / 3;
      },
      unavailableSubtitle: (state) => `The largest established alliance has ${summarizeGeneralElection(state).governingSeats} seats; at least 157 are required.`,
      unavailableSubtitleZh: (state) => `最大的已成立联盟拥有${summarizeGeneralElection(state).governingSeats}席；至少需要157席。`,
      effect: (state) => {
        const outcome = summarizeGeneralElection(state);
        if (!outcome.leadingCoalitionId || outcome.governingSeats <= outcome.totalSeats / 3) return {};
        return {
          ...installElectionGovernment(state, outcome.leadingCoalitionId, 'minority'),
          currentEvent: null,
        };
      },
    },
    {
      text: 'No government can be formed. Call a repeat election next month.',
      textZh: '无法组建政府。下月重新举行大选。',
      subtitle: 'The outgoing ministers remain only as caretakers; no political alliance controls the cabinet.',
      subtitleZh: '原部长仅以看守身份留任；没有政党联盟控制内阁。',
      effect: (state) => {
        const outcome = summarizeGeneralElection(state);
        return {
          ...enterCaretakerAfterFailedElection({ ...state, cortes: outcome.cortes }),
          currentEvent: null,
        };
      },
    },
  ],
};

export const generalElectionResults: GameEvent = {
  id: 'general_election_results',
  meta: generalElectionResultMeta,
  condition: () => false,
  title: (state) => `Results of the ${state.year} General Election`,
  titleZh: (state) => `${state.year}年大选结果`,
  description: generalElectionResultDescription.en,
  descriptionZh: generalElectionResultDescription.zh,
  renderContent: renderGeneralElectionResults,
  options: generalElectionResultOptions,
};
