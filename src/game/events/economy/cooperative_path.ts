import type { GameEvent } from '../../types';
import { activateJournal } from '../../rules/journalEvents';
import { isJournalCompleted } from '../../rules/economyReforms';

/**
 * 自治合作社路线的开始事件（docs/经济改造方案.md §5.3）。
 *
 * 两个入口：霍安·佩罗的「推动合作社方案」推满 2 次时由顾问行动直接推入，或事件板普通调度
 * （下面的 `condition`）。顾问通道不受 `condition` 限制——顾问已经把合作推到了 2 次，
 * 此时必须无条件给出事件。
 */
export const economyCooperativePath: GameEvent = {
  id: 'economy_cooperative_path',
  meta: { category: 'cnt', flow: 'solo', series: ['economy'], tags: ['journal'] },
  condition: (state) => (
    !isJournalCompleted(state, 'journal_land_collectivization')
    && state.agricultural_cooperative >= 1
    && state.land_redemption >= 1
  ),
  title: 'The Cooperative Road',
  titleZh: '合作社之路',
  description: 'In the villages where the estates were bought rather than seized, something quieter has taken root: purchasing societies, credit unions, shared threshing machines, a cooperative that sells the olive crop without a middleman. The smallholders who would shoot at a requisition party will sign their names to a balance sheet. The National Committee is asked whether this road should be the confederation\'s official answer to the agrarian question — slower, duller, and much harder to shoot.',
  descriptionZh: '在那些"买下"而不是"没收"庄园的村子里，有另一种东西悄悄扎了根：采购社、信用合作社、共用的脱粒机、绕过中间商卖橄榄的合作社。会朝征发队开枪的自耕农，愿意在一张资产负债表上签名。全国委员会被问到：这条路要不要成为联合会对农业问题的正式回答——更慢、更乏味，也远远更难被子弹解决。',
  options: [
    {
      text: 'Make the cooperative road official. Organize, do not expropriate.',
      textZh: '把合作社路线变成正式路线。组织，而不是没收。',
      effect: (state) => ({
        ...activateJournal(state, 'journal_economy_cooperative')
      })
    }
  ]
};
