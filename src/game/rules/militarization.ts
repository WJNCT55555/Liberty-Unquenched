import type { GameState, MilitarizationPaths, MilitarizationState } from '../types';
import type { Army, ArmyIdentity } from '../../map/types_map';

/**
 * Militarization owns exactly one question: **of a force's nominal manpower, how
 * much actually functions as a military organisation?**
 *
 * A 5,000-strong CNT column at 17 fields roughly 850 men's worth of real soldiers.
 * The other 4,150 are not imaginary — they shoot, they are enthusiastic, they are
 * on the rolls — but the column cannot hold a line with them. That is why the rate
 * is a **combat multiplier** rather than a bonus: it is a discount applied to the
 * headcount, so `effective strength = nominal manpower x rate / 100`.
 *
 * Two consequences the rest of the codebase depends on:
 *
 * 1. The rate is shared by every unit of a force group, because it describes an
 *    organisational form (an autonomous column, a regular army) and not how hard
 *    one particular battalion drilled. Per-unit variation lives in `Army.morale`.
 * 2. Units never store a copy. `combat.ts` resolves the multiplier from the unit's
 *    `identity` at resolution time, so a journal upgrade lifts every existing unit
 *    of that group at once and no unit can drift out of sync with its group.
 *
 * This module is the only legal writer of `state.militarization`.
 */

/**每派系一个值；`gov` 同时覆盖政府军与警察（见 `GameState.militarization` 注释）。 */
export const MILITARIZATION_GROUPS: readonly ArmyIdentity[] = [
  'gov', 'cnt', 'ugt', 'poum', 'pce', 'intl', 'regional', 'requetes', 'falange',
] as const;

/**
 * 1931 opening rates. `gov` : `cnt` = 85 : 17 = 5.00, which is the design's
 * 1 : 0.2 ratio between the state's forces and the confederal militia.
 *
 * The regular army is deliberately not 100: the Republic inherited an
 * over-officered, under-equipped establishment, which is exactly why the Azaña
 * reforms existed. Militia groups differ by political culture rather than by
 * training — the PCE's Bolshevik discipline sits far above the CNT's federalist
 * distrust of militarisation, and that gap is the system's whole subject.
 */
export const INITIAL_MILITARIZATION: Record<ArmyIdentity, number> = {
  gov: 85,
  intl: 62,
  requetes: 55,
  pce: 48,
  falange: 42,
  regional: 38,
  ugt: 30,
  poum: 26,
  cnt: 17,
};

/** 下限防止「军事化率 0 = 战力 0」退化：完全没组织的持枪群众仍然有伤害。 */
export const MILITARIZATION_FLOOR = 10;
export const MILITARIZATION_CEILING = 100;

/** 民兵派系。`gov` 与右翼准军事不在其中。 */
export const MILITIA_GROUPS: readonly ArmyIdentity[] = ['cnt', 'ugt', 'poum', 'pce', 'regional'];

/**
 * 显示用信息。放在本模块而不是 UI 或 effectPreview 里，是为了让"谁是哪个派系"
 * 只有一份定义——侧栏面板与效果预览都从这里取名字。
 */
export const MILITARIZATION_GROUP_INFO: Record<ArmyIdentity, {
  en: string;
  zh: string;
  /** Tailwind background class for the panel bar. */
  color: string;
  /** 阵营归属，仅用于分组显示。 */
  camp: 'republic' | 'nationalist';
}> = {
  gov: { en: 'Government forces & police', zh: '政府军与警察', color: 'bg-republic-purple', camp: 'republic' },
  cnt: { en: 'CNT-FAI militia', zh: 'CNT-FAI 民兵', color: 'bg-cnt-red', camp: 'republic' },
  ugt: { en: 'UGT militia', zh: 'UGT 民兵', color: 'bg-red-600', camp: 'republic' },
  poum: { en: 'POUM militia', zh: 'POUM 民兵', color: 'bg-orange-600', camp: 'republic' },
  pce: { en: 'PCE militia', zh: 'PCE 民兵', color: 'bg-red-800', camp: 'republic' },
  intl: { en: 'International Brigades', zh: '国际纵队', color: 'bg-rose-700', camp: 'republic' },
  regional: { en: 'Basque Army', zh: '巴斯克军', color: 'bg-green-700', camp: 'republic' },
  requetes: { en: 'Requeté', zh: '雷盖特', color: 'bg-blue-900', camp: 'nationalist' },
  falange: { en: 'Falange', zh: '长枪党', color: 'bg-slate-800', camp: 'nationalist' },
};

/** 显示顺序：先共和方（gov 在最前），再国民方。 */
export const MILITARIZATION_DISPLAY_ORDER: readonly ArmyIdentity[] = [
  'gov', 'cnt', 'ugt', 'poum', 'pce', 'intl', 'regional', 'requetes', 'falange',
] as const;

export const createDefaultMilitarization = (): MilitarizationState => ({ ...INITIAL_MILITARIZATION });

export const createDefaultMilitarizationPaths = (): MilitarizationPaths => ({ chosen: 'none' });

export const clampMilitarization = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(MILITARIZATION_CEILING, value));
};

/**
 * 读取一个派系的军事化率。旧存档缺字段时回落到初始值表，所以读取永远安全。
 */
export const getMilitarization = (
  state: { militarization?: MilitarizationState },
  group: ArmyIdentity,
): number => {
  const stored = state.militarization?.[group];
  if (!Number.isFinite(stored)) return INITIAL_MILITARIZATION[group];
  return clampMilitarization(stored as number);
};

/**
 * 军事化系数 = 军事化率本身（线性 A）。
 *
 * 用 `m/100` 而不是 `1 + m/100`：后者把 85 与 17 的差距压到 1.58 倍，等于把
 * 「4,250 人」和「850 人」当成差不多。线性形式才能让每一分军事化率都值钱
 * （CNT 17 → 70 是 4.12 倍战力）。
 */
export const getMilitarizationMultiplier = (value: number): number => {
  const rate = Number.isFinite(value) ? value : 0;
  return Math.max(MILITARIZATION_FLOOR, Math.min(MILITARIZATION_CEILING, rate)) / 100;
};

/** 单位结算用：按 `identity` 查表，不使用单位上的任何副本。 */
export const getUnitMilitarizationMultiplier = (
  state: { militarization?: MilitarizationState },
  army: Pick<Army, 'identity'>,
): number => getMilitarizationMultiplier(getMilitarization(state, army.identity ?? 'gov'));

/**
 * 唯一合法的军事化率写入口。卡牌、顾问、事件与日志都必须走这里 ——
 * 这条约束让「谁改了什么」永远可审计。
 *
 * `ceiling` 是调用方额外施加的天花板（例如「准备革命」在内战爆发前只允许把
 * 民兵军事化率推到 40）；不传时就是全局上限。
 */
export const adjustMilitarization = (
  state: Pick<GameState, 'militarization'>,
  group: ArmyIdentity,
  delta: number,
  ceiling: number = MILITARIZATION_CEILING,
): Partial<GameState> => {
  const current = getMilitarization(state, group);
  const next = Math.min(clampMilitarization(current + delta), Math.max(0, ceiling));
  if (next === current) return {};
  return {
    militarization: {
      ...(state.militarization ?? createDefaultMilitarization()),
      [group]: next,
    },
  };
};

/** 批量写入，供一次结算多个派系的卡牌与事件使用。 */
export const adjustMilitarizations = (
  state: Pick<GameState, 'militarization'>,
  deltas: Partial<Record<ArmyIdentity, number>>,
): Partial<GameState> => {
  let militarization = state.militarization ?? createDefaultMilitarization();
  let changed = false;
  (Object.keys(deltas) as ArmyIdentity[]).forEach((group) => {
    const delta = deltas[group];
    if (!delta) return;
    const current = getMilitarization(state, group);
    const next = clampMilitarization(current + delta);
    if (next === current) return;
    militarization = { ...militarization, [group]: next };
    changed = true;
  });
  return changed ? { militarization } : {};
};

/** 写入路线选择。一经写入不可更改；已选择时返回空补丁。 */
export const chooseMilitarizationPath = (
  state: Pick<GameState, 'militarizationPaths' | 'year' | 'month'>,
  chosen: MilitarizationPaths['chosen'],
): Partial<GameState> => {
  const paths = state.militarizationPaths;
  if (!paths || paths.chosen !== 'none' || chosen === 'none') return {};
  return {
    militarizationPaths: {
      ...paths,
      chosen,
      chosenAt: { year: state.year, month: state.month },
    },
  };
};

/**
 * 月度军事化演化**不在这里**——它由法律承载。
 *
 * 两条军事化日志完成时把 `army_reform_law` 跳到 L3（共和国人民军）或 L4（民兵纵队
 * 体系），效果写在 `policyDefinitions.ts` 对应等级的 `monthlyModifiers` 上（新增的
 * `militarization` kind），由 `calculateMonthlyPolicyEffects` 统一结算。
 *
 * 这样做的理由：法律本来就拥有自己的效果，把长期惯性也放在那里，就不会出现
 * "日志和法律的数字各写一份、迟早不一致"的问题。L0–L2 阶段因此没有任何自动军事化
 * 变化，玩家完全靠卡牌与顾问推进。
 *
 * **自然衰减按设计确认不开**：军事化率只升不降，下调只来自卡牌／事件／法律的显式减益。
 *
 * **一个例外是 PCE**：它的军事化不由 CNT 的法律承载，而是它自己的行为（见下）。
 */

// ---------------------------------------------------------------------------
// PCE 独立路线（设计文档 §7）
// ---------------------------------------------------------------------------

/**
 * 「当你还在争论要不要军事化时，PCE 已经把自己的民兵练成正规军了。」
 *
 * 这是整套机制里**唯一一条不经过法律的月度军事化变化**，因为它根本不是共和国的
 * 政策——它是共产党的自主行为。三个数字来自设计文档 §7：
 *
 * - PCE 与本党的关系 >= 40 时，它才愿意在人民阵线里公开扩军（关系太差就自己单干，
 *   军事化反而停滞）；
 * - 内战进行中才生效（和平时期 MAOC 只是街头纠察队）；
 * - 每月 `pce` +0.4、`intl` +0.3，且**不受 CNT 路线选择的任何影响**。
 *
 * 上限与其他派系一样是 100：PCE 路线不设额外的天花板，这正是它"独立"的含义。
 */
export const PCE_MILITARIZATION_RELATIONS_FLOOR = 40;
export const PCE_MILITARIZATION_MONTHLY_GAIN = 0.4;
export const INTL_MILITARIZATION_MONTHLY_GAIN = 0.3;

/** MAOC 成立、国际纵队成军时的**一次性**跃升（设计文档 §7 的事件表）。 */
export const MAOC_MILITARIZATION_GAIN = 10;
export const INTERNATIONAL_BRIGADES_MILITARIZATION_GAIN = 8;

/**
 * 月度 PCE 军事化增量。返回空对象表示这个月它没有动——调用方可以直接展开进补丁。
 *
 * 刻意做成"纯查询"而不是"就地写入"：编排层需要把它与其他月度阶段合并成一次补丁，
 * 而 `adjustMilitarizations` 仍然是唯一真正的写入口。
 */
export const getPceMilitarizationMonthlyDrift = (
  state: Pick<GameState, 'activeWar' | 'civilWarStatus' | 'partyRelations' | 'militarization'>,
): Partial<Record<ArmyIdentity, number>> => {
  const atWar = state.activeWar === 'spanish_civil_war' && state.civilWarStatus === 'ongoing';
  const allied = Number(state.partyRelations?.PCE) >= PCE_MILITARIZATION_RELATIONS_FLOOR;
  if (!atWar || !allied) return {};
  return { pce: PCE_MILITARIZATION_MONTHLY_GAIN, intl: INTL_MILITARIZATION_MONTHLY_GAIN };
};

/** 把上一个月度增量套用到 `militarization` 上；没有增量时返回空补丁。 */
export const applyPceMilitarizationMonthlyDrift = (
  state: Pick<GameState, 'activeWar' | 'civilWarStatus' | 'partyRelations' | 'militarization'>,
): Partial<GameState> => adjustMilitarizations(state, getPceMilitarizationMonthlyDrift(state));
