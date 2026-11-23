import type { GameState, JournalEntryDef } from '../types';
import { isOrganizationEstablished } from '../organizations';

/**
 * PRRevS 的建党筹备日志。
 *
 * 现行链路原本是“三十人宣言静观 → 佩斯塔尼亚反复筹备 → formation_of_prrevs
 * 事件成立组织”，中间所有条件（官僚化、三十人集团影响、建设等级、参政）
 * 只散落在顾问行动和事件 condition 里，玩家看不到距离建党还差什么。
 *
 * 本日志把这段准备过程变成一个可见目标：
 *   开始事件 = `manifesto_of_the_thirty` 的「静观其变」选项；
 *   月度推进 = `prepare_the_party` 提升 `prrevsConstructionLevel`；
 *   完成     = `formation_of_prrevs` 的「成立 PRRevS」选项写入组织后，
 *              下一次月结看到 `isOrganizationEstablished('PRRevS')` 即完成。
 *
 * 日志不直接创建组织，也不重复发放 `formation_of_prrevs` 的一次性效果：
 * 成立决定仍然由那个事件做出，日志只负责跟踪和解释条件。
 */
export const PRREVS_JOURNAL_ID = 'journal_prrevs';

const finite = (value: number | undefined): number =>
  Number.isFinite(value) ? Number(value) : 0;

/** 0—1 的比例，用于把多个条件压成一条进度条。 */
const ratio = (value: number | undefined, target: number): number => {
  const current = finite(value);
  if (target <= 0) return 1;
  return Math.max(0, Math.min(1, current / target));
};

const hasPestana = (state: GameState): boolean =>
  (state.activeAdvisors ?? []).some(advisor => advisor?.id === 'Ángel Pestaña');

export const prrevsJournal: JournalEntryDef = {
  id: PRREVS_JOURNAL_ID,
  title: 'The Party Question',
  titleZh: '建党问题',
  description: 'Ángel Pestaña and the Thirty have forced the question the CNT has avoided since 1911: can an anarcho-syndicalist movement enter elections without becoming a party like the others? The moderates are building a Republican Revolutionary Syndicalist Party in the shadows. If the confederation crosses the Rubicon, it gains a parliamentary voice — and risks the wrath of the purists.',
  descriptionZh: '安赫尔·佩斯塔尼亚与三十人集团逼出了 CNT 自 1911 年以来一直回避的问题：一个无政府工团主义运动，能否在不变成又一个政党的情况下进入选举？温和派正在暗处筹建革命共和工团党。如果联合会跨过卢比孔河，它将获得议会中的声音——也要承担纯粹派的怒火。',

  successCondition: 'Keep Pestaña in the confederation, bring the CNT into government, raise bureaucratization to 50, push Treintistas influence above 60, and complete four levels of party preparation. The founding congress can then be convened.',
  successConditionZh: '让佩斯塔尼亚留在联合会、让 CNT 参政、把官僚化提升到 50、把三十人集团影响推过 60，并完成 4 级建党筹备。之后即可召开成立大会。',
  successEffectDesc: 'The PRRevS is founded: the CNT gains an electoral wing, and the road to the Jabalí and the Ramón Franco campaign opens.',
  successEffectDescZh: 'PRRevS 成立：CNT 获得选举臂膀，通往野猪派与拉蒙·佛朗哥竞选的道路随之打开。',

  failureCondition: 'The Thirty are expelled, or the party project is abandoned permanently.',
  failureConditionZh: '三十人集团被驱逐，或建党计划被永久放弃。',
  failureEffectDesc: 'The PRRevS can never be founded in this run.',
  failureEffectDescZh: '本局中 PRRevS 永远无法成立。',

  hasProgress: true,
  progressMax: 100,

  getProgress: (state) => {
    // 路线已经关闭时进度归零，避免失败后仍显示“100% 待成立”。
    if (state.treintistasLeft || state.prrevsAbandoned) return 0;
    return Math.round(100 * Math.min(
      hasPestana(state) ? 1 : 0,
      state.cntStance === 'govern' ? 1 : 0,
      ratio(state.stats?.bureaucratization, 50),
      ratio(state.factions?.Treintistas?.influence, 61),
      ratio(state.prrevsConstructionLevel, 4),
    ));
  },

  goalLinesTitle: 'PARTY CONDITIONS · ITEMIZED CHECK',
  goalLinesTitleZh: '建党条件 · 逐项核验',

  getGoalLines: (state) => {
    const pestana = hasPestana(state);
    const influence = finite(state.factions?.Treintistas?.influence);
    const bureaucratization = finite(state.stats?.bureaucratization);
    const construction = finite(state.prrevsConstructionLevel);
    const stanceZh = state.cntStance === 'govern' ? '参政' : state.cntStance === 'cooperate' ? '合作' : '反对';
    return [
      {
        text: 'Pestaña remains an advisor',
        textZh: '佩斯塔尼亚仍在顾问任上',
        met: pestana, kind: 'check',
        group: 'Political prerequisites', groupZh: '政治前提',
      },
      {
        text: `The CNT is in government${state.cntStance === 'govern' ? '' : ` (currently ${state.cntStance})`}`,
        textZh: `CNT 已参政${state.cntStance === 'govern' ? '' : `（当前：${stanceZh}）`}`,
        met: state.cntStance === 'govern', kind: 'check',
        group: 'Political prerequisites', groupZh: '政治前提',
      },
      {
        text: 'Bureaucratization',
        textZh: '官僚化',
        met: bureaucratization >= 50,
        current: bureaucratization, target: 50, kind: 'bar',
        group: 'Party preparation', groupZh: '建党筹备',
      },
      {
        text: 'Treintistas influence (must exceed 60)',
        textZh: '三十人集团影响（须超过 60）',
        met: influence > 60,
        current: influence, target: 61, kind: 'bar',
        group: 'Party preparation', groupZh: '建党筹备',
      },
      {
        text: 'Party preparation level',
        textZh: '建党筹备等级',
        met: construction >= 4,
        current: construction, target: 4, kind: 'bar',
        group: 'Party preparation', groupZh: '建党筹备',
      },
    ];
  },

  checkStatus: (state, entryState) => {
    if (entryState.status !== 'active') return null;
    // 成立决定由 formation_of_prrevs 做出；这里只读取结果。
    if (isOrganizationEstablished(state, 'PRRevS')) return 'completed';
    // 驱逐三十人集团或永久放弃建党都会关死这条路线。
    if (state.treintistasLeft || state.prrevsAbandoned) return 'failed';
    return null;
  },

  activeEffect: {
    description: 'The party project is being prepared. Pestaña’s “Prepare the Party” action raises the construction level. When every condition is met the founding congress appears; deferring it only postpones the decision, while abandoning it closes the route.',
    descriptionZh: '建党筹备正在进行。佩斯塔尼亚的「筹备政党」行动提升建设等级。所有条件满足后会出现成立大会；暂缓只是推迟决定，永久放弃则会关死这条路线。',
  },
};
