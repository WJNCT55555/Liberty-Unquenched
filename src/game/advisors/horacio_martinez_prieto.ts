import { Advisor } from '../types';
import { adjustFactionInfluence } from '../utils';

export const horacioMartinezPrieto: Advisor = {
  id: 'Horacio Martínez Prieto',
  name: 'Horacio Martínez Prieto',
  nameZh: '霍拉西奥·马丁内斯·普列托',
  faction: 'Cenetistas',
  description: 'A moderate, pragmatic Cenetistas leader and General Secretary of the CNT National Committee. He sought a middle ground between radical Faistas and reformist Treintistas, advocating for governmental participation to defeat fascism.',
  descriptionZh: '温和务实的全国委员会总书记、中立派（Cenetistas）核心。他在暴动派（Faistas）和温和派（Treintistas）之间寻求平衡，并主张通过参与内阁实现反法西斯力量的全面联合。',
  image: 'img/Advisors/Horacio_Martinez_Prieto.png',
  actions: [
    {
      id: 'horacio_internal_reconciliation',
      title: 'Internal Reconciliation',
      titleZh: '促进内部派系和解',
      subtitle: 'Reduce dissent among the radical Faistas and moderate Treintistas factions.',
      subtitleZh: '在暴动派与温和派之间建立和谈沟通机制，降低双方内耗。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions.Faistas.dissent = Math.max(0, newFactions.Faistas.dissent - 8);
        newFactions.Treintistas.dissent = Math.max(0, newFactions.Treintistas.dissent - 8);
        newFactions.Cenetistas.dissent = Math.max(0, newFactions.Cenetistas.dissent - 5);
        newFactions = adjustFactionInfluence(newFactions, 'Cenetistas', 4);
        return {
          advisorActionTimer: 6,
          factions: newFactions
        };
      },
      description: "Horacio's mediation has lowered the factional friction within the CNT, allowing the union to present a united front against our real class enemies.",
      descriptionZh: '通过在狂热激进派与稳健实用派之间穿针引线，成功降低了无政府主义阵营的长期内耗，使全国工会以更坚毅、更团结的姿态应对真正的阶级敌人。',
    },
    {
      id: 'horacio_pragmatic_parliament',
      title: 'Popular Front Pragmatism',
      titleZh: '人民阵线务实协作',
      subtitle: 'Strengthen our voice in the Popular Front and stabilize relations with the republicans.',
      subtitleZh: '加强西班牙左翼联盟在应对国事和对地主/军官的制衡协作功能。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        advisorActionTimer: 6,
        stats: {
          ...state.stats
        }
      }),
      description: 'By collaborating pragmatically with other Popular Front parties, we have consolidated our anti-fascist defense, even if pure ideologues call it a sellout.',
      descriptionZh: '通过与其他左翼和共和派力量展开审慎、诚恳的务实沟通，我们在不丢弃原则的前提下稳固了政局防线，将右翼反扑的势头推迟。',
    },
    {
      id: 'horacio_defensive_military',
      title: 'Defense Preparedness',
      titleZh: '筹备常态防御机制',
      subtitle: 'Synthesize local militia units and upgrade collective defense training.',
      subtitleZh: '协调自发的地方民兵武装，理顺防区联合训练，提高军事备战。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        advisorActionTimer: 6,
        stats: {
          ...state.stats,
          anarchistMilitia: state.stats.anarchistMilitia + 10,
          armyLoyalty: Math.min(100, state.stats.armyLoyalty + 5)
        }
      }),
      description: 'Through structured union coordination, we have organized strategic defensive layouts that will stand firm against any potential military uprisings.',
      descriptionZh: '利用总工会组织网建立常态备战自卫队，指导各工矿厂区的军事联防演练，显著提升了面对突发军事叛乱时的承压能力。',
    }
  ]
};
