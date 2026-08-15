import { Advisor } from '../types';
import { adjustFactionInfluence } from '../utils';

export const juanLopezSanchez: Advisor = {
  id: 'Juan López Sánchez',
  name: 'Juan López Sánchez',
  nameZh: '胡安·洛佩斯·桑切斯',
  faction: 'Treintistas',
  description: 'A prominent printer, writer, and Treintistas leader who believed in economic pragmatism, cooperative federations, and trade-union realism.',
  descriptionZh: '著名的印刷工、作家和“三十人集团”领导人。他笃信经济实用主义、工团合作社，主张温和务实的工会现实路线。',
  image: 'img/Advisors/Juan_Lopez_Sanchez.png',
  actions: [
    {
      id: 'juan_lopez_cooperative',
      title: 'Cooperative Alliance',
      titleZh: '组织合作社联盟',
      subtitle: 'Exchange resources between agricultural and urban industrial cooperatives.',
      subtitleZh: '在农业合作社和城市工业合作社之间建立物资和贸易流通。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        advisorActionTimer: 6,
        resources: state.resources + 4
      }),
      description: 'By bridging agricultural and industrial cooperatives, we have increased local distribution efficiency and brought tangible relief to our working class families.',
      descriptionZh: '通过对接农业合作社和工业集体，我们打通了内部循环，有效降低了流通阻力，为工人群体带来了切实的保障。',
    },
    {
      id: 'juan_lopez_realism',
      title: 'Syndical Realism',
      titleZh: '倡导工会现实主义',
      subtitle: 'Improve union organization and de-escalate wildcat strike actions.',
      subtitleZh: '加强工会自身的组织纪律，减少无序、无目的的自发性罢工。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions = adjustFactionInfluence(newFactions, 'Treintistas', 5);
        return {
          advisorActionTimer: 6,
          factions: newFactions
        };
      },
      description: 'We have steered major syndicates towards concrete negotiations and structured reforms, decreasing radical insurrectionism while securing wage gains.',
      descriptionZh: '我们成功引导主力工会进行有目标的劳动谈判和建设性改革，减少了无序暴动性冲突，同时也确保了工人薪酬水平。',
    },
    {
      id: 'juan_lopez_federations',
      title: 'National Industrial Unions',
      titleZh: '整合全国产业联合会',
      subtitle: 'Reorganize small local syndicates into powerful nationwide industrial federations.',
      subtitleZh: '将零散的地方性同业工会重组为强有力的全国性垂直产业联合会。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions = adjustFactionInfluence(newFactions, 'Treintistas', 3);
        return {
          advisorActionTimer: 6,
          factions: newFactions,
          stats: {
            ...state.stats,
            workerControl: Math.min(100, state.stats.workerControl + 12)
          }
        };
      },
      description: 'By consolidating syndicates under nationwide federations, we have standardized collective agreements and greatly enhanced our worker control index.',
      descriptionZh: '通过将行业行会整合为全国性垂直产业联合会（FNI），我们统一了全国同业协议，大幅提高了我们的工人控制程度。',
    }
  ]
};
