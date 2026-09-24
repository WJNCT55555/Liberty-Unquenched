import React from 'react';
import type {
  ArmedEntityId,
  ArmyFormation,
  ArmyIdentity,
  MapRuntimeState,
} from '../map/types_map';
import { Party } from './parties';

export type Faction = 'Treintistas' | 'Cenetistas' | 'Faistas' | 'Puristas' | 'Jabalistas';
export type { Party };

/** Reserved state-machine phases for the wartime integration pass. */
export type WarRuntimePhase = 'none' | 'friction' | 'triggered' | 'converged' | 'split';
export type WarRuntimeTrigger = 'passive' | 'active';

/** Placeholder for wartime rupture and tri-faction runtime data. */
export interface WarRuntime {
  phase?: WarRuntimePhase;
  trigger?: WarRuntimeTrigger;
}

/**
 * Organizations are deliberately separate from parties and internal factions:
 * a party can sponsor several organizations, while an organization may exist
 * before (or without) a parliamentary party.  Keep this list extensible as
 * future party organizations are added to the registry.
 */
export type OrganizationId =
  | 'CNT' | 'FAI' | 'FIJL' | 'ML' | 'FNA' | 'DC' | 'PRRevS'
  | 'PSOE' | 'UGT' | 'PSOE_MILITIA' | 'JJSS' | 'FNTT' | 'JSU'
  | 'PCE' | 'MAOC' | 'FIFTH_REGIMENT' | 'UJCE' | 'MUJERES_ANTIFASCISTAS'
  | 'POUM' | 'POUM_MILITIA' | 'JCI'
  | 'CT' | 'REQUETE' | 'REQUETE_MILITIA' | 'PELAYOS'
  | 'FE' | 'FALANGE_MILITIA' | 'JONS' | 'SEU' | 'SECCION_FEMENINA'
  | 'PNV' | 'EUZKO_GUDAROSTEA' | 'EGI'
  | 'ERC' | 'PRR' | 'DLR' | 'IR' | 'UR' | 'AP' | 'PS'
  | 'UNIO_RABASSAIRES' | 'ELA' | 'CNCA' | 'CONS'
  | 'INTERNATIONAL_BRIGADES' | 'ITALIAN_CTV';
export type OrganizationType = 'union' | 'political' | 'youth' | 'women' | 'agricultural' | 'militia' | 'command';
export type OrganizationOwner = Party | 'CNT_FAI';
export type OrganizationUiVisibility = 'visible' | 'internal';

export interface ArmedEntityPool {
  entityId: ArmedEntityId;
  organizationId?: OrganizationId;
  owner: OrganizationOwner | 'STATE' | 'FOREIGN';
  status: 'inactive' | 'active' | 'integrated' | 'defeated';
  activeFrom?: { year: number; month: number };
  manpower: number;
  artillery: number;
  tanks: number;
}

export interface OrganizationState {
  established: boolean;
  establishedAt?: { year: number; month: number };
  status?: 'unformed' | 'active' | 'integrated' | 'dissolved';
}

export type OrganizationStateMap = Partial<Record<OrganizationId, OrganizationState>>;

/**
 * 工会占比向量的键。前六个与组织注册表（OrganizationId）对齐，
 * 后两个是伪桶：other（其他小型工会）与 unorganized（未组织劳动者）。
 */
export type UnionShareKey = 'CNT' | 'UGT' | 'UR' | 'ELA' | 'CNCA' | 'CONS' | 'other' | 'unorganized';

/**
 * 工会占比：八项零和向量，和恒等于 100（分母 = 1，全体；不区分阶级）。
 * unorganized 受下限钳制（见 unions.ts UNION_SHARE_MIN_UNORGANIZED）。
 */
export type UnionShare = Record<UnionShareKey, number>;
// Ministers belong to a concrete party, CNT, or the unaligned `Other` party.
// `Right` is not a party identity and must not be stored as a minister value.
// PRRevS is the CNT's electoral phase, not a separate ministerial identity.
export type MinisterParty = Exclude<Party, 'PRRevS'> | 'CNT';
export type SocialClass = 'Obreros' | 'Braceros' | 'Labradores' | 'Latifundistas' | 'PequenaBurguesia' | 'Intelectuales' | 'Burguesia' | 'Clero';
// Targets of the Propaganda by the Deed assassination card.
export type AssassinationTarget =
  | 'franco'
  | 'queipo'
  | 'sanjurjo'
  | 'sotelo'
  | 'primo'
  | 'ramiro'
  | 'zamora'
  | 'alfonso';

// Legal stance identities intentionally exclude `PRRevS` and `Other`.
// PRRevS is the CNT's electoral phase rather than an independent ideology;
// `Other` is an electoral bucket without a coherent legal programme.  CNT is
// represented separately and becomes a parliamentary actor only when it is in
// government or has PRRevS seats.
export type LawId =
  | 'max_hours_law'
  | 'min_wage'
  | 'workplace_safety'
  | 'union_status'
  | 'land_law'
  | 'political_rights'
  | 'womens_rights'
  | 'religion_policy'
  | 'education_institutions'
  | 'language_policy'
  | 'public_order_law'
  | 'security_corps_law'
  | 'army_reform_law'
  | 'militia_legality_law';

export type LegalStanceParty = Exclude<Party, 'PRRevS' | 'Other'>;
export type PoliticalActor = LegalStanceParty | 'CNT_FAI';
export type LawStance =
  | 'strongly_support'
  | 'support'
  | 'neutral'
  | 'oppose'
  | 'strongly_oppose';

export interface LawStanceModifier {
  actor: PoliticalActor;
  lawId: LawId;
  targetLevel?: number | 'all';
  delta?: number;
  override?: LawStance;
  sourceType: 'event' | 'card' | 'decision' | 'party_congress' | 'scenario';
  sourceId: string;
  reasonZh?: string;
  reasonEn?: string;
  expiresAtMonth?: number;
}

export type RegionalStatus = 'direct' | 'autonomy' | 'independent';

export interface RegionalStatuses {
  andalusia: RegionalStatus;
  catalonia: RegionalStatus;
  basque: RegionalStatus;
  galicia: RegionalStatus;
  asturias: RegionalStatus;
}

export type JournalStatus = 'inactive' | 'active' | 'completed' | 'failed';

export interface JournalState {
  id: string;
  status: JournalStatus;
  progress: number;
  failureProgress?: number;
}

export interface JournalEntryDef {
  id: string;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;

  successCondition?: string;
  successConditionZh?: string;
  successEffectDesc?: string;
  successEffectDescZh?: string;
  failureCondition?: string;
  failureConditionZh?: string;
  failureEffectDesc?: string;
  failureEffectDescZh?: string;
  
  // Conditionally show/hide progress bar
  hasProgress?: boolean;
  progressMax?: number;
  getProgress?: (state: GameState, entryState: JournalState) => number;

  /**
   * 事件—日志—事件契约（设计文档 §6.3）。
   *
   * 目标形态：**触发事件激活日志 → 日志按月推进（activeEffect）→ 完成/失败
   * 条件满足 → 日志自己结算 onComplete / onFail → 管线推入结果事件**。
   *
   * - `activationEventId`：本日志的开始事件。声明之后日志不再自行激活：
   *   `checkStatus` 不得返回 `active`（管线也会忽略这类返回值），激活只由该事件的
   *   选项效果调用 `activateJournal()` 完成。未声明者暂时保留旧的自动激活路径。
   * - `completionEventId` / `failureEventId`：结果事件。日志完成/失败时先立即结算
   *   `onComplete` / `onFail` 的数值，随后由管线把对应事件推入待办事件，同一回合的
   *   事件阶段即可读到（`rules/journalEvents.ts` + 月结管线）。
   *
   * 分工：数值效果只由日志负责，结果事件只负责叙事；同一个奖励不允许在
   * `onComplete` 与结果事件里各写一次。
   */
  activationEventId?: string;
  completionEventId?: string;
  failureEventId?: string;

  // Called to check if it should be activated automatically, or complete/fail
  checkStatus?: (state: GameState, entryState: JournalState) => JournalStatus | null;

  // Effect applied exactly once when completed
  onComplete?: (state: GameState) => Partial<GameState>;

  // Effect applied exactly once when failed
  onFail?: (state: GameState) => Partial<GameState>;
  
  // Continuous effect while active
  activeEffect?: {
    description?: string;
    descriptionZh?: string;
    apply?: (state: GameState) => Partial<GameState>;
  }
}


export interface AdvisorAction {
  id: string;
  title: string;
  titleZh?: string;
  subtitle: string;
  subtitleZh?: string;
  unavailableSubtitle?: (state: GameState) => string;
  unavailableSubtitleZh?: (state: GameState) => string;
  condition: (state: GameState) => boolean;
  effect: (state: GameState) => Partial<GameState>;
  description: string;
  descriptionZh?: string;
}

export interface Advisor {
  id: string;
  name: string;
  nameZh?: string;
  faction: Faction | 'None';
  description: string;
  descriptionZh?: string;
  image?: string;
  actions: AdvisorAction[];
}

export type CardType = 'Action' | 'Government' | 'Military';

export interface Card {
  id: string;
  title: string;
  titleZh?: string;
  type: CardType;
  description: string;
  descriptionZh?: string;
  cost: number; // Action points
  resourceCost?: number;
  armamentCost?: number;
  condition?: (state: GameState) => boolean;
  effect: (state: GameState) => Partial<GameState>;
}

export type CoalitionId =
  | 'provisional_government'
  | 'republican_socialist'   // 共和-社会党联盟
  | 'republican_coalition'    // 共和派联盟
  | 'popular_front'           // 人民阵线
  | 'popular_front_wartime'   // 战时人民阵线
  | 'ceda_radical'            // CEDA-激进联盟
  | 'workers_alliance'        // 工人联盟 (PSOE + CNT)
  | 'national_front';         // 国民阵线

export type CoalitionMember = Party | 'CNT_FAI';
export type WartimeGovernmentRoute = 'cabinet' | 'council' | 'external';

export interface WartimePowerArrangement {
  route: WartimeGovernmentRoute;
  formedAt: { year: number; month: number };
  lowCohesionMonths: number;
  lastSettlementMonth: number;
  crisisCooldownUntil: number;
}

export type MayDaysSettlement = 'withdrawal' | 'joint' | 'committee' | 'defeat';
export type MayDaysPOUMOutcome = 'guaranteed' | 'inquiry' | 'banned' | 'protested_ban';
export interface MayDaysState {
  stage: 'idle' | 'negotiations' | 'government' | 'result' | 'settled' | 'poum_result' | 'split_alignment' | 'split_result' | 'complete';
  leadershipAttitude?: 'unity' | 'guarantees' | 'committees' | 'insurrection';
  pressureMonths: number;
  lastPressureMonth: number;
  startedAt?: { year: number; month: number };
  resolvedAt?: { year: number; month: number };
  intention?: 'withdraw' | 'negotiate' | 'committee';
  escalation: 0 | 1 | 2 | 3;
  settlement?: MayDaysSettlement;
  governmentOutcome?: 'preserved' | 'centralized';
  communicationsControl?: 'central' | 'joint' | 'committee';
  publicOrderControl?: 'central' | 'joint' | 'committee';
  defenceControl?: 'central' | 'joint' | 'committee';
  productionFactor: number;
  /** Inclusive target month index. Only Barcelona's subsequent monthly output is affected. */
  productionThroughMonth: number;
  poumFollowupDueAt?: number;
  poumOutcome?: MayDaysPOUMOutcome;
  poumUnitsAwaitingIntegration?: boolean;
  before?: {
    ministers: GameState['ministers'];
    primeMinister: string;
    primeMinisterZh: string;
    cohesion: number;
    commitments: Partial<Record<CoalitionMember, number>>;
  };
}

export interface CoalitionState {
  activeId: CoalitionId;
  memberContributions: Partial<Record<CoalitionMember, number>>;
  /** Explicit membership distinguishes a wartime pact from its electoral predecessor. */
  members?: CoalitionMember[];
  participation?: Partial<Record<CoalitionMember, 'government' | 'external'>>;
  cohesion: number;
  cntAttitude: number;
  formedAt: { year: number; month: number };
}

export type GovernmentCrisisCause = 'cohesion' | 'scripted';

export interface GovernmentCrisis {
  sequence: number;
  coalitionId: CoalitionId;
  cause: GovernmentCrisisCause;
  occurredAt: { year: number; month: number };
}

export interface ElectionDate {
  year: number;
  month: number;
}

export type GeneralElectionReason = 'constituent' | 'term_expiry' | 'government_crisis' | 'failed_formation';
export type GeneralElectionParticipation =
  | 'abstain'
  | 'support_left'
  | 'prrevs_independent'
  | 'prrevs_left_alliance';

/**
 * Canonical schedule for the next Cortes election.
 *
 * UI and runtime scheduling both consume this state. Dated 1933/1936 events
 * remain historical presentation roots, but they may enter only when this
 * schedule identifies the matching constitutional dissolution.
 */
export interface GeneralElectionSchedule {
  lastElectionAt: ElectionDate | null;
  nextElectionAt: ElectionDate;
  reason: GeneralElectionReason;
  /** CNT/PRRevS campaign strategy for the election currently being resolved. */
  participation?: GeneralElectionParticipation;
  crisis?: {
    coalitionId: CoalitionId;
    sequence: number;
  };
}

export interface CoalitionDef {
  id: CoalitionId;
  name: string;
  nameZh: string;
  members: (Party | 'CNT_FAI')[];
  /**
   * `special` coalitions are installed only by their dedicated constitutional
   * story paths. `event_formed` coalitions must exist in `activeCoalitions`
   * before they can contest an ordinary post-1931 election. Wartime structures
   * never contest a Cortes election.
   */
  electionRole: 'special' | 'event_formed' | 'ineligible';
  shouldDissolve?: (state: GameState, coalition: CoalitionState) => boolean;
  dissolveThreshold: number;
}

export type EventCategory = 'news' | 'cnt' | 'politics' | 'war' | 'other';
/**
 * Event presentation and chain position. `solo` is a standalone event;
 * inline events are classified as the chain entry, an intermediate node,
 * or a terminal node.
 */
export type EventFlow = 'solo' | 'inline.root' | 'inline.node' | 'inline.leaf';

export interface GameEventMeta {
  category: EventCategory;
  flow: EventFlow;
  series?: string[];
  tags?: string[];
}

export interface EffectPreviewLine {
  label?: string;
  labelZh?: string;
  value?: number;
  suffix?: string;
  suffixZh?: string;
  text?: string;
  textZh?: string;
  tone?: 'positive' | 'negative' | 'neutral';
}

export interface EventHistory {
  triggered: string[];
  resolved: string[];
}

/**
 * The subset of the game dispatcher that an event's custom UI may need.
 * Keeping this contract in the data types prevents event definitions from
 * importing GameContext and creating a runtime dependency cycle.
 */
export type GameEventDispatch = (action:
  | {
      type: 'RESOLVE_EVENT';
      payload: (state: GameState) => Partial<GameState>;
    }
  | {
      type: 'UPDATE_TAX_DRAFT';
      payload: {
        draft_tax_lower?: number;
        draft_tax_middle?: number;
        draft_tax_upper?: number;
        draft_tax_tariff?: number;
        draft_tax_consumption?: number;
      };
    }
) => void;

export interface GameEvent {
  id: string;
  meta?: GameEventMeta;
  date?: { year: number; month: number };
  condition?: (state: GameState) => boolean;
  repeatable?: boolean;
  title: string | ((state: GameState) => string);
  titleZh?: string | ((state: GameState) => string);
  description: string;
  descriptionZh?: string;
  image?: string;
  renderContent?: (state: GameState, dispatch?: GameEventDispatch) => React.ReactNode;
  options: {
    text: string | ((state: GameState) => string);
    textZh?: string | ((state: GameState) => string);
    subtitle?: string;
    subtitleZh?: string;
    unavailableSubtitle?: (state: GameState) => string;
    unavailableSubtitleZh?: (state: GameState) => string;
    condition?: (state: GameState) => boolean;
    effectPreview?: (state: GameState) => EffectPreviewLine[];
    effect: (state: GameState) => Partial<GameState>;
  }[];
}

/**
 * 各武装派系共享的军事化率。军事化率 = 「名义人力里，真正能当兵的那部分占多少」，
 * 所以它同时是战斗乘数（见 `rules/militarization.ts`）。
 *
 * `gov` 同时服务政府军与警察：编制表部队的 `identity` 是 `gov`；警队人力开战时按忠诚
 * 切分进阵营池，而自该池募兵产生的单位同样是 `gov`。
 */
export type MilitarizationState = Record<ArmyIdentity, number>;

/** 军事化路线：内战爆发后由「人民军还是武装民兵」事件二选一，一经写入不可更改。 */
export interface MilitarizationPaths {
  chosen: 'none' | 'popular_army' | 'militia_autonomy';
  /** 选择发生的月份。人民军日志的 24 个月失败期限以它为锚点。 */
  chosenAt?: { year: number; month: number };
}

/**
 * Global progress of the Prepare for Revolution programme. Each lever can be pulled
 * three times over the whole game, so the menu spends one pull at a time and the card
 * leaves the deck once all nine are gone.
 */
export interface PrepareRevolutionUses {
  militiaUses: number;
  armyUses: number;
  sabotageUses: number;
}

/**
 * 土地所有权的六种归属（docs/工人控制度改造方案.md §2.1）。
 * 顺序即界面的显示顺序（私人三项 → 社会化三项）。
 */
export type LandOwnershipKey =
  | 'church'        // 教会土地
  | 'latifundia'    // 大庄园所有制
  | 'smallholders'  // 中小地主与自耕农所有制
  | 'cooperative'   // 农业合作社
  | 'collective'    // 农业集体
  | 'state';        // 国有土地

/** 生产资料所有权的六种归属。 */
export type IndustryOwnershipKey =
  | 'foreign'       // 外资控制
  | 'bigCapital'    // 大资本私有制
  | 'smallBusiness' // 小业主私有制
  | 'cooperative'   // 工业合作社
  | 'union'         // 地方工会所有制
  | 'state';        // 国有制

export type LandOwnership = Record<LandOwnershipKey, number>;
export type IndustryOwnership = Record<IndustryOwnershipKey, number>;

/** 所有权饼的部门键。 */
export type OwnershipSector = 'land' | 'industry';

/**
 * 两张所有权饼。每张六份，和恒为 100（整数百分比，与 `unionShare` 同一量纲）。
 * 写入走 `transferControlShare()`（整张饼一次配平），不要逐个 bucket 手写增量。
 */
export interface EconomyOwnershipShares {
  land: LandOwnership;
  industry: IndustryOwnership;
}

export interface GameState extends MapRuntimeState {
  screen: 'start' | 'game';
  currentView?: 'standard' | 'map';
  /** The peacetime standing army. The civil war instantiates it into `armies`. */
  armyFormations?: ArmyFormation[];
  scenario: '1931' | '1933' | '1936';
  actionsLeft: number;
  
  resources: number;
  armaments: number;
  dues: number;
  fundraising_timer: number;
  propaganda_timer: number;
  propaganda_by_deed_timer: number;
  mitin_popular_timer: number;
  prrevs_campaign_timer: number;
  organizations_timer: number;
  fijl_timer: number;
  mujeres_libres_timer: number;
  international_relations_timer: number;
  choose_enemies_timer: number;
  inter_party_relationships_timer: number;
  military_policy_timer: number;
  police_affairs_timer: number;
  agricultural_policy_timer: number;
  labor_rights_timer: number;
  labor_affairs_timer: number;
  fiscal_policy_timer: number;
  aragon_front_timer: number;
  militia_reorg_timer: number;
  anarchy_tanks_timer: number;
  prepare_revolution_timer: number;
  /** 经济改造卡牌冷却（方案 §6.1）。 */
  industry_policy_timer: number;
  trade_policy_timer: number;
  fiscal_measures_timer: number;
  land_and_freedom_timer: number;
  /** Persistent progress of the Prepare for Revolution programme: three pulls per lever, nine in total. */
  prepareRevolution: PrepareRevolutionUses;
  
  coupProgress: number;

  economy_growth: number;
  inflation_rate: number;
  unemployment_rate: number;
  /** Real output index (100 = scenario starting level); drives every monthly tax base. */
  economic_output_index: number;
  economyHistory?: { growth: number; inflation: number; unemployment: number; month: number; year: number }[];
  /** Treasury cash on hand. It is a stock, not the monthly operating balance. */
  budget: number;
  /** Obligations left unpaid after cash and borrowing capacity are exhausted. */
  fiscal_arrears: number;
  tax_lower_class: number;
  tax_middle_class: number;
  tax_upper_class: number;
  tax_tariff: number;
  tax_consumption: number;
  gold_reserves: number;
  foreign_exchange: number;
  public_debt: number;
  has_issued_war_bonds: boolean;
  military_spending: number;

  // ---- Economy Reform（经济改造）----
  // 全局计数器：每条经济路线日志读它们，每个卡牌/顾问选项给它们加点（docs/经济改造方案.md §3）。
  // 农业五项刻意无上限（[0,∞)），由选项逐次 +1，节奏交给卡牌冷却与 AP；其余见
  // `ECONOMY_REFORM_CAPS`。唯一写入口是 `advanceEconomyCounter()`，不要手写 Math.min。
  agricultural_cooperative: number;          // 农业合作社 [0,∞)
  land_requisition: number;                  // 农村土地征用 [0,∞)
  land_redemption: number;                   // 农村土地赎买 [0,∞)
  land_voluntary_collectivization: number;   // 自愿集体化 [0,∞)
  land_forced_collectivization: number;      // 强制集体化 [0,∞)
  currency_abolition: number;                // 废除货币 [0,3]
  private_bank_seizure: number;              // 没收私营银行储蓄 [0,1]
  mutual_credit_network: number;             // 地方互助信贷 [0,5]
  credit_exchange_committee: number;         // 信用与兑换委员会 [0,1]
  rail_nationalization: number;              // 铁路系统国有化 [0,3]
  coal_nationalization: number;              // 煤炭国有化 [0,2]
  industrial_cooperative: number;            // 工业合作社 [0,5]
  foreign_capital_seizure: number;           // 外资没收 [0,5]
  supply_coordination_network: number;       // 工团物资调控网络 [0,3]
  wartime_requisition: number;               // 战时农业强制征发 [0,1]
  family_rationing: number;                  // 家庭口粮本配给制 [0,1]
  war_industry_conversion: number;           // 军工紧急转产改组 [0,3]
  wartime_trade_monopoly: number;            // 战时外贸垄断 [0,2]
  /**
   * 顾问推动方案的累计次数。顶层计数器表达"做到了什么"，这里表达"谁在推、推了几次"。
   * 佩罗推 2 次开「合作社之路」，桑蒂利安推 3 次开「革命之后」（方案 §9.3）。
   */
  economy?: {
    cooperativePushes: number;
    organicPushes: number;
  };
  /**
   * 「废除货币」事件的确认结果。计数器到 3 级只代表推进完成；**只有玩家在
   * `currency_abolished` 事件里选择"正式宣布"**才会砍掉消费税税基（方案 §7.5）。
   * 可选：旧存档读入时为 undefined，等价于"未宣布"。
   */
  currency_abolished_declared?: boolean;
  /**
   * 土地与生产资料所有权（两张六分饼，各张和恒为 100）。
   * 取代 `stats.workerControl` 的单标尺；唯一写入口见 `rules/controlShares.ts`。
   * 可选：旧存档由 `migrateControlShares` 按剧本初值补齐。
   */
  controlShares?: EconomyOwnershipShares;

  workersAllianceProgress: number;
  cntVotingRate: number;
  prrevs_formed_months: number;
  prrevsConstructionLevel: number;
  // PRRevS formation can be deferred for three months or abandoned permanently
  // (see formation_of_prrevs event); both fields remain optional until decided.
  prrevsDeferralDate?: { year: number; month: number };
  prrevsAbandoned?: boolean;
  cntStance: 'oppose' | 'cooperate' | 'govern';
  /**
   * Monotonic record of the CNT's anti-electoral stance: starts true and is only
   * ever cleared once `cntStance` leaves 'oppose' (see the gameReducer funnel).
   * Optional so saves written before this field existed still load.
   */
  cntStanceAlwaysOpposed?: boolean;
  sandboxCardChoiceEnabled?: boolean;
  sandboxManualTaxAdjustmentEnabled?: boolean;
  sandboxSovereignInterventionsEnabled?: boolean;

  /** Registry-backed organization state. */
  organizations: OrganizationStateMap;

  /** 工会占比；optional 以便旧存档读取归一化。 */
  unionShare?: UnionShare;

  ateneos_established: number;
  
  advisorActionTimer: number;
  
  stats: {
    armyLoyalty: number;
    tension: number;
    /**
     * **派生值，只读**（工人控制度改造方案 §2.5）。
     *
     * 真相来源是 `controlShares` 的两张饼；本字段由 `reducers/postReducer.ts` 在每次
     * reducer 之后重算，等于两个部门劳动者份额的平均值（**国有制不计入**）。
     *
     * 三条使用规则：
     *  1. **任何判定逻辑都不得读它**——门槛读饼（`mayDays.ts` 读 CNT 工会份额与地方
     *     工会所有制，经济路线读 `getWorkersShare` / `getSocializedShare`）；
     *  2. 手写它的值没有意义，`postReducer` 会覆盖；
     *  3. 它只是给效果预览与旧界面文案用的显示口径，随饼图逐步退出。
     */
    workerControl: number;
    anarchistMilitia: number;
    republicanAuthority: number;
    revolutionaryFervor: number;
    bureaucratization: number;
  };
  
  cortes?: Record<Party, number>;
  partySupport: Record<Party, number>;
  lawStanceModifiers: LawStanceModifier[];
  activeCoalitions: CoalitionState[];
  rulingCoalition: CoalitionId | null;
  coalitionHistory: { id: CoalitionId; from: { year: number; month: number }; to: { year: number; month: number } }[];
  governmentCrisis: GovernmentCrisis | null;
  governmentCrisisSequence: number;
  earlyElectionInProgress: boolean;
  generalElectionSchedule: GeneralElectionSchedule;
  civilWarSetupCompletedAt?: { year: number; month: number };
  wartimePowerArrangement?: WartimePowerArrangement;
  mayDays?: MayDaysState;
  /** Republican political eligibility only; rebel organizations retain their assets. */
  republicanPartyStatus?: Partial<Record<Party, 'excluded' | 'withdrawn'>>;

  coalition_dissent?: number;
  gibraltar_resolved?: boolean;
  andorra_secured?: boolean;
  usa_total_embargo?: boolean;
  latin_american_diaspora_mobilized?: boolean;

  leverage: number;
  /** Immutable fiscal-review baseline; legacy `temp_` names are kept for save compatibility. */
  temp_tax_lower?: number;
  temp_tax_middle?: number;
  temp_tax_upper?: number;
  temp_tax_tariff?: number;
  temp_tax_consumption?: number;
  /** Editable rates kept separate from the active tax schedule until review conclusion. */
  draft_tax_lower?: number;
  draft_tax_middle?: number;
  draft_tax_upper?: number;
  draft_tax_tariff?: number;
  draft_tax_consumption?: number;
  fiscal_income_tax_submitted?: boolean;
  fiscal_trade_tax_submitted?: boolean;

  ministers: {
    labor: MinisterParty;
    health: MinisterParty;
    justice: MinisterParty;
    industry: MinisterParty;
    interior: MinisterParty;
    war: MinisterParty;
    agriculture: MinisterParty;
    finance?: MinisterParty;
    estado?: MinisterParty;
  };

  factions: Record<Faction, { influence: number; dissent: number }>;
  classes: Record<SocialClass, {
    support: Record<'CNT_FAI' | Exclude<Party, 'PRRevS'>, number>;
  }>;
  
  armedForces: {
    /**
     * The state's police corps. Their existence, strength and loyalty are all
     * derived from the Security Corps Law in `rules/securityForces.ts`: the Civil
     * Guard and the Assault Guard merge into the Republican Guard at level 3, which
     * workers' patrols then replace at level 4. Officer loyalty for the army as a
     * whole lives in `stats.armyLoyalty`; the army itself has no entry here because
     * its formations live in `armyFormations` and `armies`.
     */
    guardiaNacional: { manpower: number; loyalty: number };
    guardiaAsalto: { manpower: number; loyalty: number };
    guardiaRepublicana: { manpower: number; loyalty: number };
    patrullasObreras: { manpower: number; loyalty: number };
    /** Canonical source-owned manpower and equipment pools. */
    entityPools: Record<ArmedEntityId, ArmedEntityPool>;
  };

  /**
   * 各派系军事化率（0–100）。同派系全部队共享；单位不保存副本，结算时按 `identity` 查表。
   */
  militarization: MilitarizationState;
  /** 军事化路线选择与两条日志进度。和平期恒为 `{ chosen: 'none' }`。 */
  militarizationPaths: MilitarizationPaths;
  
  // Domestic Politics
  government: {
    type: string;
    typeZh: string;
    president: string;
    presidentZh: string;
    primeMinister: string;
    primeMinisterZh: string;
  };
  partyRelations: Record<Exclude<Party, 'PRRevS'>, number>;

  // Domestic Policy
  domesticPolicy: {
    land_law: number; // 0: 无土地改革, 1: 土地改革法, 2: 强制土地没收, 3: 革命集体化
    public_order_law: number;
    security_corps_law: number;
    army_reform_law: number;
    militia_legality_law: number;
    land_reform_progress: number;
    regional_autonomy_progress: number;
    max_hours_law: number;
    min_wage: number;
    workplace_safety: number;
    political_rights: number;
    womens_rights: number;
    religion_policy: number;
    education_institutions: number;
    language_policy: number;
    union_status: number;
    mixed_jury_cnt_opposed: boolean;
  };

  // International Relations
  relations: {
    uk: number;
    usa: number;
    france: number;
    germany: number;
    italy: number;
    portugal: number;
    ussr: number;
    mexico: number;
    internationalSocialists: number;
    syndicalistParty?: number;
  };

  // International Brigades
  internationalBrigades: number;
  internationalBrigadesFormed: boolean;

  // Civil War
  tankResearchProgress: number;
  tankResearchCompleted: boolean;
  aragonCouncilExists: boolean;

  warRuntime?: WarRuntime;
  asturiasWarTurns?: number;
  forceAsturiasRevolutionNextMonth?: boolean;
  
  // Super Events & Event Board
  superEvent: 'spanish_civil_war' | 'spanish_civil_war_ends' | 'abdication_alfonso' | null;
  pendingEvents: GameEvent[];
  eventHistory: EventHistory;

  // Story Flags
  treintistasLeft: boolean;
  commercialized_propaganda: number;
  campaign_propaganda: number;
  ideological_propaganda: number;
  radio: number;
  cinema: number;
  // Propaganda by the Deed state: a global assassination success-rate baseline
  // that drops after every attempt (success drops it more), plus per-target and
  // general training bonuses.
  assassination_success_base: number;
  assassination_training: Partial<Record<AssassinationTarget, number>>;
  assassination_training_general: number;
  calvoSoteloStatus: 'alive' | 'dead';
  primoDeRiveraStatus: 'alive' | 'dead';
  ramiroLedesmaStatus: 'alive' | 'dead';
  zamoraStatus: 'alive' | 'dead';
  alfonsoXIIIStatus: 'alive' | 'dead';
  fe_leadership_crisis: boolean;
  francoStatus: 'alive' | 'dead' | 'republic' | 'nationalist';
  africaArmyStatus: 'delayed' | 'nationalist' | 'republic' | 'neutral';
  cataloniaControl: 'republic' | 'cnt_fai' | 'committee';

  moscowGoldTransferred: boolean;
  pceInPower: boolean;
  pceAcceptsComintern: boolean;
  
  ps_founded: boolean;
  fe_founded: boolean;
  poum_founded: boolean;
  ceda_formed: boolean;
  ir_formed: boolean;
  ur_formed: boolean;
  falange_jons: boolean;
  isCasasViejasTriggered: boolean;
  isJabaliTriggered: boolean;
  isAndalusiaFireTriggered?: boolean;
  uhp_attempt_triggered: boolean;
  /**
   * 日志激活一律走"开始事件写 `journal.*.status`"，不再有单独的激活标志：
   * UHP 由「工人联盟的尝试？」开启，工人联盟由「十字路口」选项 A 开启
   * （旧的 `uhp_journal_activated` / `alliance_obrera_activated` 已随迁移删除）。
   */
  crossroads_uprising_alliance_decided?: boolean;
  crossroads_choice?: 'uprising' | 'popular_front';
  isRepublicanSocialistDissolved: boolean;
  isCedaRadicalDissolved: boolean;
  dissolutionCount: number;
  impeachPresidentAvailable: boolean;
  isPresidentImpeached: boolean;
  coupSystemActive: boolean;
  molaStatus: 'republic' | 'nationalist';
  queipoStatus: 'republic' | 'nationalist' | 'dead';
  coupTriggered10: boolean;
  coupTriggered20: boolean;
  coupTriggered30: boolean;
  coupTriggered40: boolean;
  coupTriggered50: boolean;
  coupTriggered60: boolean;
  coupTriggered70: boolean;
  coupTriggered80: boolean;
  coupTriggered90: boolean;
  coupTriggered100: boolean;
  
  durrutiAlive: boolean;
  sanjurjoStatus: 'alive' | 'dead';
  francoAfricaControl: boolean;
  hasArmoredCars: boolean;
  
  journal_ramon_franco_presidency_seen?: boolean;
  ramon_franco_campaign_count?: number;
  
  presidentElectionSeen?: boolean;
  cntParticipatePresidential?: boolean;
  presidentElectionLeftCandidate?: 'azana' | 'ramon_franco' | null;
  presidentElectionActiveCandidate?: 'left' | 'martinez_barrio' | 'gil_robles' | null;
  presidentElectionRound?: 1 | 2;
  campaignLobbyVisited?: {
    lobby_psoe?: boolean;
    lobby_erc?: boolean;
    lobby_street?: boolean;
    lobby_resources?: boolean;
    lobby_r2_martinez_barrio_switch?: boolean;
    lobby_r2_gil_robles_allies?: boolean;
  };
  
  covert_ops_france: number;
  covert_ops_portugal: number;
  
  regionalStatuses: RegionalStatuses;
  
  isGameOver: boolean;
  ending: string | null;
  unlockedAchievementsThisRun: string[];
  
  journal: Record<string, JournalState>;
  
  civilWarChoices?: Record<string, string>;
  
  activeAdvisors: (Advisor | null)[]; // Max 3
  advisorPool: Advisor[];
  
  currentEvent: GameEvent | null;
  /** Runtime rollback point for the easy-mode card refund option. */
  easyUndoState?: GameState | null;
  hand: Card[];
  actionDeck: Card[];
  governmentDeck: Card[];
  militaryDeck: Card[];
  discard: Card[];
}
