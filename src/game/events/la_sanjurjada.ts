import { GameEvent } from '../types';

export const laSanjurjada: GameEvent = {
  id: 'la_sanjurjada',
  title: 'La Sanjurjada',
  titleZh: '桑胡尔霍起义（La Sanjurjada）',
  description: 'General José Sanjurjo has led a military uprising against the Republic, citing the deterioration of public order and the government\'s regional statutes. While the coup has largely failed in big cities like Madrid, it succeeded momentarily in Seville before being crushed by the strike action of the CNT and UGT, and loyal security forces.',
  descriptionZh: '何塞·桑胡尔霍将军领导了一场反对共和国的军事起义，理由是公共秩序恶化和政府的地区自治法案。虽然政变在马德里等大城市大体失败，但它在塞维利亚一度成功，随后被 CNT 和 UGT 的罢工行动以及忠诚的安全部队镇压。',
  image: 'sanjurjada',
  condition: (state) => state.year === 1932 && state.month === 8 && state.government.type === 'Republican-Socialist Cabinet',
  options: [
    {
      text: 'The Republic is taking root; let us accelerate our legislative reforms.',
      textZh: '共和已经深入人心，加紧共和国的立法建设。',
      effect: (state) => ({
        domesticPolicy: {
          ...state.domesticPolicy,
          land_reform_progress: Math.min(100, state.domesticPolicy.land_reform_progress + 10) // 土地改革上升一级(+10 or appropriate)
        },
        stats: {
          ...state.stats,
          armyLoyalty: Math.max(0, state.stats.armyLoyalty - 5)
        }
      })
    },
    {
      text: 'We must pressure the officials in government to forcefully implement the military reform act.',
      textZh: '我们必须照会在政府中的官员，强硬推行军官改革法案。',
      condition: (state) => state.isPRRevSFormed && state.isCNTInGovernment,
      effect: (state) => ({
        stats: {
          ...state.stats,
          armyLoyalty: Math.max(0, state.stats.armyLoyalty - 10)
        }
      })
    }
  ]
};
