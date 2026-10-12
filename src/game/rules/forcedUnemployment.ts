import type { GameState } from '../types';
import { getUnionShare } from '../unions';

export const FORCED_UNEMPLOYMENT_JOURNAL_ID = 'journal_forced_unemployment';
export const FORCED_UNEMPLOYMENT_DEADLINE_MONTHS = 48;
export const FORCED_UNEMPLOYMENT_STREAK_MONTHS = 3;

export type ForcedUnemploymentPledgeId =
  | 'hours_1' | 'hours_2' | 'hours_3' | 'hours_4'
  | 'unemployment_13' | 'unemployment_12' | 'unemployment_11'
  | 'minimum_wage_1' | 'land_reform_20' | 'cnt_union_20';

export interface ForcedUnemploymentMandate {
  pledgeIds: ForcedUnemploymentPledgeId[];
  chips: number;
  adoptedAt: { year: number; month: number };
  unemploymentStreak: number;
}

export interface ForcedUnemploymentPledge {
  id: ForcedUnemploymentPledgeId;
  group: 'hours' | 'unemployment' | 'additional';
  chips: number;
  text: string;
  textZh: string;
  target?: number;
}

// The hour labels deliberately follow the current law ladder. Its historical
// terminology is a separate change and must not be silently redefined here.
export const FORCED_UNEMPLOYMENT_PLEDGES: readonly ForcedUnemploymentPledge[] = [
  { id: 'hours_1', group: 'hours', chips: 1, text: 'Preserve the existing maximum-hours law (L1)', textZh: '守住现行最高工时法（L1）', target: 1 },
  { id: 'hours_2', group: 'hours', chips: 3, text: 'Enforce the urban 40-hour standard (L2)', textZh: '落实城市40小时标准（L2）', target: 2 },
  { id: 'hours_3', group: 'hours', chips: 5, text: 'Secure the strict national 40-hour standard (L3)', textZh: '争取全国严格40小时标准（L3）', target: 3 },
  { id: 'hours_4', group: 'hours', chips: 7, text: 'Win the 36-hour workweek (L4)', textZh: '争取36小时工作周（L4）', target: 4 },
  { id: 'unemployment_13', group: 'unemployment', chips: 3, text: 'Reduce unemployment to 13% or less for three months', textZh: '将失业率压至13%以下并维持三个月', target: 13 },
  { id: 'unemployment_12', group: 'unemployment', chips: 5, text: 'Reduce unemployment to 12% or less for three months', textZh: '将失业率压至12%以下并维持三个月', target: 12 },
  { id: 'unemployment_11', group: 'unemployment', chips: 7, text: 'Reduce unemployment to 11% or less for three months', textZh: '将失业率压至11%以下并维持三个月', target: 11 },
  { id: 'minimum_wage_1', group: 'additional', chips: 2, text: 'Establish at least a minimal wage law (L1)', textZh: '确立至少L1的最低工资法', target: 1 },
  { id: 'land_reform_20', group: 'additional', chips: 3, text: 'Advance land reform to 20%', textZh: '将土地改革进度推进至20%', target: 20 },
  { id: 'cnt_union_20', group: 'additional', chips: 2, text: 'Organize at least 20% of workers under the CNT', textZh: '将CNT工会份额扩大至至少20%', target: 20 },
];

const pledgeById = new Map(FORCED_UNEMPLOYMENT_PLEDGES.map(pledge => [pledge.id, pledge]));

export const getForcedUnemploymentPledge = (id: ForcedUnemploymentPledgeId): ForcedUnemploymentPledge => {
  const pledge = pledgeById.get(id);
  if (!pledge) throw new Error(`Unknown forced-unemployment pledge: ${id}`);
  return pledge;
};

export const isValidForcedUnemploymentSelection = (ids: readonly ForcedUnemploymentPledgeId[]): boolean => {
  if (new Set(ids).size !== ids.length || ids.some(id => !pledgeById.has(id))) return false;
  const groups = ids.map(id => getForcedUnemploymentPledge(id).group);
  return groups.filter(group => group === 'hours').length === 1
    && groups.filter(group => group === 'unemployment').length === 1;
};

export const getForcedUnemploymentChips = (ids: readonly ForcedUnemploymentPledgeId[]): number =>
  ids.reduce((total, id) => total + getForcedUnemploymentPledge(id).chips, 0);

export const getForcedUnemploymentTarget = (mandate: ForcedUnemploymentMandate): number => {
  const id = mandate.pledgeIds.find(pledgeId => getForcedUnemploymentPledge(pledgeId).group === 'unemployment');
  return id ? getForcedUnemploymentPledge(id).target! : 13;
};

export const getForcedUnemploymentMonthsElapsed = (state: GameState, mandate: ForcedUnemploymentMandate): number =>
  (state.year - mandate.adoptedAt.year) * 12 + state.month - mandate.adoptedAt.month;

export const advanceForcedUnemploymentStreak = (state: GameState): Partial<GameState> => {
  const mandate = state.forcedUnemploymentMandate;
  if (!mandate) return {};
  const nextStreak = state.unemployment_rate <= getForcedUnemploymentTarget(mandate)
    ? Math.min(FORCED_UNEMPLOYMENT_STREAK_MONTHS, mandate.unemploymentStreak + 1)
    : 0;
  return { forcedUnemploymentMandate: { ...mandate, unemploymentStreak: nextStreak } };
};

export const isForcedUnemploymentPledgeMet = (
  state: GameState,
  mandate: ForcedUnemploymentMandate,
  id: ForcedUnemploymentPledgeId,
): boolean => {
  const pledge = getForcedUnemploymentPledge(id);
  if (pledge.group === 'hours') return state.domesticPolicy.max_hours_law >= pledge.target!;
  if (pledge.group === 'unemployment') return mandate.unemploymentStreak >= FORCED_UNEMPLOYMENT_STREAK_MONTHS;
  if (id === 'minimum_wage_1') return state.domesticPolicy.min_wage >= pledge.target!;
  if (id === 'land_reform_20') return state.domesticPolicy.land_reform_progress >= pledge.target!;
  return getUnionShare(state).CNT >= pledge.target!;
};

export const areForcedUnemploymentPledgesMet = (state: GameState, mandate: ForcedUnemploymentMandate): boolean =>
  mandate.pledgeIds.every(id => isForcedUnemploymentPledgeMet(state, mandate, id));

export const getForcedUnemploymentProgress = (state: GameState): number => {
  const mandate = state.forcedUnemploymentMandate;
  if (!mandate || mandate.pledgeIds.length === 0) return 0;
  const earned = mandate.pledgeIds.reduce((total, id) =>
    total + (isForcedUnemploymentPledgeMet(state, mandate, id) ? getForcedUnemploymentPledge(id).chips : 0), 0);
  return Math.round(earned / mandate.chips * 100);
};

export const getForcedUnemploymentRewards = (chips: number) => ({
  successWorkers: Math.min(20, 2 + chips),
  successRuralWorkers: Math.min(12, 1 + Math.ceil(chips / 2)),
  failureWorkers: -(10 + Math.min(22, chips * 2)),
  failureRuralWorkers: -(8 + Math.min(18, chips)),
  failureFervor: -(8 + Math.min(12, chips)),
  failureDissent: Math.min(15, 4 + chips),
});
