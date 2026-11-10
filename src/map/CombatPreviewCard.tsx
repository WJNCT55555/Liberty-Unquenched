import type { Army, MapRuntimeState, Province } from './types_map';
import { buildCombatPreview } from '../game/rules/combatPreview';

const TERRAIN_LABEL: Record<Province['terrain'], [string, string]> = {
  plains: ['平原', 'Plains'],
  forest: ['森林', 'Forest'],
  urban: ['城市', 'Urban'],
  mountains: ['山地', 'Mountains'],
};

const VERDICT_LABEL = {
  undefended: ['无守军', 'Undefended', '#2C5E3B'],
  favourable: ['优势', 'Favourable', '#2C5E3B'],
  unfavourable: ['劣势', 'Unfavourable', '#AC6428'],
  hopeless: ['必败', 'Hopeless', '#A62626'],
} as const;

interface CombatPreviewCardProps {
  state: MapRuntimeState;
  attacker: Army;
  province: Province;
  canAct: boolean;
  lang: 'en' | 'zh';
}

/**
 * Target-province combat readout. Rendered by the Sidebar when a friendly army
 * and an adjacent enemy province are both selected. All numbers come from
 * `buildCombatPreview`, which mirrors `resolveBattle` without its random rolls.
 */
export const CombatPreviewCard = ({ state, attacker, province, canAct, lang }: CombatPreviewCardProps) => {
  const preview = buildCombatPreview(state, attacker, province.id);
  if (!preview) return null;

  const isZh = lang === 'zh';
  const [verdictZh, verdictEn, verdictColor] = VERDICT_LABEL[preview.verdict];
  const terrain = TERRAIN_LABEL[preview.defense.terrain] ?? TERRAIN_LABEL.plains;
  const sideRow = (label: string, side: typeof preview.attacker) => (
    <div className="space-y-0.5">
      <div className="text-[8px] font-black uppercase tracking-wider" style={{ color: '#6B5A49' }}>{label}</div>
      <div className="flex justify-between"><span>{isZh ? '战力' : 'Power'}</span><b>{side.power.toFixed(2)}</b></div>
      <div className="flex justify-between"><span>{isZh ? '投入/战宽' : 'Frontage'}</span><b>{side.committed.toLocaleString()}/{preview.width.toLocaleString()}</b></div>
      <div className="flex justify-between"><span>{isZh ? '预备' : 'Reserve'}</span><b>{side.reserve.toLocaleString()}</b></div>
      <div className="flex justify-between"><span>{isZh ? '军事化' : 'Militarization'}</span><b>{Math.round(side.militarization * 100)}%</b></div>
      <div className="flex justify-between"><span>{isZh ? '士气' : 'Morale'}</span><b>{side.morale}</b></div>
    </div>
  );

  return (
    <div className="mt-2 border-t border-[#1E1C1A]/20 pt-2 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-black uppercase tracking-[0.16em] text-[#1E1C1A]">
          {isZh ? '战斗预览' : 'Combat Preview'}
        </span>
        <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: verdictColor }}>
          {isZh ? verdictZh : verdictEn}
        </span>
      </div>

      <div className="text-[8.5px] leading-snug text-[#3A322A]">
        {isZh
          ? `防守系数：${preview.defense.base.toFixed(2)} 基础 + ${preview.defense.terrainBonus.toFixed(2)} ${terrain[0]} + ${preview.defense.fortress.toFixed(2)} 工事 = ${preview.defense.total.toFixed(2)}`
          : `Defence: ${preview.defense.base.toFixed(2)} base + ${preview.defense.terrainBonus.toFixed(2)} ${terrain[1].toLowerCase()} + ${preview.defense.fortress.toFixed(2)} fort = ${preview.defense.total.toFixed(2)}`}
      </div>

      {preview.verdict === 'undefended' ? (
        <div className="text-[9px] leading-snug text-[#2C5E3B] font-bold">
          {isZh
            ? '无守军：可直接占领（消耗 1 CP / 1 移动点）。'
            : 'No defenders: the province can be occupied directly (1 CP / 1 movement).'}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 border-y border-dashed border-[#1E1C1A]/15 py-1.5">
            {sideRow(isZh ? '攻方' : 'Attacker', preview.attacker)}
            {sideRow(isZh ? '守方' : 'Defender', preview.defender)}
          </div>

          <div className="flex justify-between text-[8.5px]">
            <span>{isZh ? '预计损失率' : 'Expected loss rate'}</span>
            <b>{(preview.attackerLossRate * 100).toFixed(1)}% / {(preview.defenderLossRate * 100).toFixed(1)}%</b>
          </div>
          <div className="flex justify-between text-[8.5px]">
            <span>{isZh ? '预计伤亡（攻/守）' : 'Expected losses (A/D)'}</span>
            <b>{preview.attackerExpectedLosses.toLocaleString()} / {preview.defenderExpectedLosses.toLocaleString()}</b>
          </div>
          <div className="flex justify-between text-[8.5px]">
            <span>{isZh ? '损失比例（攻/守）' : 'Loss ratio (A/D)'}</span>
            <b>{(preview.attackerLossRatio * 100).toFixed(1)}% / {(preview.defenderLossRatio * 100).toFixed(1)}%</b>
          </div>
          <div className="text-[8.5px] leading-snug">
            {isZh
              ? `胜负线：需要约 ${preview.requiredPower.toFixed(2)} 战力，当前 ${preview.attacker.power.toFixed(2)}。`
              : `Threshold: about ${preview.requiredPower.toFixed(2)} power needed; you have ${preview.attacker.power.toFixed(2)}.`}
          </div>
        </>
      )}

      <div className="text-[7.5px] leading-snug text-[#6B5A49]/80">
        {isZh
          ? '预览未计入 ±10% 随机；实际结算可能翻盘或翻车。'
          : 'Preview excludes the ±10% combat roll; the real battle can swing.'}
      </div>
      {!canAct && (
        <div className="text-[8px] leading-snug text-[#A62626] font-bold">
          {isZh ? '本月无法行动：没有剩余移动点或指挥点。' : 'No action left this month: no movement point or command point.'}
        </div>
      )}
    </div>
  );
};
