import { GameEvent } from '../types';
import { MapFaction } from '../../map/types_map';
import { INITIAL_PROVINCES, INITIAL_ARMIES, isPortugalProvince } from '../../map/map_constants';

export const asturiasWarFailed: GameEvent = {
  id: 'asturias_war_failed',
  title: '阿斯图里亚斯战争失败',
  titleZh: '阿斯图里亚斯战争失败',
  description: '阿斯图里亚斯的矿工武装起义不幸失败，政府军与反动武装残酷地镇压了起义。成千上万的同志被捕、被流放或被无情地处决。这对全国的革命热情和工人阶级运动造成了沉重的打击。',
  descriptionZh: '阿斯图里亚斯的矿工武装起义不幸失败，政府军与反动武装残酷地镇压了起义。成千上万的同志被捕、被流放或被无情地处决。这对全国的革命热情和工人阶级运动造成了沉重的打击。',
  options: [
    {
      text: '悲痛哀悼，保存革命火种',
      textZh: '悲痛哀悼，保存革命火种',
      effect: (state) => ({
        stats: {
          ...state.stats,
          revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 20)
        }
      })
    },
    {
      text: '公开谴责暴行，誓言复仇',
      textZh: '公开谴责暴行，誓言复仇',
      effect: (state) => ({
        stats: {
          ...state.stats,
          revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 12),
          tension: Math.min(100, state.stats.tension + 8)
        }
      })
    }
  ]
};

export const asturiasRevolution: GameEvent = {
  id: 'asturias_revolution',
  title: '阿斯图里亚斯革命爆发',
  titleZh: '阿斯图里亚斯革命爆发',
  description: '随着右翼CEDA党加入勒鲁政府，激进的右翼化政策彻底激怒了全国的工人阶级。在“联合无产阶级兄弟”（UHP）的伟大口号下，阿斯图里亚斯的矿工们率先发起了武装起义！他们夺取了军火库，控制了矿区，建立起革命委员会，并向反动政权宣战！这场伟大的无产阶级风暴，我们应当如何应对？',
  descriptionZh: '随着右翼CEDA党加入勒鲁政府，激进的右翼化政策彻底激怒了全国的工人阶级。在“联合无产阶级兄弟”（UHP）的伟大口号下，阿斯图里亚斯的矿工们率先发起了武装起义！他们夺取了军火库，控制了矿区，建立起革命委员会，并向反动政权宣战！这场伟大的无产阶级风暴，我们应当如何应对？',
  condition: (state) => {
    const isAsturiasWarStarted = state.wars?.asturias_war && state.wars.asturias_war !== 'not_started';
    if (state.civilWarStatus === 'ongoing' || state.activeWar || isAsturiasWarStarted) return false;
    
    if (state.difficulty === 'historical') {
      return state.year > 1934 || (state.year === 1934 && state.month >= 10);
    } else {
      const isUhpCompleted = state.journal?.['journal_uhp']?.status === 'completed';
      const isAugust1934OrLater = state.year > 1934 || (state.year === 1934 && state.month >= 8);
      const isCedaRadicalInPower = state.activeCoalition?.activeId === 'ceda_radical';
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
      text: 'CNT将全力加入革命！',
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
            [MapFaction.NEUTRAL]: { manpower: 0, industrialCapacity: 0, commandPoints: 0, supplies: 0, tankReserve: 0 }
          }
        };
      }
    },
    {
      text: '仅阿斯图里亚斯的同志们参与',
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
