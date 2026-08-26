import type { GameEvent } from '../types';
import { MapFaction } from '../../map/types_map';

const andalusiaMeta = {
  category: 'war' as const,
  flow: 'solo' as const,
  series: ['asturias'],
  tags: ['map'],
};

export const andalusiaFireEvent: GameEvent = {
  id: 'andalusia_fire',
  meta: andalusiaMeta,
  condition: (state) => {
    return !!(
      state.activeWar === 'asturias_war' &&
      (state.asturiasWarTurns || 0) >= 3 &&
      !state.isAndalusiaFireTriggered
    );
  },
  title: 'Fire in Andalusia',
  titleZh: '安达卢西亚之火',
  description: 'As the Asturian uprising holds on, the sparks of revolution are blazing across the southern land of Andalusia! Revolutionary workers and radical youth in the provinces of Cádiz and Málaga have launched strikes and armed uprisings, establishing workers\' self-defense councils in active solidarity with the Asturian revolution in the north!',
  descriptionZh: '随着阿斯图里亚斯起义的坚持，革命的星火已在南方安达卢西亚大地上熊熊燃烧！加第斯和马拉加两个省份的革命工人与激进青年发起了罢工与武装起义，建立了工人自治联盟，积极响应北方的阿斯图里亚斯革命！',
  options: [
    {
      text: 'Welcome our southern revolutionary comrades and open a second front!',
      textZh: '迎接南方的革命同志，开辟第二战场！',
      effect: (state) => {
        const nextProvinces = { ...(state.provinces || {}) };
        const nextArmies = [...(state.armies || [])];

        if (nextProvinces['cadiz']) {
          nextProvinces['cadiz'] = {
            ...nextProvinces['cadiz'],
            owner: MapFaction.WORKERS_ALLIANCE
          };
        }
        if (nextProvinces['malaga']) {
          nextProvinces['malaga'] = {
            ...nextProvinces['malaga'],
            owner: MapFaction.WORKERS_ALLIANCE
          };
        }

        // Add 2000 infantry in Cadiz
        nextArmies.push({
          id: 'andalusia_workers_cadiz',
          faction: MapFaction.WORKERS_ALLIANCE,
          provinceId: 'cadiz',
          movesLeft: 2,
          manpower: 2000,
          maxManpower: 2000,
          composition: { infantry: 2000, artillery: 0, tanks: 0 },
          designedComposition: { infantry: 2000, artillery: 0, tanks: 0 },
          morale: 90,
          militarization: 40
        });

        // Add 2000 infantry in Malaga
        nextArmies.push({
          id: 'andalusia_workers_malaga',
          faction: MapFaction.WORKERS_ALLIANCE,
          provinceId: 'malaga',
          movesLeft: 2,
          manpower: 2000,
          maxManpower: 2000,
          composition: { infantry: 2000, artillery: 0, tanks: 0 },
          designedComposition: { infantry: 2000, artillery: 0, tanks: 0 },
          morale: 90,
          militarization: 40
        });

        return {
          provinces: nextProvinces,
          armies: nextArmies,
          isAndalusiaFireTriggered: true,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, (state.stats?.revolutionaryFervor ?? 0) + 10)
          }
        };
      }
    }
  ]
};
