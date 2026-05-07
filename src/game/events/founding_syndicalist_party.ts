import { GameEvent } from '../types';
import { adjustFactionInfluence } from '../utils';

export const foundingSyndicalistParty: GameEvent = {
  id: 'Founding of the Syndicalist Party',
  date: { year: 1934, month: 7 },
  condition: (state) => state.treintistasLeft,
  title: 'Founding of the Syndicalist Party',
  titleZh: '工团主义党成立',
  description: `If economic problems are not solved at the same time through better organization of wealth production and distribution, as well as the seizure of economic and political power by the productive classes, no political problem can be adequately solved. After Ángel Pestaña left the CNT, he founded the Syndicalist Party. His proposal was to contribute to the workers' movement by providing it with a political party that does not interfere in union work, can cooperate with unions but has complete autonomy.`,
  descriptionZh: `如果经济问题不同时通过更好的财富生产和分配组织以及生产阶级夺取经济和政治权力来解决，任何政治问题都无法得到充分的解决方案。安赫尔·佩斯塔尼亚离开CNT之后成立工团主义党，他的主张是通过为工人运动提供一个政党，该政党不干涉工会工作，能够与工会合作但拥有完全自主权，从而为工人运动做出贡献。`,
  options: [
    {
      text: 'Perhaps we should take this opportunity to improve relations with the government...',
      textZh: '或许我们应当借此机会改善与政府的关系......',
      effect: (state) => {
        const newClasses = JSON.parse(JSON.stringify(state.classes));
        Object.keys(newClasses).forEach(cls => {
            const c = cls as keyof typeof newClasses;
            if (newClasses[c].support.CNT_FAI > 3) {
                newClasses[c].support.CNT_FAI -= 3;
                newClasses[c].support.PS += 3;
            }
        });
        
        return {
          classes: newClasses,
          ps_founded: true,
          relations: {
            ...state.relations,
            syndicalistParty: (state.relations.syndicalistParty || 0) + 10
          }
        };
      },
    },
    {
      text: 'Opposing politics is an anarchist principle...',
      textZh: '反对政治是无政府主义的原则......',
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions = adjustFactionInfluence(newFactions, 'Faistas', 5);
        return { 
          factions: newFactions,
          ps_founded: true
        };
      },
    },
  ],
};
