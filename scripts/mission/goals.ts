import type { GameState } from '../../src/game/types';
import { getJournalEntryDef } from '../../src/game/journal';
import { evaluateAchievements } from '../../src/game/achievementConditions';
import { CARD_REGISTRY } from '../../src/game/registries/cardRegistry';
import { ECONOMY_ROUTE_JOURNAL_IDS, ECONOMY_COUNTERS, type EconomyCounter } from '../../src/game/rules/economyReforms';
import {
  getControlShares,
  getSocializedShare,
  getStateShare,
  getWorkersShare,
} from '../../src/game/rules/controlShares';
import type { GoalGap, MissionGapLine, MissionGoal, MissionSpec } from './types';
/**
 * 目标判定 + 缺口报告。
 *
 * `goalProgress` 把每个目标压成 0—1，供策略层打分；`goalGaps` 在失败/超时时
 * 说明"差在哪"——这是任务脚本比普通测试有用的地方：它不只说 false，
 * 还说"集体 63%（差 2）、废除货币 2/3、铁路 1/3"。
 */

const clamp01 = (value: number): number => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

export const getCounterValue = (state: GameState, key: string): number =>
  Number((state as unknown as Record<string, unknown>)[key] ?? 0) || 0;

const monthLabel = (state: GameState): string => `${state.year}-${String(state.month).padStart(2, '0')}`;

/** 成就的部分进度：只给"能线性读出来"的那几个；其余未达成即 0。 */
const achievementPartial = (id: string, state: GameState): number => {
  switch (id) {
    case 'A_MONEY_ENDS':
      return 0.5 * clamp01(getCounterValue(state, 'currency_abolition') / 3)
        + 0.5 * (state.currency_abolished_declared ? 1 : 0);
    case 'A_RICH':
      return clamp01(state.armaments / 50);
    case 'A_BARRICADES':
      return clamp01((state.armedForces.entityPools.cnt_defense_committees.manpower ?? 0) / 100000);
    case 'A_THEOLOGY':
      return clamp01(state.classes.Clero.support.CNT_FAI / 40);
    default:
      return 0;
  }
};

export const goalProgress = (goal: MissionGoal, state: GameState): number => {
  switch (goal.kind) {
    case 'journal': {
      const entry = state.journal?.[goal.id];
      if (entry?.status === 'completed') return 1;
      if (entry?.status === 'failed') return 0;
      const def = getJournalEntryDef(goal.id);
      const max = def?.progressMax ?? 100;
      // 日志还没开启时也读一次 getProgress：像「土地集体化」的进度直接是饼上的
      // 集体份额，与日志是否开启无关；而六条路线日志在未激活时返回 null（记 0）。
      // 这样策略层才能在"还没开门"的时候就知道该往哪个方向推。
      const probeEntry = entry ?? { id: goal.id, status: 'inactive' as const, progress: 0 };
      const progress = def?.getProgress ? Number(def.getProgress(state, probeEntry)) || 0 : 0;
      return clamp01(progress / (max || 100));
    }
    case 'achievement':
      return evaluateAchievements(state).includes(goal.id) ? 1 : achievementPartial(goal.id, state);
    case 'ending':
      return state.ending === goal.id ? 1 : 0;
    case 'counter':
      return clamp01(getCounterValue(state, goal.id) / (goal.atLeast ?? 1));
    case 'flag':
      return goal.test?.(state) ? 1 : 0;
    default:
      return 0;
  }
};

export const goalSatisfied = (goal: MissionGoal, state: GameState): boolean => {
  switch (goal.kind) {
    case 'journal':
      return state.journal?.[goal.id]?.status === 'completed';
    case 'achievement':
      return evaluateAchievements(state).includes(goal.id);
    case 'ending':
      return state.ending === goal.id;
    case 'counter':
      return getCounterValue(state, goal.id) >= (goal.atLeast ?? 1);
    case 'flag':
      return Boolean(goal.test?.(state));
    default:
      return false;
  }
};

export const allGoalsSatisfied = (spec: MissionSpec, state: GameState): boolean =>
  spec.goals.every(goal => goalSatisfied(goal, state));

/**
 * 目标总分（0—1 的平均） + 里程碑分（权重较低）。
 *
 * 里程碑只引导搜索：长链条目标（入阁 → 部委 → 建党 → 国有化 → 日志）如果只看终点，
 * 贪心策略在第一步就没有梯度可用。
 */
export const MILESTONE_WEIGHT = 0.35;

export const missionScore = (spec: MissionSpec, state: GameState): number => {
  const goalPart = spec.goals.length === 0
    ? 0
    : spec.goals.reduce((sum, goal) => sum + goalProgress(goal, state), 0) / spec.goals.length;
  const milestones = spec.milestones ?? [];
  const milestoneWeight = milestones.reduce((sum, goal) => sum + (goal.weight ?? 1), 0);
  const milestonePart = milestoneWeight === 0
    ? 0
    : milestones.reduce((sum, goal) => sum + goalProgress(goal, state) * (goal.weight ?? 1), 0) / milestoneWeight;
  // 轻微惩罚：已经输掉战争/游戏结束时，别把"继续刷计数器"当成进展。
  const dead = state.isGameOver ? 0.001 : 0;
  return goalPart + MILESTONE_WEIGHT * milestonePart - dead;
};

export const goalLabel = (goal: MissionGoal, isZh: boolean): string => {
  if (goal.kind === 'flag') return isZh ? (goal.labelZh ?? goal.label ?? goal.id) : (goal.label ?? goal.id);
  if (goal.kind === 'counter') return `${goal.id} >= ${goal.atLeast ?? 1}`;
  return `${goal.kind}:${goal.id}`;
};

const formatShareReadings = (state: GameState): MissionGapLine[] => {
  const land = getControlShares(state).land;
  const industry = getControlShares(state).industry;
  return [
    { label: 'Land workers / socialized / state', labelZh: '土地 劳动者／社会化／国有', value: `${getWorkersShare(state, 'land')}% / ${getSocializedShare(state, 'land')}% / ${getStateShare(state, 'land')}%` },
    { label: 'Industry workers / socialized / state', labelZh: '工业 劳动者／社会化／国有', value: `${getWorkersShare(state, 'industry')}% / ${getSocializedShare(state, 'industry')}% / ${getStateShare(state, 'industry')}%` },
    { label: 'Collective share (land)', labelZh: '土地集体份额', value: `${land.collective}%` },
    { label: 'Local union share (industry)', labelZh: '工业地方工会份额', value: `${industry.union}%` },
  ];
};

const countersForJournal = (journalId: string): EconomyCounter[] => {
  switch (journalId) {
    case 'journal_economy_syndicalist':
      return ['rail_nationalization', 'coal_nationalization'];
    case 'journal_economy_free_commune':
      return ['currency_abolition', 'rail_nationalization', 'coal_nationalization'];
    case 'journal_economy_cooperative':
      return ['agricultural_cooperative', 'mutual_credit_network', 'industrial_cooperative'];
    case 'journal_economy_organic':
      return ['currency_abolition', 'private_bank_seizure', 'credit_exchange_committee', 'foreign_capital_seizure', 'supply_coordination_network'];
    case 'journal_economy_war_effort':
      return ['private_bank_seizure', 'wartime_requisition', 'family_rationing', 'wartime_trade_monopoly'];
    case 'journal_economy_revolutionary_war':
      return ['family_rationing', 'war_industry_conversion', 'foreign_capital_seizure'];
    case 'journal_land_collectivization':
      return ['land_forced_collectivization', 'land_voluntary_collectivization'];
    default:
      return [];
  }
};

/**
 * "本来能推进目标、但条件不满足"的手段。
 *
 * 这是任务脚本最有用的一块输出：超时的时候，它回答的不是"没做成"，而是
 * "废除货币那张卡要求 CNT 掌握财政部，而你现在没掌握"。做法是机械的：
 * 把每张卡的 effect 空跑一次，看它是否真的会推进目标关心的计数器，
 * 再看它的 condition 为什么为假。
 */
export const blockedActions = (goals: MissionGoal[], state: GameState): MissionGapLine[] => {
  const wanted = new Set<string>();
  goals.forEach((goal) => {
    if (goal.kind === 'counter') wanted.add(goal.id);
    if (goal.kind === 'achievement') {
      countersForAchievement(goal.id).forEach(counter => wanted.add(counter));
    }
    if (goal.kind === 'journal') countersForJournal(goal.id).forEach(counter => wanted.add(counter));
  });
  if (wanted.size === 0) return [];

  const lines: MissionGapLine[] = [];
  /** 空跑一次效果，看它（或它打开的事件选项）是否会推进目标计数器。 */
  const touchesWanted = (run: () => Partial<GameState>): boolean => {
    let patch: Partial<GameState>;
    try {
      patch = run();
    } catch {
      return false;
    }
    const deltas: Array<Partial<GameState>> = [patch];
    // 计数器的增加几乎都写在**事件选项**里（卡本身只是排队一个事件），
    // 所以要把选项也空跑一遍，否则永远查不出"这张卡本来能推进目标"。
    const event = patch.currentEvent;
    if (event?.options) {
      event.options.forEach((option) => {
        if (option.condition && !option.condition(state)) return;
        try {
          deltas.push(option.effect(state));
        } catch {
          /* 预览失败就当它不推进 */
        }
      });
    }
    return deltas.some(payload => Array.from(wanted).some((counter) => {
      const after = Number((payload as unknown as Record<string, unknown>)[counter] ?? 0);
      return after > getCounterValue(state, counter);
    }));
  };

  CARD_REGISTRY.forEach((card) => {
    if (card.condition && card.condition(state)) return; // 可用就不算"受阻"
    if (!touchesWanted(() => card.effect(state))) return;
    lines.push({
      label: `card ${card.id}`,
      labelZh: `卡牌 ${card.id}`,
      value: '本可推进目标，但打不出来（condition 未满足）',
    });
  });

  (state.activeAdvisors || []).forEach((advisor) => {
    if (!advisor) return;
    advisor.actions.forEach((action) => {
      if (action.condition(state)) return;
      if (!touchesWanted(() => action.effect(state))) return;
      lines.push({
        label: `advisor ${advisor.id}:${action.id}`,
        labelZh: `顾问行动 ${advisor.id}:${action.id}`,
        value: '本可推进目标，但条件未满足',
      });
    });
  });

  return lines;
};

const countersForAchievement = (id: string): string[] => {
  switch (id) {
    case 'A_MONEY_ENDS':
      return ['currency_abolition'];
    default:
      return [];
  }
};

/** 任何任务都会打印的"局面读数"：报告里先说清现在是什么时候、什么状态。 */
const situationLines = (state: GameState): MissionGapLine[] => [
  { label: 'date / phase', labelZh: '日期 / 阶段', value: `${monthLabel(state)} · ${state.phase}` },
  { label: 'civil war / war', labelZh: '内战 / 战争', value: `${state.civilWarStatus}${state.activeWar ? ' · activeWar' : ''}` },
  { label: 'ending / game over', labelZh: '结局 / 游戏结束', value: `${state.ending ?? '(none)'} · ${state.isGameOver ? 'yes' : 'no'}` },
  { label: 'resources / armaments', labelZh: '资源 / 军备', value: `${state.resources} / ${state.armaments}` },
];

export const goalGaps = (spec: MissionSpec, state: GameState): GoalGap[] =>
  (spec.goals ?? []).map((goal) => gapFor(goal, state));

/** 里程碑的达成情况（同样的缺口格式，报告里单独一节）。 */
export const milestoneGaps = (spec: MissionSpec, state: GameState): GoalGap[] =>
  (spec.milestones ?? []).map((goal) => gapFor(goal, state));

const gapFor = (goal: MissionGoal, state: GameState): GoalGap => {
  {
    const satisfied = goalSatisfied(goal, state);
    const lines: MissionGapLine[] = [];

    if (goal.kind === 'journal') {
      const entry = state.journal?.[goal.id];
      const def = getJournalEntryDef(goal.id);
      const max = def?.progressMax ?? 100;
      const progress = def?.getProgress && entry ? Number(def.getProgress(state, entry)) || 0 : 0;
      lines.push({
        label: 'status / progress',
        labelZh: '状态 / 进度',
        value: `${entry?.status ?? 'missing'} · ${progress}/${max}`,
      });
      if (ECONOMY_ROUTE_JOURNAL_IDS.includes(goal.id) || goal.id === 'journal_land_collectivization') {
        lines.push(...formatShareReadings(state));
      }
      countersForJournal(goal.id).forEach((counter) => {
        lines.push({
          label: counter,
          labelZh: counter,
          value: `${getCounterValue(state, counter)}`,
        });
      });
      if (goal.id === 'journal_economy_syndicalist' || goal.id === 'journal_economy_free_commune') {
        lines.push({ label: 'PRRevS founded', labelZh: 'PRRevS 已成立', value: state.organizations?.PRRevS?.established ? 'yes' : 'no' });
      }
    } else if (goal.kind === 'achievement') {
      lines.push({ label: 'achievement', labelZh: '成就', value: satisfied ? 'satisfied' : `partial ${(achievementPartial(goal.id, state) * 100).toFixed(0)}%` });
      if (goal.id === 'A_MONEY_ENDS') {
        lines.push({ label: 'currency_abolition', labelZh: '废除货币', value: `${getCounterValue(state, 'currency_abolition')}/3` });
        lines.push({ label: 'declared', labelZh: '已宣布作废', value: state.currency_abolished_declared ? 'yes' : 'no' });
      }
    } else if (goal.kind === 'counter') {
      lines.push({ label: goal.id, labelZh: goal.id, value: `${getCounterValue(state, goal.id)}/${goal.atLeast ?? 1}` });
    } else if (goal.kind === 'ending') {
      lines.push({ label: 'current ending', labelZh: '当前结局', value: state.ending ?? '(none)' });
      lines.push({ label: 'war status', labelZh: '战争状态', value: `${state.civilWarStatus}${state.activeWar ? ' (activeWar)' : ''}` });
      lines.push({ label: 'date', labelZh: '日期', value: monthLabel(state) });
    } else {
      lines.push({ label: goal.label ?? goal.id, labelZh: goal.labelZh ?? goal.id, value: satisfied ? 'yes' : 'no' });
    }

    lines.push(...situationLines(state));
    if (!satisfied) lines.push(...blockedActions([goal], state));
    return { goal, satisfied, lines };
  }
};

export { ECONOMY_COUNTERS };
