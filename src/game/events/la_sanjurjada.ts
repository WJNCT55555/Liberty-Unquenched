import type { GameEvent } from '../types';
import { isAtOrAfter } from '../utils';
import { isOrganizationEstablished } from '../organizations';

const governmentCrisisMeta = {
  category: 'politics' as const,
  flow: 'solo' as const,
  series: ['government_crisis'],
};

export const laSanjurjada: GameEvent = {
  id: 'la_sanjurjada',
  meta: governmentCrisisMeta,
  date: { year: 1932, month: 8 },
  condition: (state) => isAtOrAfter(state, 1932, 8) && state.government.type === 'Republican-Socialist Cabinet',
  title: 'La Sanjurjada',
  titleZh: '桑胡尔霍事件',
  description: 'General José Sanjurjo has led a military uprising against the Republic, citing the deterioration of public order and the government\'s regional statutes. While the coup has largely failed in big cities like Madrid, it succeeded momentarily in Seville before being crushed by the strike action of the CNT and UGT, and loyal security forces.',
  descriptionZh: '何塞·桑胡尔霍将军领导了一场反对共和国的军事政变，理由是公共秩序恶化和政府的地区自治法案。虽然政变在马德里等大城市大体失败，但它在塞维利亚一度成功，随后被 CNT 和 UGT 的罢工行动以及忠诚的安全部队镇压。',
  image: 'sanjurjada',
  options: [
    {
      text: 'The Republic is taking root; let us accelerate our legislative reforms.',
      textZh: '共和已经深入人心，加紧共和国的立法建设。',
      effect: (state) => ({
        coupSystemActive: true,
        domesticPolicy: {
          ...state.domesticPolicy,
          land_law: 1,
          land_reform_progress: Math.min(100, state.domesticPolicy.land_reform_progress + 10),
          land_reform_law_enabled: true
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
      condition: (state) => isOrganizationEstablished(state, 'PRRevS') && state.cntStance === 'govern',
      unavailableSubtitle: () => 'Requires the PRRevS to be formed and the CNT in government.',
      unavailableSubtitleZh: () => '需要PRRevS成立且CNT参与执政。',
      effect: (state) => {
        return {
          coupSystemActive: true,
          domesticPolicy: {
            ...state.domesticPolicy,
            army_reform_law: 1
          },
          stats: {
            ...state.stats,
            armyLoyalty: Math.max(0, state.stats.armyLoyalty - 10)
          }
        };
      }
    }
  ]
};
