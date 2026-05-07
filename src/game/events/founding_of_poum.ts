import { GameEvent } from '../types';
import { adjustFactionInfluence } from '../utils';

export const foundingOfPOUM: GameEvent = {
  id: 'Founding of POUM',
  date: { year: 1935, month: 9 },
  title: 'The Founding of the Workers\' Party of Marxist Unification (POUM)',
  titleZh: '马克思主义统一工人党（POUM）的成立',
  description: `In a small house in the Hortà district of Barcelona, Joaquín Maurín’s Iberian Communist Federation and Andrés Nin’s Communist Left of Spain have secretly merged to form the Workers' Party of Marxist Unification (POUM). Rejecting both Stalinist bureaucracy and bourgeois democracy, POUM calls for a genuine socialist revolution based on workers' councils and agrarian collectivization. Though small, its cadre of experienced revolutionaries poses a potent ideological challenge to the official Communist Party (PCE) within the leftist camp.`,
  descriptionZh: `在巴塞罗那奥尔塔区的一间小屋内，华金·毛林的伊比利亚共产主义联盟与安德列乌·宁的西班牙共产主义左派秘密合并，正式成立了马克思主义统一工人党（POUM）。该党同时反对斯大林主义的官僚体制和资产阶级民主，主张建立在工人委员会与土地集体化基础上的真正社会主义革命。尽管规模不大，但其经验丰富的革命干部队伍对左翼阵营内的正统共产党（PCE）构成了强大的意识形态挑战。`,
  options: [
    {
      text: 'We will welcome our revolutionary comrades.',
      textZh: '我们将欢迎革命同志',
      subtitle: 'POUM founded, CNT-FAI/POUM relations +15, CNT-FAI/PCE relations -10, Puristas influence +5, Faistas dissent +3, Revolutionary Fervor +3',
      subtitleZh: 'poum将成立，cnt-fai与poum的关系+15，cnt-fai与PCE的关系-10，Puristas影响力+5，Faistas分歧度+3，革命热情+3',
      effect: (state) => {
        const newPartyRelations = { ...state.partyRelations };
        newPartyRelations.POUM = Math.min(100, newPartyRelations.POUM + 15);
        newPartyRelations.PCE = Math.max(0, newPartyRelations.PCE - 10);
        
        const newFactions = adjustFactionInfluence(state.factions, 'Puristas', 5);
        newFactions.Faistas.dissent = Math.min(100, newFactions.Faistas.dissent + 3);
        
        return {
          poum_founded: true,
          partyRelations: newPartyRelations,
          factions: newFactions,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 3)
          }
        };
      }
    },
    {
      text: 'Wait and see.',
      textZh: '静观其变',
      subtitle: 'POUM founded',
      subtitleZh: 'poum将会成立',
      effect: (state) => ({
        poum_founded: true
      })
    },
    {
      text: 'We do not welcome Marxists.',
      textZh: '我们不欢迎马克思主义者',
      subtitle: 'POUM founded, CNT-FAI/POUM relations -10, CNT-FAI/PCE relations -5, Puristas influence -3, Workers support -3',
      subtitleZh: 'poum将成立，cnt-fai与poum的关系-10，cnt-fai与PCE的关系-5，Puristas影响力-3，工人阶级支持率-3',
      effect: (state) => {
        const newPartyRelations = { ...state.partyRelations };
        newPartyRelations.POUM = Math.max(0, newPartyRelations.POUM - 10);
        newPartyRelations.PCE = Math.max(0, newPartyRelations.PCE - 5);
        
        const newFactions = adjustFactionInfluence(state.factions, 'Puristas', -3);
        
        const newClasses = JSON.parse(JSON.stringify(state.classes));
        newClasses.Obreros.support.CNT_FAI = Math.max(0, newClasses.Obreros.support.CNT_FAI - 3);
        
        return {
          poum_founded: true,
          partyRelations: newPartyRelations,
          factions: newFactions,
          classes: newClasses
        };
      }
    },
    {
      text: 'Let us keep our distance from politics.',
      textZh: '让我们与政治保持距离',
      subtitle: 'POUM founded, Faistas dissent -5, Workers support -5, Revolutionary Fervor -3',
      subtitleZh: 'poum将成立，Faistas分歧度-5，工人阶级支持率-5，革命热情-3',
      effect: (state) => {
        const newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions.Faistas.dissent = Math.max(0, newFactions.Faistas.dissent - 5);
        
        const newClasses = JSON.parse(JSON.stringify(state.classes));
        newClasses.Obreros.support.CNT_FAI = Math.max(0, newClasses.Obreros.support.CNT_FAI - 5);
        
        return {
          poum_founded: true,
          factions: newFactions,
          classes: newClasses,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 3)
          }
        };
      }
    },
    {
      text: 'Whatever happens, this will strengthen the Popular Front.',
      textZh: '无论怎么样，这将会壮大人民阵线',
      subtitle: 'POUM founded, Cenetistas dissent -3, Workers support -2',
      subtitleZh: 'poum将成立，Cenetistas分歧度-3，工人阶级支持率-2',
      effect: (state) => {
        const newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions.Cenetistas.dissent = Math.max(0, newFactions.Cenetistas.dissent - 3);
        
        const newClasses = JSON.parse(JSON.stringify(state.classes));
        newClasses.Obreros.support.CNT_FAI = Math.max(0, newClasses.Obreros.support.CNT_FAI - 2);
        
        return {
          poum_founded: true,
          factions: newFactions,
          classes: newClasses
        };
      }
    },
    {
      text: 'Is it too early to talk about revolution now...',
      textZh: '现在谈论革命是不是为时尚早......',
      subtitle: 'POUM founded, Treintistas influence +3, Workers support -5, Revolutionary Fervor -5',
      subtitleZh: 'poum将成立，Treintistas影响力+3，工人阶级支持率-5，革命热情-5',
      effect: (state) => {
        const newFactions = adjustFactionInfluence(state.factions, 'Treintistas', 3);
        
        const newClasses = JSON.parse(JSON.stringify(state.classes));
        newClasses.Obreros.support.CNT_FAI = Math.max(0, newClasses.Obreros.support.CNT_FAI - 5);
        
        return {
          poum_founded: true,
          factions: newFactions,
          classes: newClasses,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 5)
          }
        };
      }
    }
  ]
};
