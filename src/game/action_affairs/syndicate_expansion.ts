import { Card } from '../types';
import { adjustAllActiveFactionDissent, adjustClassSupport, adjustFactionInfluence } from '../utils';

export const syndicateExpansion: Card = {
  id: 'syndicate_expansion',
  title: 'Syndicate Expansion',
  titleZh: '工会扩张',
  type: 'Action',
  description: 'Expand the syndicates to increase Syndicalist influence and worker control.',
  descriptionZh: '扩张工会组织，增加工团派的影响力与工人控制度。',
  cost: 1,
  effect: (state) => ({
    currentEvent: {
      id: 'syndicate_expansion_event',
      date: { year: state.year, month: state.month },
      title: 'Syndicate Expansion',
      titleZh: '工会扩张',
      description: 'Our strength lies in organization. From the massive textile mills of Barcelona to the sun-drenched olive groves of Andalusia, we must weave a web of revolutionary syndicates. Every new member is a brick in the foundation of the new society. We must choose where to send our organizers: to the industrial heartlands where the proletariat is concentrated, or to the rural villages where the spirit of communal land ownership still burns bright.',
      descriptionZh: '我们的力量源于组织。从巴塞罗那庞大的纺织厂到安达卢西亚阳光普照的橄榄林，我们必须织就一张革命工团的网络。每一位新成员都是新社会基石上的一块砖。我们必须选择将组织者派往何处：是无产阶级集中的工业中心，还是公有制精神依然旺盛的农村村落。',
      options: [
        {
          text: 'Urban Factories (+Workers Support, +Cenetistas)',
          textZh: '城市工厂 (+工人支持, +工团派影响力)',
          subtitle: 'Focus on organizing in industrial hubs and factories.',
          subtitleZh: '专注于工业中心和工厂的组织工作，巩固城市无产阶级基础。',
          effect: (s) => {
            let newClasses = s.classes;
            newClasses = adjustClassSupport(newClasses, 'Obreros', 'CNT_FAI', 10);
            return {
              classes: newClasses,
              stats: { ...s.stats, workerControl: Math.min(100, s.stats.workerControl + 5) },
              factions: adjustFactionInfluence(s.factions, 'Cenetistas', 10)
            };
          }
        },
        {
          text: 'Rural Collectives (+Peasants Support, +Faistas)',
          textZh: '农村集体农庄 (+农民支持, +无政府派影响力)',
          subtitle: 'Establish anarchist collectives in the countryside.',
          subtitleZh: '在农村地区建立无政府主义集体，争取贫苦农民的坚定支持。',
          effect: (s) => {
            let newClasses = s.classes;
            newClasses = adjustClassSupport(newClasses, 'Braceros', 'CNT_FAI', 10);
            return {
              classes: newClasses,
              stats: { ...s.stats, workerControl: Math.min(100, s.stats.workerControl + 5) },
              factions: adjustFactionInfluence(s.factions, 'Faistas', 10)
            };
          }
        },
        {
          text: 'Focus on current issues (All Faction Dissent +3, -5 Revolutionary Fervor)',
          textZh: '专注现有问题 (所有派系分歧 +3, -5 革命热情)',
          subtitle: 'Address internal administrative issues instead of expanding.',
          subtitleZh: '处理内部行政和琐碎事务而非扩张，这会引发无休止的讨论并降低革命热情。',
          effect: (s) => {
            const newFactions = adjustAllActiveFactionDissent(s.factions, 3);

            return {
              factions: newFactions,
              stats: { 
                ...s.stats, 
                revolutionaryFervor: Math.max(0, s.stats.revolutionaryFervor - 5) 
              }
            };
          }
        }
      ]
    }
  }),
};
