import type { GameEvent } from '../types';
import { adjustClassSupport, adjustFactionDissent, adjustFactionInfluence, isAtOrAfter } from '../utils';

const newsMeta = {
  category: 'news' as const,
  flow: 'solo' as const,
};

export const foundingOfPOUM: GameEvent = {
  id: 'founding_of_poum',
  meta: newsMeta,
  date: { year: 1935, month: 9 },
  condition: (state) => state.scenario !== '1936' && isAtOrAfter(state, 1935, 9) && !state.poum_founded,
  title: 'The Founding of the Workers\' Party of Marxist Unification (POUM)',
  titleZh: '马克思主义统一工人党（POUM）的成立',
  description: `In a small house in the Hortà district of Barcelona, Joaquín Maurín’s Iberian Communist Federation and Andrés Nin’s Communist Left of Spain have secretly merged to form the Workers' Party of Marxist Unification (POUM). Rejecting both Stalinist bureaucracy and bourgeois democracy, POUM calls for a genuine socialist revolution based on workers' councils and agrarian collectivization. Though small, its cadre of experienced revolutionaries poses a potent ideological challenge to the official Communist Party (PCE) within the leftist camp.`,
  descriptionZh: `在巴塞罗那奥尔塔区的一间小屋内，华金·毛林的伊比利亚共产主义联盟与安德列乌·宁的西班牙共产主义左派秘密合并，正式成立了马克思主义统一工人党（POUM）。该党同时反对斯大林主义的官僚体制和资产阶级民主，主张建立在工人委员会与土地集体化基础上的真正社会主义革命。尽管规模不大，但其经验丰富的革命干部队伍对左翼阵营内的正统共产党（PCE）构成了强大的意识形态挑战。`,
  options: [
    {
      text: 'We will welcome our revolutionary comrades.',
      textZh: '我们将欢迎革命同志',
      subtitle: 'Founds POUM; improves POUM relations by 15, worsens PCE relations by 10, increases Puristas influence by 5, raises Faistas dissent by 3, and raises revolutionary fervor by 3.',
      subtitleZh: '成立 POUM；提高与 POUM 的关系 15 点，降低与 PCE 的关系 10 点，提高纯粹派影响力 5 点，提高无政府主义者分歧度 3 点，并增加革命热情 3 点。',
      effect: (state) => {
        const newPartyRelations = { ...state.partyRelations };
        newPartyRelations.POUM = Math.min(100, newPartyRelations.POUM + 15);
        newPartyRelations.PCE = Math.max(0, newPartyRelations.PCE - 10);
        
        const newFactions = adjustFactionDissent(
          adjustFactionInfluence(state.factions, 'Puristas', 5),
          'Faistas',
          3,
        );
        
        return {
          poum_founded: true,
          partyRelations: newPartyRelations,
          factions: newFactions,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 3),
          },
        };
      },
    },
    {
      text: 'Wait and see.',
      textZh: '静观其变',
      subtitle: 'Founds POUM.',
      subtitleZh: '成立 POUM。',
      effect: (state) => ({
        poum_founded: true,
      }),
    },
    {
      text: 'We do not welcome Marxists.',
      textZh: '我们不欢迎马克思主义者',
      subtitle: 'Founds POUM; worsens POUM relations by 10, worsens PCE relations by 5, lowers Puristas influence by 3, and lowers worker support by 3.',
      subtitleZh: '成立 POUM；降低与 POUM 的关系 10 点，降低与 PCE 的关系 5 点，降低纯粹派影响力 3 点，并降低产业工人对 CNT-FAI 的支持 3 点。',
      effect: (state) => {
        const newPartyRelations = { ...state.partyRelations };
        newPartyRelations.POUM = Math.max(0, newPartyRelations.POUM - 10);
        newPartyRelations.PCE = Math.max(0, newPartyRelations.PCE - 5);
        
        const newFactions = adjustFactionInfluence(state.factions, 'Puristas', -3);
        
        let newClasses = state.classes;
        newClasses = adjustClassSupport(newClasses, 'Obreros', 'CNT_FAI', -3);
        
        return {
          poum_founded: true,
          partyRelations: newPartyRelations,
          factions: newFactions,
          classes: newClasses,
        };
      },
    },
    {
      text: 'Let us keep our distance from politics.',
      textZh: '让我们与政治保持距离',
      subtitle: 'Founds POUM; lowers Faistas dissent by 5, worker support by 5, and revolutionary fervor by 3.',
      subtitleZh: '成立 POUM；降低无政府主义者分歧度 5 点、产业工人对 CNT-FAI 的支持 5 点，并降低革命热情 3 点。',
      effect: (state) => {
        const newFactions = adjustFactionDissent(state.factions, 'Faistas', -5);
        
        let newClasses = state.classes;
        newClasses = adjustClassSupport(newClasses, 'Obreros', 'CNT_FAI', -5);
        
        return {
          poum_founded: true,
          factions: newFactions,
          classes: newClasses,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 3),
          },
        };
      },
    },
    {
      text: 'Whatever happens, this will strengthen the Popular Front.',
      textZh: '无论怎么样，这将会壮大人民阵线',
      subtitle: 'Founds POUM; lowers Cenetistas dissent by 3 and worker support by 2.',
      subtitleZh: '成立 POUM；降低工团派分歧度 3 点，并降低产业工人对 CNT-FAI 的支持 2 点。',
      effect: (state) => {
        const newFactions = adjustFactionDissent(state.factions, 'Cenetistas', -3);
        
        let newClasses = state.classes;
        newClasses = adjustClassSupport(newClasses, 'Obreros', 'CNT_FAI', -2);
        
        return {
          poum_founded: true,
          factions: newFactions,
          classes: newClasses,
        };
      },
    },
    {
      text: 'Is it too early to talk about revolution now...',
      textZh: '现在谈论革命是不是为时尚早......',
      subtitle: 'Founds POUM; increases Treintistas influence by 3, lowers worker support by 5, and lowers revolutionary fervor by 5.',
      subtitleZh: '成立 POUM；提高三十人集团影响力 3 点，降低产业工人对 CNT-FAI 的支持 5 点，并降低革命热情 5 点。',
      effect: (state) => {
        const newFactions = adjustFactionInfluence(state.factions, 'Treintistas', 3);
        
        let newClasses = state.classes;
        newClasses = adjustClassSupport(newClasses, 'Obreros', 'CNT_FAI', -5);
        
        return {
          poum_founded: true,
          factions: newFactions,
          classes: newClasses,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 5),
          },
        };
      },
    },
  ],
};
