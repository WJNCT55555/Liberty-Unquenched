import { Advisor } from '../types';
import { adjustFactionDissents, adjustFactionInfluence } from '../utils';
import { getEconomyCounter } from '../rules/economyReforms';
import { applyEconomicOption } from '../rules/controlShares';

/**
 * The wartime foreign-trade monopoly is capped at two steps, exactly like the
 * identically named option on the Commerce and Trade government card
 * (`government_affairs/trade_policy.ts`). The cap lives in `ECONOMY_REFORM_CAPS`;
 * this constant only names the threshold the availability check reads.
 */
const FOREIGN_TRADE_MONOPOLY_CAP = 2;

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
    },
    {
      id: 'weaken_the_anarchists',
      title: 'Weaken the Anarchists',
      titleZh: '减弱无政府主义者影响力',
      subtitle: 'Cut the influence of the Anarchists and the Purists, leaving the moderate wing room to negotiate.',
      subtitleZh: '削减无政府主义者与纯粹派的影响力，为温和派留出谈判空间。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => {
        // Both edits go through the zero-sum helper: the points released by the two
        // radical poles are redistributed across the remaining factions in one pass each.
        let factions = adjustFactionInfluence(state.factions, 'Faistas', -3);
        factions = adjustFactionInfluence(factions, 'Puristas', -6);

        return {
          advisorActionTimer: 6,
          factions
        };
      },
      description: 'López Sánchez has taken the rostrum against the FAI and the purists alike: the confederation cannot bargain with the Republic while its loudest wings deny that the Republic has any right to exist.',
      descriptionZh: '洛佩斯·桑切斯在讲坛上同时向 FAI 与纯粹派开火：只要最响亮的两翼否认共和国的存在权，联合会就无法与共和国讨价还价。',
    },
    {
      // Same measure as the Commerce and Trade card's identically named option, but the
      // two routes keep their own cooldowns: only `advisorActionTimer` is written here.
      id: 'wartime_foreign_trade_monopoly',
      title: 'Impose a Wartime Foreign Trade Monopoly',
      titleZh: '实行战时外贸垄断',
      subtitle: 'Wartime only, with the Ministry of Commerce in CNT hands: exports and imports pass through a single buyer, which is what makes Moscow interested and London nervous.',
      subtitleZh: '仅在战时、且商业部由 CNT 掌管时可用：进出口只经过一个买家——这才能让莫斯科感兴趣、让伦敦紧张。',
      unavailableSubtitle: (state) => {
        if (getEconomyCounter(state, 'wartime_trade_monopoly') >= FOREIGN_TRADE_MONOPOLY_CAP) {
          return 'Foreign trade is already monopolized.';
        }
        if (state.civilWarStatus !== 'ongoing') {
          return 'Only available while the civil war is ongoing.';
        }
        if (state.ministers.commerce !== 'CNT') {
          return 'Requires the CNT to hold the Ministry of Commerce.';
        }
        return `${state.advisorActionTimer} months before next advisor action.`;
      },
      unavailableSubtitleZh: (state) => {
        if (getEconomyCounter(state, 'wartime_trade_monopoly') >= FOREIGN_TRADE_MONOPOLY_CAP) {
          return '对外贸易已经完成垄断。';
        }
        if (state.civilWarStatus !== 'ongoing') {
          return '仅在内战进行中可用。';
        }
        if (state.ministers.commerce !== 'CNT') {
          return '需要 CNT 掌管商业部。';
        }
        return `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`;
      },
      condition: (state) => state.advisorActionTimer <= 0
        && state.ministers.commerce === 'CNT'
        && state.civilWarStatus === 'ongoing'
        && getEconomyCounter(state, 'wartime_trade_monopoly') < FOREIGN_TRADE_MONOPOLY_CAP,
      effect: (state) => {
        // The cap guarantees this read plus one step is the completed count, which is
        // what the card checks before it pays the Puristas' dissent bonus.
        const completed = getEconomyCounter(state, 'wartime_trade_monopoly') + 1 >= FOREIGN_TRADE_MONOPOLY_CAP;

        return {
          advisorActionTimer: 6,
          ...applyEconomicOption(state, 'wartime_trade_monopoly', { industry: { foreign: -3, state: 3 } }),
          foreign_exchange: Math.min(2500, (state.foreign_exchange ?? 0) + 8),
          relations: {
            ...state.relations,
            ussr: Math.min(100, state.relations.ussr + 8),
            uk: Math.max(-100, state.relations.uk - 6)
          },
          factions: completed ? adjustFactionDissents(state.factions, { Puristas: 4 }) : state.factions,
          currentEvent: null
        };
      },
      description: 'The customs houses now answer to a single office. Moscow reads the decree with interest; the City reads it with alarm.',
      descriptionZh: '海关如今只对一个衙门负责。莫斯科饶有兴致地读了这道法令，伦敦城则读出了警讯。',
    }
  ]
};
