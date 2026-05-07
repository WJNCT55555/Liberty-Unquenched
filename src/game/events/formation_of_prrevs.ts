import { GameEvent } from '../types';

export const formationOfPRRevS: GameEvent = {
  id: 'formation_of_prrevs',
  title: 'Formation of the PRRevS',
  titleZh: '建立革命共和工团党',
  description: 'Ángel Pestaña and the moderate wing of the CNT have been laying the groundwork for a political party. They argue that traditional anarcho-syndicalism is insufficient to protect workers\' interests within the Republic. They propose the creation of the Partido Republicano Revolucionario Sindicalista (PRRevS) to contest elections and participate in the government. This move would fundamentally change the nature of our movement, alienating the purists but potentially gaining us political power.',
  descriptionZh: '安赫尔·佩斯塔尼亚和CNT的温和派一直在为一个政党奠定基础。他们认为，传统的无政府工团主义不足以在共和国内保护工人的利益。他们提议建立革命共和工团党（PRRevS），以参加选举并参与政府。这一举动将从根本上改变我们运动的性质，疏远纯粹主义者，但有可能为我们赢得政治权力。',
  image: 'img/Ángel_Pestaña.png',
  condition: (state) => {
    const pestanaActive = state.activeAdvisors.some(a => a?.id === 'Ángel Pestaña');
    return pestanaActive &&
           state.stats.bureaucratization >= 50 &&
           state.isCNTInGovernment &&
           state.factions.Treintistas.influence > 60 &&
           state.prrevsConstructionLevel >= 4 &&
           !state.isPRRevSFormed;
  },
  options: [
    {
      text: 'Cross the Rubicon, form the PRRevS!',
      textZh: '跨越卢比孔河，成立 PRRevS！',
      subtitle: 'We must adapt to survive. The PRRevS will be our political arm.',
      subtitleZh: '我们必须适应才能生存。PRRevS 将成为我们的政治臂膀。',
      effect: (state) => {
        const newClasses = JSON.parse(JSON.stringify(state.classes));
        newClasses.Obreros.support.CNT_FAI = Math.max(0, newClasses.Obreros.support.CNT_FAI - 15);
        newClasses.Braceros.support.CNT_FAI = Math.max(0, newClasses.Braceros.support.CNT_FAI - 10);
        newClasses.Labradores.support.CNT_FAI = Math.min(100, newClasses.Labradores.support.CNT_FAI + 8);
        newClasses.PequenaBurguesia.support.CNT_FAI = Math.min(100, newClasses.PequenaBurguesia.support.CNT_FAI + 3);

        return {
          classes: newClasses,
          factions: {
            ...state.factions,
            Faistas: { ...state.factions.Faistas, dissent: Math.min(100, state.factions.Faistas.dissent + 30) },
            Puristas: { ...state.factions.Puristas, dissent: Math.min(100, state.factions.Puristas.dissent + 40) }
          },
          stats: {
            ...state.stats,
            bureaucratization: Math.min(100, state.stats.bureaucratization + 5),
            revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 15)
          },
          isPRRevSFormed: true
        };
      }
    },
    {
      text: 'The time is not right.',
      textZh: '时机尚未成熟。',
      subtitle: 'We are not ready to abandon our anti-political stance.',
      subtitleZh: '我们还没有准备好放弃我们的反政治立场。',
      effect: (state) => {
        return {
          factions: {
            ...state.factions,
            Treintistas: { ...state.factions.Treintistas, dissent: Math.min(100, state.factions.Treintistas.dissent + 10) }
          }
        };
      }
    }
  ]
};
