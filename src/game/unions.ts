import type { GameState, OrganizationId, UnionShare, UnionShareKey } from './types';
import { isOrganizationEstablished } from './organizations';
import { adjustZeroSumShare } from './utils/zeroSumShare';

/**
 * 工会占比（unionShare）
 *
 * 八项零和向量，和恒等于 100。分母视作 1（全体，不再区分阶级），
 * 数值表达的是各组织在"工会格局"中的相对权重，不声称人口学准确性。
 */
export const UNION_SHARE_KEYS: readonly UnionShareKey[] = [
  'CNT', 'UGT', 'UR', 'ELA', 'CNCA', 'CONS', 'other', 'unorganized',
];

/** 向量中对应真实组织注册表（OrganizationId）的键。 */
export const UNION_ORGANIZATION_KEYS: readonly UnionShareKey[] = ['CNT', 'UGT', 'UR', 'ELA', 'CNCA', 'CONS'];

/**
 * 未组织者占比下限。任何时刻至少 15% 的人不在任何组织手中：
 * 既是招募与流失的吸收池，也是"完全组织化"的天然上限。
 */
export const UNION_SHARE_MIN_UNORGANIZED = 15;

const DEFAULT_UNION_SHARE: Record<GameState['scenario'], UnionShare> = {
  '1931': { CNT: 22, UGT: 6, UR: 1, ELA: 1, CNCA: 5, CONS: 0, other: 4, unorganized: 61 },
  '1933': { CNT: 26, UGT: 10, UR: 2, ELA: 1, CNCA: 6, CONS: 0, other: 3, unorganized: 52 },
  '1936': { CNT: 27, UGT: 14, UR: 2, ELA: 2, CNCA: 5, CONS: 1, other: 3, unorganized: 46 },
};

export const UNION_SHARE_COLORS: Record<UnionShareKey, string> = {
  CNT: '#cc0000',
  UGT: '#EF1C27',
  UR: '#fb923c',
  ELA: '#0d9488',
  CNCA: '#166534',
  CONS: '#854d0e',
  other: '#9ca3af',
  unorganized: '#d1d5db',
};

export const UNION_SHARE_LABELS: Record<UnionShareKey, { en: string; zh: string }> = {
  CNT: { en: 'CNT', zh: '全国劳工联合会' },
  UGT: { en: 'UGT', zh: '劳动者总工会' },
  UR: { en: 'UR', zh: '拉巴塞尔联盟' },
  ELA: { en: 'ELA', zh: '巴斯克工人团结工会' },
  CNCA: { en: 'CNCA', zh: '天主教农业联合会' },
  CONS: { en: 'CONS', zh: '国家工团工会组织' },
  other: { en: 'Other unions', zh: '其他工会' },
  unorganized: { en: 'Unorganized', zh: '未组织' },
};

const round2 = (value: number): number => Number(value.toFixed(2));

export const getDefaultUnionShare = (scenario: GameState['scenario']): UnionShare => ({
  ...DEFAULT_UNION_SHARE[scenario],
});

/** 组织化率：被任一组织吸纳的比例（= 100 − 未组织）。 */
export const getOrganizedShare = (share: UnionShare): number => round2(100 - share.unorganized);

/** 左翼工会合计。 */
export const getLeftShare = (share: UnionShare): number =>
  round2(share.CNT + share.UGT + share.UR + share.ELA + share.other);

/** 右翼工会合计：右翼掣肘机制的输入。 */
export const getRightShare = (share: UnionShare): number => round2(share.CNCA + share.CONS);

/** CNT 在左翼工运内部的主导度（%）。 */
export const getCntDominance = (share: UnionShare): number => {
  const left = getLeftShare(share);
  return left <= 0 ? 0 : round2((share.CNT / left) * 100);
};

/**
 * 归一化占比向量：未成立组织置零、非负、已组织总量封顶 85、
 * 未组织者吸收余量并保证不低于下限，最终八项之和恒为 100。
 */
export const normalizeUnionShare = (state: GameState): GameState => {
  const raw = state.unionShare ?? getDefaultUnionShare(state.scenario);
  const share = {} as UnionShare;
  const maxOrganized = 100 - UNION_SHARE_MIN_UNORGANIZED;

  UNION_SHARE_KEYS.forEach((key) => {
    if (key === 'unorganized') return;
    const isOrganizationKey = UNION_ORGANIZATION_KEYS.includes(key);
    const established = !isOrganizationKey
      || isOrganizationEstablished(state, key as OrganizationId);
    share[key] = established ? Math.max(0, Number(raw[key]) || 0) : 0;
  });

  const organizedKeys = UNION_SHARE_KEYS.filter((key) => key !== 'unorganized');
  const organizedTotal = () => organizedKeys.reduce((sum, key) => sum + share[key], 0);
  const largestOrganizedKey = () => organizedKeys.reduce(
    (largest, key) => (share[key] > share[largest] ? key : largest),
    organizedKeys[0],
  );

  let total = organizedTotal();
  if (total > maxOrganized && total > 0) {
    const scale = maxOrganized / total;
    organizedKeys.forEach((key) => { share[key] = round2(share[key] * scale); });
    total = organizedTotal();
    // 逐项舍入可能让总量略微越过上限，从最大项扣回，避免未组织者被挤到下限之下
    const overflow = round2(total - maxOrganized);
    if (overflow > 0) {
      const largest = largestOrganizedKey();
      share[largest] = round2(Math.max(0, share[largest] - overflow));
      total = organizedTotal();
    }
  }

  share.unorganized = round2(100 - total);

  // 修正四舍五入误差：优先记入未组织者，若会击穿下限则改从最大项扣除
  const grandTotal = UNION_SHARE_KEYS.reduce((sum, key) => sum + share[key], 0);
  const diff = round2(100 - grandTotal);
  if (diff !== 0) {
    const adjusted = round2(share.unorganized + diff);
    if (adjusted >= UNION_SHARE_MIN_UNORGANIZED) {
      share.unorganized = adjusted;
    } else {
      const deficit = round2(UNION_SHARE_MIN_UNORGANIZED - adjusted);
      share.unorganized = UNION_SHARE_MIN_UNORGANIZED;
      const largest = largestOrganizedKey();
      share[largest] = round2(Math.max(0, share[largest] - deficit));
    }
  }

  return { ...state, unionShare: share };
};

/** 按零和规则调整某一项占比（其余项按比例吸收）。 */
export const adjustUnionShare = (
  state: GameState,
  key: UnionShareKey,
  delta: number,
): Partial<GameState> => {
  const current = state.unionShare ?? getDefaultUnionShare(state.scenario);
  return { unionShare: adjustZeroSumShare(current, key, delta, 100) };
};

/**
 * 按显式增量映射调整占比（例如 `{ CNT: 8, UGT: -4, unorganized: -4 }`）。
 * 未指定的项保持不变；归一化负责把总和拉回 100 并守住未组织者下限。
 */
export const applyUnionShareDelta = (
  state: GameState,
  deltas: Partial<Record<UnionShareKey, number>>,
): Partial<GameState> => {
  const current = state.unionShare ?? getDefaultUnionShare(state.scenario);
  const share = { ...current } as UnionShare;
  (Object.keys(deltas) as UnionShareKey[]).forEach((key) => {
    share[key] = Math.max(0, (share[key] ?? 0) + (deltas[key] ?? 0));
  });
  return { unionShare: normalizeUnionShare({ ...state, unionShare: share }).unionShare };
};

/** 读取占比，缺失时回落到剧本默认值。 */
export const getUnionShare = (state: GameState): UnionShare =>
  state.unionShare ?? getDefaultUnionShare(state.scenario);
