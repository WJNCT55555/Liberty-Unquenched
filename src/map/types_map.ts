/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum MapFaction {
  REPUBLICAN = 'REPUBLICAN',
  NATIONALIST = 'NATIONALIST',
  IBERIAN_DEFENSE = 'IBERIAN_DEFENSE',
  PORTUGAL = 'PORTUGAL',
  NEUTRAL = 'NEUTRAL',
  WORKERS_ALLIANCE = 'WORKERS_ALLIANCE',
  UNITED_KINGDOM = 'UNITED_KINGDOM',
  ANDORRA = 'ANDORRA',
}

/** Stable provenance ids shared by pre-war pools, recruitment, saves, and map units. */
export type ArmedEntityId =
  | 'republican_state'
  | 'cnt_defense_committees'
  | 'ugt_socialist_militias'
  | 'maoc'
  | 'fifth_regiment'
  | 'poum_militias'
  | 'requetes'
  | 'falange_first_line'
  | 'euzko_gudarostea'
  | 'international_brigades'
  | 'italian_ctv';

export interface Province {
  id: string;
  name: string;
  owner: MapFaction;
  isCoastal: boolean;
  /**
   * Retained for display and AI scoring only. Province manpower income is
   * DISABLED: wartime manpower comes from the armed-entity pools instead, which
   * events and cards feed (see `calculateMonthlyMapStage`).
   */
  manpower: number;
  industry: number;
  strategicValue: number; // 0-10
  terrain: 'urban' | 'plains' | 'mountains' | 'forest';
  /** Inherent defensive level (0-3); a built fortress adds on top of it. */
  fortification: number; // 0-3
    buildings?: {
    barracks?: number;
    fortress?: number;
    recruitingOffice?: number;
    ammoFactory?: number;
  };
}

/** Effective fortress level: inherent terrain defence plus everything built. */
export const MAX_BUILT_FORTRESS = 3;
export const MAX_EFFECTIVE_FORTRESS = 6;

export const getEffectiveFortressLevel = (province: {
  fortification?: number;
  buildings?: { fortress?: number };
}): number => Math.min(
  MAX_EFFECTIVE_FORTRESS,
  Math.max(0, province.fortification || 0) + Math.max(0, province.buildings?.fortress || 0),
);

export interface ArmyComposition {
  infantry: number;   // Number of infantry soldiers
  artillery: number;  // Number of artillery crew/forces
  tanks: number;      // Number of tank forces
}

/** Political identity of a map unit. Missing identities are normalized to gov. */
export type ArmyIdentity = 'gov' | 'cnt' | 'ugt' | 'poum' | 'pce' | 'intl' | 'requetes' | 'falange' | 'regional';

export interface Army {
  id: string;
  faction: MapFaction;
  identity?: ArmyIdentity;
  /** Recruitment origin, retained through splits, merges and save restoration. */
  sourceEntityId?: ArmedEntityId;
  /** Historical formation name. The map and the sidebar both read this field. */
  name?: string;
  nameZh?: string;
  provinceId: string;
  movesLeft: number; // Max 2 per turn
  manpower: number;  // Total troop count (infantry + artillery + tanks)
  maxManpower: number; // Designed max/total troop count
  composition: ArmyComposition; // Current composition
  designedComposition: ArmyComposition; // Designed composition
  morale: number;    // Fighting spirit (0-100)
  militarization: number; // Experience/Efficiency (0-100)
}

/**
 * A peacetime army formation: the standing army as it exists before it is placed
 * on the map. Peace keeps no troops on the map at all, so this roster — not
 * `GameState.armies` — is what the sidebar shows and what army cards edit. The
 * civil war instantiates these into map units exactly once.
 */
export interface ArmyFormation {
  id: string;
  name: string;
  nameZh: string;
  /** Province the formation is garrisoned in once it reaches the map. */
  provinceId: string;
  manpower: number;
  maxManpower: number;
  composition: ArmyComposition;
  designedComposition: ArmyComposition;
  morale: number;
  militarization: number;
}

export interface ResourceSet {
  manpower: number;
  industrialCapacity: number;
  commandPoints: number; // 2 per turn
  supplies: number;
  tankReserve: number;
}

export interface IberianDefenseState {
  formedAt: { year: number; month: number };
  allies: { poum: boolean; psoeLeft: boolean };
  leftSocialistReserve: number;
  eliminated: MapFaction[];
  eliminations: Array<{ faction: MapFaction; recipient: MapFaction; year: number; month: number }>;
  surrenderThresholds: Partial<Record<MapFaction, number>>;
  completedAiMonth?: number;
  playerDefeated?: boolean;
  winner?: MapFaction;
  initialProvinces: string[];
  contributions: { cnt: number; poum: number; psoeLeft: number };
}

/**
 * Required state owned or consumed by the strategic-map runtime.
 *
 * Field names intentionally match the canonical application GameState. This
 * lets the complete state satisfy the contract directly and avoids a second
 * resources/currentPlayer/selection vocabulary.
 */
export interface MapRuntimeState {
  difficulty: 'easy' | 'normal' | 'hard' | 'historical' | 'sandbox';
  language: 'en' | 'zh';
  year: number;
  month: number;
  phase: 'event' | 'action' | 'war';
  civilWarStatus: 'not_started' | 'ongoing' | 'won' | 'lost';
  activeWar?: 'spanish_civil_war' | 'asturias_war' | null;
  wars?: {
    spanish_civil_war?: 'not_started' | 'ongoing' | 'won' | 'lost';
    asturias_war?: 'not_started' | 'ongoing' | 'won' | 'lost' | 'failed';
  };
  provinces: Record<string, Province>;
  armies: Army[];
  mapSelectedProvinceId: string | null;
  mapSelectedArmyId: string | null;
  mapSelectedArmyIds: string[];
  mapCurrentPlayer: MapFaction;
  iberianDefense?: IberianDefenseState;
  mapResources: Record<MapFaction, ResourceSet>;
  mapHistory: string[];
}
