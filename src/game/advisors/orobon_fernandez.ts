import { Advisor } from '../types';

export const orobonFernandez: Advisor = {
  id: 'orobon_fernandez',
  name: 'Valeriano Orobón',
  nameZh: '瓦莱里亚诺·奥罗本',
  faction: 'Cenetistas',
  description: 'A visionary anarcho-syndicalist theoretician. He firmly believes that only a "Revolutionary Workers\' Alliance" between the CNT and the socialist UGT can halt the rise of fascism.',
  descriptionZh: '极具远见的无政府工团主义理论家。他坚信，只有 CNT 和社会主义的 UGT 结成“革命工人联盟”，才能阻挡法西斯主义的崛起。',
  image: 'img/Orobon_Fernandez.png',
  actions: [
    {
      id: 'improve_ugt_relations',
      title: 'Improve Relations with UGT',
      titleZh: '改善与 UGT 的关系',
      subtitle: 'We must put aside historical grievances and form a united proletarian front.',
      subtitleZh: '我们必须放下历史恩怨，结成统一的无产阶级战线。',
      description: '',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => {
        const multiplier = 1 - (state.factions.Cenetistas.dissent / 100);
        const relationIncrease = 5 * multiplier;
        return {
          ...state,
          advisorActionTimer: 6,
          partyRelations: {
            ...state.partyRelations,
            PSOE: Math.min(100, state.partyRelations.PSOE + relationIncrease)
          }
        };
      }
    },
    {
      id: 'promote_workers_alliance',
      title: 'Promote Workers\' Alliance',
      titleZh: '推动工人联盟',
      subtitle: 'Only a united working class can crush the reactionary plots.',
      subtitleZh: '只有团结一致的工人阶级，才能粉碎反动派的阴谋。',
      description: '',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => {
        const multiplier = 1 - (state.factions.Cenetistas.dissent / 100);
        const supportIncrease = 2 * multiplier;
        
        const newClasses = JSON.parse(JSON.stringify(state.classes));
        newClasses.Obreros.support.CNT_FAI = Math.min(100, newClasses.Obreros.support.CNT_FAI + supportIncrease);

        return {
          ...state,
          advisorActionTimer: 6,
          workersAllianceProgress: (state.workersAllianceProgress || 0) + 1,
          classes: newClasses
        };
      }
    }
  ]
};
