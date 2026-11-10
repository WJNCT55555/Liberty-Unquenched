import { getProvinceName, getSupplyLimit } from '../../map/map_constants';
import { getMapFactionName } from '../../map/rules/factions';
import type { Army, Province } from '../../map/types_map';
import { splitLossAcrossUnits } from './combat';

/**
 * 月结补给损耗。
 *
 * `getSupplyLimit()` 过去只用于侧栏显示；从本模块起它变成真实规则：一个省的
 * 驻军超过上限时，**超出上限的那部分人**每月按比例损耗，并压低士气。
 *
 * 规则：
 *   losses     = min(floor(load × 15%), floor(excess × 20%))
 *   moraleLoss = min(25, 3 + floor(10 × excess / limit))
 *
 * 与会战不同，补给损耗不套用“≤150 人销毁”的战场阈值——只有被打到 0 的单位
 * 才会消失。这样月结损耗是慢性失血，而不是一次会战的溃散。
 *
 * 本模块是纯函数：不修改传入的 `armies` / `provinces`，方便月结预览与测试。
 */

export interface SupplyAttritionResult {
  armies: Army[];
  messages: string[];
}

export const getProvinceSupplyLoad = (armies: Army[], provinceId: string): number =>
  armies.reduce(
    (total, army) => (army.provinceId === provinceId ? total + Math.max(0, army.manpower) : total),
    0,
  );

/** 驻军达到或超过补给上限即视为“超限”：达到上限后也不能再补员。 */
export const isProvinceOverSupply = (
  armies: Army[],
  province: Province,
  provinceId: string,
): boolean => getProvinceSupplyLoad(armies, provinceId) >= getSupplyLimit(province);

/**
 * Apply one month of supply attrition to every over-limit province.
 *
 * `splitLossAcrossUnits` gives each unit a share proportional to the men it
 * contributed; the share is then taken out of the unit's composition
 * proportionally across infantry, artillery and armour.
 */
export const applySupplyAttrition = (
  armies: Army[],
  provinces: Record<string, Province>,
  isZh: boolean,
): SupplyAttritionResult => {
  const messages: string[] = [];
  const byProvince = new Map<string, Army[]>();

  armies.forEach((army) => {
    const units = byProvince.get(army.provinceId) ?? [];
    units.push(army);
    byProvince.set(army.provinceId, units);
  });

  const removed = new Set<string>();
  const updated = new Map<string, Army>();

  byProvince.forEach((units, provinceId) => {
    const province = provinces[provinceId];
    if (!province) return;

    const load = units.reduce((total, army) => total + Math.max(0, army.manpower), 0);
    const limit = getSupplyLimit(province);
    if (load <= limit) return;

    const excess = load - limit;
    const losses = Math.min(
      Math.floor(load * 0.15),
      Math.floor(excess * 0.20),
    );
    if (losses <= 0) return;

    const moraleLoss = Math.min(25, 3 + Math.floor((excess / Math.max(1, limit)) * 10));
    const shares = splitLossAcrossUnits(units, losses);

    let destroyed = 0;
    let actualLosses = 0;

    units.forEach((army, index) => {
      const share = shares[index];
      const next = applyAttritionLosses(army, share, moraleLoss);
      actualLosses += Math.max(0, army.manpower - next.manpower);
      if (next.manpower <= 0) {
        destroyed += 1;
        removed.add(army.id);
        return;
      }
      updated.set(army.id, next);
    });

    if (actualLosses <= 0 && destroyed === 0) return;

    const factionName = getMapFactionName(units[0].faction, isZh);
    const provinceName = getProvinceName(province, isZh ? 'zh' : 'en');
    messages.push(isZh
      ? `【补给】${factionName}在 ${provinceName} 驻军 ${load.toLocaleString()} 人，超过上限 ${limit.toLocaleString()}：损失 ${actualLosses.toLocaleString()} 人，士气 −${moraleLoss}${destroyed > 0 ? `，${destroyed} 支部队解散` : ''}。`
      : `[Supply] ${factionName} in ${provinceName}: ${load.toLocaleString()} troops exceed the ${limit.toLocaleString()} supply limit; ${actualLosses.toLocaleString()} lost, morale −${moraleLoss}${destroyed > 0 ? `, ${destroyed} formation(s) disbanded` : ''}.`);
  });

  return {
    armies: armies
      .filter((army) => !removed.has(army.id))
      .map((army) => updated.get(army.id) ?? army),
    messages,
  };
};

/**
 * Take `losses` out of one unit proportionally across its arms, and apply the
 * province-wide morale penalty. A unit at 0 manpower is removed by the caller.
 */
const applyAttritionLosses = (army: Army, losses: number, moraleLoss: number): Army => {
  const { infantry, artillery, tanks } = army.composition;
  const total = infantry + artillery + tanks;
  const nextMorale = Math.max(10, army.morale - moraleLoss);

  if (total <= 0 || losses <= 0) {
    return { ...army, morale: nextMorale };
  }

  const applied = Math.min(total, Math.max(0, Math.floor(losses)));
  const ratio = applied / total;
  let infantryLoss = Math.floor(infantry * ratio);
  let artilleryLoss = Math.floor(artillery * ratio);
  let tankLoss = Math.floor(tanks * ratio);
  let remainder = applied - (infantryLoss + artilleryLoss + tankLoss);

  // Hand the rounding remainder to whichever arm has the most men left to lose.
  const arms = [
    { key: 'infantry' as const, room: infantry - infantryLoss },
    { key: 'artillery' as const, room: artillery - artilleryLoss },
    { key: 'tanks' as const, room: tanks - tankLoss },
  ].sort((left, right) => right.room - left.room);

  for (const arm of arms) {
    if (remainder <= 0) break;
    const extra = Math.min(arm.room, remainder);
    if (arm.key === 'infantry') infantryLoss += extra;
    else if (arm.key === 'artillery') artilleryLoss += extra;
    else tankLoss += extra;
    remainder -= extra;
  }

  const composition = {
    infantry: Math.max(0, infantry - infantryLoss),
    artillery: Math.max(0, artillery - artilleryLoss),
    tanks: Math.max(0, tanks - tankLoss),
  };

  return {
    ...army,
    composition,
    manpower: composition.infantry + composition.artillery + composition.tanks,
    morale: nextMorale,
  };
};
