import React from 'react';
import { Province, Army, MapFaction, ResourceSet } from '../map/types_map';
import { Party } from './parties';

export type Faction = 'Treintistas' | 'Cenetistas' | 'Faistas' | 'Puristas' | 'Jabalistas';
export type { Party };
export type MinisterParty = 'PSOE' | 'CNT' | 'IR' | 'PRR' | 'Right' | 'Other' | 'DLR' | 'ERC' | 'UR';
export type SocialClass = 'Obreros' | 'Braceros' | 'Labradores' | 'Latifundistas' | 'PequenaBurguesia' | 'Intelectuales' | 'Burguesia' | 'Clero';

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
  | 'republican_socialist'   // 共和-社会党联盟
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

export interface CoalitionDef {
  id: CoalitionId;
  name: string;
  nameZh: string;
  members: (Party | 'CNT_FAI')[];
  minSeatShare: number;
  canForm?: (state: GameState) => boolean;
  shouldDissolve?: (state: GameState, coalition: CoalitionState) => boolean;
  dissolveThreshold: number;
}

export type EventCategory = 'news' | 'cnt' | 'politics' | 'war' | 'other';
export type EventFlow = 'solo' | 'inline';

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

export interface GameEvent {
  id: string;
  meta?: GameEventMeta;
  date?: { year: number; month: number };
  condition?: (state: GameState) => boolean;
  title: string | ((state: GameState) => string);
  titleZh?: string | ((state: GameState) => string);
  description: string;
  descriptionZh?: string;
  image?: string;
  renderContent?: (state: GameState) => React.ReactNode;
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
  isPRRevSFormed: boolean;
  prrevs_formed_months: number;
  prrevsConstructionLevel: number;
  cntStance: 'oppose' | 'cooperate' | 'govern';
  sandboxCardChoiceEnabled?: boolean;

  ateneos_established: number;
  fijl_established: boolean;
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
  activeCoalition: CoalitionState | null;
  coalitionHistory: { id: CoalitionId; from: { year: number; month: number }; to: { year: number; month: number } }[];

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
  militaryDeckEnabled: boolean;
  
  ps_founded: boolean;
  fe_founded: boolean;
  poum_founded: boolean;
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
  coalition_just_dissolved: boolean;
  coupSystemActive: boolean;
  molaStatus: 'republic' | 'nationalist';
  queipoStatus: 'republic' | 'nationalist';
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
  ramonFrancoPresidentUnlocked?: boolean;
  ramon_franco_campaign_count?: number;
  
  presidentElectionSeen?: boolean;
  presidentElectionPhase?: 'primary' | 'general';
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
  
  civilWarChainStep?: number;
  
  activeAdvisors: (Advisor | null)[]; // Max 3
  advisorPool: Advisor[];
  
  currentEvent: GameEvent | null;
  hand: Card[];
  actionDeck: Card[];
  governmentDeck: Card[];
  militaryDeck: Card[];
  discard: Card[];
}
