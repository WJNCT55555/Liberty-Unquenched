import type { GameState, JournalEntryDef } from '../types';
import { adjustFactionDissent, adjustFactionInfluence } from '../utils';
import { isJournalCompleted } from '../rules/economyReforms';

/**
 * 革命军事化路线（docs/经济改造方案.md §5.6）。
 *
 * 与战时统筹路线由同一个事件选项同时开启；对方先完成即本日志失败。
 */
export const economyRevolutionaryWarJournal: JournalEntryDef = {
  id: 'journal_economy_revolutionary_war',
  title: 'Revolutionary Militarization',
  titleZh: '革命军事化路线',
  description: 'The other answer to the same question. Do not negotiate with the market at all: convert the workshops to war output, put the committees under operational discipline, and let the front set the priorities. The militia that made the revolution becomes the industry that defends it — and the men who ran the collectives learn to take orders again.',
  descriptionZh: '对同一个问题的另一个回答。根本不和市场谈判：把作坊转产军需、让委员会服从作战纪律、由前线决定优先级。发动革命的那个民兵，变成了保卫革命的工业——而经营集体的人们重新学会了服从命令。',
  successCondition: 'Family ration books issued, emergency war industry conversion complete, and foreign capital seized',
  successConditionZh: '家庭口粮本已发行、军工紧急转产改组完成、外资已没收',
  successEffectDesc: 'Everything for the front: the FAI falls in behind the general staff and the Communists\' confidence in the CNT rises.',
  successEffectDescZh: '一切为了前线：FAI 站到总参谋部身后，共产党对 CNT 的信任上升。',
  failureCondition: 'The coordination route completes first',
  failureConditionZh: '战时统筹路线先完成',
  failureEffectDesc: 'The militarized boards yield direct control of production to the union committees.',
  failureEffectDescZh: '军事化生产委员会把生产的直接支配权让给了工会委员会。',
  hasProgress: true,
  progressMax: 100,
  getProgress: (state) => Math.min(
    (state.family_rationing / 1) * 100,
    (state.war_industry_conversion / 3) * 100,
    (state.foreign_capital_seizure / 3) * 100,
  ),

  activationEventId: 'economy_wartime_route_choice',
  completionEventId: 'economy_revolutionary_war_victory',
  failureEventId: 'economy_revolutionary_war_conceded',

  checkStatus: (state, entryState) => {
    if (entryState.status !== 'active') return null;
    if (isJournalCompleted(state, 'journal_economy_war_effort')) return 'failed';
    if (
      state.family_rationing >= 1
      && state.war_industry_conversion >= 3
      && state.foreign_capital_seizure >= 3
    ) {
      return 'completed';
    }
    return null;
  },

  onComplete: (state: GameState) => ({
    stats: {
      ...state.stats,
      republicanAuthority: Math.max(0, state.stats.republicanAuthority - 5),
    },
    factions: adjustFactionInfluence(state.factions, 'Faistas', 6),
  }),

  onFail: () => ({}),

  activeEffect: {
    description: 'The militarized boards keep the front supplied, the FAI quiet and the Communists friendly — and the Republic\'s civilian authority thinner every month.',
    descriptionZh: '军事化生产委员会保证了前线供给、FAI 的沉默与共产党的友好——代价是共和国的文官权威逐月变薄。',
    apply: (state) => ({
      stats: {
        ...state.stats,
        republicanAuthority: Math.max(0, state.stats.republicanAuthority - 0.4),
      },
      factions: adjustFactionDissent(state.factions, 'Faistas', -0.5),
      partyRelations: {
        ...state.partyRelations,
        PCE: Math.min(100, (state.partyRelations?.PCE ?? 0) + 1),
      },
    }),
  },
};
