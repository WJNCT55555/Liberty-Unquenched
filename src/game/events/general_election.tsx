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

const generalElectionRootMeta = {
  category: 'politics' as const,
  flow: 'inline.root' as const,
  series: ['elections', 'general_election'],
  tags: ['election', 'repeatable'],
};

export const generalElectionLeafMeta = {
  ...generalElectionRootMeta,
  flow: 'inline.leaf' as const,
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
    text: 'Negotiate a joint electoral pact between PRRevS and the republican left.',
    textZh: '谈判建立 PRRevS 与共和左翼的联合选举协定。',
    subtitle: 'PRRevS retains its identity but pledges its deputies to a negotiated left majority.',
    subtitleZh: 'PRRevS 保留独立身份，但承诺其议员支持谈判形成的左翼多数。',
    condition: (state) => isOrganizationEstablished(state, 'PRRevS')
      && (state.partyRelations.PSOE >= 50 || state.partyRelations.IR >= 50),
    unavailableSubtitle: () => 'Requires PRRevS and relations of at least 50 with PSOE or IR.',
    unavailableSubtitleZh: () => '需要 PRRevS 已成立，且与 PSOE 或 IR 的关系至少达到 50。',
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
  formation: 'majority' | 'negotiated' | 'minority',
  cntStanceOverride?: GameState['cntStance'],
): GameState => {
  const outcome = summarizeGeneralElection(state);
  const profile = getGovernmentProfile(coalitionId);
  const ministers = { ...state.ministers };
  for (const office of Object.keys(ministers)) {
    ministers[office as keyof typeof ministers] = profile.ministerParty;
  }
  if (coalitionId === 'workers_alliance') {
    ministers.labor = 'CNT';
    ministers.agriculture = 'CNT';
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
  en: 'The votes have been counted. Seats are compared through four non-overlapping blocs—left, center, right, and PRRevS—before parliamentary negotiations determine the government. If no bloc has 236 seats, Spain has a hung Cortes rather than an automatic victory for whichever historical coalition once won this date.',
  zh: '选票已经清点完毕。议席首先按照互不重叠的左翼、中间派、右翼和 PRRevS 四个集团进行比较，再由议会谈判决定政府。如果没有任何集团达到236席，西班牙将出现悬峙议会，而不会因为历史上某个联盟曾在这一日期获胜就自动执政。',
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
  const blocRows = [
    { id: 'left', en: 'Left', zh: '左翼', seats: outcome.blocSeats.left },
    { id: 'center', en: 'Center', zh: '中间派', seats: outcome.blocSeats.center },
    { id: 'right', en: 'Right', zh: '右翼', seats: outcome.blocSeats.right },
    { id: 'prrevs', en: 'PRRevS', zh: 'PRRevS', seats: outcome.blocSeats.prrevs },
  ];

  return React.createElement('div', { className: 'flex flex-col items-center w-full' },
    React.createElement(ParliamentChart, { data, width: 400, height: 200 }),
    React.createElement('div', { className: 'w-full mt-5 text-sm font-mono space-y-2' },
      ...blocRows.map((bloc) => React.createElement('div', {
        key: bloc.id,
        className: 'flex justify-between border-b border-gray-800/50 pb-1',
      },
      React.createElement('span', null, isZh ? bloc.zh : bloc.en),
      React.createElement('span', { className: 'font-bold' }, `${bloc.seats} / ${outcome.majority}`))),
      React.createElement('p', { className: 'pt-2 font-bold' }, outcome.formation === 'majority'
        ? (isZh ? '单一集团达到绝对多数。' : 'One bloc has an absolute majority.')
        : (isZh ? '悬峙议会：必须通过联盟谈判组阁。' : 'Hung Cortes: coalition negotiations are required.')),
    ),
  );
};

export const generalElectionResultOptions: GameEvent['options'] = [
  {
    text: (state) => {
      const outcome = summarizeGeneralElection(state);
      const label = COALITION_LABELS[outcome.coalitionId].en;
      if (outcome.formation === 'majority') return `${label} forms a majority government (${outcome.governingSeats} seats).`;
      if (outcome.formation === 'negotiated') return `A hung Cortes produces a negotiated ${label} government (${outcome.governingSeats} supporting seats).`;
      return `${label} attempts a minority government (${outcome.governingSeats} seats).`;
    },
    textZh: (state) => {
      const outcome = summarizeGeneralElection(state);
      const label = COALITION_LABELS[outcome.coalitionId].zh;
      if (outcome.formation === 'majority') return `${label}组建多数政府（${outcome.governingSeats}席）。`;
      if (outcome.formation === 'negotiated') return `悬峙议会通过谈判产生${label}政府（${outcome.governingSeats}席支持）。`;
      return `${label}尝试组建少数政府（${outcome.governingSeats}席）。`;
    },
    subtitle: 'Accept the parliamentary result and install the default viable government.',
    subtitleZh: '接受议会结果并组建默认的可行政府。',
    effect: (state) => {
      const outcome = summarizeGeneralElection(state);
      return {
        ...installElectionGovernment(state, outcome.coalitionId, outcome.formation),
        currentEvent: null,
      };
    },
  },
  {
    text: 'PRRevS offers confidence and supply to a left cabinet while remaining outside government.',
    textZh: 'PRRevS 向左翼内阁提供信任与预算支持，但不加入政府。',
    subtitle: 'Available after an independent PRRevS campaign when its deputies can complete a left majority.',
    subtitleZh: 'PRRevS 独立参选且其议员足以补足左翼多数时可用。',
    condition: (state) => {
      const outcome = summarizeGeneralElection(state);
      return outcome.formation !== 'majority'
        && state.generalElectionSchedule.participation === 'prrevs_independent'
        && outcome.prrevsConfidenceSupportPossible;
    },
    unavailableSubtitle: () => 'Requires a hung Cortes and enough PRRevS seats to support the left.',
    unavailableSubtitleZh: () => '需要悬峙议会，且 PRRevS 议席足以支持左翼形成多数。',
    effect: (state) => {
      const leftCoalition: CoalitionId = state.year >= 1935 || state.crossroads_choice === 'popular_front'
        ? 'popular_front'
        : 'republican_socialist';
      return {
        ...installElectionGovernment(state, leftCoalition, 'negotiated', 'cooperate'),
        currentEvent: null,
      };
    },
  },
  {
    text: 'Demand a Workers’ Alliance cabinet with CNT ministers as the price of a majority.',
    textZh: '要求组建包含 CNT 部长的工人联盟内阁，以此作为多数支持的条件。',
    subtitle: 'Available when PRRevS and the parliamentary labor left together hold a majority.',
    subtitleZh: 'PRRevS 与议会工人左翼合计达到多数时可用。',
    condition: (state) => {
      const outcome = summarizeGeneralElection(state);
      return outcome.formation !== 'majority'
        && state.generalElectionSchedule.participation === 'prrevs_independent'
        && outcome.prrevsCabinetPossible;
    },
    unavailableSubtitle: () => 'Requires a hung Cortes and a PRRevS-labor majority.',
    unavailableSubtitleZh: () => '需要悬峙议会以及 PRRevS—工人左翼多数。',
    effect: (state) => ({
      ...installElectionGovernment(state, 'workers_alliance', 'negotiated', 'govern'),
      factions: adjustFactionDissents(state.factions, { Faistas: 20, Puristas: 25 }),
      currentEvent: null,
    }),
  },
];

export const generalElectionResults: GameEvent = {
  id: 'general_election_results',
  meta: generalElectionLeafMeta,
  condition: () => false,
  title: (state) => `Results of the ${state.year} General Election`,
  titleZh: (state) => `${state.year}年大选结果`,
  description: generalElectionResultDescription.en,
  descriptionZh: generalElectionResultDescription.zh,
  renderContent: renderGeneralElectionResults,
  options: generalElectionResultOptions,
};
