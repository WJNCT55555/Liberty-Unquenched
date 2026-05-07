import { GameEvent } from '../types';
import { adjustFactionInfluence } from '../utils';

export const proclamationSecondRepublic: GameEvent = {
  id: 'proclamation of the second republic',
  date: { year: 1931, month: 4 },
  title: 'Proclamation of the Second Republic',
  titleZh: '第二共和国宣告成立',
  description: 'In the long-awaited local elections on 12 April, the Republican parties won a landslide victory. Mass spontaneous celebrations broke out across the country, signifying that the era of the monarchy was drawing to a close. Protesters virtually besieged the Royal Palace in Madrid. On the advice of his closest aides, Alfonso XIII of the Bourbon dynasty decided to go into exile, and the Republic was proclaimed amid widespread jubilation. How should the CNT-FAI respond?',
  descriptionZh: '在 4 月 12 日这场万众期待的地方选举中，共和派政党大获全胜。全国范围内爆发了大规模的自发庆祝活动，这标志着君主制时代已然走向终结。抗议者几乎包围了马德里王宫。在亲信幕僚的建议下，波旁王朝的阿方索十三世决定流亡国外共和国在普遍的欢腾中宣告成立。CNT-FAI应该如何回应？',
  options: [
    {
      text: 'Cautious Optimism (Favor Moderates)',
      textZh: '谨慎乐观（偏向温和派）',
      effect: (state) => {
        const newClasses = JSON.parse(JSON.stringify(state.classes));
        newClasses.PequenaBurguesia.support.IR += 10;
        newClasses.PequenaBurguesia.support.CNT_FAI -= 10;
        return {
          factions: adjustFactionInfluence(state.factions, 'Treintistas', 10),
          classes: newClasses,
        };
      },
    },
    {
      text: 'Push for Social Revolution (Favor Anarchists)',
      textZh: '推动社会革命（偏向无政府主义者）',
      effect: (state) => ({
        factions: adjustFactionInfluence(state.factions, 'Faistas', 15),
        stats: { ...state.stats, revolutionaryFervor: state.stats.revolutionaryFervor + 10 },
      }),
    },
  ],
};
