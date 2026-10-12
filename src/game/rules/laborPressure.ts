import type { GameState, PoliticalActor } from '../types';
import { getEffectiveCortes } from '../politicalEligibility';
import { getEffectiveLawStanceScore, getLegalActorSeats, getLegalStanceActors, LAW_LEVEL_LIMITS } from '../lawStances';

export type LaborPressureLawId = 'max_hours_law' | 'min_wage' | 'workplace_safety';

export interface LaborPressureCampaign {
  lawId: LaborPressureLawId;
  targetLevel: number;
  points: number;
  nextDecayMonth: number;
}

export const LABOR_PRESSURE_LAWS: LaborPressureLawId[] = ['max_hours_law', 'min_wage', 'workplace_safety'];
export const LABOR_PRESSURE_LABELS: Record<LaborPressureLawId, { en: string; zh: string }> = {
  max_hours_law: { en: 'Maximum hours', zh: '最高工时' },
  min_wage: { en: 'Minimum wage', zh: '最低工资' },
  workplace_safety: { en: 'Workplace safety', zh: '工作安全' },
};

const monthIndex = (state: Pick<GameState, 'year' | 'month'>): number => state.year * 12 + state.month;

export const canUseLaborPressure = (state: GameState): boolean => state.civilWarStatus === 'not_started';

export const hasAvailableLaborPressureLaw = (state: GameState): boolean => (
  LABOR_PRESSURE_LAWS.some(lawId => state.domesticPolicy[lawId] < LAW_LEVEL_LIMITS[lawId])
);

const isSupportive = (state: GameState, actor: PoliticalActor, lawId: LaborPressureLawId, targetLevel: number): boolean => (
  getEffectiveLawStanceScore(state, actor, lawId, targetLevel) >= 2
);

export const getLaborPressureResistance = (state: GameState, lawId: LaborPressureLawId, targetLevel: number) => {
  const cortes = state.cortes ? getEffectiveCortes(state) : undefined;
  const supportingSeats = cortes
    ? getLegalStanceActors(state).reduce((sum, actor) => (
        sum + (isSupportive(state, actor, lawId, targetLevel) ? getLegalActorSeats(state, actor, cortes) : 0)
      ), 0)
    : 0;
  const parliament = !cortes || supportingSeats < 236 ? 1 : 0;
  const laborMinister = state.ministers.labor;
  const ministerActor = laborMinister === 'CNT' ? 'CNT_FAI' : laborMinister === 'Other' ? null : laborMinister;
  const ministry = ministerActor && isSupportive(state, ministerActor, lawId, targetLevel) ? 0 : 1;
  return { parliament, ministry, supportingSeats, total: parliament + ministry };
};

export const getLaborPressureThreshold = (state: GameState, lawId: LaborPressureLawId, targetLevel: number): number => (
  2 + targetLevel + getLaborPressureResistance(state, lawId, targetLevel).total
);

export const getLaborPressureCampaign = (state: GameState): LaborPressureCampaign | null => {
  const campaign = state.laborPressure ?? null;
  if (!campaign) return null;
  const level = state.domesticPolicy[campaign.lawId];
  if (level >= campaign.targetLevel || level >= LAW_LEVEL_LIMITS[campaign.lawId]) return null;
  return level + 1 === campaign.targetLevel ? campaign : { ...campaign, targetLevel: level + 1 };
};

export const addLaborPressure = (
  state: GameState,
  lawId: LaborPressureLawId,
  gain: 1 | 2,
): Partial<GameState> => {
  if (!canUseLaborPressure(state) || state.domesticPolicy[lawId] >= LAW_LEVEL_LIMITS[lawId]) return {};
  const prior = getLaborPressureCampaign(state);
  const sameDemand = prior?.lawId === lawId;
  return {
    laborPressure: {
      lawId,
      targetLevel: state.domesticPolicy[lawId] + 1,
      points: Math.min(8, (sameDemand ? prior.points : 0) + gain),
      nextDecayMonth: monthIndex(state) + 6,
    },
  };
};

export interface LaborPressureSettlement {
  patch: Partial<GameState>;
  enactedLawId?: LaborPressureLawId;
}

/** Resolve after national accounts and before journal checks, so new law costs begin next month. */
export const settleLaborPressure = (state: GameState): LaborPressureSettlement => {
  const stored = state.laborPressure ?? null;
  if (!stored) return { patch: {} };
  if (!canUseLaborPressure(state)) return { patch: { laborPressure: null } };
  const campaign = getLaborPressureCampaign(state);
  if (!campaign) return { patch: { laborPressure: null } };
  if (state.governmentCrisis || state.earlyElectionInProgress) {
    return { patch: { laborPressure: { ...campaign, nextDecayMonth: campaign.nextDecayMonth + 1 } } };
  }
  if (campaign.points >= getLaborPressureThreshold(state, campaign.lawId, campaign.targetLevel)) {
    return {
      patch: {
        domesticPolicy: { ...state.domesticPolicy, [campaign.lawId]: campaign.targetLevel },
        laborPressure: null,
      },
      enactedLawId: campaign.lawId,
    };
  }
  const now = monthIndex(state);
  if (now < campaign.nextDecayMonth) return { patch: { laborPressure: campaign } };
  const elapsedPeriods = Math.floor((now - campaign.nextDecayMonth) / 6) + 1;
  const points = Math.max(0, campaign.points - elapsedPeriods);
  return {
    patch: {
      laborPressure: points > 0
        ? { ...campaign, points, nextDecayMonth: campaign.nextDecayMonth + elapsedPeriods * 6 }
        : null,
    },
  };
};
