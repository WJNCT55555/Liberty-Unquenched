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
      id: 'strengthen_treintistas_juan_lopez',
      title: 'Strengthen the Treintistas',
      titleZh: '加强三十人集团',
      subtitle: 'Expand the influence of the moderate faction.',
      subtitleZh: '扩大温和派的影响力。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => {
        const factions = adjustFactionInfluence(state.factions, 'Treintistas', 5);

        return {
          advisorActionTimer: 6,
          factions
        };
      },
      description: 'Juan López Sánchez has rallied the moderate syndicates behind the Treintistas, giving the reformist wing a firmer footing inside the CNT.',
      descriptionZh: '胡安·洛佩斯·桑切斯把温和的工团团结到三十人集团周围，使改良派在全国劳工联合会内部获得了更稳固的立足点。',
    }
  ]
};
