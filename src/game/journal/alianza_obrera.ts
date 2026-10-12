import type { GameState, JournalEntryDef } from '../types';
import { getRightShare, getUnionShare } from '../unions';

/**
 * 工人联盟日志是否已经开启（`active`）。
 *
 * 顾问的「推动工人联盟」以此为解锁条件：日志未开启时进度条不渲染，此时开放该行动
 * 会让进度被静默记录，玩家会在日志开启的当月看到联盟「凭空成立」。
 */
export const isAlianzaObreraJournalActive = (state: Pick<GameState, 'journal'>): boolean =>
  state.journal?.['journal_alianza_obrera']?.status === 'active';

export const alianzaObreraJournal: JournalEntryDef = {
  id: 'journal_alianza_obrera',
  title: 'Alianza Obrera',
  titleZh: '工人联盟 (Alianza Obrera)',
  description: 'The Workers\' Alliance is the ultimate goal for the revolutionary factions. By combining PSOE and CNT forces, the working class can build a formidable revolutionary power capable of challenging the old order.',
  descriptionZh: '工人联盟是革命派的终极目标。通过将 PSOE 和 CNT 的力量结合起来，工人阶级可以建立起一股强大的革命力量，足以挑战旧秩序。',
  successCondition: 'Relations with the PSOE reach 80, relations with the PCE reach 60, the Workers\' Alliance advances 3 times (the "Promote Workers\' Alliance" advisor action, unlocked once this journal is open), the CNT holds at least 18% of the union movement, CNT+UGT together at least 35%, and the right-wing unions no more than 12%.',
  successConditionZh: '与 PSOE 的关系达到 80、与 PCE 的关系达到 60、工人联盟推进 3 次（奥罗本或布兰科的「推动工人联盟」顾问行动，需先开启本日志）、CNT 工会占比达到 18%、CNT+UGT 合计达到 35%，且右翼工会不超过 12%。',
  successEffectDesc: 'Queues the Workers\' Alliance formation event (the coalition is created by that event\'s option)',
  successEffectDescZh: '排队「工人联盟宣告成立」事件（联盟由该事件的选项成立）',
  failureCondition: 'The PSOE joins the Republican-Socialist Coalition or the Popular Front',
  failureConditionZh: 'PSOE 加入共和—社会党联盟或人民阵线',
  failureEffectDesc: 'Opportunity lost',
  failureEffectDescZh: '错失良机',
  hasProgress: true,
  progressMax: 3,
  getProgress: (state) => state.workersAllianceProgress || 0,

  /**
   * 事件—日志—事件契约（设计文档 §6.1）：
   *   开始事件 = 「十字路口：无产阶级起义还是反法西斯同盟？」的**选项 A**，
   *   它调用 `activateJournal()` 把本日志置为 active；
   *   结果事件 = `workers_alliance_formation`，完成时由月结管线自动排队。
   */
  activationEventId: 'crossroads_uprising_alliance',
  completionEventId: 'workers_alliance_formation',

  checkStatus: (state, entryState) => {
    // 激活不属于 checkStatus：未开启或已终局时不做任何判定。
    if (entryState.status !== 'active') return null;

    // Fail if PSOE enters a political coalition (Republican-Socialist Coalition or Popular Front)
    const psoeCoalition = state.activeCoalitions.find(c => c.activeId === 'republican_socialist' || c.activeId === 'popular_front');
    if (psoeCoalition) return 'failed';

    const psoeRel = state.partyRelations?.PSOE ?? 0;
    const pceRel = state.partyRelations?.PCE ?? 0;
    const actionCount = state.workersAllianceProgress || 0;
    const share = getUnionShare(state);

    // 工人联盟是 CNT–PSOE–PCE 等左翼工人阶级政党的大联盟（UHP 只是 CNT–UGT 的两家联盟），
    // 所以除社会党关系外还要求共产党关系达标：左翼要够强（CNT 主导 + CNT/UGT 合计够大），
    // 右翼掣肘要够弱。
    if (
      psoeRel >= 80
      && pceRel >= 60
      && actionCount >= 3
      && share.CNT >= 18
      && share.CNT + share.UGT >= 35
      && getRightShare(share) <= 12
    ) {
      return 'completed';
    }

    return null;
  },

  onFail: () => ({})
};
