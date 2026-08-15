import type { GameEvent } from '../types';
import { adjustClassSupport, adjustFactionInfluence, isAtOrAfter } from '../utils';

const newsMeta = {
  category: 'news' as const,
  flow: 'solo' as const,
};

export const proclamationSecondRepublic: GameEvent = {
  id: 'proclamation_of_the_second_republic',
  meta: newsMeta,
  date: { year: 1931, month: 4 },
  condition: (state) => state.scenario === '1931' && isAtOrAfter(state, 1931, 4),
  title: 'Proclamation of the Second Republic',
  titleZh: '第二共和国宣告成立',
  description: `In the long-awaited local elections on 12 April, the Republican parties won a landslide victory. Mass spontaneous celebrations broke out across the country, signifying that the era of the monarchy was drawing to a close. Protesters virtually besieged the Royal Palace in Madrid. On the advice of his closest aides, Alfonso XIII of the Bourbon dynasty decided to go into exile, and the Republic was proclaimed amid widespread jubilation. How should the CNT-FAI respond?`,
  descriptionZh: `在 4 月 12 日这场万众期待的地方选举中，共和派政党大获全胜。全国范围内爆发了大规模的自发庆祝活动，这标志着君主制时代已然走向终结。抗议者几乎包围了马德里王宫。在亲信幕僚的建议下，波旁王朝的阿方索十三世决定流亡国外，共和国在普遍的欢腾中宣告成立。CNT-FAI 应该如何回应？`,
  options: [
    {
      text: 'Cautious Optimism (Favor Moderates)',
      textZh: '谨慎乐观（偏向温和派）',
      subtitle: 'Increases Treintistas influence and Pequena Burguesía support for IR.',
      subtitleZh: '提高三十人集团的影响力，并增加小资产阶级对共和左翼（IR）的支持。',
      effect: (state) => {
        let newClasses = state.classes;
        newClasses = adjustClassSupport(newClasses, 'PequenaBurguesia', 'IR', 10);
        return {
          factions: adjustFactionInfluence(state.factions, 'Treintistas', 10),
          classes: newClasses,
        };
      },
    },
    {
      text: 'Push for Social Revolution (Favor Anarchists)',
      textZh: '推动社会革命（偏向无政府主义者）',
      subtitle: 'Increases Faistas influence and revolutionary fervor.',
      subtitleZh: '提高无政府主义者（Faistas）的影响力，并增加革命热情。',
      effect: (state) => ({
        factions: adjustFactionInfluence(state.factions, 'Faistas', 15),
        stats: { ...state.stats, revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 10) },
      }),
    },
  ],
};
