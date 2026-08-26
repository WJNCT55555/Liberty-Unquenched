import type { GameEvent } from '../types';
import { adjustClassSupport, adjustFactionDissents } from '../utils';

const prrevsMeta = {
  category: 'cnt' as const,
  flow: 'solo' as const,
  series: ['prrevs'],
  // Repeatable so the deferred decision can be raised again; the condition
  // enforces the three-month gap and the permanent-abandonment flag.
  tags: ['journal', 'repeatable'],
};

export const formationOfPRRevS: GameEvent = {
  id: 'formation_of_prrevs',
  meta: prrevsMeta,
  condition: (state) => {
    const pestanaActive = state.activeAdvisors.some(a => a?.id === 'Ángel Pestaña');
    // After a deferral, the PRRevS question can be raised again three months later.
    const deferred = state.prrevsDeferralDate;
    const deferralElapsed = !deferred ||
      (state.year * 12 + state.month) - (deferred.year * 12 + deferred.month) >= 3;
    return pestanaActive &&
      state.stats.bureaucratization >= 50 &&
      state.cntStance === 'govern' &&
      state.factions.Treintistas.influence > 60 &&
      state.prrevsConstructionLevel >= 4 &&
      !state.isPRRevSFormed &&
      !state.prrevsAbandoned &&
      deferralElapsed;
  },
  title: 'Formation of the PRRevS',
  titleZh: '建立革命共和工团党',
  description: 'Ángel Pestaña and the moderate wing of the CNT have been laying the groundwork for a political party. They argue that traditional anarcho-syndicalism is insufficient to protect workers\' interests within the Republic. They propose the creation of the Partido Republicano Revolucionario Sindicalista (PRRevS) to contest elections and participate in the government. This move would fundamentally change the nature of our movement, alienating the purists but potentially gaining us political power.',
  descriptionZh: '安赫尔·佩斯塔尼亚和CNT的温和派一直在为一个政党奠定基础。他们认为，传统的无政府工团主义不足以在共和国内保护工人的利益。他们提议建立革命共和工团党（PRRevS），以参加选举并参与政府。这一举动将从根本上改变我们运动的性质，疏远纯粹主义者，但有可能为我们赢得政治权力。',
  image: 'img/Advisors/Angel_Pestana.png',
  options: [
    {
      text: 'Cross the Rubicon, form the PRRevS!',
      textZh: '跨越卢比孔河，成立 PRRevS！',
      subtitle: 'We must adapt to survive. The PRRevS will be our political arm.',
      subtitleZh: '我们必须适应才能生存。PRRevS 将成为我们的政治臂膀。',
      effect: (state) => {
        let newClasses = state.classes;
        newClasses = adjustClassSupport(newClasses, 'Obreros', 'CNT_FAI', -15);
        newClasses = adjustClassSupport(newClasses, 'Braceros', 'CNT_FAI', -10);
        newClasses = adjustClassSupport(newClasses, 'Labradores', 'CNT_FAI', 8);
        newClasses = adjustClassSupport(newClasses, 'PequenaBurguesia', 'CNT_FAI', 3);

        return {
          classes: newClasses,
          factions: adjustFactionDissents(state.factions, { Faistas: 30, Puristas: 40 }),
          stats: {
            ...state.stats,
            bureaucratization: Math.min(100, state.stats.bureaucratization + 5),
            revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 15)
          },
          isPRRevSFormed: true,
          prrevsDeferralDate: undefined,
          prrevsAbandoned: undefined
        };
      }
    },
    {
      text: 'The time is not right.',
      textZh: '时机尚未成熟。',
      subtitle: 'Set the party project aside; the PRRevS question can be raised again in three months.',
      subtitleZh: '暂时搁置建党计划，三个月后可再次讨论成立 PRRevS。',
      effect: (state) => {
        return {
          factions: adjustFactionDissents(state.factions, { Treintistas: 10 }),
          prrevsDeferralDate: { year: state.year, month: state.month },
          prrevsAbandoned: undefined
        };
      }
    },
    {
      text: 'Abandon the party project for good.',
      textZh: '永久放弃建党计划。',
      subtitle: 'Reject the PRRevS permanently; the question will never be raised again.',
      subtitleZh: '永远拒绝成立 PRRevS；此事将不再被提起。',
      effect: (state) => {
        return {
          factions: adjustFactionDissents(state.factions, { Faistas: -5, Puristas: -5 }),
          prrevsDeferralDate: undefined,
          prrevsAbandoned: true
        };
      }
    }
  ]
};
