import React from 'react';
import { getEffectiveFortressLevel, type Army, type MapRuntimeState, type Province } from './types_map';
import { getCombatWidth } from './map_constants';
import { getUnitMilitarizationMultiplier } from '../game/rules/militarization';
import { deployToWidth, getCombatPower, getDefenseCoefficient, getDeployedManpower } from '../game/rules/combat';

/**
 * 地图侧栏的读数组件。
 *
 * 单独成文件而不是留在 `Sidebar.tsx` 里，是因为它是"公式的显示器"——只允许从
 * `rules/combat.ts` 取值，绝不重算。独立文件让它能被直接渲染测试，从而把这条
 * 约束锁住：面板上的数字一旦和解算公式脱节，测试就会失败。
 */

export const DetailBox = ({ label, value, color }: { label: string, value: string, color?: string }) => (
  <div className="bg-[#FAF6EC]/90 p-1.5 rounded-sm border border-[#8B7355]/40 text-center relative overflow-hidden flex flex-col justify-between h-14 shadow-sm">
    <div className="absolute top-1 left-1"><span className="w-1 h-1 rounded-full bg-[#A87E43]/40" /></div>
    <div className="absolute top-1 right-1"><span className="w-1 h-1 rounded-full bg-[#A87E43]/40" /></div>
    <div className="text-[9px] font-serif text-[#6B5A49] uppercase tracking-wider font-bold leading-none">{label}</div>
    <div className="text-xs font-serif font-extrabold uppercase truncate tracking-tight pb-0.5" style={{ color: color || '#2C241E' }}>{value}</div>
  </div>
);

/**
 * 单位战力读数。
 *
 * 进攻与防守分开显示，是因为防守系数（地形 + 工事）最高能到 3 倍以上——玩家必须
 * 能一眼看出"同一支部队守在这里比打出去强多少"。战宽与预备队一并给出，是为了让
 * "人多却打不过"这件事变得可解释：平原上只有 6,000 人能展开，其余的在进攻时根本不上阵。
 */
export const ArmyPowerBoxes = ({ state, army, isZh }: { state: MapRuntimeState; army: Army; isZh: boolean }) => {
  const province = state.provinces?.[army.provinceId];
  const terrain = (province?.terrain ?? 'plains') as NonNullable<Province['terrain']>;
  const width = getCombatWidth(terrain);
  const deployment = deployToWidth(army.composition, width);
  const militarizationMultiplier = getUnitMilitarizationMultiplier(state, army);
  const attackPower = getCombatPower({ deployment, militarizationMultiplier, morale: army.morale });
  const defensePower = getCombatPower({
    deployment,
    militarizationMultiplier,
    morale: army.morale,
    defenseCoefficient: getDefenseCoefficient(terrain, province ? getEffectiveFortressLevel(province) : 0),
  });
  const committed = getDeployedManpower(deployment);
  const reserve = deployment.reserveInfantry + deployment.reserveTanks;

  return (
    <>
      <DetailBox label={isZh ? '进攻战力' : 'Attack power'} value={attackPower.toFixed(2)} />
      <DetailBox label={isZh ? '防守战力（本地形）' : 'Defence power (here)'} value={defensePower.toFixed(2)} />
      <DetailBox label={isZh ? '战宽占用' : 'Frontage'} value={`${committed.toLocaleString()}/${width.toLocaleString()}`} />
      <DetailBox
        label={isZh ? '预备队（进攻不参战）' : 'Reserve (uncommitted)'}
        value={reserve.toLocaleString()}
      />
    </>
  );
};
