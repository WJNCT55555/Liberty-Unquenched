import React from 'react';
import { Province, Army, MapFaction, ResourceSet } from '../map/types_map';
import { Party } from './parties';

export type Faction = 'Treintistas' | 'Cenetistas' | 'Faistas' | 'Puristas' | 'Jabalistas';
export type { Party };

/**
 * Organizations are deliberately separate from parties and internal factions:
 * a party can sponsor several organizations, while an organization may exist
 * before (or without) a parliamentary party.  Keep this list extensible as
 * future party organizations are added to the registry.
 */
export type OrganizationId = 'CNT' | 'FAI' | 'FIJL' | 'ML' | 'FNA' | 'DC' | 'PRRevS';
export type OrganizationType = 'union' | 'political' | 'youth' | 'women' | 'agricultural' | 'militia';
export type OrganizationOwner = Party | 'CNT_FAI';

export interface OrganizationState {
  established: boolean;
  establishedAt?: { year: number; month: number };
}

export type OrganizationStateMap = Partial<Record<OrganizationId, OrganizationState>>;
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
  | 'ceda_radical'            // CEDA-激进联盟
  | 'workers_alliance'        // 工人联盟 (PSOE + CNT)
  | 'national_front';         // 国民阵线

export interface CoalitionState {
  activeId: CoalitionId;
  memberContributions: Record<Party, number>;
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

export interface CoalitionDef {
  id: CoalitionId;
  name: string;
  nameZh: string;
  members: (Party | 'CNT_FAI')[];
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
export type GameEventDispatch = (action: {
  type: 'RESOLVE_EVENT';
  payload: (state: GameState) => Partial<GameState>;
}) => void;

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

export interface GameState {
  screen: 'start' | 'game';
  currentView?: 'standard' | 'map';
  provinces?: Record<string, Province>;
  armies?: Army[];
  mapSelectedProvinceId?: string | null;
  mapSelectedArmyId?: string | null;
  mapSelectedArmyIds?: string[];
  mapCurrentPlayer?: MapFaction;
  mapResources?: Record<MapFaction, ResourceSet>;
  mapHistory?: string[];
  mapAiConfig?: {
    enabled: boolean;
    aiFaction: MapFaction;
    difficulty: 'easy' | 'normal' | 'hard';
    confirmed?: boolean;
  };
  scenario: '1931' | '1933' | '1936';
  difficulty: 'easy' | 'normal' | 'hard' | 'historical' | 'sandbox';
  language: 'en' | 'zh';
  year: number;
  month: number; // 1-12
  phase: 'event' | 'action' | 'war';
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
  international_relations_timer: number;
  choose_enemies_timer: number;
  inter_party_relationships_timer: number;
  military_policy_timer: number;
  agricultural_policy_timer: number;
  labor_rights_timer: number;
  labor_affairs_timer: number;
  fiscal_policy_timer: number;
  
  coupProgress: number;

  economy_growth: number;
  inflation_rate: number;
  unemployment_rate: number;
  economyHistory?: { growth: number; inflation: number; unemployment: number; month: number; year: number }[];
  budget: number;
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

  workersAllianceProgress: number;
  cntVotingRate: number;
  /** @deprecated Use organizations.PRRevS.established. Kept for save compatibility. */
  isPRRevSFormed: boolean;
  prrevs_formed_months: number;
  prrevsConstructionLevel: number;
  // PRRevS formation can be deferred for three months or abandoned permanently
  // (see formation_of_prrevs event); both fields are optional for save compatibility.
  prrevsDeferralDate?: { year: number; month: number };
  prrevsAbandoned?: boolean;
  cntStance: 'oppose' | 'cooperate' | 'govern';
  sandboxCardChoiceEnabled?: boolean;
  sandboxManualTaxAdjustmentEnabled?: boolean;

  /** Registry-backed organization state. Optional for loading pre-registry saves. */
  organizations?: OrganizationStateMap;

  ateneos_established: number;
  /** @deprecated Use organizations.FIJL.established. Kept for save compatibility. */
  fijl_established: boolean;
  /** @deprecated Use organizations.ML.established. Kept for save compatibility. */
  mujeres_libres_established: boolean;
  
  advisorActionTimer: number;
  
  stats: {
    armyLoyalty: number;
    tension: number;
    workerControl: number;
    anarchistMilitia: number;
    republicanAuthority: number;
    revolutionaryFervor: number;
    bureaucratization: number;
  };
  
  cortes?: Record<Party, number>;
  partySupport: Record<Party, number>;
  // Optional for save compatibility.  Missing modifiers resolve to the
  // historical baseline matrix.
  lawStanceModifiers?: LawStanceModifier[];
  activeCoalitions: CoalitionState[];
  rulingCoalition: CoalitionId | null;
  coalitionHistory: { id: CoalitionId; from: { year: number; month: number }; to: { year: number; month: number } }[];
  governmentCrisis: GovernmentCrisis | null;
  governmentCrisisSequence: number;
  earlyElectionInProgress: boolean;

  coalition_dissent?: number;
  gibraltar_resolved?: boolean;
  andorra_secured?: boolean;
  usa_total_embargo?: boolean;
  latin_american_diaspora_mobilized?: boolean;

  leverage: number;
  temp_tax_lower?: number;
  temp_tax_middle?: number;
  temp_tax_upper?: number;
  temp_tax_tariff?: number;
  temp_tax_consumption?: number;

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
    regularArmy: { manpower: number; loyalty: number };
    guardiaNacional: { manpower: number; loyalty: number };
    guardiaAsalto: { manpower: number; loyalty: number };
    militias: {
      cntFai: number;
      maoc: number;
      poum: number;
      ugt: number;
      requete: number;
      falange: number;
      africaArmy: number;
    };
  };
  
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
    land_reform_law_enabled: boolean;
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
  militiaCombatPower: number;
  tankResearchProgress: number;
  tankResearchCompleted: boolean;
  aragonCouncilExists: boolean;
  aragonTimer: number;
  militiaReorgTimer: number;
  tankTimer: number;

  civilWarStatus: 'not_started' | 'ongoing' | 'won' | 'lost';
  
  activeWar?: 'spanish_civil_war' | 'asturias_war' | null;
  wars?: {
    spanish_civil_war?: 'not_started' | 'ongoing' | 'won' | 'lost';
    asturias_war?: 'not_started' | 'ongoing' | 'won' | 'lost' | 'failed';
  };
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
  socialism: number;
  nationalism: number;
  pacifism: number;
  democratization: number;
  pro_republic: number;
  francoStatus: 'alive' | 'dead' | 'republic' | 'nationalist';
  africaArmyStatus: 'delayed' | 'nationalist' | 'republic' | 'neutral';
  cataloniaControl: 'republic' | 'cnt_fai' | 'committee';
  navyStatus: 'republic' | 'nationalist' | 'anarchist' | 'neutral';

  moscowGoldTransferred: boolean;
  pceInPower: boolean;
  pceAcceptsComintern: boolean;
  /** @deprecated Use organizations.DC.established. Kept for save compatibility. */
  militaryDeckEnabled: boolean;
  
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
  uhp_journal_activated: boolean;
  alliance_obrera_activated: boolean;
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
  womensRightsReformed: boolean;
  internationalBrigadesArrived: boolean;
  educationSecularized: boolean;
  
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
