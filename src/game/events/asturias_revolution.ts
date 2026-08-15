import type { GameEvent } from '../types';
import { MapFaction } from '../../map/types_map';
import { INITIAL_PROVINCES, INITIAL_ARMIES, isPortugalProvince } from '../../map/map_constants';

const asturiasRootMeta = {
  category: 'war' as const,
  flow: 'inline.root' as const,
  series: ['asturias'],
  tags: ['map'],
};

const asturiasLeafMeta = {
  ...asturiasRootMeta,
  flow: 'inline.leaf' as const,
};

export const asturiasWarFailed: GameEvent = {
  id: 'asturias_war_failed',
  meta: asturiasLeafMeta,
  title: 'The Asturias War Is Lost',
  titleZh: '阿斯图里亚斯战争失败',
  description: 'The armed miners\' uprising in Asturias has tragically failed. Government forces and reactionary militias brutally crushed the revolt. Thousands of comrades have been arrested, exiled, or ruthlessly executed. This is a heavy blow to revolutionary fervor and the workers\' movement across the country.',
  descriptionZh: '阿斯图里亚斯的矿工武装起义不幸失败，政府军与反动武装残酷地镇压了起义。成千上万的同志被捕、被流放或被无情地处决。这对全国的革命热情和工人阶级运动造成了沉重的打击。',
  options: [
    {
      text: 'Mourn the dead and preserve the revolutionary flame',
      textZh: '悲痛哀悼，保存革命火种',
      effect: (state) => ({
        stats: {
          ...state.stats,
          revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 20)
        }
      })
    },
    {
      text: 'Publicly denounce the atrocities and swear vengeance',
      textZh: '公开谴责暴行，誓言复仇',
      effect: (state) => ({
        stats: {
          ...state.stats,
          revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 12)
        }
      })
    }
  ]
};

export const asturiasRevolution: GameEvent = {
  id: 'asturias_revolution',
  meta: asturiasRootMeta,
  title: 'The Asturian Revolution Erupts',
  titleZh: '阿斯图里亚斯革命爆发',
  description: 'As the right-wing CEDA joined the Lerroux government, its radical rightward policies have enraged the working class across the country. Under the great slogan of "United Proletarian Brothers" (UHP), the miners of Asturias have risen in armed revolt! They have seized the arsenals, taken control of the mining districts, established revolutionary committees, and declared war on the reactionary regime! How should we respond to this great proletarian storm?',
  descriptionZh: '随着右翼CEDA党加入勒鲁政府，激进的右翼化政策彻底激怒了全国的工人阶级。在“联合无产阶级兄弟”（UHP）的伟大口号下，阿斯图里亚斯的矿工们率先发起了武装起义！他们夺取了军火库，控制了矿区，建立起革命委员会，并向反动政权宣战！这场伟大的无产阶级风暴，我们应当如何应对？',
  condition: (state) => {
    const isAsturiasWarStarted = state.wars?.asturias_war && state.wars.asturias_war !== 'not_started';
    if (state.civilWarStatus === 'ongoing' || state.activeWar || isAsturiasWarStarted) return false;
    
    if (state.difficulty === 'historical') {
      return state.year > 1934 || (state.year === 1934 && state.month >= 10);
    } else {
      const isUhpCompleted = state.journal?.['journal_uhp']?.status === 'completed';
      const isAugust1934OrLater = state.year > 1934 || (state.year === 1934 && state.month >= 8);
      const isCedaRadicalInPower = state.rulingCoalition === 'ceda_radical';
      return !!(
        (state.stats?.tension ?? 0) > 60 &&
        (state.stats?.revolutionaryFervor ?? 0) > 50 &&
        isUhpCompleted &&
        isAugust1934OrLater &&
        isCedaRadicalInPower
      );
    }
  },
  options: [
    {
      text: 'The CNT will join the revolution with all its strength!',
      textZh: 'CNT将全力加入革命！',
      condition: (state) => {
        const alianzaCompleted = state.journal?.['journal_alianza_obrera']?.status === 'completed';
        const fervorHigh = (state.stats?.revolutionaryFervor ?? 0) > 80;
        const factionsSum = (state.factions?.Faistas?.influence ?? 0) + (state.factions?.Puristas?.influence ?? 0) > 80;
        return !!(alianzaCompleted && fervorHigh && factionsSum);
      },
      unavailableSubtitle: (state) => 'Requires Alianza Obrera journal completed, Revolutionary Fervor > 80, and combined Faistas + Puristas influence > 80.',
      unavailableSubtitleZh: (state) => '需要“工人联盟”日志已完成、革命热情 > 80，且无政府主义派与纯粹派势力之和 > 80。',
      effect: (state) => {
        const nextProvinces = state.provinces ? { ...state.provinces } : { ...INITIAL_PROVINCES };
        Object.keys(nextProvinces).forEach(id => {
          if (isPortugalProvince(id)) {
            nextProvinces[id] = { ...nextProvinces[id], owner: MapFaction.PORTUGAL };
          } else if (id === 'asturias' || id === 'oviedo') {
            nextProvinces[id] = { ...nextProvinces[id], owner: MapFaction.WORKERS_ALLIANCE };
          } else {
            nextProvinces[id] = { ...nextProvinces[id], owner: MapFaction.REPUBLICAN };
          }
        });

        // Keep standard INITIAL_ARMIES for the Republic (excluding Asturias/Oviedo) and append special ones
        const republicanArmies = INITIAL_ARMIES.filter(army => army.provinceId !== 'asturias' && army.provinceId !== 'oviedo').map(army => ({
          ...army,
          faction: MapFaction.REPUBLICAN
        }));

        const nextArmies = [
          {
            id: 'asturias_alliance_infantry',
            faction: MapFaction.WORKERS_ALLIANCE,
            provinceId: 'asturias',
            movesLeft: 2,
            manpower: 3000,
            maxManpower: 3000,
            composition: { infantry: 3000, artillery: 0, tanks: 0 },
            designedComposition: { infantry: 3000, artillery: 0, tanks: 0 },
            morale: 95,
            militarization: 50
          },
          {
            id: 'asturias_miners_1',
            faction: MapFaction.WORKERS_ALLIANCE,
            provinceId: 'asturias',
            movesLeft: 2,
            manpower: 6000,
            maxManpower: 6000,
            composition: { infantry: 5000, artillery: 1000, tanks: 0 },
            designedComposition: { infantry: 5000, artillery: 1000, tanks: 0 },
            morale: 95,
            militarization: 50
          },
          {
            id: 'asturias_miners_2',
            faction: MapFaction.WORKERS_ALLIANCE,
            provinceId: 'oviedo',
            movesLeft: 2,
            manpower: 3000,
            maxManpower: 3000,
            composition: { infantry: 2500, artillery: 500, tanks: 0 },
            designedComposition: { infantry: 2500, artillery: 500, tanks: 0 },
            morale: 90,
            militarization: 45
          },
          {
            id: 'gov_army_1',
            faction: MapFaction.REPUBLICAN,
            provinceId: 'leon',
            movesLeft: 2,
            manpower: 5000,
            maxManpower: 5000,
            composition: { infantry: 4000, artillery: 1000, tanks: 0 },
            designedComposition: { infantry: 4000, artillery: 1000, tanks: 0 },
            morale: 75,
            militarization: 60
          },
          {
            id: 'gov_army_2',
            faction: MapFaction.REPUBLICAN,
            provinceId: 'santander',
            movesLeft: 2,
            manpower: 3000,
            maxManpower: 3000,
            composition: { infantry: 2500, artillery: 500, tanks: 0 },
            designedComposition: { infantry: 2500, artillery: 500, tanks: 0 },
            morale: 70,
            militarization: 55
          },
          {
            id: 'gov_army_3',
            faction: MapFaction.REPUBLICAN,
            provinceId: 'lugo',
            movesLeft: 2,
            manpower: 3000,
            maxManpower: 3000,
            composition: { infantry: 2500, artillery: 500, tanks: 0 },
            designedComposition: { infantry: 2500, artillery: 500, tanks: 0 },
            morale: 70,
            militarization: 50
          },
          ...republicanArmies
        ];

        const nextWars = { ...(state.wars || {}) };
        nextWars.asturias_war = 'ongoing';
        return {
          activeWar: 'asturias_war',
          wars: nextWars,
          phase: 'war',
          currentView: 'map',
          provinces: nextProvinces,
          armies: nextArmies,
          asturiasWarTurns: 0,
          mapCurrentPlayer: MapFaction.WORKERS_ALLIANCE,
          mapResources: {
            [MapFaction.REPUBLICAN]: { manpower: 15000, industrialCapacity: 100, commandPoints: 2, supplies: 8000, tankReserve: 10 },
            [MapFaction.NATIONALIST]: { manpower: 0, industrialCapacity: 0, commandPoints: 0, supplies: 0, tankReserve: 0 },
            [MapFaction.PORTUGAL]: { manpower: 5000, industrialCapacity: 30, commandPoints: 2, supplies: 3000, tankReserve: 0 },
            [MapFaction.WORKERS_ALLIANCE]: { manpower: 12000, industrialCapacity: 60, commandPoints: 2, supplies: 6000, tankReserve: 0 },
            [MapFaction.NEUTRAL]: { manpower: 0, industrialCapacity: 0, commandPoints: 0, supplies: 0, tankReserve: 0 },
            [MapFaction.UNITED_KINGDOM]: { manpower: 0, industrialCapacity: 0, commandPoints: 0, supplies: 0, tankReserve: 0 },
            [MapFaction.ANDORRA]: { manpower: 0, industrialCapacity: 0, commandPoints: 0, supplies: 0, tankReserve: 0 }
          }
        };
      }
    },
    {
      text: 'Only the comrades of Asturias will take part',
      textZh: '仅阿斯图里亚斯的同志们参与',
      effect: (state) => {
        const nextWars = { ...(state.wars || {}) };
        nextWars.asturias_war = 'failed';
        return {
          wars: nextWars,
          activeWar: null,
          currentEvent: asturiasWarFailed
        };
      }
    }
  ]
};
