import type { GameState, JournalEntryDef } from '../types';
import { adjustFactionInfluence } from '../utils';
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
  successCondition: 'Family ration books x1, emergency war industry conversion x3, and foreign capital seized x3.',
  successConditionZh: '家庭口粮本配给 1 次、军工紧急转产改组推进 3 次、外资没收推进 3 次。',
  successEffectDesc: 'Everything for the front: the FAI falls in behind the general staff and the Communists\' confidence in the CNT rises.',
  successEffectDescZh: '一切为了前线：FAI 站到总参谋部身后，共产党对 CNT 的信任上升。',
  failureCondition: 'The War Effort route completes first (the two wartime routes exclude each other)',
  failureConditionZh: '「战时统筹」路线先完成（战时两条路线互斥）',
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

  // 经济路线日志**不提供月度效果**（用户定稿）。
};
