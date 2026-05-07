import { Advisor } from '../types';
import { adjustFactionInfluence } from '../utils';

export const juanGarciaOliver: Advisor = {
  id: 'Juan García Oliver',
  name: 'Juan García Oliver',
  nameZh: '胡安·加西亚·奥利弗',
  faction: 'Faistas',
  description: 'A leading figure of the FAI and the "Los Solidarios" action group. He advocates for direct action, revolutionary justice, and armed struggle.',
  descriptionZh: 'FAI和“团结者”行动小组的领导人物。他主张直接行动、革命正义和武装斗争。',
  image: 'img/Juan_Garcia_Oliver.png',
  actions: [
    {
      id: 'revolutionary_justice',
      title: 'Revolutionary Justice',
      titleZh: '革命正义',
      subtitle: 'Establish popular tribunals to deal with fascist sympathizers.',
      subtitleZh: '建立人民法庭来处理法西斯同情者。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions = adjustFactionInfluence(newFactions, 'Faistas', 10);
        return {
          advisorActionTimer: 6,
          factions: newFactions,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 15)
          }
        };
      },
      description: 'We must root out the enemies of the revolution without hesitation or mercy.',
      descriptionZh: '我们必须毫不犹豫、毫不留情地根除革命的敌人。',
    },
    {
      id: 'arm_the_militias',
      title: 'Arm the Militias',
      titleZh: '武装民兵',
      subtitle: 'Seize weapons and distribute them to the workers.',
      subtitleZh: '夺取武器并分发给工人。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        advisorActionTimer: 6,
        armaments: state.armaments + 15,
        stats: {
          ...state.stats,
          anarchistMilitia: Math.min(100, state.stats.anarchistMilitia + 10),
          economy: Math.max(0, state.stats.economy - 5)
        }
      }),
      description: 'The workers must be armed to defend the revolution against both fascists and reactionaries.',
      descriptionZh: '必须武装工人，以保卫革命免受法西斯分子和反动派的侵害。',
    },
    {
      id: 'organize_defense_committees',
      title: 'Defense Committees',
      titleZh: '国防委员会',
      subtitle: 'Form neighborhood defense committees to maintain order.',
      subtitleZh: '组建社区国防委员会以维持秩序。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        advisorActionTimer: 6,
        stats: {
          ...state.stats,
          workerControl: Math.min(100, state.stats.workerControl + 10)
        }
      }),
      description: 'Power must remain in the hands of the people, organized block by block.',
      descriptionZh: '权力必须掌握在人民手中，按街区组织起来。',
    }
  ]
};
