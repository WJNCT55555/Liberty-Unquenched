import type { GameEvent } from '../types';
import { adjustClassSupport, adjustFactionInfluence, isAtOrAfter } from '../utils';

const newsMeta = {
  category: 'news' as const,
  flow: 'solo' as const,
};

export const burningConvents: GameEvent = {
  id: 'burning_of_the_convents',
  meta: newsMeta,
  date: { year: 1931, month: 5 },
  condition: (state) => state.scenario === '1931' && isAtOrAfter(state, 1931, 5),
  title: 'The May Riots: Burning of the Convents',
  titleZh: '五月骚乱：焚烧修道院',
  description: `The air in Madrid is thick with the scent of incense and charred timber. What began as a skirmish between monarchists and republicans has spiraled into a wave of anti-clerical iconoclasm. From the capital to Malaga, convents are being looted and set ablaze. The government faces a harrowing dilemma: to intervene forcefully is to protect the symbols of the "Old Order," but to stand by is to invite anarchy and alienate the pious middle class.`,
  descriptionZh: `马德里的空气中弥漫着沉香与木材烧焦的味道。起初只是君主派与共和派之间的街头冲突，如今已演变成一场席卷全国的反教权圣像破坏运动。从首都到马拉加，一座座修道院在火光中摇曳坍塌。政府陷入了痛苦的进退两难：强力干预意味着保护“旧秩序”的象征，而袖手旁观则会诱发无政府主义乱局，并彻底疏远虔诚的中产阶级。`,
  options: [
    {
      text: 'Condemn the Violence and Restore Order',
      textZh: '谴责暴力并恢复秩序',
      subtitle: 'Improves IR support among the clergy and small bourgeoisie; increases Cenetistas influence.',
      subtitleZh: '提高天主教会和小资产阶级对共和左翼（IR）的支持，并增加工团派的影响力。',
      effect: (state) => {
        let newClasses = state.classes;
        newClasses = adjustClassSupport(newClasses, 'Clero', 'IR', 5);
        newClasses = adjustClassSupport(newClasses, 'PequenaBurguesia', 'IR', 5);
        return {
          classes: newClasses,
          factions: adjustFactionInfluence(state.factions, 'Cenetistas', 10),
        };
      },
    },
    {
      text: '"All the convents in Spain are not worth the life of a single Republican"',
      textZh: '“全西班牙的修道院也抵不上一个共和主义者的性命”',
      subtitle: 'Increases revolutionary fervor and Faistas influence.',
      subtitleZh: '增加革命热情和无政府主义者（Faistas）的影响力。',
      effect: (state) => ({
        stats: { ...state.stats, revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 15) },
        factions: adjustFactionInfluence(state.factions, 'Faistas', 10),
      }),
    },
  ],
};
