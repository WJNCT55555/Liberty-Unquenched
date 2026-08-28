import { Card } from '../types';
import { adjustAllActiveFactionDissent, adjustFactionInfluence, adjustClassSupport, getDissentMultiplier } from '../utils';

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
          text: 'A limited demonstration',
          textZh: '有限的示威',
          subtitle: 'A controlled protest to show our strength without full escalation.',
          subtitleZh: '一场受控的示威，旨在展示力量而不至于全面升级冲突。',
          effect: (s) => {
            const multiplier = getDissentMultiplier(s.factions);
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
          text: 'A full general strike',
          textZh: '全面总罢工',
          subtitle: 'Mobilize the entire working class for revolution.',
          subtitleZh: '动员整个工人阶级投身革命，这将极大增强无政府派的影响力。',
          effect: (s) => {
            const multiplier = getDissentMultiplier(s.factions);
            return {
              stats: {
                ...s.stats,
                workerControl: Math.min(100, s.stats.workerControl + 5),
                revolutionaryFervor: Math.min(100, s.stats.revolutionaryFervor + 10 * multiplier),
              },
              factions: adjustFactionInfluence(s.factions, 'Faistas', 5)
            };
          }
        },
        {
          text: 'Strike in solidarity with imprisoned workers',
          textZh: '声援狱中工人罢工',
          subtitle: 'Demand the immediate release of political and social prisoners, cementing union solidarity.',
          subtitleZh: '要求立即释放政治与社会犯人，巩固各派系在重压之下的工会团结。',
          effect: (s) => {
            const multiplier = getDissentMultiplier(s.factions);

            return {
              factions: adjustAllActiveFactionDissent(s.factions, -5),
              stats: {
                ...s.stats,
                revolutionaryFervor: Math.min(100, s.stats.revolutionaryFervor + 3 * multiplier),
              }
            };
          }
        },
        {
          text: 'Strike to advance workers\' rights',
          textZh: '推动工人权利的罢工',
          subtitle: 'Focus the strike on concrete economic and workplace demands: higher wages, safety standards, and shorter hours.',
          subtitleZh: '将罢工重点放在具体的经济和工作场所诉求上：更高的薪资、安全标准和缩短工时。',
          effect: (s) => {
            let newClasses = s.classes;
            newClasses = adjustClassSupport(newClasses, 'Obreros', 'CNT_FAI', 2);
            newClasses = adjustClassSupport(newClasses, 'Braceros', 'CNT_FAI', 2);

            return {
              classes: newClasses,
              stats: {
                ...s.stats,
                workerControl: Math.min(100, s.stats.workerControl + 10),
              }
            };
          }
        }
      ]
    }
  }),
};
