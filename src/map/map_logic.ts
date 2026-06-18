/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapFaction, Province, Army } from './types_map';
import { INITIAL_PROVINCES, INITIAL_ARMIES } from './map_constants';

export const FLIPPED_PROVINCES = [
  'sevilla', 'coruna', 'lugo', 'orense', 'pontevedra', 'leon', 'zamora', 
  'salamanca', 'avila', 'segovia', 'valladolid', 'palencia', 'soria', 
  'zaragoza', 'huesca', 'teruel', 'caceres', 'cadiz', 'huelva', 'cordoba', 
  'granada', 'navarra', 'burgos', 'alava', 'rioja',
  'balears', 'oviedo', 'ceuta', 'melilla', 'laspalmas', 'santacruzdetenerife',
  'tetouan', 'larache', 'nador', 'chefchaouen', 'alhoceima'
];

export function initializeMapState(scenario: string, civilWarStatus: string) {
  let provinces = { ...INITIAL_PROVINCES };
  let armies = [...INITIAL_ARMIES];

  if (scenario === '1936' || civilWarStatus === 'ongoing') {
    const result = triggerCivilWarOnMap(provinces, armies);
    provinces = result.provinces;
    armies = result.armies;
  }

  return { provinces, armies };
}

export function triggerCivilWarOnMap(provinces: Record<string, Province>, armies: Army[]) {
  const nextProvinces = { ...provinces };
  
  // 1. Flip the 1936 provinces to Nationalist
  FLIPPED_PROVINCES.forEach(id => {
    if (nextProvinces[id]) {
      nextProvinces[id] = {
        ...nextProvinces[id],
        owner: MapFaction.NATIONALIST
      };
    }
  });

  // 2. Flip Morocco army to Nationalist
  let nextArmies = armies.map(army => {
    if (army.id === 'rep_africa') {
      return {
        ...army,
        faction: MapFaction.NATIONALIST
      };
    }
    // If a republican army is in nationalist territory, flip or move it
    const armyProv = nextProvinces[army.provinceId];
    if (army.faction === MapFaction.REPUBLICAN && armyProv && armyProv.owner === MapFaction.NATIONALIST) {
      // In Seville, Zaragoza or Galicia, a Republican division mutinies and joins Nationalist
      if (['sevilla', 'zaragoza', 'coruna'].includes(army.provinceId)) {
        return {
          ...army,
          faction: MapFaction.NATIONALIST,
          morale: 80
        };
      } else {
        // Displace the army to a loyal Republican province like Madrid, Valencia, or Barcelona
        const loyalProvinces = ['madrid', 'valencia', 'barcelona'];
        const randomLoyal = loyalProvinces[Math.floor(Math.random() * loyalProvinces.length)];
        return {
          ...army,
          provinceId: randomLoyal,
          morale: 60 // lowered due to retreat
        };
      }
    }
    return army;
  });

  // 3. Spawn reinforcing armies
  // Republican reinforces for defense
  const hasRepMadrid = nextArmies.some(a => a.id === 'rep_madrid_militia');
  if (!hasRepMadrid) {
    nextArmies.push({
      id: 'rep_madrid_militia',
      faction: MapFaction.REPUBLICAN,
      provinceId: 'madrid',
      movesLeft: 2,
      manpower: 4000,
      maxManpower: 4000,
      composition: { infantry: 3500, artillery: 500, tanks: 0 },
      designedComposition: { infantry: 3500, artillery: 500, tanks: 0 },
      morale: 90,
      militarization: 20
    });
  }

  const hasRepCatalonia = nextArmies.some(a => a.id === 'rep_catalonia_militia');
  if (!hasRepCatalonia) {
    nextArmies.push({
      id: 'rep_catalonia_militia',
      faction: MapFaction.REPUBLICAN,
      provinceId: 'barcelona',
      movesLeft: 2,
      manpower: 4500,
      maxManpower: 4500,
      composition: { infantry: 4000, artillery: 500, tanks: 0 },
      designedComposition: { infantry: 4000, artillery: 500, tanks: 0 },
      morale: 95,
      militarization: 15
    });
  }

  // Nationalist reinforces
  const hasNatNorth = nextArmies.some(a => a.id === 'nat_north_army');
  if (!hasNatNorth) {
    nextArmies.push({
      id: 'nat_north_army',
      faction: MapFaction.NATIONALIST,
      provinceId: 'burgos',
      movesLeft: 2,
      manpower: 5000,
      maxManpower: 5000,
      composition: { infantry: 4000, artillery: 1000, tanks: 0 },
      designedComposition: { infantry: 4000, artillery: 1000, tanks: 0 },
      morale: 85,
      militarization: 40
    });
  }

  const hasNatSouth = nextArmies.some(a => a.id === 'nat_south_army');
  if (!hasNatSouth) {
    nextArmies.push({
      id: 'nat_south_army',
      faction: MapFaction.NATIONALIST,
      provinceId: 'sevilla',
      movesLeft: 2,
      manpower: 3500,
      maxManpower: 3500,
      composition: { infantry: 3000, artillery: 500, tanks: 0 },
      designedComposition: { infantry: 3000, artillery: 500, tanks: 0 },
      morale: 80,
      militarization: 35
    });
  }

  return { provinces: nextProvinces, armies: nextArmies };
}
