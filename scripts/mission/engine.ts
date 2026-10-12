import type { Card, GameEvent, GameState } from '../../src/game/types';
import { gameReducer } from '../../src/game/reducers/gameReducer';
import { createScenarioState } from '../../src/game/scenarios';
import { CARD_REGISTRY } from '../../src/game/registries/cardRegistry';
import { getJournalEntryDef } from '../../src/game/journal';
import { createSeededRng, getRng, setRng } from '../../src/game/rules/rng';
import { allGoalsSatisfied, goalGaps, goalSatisfied, milestoneGaps, missionScore } from './goals';
import type { MissionResult, MissionSpec, ScriptStep, TraceEntry } from './types';

/**
 * Mission Runner 的执行层。
 *
 * 设计要点（都是被游戏本身的机制逼出来的）：
 *  1. **不靠抽牌**：直接 `PLAY_CARD` 指定卡（reducer 并不要求卡在手牌里），
 *     路线完全由策略决定；随机源另外用 seed 固定（`rules/rng.ts`）。
 *  2. **事件必须先清空才能进月结**：`advancePhase` 在有待处理事件时不推进，
 *     所以每一步之后都要把 `currentEvent` / `pendingEvents` 解决干净。
 *  3. **阶段图不写死**：和平期是 action →（月结）event → action，战时要多走
 *     action → war →（结束地图回合）event → action。因此循环推进到"下一个可行动的
 *     action 阶段"，而不是假设每月固定走几步。
 */

export interface Candidate {
  /** `card:<id>` 或 `advisor:<顾问id>:<行动id>` */
  key: string;
  label: string;
  kind: 'card' | 'advisor';
  apply: (state: GameState) => GameState;
}

export interface EngineOptions {
  /** 选项选择器：script 策略用它钉住某个选项；不传则按目标打分。 */
  pickOption?: (state: GameState, event: GameEvent) => number;
  maxEventsPerStep?: number;
  /** 观察者：超级事件被点掉时回调，好让轨迹里留下记录（例如 1936·7 的内战爆发）。 */
  onSuperEvent?: (state: GameState, id: string) => void;
  /**
   * 观察者：**自定义界面事件**（`options: []` + `renderContent`，例如部长分配、
   * 第三次代表大会的强制失业决议）被放弃时回调。
   *
   * 这类事件没有可枚举的选项，通用策略无法替玩家选；任务可以用 `customResolutions`
   * 给出结算补丁。没给补丁时必须让它**过期**——不能留着它：`endMonth` 的推进循环会
   * 反复走 event → action → 下一个月，把月份一路推飞（一次调用能跳掉大半年）。
   */
  onDismissedEvent?: (state: GameState, id: string) => void;
}

const optionIsAvailable = (option: GameEvent['options'][number], state: GameState): boolean =>
  !option.condition || option.condition(state);

const optionsOf = (event: GameEvent | null | undefined): GameEvent['options'] => event?.options ?? [];

/** 选项的中英文本：script 策略的 `optionMatch` 在这里匹配。 */
const optionText = (option: GameEvent['options'][number]): string =>
  [option.text, option.textZh, option.subtitle, option.subtitleZh].filter(Boolean).join(' ');

/** 让局面最接近目标的那个选项（一层前瞻，遇到连环事件会继续解下去）。 */
const chooseBestOptionIndex = (spec: MissionSpec, state: GameState, event: GameEvent): number => {
  const choices = optionsOf(event);
  let best = -1;
  let bestScore = missionScore(spec, state) - 1e-9;
  choices.forEach((option, index) => {
    if (!optionIsAvailable(option, state)) return;
    let after = gameReducer(state, { type: 'RESOLVE_EVENT', payload: option.effect });
    for (let depth = 0; depth < 4 && after.currentEvent; depth++) {
      const nested = after.currentEvent;
      const nestedOptions = optionsOf(nested).filter(candidate => optionIsAvailable(candidate, after));
      if (nestedOptions.length === 0) break;
      const bestNested = nestedOptions
        .map(candidate => ({
          candidate,
          score: missionScore(spec, gameReducer(after, { type: 'RESOLVE_EVENT', payload: candidate.effect })),
        }))
        .sort((left, right) => right.score - left.score)[0];
      after = gameReducer(after, { type: 'RESOLVE_EVENT', payload: bestNested.candidate.effect });
    }
    // 打平时优先"确实改变了局面"的选项：像"把土地合起来 vs 维持小块经营"这种对，
    // 两者当月的目标分数一样，但只有一个真的在推进目标。
    const changed = countChangedFields(state, after);
    const score = missionScore(spec, after) + Math.min(changed, 20) * 1e-6;
    if (score > bestScore) { bestScore = score; best = index; }
  });
  return best;
};

const countChangedFields = (before: GameState, after: GameState): number => {
  let changed = 0;
  (Object.keys(after) as Array<keyof GameState>).forEach((key) => {
    if (before[key] !== after[key]) changed++;
  });
  return changed;
};

/** 把当前挂着的事件（当前事件 + 事件板）全部解决掉。 */
export const resolveEvents = (spec: MissionSpec, state: GameState, options: EngineOptions = {}): GameState => {
  const limit = options.maxEventsPerStep ?? 24;
  let next = state;
  for (let i = 0; i < limit; i++) {
    // 超级事件（内战爆发这类全屏通告）必须先"点掉"，否则 `civilWarSetup` 永远不会入队，
    // 1931/1933 的长局就会一路和平到 1939 年。
    if (next.superEvent) {
      const dismissed = gameReducer(next, { type: 'DISMISS_SUPER_EVENT' });
      if (dismissed === next) break;
      options.onSuperEvent?.(next, next.superEvent);
      next = dismissed;
      continue;
    }
    if (next.currentEvent) {
      const event = next.currentEvent;
      const choices = optionsOf(event);
      const available = choices.filter(option => optionIsAvailable(option, next));
      if (available.length === 0) {
        const custom = spec.customResolutions?.[event.id];
        if (custom) {
          const after = gameReducer(next, { type: 'RESOLVE_EVENT', payload: custom });
          if (after === next) break;
          next = after;
          continue;
        }
        // 没有选项也没有结算补丁：这是自定义界面事件，只能让它过期（见 EngineOptions 注释）。
        const cleared = gameReducer(next, { type: 'RESOLVE_EVENT', payload: () => ({ currentEvent: null }) });
        if (cleared === next) break;
        options.onDismissedEvent?.(next, event.id);
        next = cleared;
        continue;
      }
      let index = options.pickOption ? options.pickOption(next, event) : -1;
      if (index < 0 || index >= choices.length || !optionIsAvailable(choices[index], next)) {
        index = chooseBestOptionIndex(spec, next, event);
      }
      if (index < 0) {
        // 分数完全打平时也要选一个，否则事件挂着不放，`advancePhase` 会拒绝进入下个月。
        const changing = available.find(option => gameReducer(next, { type: 'RESOLVE_EVENT', payload: option.effect }) !== next);
        index = choices.indexOf(changing ?? available[0]);
      }
      if (index < 0) break;
      const after = gameReducer(next, { type: 'RESOLVE_EVENT', payload: choices[index].effect });
      if (after === next) break;
      next = after;
      continue;
    }
    if (next.pendingEvents.length > 0) {
      const after = gameReducer(next, { type: 'SELECT_EVENT', payload: { eventId: next.pendingEvents[0].id } });
      if (after === next) break;
      next = after;
      continue;
    }
    break;
  }
  return next;
};

/** 应用一个候选行动，并把随之而来的事件链解决干净。 */
export const applyCandidate = (
  spec: MissionSpec,
  state: GameState,
  candidate: Candidate,
  options: EngineOptions = {},
): GameState => resolveEvents(spec, candidate.apply(state), options);

/** 当前可打出的卡与顾问行动。 */
export const enumerateCandidates = (state: GameState, useAdvisorActions: boolean): Candidate[] => {
  const candidates: Candidate[] = [];
  const ap = state.actionsLeft;

  CARD_REGISTRY.forEach((card: Card) => {
    if ((card.cost ?? 1) > ap) return;
    if (card.condition && !card.condition(state)) return;
    if (card.resourceCost !== undefined && state.resources < card.resourceCost) return;
    if (card.armamentCost !== undefined && state.armaments < card.armamentCost) return;
    candidates.push({
      key: `card:${card.id}`,
      label: `${card.title} (${card.cost ?? 1} AP)`,
      kind: 'card',
      apply: (current: GameState) => gameReducer(current, { type: 'PLAY_CARD', payload: card }),
    });
  });

  if (useAdvisorActions) {
    (state.activeAdvisors || []).forEach((advisor) => {
      if (!advisor) return;
      advisor.actions.forEach((action) => {
        if (!action.condition(state)) return;
        candidates.push({
          key: `advisor:${advisor.id}:${action.id}`,
          label: `${advisor.name} · ${action.title} (1 AP)`,
          kind: 'advisor',
          // 顾问行动在界面里就是经 RESOLVE_EVENT 执行的（AdvisorPanel 的写法），
          // 同样花 1 AP；任务走的就是玩家点的路径。
          apply: (current: GameState) => gameReducer(current, {
            type: 'RESOLVE_EVENT',
            payload: (s: GameState) => {
              if (s.actionsLeft <= 0 || !action.condition(s)) return {};
              return { ...action.effect(s), actionsLeft: s.actionsLeft - 1 };
            },
          }),
        });
      });
    });
  }

  return candidates;
};

/**
 * 结束当前月份：把事件清干净，然后一路推进到"下一个月可以行动"的状态。
 *
 * 与 `advanceToActionPhase` 的区别：**即使还有行动点也照样推进**。策略层觉得
 * "这个月没什么值得做的"（分数不再提升）时必须能放弃剩余 AP，否则任务会在同一个月里
 * 空转——这正是资源/军备不足时该发生的事：等月份过去，收入到账再继续。
 */
export const endMonth = (spec: MissionSpec, state: GameState, options: EngineOptions = {}): GameState => {
  let next = resolveEvents(spec, state, options);
  for (let guard = 0; guard < 16; guard++) {
    const before = next;
    next = gameReducer(next, { type: 'NEXT_PHASE' });
    // 月结会产生新事件；不立刻解决的话 `advancePhase` 下一轮会拒绝推进。
    next = resolveEvents(spec, next, options);
    if (next === before) return next;
    if (next.phase === 'action' && next.actionsLeft > 0) return next;
  }
  return next;
};

const stepApplies = (step: ScriptStep, candidates: Candidate[]): Candidate | null => {
  if (step.card) return candidates.find(candidate => candidate.key === `card:${step.card}`) ?? null;
  if (step.advisorAction) {
    return candidates.find(candidate => candidate.key.startsWith('advisor:') && candidate.key.endsWith(`:${step.advisorAction}`)) ?? null;
  }
  return null;
};

const monthIndex = (state: GameState): number => state.year * 12 + state.month;

interface RunContext {
  spec: MissionSpec;
  trace: TraceEntry[];
  actionsUsed: number;
}

const record = (ctx: RunContext, state: GameState, action: string, detail: string): void => {  ctx.trace.push({
    month: `${state.year}-${String(state.month).padStart(2, '0')}`,
    action,
    detail,
    score: Number(missionScore(ctx.spec, state).toFixed(4)),
  });
};

/**
 * 按任务声明的 `advisorPlan` 换顾问（顾问上任不花行动点，与界面一致）。
 * 计划里的顾问优先占位；没有空位时换掉一个**不在计划里**的顾问。
 */
const installAdvisors = (state: GameState, ctx: RunContext): GameState => {
  const plan = ctx.spec.advisorPlan ?? [];
  if (plan.length === 0) return state;
  let next = state;
  for (const advisorId of plan) {
    if ((next.activeAdvisors || []).some(advisor => advisor?.id === advisorId)) continue;
    const candidate = (next.advisorPool || []).find(advisor => advisor?.id === advisorId);
    if (!candidate) continue;
    const active = [...(next.activeAdvisors || [])];
    let slot = active.findIndex(advisor => !advisor);
    if (slot < 0) {
      slot = active.findIndex(advisor => advisor && !plan.includes(advisor.id));
    }
    if (slot < 0) continue;
    next = gameReducer(next, { type: 'ADD_ADVISOR', payload: { advisor: candidate, slotIndex: slot } });
    record(ctx, next, `advisor:${advisorId}`, `slot#${slot}`);
  }
  return next;
};

/** 一个月内按策略打行动，直到打不动或分数不再提升。 */
const playActionsForMonth = (state: GameState, ctx: RunContext, options: EngineOptions): GameState => {
  const spec = ctx.spec;
  const policy = spec.policy;
  const useAdvisors = policy.kind === 'script' ? true : (policy.useAdvisorActions ?? true);
  const maxActions = policy.kind === 'script' ? 99 : (policy.maxActionsPerMonth ?? 99);
  let next = state;
  let played = 0;

  while (played < maxActions && next.actionsLeft > 0) {
    const candidates = enumerateCandidates(next, useAdvisors);
    if (candidates.length === 0) break;

    let chosen: Candidate | null = null;
    let pickOption = options.pickOption;
    let detail = '';

    if (policy.kind === 'script') {
      for (const step of policy.steps) {
        const candidate = stepApplies(step, candidates);
        if (!candidate) continue;
        chosen = candidate;
        if (step.option !== undefined || step.optionMatch) {
          const match = step.optionMatch;
          pickOption = (_s, event) => {
            if (step.option !== undefined) return step.option;
            return event.options.findIndex(option => (match ? optionText(option).includes(match) : false));
          };
        }
        detail = step.optionMatch ? `option~"${step.optionMatch}"` : step.option !== undefined ? `option#${step.option}` : '';
        break;
      }
      if (!chosen) break;
    } else {
      const currentScore = missionScore(spec, next);
      let bestScore = currentScore + 1e-9;
      for (const candidate of candidates) {
        const score = missionScore(spec, applyCandidate(spec, next, candidate, options));
        if (score > bestScore) { bestScore = score; chosen = candidate; detail = `+${(score - currentScore).toFixed(4)}`; }
      }
      if (!chosen) break;
      pickOption = options.pickOption;
    }

    const before = next;
    next = applyCandidate(spec, next, chosen, { ...options, pickOption });
    if (next === before) break;
    played++;
    ctx.actionsUsed++;
    record(ctx, next, chosen.key, detail);
  }

  return next;
};

/**
 * 结构性不可达的机械证明（不是"搜不到就说不可达"）。
 *
 * 做法：构造状态去问日志自己的 `checkStatus`。若"日志 A 已完成"会让"日志 B"
 * 直接返回 failed，那么两者不可能同时完成——这是游戏规则的直接后果，
 * 与搜索预算无关。
 */
export const proveUnreachable = (spec: MissionSpec, start: GameState): string | null => {
  const targets = spec.goals.filter(goal => goal.kind === 'journal').map(goal => goal.id);
  if (targets.length < 2) return null;

  for (const first of targets) {
    for (const second of targets) {
      if (first === second) continue;
      const def = getJournalEntryDef(second);
      if (!def?.checkStatus) continue;
      const probe: GameState = {
        ...start,
        journal: {
          ...start.journal,
          [first]: { id: first, status: 'completed', progress: 100 },
          [second]: { id: second, status: 'active', progress: 0 },
        },
      };
      if (def.checkStatus(probe, probe.journal![second]) === 'failed') {
        return `「${first}」完成后，「${second}」的 checkStatus 直接返回 failed：两者在规则上不可能同时完成，因此本任务的目标结构性不可达。`;
      }
    }
  }
  return null;
};

interface Branch {
  state: GameState;
  score: number;
  months: number;
  trace: TraceEntry[];
  actions: number;
}

const finish = (spec: MissionSpec, branch: Branch, ctx: RunContext): MissionResult => {
  const satisfied = spec.goals.every(goal => goalSatisfied(goal, branch.state));
  return {
    spec,
    verdict: satisfied ? 'passed' : 'timeout',
    monthsUsed: branch.months,
    actionsUsed: branch.actions || ctx.actionsUsed,
    goals: goalGaps(spec, branch.state),
    milestones: milestoneGaps(spec, branch.state),
    trace: branch.trace,
    notes: [],
    finalState: branch.state,
  };
};

/** 跑一条任务。 */
export const runMission = (spec: MissionSpec): MissionResult => {
  const previousRng = getRng();
  setRng(createSeededRng(spec.seed));
  const ctx: RunContext = { spec, trace: [], actionsUsed: 0 };
  try {
    const start = createScenarioState(spec.scenario, spec.difficulty, 'zh');
    const startMonth = monthIndex(start);

    const proof = proveUnreachable(spec, start);
    if (proof) {
      return {
        spec,
        verdict: 'unreachable',
        monthsUsed: 0,
        actionsUsed: 0,
        goals: goalGaps(spec, start),
        milestones: milestoneGaps(spec, start),
        trace: [],
        proof,
        notes: [],
        finalState: start,
      };
    }

    const options: EngineOptions = {
      onSuperEvent: (state, id) => record(ctx, state, `super-event:${id}`, '全屏通告已点掉'),
      onDismissedEvent: (state, id) => record(ctx, state, `dismissed-event:${id}`, '自定义界面事件：无结算补丁，已过期'),
    };

    if (spec.policy.kind === 'beam') {
      const width = Math.max(1, spec.policy.width);
      let frontier: Branch[] = [{ state: start, score: missionScore(spec, start), months: 0, trace: [], actions: 0 }];
      for (let month = 0; month < spec.months; month++) {
        const expanded: Branch[] = [];
        for (const branch of frontier) {
          const branchCtx: RunContext = { spec, trace: [...branch.trace], actionsUsed: branch.actions };
          let next = installAdvisors(branch.state, branchCtx);
          next = playActionsForMonth(next, branchCtx, options);
          next = endMonth(spec, next, options);
          const advanced: Branch = {
            state: next,
            score: missionScore(spec, next),
            months: monthIndex(next) - startMonth,
            trace: branchCtx.trace,
            actions: branchCtx.actionsUsed,
          };
          expanded.push(advanced);
          if (allGoalsSatisfied(spec, next)) return finish(spec, advanced, ctx);
        }
        expanded.sort((left, right) => right.score - left.score);
        frontier = expanded.slice(0, width);
      }
      return finish(spec, frontier[0], ctx);
    }

    let state = start;
    let stalled = 0;
    for (let month = 0; month < spec.months; month++) {
      const before = monthIndex(state);
      state = installAdvisors(state, ctx);
      state = playActionsForMonth(state, ctx, options);
      state = endMonth(spec, state, options);
      if (monthIndex(state) === before) {
        // 一个月过去而日历没动：要么卡在某个阶段，要么已经无事可做。
        // 连续两次就收工（并在缺口里给出当时的读数），不要白烧预算。
        stalled++;
        if (stalled >= 2) {
          ctx.trace.push({
            month: `${state.year}-${String(state.month).padStart(2, '0')}`,
            action: 'stalled',
            detail: `phase=${state.phase} actionsLeft=${state.actionsLeft} events=${state.pendingEvents.length}`,
            score: Number(missionScore(spec, state).toFixed(4)),
          });
          break;
        }
      } else {
        stalled = 0;
      }
      if (allGoalsSatisfied(spec, state)) {
        return finish(spec, {
          state,
          score: missionScore(spec, state),
          months: monthIndex(state) - startMonth,
          trace: ctx.trace,
          actions: ctx.actionsUsed,
        }, ctx);
      }
    }
    return finish(spec, {
      state,
      score: missionScore(spec, state),
      months: monthIndex(state) - startMonth,
      trace: ctx.trace,
      actions: ctx.actionsUsed,
    }, ctx);
  } catch (error) {
    return {
      spec,
      verdict: 'error',
      monthsUsed: 0,
      actionsUsed: ctx.actionsUsed,
      goals: [],
      milestones: [],
      trace: ctx.trace,
      error: error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error),
      notes: [],
    };
  } finally {
    setRng(previousRng);
  }
};
