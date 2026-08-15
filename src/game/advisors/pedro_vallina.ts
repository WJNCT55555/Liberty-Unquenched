import { Advisor } from '../types';
import { adjustFactionInfluence } from '../utils';

export const pedroVallina: Advisor = {
  id: 'Pedro Vallina',
  name: 'Pedro Vallina',
  nameZh: '佩德罗·瓦利纳',
  faction: 'Jabalistas',
  description: 'The "people\'s doctor" of Andalusia, a legendary anarchist physician and organizer who spent his life setting up health cooperatives, schools, and resisting agrarian landlordism.',
  descriptionZh: '安达卢西亚的“平民医生”。无政府主义传奇医师和组织家，毕生致力于建立医疗互助社、理性学校，倾力反抗大庄园地主霸权。',
  image: 'img/Advisors/Pedro_Vallina.png',
  actions: [
    {
      id: 'vallina_social_medicine',
      title: 'Syndical Free Clinics',
      titleZh: '推行工会免费医疗',
      subtitle: 'Establish medical mutual aid clinics inside local CNT syndicates and working-class barrios.',
      subtitleZh: '在各地工团和劳工街区建立自发性免费诊疗与公共卫生互助。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions.Jabalistas.dissent = Math.max(0, newFactions.Jabalistas.dissent - 8);
        return {
          advisorActionTimer: 6,
          factions: newFactions
        };
      },
      description: 'By organising free clinical consulting and sanitary guidelines for poor families, we have shown what anarchist solidarity feels like in everyday life.',
      descriptionZh: '通过为穷苦劳工家庭建立免费门诊和公共医疗指引，把无政府主义互助理念落到了工人的日常生活之中，显著减少了底层积怨。',
    },
    {
      id: 'vallina_agrarian_resistance',
      title: 'Andalusian Day Laborers',
      titleZh: '动员南方庄园短工',
      subtitle: 'Organize disenfranchised agrarian workers in Andalusia to strike against land barons.',
      subtitleZh: '巡回组织安达卢西亚庄园长工与无地短工，极力争取地权与抗阻恶霸。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions = adjustFactionInfluence(newFactions, 'Jabalistas', 6);
        return {
          advisorActionTimer: 6,
          factions: newFactions,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 10)
          }
        };
      },
      description: 'Our campaigns in the southern countryside have mobilized hundreds of landless families, raising their class consciousness and local organization.',
      descriptionZh: '我们在南部乡野的巡回演说和农运，动员了成千上万穷苦佃农，激扬了底层的斗争意识与组织纽带。',
    },
    {
      id: 'vallina_rationalist_education',
      title: 'Rationalist Atheneums',
      titleZh: '创办理性林间学堂',
      subtitle: 'Promote radical adult schools and cultural circles to combat high illiteracy levels.',
      subtitleZh: '普及劳动者免费成人识字学校与文化会堂，扫除底层文盲状态。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        advisorActionTimer: 6,
        stats: {
          ...state.stats,
          workerControl: Math.min(100, state.stats.workerControl + 8),
          revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 5)
        }
      }),
      description: 'Education is our weapon. Feeding the minds of hungry labourers prepares them for self-managed social-production far better than any state decrees.',
      descriptionZh: '教育是我们的终极武器。在扫除蒙昧的同时，理性启蒙也为日后工人们自主管理社会、打理公社化经济打下了智识基础。',
    }
  ]
};
