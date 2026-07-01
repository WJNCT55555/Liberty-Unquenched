import { Advisor } from '../types';
import { adjustFactionInfluence, adjustClassSupport } from '../utils';

export const segundoBlanco: Advisor = {
  id: 'Segundo Blanco',
  name: 'Segundo Blanco',
  nameZh: '塞贡多·布兰科',
  faction: 'Cenetistas',
  description: 'An influential Asturian teacher and militant of the CNT who later served as General Secretary and Minister of Public Education and Health during the Civil War. He was a champion of unity with the UGT under the "UHP" banner.',
  descriptionZh: '有威望的阿斯图里亚斯教师、无政府主义活动家。曾任CNT全国总书记，并在内阁中出任公共教育与卫生部长，是“无产阶级兄弟联盟（UHP）”和工会团结协作路线的坚定拥护者。',
  image: 'img/Joan_Peiró.png',
  actions: [
    {
      id: 'blanco_promote_workers_alliance',
      title: 'Promote Workers Alliance',
      titleZh: '推动工人联盟',
      subtitle: 'Increase industrial workers support for CNT by (2 × Neutralist Cohesion Coefficient), Workers Alliance progress +1.',
      subtitleZh: '产业工人对 CNT 支持度 +(2 × 中立派凝聚力系数)，工人联盟进度 +1。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => {
        const multiplier = 1 - (state.factions.Cenetistas.dissent / 100);
        const supportIncrease = 2 * multiplier;
        
        let newClasses = state.classes;
        newClasses = adjustClassSupport(newClasses, 'Obreros', 'CNT_FAI', supportIncrease);

        return {
          advisorActionTimer: 6,
          workersAllianceProgress: (state.workersAllianceProgress || 0) + 1,
          classes: newClasses
        };
      },
      description: 'By working closely with local union committees, we foster a shared class consciousness across syndicalist and socialist ranks, paving the way for a unified proletarian alliance.',
      descriptionZh: '通过同基层工会委员会紧密协作，我们在工团与社会主义队伍中培养了共同的阶级觉悟，为实现钢铁般坚固的无产阶级联盟扫清了障碍。',
    },
    {
      id: 'blanco_public_education',
      title: 'Popular Instruction',
      titleZh: '推行民众通识教育',
      subtitle: 'Organize municipal schools, libraries, and evening literacy classes.',
      subtitleZh: '依托地区工会与市镇，统筹开办工人夜校、职工图书馆，大力普及通识与扫盲。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        advisorActionTimer: 6,
        stats: {
          ...state.stats,
          workerControl: Math.min(100, state.stats.workerControl + 8),
          revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 6)
        }
      }),
      description: 'Our literacy schools have turned thousands of factories into hubs of civic and scientific dialogue, preparing workers for direct self-governance.',
      descriptionZh: '我们大办识字与工人学校，促进了理性启迪和劳动尊严的觉醒，将大批车间与作坊转变为科学论辩的熔炉，为自主接管社会打牢根基。',
    },
    {
      id: 'blanco_sanitary_coordination',
      title: 'Sanitary & Health Leagues',
      titleZh: '统筹卫生与防疫联盟',
      subtitle: 'Create unified public health and hospital networks for civilian and combatant relief.',
      subtitleZh: '统筹各省防区的公共卫生防范工作，编织野战救护与市镇医院网络。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        advisorActionTimer: 6,
        stats: {
          ...state.stats
        }
      }),
      description: 'By organizing medical personnel, field hospital units, and sanitation drives, we have dramatically lessened local suffering and established safe treatment zones.',
      descriptionZh: '由于有力地团结了各地医护工作者，开辟野战急救掩体和改善市镇卫生，我们极大遏制了瘟疫并拯救了成百上千战友。',
    }
  ]
};
