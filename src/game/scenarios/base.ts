/**
 * Scenario-agnostic start-state base.
 *
 * `PRE_START_STATE` is the state the store holds before any scenario exists: the
 * START screen renders from it, and `START_GAME` replaces every scenario-owned
 * key. It is NOT a scenario start - use `createScenarioState` for that. Its
 * scenario-owned values are pre-game placeholders that survive only because the
 * starting-event filter evaluates event conditions against this exact shape.
 *
 * `NEUTRAL_STATE` is what the scenario factory builds on: the same template with
 * every scenario-owned key *removed* (`SCENARIO_OWNED_KEYS`), so no 1931 value
 * can be inherited silently by another scenario. Those keys are written back
 * exclusively from a `ScenarioDefinition`, which the compiler requires to be
 * complete for every scenario.
 */
import type { GameState } from '../types';
import { ECONOMIC_RULES } from '../rules/economy';
import { CARD_REGISTRY } from '../registries/cardRegistry';
import { INITIAL_ADVISORS } from '../advisors';
import { JOURNAL_ENTRIES } from '../journal';
import { MapFaction } from '../../map/types_map';
import { createDefaultMapResources, INITIAL_PROVINCES, getDefaultArmyFormations } from '../../map/map_constants';
import { INITIAL_CLASSES, INITIAL_PARTY_RELATIONS } from '../parties';
import { getDefaultOrganizationState, getDefaultArmedEntityPools } from '../organizations';
import { createDefaultMilitarization, createDefaultMilitarizationPaths } from '../rules/militarization';
import { getDefaultUnionShare } from '../unions';
const initialJournalState = JOURNAL_ENTRIES.reduce((acc, entry) => {
  acc[entry.id] = { 
    id: entry.id, 
    status: 'inactive', 
    progress: 0,
    ...(entry.id === 'journal_land_reform' ? { failureProgress: 0 } : {})
  };
  return acc;
}, {} as Record<string, any>);

export const PRE_START_STATE: GameState = {
  screen: 'start',
  currentView: 'standard',
  provinces: INITIAL_PROVINCES,
  // Peace keeps no troops on the map. The standing army lives in `armyFormations`
  // and the civil war instantiates it into `armies`.
  armies: [],
  armyFormations: getDefaultArmyFormations(),
  mapSelectedProvinceId: null,
  mapSelectedArmyId: null,
  mapSelectedArmyIds: [],
  mapCurrentPlayer: MapFaction.REPUBLICAN,
  mapResources: createDefaultMapResources(),
  mapHistory: [],
  scenario: '1931',
  difficulty: 'normal',
  language: 'en',
  year: 1931,
  month: 4,
  phase: 'event',
  actionsLeft: 2,
  resources: 2,
  armaments: 1,
  dues: 2,
  fundraising_timer: 0,
  propaganda_timer: 0,
  propaganda_by_deed_timer: 0,
  mitin_popular_timer: 0,
  prrevs_campaign_timer: 0,
  organizations_timer: 0,
  fijl_timer: 0,
  mujeres_libres_timer: 0,
  international_relations_timer: 0,
  choose_enemies_timer: 0,
  inter_party_relationships_timer: 0,
  military_policy_timer: 0,
  police_affairs_timer: 0,
  agricultural_policy_timer: 0,
  labor_rights_timer: 0,
  labor_affairs_timer: 0,
  fiscal_policy_timer: 0,
  aragon_front_timer: 0,
  militia_reorg_timer: 0,
  anarchy_tanks_timer: 0,
  prepare_revolution_timer: 0,
  industry_policy_timer: 0,
  trade_policy_timer: 0,
  fiscal_measures_timer: 0,
  land_and_freedom_timer: 0,
  prepareRevolution: { militiaUses: 0, armyUses: 0, sabotageUses: 0 },
  coupProgress: 0,
  economy_growth: ECONOMIC_RULES.defaults.growth,
  inflation_rate: ECONOMIC_RULES.defaults.inflation,
  unemployment_rate: 11.2,
  economic_output_index: ECONOMIC_RULES.defaults.outputIndex,
  economyHistory: [
    { year: 1930, month: 10, growth: 2.1, inflation: 3.1, unemployment: 10.5 },
    { year: 1930, month: 11, growth: 2.3, inflation: 3.2, unemployment: 10.7 },
    { year: 1930, month: 12, growth: 2.2, inflation: 3.4, unemployment: 10.9 },
    { year: 1931, month: 1, growth: 2.4, inflation: 3.3, unemployment: 11.0 },
    { year: 1931, month: 2, growth: 2.5, inflation: 3.6, unemployment: 11.1 },
    { year: 1931, month: 3, growth: 2.5, inflation: 3.5, unemployment: 11.2 }
  ],
  budget: ECONOMIC_RULES.defaults.budget,
  fiscal_arrears: ECONOMIC_RULES.defaults.fiscalArrears,
  tax_lower_class: ECONOMIC_RULES.defaults.lowerTax,
  tax_middle_class: ECONOMIC_RULES.defaults.middleTax,
  tax_upper_class: ECONOMIC_RULES.defaults.upperTax,
  tax_tariff: ECONOMIC_RULES.defaults.tariff,
  tax_consumption: ECONOMIC_RULES.defaults.consumptionTax,
  gold_reserves: ECONOMIC_RULES.defaults.goldReserves,
  foreign_exchange: ECONOMIC_RULES.defaults.foreignExchange,
  public_debt: ECONOMIC_RULES.defaults.debt,
  has_issued_war_bonds: false,
  military_spending: ECONOMIC_RULES.defaults.militarySpending,
  // ---- Economy Reform（经济改造）----
  // 全部从 0 起：经济增长不预设任何已完成的生产关系改造，三份剧本共用同一基线。
  // 农业五项无上限，其余上限见 rules/economyReforms.ts 的 ECONOMY_REFORM_CAPS。
  agricultural_cooperative: 0,
  land_requisition: 0,
  land_redemption: 0,
  land_voluntary_collectivization: 0,
  land_forced_collectivization: 0,
  currency_abolition: 0,
  private_bank_seizure: 0,
  mutual_credit_network: 0,
  credit_exchange_committee: 0,
  rail_nationalization: 0,
  coal_nationalization: 0,
  industrial_cooperative: 0,
  foreign_capital_seizure: 0,
  supply_coordination_network: 0,
  wartime_requisition: 0,
  family_rationing: 0,
  war_industry_conversion: 0,
  wartime_trade_monopoly: 0,
  economy: { cooperativePushes: 0, organicPushes: 0 },
  workersAllianceProgress: 0,
  cntVotingRate: 15,
  prrevs_formed_months: 0,
  prrevsConstructionLevel: 0,
  cntStance: 'oppose',
  cntStanceAlwaysOpposed: true,
  sandboxCardChoiceEnabled: false,
  sandboxManualTaxAdjustmentEnabled: false,
  sandboxSovereignInterventionsEnabled: false,
  organizations: getDefaultOrganizationState('1931'),
  unionShare: getDefaultUnionShare('1931'),
  ateneos_established: 0,
  advisorActionTimer: 0,
  stats: {
    armyLoyalty: 60,
    tension: 34,
    workerControl: 10,
    anarchistMilitia: 0,
    republicanAuthority: 50,
    revolutionaryFervor: 10,
    bureaucratization: 0,
  },
  factions: {
    Treintistas: { influence: 10, dissent: 30 },
    Cenetistas: { influence: 35, dissent: 10 },
    Faistas: { influence: 45, dissent: 15 },
    Puristas: { influence: 10, dissent: 20 },
    Jabalistas: { influence: 0, dissent: 0 },
  },
  classes: INITIAL_CLASSES,
  armedForces: {
    // All four police corps are derived from the Security Corps Law; only the
    // ones the current law level provides ever hold manpower.
    guardiaNacional: { manpower: 30000, loyalty: 35 },
    guardiaAsalto: { manpower: 0, loyalty: 0 },
    guardiaRepublicana: { manpower: 0, loyalty: 0 },
    patrullasObreras: { manpower: 0, loyalty: 0 },
    entityPools: getDefaultArmedEntityPools(),
  },
  // 各派系军事化率与军事化路线。路线在内战爆发后才由事件选择，和平期恒为 `none`。
  militarization: createDefaultMilitarization(),
  militarizationPaths: createDefaultMilitarizationPaths(),
  government: {
    type: 'Provisional Government',
    typeZh: '临时政府',
    president: 'Niceto Alcalá-Zamora',
    presidentZh: '尼塞托·阿尔卡拉-萨莫拉',
    primeMinister: 'Niceto Alcalá-Zamora',
    primeMinisterZh: '尼塞托·阿尔卡拉-萨莫拉',
  },
  partyRelations: INITIAL_PARTY_RELATIONS,
  domesticPolicy: {
    land_law: 0,
    public_order_law: 0,
    security_corps_law: 0,
    army_reform_law: 0,
    militia_legality_law: 0,
    land_reform_progress: 0,
    regional_autonomy_progress: 0,
    max_hours_law: 0,
    min_wage: 0,
    workplace_safety: 0,
    political_rights: 0,
    womens_rights: 0,
    religion_policy: 0,
    education_institutions: 0,
    language_policy: 0,
    union_status: 0,
    mixed_jury_cnt_opposed: false,
  },
  relations: {
    uk: 50,
    usa: 50,
    france: 50,
    germany: 50,
    italy: 50,
    portugal: 50,
    ussr: 50,
    mexico: 50,
    internationalSocialists: 50,
    syndicalistParty: 0,
  },
  internationalBrigades: 0,
  internationalBrigadesFormed: false,
  tankResearchProgress: 0,
  tankResearchCompleted: false,
  aragonCouncilExists: false,
  civilWarStatus: 'not_started',
  activeWar: null,
  wars: {
    spanish_civil_war: 'not_started',
    asturias_war: 'not_started',
  },
  asturiasWarTurns: 0,
  forceAsturiasRevolutionNextMonth: false,
  leverage: 0,
  ministers: {
    labor: 'AP',
    health: 'AP',
    justice: 'AP',
    industry: 'AP',
    interior: 'AP',
    war: 'AP',
    agriculture: 'AP',
    finance: 'AP',
    estado: 'AP',
  },
  superEvent: null,
  pendingEvents: [],
  eventHistory: {
    triggered: [],
    resolved: [],
  },
  treintistasLeft: false,
  commercialized_propaganda: 0,
  campaign_propaganda: 0,
  ideological_propaganda: 0,
  radio: 0,
  cinema: 0,
  assassination_success_base: 65,
  assassination_training: {},
  assassination_training_general: 0,
  calvoSoteloStatus: 'alive',
  primoDeRiveraStatus: 'alive',
  ramiroLedesmaStatus: 'alive',
  zamoraStatus: 'alive',
  alfonsoXIIIStatus: 'alive',
  fe_leadership_crisis: false,
  francoStatus: 'alive',
  africaArmyStatus: 'neutral',
  cataloniaControl: 'republic',
  moscowGoldTransferred: false,
  pceInPower: false,
  pceAcceptsComintern: false,
  ps_founded: false,
  fe_founded: false,
  poum_founded: false,
  ceda_formed: false,
  ir_formed: false,
  ur_formed: false,
  falange_jons: false,
  isCasasViejasTriggered: false,
  isJabaliTriggered: false,
  isAndalusiaFireTriggered: false,
  uhp_attempt_triggered: false,
  crossroads_uprising_alliance_decided: false,
  crossroads_choice: undefined,
  isRepublicanSocialistDissolved: false,
  isCedaRadicalDissolved: false,
  dissolutionCount: 0,
  impeachPresidentAvailable: false,
  isPresidentImpeached: false,
  coupSystemActive: false,
  molaStatus: 'republic',
  queipoStatus: 'republic',
  coupTriggered10: false,
  coupTriggered20: false,
  coupTriggered30: false,
  coupTriggered40: false,
  coupTriggered50: false,
  coupTriggered60: false,
  coupTriggered70: false,
  coupTriggered80: false,
  coupTriggered90: false,
  coupTriggered100: false,
  durrutiAlive: true,
  sanjurjoStatus: 'alive',
  francoAfricaControl: false,
  hasArmoredCars: false,
  journal_ramon_franco_presidency_seen: false,
  ramon_franco_campaign_count: 0,
  presidentElectionSeen: false,
  cntParticipatePresidential: false,
  presidentElectionLeftCandidate: null,
  presidentElectionActiveCandidate: null,
  presidentElectionRound: 1,
  campaignLobbyVisited: {
    lobby_psoe: false,
    lobby_erc: false,
    lobby_street: false,
    lobby_resources: false,
    lobby_r2_martinez_barrio_switch: false,
    lobby_r2_gil_robles_allies: false
  },
  covert_ops_france: 0,
  covert_ops_portugal: 0,
  regionalStatuses: {
    andalusia: 'direct',
    catalonia: 'direct',
    basque: 'direct',
    galicia: 'direct',
    asturias: 'direct',
  },
  isGameOver: false,
  ending: null,
  unlockedAchievementsThisRun: [],
  journal: initialJournalState,
  activeAdvisors: [null, null, null],
  advisorPool: INITIAL_ADVISORS.filter(a => a.id !== 'Ramón Franco' && a.id !== 'Pedro Vallina' && a.id !== 'Eduardo Barriobero'),
  currentEvent: null,
  easyUndoState: null,
  hand: [],
  actionDeck: CARD_REGISTRY.filter(c => c.type === 'Action'),
  governmentDeck: CARD_REGISTRY.filter(c => c.type === 'Government'),
  militaryDeck: CARD_REGISTRY.filter(c => c.type === 'Military'),
  discard: [],
  partySupport: {
    POUM: 0, PCE: 0, PSOE: 0, PS: 0, ERC: 0, IR: 0, UR: 0, PNV: 0, PRR: 0, DLR: 0, AP: 0, RE: 0, CT: 0, FE: 0, Other: 0, PRRevS: 0
  },
  lawStanceModifiers: [],
  activeCoalitions: [],
  rulingCoalition: null,
  coalitionHistory: [],
  governmentCrisis: null,
  governmentCrisisSequence: 0,
  earlyElectionInProgress: false,
  generalElectionSchedule: {
    lastElectionAt: null,
    nextElectionAt: { year: 1931, month: 6 },
    reason: 'constituent',
  },
  coalition_dissent: 0,
};
/**
 * Every `GameState` key whose value depends on which scenario is being started.
 *
 * `NEUTRAL_STATE` removes them; `createScenarioState` writes them back from the
 * scenario descriptor. Adding a scenario-varying key here makes it impossible to
 * forget it in a scenario file: `Pick<GameState, ScenarioOwnedKey>` is a required
 * object, so a missing key is a compile error rather than a silent 1931 fallback.
 */
export const SCENARIO_OWNED_KEYS = [
  'scenario',
  'year',
  'month',
  'civilWarStatus',
  'generalElectionSchedule',
  'government',
  'ministers',
  'cortes',
  'classes',
  'domesticPolicy',
  'organizations',
  'unionShare',
  'economy_growth',
  'inflation_rate',
  'unemployment_rate',
  'budget',
  'gold_reserves',
  'foreign_exchange',
  'public_debt',
  'has_issued_war_bonds',
  'military_spending',
  'ps_founded',
  'fe_founded',
  'poum_founded',
  'ceda_formed',
  'ir_formed',
  'ur_formed',
  'treintistasLeft',
  'falange_jons',
  'isCasasViejasTriggered',
  'isJabaliTriggered',
  'isRepublicanSocialistDissolved',
  'isCedaRadicalDissolved',
  'dissolutionCount',
  'governmentCrisisSequence',
  'impeachPresidentAvailable',
  'isPresidentImpeached',
  'presidentElectionSeen',
  'coupSystemActive',
  'superEvent',
  'regionalStatuses',
  'armedForces',
  // 两张所有权饼按剧本给出（docs/工人控制度改造方案.md §2.4）：
  // 1936 的乡村与城市起点与 1931 完全不同，绝不能从模板继承。
  'controlShares',
] as const;

export type ScenarioOwnedKey = (typeof SCENARIO_OWNED_KEYS)[number];

/**
 * The peacetime police corps. Not scenario-owned: every start uses the same
 * baseline roster; scenario militia manpower is applied to canonical entity pools.
 */
export const NEUTRAL_ARMED_FORCES = PRE_START_STATE.armedForces;

/** Build the scenario-free base by dropping every scenario-owned key. */
const buildNeutralState = (): Omit<GameState, ScenarioOwnedKey> => {
  const base: Record<string, unknown> = { ...PRE_START_STATE };
  for (const key of SCENARIO_OWNED_KEYS) {
    delete base[key];
  }
  return base as unknown as Omit<GameState, ScenarioOwnedKey>;
};

export const NEUTRAL_STATE: Omit<GameState, ScenarioOwnedKey> = buildNeutralState();
