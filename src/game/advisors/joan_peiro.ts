import { Advisor } from '../types';

export const joanPeiro: Advisor = {
  id: 'Joan Peiró',
  name: 'Joan Peiró',
  nameZh: '胡安·佩罗',
  faction: 'Treintistas',
  description: 'An influential anarcho-syndicalist who served as Minister of Industry during the Civil War. He focuses on economic organization and industrial collectivization.',
  descriptionZh: '一位有影响力的无政府工团主义者，在内战期间担任工业部长。他专注于经济组织和工业集体化。',
  image: 'img/Joan_Peiró.png',
  actions: [
    {
      id: 'Joan Peiró_action1',
      title: 'Industrial Collectivization',
      titleZh: '工业集体化',
      subtitle: 'Increase worker control over the economy.',
      subtitleZh: '增加工人对经济的控制。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        advisorActionTimer: 6,
        stats: {
          ...state.stats,
          workerControl: state.stats.workerControl + 15,
          economy: state.stats.economy + 5,
        }
      }),
      description: 'We have reorganized factories under direct worker management. Production is stabilizing, and the workers feel empowered.',
      descriptionZh: '我们在工人直接管理下重组了工厂。生产正在稳定，工人们感到了力量。',
    },
    {
      id: 'cooperative_factories',
      title: 'Cooperative Factories',
      titleZh: '合作社工厂',
      subtitle: 'Promote cooperatives over forced collectivization.',
      subtitleZh: '提倡合作社而非强制集体化。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        advisorActionTimer: 6,
        resources: state.resources + 5,
        stats: {
          ...state.stats,
          economy: Math.min(100, state.stats.economy + 5),
        }
      }),
      description: 'Voluntary cooperatives are more efficient and less alienating to the middle classes than forced expropriation.',
      descriptionZh: '自愿的合作社比强制征用更有效率，也更不容易疏远中产阶级。',
    },
    {
      id: 'syndicalist_education',
      title: 'Syndicalist Education',
      titleZh: '工团主义教育',
      subtitle: 'Educate the workers in the principles of anarcho-syndicalism.',
      subtitleZh: '向工人传授无政府工团主义的原则。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => {
        const newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions.Treintistas.dissent = Math.max(0, newFactions.Treintistas.dissent - 5);
        newFactions.Cenetistas.dissent = Math.max(0, newFactions.Cenetistas.dissent - 5);
        return {
          advisorActionTimer: 6,
          factions: newFactions,
          stats: {
            ...state.stats,
            workerControl: Math.min(100, state.stats.workerControl + 5),
          }
        };
      },
      description: 'A revolution requires educated workers capable of managing their own affairs.',
      descriptionZh: '革命需要受过教育、能够管理自己事务的工人。',
    }
  ]
};
