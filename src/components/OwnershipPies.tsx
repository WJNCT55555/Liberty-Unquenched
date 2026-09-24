import React from 'react';
import type { GameState, OwnershipSector } from '../game/types';
import { OWNERSHIP_COLORS, OWNERSHIP_LABELS } from '../game/rules/controlShares';

/**
 * 两张六分饼（docs/工人控制度改造方案.md §6.2）。
 *
 * 纯 CSS/SVG 环形图，不引入图表库；两张饼**上下依次排列，不并排**——并排时数字列会
 * 被挤成两行，而玩家需要一眼读完六项。
 *
 * **不画方形外框**（用户定稿）：两张饼是侧边栏里的一组读数，与上面的工会占比、
 * 下面的国内政治同属一层；各自套一个 2px 方框会把它们抬成"另一个层级"的卡片。
 * 分隔只靠标题下面那一条细线。
 *
 * 配色是设计定稿的一部分（用户指定）：
 *  - 大庄园 / 大资本 = 黄色（同一类"大私有制"，两张饼同色）
 *  - 中小地主与自耕农 / 小业主 = 蓝色（同一类"小私有制"，两张饼同色）
 *  - 教会土地 = 灰色
 *  - 国有土地 / 国有制 = 深紫色
 *  - 劳动者那两块用红系（集体/地方工会最深，合作社次深）——与"工会占比"图同一套语言
 */

const RING_SIZE = 84;
const RING_STROKE = 16;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;

interface Segment {
  key: string;
  label: string;
  labelZh: string;
  value: number;
  color: string;
}

const polar = (cx: number, cy: number, r: number, angleDeg: number) => {
  const angle = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
};

const arcPath = (startAngle: number, endAngle: number): string => {
  const c = RING_SIZE / 2;
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const start = polar(c, c, RING_RADIUS, endAngle);
  const end = polar(c, c, RING_RADIUS, startAngle);
  return [
    `M ${start.x} ${start.y}`,
    `A ${RING_RADIUS} ${RING_RADIUS} 0 ${largeArc} 0 ${end.x} ${end.y}`,
  ].join(' ');
};

const OwnershipPie: React.FC<{ sector: OwnershipSector; state: GameState; isZh: boolean }> = ({ sector, state, isZh }) => {
  const shares = (state.controlShares ?? { land: {}, industry: {} })[sector] as unknown as Record<string, number>;
  const segments: Segment[] = OWNERSHIP_LABELS[sector]
    .map(({ key, label, labelZh }) => ({
      key,
      label,
      labelZh,
      value: shares[key] ?? 0,
      color: OWNERSHIP_COLORS[sector][key],
    }))
    .sort((left, right) => right.value - left.value);

  // 六分饼的扇区角度；零值扇区不画，避免 SVG 出现 0 度路径。
  let cursor = 0;
  const arcs = segments.filter(segment => segment.value > 0).map((segment) => {
    const start = cursor;
    const sweep = (segment.value / 100) * 360;
    cursor += sweep;
    return { key: segment.key, color: segment.color, path: arcPath(start, Math.min(359.999, start + sweep)) };
  });

  const title = sector === 'land'
    ? (isZh ? '土地所有权' : 'Land ownership')
    : (isZh ? '生产资料所有权' : 'Ownership of production');
  const workers = sector === 'land'
    ? (shares.cooperative ?? 0) + (shares.collective ?? 0)
    : (shares.cooperative ?? 0) + (shares.union ?? 0);
  const stateShare = shares.state ?? 0;
  const privateShare = 100 - workers - stateShare;

  return (
    // 不画外框：两张饼是侧边栏里的一组读数，不是两张卡片。方框会把它们从
    // 上面的工会占比、下面的国内政治里"框"出来，视觉上像是另一个层级的东西。
    <div>
      <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 pb-1 border-b border-ink/20 ${sector === 'land' ? 'text-green-900' : 'text-slate-800'}`}>
        {title}
      </div>
      <div className="flex gap-3 items-start">
        <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} className="shrink-0">
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            stroke="#e5e1d8"
            strokeWidth={RING_STROKE}
          />
          {arcs.map((arc) => (
            <path key={arc.key} d={arc.path} fill="none" stroke={arc.color} strokeWidth={RING_STROKE} strokeLinecap="butt" />
          ))}
          <text
            x={RING_SIZE / 2}
            y={RING_SIZE / 2 + 3}
            textAnchor="middle"
            className="font-typewriter"
            style={{ fontSize: 13, fontWeight: 700 }}
          >
            {Math.round(workers)}%
          </text>
          <text
            x={RING_SIZE / 2}
            y={RING_SIZE / 2 + 14}
            textAnchor="middle"
            style={{ fontSize: 7, opacity: 0.6 }}
          >
            {isZh ? '劳动者' : 'workers'}
          </text>
        </svg>
        <div className="flex-1 min-w-0 space-y-0.5">
          {segments.map((segment) => (
            <div key={segment.key} className="flex items-center gap-1.5">
              <span className="w-2 h-2 shrink-0 border border-ink/40" style={{ backgroundColor: segment.color }} />
              <span className="text-[9px] font-typewriter truncate flex-1 opacity-85">
                {isZh ? segment.labelZh : segment.label}
              </span>
              <span className={`text-[10px] font-typewriter tabular-nums ${segment.value > 0 ? 'font-bold' : 'opacity-40'}`}>
                {segment.value.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-1.5 pt-1.5 border-t border-ink/15 flex justify-between text-[9px] font-typewriter opacity-75">
        <span>{isZh ? '劳动者' : 'Workers'} <b>{workers.toFixed(0)}%</b></span>
        <span>{isZh ? '国有' : 'State'} <b>{stateShare.toFixed(0)}%</b></span>
        <span>{isZh ? '私人' : 'Private'} <b>{privateShare.toFixed(0)}%</b></span>
      </div>
    </div>
  );
};

/** 侧边栏用：两张饼上下依次排列。 */
export const OwnershipPies: React.FC<{ state: GameState; isZh: boolean }> = ({ state, isZh }) => (
  <div className="flex flex-col gap-2">
    <OwnershipPie sector="land" state={state} isZh={isZh} />
    <OwnershipPie sector="industry" state={state} isZh={isZh} />
  </div>
);
