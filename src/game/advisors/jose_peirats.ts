import { Advisor } from '../types';
import { adjustFactionInfluence } from '../utils';

export const josePeirats: Advisor = {
  id: 'jose_peirats',
  name: 'José Peirats',
  nameZh: '何塞·佩拉茨',
  faction: 'Puristas',
  description: 'A staunch defender of anarchist principles and historian. He strongly opposes any form of class collaboration or government participation, advocating for a return to pure grassroots syndicalism.',
  descriptionZh: '坚定的无政府主义原则捍卫者和历史学家。他强烈反对任何形式的阶级合作或参与政府，主张回归纯粹的基层工团主义。',
  image: 'img/José Peirats.png',
  actions: [
    {
      id: 'return_to_roots',
      title: 'Return to the Roots',
      titleZh: '回归本源',
      subtitle: 'Purge reformist tendencies and rearm the workers ideologically.',
      subtitleZh: '清洗改良主义倾向，在思想上重新武装工人。',
      description: '',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        ...state,
        advisorActionTimer: 6,
        stats: {
          ...state.stats,
          workerControl: Math.min(100, state.stats.workerControl + 10),
          popularFrontUnity: Math.max(0, state.stats.popularFrontUnity - 5)
        },
        factions: adjustFactionInfluence(state.factions, 'Puristas', 10)
      })
    },
    {
      id: 'denounce_bureaucracy',
      title: 'Denounce Bureaucracy',
      titleZh: '谴责官僚主义',
      subtitle: 'True revolution cannot be directed from ministries in Madrid.',
      subtitleZh: '真正的革命不能由马德里各部委的办公室来指挥。',
      description: '',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        ...state,
        advisorActionTimer: 6,
        factions: {
          ...state.factions,
          Treintistas: { ...state.factions.Treintistas, dissent: Math.max(0, state.factions.Treintistas.dissent - 5) },
          Cenetistas: { ...state.factions.Cenetistas, dissent: Math.max(0, state.factions.Cenetistas.dissent - 5) },
          Faistas: { ...state.factions.Faistas, dissent: Math.max(0, state.factions.Faistas.dissent - 5) }
        }
      })
    }
  ]
};
