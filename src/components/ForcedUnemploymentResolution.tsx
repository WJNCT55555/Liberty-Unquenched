import React, { useState } from 'react';
import type { GameEventDispatch, GameState } from '../game/types';
import { getUnionShare } from '../game/unions';
import {
  FORCED_UNEMPLOYMENT_DEADLINE_MONTHS,
  FORCED_UNEMPLOYMENT_PLEDGES,
  getForcedUnemploymentChips,
  getForcedUnemploymentRewards,
  type ForcedUnemploymentPledgeId,
} from '../game/rules/forcedUnemployment';

type ExtraPledgeId = 'minimum_wage_1' | 'land_reform_20' | 'cnt_union_20';

interface Props {
  state: GameState;
  dispatch?: GameEventDispatch;
  onConfirm: (state: GameState, ids: ForcedUnemploymentPledgeId[]) => Partial<GameState>;
}

export const ForcedUnemploymentResolution: React.FC<Props> = ({ state, dispatch, onConfirm }) => {
  const isZh = state.language === 'zh';
  const [hours, setHours] = useState<ForcedUnemploymentPledgeId>('hours_1');
  const [unemployment, setUnemployment] = useState<ForcedUnemploymentPledgeId>('unemployment_13');
  const [extras, setExtras] = useState<ExtraPledgeId[]>([]);
  const selected: ForcedUnemploymentPledgeId[] = [hours, unemployment, ...extras];
  const chips = getForcedUnemploymentChips(selected);
  const reward = getForcedUnemploymentRewards(chips);

  const toggleExtra = (id: ExtraPledgeId) => {
    setExtras(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  };

  const renderGroup = (group: 'hours' | 'unemployment' | 'additional', headingEn: string, headingZh: string) => (
    <fieldset className="border border-ink/30 p-2">
      <legend className="px-1 font-typewriter text-[11px] font-bold uppercase">{isZh ? headingZh : headingEn}</legend>
      <div className="space-y-1">
        {FORCED_UNEMPLOYMENT_PLEDGES.filter(pledge => pledge.group === group).map(pledge => {
          const checked = selected.includes(pledge.id);
          return (
            <label key={pledge.id} className={`flex items-start gap-2 p-1.5 cursor-pointer border ${checked ? 'border-cnt-red bg-cnt-red/10' : 'border-transparent hover:border-ink/20'}`}>
              <input
                type={group === 'additional' ? 'checkbox' : 'radio'}
                name={group}
                checked={checked}
                onChange={() => {
                  if (group === 'hours') setHours(pledge.id);
                  else if (group === 'unemployment') setUnemployment(pledge.id);
                  else toggleExtra(pledge.id as ExtraPledgeId);
                }}
                className="mt-0.5 accent-red-700"
              />
              <span className="flex-1 text-xs leading-snug">{isZh ? pledge.textZh : pledge.text}</span>
              <span className="shrink-0 border border-ink px-1 font-typewriter text-[10px] font-bold">
                {pledge.chips} {isZh ? '筹码' : 'chips'}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );

  return (
    <div className="space-y-2 not-italic">
      <p className="font-typewriter text-xs font-bold">
        {isZh
          ? '在同一份决议中组合承诺：工时与失业率各选一个档位，还可复选额外承诺。难度筹码决定成败奖惩。'
          : 'Combine pledges in one resolution: choose one hours target, one unemployment target, and any additional pledges. Difficulty chips determine the stakes.'}
      </p>
      <p className="font-typewriter text-[11px] text-ink/75">
        {isZh
          ? `当前：工时法 L${state.domesticPolicy.max_hours_law} · 失业率 ${state.unemployment_rate.toFixed(2)}% · 最低工资法 L${state.domesticPolicy.min_wage} · 土改进度 ${state.domesticPolicy.land_reform_progress}% · CNT工会份额 ${getUnionShare(state).CNT}%`
          : `Current: hours law L${state.domesticPolicy.max_hours_law} · unemployment ${state.unemployment_rate.toFixed(2)}% · minimum wage L${state.domesticPolicy.min_wage} · land reform ${state.domesticPolicy.land_reform_progress}% · CNT union share ${getUnionShare(state).CNT}%`}
      </p>
      {renderGroup('hours', 'Maximum-hours law', '最高工时法')}
      {hours !== 'hours_1' && (
        <p className="text-[11px] text-cnt-red font-typewriter">
          {isZh
            ? '当前版本中，提高最高工时法主要依赖CNT掌握劳工部；罢工与集会不会直接提高此法。'
            : 'In the current rules, raising this law primarily requires CNT control of the Labor Ministry; strikes and assemblies do not raise it directly.'}
        </p>
      )}
      {renderGroup('unemployment', 'Unemployment', '失业率')}
      {renderGroup('additional', 'Additional promises', '额外承诺（可复选）')}
      <div className="border-2 border-ink bg-paper-dark p-2 font-typewriter text-xs space-y-1">
        <div className="font-bold">{isZh ? `总筹码：${chips} · 期限：${FORCED_UNEMPLOYMENT_DEADLINE_MONTHS}个月` : `Total: ${chips} chips · Deadline: ${FORCED_UNEMPLOYMENT_DEADLINE_MONTHS} months`}</div>
        <div className="text-green-800">{isZh ? `全部兑现：产业工人支持 +${reward.successWorkers}，雇农支持 +${reward.successRuralWorkers}` : `All fulfilled: industrial worker support +${reward.successWorkers}, rural worker support +${reward.successRuralWorkers}`}</div>
        <div className="text-cnt-red">{isZh ? `失约：产业工人支持 ${reward.failureWorkers}，雇农支持 ${reward.failureRuralWorkers}，热情 ${reward.failureFervor}，各活跃派系异议 +${reward.failureDissent}` : `Broken promise: industrial worker support ${reward.failureWorkers}, rural worker support ${reward.failureRuralWorkers}, fervor ${reward.failureFervor}, active faction dissent +${reward.failureDissent}`}</div>
      </div>
      <button
        type="button"
        disabled={!dispatch}
        onClick={() => dispatch?.({ type: 'RESOLVE_EVENT', payload: state => onConfirm(state, selected) })}
        className="w-full border-2 border-ink bg-ink text-paper hover:bg-cnt-red disabled:opacity-50 p-3 font-typewriter text-sm font-bold uppercase"
      >
        {isZh ? '通过这份决议并承担承诺' : 'Adopt the resolution and accept its promises'}
      </button>
    </div>
  );
};
