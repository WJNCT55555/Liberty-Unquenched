import type { GameEvent } from '../types';
import { activateJournal } from '../rules/journalEvents';

const uhpAsturiasMeta = {
  category: 'politics' as const,
  flow: 'solo' as const,
  series: ['asturias', 'uhp'],
  tags: ['journal'],
};

export const workersAllianceAttempt: GameEvent = {
  id: 'workers_alliance_attempt',
  meta: uhpAsturiasMeta,
  condition: (state) => {
    if (state.uhp_attempt_triggered) return false;

    // 触发点不是日期，而是"激进-CEDA 联盟执政"这一历史政府状态（1933·11 上台）。
    // 人民阵线执政意味着 CNT 已走议会合作路线，不再有 UHP 的空间
    //（`ceda_radical` 与 `popular_front` 互斥，这一条是显式保险）。
    const isCedaRadicalGovernment = state.rulingCoalition === 'ceda_radical';
    const isNotPopularFront = state.rulingCoalition !== 'popular_front';

    // CNT 必须仍在反对派立场：UHP 是反对派路线，不是参政路线。
    return isCedaRadicalGovernment && isNotPopularFront && state.cntStance === 'oppose';
  },
  title: 'An Attempt at Workers\' Alliance?',
  titleZh: '工人联盟的尝试？',
  description: 'With the CEDA and the Radicals now in office and the CNT pushed back into opposition, the working class stands at a crucial crossroads. Prominent theoreticians argue that only a coordinated revolutionary alliance can secure the future of the proletariat. Shall we begin the attempt to unify our revolutionary forces with the socialist left under the banner of "Uníos Hermanos Proletarios"?',
  descriptionZh: '随着 CEDA 与激进党上台执政、全国劳工联盟（CNT）被推回反对派地位，工人阶级站在了一个关键的十字路口。杰出的理论家们主张，只有进行协调一致的革命联盟才能捍卫无产阶级的未来。我们是否应当在“联合无产阶级兄弟”（UHP）的旗帜下，开始尝试将我们的革命力量与社会主义左翼联合起来？',
  options: [
    {
      text: 'Initiate the attempt for workers\' unity. Uníos Hermanos Proletarios!',
      textZh: '启动工人团结的尝试。联合无产阶级兄弟！',
      effect: (state) => ({
        uhp_attempt_triggered: true,
        // 开始事件是日志激活的唯一入口（见 JournalEntryDef.activationEventId）。
        ...activateJournal(state, 'journal_uhp')
      })
    }
  ]
};
