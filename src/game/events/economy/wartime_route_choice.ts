import type { GameEvent, GameState } from '../../types';
import { adjustFactionDissents } from '../../utils';
import { activateJournal } from '../../rules/journalEvents';
import { isWartimeEconomyRouteDue } from '../../rules/wartimeEconomy';

/**
 * 战时经济路线抉择（docs/经济改造方案.md §7.3）。
 *
 * **只有一个选项**，它同时激活两条战时经济日志；此后谁先完成谁把对方判为失败
 * （`journal_economy_war_effort` / `journal_economy_revolutionary_war` 的 checkStatus）。
 *
 * 这样设计在叙事上说得通：1936 年 7 月之后，加泰罗尼亚的工厂由委员会管理、阿拉贡的村庄
 * 集体化、马德里还在按共和国法律征税。事件问的不是"选哪条路"（现实中两条路同时长出来），
 * 而是这种自发状态要不要被正式组织起来。
 */
export const economyWartimeRouteChoice: GameEvent = {
  id: 'economy_wartime_route_choice',
  meta: { category: 'war', flow: 'solo', series: ['economy', 'civil_war'], tags: ['journal'] },
  condition: isWartimeEconomyRouteDue,
  title: 'How Shall the War Economy Be Run?',
  titleZh: '战时经济应当如何组织？',
  description: 'July has already divided the economy without anyone deciding to divide it: the workshops of Catalonia answer to committees, the villages of Aragon have collectivized, and Madrid still collects taxes under the Republic\'s law. Two bodies have grown up side by side in that gap — the unions\' distribution committees, and the militarized production boards improvised around the front. Both exist. Both are asking for recognition. The National Committee can leave this to sort itself out, or it can put both on a formal footing and let the war decide which one absorbs the other.',
  descriptionZh: '七月已经在没有人决定的情况下把经济分开了：加泰罗尼亚的车间听命于委员会，阿拉贡的村庄已经集体化，而马德里仍在按共和国法律征税。在那道缝隙里并排长出了两套机构——工会的分配委员会，以及围着前线临时搭起来的军事化生产委员会。两套都已经存在，也都在要求承认。全国委员会可以放任它们自行其是，也可以把两套都正式立起来，让战争决定谁吞并谁。',
  options: [
    {
      text: 'Organize the war economy: unions take distribution, the front takes production.',
      textZh: '把战时经济组织起来：工会管分配，前线管生产',
      subtitle: 'Both the coordination committees and the militarized production boards are set up at once. The first to deliver absorbs the other.',
      subtitleZh: '统筹委员会与军事化生产委员会同时成立。谁先做出成绩，谁就吞并另一方。',
      effect: (state: GameState) => {
        // `activateJournal()` 返回的是携带**整份** journal 的补丁，所以两次激活必须串行：
        // 先把第一条写进 state，再在结果上激活第二条；否则后一次 spread 会覆盖前一次
        //（两份补丁里的 journal 是各自独立克隆的）。
        const coordination = activateJournal(state, 'journal_economy_war_effort');
        const withCoordination = { ...state, ...coordination } as GameState;
        return {
          factions: adjustFactionDissents(state.factions, { Faistas: -2, Puristas: 2 }),
          ...coordination,
          ...activateJournal(withCoordination, 'journal_economy_revolutionary_war')
        };
      }
    }
  ]
};
