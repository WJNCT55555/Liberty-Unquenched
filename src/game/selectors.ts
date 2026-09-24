import { getOptionEffectPreview } from './effectPreview';
import { getJournalEntryDef } from './journal';
import { getPlayerMapFaction } from '../map/rules/factions';
import type { ArmedEntityId, ArmyIdentity, MapRuntimeState } from '../map/types_map';
import {
  getEntityIdentity,
  getMilitiaRecruitmentPools,
  type RecruitmentPoolView,
} from './rules/warSetup';
import { getMilitarization, MILITARIZATION_GROUP_INFO } from './rules/militarization';
import {
  MILITIA_ORGANIZATION_DISPLAY_ORDER,
  getOrganizationDefinition,
  isOrganizationActive,
} from './organizations';
import { normalizeGeneralElectionSchedule } from './rules/electionSchedule';
import {
  ECONOMY_COUNTERS,
  ECONOMY_PUSH_LIMITS,
  ECONOMY_ROUTE_JOURNAL_IDS,
  calculateEconomyReformGraphs,
  getEconomyCounter,
  type EconomyCounter,
  type EconomyReformGraphs,
} from './rules/economyReforms';
import {
  getControlCeilings,
  getControlShares,
  getPrivateShare,
  getSocializedShare,
  getWorkerControlEquivalent,
  getWorkersShare,
} from './rules/controlShares';
import type { EconomyOwnershipShares } from './types';
import type {
  Advisor,
  AdvisorAction,
  Card,
  EffectPreviewLine,
  GameEvent,
  GameState,
  OrganizationId,
} from './types';

/** Pure read models for React consumers. Keep store and React concerns out of this module. */

export const selectMapRuntimeState = (state: GameState): MapRuntimeState => ({
  difficulty: state.difficulty,
  language: state.language,
  phase: state.phase,
  year: state.year,
  month: state.month,
  civilWarStatus: state.civilWarStatus,
  activeWar: state.activeWar,
  wars: state.wars,
  provinces: state.provinces,
  armies: state.armies,
  mapHistory: state.mapHistory,
  mapResources: state.mapResources,
  mapCurrentPlayer: state.mapCurrentPlayer,
  iberianDefense: state.iberianDefense,
  mapSelectedProvinceId: state.mapSelectedProvinceId,
  mapSelectedArmyId: state.mapSelectedArmyId,
  mapSelectedArmyIds: state.mapSelectedArmyIds,
});

export const selectMapRecruitmentPools = (state: GameState): RecruitmentPoolView[] => (
  getMilitiaRecruitmentPools(state, getPlayerMapFaction(state))
);

export const areRecruitmentPoolViewsEqual = (
  left: RecruitmentPoolView[],
  right: RecruitmentPoolView[],
): boolean => left.length === right.length && left.every((pool, index) => {
  const other = right[index];
  return pool.entityId === other.entityId
    && pool.identity === other.identity
    && pool.camp === other.camp
    && pool.organizationId === other.organizationId
    && pool.manpower === other.manpower
    && pool.active === other.active
    && pool.label.en === other.label.en
    && pool.label.zh === other.label.zh;
});

/** The ending screen stays unsubscribed from ordinary gameplay updates. */
export const selectEndingState = (state: GameState): GameState | null => (
  state.isGameOver && state.ending ? state : null
);

export interface GeneralElectionViewModel {
  status: 'scheduled' | 'suspended';
  schedule: GameState['generalElectionSchedule'];
}

/** Single presentation boundary for every consumer of the election calendar. */
export const selectGeneralElectionViewModel = (state: GameState): GeneralElectionViewModel => ({
  status: state.civilWarStatus === 'not_started' ? 'scheduled' : 'suspended',
  schedule: normalizeGeneralElectionSchedule(state),
});

const ENGLISH_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export const formatGeneralElectionViewModel = (
  view: GeneralElectionViewModel,
  isZh: boolean,
): string => {
  if (view.status === 'suspended') {
    return isZh ? '已停摆 (内战爆发)' : 'Suspended (Civil War)';
  }

  const { nextElectionAt, reason, crisis } = view.schedule;
  const date = isZh
    ? `${nextElectionAt.year}年${nextElectionAt.month}月`
    : `${ENGLISH_MONTHS[nextElectionAt.month - 1]} ${nextElectionAt.year}`;

  if (reason === 'constituent') {
    return `${date} (${isZh ? '制宪议会大选' : 'Constituent Cortes'})`;
  }
  if (reason === 'term_expiry') {
    return `${date} (${isZh ? '四年期满' : '4-Year Term'})`;
  }
  if (reason === 'failed_formation') {
    return `${date} (${isZh ? '组阁失败重新大选' : 'Repeat Election after Failed Government Formation'})`;
  }
  if (crisis?.coalitionId === 'ceda_radical') {
    return `${date} (${isZh ? '因丑闻与联盟瓦解提前大选' : 'Early Election due to Scandal & Collapse'})`;
  }
  return `${date} (${isZh ? '因内阁危机提前大选' : 'Early Election due to Cabinet Crisis'})`;
};

const equalStateKeys = <Key extends keyof GameState>(keys: readonly Key[]) => (
  left: GameState,
  right: GameState,
): boolean => keys.every((key) => Object.is(left[key], right[key]));

/**
 * These legacy modals still accept GameState because their pure calculators do.
 * Their equality boundaries nevertheless keep them isolated from unrelated store updates.
 */
export const selectEconomyModalState = (state: GameState): GameState => state;
export const areEconomyModalStatesEqual = equalStateKeys([
  'budget',
  'civilWarStatus',
  'difficulty',
  'domesticPolicy',
  'economic_output_index',
  'economy_growth',
  'economyHistory',
  'fiscal_arrears',
  'foreign_exchange',
  'gold_reserves',
  'has_issued_war_bonds',
  'inflation_rate',
  'military_spending',
  'month',
  'public_debt',
  'sandboxManualTaxAdjustmentEnabled',
  'sandboxSovereignInterventionsEnabled',
  'stats',
  'tax_consumption',
  'tax_lower_class',
  'tax_middle_class',
  'tax_tariff',
  'tax_upper_class',
  'unemployment_rate',
  'year',
] as const);

export const selectPoliticalModalState = (state: GameState): GameState => state;
export const arePoliticalModalStatesEqual = equalStateKeys([
  'activeCoalitions',
  'armies',
  'ceda_formed',
  'civilWarStatus',
  'classes',
  'cntVotingRate',
  'coalition_dissent',
  'cortes',
  'domesticPolicy',
  'falange_jons',
  'fe_founded',
  'generalElectionSchedule',
  'government',
  'iberianDefense',
  'ir_formed',
  'lawStanceModifiers',
  'ministers',
  'month',
  'organizations',
  'partyRelations',
  'partySupport',
  'poum_founded',
  'ps_founded',
  'republicanPartyStatus',
  'rulingCoalition',
  'scenario',
  'unionShare',
  'ur_formed',
  'wartimePowerArrangement',
  'year',
] as const);

export const selectDomesticPolicyModalState = (state: GameState): GameState => state;
export const areDomesticPolicyModalStatesEqual = equalStateKeys(['domesticPolicy'] as const);

export const selectLawStanceModalState = (state: GameState): GameState => state;
export const areLawStanceModalStatesEqual = equalStateKeys([
  'ceda_formed',
  'classes',
  'cntStance',
  'cntVotingRate',
  'cortes',
  'domesticPolicy',
  'falange_jons',
  'fe_founded',
  'iberianDefense',
  'ir_formed',
  'lawStanceModifiers',
  'month',
  'organizations',
  'partyRelations',
  'poum_founded',
  'ps_founded',
  'republicanPartyStatus',
  'scenario',
  'ur_formed',
  'wartimePowerArrangement',
  'year',
] as const);

/** SidePanel is intentionally broad, but no longer reacts to cards, events, saves, or other unused state. */
export const selectSidePanelState = (state: GameState): GameState => state;
export const areSidePanelStatesEqual = equalStateKeys([
  'activeCoalitions',
  'activeWar',
  'armedForces',
  'armies',
  'armyFormations',
  'budget',
  'ceda_formed',
  'civilWarStatus',
  'classes',
  'cntStance',
  'cntVotingRate',
  'coalition_dissent',
  'cortes',
  'currentView',
  'domesticPolicy',
  'economy_growth',
  'factions',
  'falange_jons',
  'fe_founded',
  'foreign_exchange',
  'generalElectionSchedule',
  'gold_reserves',
  'government',
  'iberianDefense',
  'inflation_rate',
  'ir_formed',
  'language',
  'lawStanceModifiers',
  'mapResources',
  'ministers',
  'month',
  'organizations',
  'partyRelations',
  'partySupport',
  'poum_founded',
  'provinces',
  'ps_founded',
  'public_debt',
  'regionalStatuses',
  'relations',
  'republicanPartyStatus',
  'rulingCoalition',
  'scenario',
  'stats',
  'unemployment_rate',
  'unionShare',
  'ur_formed',
  'wartimePowerArrangement',
  'year',
] as const);

const resolveLocalizedValue = (
  state: GameState,
  value: string | ((currentState: GameState) => string),
): string => typeof value === 'function' ? value(state) : value;

const areEffectPreviewLinesEqual = (left: EffectPreviewLine[], right: EffectPreviewLine[]): boolean => (
  left.length === right.length && left.every((line, index) => {
    const other = right[index];
    return line.label === other.label
      && line.labelZh === other.labelZh
      && line.value === other.value
      && line.suffix === other.suffix
      && line.suffixZh === other.suffixZh
      && line.text === other.text
      && line.textZh === other.textZh
      && line.tone === other.tone;
  })
);

export interface EventOptionViewModel {
  option: GameEvent['options'][number];
  text: string;
  subtitle?: string;
  isAvailable: boolean;
  unavailableReason?: string;
  previewLines: EffectPreviewLine[];
}

export interface EventModalViewModel {
  isZh: boolean;
  title: string;
  description: string;
  hasCustomContent: boolean;
  options: EventOptionViewModel[];
}

export const selectEventModalViewModel = (state: GameState, event: GameEvent): EventModalViewModel => {
  const isZh = state.language === 'zh';
  const showEffectPreview = state.difficulty === 'easy' || state.difficulty === 'sandbox';
  const title = isZh && event.titleZh ? event.titleZh : event.title;
  return {
    isZh,
    title: resolveLocalizedValue(state, title),
    description: isZh && event.descriptionZh ? event.descriptionZh : event.description,
    hasCustomContent: Boolean(event.renderContent),
    options: event.options.map((option) => {
      const text = isZh && option.textZh ? option.textZh : option.text;
      const isAvailable = !option.condition || option.condition(state);
      return {
        option,
        text: resolveLocalizedValue(state, text),
        subtitle: isZh && option.subtitleZh ? option.subtitleZh : option.subtitle,
        isAvailable,
        unavailableReason: isAvailable
          ? undefined
          : isZh && option.unavailableSubtitleZh
            ? option.unavailableSubtitleZh(state)
            : option.unavailableSubtitle
              ? option.unavailableSubtitle(state)
              : isZh ? '条件未满足' : 'Condition not met',
        previewLines: showEffectPreview ? getOptionEffectPreview(state, option) : [],
      };
    }),
  };
};

export const areEventModalViewModelsEqual = (left: EventModalViewModel, right: EventModalViewModel): boolean => (
  left.isZh === right.isZh
  && left.title === right.title
  && left.description === right.description
  && left.hasCustomContent === right.hasCustomContent
  && left.options.length === right.options.length
  && left.options.every((option, index) => {
    const other = right.options[index];
    return option.option === other.option
      && option.text === other.text
      && option.subtitle === other.subtitle
      && option.isAvailable === other.isAvailable
      && option.unavailableReason === other.unavailableReason
      && areEffectPreviewLinesEqual(option.previewLines, other.previewLines);
  })
);

export interface EventBoardViewModel {
  isZh: boolean;
  isVisible: boolean;
  events: Array<{ id: string; title: string }>;
}

export const selectEventBoardViewModel = (state: GameState): EventBoardViewModel => {
  const isZh = state.language === 'zh';
  const uniqueEvents = state.pendingEvents.filter((event, index, events) => (
    events.findIndex((candidate) => candidate.id === event.id) === index
  ));
  const isVisible = uniqueEvents.length > 0 && !state.currentEvent;
  return {
    isZh,
    isVisible,
    events: (isVisible ? uniqueEvents : []).map((event) => {
      const title = isZh && event.titleZh ? event.titleZh : event.title;
      return { id: event.id, title: resolveLocalizedValue(state, title) };
    }),
  };
};

export const areEventBoardViewModelsEqual = (left: EventBoardViewModel, right: EventBoardViewModel): boolean => (
  left.isZh === right.isZh
  && left.isVisible === right.isVisible
  && left.events.length === right.events.length
  && left.events.every((event, index) => event.id === right.events[index].id && event.title === right.events[index].title)
);

export interface CardViewModel {
  isZh: boolean;
  isPlayable: boolean;
  typeName: string;
  title: string;
  description: string;
}

export const selectCardViewModel = (state: GameState, card: Card): CardViewModel => {
  const isZh = state.language === 'zh';
  return {
    isZh,
    isPlayable: state.actionsLeft >= card.cost
      && (card.resourceCost === undefined || state.resources >= card.resourceCost)
      && (card.armamentCost === undefined || state.armaments >= card.armamentCost)
      && (card.condition === undefined || card.condition(state)),
    typeName: isZh
      ? (card.type === 'Action' ? '行动事务' : card.type === 'Military' ? '武装事务' : '政府事务')
      : card.type,
    title: isZh && card.titleZh ? card.titleZh : card.title,
    description: isZh && card.descriptionZh ? card.descriptionZh : card.description,
  };
};

export const areCardViewModelsEqual = (left: CardViewModel, right: CardViewModel): boolean => (
  left.isZh === right.isZh
  && left.isPlayable === right.isPlayable
  && left.typeName === right.typeName
  && left.title === right.title
  && left.description === right.description
);

export interface AdvisorActionViewModel {
  action: AdvisorAction;
  meetsCondition: boolean;
  isAvailable: boolean;
  unavailableReason?: string;
}

export interface AdvisorSlotViewModel {
  advisor: Advisor | null;
  isAvailable: boolean;
}

export interface AdvisorPanelViewModel {
  isZh: boolean;
  slots: AdvisorSlotViewModel[];
  advisorPool: Advisor[];
  emptySlot: number;
  selectedActions: AdvisorActionViewModel[];
}

export const selectAdvisorPanelViewModel = (
  state: GameState,
  selectedAdvisorId: string | null,
): AdvisorPanelViewModel => {
  const isZh = state.language === 'zh';
  const selectedAdvisor = state.activeAdvisors.find((advisor) => advisor?.id === selectedAdvisorId) || null;
  const toActionViewModel = (action: AdvisorAction): AdvisorActionViewModel => {
    const meetsCondition = action.condition(state);
    const isAvailable = meetsCondition && state.actionsLeft > 0;
    return {
      action,
      meetsCondition,
      isAvailable,
      unavailableReason: isAvailable
        ? undefined
        : !meetsCondition
          ? isZh && action.unavailableSubtitleZh
            ? action.unavailableSubtitleZh(state)
            : action.unavailableSubtitle
              ? action.unavailableSubtitle(state)
              : isZh ? '前置条件未满足' : 'Prerequisites not met'
          : isZh ? '行动点数不足' : 'Insufficient AP',
    };
  };
  return {
    isZh,
    slots: state.activeAdvisors.map((advisor) => ({
      advisor,
      isAvailable: Boolean(advisor?.actions.some((action) => action.condition(state) && state.actionsLeft > 0)),
    })),
    advisorPool: state.advisorPool,
    emptySlot: state.activeAdvisors.findIndex((advisor) => advisor === null),
    selectedActions: selectedAdvisor ? selectedAdvisor.actions.map(toActionViewModel) : [],
  };
};

export const areAdvisorPanelViewModelsEqual = (left: AdvisorPanelViewModel, right: AdvisorPanelViewModel): boolean => (
  left.isZh === right.isZh
  && left.advisorPool === right.advisorPool
  && left.emptySlot === right.emptySlot
  && left.slots.length === right.slots.length
  && left.slots.every((slot, index) => (
    slot.advisor === right.slots[index].advisor && slot.isAvailable === right.slots[index].isAvailable
  ))
  && left.selectedActions.length === right.selectedActions.length
  && left.selectedActions.every((action, index) => {
    const other = right.selectedActions[index];
    return action.action === other.action
      && action.meetsCondition === other.meetsCondition
      && action.isAvailable === other.isAvailable
      && action.unavailableReason === other.unavailableReason;
  })
);

export interface JournalViewModel {
  language: GameState['language'];
  journal: GameState['journal'];
  progressById: Record<string, number>;
}

export const selectJournalViewModel = (state: GameState): JournalViewModel => ({
  language: state.language,
  journal: state.journal,
  progressById: Object.fromEntries(Object.entries(state.journal).map(([id, entryState]) => {
    const definition = getJournalEntryDef(entryState.id);
    return [id, definition?.getProgress ? definition.getProgress(state, entryState) : entryState.progress];
  })),
});

export const areJournalViewModelsEqual = (left: JournalViewModel, right: JournalViewModel): boolean => {
  if (left.language !== right.language || left.journal !== right.journal) return false;
  const leftIds = Object.keys(left.progressById);
  const rightIds = Object.keys(right.progressById);
  return leftIds.length === rightIds.length
    && leftIds.every((id) => left.progressById[id] === right.progressById[id]);
};

/**
 * 经济改造面板的读模型（docs/经济改造方案.md §8.3）。
 *
 * 只做两件事：把 18 个计数器的当前值摊平成一张表，把六条路线的进度算出来。
 * 与 `journal` 一样，面板只读这些字段；`workerControl` 之类会在第 5 期换掉的
 * 标尺不进读模型，避免界面提前绑死在旧字段上。
 */
export interface EconomyReformViewModel {
  language: GameState['language'];
  journal: GameState['journal'];
  counters: Record<EconomyCounter, number>;
  /** 顾问配方案的推动进度（佩罗 2 次、桑蒂利安 3 次）。 */
  pushes: { cooperative: number; organic: number };
  pushLimits: { cooperative: number; organic: number };
  /** 六条路线日志 id，按方案 §0.3 的顺序。 */
  routeJournalIds: readonly string[];
  progressById: Record<string, number>;
  /** 月度宏观修正，来自 `calculateEconomyReformGraphs`。 */
  graphs: EconomyReformGraphs;
  /** 两张所有权饼与派生值（docs/工人控制度改造方案.md §2.5）。 */
  ownership: EconomyOwnershipShares;
  ownershipSummary: {
    land: { workers: number; socialized: number; private: number; ceiling: number };
    industry: { workers: number; socialized: number; private: number; ceiling: number };
    workerControl: number;
  };
}

export const selectEconomyReformViewModel = (state: GameState): EconomyReformViewModel => {
  const ceilings = getControlCeilings(state);
  const summary = (sector: 'land' | 'industry') => ({
    workers: getWorkersShare(state, sector),
    socialized: getSocializedShare(state, sector),
    private: getPrivateShare(state, sector),
    ceiling: ceilings[sector],
  });
  return {
    language: state.language,
    journal: state.journal,
    counters: Object.fromEntries(
      ECONOMY_COUNTERS.map((key) => [key, getEconomyCounter(state, key)]),
    ) as Record<EconomyCounter, number>,
    pushes: {
      cooperative: state.economy?.cooperativePushes ?? 0,
      organic: state.economy?.organicPushes ?? 0,
    },
    pushLimits: {
      cooperative: ECONOMY_PUSH_LIMITS.cooperativePushes,
      organic: ECONOMY_PUSH_LIMITS.organicPushes,
    },
    routeJournalIds: ECONOMY_ROUTE_JOURNAL_IDS,
    progressById: Object.fromEntries(ECONOMY_ROUTE_JOURNAL_IDS.map((id) => {
      const entryState = state.journal?.[id];
      const definition = getJournalEntryDef(id);
      return [id, entryState && definition?.getProgress ? definition.getProgress(state, entryState) : 0];
    })),
    graphs: calculateEconomyReformGraphs(state),
    ownership: getControlShares(state),
    ownershipSummary: {
      land: summary('land'),
      industry: summary('industry'),
      workerControl: getWorkerControlEquivalent(state),
    },
  };
};

export const areEconomyReformViewModelsEqual = (
  left: EconomyReformViewModel,
  right: EconomyReformViewModel,
): boolean => {
  if (left.language !== right.language || left.journal !== right.journal) return false;
  if (left.pushes.cooperative !== right.pushes.cooperative || left.pushes.organic !== right.pushes.organic) return false;
  if (left.ownership !== right.ownership) return false;
  if (left.ownershipSummary.workerControl !== right.ownershipSummary.workerControl) return false;
  if (left.ownershipSummary.land.ceiling !== right.ownershipSummary.land.ceiling
    || left.ownershipSummary.industry.ceiling !== right.ownershipSummary.industry.ceiling) return false;
  if (left.graphs.growthGraph !== right.graphs.growthGraph
    || left.graphs.inflationGraph !== right.graphs.inflationGraph
    || left.graphs.foreignExchangeGraph !== right.graphs.foreignExchangeGraph
    || left.graphs.budgetGraph !== right.graphs.budgetGraph
    || left.graphs.consumptionTaxBaseFactor !== right.graphs.consumptionTaxBaseFactor) return false;
  return ECONOMY_COUNTERS.every((key) => left.counters[key] === right.counters[key])
    && ECONOMY_ROUTE_JOURNAL_IDS.every((id) => left.progressById[id] === right.progressById[id]);
};

/**
 * 「准军事组织」面板的读模型。
 *
 * 一条规则决定了这份列表：**只有已经成立的民兵组织才出现**，因为军事化率横条挂在
 * 组织行下面——组织没成立就没有地方挂它（`DC` 是唯一一个 `uiVisibility: 'visible'`
 * 的民兵组织，其余全是 `internal`，所以这里用的是显式的
 * `MILITIA_ORGANIZATION_DISPLAY_ORDER`，而不是"我能看见的组织"）。
 *
 * 派系用 `ENTITY_IDENTITY` 查表，因此一个组织只对应一条横条：MAOC 与第五团共用
 * `pce`（升格时 MAOC 转为 `integrated`，不再成立），意大利 CTV 与长枪党第一线
 * 共用 `falange`。
 */
export interface MilitiaOrganizationViewModel {
  organizationId: OrganizationId;
  entityId: ArmedEntityId;
  identity: ArmyIdentity;
  nameEn: string;
  nameZh: string;
  manpower: number;
  militarization: number;
  camp: 'republic' | 'nationalist';
  highlighted: boolean;
}

export const selectMilitiaOrganizationViewModels = (state: GameState): MilitiaOrganizationViewModel[] => (
  MILITIA_ORGANIZATION_DISPLAY_ORDER.flatMap((organizationId) => {
    const definition = getOrganizationDefinition(organizationId);
    const entityId = definition?.armedEntityId;
    if (!definition || !entityId || !isOrganizationActive(state, organizationId)) return [];
    const identity = getEntityIdentity(entityId);
    return [{
      organizationId,
      entityId,
      identity,
      nameEn: definition.militiaDisplayName || definition.name,
      nameZh: definition.militiaDisplayNameZh || definition.nameZh,
      manpower: state.armedForces.entityPools[entityId]?.manpower || 0,
      militarization: getMilitarization(state, identity),
      camp: MILITARIZATION_GROUP_INFO[identity].camp,
      highlighted: organizationId === 'DC',
    }];
  })
);
