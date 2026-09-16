/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ArmedEntityId } from '../game/types';

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

export interface GameState {
  turn: number;
  date: string;
  currentPlayer: MapFaction;
  resources: {
    [MapFaction.REPUBLICAN]: ResourceSet;
    [MapFaction.NATIONALIST]: ResourceSet;
    [MapFaction.PORTUGAL]: ResourceSet;
    [MapFaction.IBERIAN_DEFENSE]?: ResourceSet;
  };
  provinces: { [key: string]: Province };
  armies: Army[];
  selectedProvinceId: string | null;
  selectedArmyId: string | null;
  selectedArmyIds: string[];
  history: string[];
  aiConfig?: {
    enabled: boolean;
    aiFaction: MapFaction;
    difficulty: 'easy' | 'normal' | 'hard';
    confirmed?: boolean;
  };
}

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
