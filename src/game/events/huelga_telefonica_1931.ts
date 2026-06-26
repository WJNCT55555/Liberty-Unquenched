import { GameEvent } from '../types';
import { adjustFactionInfluence } from '../utils';

export const huelgaTelefonica1931: GameEvent = {
  id: 'huelga_telefonica_1931',
  date: { year: 1931, month: 7 },
  condition: (state) => state.cntStance !== 'govern',
  title: 'The 1931 Telephone Strike',
  titleZh: '1931年电话公司大罢工',
  description: 
    "The CNT's Sindicato de Teléfonos has declared a nationwide strike against the American-owned monopoly, Telefónica. Deeming it a threat to public order and foreign investment, the Republican-Socialist government, under Interior Minister Miguel Maura and Labor Minister Largo Caballero, has declared the strike illegal. Civil Guards have been deployed to occupy the exchange buildings and protect strikebreakers. Clashes have turned violent, with several workers killed and hundreds of anarchists arrested.",
  descriptionZh: 
    "全劳联（CNT）旗下的电话工会宣布在全国范围内发起针对美资垄断企业——西班牙电话公司的罢工。共和-社会党联合政府将其视为对公共秩序及海外投资的严峻威胁，内政部长米格尔·莫拉和劳动部长拉尔戈·卡巴列罗将罢工定性为非法，并调动国民警卫队占领接线大楼，保护罢工破坏者。冲突迅速升级为流血惨剧，数名工人惨死在枪口之下，亦有数以百计的无政府主义者遭到逮捕。",
  options: [
    {
      text: 'Escalate to a nationwide general strike and resist government forces',
      textZh: '将罢工升级为全国总罢工，对抗政府武装力量',
      subtitle: 'Massively boosts worker control and revolutionary fervor, but severely damages relationship with Republican and Socialist parties.',
      subtitleZh: '大幅提高工人控制和革命热情，但会严重损害与共和派及社会党的关系。',
      effect: (state) => {
        return {
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 15),
            workerControl: Math.min(100, state.stats.workerControl + 10),
            republicanAuthority: Math.max(0, state.stats.republicanAuthority - 10)
          },
          partyRelations: {
            ...state.partyRelations,
            PSOE: Math.max(-100, state.partyRelations.PSOE - 20),
            IR: Math.max(-100, state.partyRelations.IR - 20)
          },
          factions: adjustFactionInfluence(state.factions, 'Faistas', 10)
        };
      }
    },
    {
      text: 'Limit actions to selective sabotage and avoid general confrontation',
      textZh: '将行动限制在局部秘密破坏，避免全面正面冲突',
      subtitle: 'Lowers revolutionary expectations, but preserves our organizational strength and prevents complete rupture with the government.',
      subtitleZh: '降低革命期望值，但能保存组织实力，并避免与政府彻底决裂。',
      effect: (state) => {
        const newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions.Faistas.dissent = Math.min(100, newFactions.Faistas.dissent + 10);
        const adjustedFactions = adjustFactionInfluence(newFactions, 'Cenetistas', 5);
        
        return {
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 5)
          },
          partyRelations: {
            ...state.partyRelations,
            PSOE: Math.max(-100, state.partyRelations.PSOE - 5),
            IR: Math.max(-100, state.partyRelations.IR - 5)
          },
          factions: adjustedFactions
        };
      }
    }
  ]
};
