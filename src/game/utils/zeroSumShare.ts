/**
 * 零和份额调整工具。
 *
 * 本文件是 `adjustSingleClassSupport`（阶级支持）与 `adjustUnionShare`
 * （工会占比）共用的唯一实现：把一个键增加/减少 delta，其余键按现有
 * 比例吸收，保证非负、总和恒等于 total，并修正四舍五入误差。
 */
export function adjustZeroSumShare<K extends string>(
  share: Record<K, number>,
  target: K,
  delta: number,
  total = 100,
): Record<K, number> {
  const next = JSON.parse(JSON.stringify(share)) as Record<K, number>;
  const keys = Object.keys(next) as K[];

  if (!keys.includes(target)) {
    return next;
  }

  if (delta > 0) {
    let remainingDelta = delta;

    // 目标份额不得超过 total
    if ((next[target] || 0) + remainingDelta > total) {
      remainingDelta = total - (next[target] || 0);
    }

    let actualIncrease = remainingDelta;

    // 从其他键按比例扣除
    while (remainingDelta > 0.001) {
      const otherKeys = keys.filter(key => key !== target && (next[key] || 0) > 0);

      let pool = 0;
      for (const key of otherKeys) {
        pool += next[key] || 0;
      }

      if (pool <= 0) {
        actualIncrease -= remainingDelta;
        break;
      }

      let nextRemainingDelta = 0;
      for (const key of otherKeys) {
        const deduction = remainingDelta * ((next[key] || 0) / pool);
        if ((next[key] || 0) < deduction) {
          nextRemainingDelta += (deduction - (next[key] || 0));
          next[key] = 0;
        } else {
          next[key] = (next[key] || 0) - deduction;
        }
      }
      remainingDelta = nextRemainingDelta;
    }

    next[target] = (next[target] || 0) + actualIncrease;
  } else if (delta < 0) {
    let remainingDelta = -delta;

    // 目标份额不得低于 0
    if ((next[target] || 0) - remainingDelta < 0) {
      remainingDelta = next[target] || 0;
    }

    const actualDecrease = remainingDelta;

    const otherKeys = keys.filter(key => key !== target);
    let pool = 0;
    for (const key of otherKeys) {
      pool += next[key] || 0;
    }

    if (pool <= 0) {
      const equalShare = remainingDelta / otherKeys.length;
      for (const key of otherKeys) {
        next[key] = (next[key] || 0) + equalShare;
      }
    } else {
      for (const key of otherKeys) {
        const addition = remainingDelta * ((next[key] || 0) / pool);
        next[key] = (next[key] || 0) + addition;
      }
    }

    next[target] = (next[target] || 0) - actualDecrease;
  }

  // 保留 4 位小数
  let sum = 0;
  for (const key of keys) {
    next[key] = parseFloat(Number(next[key] || 0).toFixed(4));
    sum += next[key];
  }

  // 修正舍入误差，使总和恰好等于 total
  const diff = parseFloat((total - sum).toFixed(4));
  if (Math.abs(diff) > 0.0001) {
    next[target] = parseFloat(((next[target] || 0) + diff).toFixed(4));
    if ((next[target] || 0) < 0) {
      next[target] = parseFloat(((next[target] || 0) - diff).toFixed(4));
      let largest = target;
      let maxShare = -1;
      for (const key of keys) {
        if ((next[key] || 0) > maxShare) {
          maxShare = next[key] || 0;
          largest = key;
        }
      }
      next[largest] = parseFloat(((next[largest] || 0) + diff).toFixed(4));
    }
  }

  return next;
}
