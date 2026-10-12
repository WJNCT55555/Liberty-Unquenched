/**
 * 可注入的随机源（Mission Runner 与可复现测试的基础设施）。
 *
 * 默认行为**不变**：没有安装种子随机源时就是 `Math.random()`，正式游戏与既有测试
 * 的分布、手感都不受影响。脚本里用 `withSeed(seed, () => ...)` 或 `setRng(createSeededRng(seed))`
 * 把整局固定下来，同一个 seed 必然跑出同一局——这是"任务脚本"能断言结果的前提。
 *
 * 使用约定：游戏规则层**不要再直接写 `Math.random()`**，一律经这里的
 * `random()` / `randomInt()` / `randomPick()` / `randomChance()`；
 * 卡牌与事件里的"运气判定"同样如此，否则任务脚本会时不时因为一次掷骰而失败。
 */
export interface Rng {
  /** [0, 1) */
  next(): number;
}

const mathRandomRng: Rng = { next: () => Math.random() };

let current: Rng = mathRandomRng;

/** 安装随机源；传 null 恢复 `Math.random`。 */
export const setRng = (rng: Rng | null): void => {
  current = rng ?? mathRandomRng;
};

export const getRng = (): Rng => current;

/**
 * mulberry32：32 位种子、状态小、分布够用，且实现只有几行（无需依赖）。
 * 用整数位运算，跨平台结果一致。
 */
export const createSeededRng = (seed: number): Rng => {
  let state = (Number.isFinite(seed) ? Math.floor(seed) : 0) >>> 0;
  return {
    next: () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
};

/** 在固定种子下执行一段逻辑，结束后恢复原来的随机源。 */
export const withSeed = <T>(seed: number, fn: () => T): T => {
  const previous = current;
  current = createSeededRng(seed);
  try {
    return fn();
  } finally {
    current = previous;
  }
};

export const random = (): number => current.next();

/** [0, maxExclusive) 的整数；maxExclusive ≤ 0 时返回 0。 */
export const randomInt = (maxExclusive: number): number => {
  if (!Number.isFinite(maxExclusive) || maxExclusive <= 0) return 0;
  return Math.min(Math.floor(current.next() * maxExclusive), Math.floor(maxExclusive) - 1);
};

/** 从数组里取一项；空数组抛错（调用方应当先判空，静默返回 undefined 会掩盖 bug）。 */
export const randomPick = <T,>(items: readonly T[]): T => {
  if (items.length === 0) throw new Error('randomPick: empty array');
  return items[randomInt(items.length)];
};

/** 以 probability 的概率返回 true。 */
export const randomChance = (probability: number): boolean => current.next() < probability;
