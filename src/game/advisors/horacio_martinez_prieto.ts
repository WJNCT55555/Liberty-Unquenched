import { Advisor } from '../types';
import { adjustFactionDissents } from '../utils';

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
      id: 'horacio_maintain_unity',
      title: 'Maintain Unity',
      titleZh: '维护团结',
      subtitle: 'Reduce friction between the internal factions.',
      subtitleZh: '降低内部派系矛盾。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => {
        // Jabalistas is listed unconditionally: until the faction is introduced
        // its dissent sits at 0, so the clamped -4 has no effect before then.
        const factions = adjustFactionDissents(state.factions, {
          Treintistas: -4,
          Cenetistas: -4,
          Faistas: -4,
          Puristas: -4,
          Jabalistas: -4
        });

        return {
          advisorActionTimer: 6,
          factions
        };
      },
      description: "Horacio's mediation has lowered the factional friction within the CNT, allowing the union to present a united front against our real class enemies.",
      descriptionZh: '通过在狂热激进派与稳健实用派之间穿针引线，成功降低了无政府主义阵营的长期内耗，使全国工会以更坚毅、更团结的姿态应对真正的阶级敌人。',
    }
  ]
};
