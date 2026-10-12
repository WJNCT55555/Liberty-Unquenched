import type { GameState } from '../../src/game/types';

/**
 * Mission Runner 的任务描述（docs 见 scripts/mission/README.md）。
 *
 * 一条"任务"= 一个开局 + 一个预算 + 一组目标 + 一个策略。目标只是**谓词**，
 * 全部复用游戏里已有的判定（成就条件表、日志状态、结局 id、计数器），
 * 因此任务脚本不会出现"测试通过但游戏里其实没达成"的情况。
 */

export type GoalKind = 'achievement' | 'journal' | 'ending' | 'counter' | 'flag';

export interface MissionGoal {
  kind: GoalKind;
  /** 成就 id / 日志 id / 结局 id / 计数器名 / flag 的自定义 id */
  id: string;
  /** `counter` 目标：达到多少算完成 */
  atLeast?: number;
  /** `flag` 目标：自定义判定 */
  test?: (state: GameState) => boolean;
  label?: string;
  labelZh?: string;
  /** 只对**里程碑**有效：权重（默认 1）。关键路径上的前置条件给更高权重。 */
  weight?: number;
}

export type MissionPolicy =
  /** 固定路线：按顺序打这些卡/顾问行动，事件按指定选项选。 */
  | { kind: 'script'; steps: ScriptStep[] }
  /** 一步前瞻：对每个可用行动模拟到"事件解决完"，取最接近目标的一个。 */
  | { kind: 'greedy'; useAdvisorActions?: boolean; maxActionsPerMonth?: number }
  /** 月度束搜索：每月保留 width 条最优路线。 */
  | { kind: 'beam'; width: number; useAdvisorActions?: boolean; maxActionsPerMonth?: number };

export interface ScriptStep {
  /** 打这张卡（卡 id） */
  card?: string;
  /** 或执行这个顾问行动（行动 id） */
  advisorAction?: string;
  /** 卡/行动打开事件时选第几个选项（0 起） */
  option?: number;
  /** 或者按文本匹配选项（英文或中文包含该子串） */
  optionMatch?: string;
}

export interface MissionSpec {
  id: string;
  title: string;
  titleZh: string;
  scenario: '1931' | '1933' | '1936';
  difficulty: GameState['difficulty'];
  seed: number;
  /** 月份预算：超过即判超时（报告里给缺口清单） */
  months: number;
  goals: MissionGoal[];
  /**
   * 里程碑：只用来**引导搜索**，不参与成败判定。
   *
   * 长链条目标（入阁 → 拿部委 → 建党 → 国有化 → 完成日志）中间每一步本身都不是
   * 目标，但少了梯度，贪心策略会在第一步就停下。里程碑让 `missionScore` 看得见
   * "离目标更近了一点"。
   */
  milestones?: MissionGoal[];
  /**
   * 少数事件由**自定义界面**结算（例如 1931 选举后的「部长分配」`options: []`），
   * 通用策略无法为它挑选项。任务可以在这里给出结算补丁——写明了才生效，
   * 因此不会出现"脚本偷偷替玩家做了决定"。
   */
  customResolutions?: Record<string, (state: GameState) => Partial<GameState>>;
  /** 需要常驻的顾问（顾问 id，按优先级）；有顾问池里的人在，就换上去。 */
  advisorPlan?: string[];
  policy: MissionPolicy;
  /**
   * CI 期望：
   *  - `pass`（默认）目标必须达成；
   *  - `unreachable` 必须**证明**结构性不可达（不是"没搜到"）；
   *  - `any` 只要求跑完不报错（用于探路/量月数的任务）。
   */
  expect?: 'pass' | 'unreachable' | 'any';
  /** 是否允许沙盒式预置（会写进报告，避免把作弊当成成绩） */
  allowSandboxEdits?: boolean;
  notes?: string;
  notesZh?: string;
}

export interface TraceEntry {
  month: string;
  action: string;
  detail: string;
  score: number;
}

export interface MissionGapLine {
  label: string;
  labelZh: string;
  value: string;
}

export interface GoalGap {
  goal: MissionGoal;
  satisfied: boolean;
  lines: MissionGapLine[];
}

export type MissionVerdict = 'passed' | 'timeout' | 'unreachable' | 'error';

export interface MissionResult {
  spec: MissionSpec;
  verdict: MissionVerdict;
  monthsUsed: number;
  actionsUsed: number;
  goals: GoalGap[];
  /** 里程碑达成情况（只影响搜索，不影响判定） */
  milestones: GoalGap[];
  trace: TraceEntry[];
  /** 结构性不可达的证据（verdict === 'unreachable' 时非空） */
  proof?: string;
  error?: string;
  notes: string[];
  finalState?: GameState;
}
