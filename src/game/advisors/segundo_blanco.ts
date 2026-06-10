import { Advisor } from '../types';
import { adjustFactionInfluence } from '../utils';

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
      id: 'blanco_alliance_workers',
      title: 'Asturian Workers Alliance',
      titleZh: '缔结阿斯图里亚斯工盟',
      subtitle: 'Build strong solidarity alliances with the socialist UGT syndicates.',
      subtitleZh: '在基层推进与社会主义总工会（UGT）的行动联合，践行“无产阶级兄弟联盟”。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions.Cenetistas.dissent = Math.max(0, newFactions.Cenetistas.dissent - 10);
        newFactions = adjustFactionInfluence(newFactions, 'Cenetistas', 6);
        return {
          advisorActionTimer: 6,
          factions: newFactions,
          stats: {
            ...state.stats
          }
        };
      },
      description: 'By forming local pacts with socialist UGT branches, we have forged powerful mutual-defense and strike agreements that frighten the local bourgeoisie.',
      descriptionZh: '通过与社会主义UGT地方工会缔结联合，我们构筑了基层联防与并肩罢工的钢铁同盟，使反动资产阶级和军阀胆战心惊。',
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
