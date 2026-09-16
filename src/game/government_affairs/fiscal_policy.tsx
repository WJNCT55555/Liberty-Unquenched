import React from 'react';
import type { Card, GameEvent, GameState } from '../types';
import { useGame } from '../GameContext';
import { adjustClassSupport, adjustFactionDissents, withCurrentDate } from '../utils';
import { calculateMonthlyEconomy } from '../rules/economy';
import { calculateIncomeTaxAdjustment, calculateTariffConsumptionAdjustment } from '../rules/fiscalPolicy';

const getDraftRevenueChange = (state: GameState, draft: Partial<GameState>): number =>
  calculateMonthlyEconomy({ ...state, ...draft }).revenue.total - calculateMonthlyEconomy(state).revenue.total;

const TaxButtons: React.FC<{ onAdjust: (amount: number) => void }> = ({ onAdjust }) => (
  <div className="flex gap-2 justify-end mt-1">
    {[-5, -1, 1, 5].map(amount => (
      <button
        key={amount}
        onClick={() => onAdjust(amount)}
        className="px-2 py-0.5 border border-ink hover:bg-ink hover:text-paper font-bold"
      >
        {amount > 0 ? '+' : ''}{amount}%
      </button>
    ))}
  </div>
);

export const IncomeTaxAdjuster: React.FC = () => {
  const { state, dispatch } = useGame();
  const isZh = state.language === 'zh';
  const initialLower = state.temp_tax_lower ?? state.tax_lower_class;
  const initialMiddle = state.temp_tax_middle ?? state.tax_middle_class;
  const initialUpper = state.temp_tax_upper ?? state.tax_upper_class;
  const draftLower = state.draft_tax_lower ?? initialLower;
  const draftMiddle = state.draft_tax_middle ?? initialMiddle;
  const draftUpper = state.draft_tax_upper ?? initialUpper;
  const adjustment = calculateIncomeTaxAdjustment(
    draftLower - initialLower,
    draftMiddle - initialMiddle,
    draftUpper - initialUpper,
  );
  const {
    workingClassSupport,
    middleClassSupport,
    upperClassSupport,
    faistasDissent,
  } = adjustment;
  const monthlyRevenueChange = getDraftRevenueChange(state, {
    tax_lower_class: draftLower,
    tax_middle_class: draftMiddle,
    tax_upper_class: draftUpper,
  });

  const adjustValue = (type: 'lower' | 'middle' | 'upper', current: number, amount: number) => {
    const value = Math.max(1, Math.min(100, current + amount));
    dispatch({
      type: 'UPDATE_TAX_DRAFT',
      payload: type === 'lower'
        ? { draft_tax_lower: value }
        : type === 'middle'
          ? { draft_tax_middle: value }
          : { draft_tax_upper: value },
    });
  };

  const rows = [
    { type: 'lower' as const, label: isZh ? '无产阶级所得税（工人、日雇农）' : 'Proletariat Income Tax', value: draftLower, initial: initialLower },
    { type: 'middle' as const, label: isZh ? '中产阶级所得税（自耕农、小资、知识分子）' : 'Middle Class Income Tax', value: draftMiddle, initial: initialMiddle },
    { type: 'upper' as const, label: isZh ? '上层阶级所得税（资产阶级、大地主）' : 'Upper Class Income Tax', value: draftUpper, initial: initialUpper },
  ];

  return (
    <div className="border-2 border-ink p-4 bg-paper/50 font-mono text-xs text-ink space-y-4 rounded-sm">
      <div className="font-bold text-center border-b border-ink/20 pb-2 uppercase text-sm">
        {isZh ? '所得税草案调整面板' : 'Income Tax Draft Panel'}
      </div>
      {rows.map(row => (
        <div key={row.type} className="flex flex-col gap-1 pb-2 border-b border-ink/5 last:border-b-0">
          <div className="flex justify-between font-bold gap-4">
            <span>{row.label}</span>
            <span className="text-cnt-red whitespace-nowrap">
              {row.value}% <span className="opacity-60 text-[10px]">({isZh ? '审查基准' : 'Review baseline'}: {row.initial}%)</span>
            </span>
          </div>
          <TaxButtons onAdjust={amount => adjustValue(row.type, row.value, amount)} />
        </div>
      ))}
      <div className="bg-paper border border-ink/20 p-3 flex flex-col gap-1.5 rounded-sm">
        <div className="font-bold border-b border-ink/10 pb-1 text-[11px] uppercase tracking-wide flex justify-between">
          <span>{isZh ? '草案预期后果' : 'Draft Consequences'}</span>
          <span className="text-cnt-red font-bold text-[10px]">{isZh ? '月结估算' : 'Monthly estimate'}</span>
        </div>
        <ul className="space-y-1.5 text-[11px]">
          <li className="flex justify-between">
            <span>{isZh ? '• 下一次月结税收变化：' : '• Next monthly tax revenue:'}</span>
            <span className={monthlyRevenueChange >= 0 ? 'text-green-700' : 'text-cnt-red'}>
              {monthlyRevenueChange >= 0 ? '+' : ''}{monthlyRevenueChange.toFixed(2)}M ₧
            </span>
          </li>
          {workingClassSupport !== 0 && <li className="flex justify-between"><span>{isZh ? '• 工人阶级支持：' : '• Working Class Support:'}</span><span>{workingClassSupport > 0 ? '+' : ''}{workingClassSupport.toFixed(1)}%</span></li>}
          {middleClassSupport !== 0 && <li className="flex justify-between"><span>{isZh ? '• 中产阶级支持：' : '• Middle Class Support:'}</span><span>{middleClassSupport > 0 ? '+' : ''}{middleClassSupport.toFixed(1)}%</span></li>}
          {upperClassSupport !== 0 && <li className="flex justify-between"><span>{isZh ? '• 上层阶级支持：' : '• Upper Class Support:'}</span><span>{upperClassSupport > 0 ? '+' : ''}{upperClassSupport.toFixed(1)}%</span></li>}
          {faistasDissent !== 0 && <li className="flex justify-between"><span>{isZh ? '• 无政府主义派系异议：' : '• Anarchist Dissent:'}</span><span>{faistasDissent > 0 ? '+' : ''}{faistasDissent.toFixed(1)}%</span></li>}
          {monthlyRevenueChange === 0 && workingClassSupport === 0 && middleClassSupport === 0 && upperClassSupport === 0 && faistasDissent === 0 && (
            <li className="text-ink-light italic text-center text-[10px] py-1">{isZh ? '草案尚未修改。' : 'No changes staged yet.'}</li>
          )}
        </ul>
        <p className="text-[10px] text-ink-light border-t border-ink/10 pt-1">
          {isZh ? '提交只锁定本组草案并结算政治反应；税率与国库均在结束审查前保持不变。' : 'Submitting locks this group and settles political reactions. Rates and treasury cash remain unchanged until the review ends.'}
        </p>
      </div>
    </div>
  );
};

export const TariffConsumptionAdjuster: React.FC = () => {
  const { state, dispatch } = useGame();
  const isZh = state.language === 'zh';
  const initialTariff = state.temp_tax_tariff ?? state.tax_tariff;
  const initialConsumption = state.temp_tax_consumption ?? state.tax_consumption;
  const draftTariff = state.draft_tax_tariff ?? initialTariff;
  const draftConsumption = state.draft_tax_consumption ?? initialConsumption;
  const adjustment = calculateTariffConsumptionAdjustment(
    draftTariff - initialTariff,
    draftConsumption - initialConsumption,
  );
  const { workingClassSupport, internationalFriction, faistasDissent } = adjustment;
  const monthlyRevenueChange = getDraftRevenueChange(state, {
    tax_tariff: draftTariff,
    tax_consumption: draftConsumption,
  });
  const adjustValue = (type: 'tariff' | 'consumption', current: number, amount: number) => {
    const value = Math.max(1, Math.min(100, current + amount));
    dispatch({
      type: 'UPDATE_TAX_DRAFT',
      payload: type === 'tariff' ? { draft_tax_tariff: value } : { draft_tax_consumption: value },
    });
  };

  return (
    <div className="border-2 border-ink p-4 bg-paper/50 font-mono text-xs text-ink space-y-4 rounded-sm">
      <div className="font-bold text-center border-b border-ink/20 pb-2 uppercase text-sm">
        {isZh ? '关税与消费税草案面板' : 'Tariff & Consumption Tax Draft Panel'}
      </div>
      <div className="flex flex-col gap-1 pb-2 border-b border-ink/5">
        <div className="flex justify-between font-bold gap-4">
          <span>{isZh ? '进口与贸易关税' : 'Import and Trade Tariff'}</span>
          <span className="text-cnt-red whitespace-nowrap">{draftTariff}% <span className="opacity-60 text-[10px]">({isZh ? '审查基准' : 'Review baseline'}: {initialTariff}%)</span></span>
        </div>
        <TaxButtons onAdjust={amount => adjustValue('tariff', draftTariff, amount)} />
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between font-bold gap-4">
          <span>{isZh ? '国内大众商品消费税' : 'Goods Consumption Tax'}</span>
          <span className="text-cnt-red whitespace-nowrap">{draftConsumption}% <span className="opacity-60 text-[10px]">({isZh ? '审查基准' : 'Review baseline'}: {initialConsumption}%)</span></span>
        </div>
        <TaxButtons onAdjust={amount => adjustValue('consumption', draftConsumption, amount)} />
      </div>
      <div className="bg-paper border border-ink/20 p-3 flex flex-col gap-1.5 rounded-sm">
        <div className="font-bold border-b border-ink/10 pb-1 text-[11px] uppercase tracking-wide flex justify-between">
          <span>{isZh ? '草案预期后果' : 'Draft Consequences'}</span>
          <span className="text-cnt-red font-bold text-[10px]">{isZh ? '月结估算' : 'Monthly estimate'}</span>
        </div>
        <ul className="space-y-1.5 text-[11px]">
          <li className="flex justify-between"><span>{isZh ? '• 下一次月结税收变化：' : '• Next monthly tax revenue:'}</span><span>{monthlyRevenueChange >= 0 ? '+' : ''}{monthlyRevenueChange.toFixed(2)}M ₧</span></li>
          {workingClassSupport !== 0 && <li className="flex justify-between"><span>{isZh ? '• 工人阶级支持：' : '• Working Class Support:'}</span><span>{workingClassSupport > 0 ? '+' : ''}{workingClassSupport.toFixed(1)}%</span></li>}
          {internationalFriction !== 0 && <li className="flex justify-between"><span>{isZh ? '• 对英法外交关系：' : '• UK / France Relations:'}</span><span>{internationalFriction > 0 ? '+' : ''}{internationalFriction.toFixed(1)}</span></li>}
          {faistasDissent !== 0 && <li className="flex justify-between"><span>{isZh ? '• 无政府主义派系异议：' : '• Anarchist Dissent:'}</span><span>{faistasDissent > 0 ? '+' : ''}{faistasDissent.toFixed(1)}%</span></li>}
          {monthlyRevenueChange === 0 && workingClassSupport === 0 && internationalFriction === 0 && faistasDissent === 0 && (
            <li className="text-ink-light italic text-center text-[10px] py-1">{isZh ? '草案尚未修改。' : 'No changes staged yet.'}</li>
          )}
        </ul>
        <p className="text-[10px] text-ink-light border-t border-ink/10 pt-1">
          {isZh ? '外交摩擦、阶级支持与派系异议在提交时生效；税收只在以后月结入账，不即时增加国库或外汇。' : 'Diplomatic friction, class support and dissent settle on submission. Tax revenue enters only through later monthly settlements.'}
        </p>
      </div>
    </div>
  );
};

export const fiscalPolicyIncomeTaxesEvent: GameEvent = {
  id: 'fiscal_policy_income_taxes',
  title: 'Fiscal Policy: Income Taxes',
  titleZh: '财政政策：所得税草案',
  description: 'Edit the income-tax draft against the immutable baseline captured when this review began.',
  descriptionZh: '依据本次财政审查开始时保存的不可变基准，修改所得税独立草案。',
  renderContent: () => React.createElement(IncomeTaxAdjuster, null),
  options: [
    {
      text: 'Submit Income Tax Draft',
      textZh: '提交并锁定本次所得税草案',
      subtitle: 'Lock this group for the review and settle its political reaction once.',
      subtitleZh: '本次审查中锁定该税种组，并一次性结算政治反应。',
      condition: state => state.fiscal_income_tax_submitted !== true,
      unavailableSubtitle: () => 'This tax group has already been submitted during this review.',
      unavailableSubtitleZh: () => '该税种组在本次审查中已经提交，不能重复结算。',
      effect: (state: GameState) => {
        if (state.fiscal_income_tax_submitted) return { currentEvent: withCurrentDate(fiscalPolicyEvent, state) };
        const adjustment = calculateIncomeTaxAdjustment(
          (state.draft_tax_lower ?? state.tax_lower_class) - (state.temp_tax_lower ?? state.tax_lower_class),
          (state.draft_tax_middle ?? state.tax_middle_class) - (state.temp_tax_middle ?? state.tax_middle_class),
          (state.draft_tax_upper ?? state.tax_upper_class) - (state.temp_tax_upper ?? state.tax_upper_class),
        );
        let classes = state.classes;
        classes = adjustClassSupport(classes, 'Obreros', 'CNT_FAI', adjustment.workingClassSupport);
        classes = adjustClassSupport(classes, 'Braceros', 'CNT_FAI', adjustment.workingClassSupport);
        classes = adjustClassSupport(classes, 'Labradores', 'CNT_FAI', adjustment.middleClassSupport);
        classes = adjustClassSupport(classes, 'PequenaBurguesia', 'CNT_FAI', adjustment.middleClassSupport);
        classes = adjustClassSupport(classes, 'Intelectuales', 'CNT_FAI', adjustment.middleClassSupport);
        classes = adjustClassSupport(classes, 'Burguesia', 'CNT_FAI', adjustment.upperClassSupport);
        classes = adjustClassSupport(classes, 'Latifundistas', 'CNT_FAI', adjustment.upperClassSupport);
        return {
          classes,
          factions: adjustFactionDissents(state.factions, {
            Faistas: adjustment.faistasDissent,
            Puristas: adjustment.puristasDissent,
          }),
          fiscal_income_tax_submitted: true,
          currentEvent: withCurrentDate(fiscalPolicyEvent, state),
        };
      },
    },
    {
      text: 'Discard Income Tax Draft Changes',
      textZh: '放弃所得税草案修改并返回',
      subtitle: 'Reset this group to the review baseline.',
      subtitleZh: '将该税种组恢复至本次审查基准。',
      effect: (state: GameState) => ({
        draft_tax_lower: state.temp_tax_lower ?? state.tax_lower_class,
        draft_tax_middle: state.temp_tax_middle ?? state.tax_middle_class,
        draft_tax_upper: state.temp_tax_upper ?? state.tax_upper_class,
        currentEvent: withCurrentDate(fiscalPolicyEvent, state),
      }),
    },
  ],
};

export const fiscalPolicyTariffConsumptionEvent: GameEvent = {
  id: 'fiscal_policy_tariff_consumption',
  title: 'Fiscal Policy: Tariffs & Consumption Taxes',
  titleZh: '财政政策：关税与消费税草案',
  description: 'Edit trade and consumption taxes without changing the rates currently used by the economy.',
  descriptionZh: '修改关税与消费税独立草案；经济系统在审查结束前继续使用现行税率。',
  renderContent: () => React.createElement(TariffConsumptionAdjuster, null),
  options: [
    {
      text: 'Submit Tariff and Consumption Tax Draft',
      textZh: '提交并锁定关税与消费税草案',
      subtitle: 'Lock this group and settle social and diplomatic reactions once.',
      subtitleZh: '锁定该税种组，并一次性结算社会与外交反应。',
      condition: state => state.fiscal_trade_tax_submitted !== true,
      unavailableSubtitle: () => 'This tax group has already been submitted during this review.',
      unavailableSubtitleZh: () => '该税种组在本次审查中已经提交，不能重复结算。',
      effect: (state: GameState) => {
        if (state.fiscal_trade_tax_submitted) return { currentEvent: withCurrentDate(fiscalPolicyEvent, state) };
        const adjustment = calculateTariffConsumptionAdjustment(
          (state.draft_tax_tariff ?? state.tax_tariff) - (state.temp_tax_tariff ?? state.tax_tariff),
          (state.draft_tax_consumption ?? state.tax_consumption) - (state.temp_tax_consumption ?? state.tax_consumption),
        );
        let classes = state.classes;
        classes = adjustClassSupport(classes, 'Obreros', 'CNT_FAI', adjustment.workingClassSupport);
        classes = adjustClassSupport(classes, 'Braceros', 'CNT_FAI', adjustment.workingClassSupport);
        return {
          classes,
          factions: adjustFactionDissents(state.factions, {
            Faistas: adjustment.faistasDissent,
            Puristas: adjustment.puristasDissent,
          }),
          relations: {
            ...state.relations,
            uk: Math.max(0, Math.min(100, state.relations.uk + adjustment.internationalFriction)),
            france: Math.max(0, Math.min(100, state.relations.france + adjustment.internationalFriction)),
          },
          fiscal_trade_tax_submitted: true,
          currentEvent: withCurrentDate(fiscalPolicyEvent, state),
        };
      },
    },
    {
      text: 'Discard Tariff and Consumption Tax Draft Changes',
      textZh: '放弃关税与消费税草案修改并返回',
      subtitle: 'Reset this group to the review baseline.',
      subtitleZh: '将该税种组恢复至本次审查基准。',
      effect: (state: GameState) => ({
        draft_tax_tariff: state.temp_tax_tariff ?? state.tax_tariff,
        draft_tax_consumption: state.temp_tax_consumption ?? state.tax_consumption,
        currentEvent: withCurrentDate(fiscalPolicyEvent, state),
      }),
    },
  ],
};

export const fiscalPolicyEvent: GameEvent = {
  id: 'fiscal_policy_event',
  title: 'Fiscal Policy Review',
  titleZh: '财政政策审查',
  description: 'The baseline is frozen. Submit each tax group at most once, then conclude the review to commit every rate together.',
  descriptionZh: '审查基准已经冻结。每个税种组最多提交一次；结束审查时，所有草案税率才统一生效。',
  options: [
    {
      text: 'Edit Income Tax Draft',
      textZh: '修改所得税草案',
      subtitle: 'Open the income-tax draft without changing current rates.',
      subtitleZh: '打开所得税草案；现行税率保持不变。',
      condition: state => state.fiscal_income_tax_submitted !== true,
      unavailableSubtitle: () => 'Income taxes have already been submitted in this review.',
      unavailableSubtitleZh: () => '所得税组已在本次审查中提交。',
      effect: (state: GameState) => ({ currentEvent: withCurrentDate(fiscalPolicyIncomeTaxesEvent, state) }),
    },
    {
      text: 'Edit Tariff & Consumption Tax Draft',
      textZh: '修改关税与消费税草案',
      subtitle: 'Open the trade-tax draft without changing current rates.',
      subtitleZh: '打开关税与消费税草案；现行税率保持不变。',
      condition: state => state.fiscal_trade_tax_submitted !== true,
      unavailableSubtitle: () => 'Trade taxes have already been submitted in this review.',
      unavailableSubtitleZh: () => '关税与消费税组已在本次审查中提交。',
      effect: (state: GameState) => ({ currentEvent: withCurrentDate(fiscalPolicyTariffConsumptionEvent, state) }),
    },
    {
      text: 'Conclude Review and Enact All Draft Rates',
      textZh: '结束财政审查并统一实施全部草案税率',
      subtitle: 'Commit the drafts once. Revenue will be collected only during future monthly settlements.',
      subtitleZh: '一次性写入全部草案；税收只在之后的月结中入账。',
      effect: (state: GameState) => ({
        tax_lower_class: state.draft_tax_lower ?? state.tax_lower_class,
        tax_middle_class: state.draft_tax_middle ?? state.tax_middle_class,
        tax_upper_class: state.draft_tax_upper ?? state.tax_upper_class,
        tax_tariff: state.draft_tax_tariff ?? state.tax_tariff,
        tax_consumption: state.draft_tax_consumption ?? state.tax_consumption,
        temp_tax_lower: undefined,
        temp_tax_middle: undefined,
        temp_tax_upper: undefined,
        temp_tax_tariff: undefined,
        temp_tax_consumption: undefined,
        draft_tax_lower: undefined,
        draft_tax_middle: undefined,
        draft_tax_upper: undefined,
        draft_tax_tariff: undefined,
        draft_tax_consumption: undefined,
        fiscal_income_tax_submitted: undefined,
        fiscal_trade_tax_submitted: undefined,
        fiscal_policy_timer: 6,
        currentEvent: null,
      }),
    },
  ],
};

export const fiscalPolicy: Card = {
  id: 'fiscal_policy',
  title: 'Fiscal Policy',
  titleZh: '财政政策',
  type: 'Government',
  description: 'Open a review with a frozen tax baseline, prepare independent drafts, and enact them together.',
  descriptionZh: '冻结现行税率为审查基准，分别编制税率草案，并在结束审查时统一实施。',
  cost: 1,
  condition: (state: GameState) => state.cntStance === 'govern'
    && state.ministers.finance === 'CNT'
    && (state.fiscal_policy_timer || 0) <= 0,
  effect: (state: GameState) => ({
    temp_tax_lower: state.tax_lower_class,
    temp_tax_middle: state.tax_middle_class,
    temp_tax_upper: state.tax_upper_class,
    temp_tax_tariff: state.tax_tariff,
    temp_tax_consumption: state.tax_consumption,
    draft_tax_lower: state.tax_lower_class,
    draft_tax_middle: state.tax_middle_class,
    draft_tax_upper: state.tax_upper_class,
    draft_tax_tariff: state.tax_tariff,
    draft_tax_consumption: state.tax_consumption,
    fiscal_income_tax_submitted: false,
    fiscal_trade_tax_submitted: false,
    currentEvent: withCurrentDate(fiscalPolicyEvent, state),
  }),
};
