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
  const provinces = { ...INITIAL_PROVINCES };
  let armies = [...INITIAL_ARMIES];

  if (scenario === '1936' || civilWarStatus === 'ongoing') {
    // 1. Flip the 1936 provinces to Nationalist
    FLIPPED_PROVINCES.forEach(id => {
      if (provinces[id]) {
        provinces[id] = {
          ...provinces[id],
          owner: MapFaction.NATIONALIST
        };
      }
    });

    // 2. Flip Morocco army to Nationalist
    armies = armies.map(army => {
      if (army.id === 'rep_africa') {
        return {
          ...army,
          faction: MapFaction.NATIONALIST
        };
      }
      return army;
    });
  }

  return { provinces, armies };
}

