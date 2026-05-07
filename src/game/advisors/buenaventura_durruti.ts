import { Advisor } from '../types';

export const buenaventuraDurruti: Advisor = {
  id: 'Buenaventura Durruti',
  name: 'Buenaventura Durruti',
  nameZh: '布埃纳文图拉·杜鲁蒂',
  faction: 'Faistas',
  description: 'Durruti is a legendary figure of Spanish anarchism, a leader of the FAI and the Durruti Column. He advocates for revolutionary discipline and direct action against fascism, but remains deeply skeptical of Republican government control.',
  descriptionZh: '杜鲁蒂是西班牙无政府主义的传奇人物，FAI和杜鲁蒂纵队的领导人。他主张革命纪律和针对法西斯主义的直接行动，但对共和国政府的控制深表怀疑。',
  image: 'img/Jose_Buenaventura_Durruti_Dumange.png',
  actions: [
    {
      id: 'organize_militias',
      title: 'Organize Worker Militias',
      titleZh: '组织工人国民军',
      subtitle: 'Empower CNT militias to strengthen the anti-fascist front.',
      subtitleZh: '武装CNT民兵，加强反法西斯阵线。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        advisorActionTimer: 6,
        stats: {
          ...state.stats,
          anarchistMilitia: state.stats.anarchistMilitia + 15,
          popularFrontUnity: state.stats.popularFrontUnity - 3,
        }
      }),
      description: 'We have expanded the anarchist militias in Aragon and Catalonia. While this bolsters the fight against Franco, it creates friction with Republican government forces who demand centralized command.',
      descriptionZh: '我们在阿拉贡和加泰罗尼亚扩充了无政府主义民兵。虽然这加强了对抗佛朗哥的战斗，但也与要求中央集权的共和国政府军队产生了摩擦。',
    },
    {
      id: 'revolutionary_discipline',
      title: 'Revolutionary Discipline',
      titleZh: '革命纪律',
      subtitle: 'Enforce strict discipline among the militias.',
      subtitleZh: '在民兵中执行严格的纪律。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        advisorActionTimer: 6,
        stats: {
          ...state.stats,
          armyLoyalty: Math.min(100, state.stats.armyLoyalty + 10),
          revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 5),
        }
      }),
      description: 'We must ensure our militias are an effective fighting force, even if it means adopting traditional military discipline.',
      descriptionZh: '我们必须确保我们的民兵是一支有效的战斗力量，即使这意味着采用传统的军事纪律。',
    },
    {
      id: 'direct_action',
      title: 'Direct Action',
      titleZh: '直接行动',
      subtitle: 'Launch a direct strike against fascist elements.',
      subtitleZh: '对法西斯分子发动直接打击。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        advisorActionTimer: 6,
        stats: {
          ...state.stats,
          revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 10),
        }
      }),
      description: 'We cannot wait for the government to act. We must take the fight directly to the enemy.',
      descriptionZh: '我们不能等待政府采取行动。我们必须直接向敌人发起战斗。',
    }
  ]
};
