import React from 'react';
import { Province, Army } from '../map/types_map';

export type Faction = 'Treintistas' | 'Cenetistas' | 'Faistas' | 'Puristas' | 'Jabalistas';
export type Party = 'PSOE' | 'PCE' | 'IR' | 'UR' | 'PS' | 'FE' | 'POUM' | 'AP' | 'CT' | 'RE' | 'DLR' | 'PRR' | 'ERC' | 'Other';
export type SocialClass = 'Obreros' | 'Braceros' | 'Labradores' | 'Latifundistas' | 'PequenaBurguesia' | 'Intelectuales' | 'Burguesia' | 'Clero';

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

export interface GameEvent {
  id: string;
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
  scenario: '1931' | '1933' | '1936';
  difficulty: 'easy' | 'normal' | 'hard' | 'historical' | 'sandbox';
  language: 'en' | 'zh';
  year: number;
  month: number; // 1-12
  phase: 'event' | 'action';
  actionsLeft: number;
  
  resources: number;
  armaments: number;
  dues: number;
  fundraising_timer: number;
  propaganda_timer: number;
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
  war_bonds: number;
  military_spending: number;
  land_reform_compensation: number;

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
    economy: number;
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
  agriculture_minister_party: 'PSOE' | 'CNT' | 'IR' | 'PRR' | 'Right' | 'Other';
  labor_minister_party: 'PSOE' | 'CNT' | 'IR' | 'PRR' | 'Right';
  finance_minister_party: 'PSOE' | 'CNT' | 'IR' | 'PRR' | 'Right' | 'Other';
  estado_minister_party?: 'PSOE' | 'CNT' | 'IR' | 'PRR' | 'Right' | 'Other';
  temp_tax_lower?: number;
  temp_tax_middle?: number;
  temp_tax_upper?: number;
  temp_tax_tariff?: number;
  temp_tax_consumption?: number;
  ministers: {
    labor: 'PSOE' | 'CNT' | 'IR' | 'PRR' | 'Right';
    health: 'PSOE' | 'CNT' | 'IR' | 'PRR' | 'Right';
    justice: 'PSOE' | 'CNT' | 'IR' | 'PRR' | 'Right';
    industry: 'PSOE' | 'CNT' | 'IR' | 'PRR' | 'Right';
    interior: 'PSOE' | 'CNT' | 'IR' | 'PRR' | 'Right';
    war: 'PSOE' | 'CNT' | 'IR' | 'PRR' | 'Right';
    agriculture: 'PSOE' | 'CNT' | 'IR' | 'PRR' | 'Right' | 'Other';
    finance?: 'PSOE' | 'CNT' | 'IR' | 'PRR' | 'Right' | 'Other';
    estado?: 'PSOE' | 'CNT' | 'IR' | 'PRR' | 'Right' | 'Other';
  };

  factions: Record<Faction, { influence: number; dissent: number }>;
  classes: Record<SocialClass, {
    support: Record<'CNT_FAI' | Party, number>;
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
  partyRelations: Record<Party, number>;

  // Domestic Policy
  domesticPolicy: {
    nationalisation_progress: number;
    land_reform_progress: number;
    regional_autonomy_progress: number;
    max_hours_law: number;
    min_wage: number;
    workplace_safety: number;
    women_suffrage: number;
    religion_policy: number;
    abortion_rights: number;
    education_institutions: number;
    land_reform_law_enabled: boolean;
    mixed_jury_law_enabled: boolean;
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
  warProgress: number; // 0 (Republic Victory) to 100 (Nationalist Victory), 50 is stalemate
  
  // Super Events & Event Board
  superEvent: 'spanish_civil_war' | 'spanish_civil_war_ends' | 'abdication_alfonso' | null;
  pendingEvents: GameEvent[];

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
  cntFaiInGovernment: boolean;
  pceInPower: boolean;
  pceAcceptsComintern: boolean;
  
  ps_founded: boolean;
  fe_founded: boolean;
  poum_founded: boolean;
  falange_jons: boolean;
  
  durrutiAlive: boolean;
  sanjurjoStatus: 'alive' | 'dead';
  francoAfricaControl: boolean;
  cataloniaIndependent: boolean;
  hasArmoredCars: boolean;
  womensRightsReformed: boolean;
  internationalBrigadesArrived: boolean;
  educationSecularized: boolean;
  
  covert_ops_france: number;
  covert_ops_portugal: number;
  
  isGameOver: boolean;
  ending: string | null;
  unlockedAchievementsThisRun: string[];
  
  journal: Record<string, JournalState>;
  
  activeAdvisors: (Advisor | null)[]; // Max 3
  advisorPool: Advisor[];
  
  currentEvent: GameEvent | null;
  hand: Card[];
  actionDeck: Card[];
  governmentDeck: Card[];
  militaryDeck: Card[];
  discard: Card[];
}
