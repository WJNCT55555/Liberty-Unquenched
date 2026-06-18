/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum MapFaction {
  REPUBLICAN = 'REPUBLICAN',
  NATIONALIST = 'NATIONALIST',
  PORTUGAL = 'PORTUGAL',
  NEUTRAL = 'NEUTRAL',
}

export interface Province {
  id: string;
  name: string;
  owner: MapFaction;
  isCoastal: boolean;
  manpower: number;
  industry: number;
  strategicValue: number; // 0-10
  terrain: 'urban' | 'plains' | 'mountains' | 'forest';
  fortification: number; // 0-3
}

export interface ArmyComposition {
  infantry: number;   // Number of infantry soldiers
  artillery: number;  // Number of artillery crew/forces
  tanks: number;      // Number of tank forces
}

export interface Army {
  id: string;
  faction: MapFaction;
  provinceId: string;
  movesLeft: number; // Max 2 per turn
  manpower: number;  // Total troop count (infantry + artillery + tanks)
  maxManpower: number; // Designed max/total troop count
  composition: ArmyComposition; // Current composition
  designedComposition: ArmyComposition; // Designed composition
  morale: number;    // Fighting spirit (0-100)
  militarization: number; // Experience/Efficiency (0-100)
}
