import type { GameState, LawId } from '../types';
import { LAW_LEVEL_LIMITS, clampLawLevel } from '../lawStances';

/**
 * 法律等级改动的**统一入口**。
 *
 * 设计约束（[游戏设计文档](../docs/游戏设计文档.md) §4.4）：
 *
 *  1. **只有政府卡与事件可以改法律等级，行动卡不可以。** 行动卡只能积累「诉求压力」，
 *     由 `rules/laborPressure.ts` 在月结里一次提升一级。
 *  2. **每次改动都必须先读当前等级**，由下面的 helper 统一完成，调用方不再手写
 *     `clampLawLevel`、`Math.max(当前, x)` 或裸的绝对赋值。
 *
 * 在引入本模块之前，同样的三件事有五六种写法散在十几个文件里：`clampLawLevel(id, 当前 + 1)`、
 * `Math.max(当前, 3)`、`law: 2`、`clampLawLevel(id, 2)`、变量等级……其中绝对赋值还会在
 * 当前等级更高时**悄悄把法律拉回去**。现在四种意图各有一个函数，文件名与函数名即自解释。
 *
 * 注意分工：这几个 helper 只负责把**新等级**算出来，不负责改 `domesticPolicy` 结构，
 * 因此调用方仍然写 `{ ...state.domesticPolicy, [law]: raiseLaw(state, law) }`。
 * 这样保留了「哪一张卡改了哪一条法律」在源码里一眼可见的好处。
 */

/** 当前等级（对旧存档的缺失字段按 0 处理）。 */
export const getLawLevel = (state: GameState, lawId: LawId): number =>
  Number(state.domesticPolicy?.[lawId] ?? 0);

/** 升一级（或 `delta` 级），停在法律定义的封顶。用于一次性历史推进。 */
export const raiseLaw = (state: GameState, lawId: LawId, delta = 1): number =>
  clampLawLevel(lawId, getLawLevel(state, lawId) + delta);

/** 降一级（或 `delta` 级），停在 0。用于明确的事件意图：右翼上台、紧急状态法续行。 */
export const lowerLaw = (state: GameState, lawId: LawId, delta = 1): number =>
  clampLawLevel(lawId, getLawLevel(state, lawId) - delta);

/**
 * 强制设定到某个等级，**允许下调**。
 *
 * 只给「法律被一条新的法律取代」这类语义使用：例如《公共秩序法》取代《共和国防卫法》
 * 时把等级压回 1，或续行防卫法把 3 级的宪政保障法案换回 2 级的防卫法。
 * 一般的「推进某项改革」不该用它——那种场合要的是 `ensureLawAtLeast`。
 */
export const setLawLevel = (state: GameState, lawId: LawId, level: number): number =>
  clampLawLevel(lawId, level);

/**
 * 保证「至少到这个等级」，当前更高时**原样保留**。
 *
 * 这是历史事件最常用的意图：一条新闻宣布某项法律出台，但如果玩家的世界已经走到更前面，
 * 这条新闻不该把它拉回去。
 */
export const ensureLawAtLeast = (state: GameState, lawId: LawId, level: number): number =>
  clampLawLevel(lawId, Math.max(getLawLevel(state, lawId), level));

/**
 * 一次改多条法律，返回可直接展开进 `domesticPolicy` 的对象。
 *
 * 这是政府卡与事件最推荐的写法：把「这张卡改了哪几条法律」集中在一处声明，
 * 每条都经由上面四个 helper 计算。
 *
 * @example
 *   domesticPolicy: {
 *     ...state.domesticPolicy,
 *     ...changeLaws(state, { religion_policy: 'up', education_institutions: 'up' }),
 *   }
 */
export type LawChangeIntent =
  | 'up'
  | 'down'
  | { up: number }
  | { down: number }
  | { to: number }
  | { atLeast: number };

export const changeLaws = (
  state: GameState,
  changes: Partial<Record<LawId, LawChangeIntent>>,
): Partial<GameState['domesticPolicy']> => {
  const next: Record<string, number> = {};
  for (const [lawId, intent] of Object.entries(changes) as [LawId, LawChangeIntent][]) {
    if (intent === 'up') next[lawId] = raiseLaw(state, lawId);
    else if (intent === 'down') next[lawId] = lowerLaw(state, lawId);
    else if ('up' in intent) next[lawId] = raiseLaw(state, lawId, intent.up);
    else if ('down' in intent) next[lawId] = lowerLaw(state, lawId, intent.down);
    else if ('to' in intent) next[lawId] = setLawLevel(state, lawId, intent.to);
    else next[lawId] = ensureLawAtLeast(state, lawId, intent.atLeast);
  }
  return next as Partial<GameState['domesticPolicy']>;
};

/** 供 UI 与测试断言使用：某条法律是否还能升。 */
export const canRaiseLaw = (state: GameState, lawId: LawId): boolean =>
  getLawLevel(state, lawId) < LAW_LEVEL_LIMITS[lawId];
