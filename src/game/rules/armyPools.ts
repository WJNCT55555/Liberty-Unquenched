import { MapFaction, type ArmedEntityId } from '../../map/types_map';
import type { ArmedEntityPool, GameState } from '../types';
import { getArmyPoliticalMember } from './wartimeCoalition';

/**
 * 人民军路线完成时的池统一，以及"归属 CNT 的民兵单位"的计数。
 *
 * 这两件事放在同一个模块里，是因为它们共用同一个概念：**哪些武装算作"党派民兵"**。
 * 拆成两处迟早会出现两个口径。
 */

/**
 * 会被并入 `republican_state` 的池——正好等于 `warSetup.ts` 的
 * `MOBILISED_MILITIA_ENTITIES`：五支西班牙本土党派民兵。
 *
 * **明确排除的两个**：
 * - `international_brigades`：外国志愿者，且 `spendMilitiaPoolManpower` 对它有专门分支
 *   （同步写 `state.internationalBrigades`），并入会破坏该不变量。
 * - `euzko_gudarostea`：巴斯克自治政府保有本军，1937 年前并未并入人民军。
 */
export const SPANISH_MILITIA_POOL_ENTITY_IDS: readonly ArmedEntityId[] = [
  'cnt_defense_committees',
  'ugt_socialist_militias',
  'maoc',
  'fifth_regiment',
  'poum_militias',
];

const REPUBLICAN_CAMPS: readonly MapFaction[] = [MapFaction.REPUBLICAN, MapFaction.IBERIAN_DEFENSE];

/**
 * 把五支党派民兵池的人力与重装备全部转入 `republican_state`，并把被并的池置为
 * `'integrated'`。
 *
 * 后果不是"改个数字"：被并入的池清空后，从它们募兵不再可能；而新募单位一律带
 * `identity: 'gov'`，于是使用 `militarization.gov` 而不是各派系自己的率。这正是
 * 人民军路线的军事回报。已有的地图单位不受影响——它们保留自己的 `identity` 与
 * `sourceEntityId`，所以老纵队仍是老纵队。
 */
export const mergeMilitiaPoolsIntoStateArmy = (
  state: Pick<GameState, 'armedForces'>,
): Partial<GameState> => {
  const pools = state.armedForces?.entityPools;
  if (!pools) return {};

  const target = pools.republican_state;
  if (!target) return {};

  let manpower = target.manpower;
  let artillery = target.artillery;
  let tanks = target.tanks;
  let changed = target.status !== 'active';

  const nextPools: Record<string, ArmedEntityPool> = { ...pools };
  SPANISH_MILITIA_POOL_ENTITY_IDS.forEach((entityId) => {
    const pool = pools[entityId];
    if (!pool) return;
    if (pool.manpower > 0 || pool.artillery > 0 || pool.tanks > 0) {
      manpower += pool.manpower;
      artillery += pool.artillery;
      tanks += pool.tanks;
      changed = true;
    }
    if (pool.status !== 'integrated') {
      nextPools[entityId] = { ...pool, manpower: 0, artillery: 0, tanks: 0, status: 'integrated' };
      changed = true;
    }
  });

  if (!changed) return {};
  nextPools.republican_state = { ...target, manpower, artillery, tanks, status: 'active' };
  return {
    armedForces: {
      ...state.armedForces!,
      entityPools: nextPools as GameState['armedForces']['entityPools'],
    },
  };
};

/**
 * 场上归属 CNT 的民兵单位数——武装民兵日志的完成条件之一。
 *
 * 用 `getArmyPoliticalMember` 而不是手写 `sourceEntityId === 'cnt_defense_committees'`：
 * 它同时覆盖"从 CNT 池募来的"（`sourceEntityId`）与"政治身份是 cnt 的"两种来源，
 * 而且与 `getWartimeCoalitionPower` 用**完全相同的归属判断**，所以"我在联盟里的
 * 民兵份额"和"我离完成条件还差几支"永远一致，不会出现两个口径。
 */
export const countCntMilitiaUnits = (state: Pick<GameState, 'armies'>): number =>
  (state.armies || []).filter(army => (
    getArmyPoliticalMember(army) === 'CNT_FAI'
    && REPUBLICAN_CAMPS.includes(army.faction)
    && army.manpower > 0
  )).length;
