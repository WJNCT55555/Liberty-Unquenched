import { Card, GameEvent, GameState } from '../types';
import { adjustAllActiveFactionDissent, adjustClassSupport, adjustFactionInfluence } from '../utils';
import { effectPreviewFromEffect } from '../effectPreview';

type SyndicateExpansionEffect = GameEvent['options'][number]['effect'];

const organizeUrbanFactories: SyndicateExpansionEffect = (state: GameState): Partial<GameState> => {
  const classes = adjustClassSupport(state.classes, 'Obreros', 'CNT_FAI', 3);

  return {
    classes,
    factions: adjustFactionInfluence(state.factions, 'Cenetistas', 5),
    stats: {
      ...state.stats,
      workerControl: Math.min(100, state.stats.workerControl + 2)
    }
  };
};

const organizeRuralCollectives: SyndicateExpansionEffect = (state: GameState): Partial<GameState> => {
  const classes = adjustClassSupport(state.classes, 'Braceros', 'CNT_FAI', 3);

  return {
    classes,
    factions: adjustFactionInfluence(state.factions, 'Faistas', 5),
    stats: {
      ...state.stats,
      workerControl: Math.min(100, state.stats.workerControl + 1)
    }
  };
};

const focusOnCurrentIssues: SyndicateExpansionEffect = (state: GameState): Partial<GameState> => {
  const factions = adjustAllActiveFactionDissent(state.factions, 3);

  return {
    factions,
    stats: {
      ...state.stats,
      revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 5)
    }
  };
};

const preview = (effect: SyndicateExpansionEffect) => (state: GameState) => {
  return effectPreviewFromEffect(state, effect);
};

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
          text: 'Urban Factories',
          textZh: '城市工厂',
          subtitle: 'Focus on organizing in industrial hubs and factories.',
          subtitleZh: '专注于工业中心和工厂的组织工作，巩固城市无产阶级基础。',
          effectPreview: preview(organizeUrbanFactories),
          effect: organizeUrbanFactories
        },
        {
          text: 'Rural Collectives',
          textZh: '农村集体农庄',
          subtitle: 'Establish anarchist collectives in the countryside.',
          subtitleZh: '在农村地区建立无政府主义集体，争取贫苦农民的坚定支持。',
          effectPreview: preview(organizeRuralCollectives),
          effect: organizeRuralCollectives
        },
        {
          text: 'Focus on current issues',
          textZh: '专注现有问题',
          subtitle: 'Address internal administrative issues instead of expanding.',
          subtitleZh: '处理内部行政和琐碎事务而非扩张，这会引发无休止的讨论并降低革命热情。',
          effectPreview: preview(focusOnCurrentIssues),
          effect: focusOnCurrentIssues
        }
      ]
    }
  }),
};
