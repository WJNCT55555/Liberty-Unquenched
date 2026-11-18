import { Advisor } from '../types';
import { adjustFactionDissent, adjustFactionInfluence } from '../utils';
import { armsAcquisition } from '../military_affairs/arms_acquisition';

export const josePeirats: Advisor = {
  id: 'jose_peirats',
  name: 'José Peirats',
  nameZh: '何塞·佩拉茨',
  faction: 'Puristas',
  description: 'A staunch defender of anarchist principles and historian. He strongly opposes any form of class collaboration or government participation, advocating for a return to pure grassroots syndicalism.',
  descriptionZh: '坚定的无政府主义原则捍卫者和历史学家。他强烈反对任何形式的阶级合作或参与政府，主张回归纯粹的基层工团主义。',
  image: 'img/Advisors/Jose_Peirats.png',
  actions: [
    {
      id: 'promote_afinidad_groups',
      title: 'Promote the Afinidad Groups',
      titleZh: '推动Afinidad小组',
      subtitle: 'Revolutionary fervor +3, Puristas influence +3, and one more Ateneo Libertario.',
      subtitleZh: '革命热情 +3，纯粹派影响力 +3，自由雅典学苑 +1。',
      description: 'Affinity groups now meet in every district, and a new Ateneo Libertario gives their debates a permanent home.',
      descriptionZh: 'Afinidad 小组在各街区落地，新落成的自由雅典学苑为他们的辩论提供了固定场所。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => {
        const factions = adjustFactionInfluence(state.factions, 'Puristas', 3);

        return {
          advisorActionTimer: 6,
          ateneos_established: (state.ateneos_established || 0) + 1,
          factions,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 3)
          }
        };
      }
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
      effect: (state) => {
        const factions = adjustFactionDissent(state.factions, 'Puristas', -5);

        return {
          advisorActionTimer: 6,
          factions,
          stats: {
            ...state.stats,
            bureaucratization: Math.max(0, state.stats.bureaucratization - 3)
          }
        };
      }
    },
    {
      // Same option as Ascaso's "Clandestine Armaments": enter the Arms Acquisition card
      // even while it is on cooldown, then leave it on cooldown again.
      id: 'peirats_clandestine_network',
      title: 'Clandestine Armaments',
      titleZh: '地下武装整备',
      subtitle: 'Open the Arms Acquisition decision immediately, ignoring its current cooldown; the card then goes on cooldown as usual.',
      subtitleZh: '直接进入「军备获取」决策，无视其当前冷却；进入后该卡照常进入冷却。',
      unavailableSubtitle: (state) => state.resources < 1
        ? 'Requires at least 1 resource.'
        : `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => state.resources < 1
        ? '需要至少 1 资源。'
        : `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0 && state.resources >= 1,
      effect: (state) => {
        const result = armsAcquisition.effect(state);

        return {
          advisorActionTimer: 6,
          // Same as Ascaso: the cooldown is bypassed on the way in, then written again.
          arms_acquisition_timer: 6,
          currentEvent: result.currentEvent
        };
      },
      description: 'A purse of hard currency has gone to the border contacts, and the committees will hear the result within the month.',
      descriptionZh: '一袋硬通货交到了边境联系人手里，各委员会这个月内就会知道结果。',
    }
  ]
};
