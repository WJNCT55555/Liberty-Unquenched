import type { EconomyOwnershipShares, GameState } from '../types';

/**
 * 三份剧本开局时的土地与生产资料所有权（docs/工人控制度改造方案.md §2.4）。
 *
 * 这组数据由剧本显式声明，与 `ScenarioEconomy`、`ScenarioHistoryFlags` 同级：
 * 它描述的是"开局时世界已经发生了什么"。放进 `NEUTRAL_STATE` 就等于承认 1936
 * 会继承 1931 的乡村，因此必须进 `SCENARIO_OWNED_KEYS`。
 *
 * 数值来源（用户给定）：
 *  - 1931·4  共和国成立
 *  - 1933·11 CEDA—激进党上台
 *  - 1936·7  内战爆发（经济数据取当年 5 月，即七月开局前最后一次统计）
 *
 * 已核对：每张饼六项之和恰为 100。
 */
export const INITIAL_CONTROL_SHARES: Record<GameState['scenario'], EconomyOwnershipShares> = {
  '1931': {
    land: { church: 2, latifundia: 48, smallholders: 44, cooperative: 2, collective: 0, state: 4 },
    industry: { foreign: 18, bigCapital: 38, smallBusiness: 37, cooperative: 2, union: 0, state: 5 },
  },
  '1933': {
    land: { church: 2, latifundia: 44, smallholders: 46, cooperative: 3, collective: 0, state: 5 },
    industry: { foreign: 10, bigCapital: 39, smallBusiness: 44, cooperative: 3, union: 1, state: 3 },
  },
  '1936': {
    land: { church: 2, latifundia: 40, smallholders: 44, cooperative: 5, collective: 1, state: 8 },
    industry: { foreign: 18, bigCapital: 36, smallBusiness: 37, cooperative: 3, union: 1, state: 5 },
  },
};

/** 深拷贝一份初值，避免调用方改到常量本体。 */
export const getInitialControlShares = (scenario: GameState['scenario']): EconomyOwnershipShares => ({
  land: { ...INITIAL_CONTROL_SHARES[scenario].land },
  industry: { ...INITIAL_CONTROL_SHARES[scenario].industry },
});

/** 每张饼的六项合计。 */
export const sumOwnershipShares = (shares: Record<string, number>): number =>
  Object.values(shares).reduce((sum, value) => sum + value, 0);

/**
 * 启动断言：任何一张饼的六项之和不是 100 就是数据写错了。
 *
 * 放在模块求值期而不是测试里，因为这是一条**数据不变量**：
 * `transferControlShare` 的所有数学都建立在"和恒为 100"之上，数据坏了会
 * 一路静默地算出错误份额。宁可加载时就炸。
 */
const assertInitialSharesSumTo100 = (): void => {
  (Object.keys(INITIAL_CONTROL_SHARES) as GameState['scenario'][]).forEach((scenarioId) => {
    const shares = INITIAL_CONTROL_SHARES[scenarioId];
    (['land', 'industry'] as const).forEach((sector) => {
      const total = sumOwnershipShares(shares[sector]);
      if (total !== 100) {
        throw new Error(`INITIAL_CONTROL_SHARES['${scenarioId}'].${sector} sums to ${total}, not 100`);
      }
    });
  });
};

assertInitialSharesSumTo100();
