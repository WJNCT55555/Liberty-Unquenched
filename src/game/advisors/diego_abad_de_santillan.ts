import { Advisor } from '../types';
import { adjustFactionInfluence } from '../utils';

export const diegoAbadDeSantillan: Advisor = {
  id: 'Diego Abad de Santillán',
  name: 'Diego Abad de Santillán',
  nameZh: '迭戈·阿巴德·德·桑蒂利安',
  faction: 'Faistas',
  description: 'Anarchist intellectual, writer, and economist of the FAI. He developed comprehensive theories on self-managed socialization, and actively organized Catalonia\'s antifascist economy during the revolution.',
  descriptionZh: '无政府主义知识分子、作家，FAI著名经济理论家。他系统阐述了自决互助与自主管理的社会化经济学说，并在战时深度参与组织了加泰罗尼亚的军事经济体系。',
  image: 'img/Diego_Abad_de Santillán.png',
  actions: [
    {
      id: 'santillan_socialized_economics',
      title: 'Socialization Blueprint',
      titleZh: '社会化经济规划',
      subtitle: 'Advance self-managed industries and cooperative distribution networks.',
      subtitleZh: '推进企业自主管理与合作化物资分配，提升公社化生产能力。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        advisorActionTimer: 6,
        resources: state.resources + 5,
        stats: {
          ...state.stats,
          workerControl: Math.min(100, state.stats.workerControl + 10)
        }
      }),
      description: 'By defining concrete economic structures instead of pure abstractions, we have systematized factory collectivism and secured vital provisions.',
      descriptionZh: '摒弃了空洞的理论论证，我们以详尽、详实的工业规划组织工厂集体化，保障了物资产出的有序循环。',
    },
    {
      id: 'santillan_cultural_agitation',
      title: 'Publish "Tierra y Libertad"',
      titleZh: '主编《土地与自由》',
      subtitle: 'Disseminate revolutionary theory to strengthen grassroots solidarity and enthusiasm.',
      subtitleZh: '印刷并分发革命刊物，厘清理论，降低内部迷茫与内耗。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions = adjustFactionInfluence(newFactions, 'Faistas', 5);
        newFactions.Faistas.dissent = Math.max(0, newFactions.Faistas.dissent - 10);
        return {
          advisorActionTimer: 6,
          factions: newFactions,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 12)
          }
        };
      },
      description: 'Through robust educational journals and cultural forums, our message has educated an entire generation of active militants.',
      descriptionZh: '无政府主义理论报刊的广泛发行厘清了混乱概念，大幅降低了战斗员的派内分歧，激荡了广泛的革命热情。',
    },
    {
      id: 'santillan_militia_economy',
      title: 'War Economy Mobilization',
      titleZh: '战时自卫工业动员',
      subtitle: 'Coordinate weapons laboratories and industrial conversion for defensive readiness.',
      subtitleZh: '协调机械协作和轻工业改组，保障前线大后方军需自卫供给。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        advisorActionTimer: 6,
        armaments: state.armaments + 15,
        stats: {
          ...state.stats
        }
      }),
      description: 'By organizing a coordinated Committee of Militias and industrial experts, we turned private workshops into vital defense labs.',
      descriptionZh: '组建了跨党派的民兵技术委员会，指导地方制造业和车间转产简易防御军需，强化了反法西斯力量对国难的备战度。',
    }
  ]
};
