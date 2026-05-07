import { Card } from '../types';
import { adjustFactionInfluence } from '../utils';

export const strike: Card = {
  id: 'strike',
  title: 'Strike',
  titleZh: '罢工',
  type: 'Action',
  description: 'Call a general strike to increase worker control, but raise tension.',
  descriptionZh: '号召总罢工以增加工人控制度，但会加剧紧张局势。',
  cost: 1,
  resourceCost: 1,
  effect: (state) => ({
    currentEvent: {
      id: 'strike_event',
      date: { year: state.year, month: state.month },
      title: 'Strike',
      titleZh: '罢工',
      description: 'The factories are silent, and the streets belong to the workers. A general strike is our most powerful weapon against the bourgeoisie and the state. By downing tools, we demonstrate that without our labor, their world grinds to a halt. We must decide the scale of this mobilization: a warning shot to demand better conditions, or a revolutionary leap towards total worker control.',
      descriptionZh: '工厂陷入沉寂，街道属于劳动者。总罢工是我们对抗资产阶级和国家的有力武器。通过停工，我们向世人证明：没有我们的劳动，他们的世界将停止运转。我们必须决定这次动员的规模：是要求改善条件的警告，还是迈向全面工人控制的革命飞跃。',
      options: [
        {
          text: 'A limited demonstration (+5 Worker Control, +5 Revolutionary Fervor)',
          textZh: '有限的示威 (+5 工人控制, +5 革命热情)',
          subtitle: 'A controlled protest to show our strength without full escalation.',
          subtitleZh: '一场受控的示威，旨在展示力量而不至于全面升级冲突。',
          effect: (s) => {
            const overallDissent = 
              (s.factions.Treintistas.influence * s.factions.Treintistas.dissent +
               s.factions.Cenetistas.influence * s.factions.Cenetistas.dissent +
               s.factions.Faistas.influence * s.factions.Faistas.dissent +
               s.factions.Puristas.influence * s.factions.Puristas.dissent) / 100;
            const multiplier = 1 - (overallDissent / 100);
            return {
              stats: {
                ...s.stats,
                workerControl: Math.min(100, s.stats.workerControl + 5),
                revolutionaryFervor: Math.min(100, s.stats.revolutionaryFervor + 5 * multiplier),
              }
            };
          }
        },
        {
          text: 'A full general strike (+15 Worker Control, +10 Revolutionary Fervor, -5 Economy, +5 Faistas Influence)',
          textZh: '全面总罢工 (+15 工人控制, +10 革命热情, -5 经济, +5 无政府派影响力)',
          subtitle: 'Paralyze the economy and mobilize the entire working class for revolution.',
          subtitleZh: '瘫痪经济，动员整个工人阶级投身革命，这将极大增强无政府派的影响力。',
          effect: (s) => {
            const overallDissent = 
              (s.factions.Treintistas.influence * s.factions.Treintistas.dissent +
               s.factions.Cenetistas.influence * s.factions.Cenetistas.dissent +
               s.factions.Faistas.influence * s.factions.Faistas.dissent +
               s.factions.Puristas.influence * s.factions.Puristas.dissent) / 100;
            const multiplier = 1 - (overallDissent / 100);
            return {
              stats: {
                ...s.stats,
                workerControl: Math.min(100, s.stats.workerControl + 15),
                revolutionaryFervor: Math.min(100, s.stats.revolutionaryFervor + 10 * multiplier),
                economy: Math.max(0, s.stats.economy - 5),
              },
              factions: adjustFactionInfluence(s.factions, 'Faistas', 5)
            };
          }
        }
      ]
    }
  }),
};
