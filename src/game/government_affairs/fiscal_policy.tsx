import React from 'react';
import { Card, GameState, GameEvent } from '../types';
import { useGame } from '../GameContext';
import { adjustClassSupport, adjustFactionDissents } from '../utils';

// Define the custom Adjuster components
export const IncomeTaxAdjuster: React.FC = () => {
  const { state, dispatch } = useGame();
  const isZh = state.language === 'zh';

  const initial_lower = state.temp_tax_lower ?? state.tax_lower_class;
  const initial_middle = state.temp_tax_middle ?? state.tax_middle_class;
  const initial_upper = state.temp_tax_upper ?? state.tax_upper_class;

  const delta_lower = state.tax_lower_class - initial_lower;
  const delta_middle = state.tax_middle_class - initial_middle;
  const delta_upper = state.tax_upper_class - initial_upper;

  // Calculate predicted gains
  let budgetChange = 0;
  let lowerClassSupport = 0;
  let middleClassSupport = 0;
  let upperClassSupport = 0;
  let radicalDissentChange = 0;

  // Lower Tax Impacts
  if (delta_lower < 0) {
    lowerClassSupport += Math.abs(delta_lower) * 1.5;
    budgetChange -= Math.abs(delta_lower) * 0.15;
  } else if (delta_lower > 0) {
    lowerClassSupport -= delta_lower * 2.0;
    radicalDissentChange += delta_lower * 1.0;
    budgetChange += delta_lower * 0.20;
  }

  // Middle Tax Impacts
  if (delta_middle > 0) {
    middleClassSupport -= delta_middle * 1.0;
    budgetChange += delta_middle * 0.15;
  } else if (delta_middle < 0) {
    middleClassSupport += Math.abs(delta_middle) * 0.8;
    budgetChange -= Math.abs(delta_middle) * 0.10;
  }

  // Upper Tax Impacts
  if (delta_upper > 0) {
    upperClassSupport -= delta_upper * 1.5;
    budgetChange += delta_upper * 0.25;
    radicalDissentChange -= delta_upper * 0.4;
  } else if (delta_upper < 0) {
    radicalDissentChange += Math.abs(delta_upper) * 1.5;
    upperClassSupport += Math.abs(delta_upper) * 0.3;
    budgetChange -= Math.abs(delta_upper) * 0.20;
  }

  const adjustValue = (type: 'lower' | 'middle' | 'upper', amount: number) => {
    let current = 0;
    if (type === 'lower') current = state.tax_lower_class;
    if (type === 'middle') current = state.tax_middle_class;
    if (type === 'upper') current = state.tax_upper_class;

    const newVal = Math.max(1, Math.min(100, current + amount));
    dispatch({
      type: 'UPDATE_TAXES',
      payload: {
        [`tax_${type}_class`]: newVal
      }
    });
  };

  return (
    <div className="border-2 border-ink p-4 bg-paper/50 font-mono text-xs text-ink space-y-4 rounded-sm">
      <div className="font-bold text-center border-b border-ink/20 pb-2 uppercase text-sm">
        {isZh ? '所得税率调整面板' : 'Income Tax Adjustment Panel'}
      </div>

      {/* Tax Lower Class */}
      <div className="flex flex-col gap-1 pb-2 border-b border-ink/5">
        <div className="flex justify-between font-bold">
          <span>{isZh ? '无产阶级所得税 (Obreros, Braceros)' : 'Proletariat Income Tax (Obreros, Braceros)'}</span>
          <span className="text-cnt-red">{state.tax_lower_class}% <span className="opacity-60 text-[10px]">({isZh ? '初始' : 'Initial'}: {initial_lower}%)</span></span>
        </div>
        <div className="flex gap-2 justify-end mt-1">
          <button onClick={() => adjustValue('lower', -5)} className="px-2 py-0.5 border border-ink hover:bg-ink hover:text-paper font-bold">-5%</button>
          <button onClick={() => adjustValue('lower', -1)} className="px-2 py-0.5 border border-ink hover:bg-ink hover:text-paper font-bold">-1%</button>
          <button onClick={() => adjustValue('lower', 1)} className="px-2 py-0.5 border border-ink hover:bg-ink hover:text-paper font-bold">+1%</button>
          <button onClick={() => adjustValue('lower', 5)} className="px-2 py-0.5 border border-ink hover:bg-ink hover:text-paper font-bold">+5%</button>
        </div>
      </div>

      {/* Tax Middle Class */}
      <div className="flex flex-col gap-1 pb-2 border-b border-ink/5">
        <div className="flex justify-between font-bold">
          <span>{isZh ? '中产阶级所得税 (Labradores, Pequeña Burguesía, Intelectuales)' : 'Middle Class Income Tax (Labradores, Pequeña Burguesía, Intelectuales)'}</span>
          <span className="text-cnt-red">{state.tax_middle_class}% <span className="opacity-60 text-[10px]">({isZh ? '初始' : 'Initial'}: {initial_middle}%)</span></span>
        </div>
        <div className="flex gap-2 justify-end mt-1">
          <button onClick={() => adjustValue('middle', -5)} className="px-2 py-0.5 border border-ink hover:bg-ink hover:text-paper font-bold">-5%</button>
          <button onClick={() => adjustValue('middle', -1)} className="px-2 py-0.5 border border-ink hover:bg-ink hover:text-paper font-bold">-1%</button>
          <button onClick={() => adjustValue('middle', 1)} className="px-2 py-0.5 border border-ink hover:bg-ink hover:text-paper font-bold">+1%</button>
          <button onClick={() => adjustValue('middle', 5)} className="px-2 py-0.5 border border-ink hover:bg-ink hover:text-paper font-bold">+5%</button>
        </div>
      </div>

      {/* Tax Upper Class */}
      <div className="flex flex-col gap-1 pb-2">
        <div className="flex justify-between font-bold">
          <span>{isZh ? '上层阶级所得税 (Burguesía, Latifundistas)' : 'Upper Class Income Tax (Burguesía, Latifundistas)'}</span>
          <span className="text-cnt-red">{state.tax_upper_class}% <span className="opacity-60 text-[10px]">({isZh ? '初始' : 'Initial'}: {initial_upper}%)</span></span>
        </div>
        <div className="flex gap-2 justify-end mt-1">
          <button onClick={() => adjustValue('upper', -5)} className="px-2 py-0.5 border border-ink hover:bg-ink hover:text-paper font-bold">-5%</button>
          <button onClick={() => adjustValue('upper', -1)} className="px-2 py-0.5 border border-ink hover:bg-ink hover:text-paper font-bold">-1%</button>
          <button onClick={() => adjustValue('upper', 1)} className="px-2 py-0.5 border border-ink hover:bg-ink hover:text-paper font-bold">+1%</button>
          <button onClick={() => adjustValue('upper', 5)} className="px-2 py-0.5 border border-ink hover:bg-ink hover:text-paper font-bold">+5%</button>
        </div>
      </div>

      {/* Predictions Section */}
      <div className="bg-paper border border-ink/20 p-3 flex flex-col gap-1.5 rounded-sm">
        <div className="font-bold border-b border-ink/10 pb-1 text-[11px] uppercase tracking-wide flex justify-between">
          <span>{isZh ? '改革预期社会与经济后果:' : 'Predicted Reform Consequences:'}</span>
          <span className="text-cnt-red font-bold text-[10px]">{isZh ? '实时估算' : 'Real-time Estimate'}</span>
        </div>
        <ul className="space-y-1.5 text-[11px]">
          <li className="flex justify-between">
            <span>{isZh ? '• 预估国家财政预算流变:' : '• Est. Budget Impact:'}</span>
            <span className={budgetChange >= 0 ? 'text-green-700' : 'text-cnt-red'}>
              {budgetChange >= 0 ? '+' : ''}{budgetChange.toFixed(2)}M ₧
            </span>
          </li>
          {lowerClassSupport !== 0 && (
            <li className="flex justify-between">
              <span>{isZh ? '• 工人日雇农 (Working Class) 对我们支持率变动:' : '• Working Class Support:'}</span>
              <span className={lowerClassSupport >= 0 ? 'text-green-700 font-bold' : 'text-cnt-red'}>
                {lowerClassSupport >= 0 ? '+' : ''}{lowerClassSupport.toFixed(1)}%
              </span>
            </li>
          )}
          {middleClassSupport !== 0 && (
            <li className="flex justify-between">
              <span>{isZh ? '• 小资专业雇农 (Middle Class) 对我们支持率变动:' : '• Middle Class Support:'}</span>
              <span className={middleClassSupport >= 0 ? 'text-green-700 font-bold' : 'text-cnt-red'}>
                {middleClassSupport >= 0 ? '+' : ''}{middleClassSupport.toFixed(1)}%
              </span>
            </li>
          )}
          {upperClassSupport !== 0 && (
            <li className="flex justify-between">
              <span>{isZh ? '• 精英大佬阶层 (Upper Class) 对我们支持率变动:' : '• Upper Class Support:'}</span>
              <span className={upperClassSupport >= 0 ? 'text-green-700 font-bold' : 'text-cnt-red'}>
                {upperClassSupport >= 0 ? '+' : ''}{upperClassSupport.toFixed(1)}%
              </span>
            </li>
          )}
          {radicalDissentChange !== 0 && (
            <li className="flex justify-between">
              <span>{isZh ? '• CNT 核心无政府主义派系 (Faistas, Puristas) 不满值变动:' : '• Anarchist Dissent:'}</span>
              <span className={radicalDissentChange > 0 ? 'text-cnt-red font-bold' : 'text-green-700'}>
                {radicalDissentChange > 0 ? '+' : ''}{radicalDissentChange.toFixed(1)}%
              </span>
            </li>
          )}
          {budgetChange === 0 && lowerClassSupport === 0 && middleClassSupport === 0 && upperClassSupport === 0 && radicalDissentChange === 0 && (
            <li className="text-ink-light italic text-center text-[10px] py-1">{isZh ? '数字无变化，尚未作出所得税率的改革调整。' : 'No changes staged yet.'}</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export const TariffConsumptionAdjuster: React.FC = () => {
  const { state, dispatch } = useGame();
  const isZh = state.language === 'zh';

  const initial_tariff = state.temp_tax_tariff ?? state.tax_tariff;
  const initial_consumption = state.temp_tax_consumption ?? state.tax_consumption;

  const delta_tariff = state.tax_tariff - initial_tariff;
  const delta_consumption = state.tax_consumption - initial_consumption;

  let budgetChange = 0;
  let lowerClassSupport = 0;
  let radicalDissentChange = 0;
  let interRelationsChange = 0;
  let forexChange = 0;

  // Tariffs
  if (delta_tariff > 0) {
    budgetChange += delta_tariff * 0.15;
    interRelationsChange -= delta_tariff * 0.5;
    forexChange += delta_tariff * 1.0;
  } else if (delta_tariff < 0) {
    budgetChange -= Math.abs(delta_tariff) * 0.12;
    interRelationsChange += Math.abs(delta_tariff) * 0.3;
  }

  // Consumption
  if (delta_consumption < 0) {
    lowerClassSupport += Math.abs(delta_consumption) * 1.0;
    budgetChange -= Math.abs(delta_consumption) * 0.18;
  } else if (delta_consumption > 0) {
    lowerClassSupport -= delta_consumption * 1.5;
    budgetChange += delta_consumption * 0.22;
    radicalDissentChange += delta_consumption * 0.8;
  }

  const adjustValue = (type: 'tariff' | 'consumption', amount: number) => {
    let current = 0;
    if (type === 'tariff') current = state.tax_tariff;
    if (type === 'consumption') current = state.tax_consumption;

    const newVal = Math.max(1, Math.min(100, current + amount));
    dispatch({
      type: 'UPDATE_TAXES',
      payload: {
        [`tax_${type}`]: newVal
      }
    });
  };

  return (
    <div className="border-2 border-ink p-4 bg-paper/50 font-mono text-xs text-ink space-y-4 rounded-sm">
      <div className="font-bold text-center border-b border-ink/20 pb-2 uppercase text-sm">
        {isZh ? '关税与消费税率调整面板' : 'Tariff & Consumption Tax Adjustments'}
      </div>

      {/* Tax Tariff */}
      <div className="flex flex-col gap-1 pb-2 border-b border-ink/5">
        <div className="flex justify-between font-bold">
          <span>{isZh ? '进口与贸易国境关税 (Tariff)' : 'Import and Trade Tariff (Tariff)'}</span>
          <span className="text-cnt-red">{state.tax_tariff}% <span className="opacity-60 text-[10px]">({isZh ? '初始' : 'Initial'}: {initial_tariff}%)</span></span>
        </div>
        <div className="flex gap-2 justify-end mt-1">
          <button onClick={() => adjustValue('tariff', -5)} className="px-2 py-0.5 border border-ink hover:bg-ink hover:text-paper font-bold">-5%</button>
          <button onClick={() => adjustValue('tariff', -1)} className="px-2 py-0.5 border border-ink hover:bg-ink hover:text-paper font-bold">-1%</button>
          <button onClick={() => adjustValue('tariff', 1)} className="px-2 py-0.5 border border-ink hover:bg-ink hover:text-paper font-bold">+1%</button>
          <button onClick={() => adjustValue('tariff', 5)} className="px-2 py-0.5 border border-ink hover:bg-ink hover:text-paper font-bold">+5%</button>
        </div>
      </div>

      {/* Tax Consumption */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between font-bold">
          <span>{isZh ? '国内大众商品消费税 (Consumption Tax)' : 'Goods Consumption Tax (Consumption Tax)'}</span>
          <span className="text-cnt-red">{state.tax_consumption}% <span className="opacity-60 text-[10px]">({isZh ? '初始' : 'Initial'}: {initial_consumption}%)</span></span>
        </div>
        <div className="flex gap-2 justify-end mt-1">
          <button onClick={() => adjustValue('consumption', -5)} className="px-2 py-0.5 border border-ink hover:bg-ink hover:text-paper font-bold">-5%</button>
          <button onClick={() => adjustValue('consumption', -1)} className="px-2 py-0.5 border border-ink hover:bg-ink hover:text-paper font-bold">-1%</button>
          <button onClick={() => adjustValue('consumption', 1)} className="px-2 py-0.5 border border-ink hover:bg-ink hover:text-paper font-bold">+1%</button>
          <button onClick={() => adjustValue('consumption', 5)} className="px-2 py-0.5 border border-ink hover:bg-ink hover:text-paper font-bold">+5%</button>
        </div>
      </div>

      {/* Predictions Section */}
      <div className="bg-paper border border-ink/20 p-3 flex flex-col gap-1.5 rounded-sm">
        <div className="font-bold border-b border-ink/10 pb-1 text-[11px] uppercase tracking-wide flex justify-between">
          <span>{isZh ? '改革预期社会与经济后果:' : 'Predicted Reform Consequences:'}</span>
          <span className="text-cnt-red font-bold text-[10px]">{isZh ? '实时估算' : 'Real-time Estimate'}</span>
        </div>
        <ul className="space-y-1.5 text-[11px]">
          <li className="flex justify-between">
            <span>{isZh ? '• 预估国家财政预算流变:' : '• Est. Budget Impact:'}</span>
            <span className={budgetChange >= 0 ? 'text-green-700' : 'text-cnt-red'}>
              {budgetChange >= 0 ? '+' : ''}{budgetChange.toFixed(2)}M ₧
            </span>
          </li>
          {lowerClassSupport !== 0 && (
            <li className="flex justify-between">
              <span>{isZh ? '• 工人农工 (Working Class) 支持率变动:' : '• Working Class Support:'}</span>
              <span className={lowerClassSupport >= 0 ? 'text-green-700 font-bold' : 'text-cnt-red'}>
                {lowerClassSupport >= 0 ? '+' : ''}{lowerClassSupport.toFixed(1)}%
              </span>
            </li>
          )}
          {forexChange !== 0 && (
            <li className="flex justify-between">
              <span>{isZh ? '• 外汇/黄金国库流动变动:' : '• Treasury Forex Change:'}</span>
              <span className={forexChange >= 0 ? 'text-green-700 font-bold' : 'text-cnt-red'}>
                {forexChange >= 0 ? '+' : ''}{forexChange.toFixed(1)}M ₧
              </span>
            </li>
          )}
          {interRelationsChange !== 0 && (
            <li className="flex justify-between">
              <span>{isZh ? '• 西英法国际关系外交摩擦:' : '• Entente Relations (UK / France):'}</span>
              <span className={interRelationsChange >= 0 ? 'text-green-700 font-bold' : 'text-cnt-red'}>
                {interRelationsChange >= 0 ? '+' : ''}{interRelationsChange.toFixed(1)}
              </span>
            </li>
          )}
          {radicalDissentChange !== 0 && (
            <li className="flex justify-between">
              <span>{isZh ? '• CNT 核心无政府主义派系不满值变动:' : '• Anarchist Dissent:'}</span>
              <span className={radicalDissentChange > 0 ? 'text-cnt-red font-bold' : 'text-green-700'}>
                {radicalDissentChange > 0 ? '+' : ''}{radicalDissentChange.toFixed(1)}%
              </span>
            </li>
          )}
          {budgetChange === 0 && lowerClassSupport === 0 && radicalDissentChange === 0 && interRelationsChange === 0 && forexChange === 0 && (
            <li className="text-ink-light italic text-center text-[10px] py-1">{isZh ? '数字无变化，尚未作出关税消费税的改革调整。' : 'No changes staged yet.'}</li>
          )}
        </ul>
      </div>
    </div>
  );
};

// Main Fiscal Policy Event Definitions
export const fiscalPolicyIncomeTaxesEvent: GameEvent = {
  id: 'fiscal_policy_income_taxes',
  title: 'Fiscal Policy: Income Taxes',
  titleZh: '财政政策：所得税率改革案',
  description: 'Our financial advisors can audit the income brackets. We can increase rates on the upper classes to fund cooperative initiatives, or ease burdens on laborers to increase living standards.',
  descriptionZh: '我们的财政顾问团正在审计所得税阶梯。我们可以加征资产阶级所得税以资助生产集体化与供销合作，或削减普罗大众的税负，以提高其生活水平。',
  renderContent: () => React.createElement(IncomeTaxAdjuster, null),
  options: [
    {
      text: 'Submit and Authorize Adjusted Income Tax Rates',
      textZh: '提交并批准通过所得税率调整法案',
      subtitle: 'Apply the staged income tax rates and return to the fiscal policy menu.',
      subtitleZh: '落实当前暂定的所得税率，并返回财政政策菜单。',
      effect: (state: GameState) => {
        const initial_lower = state.temp_tax_lower ?? state.tax_lower_class;
        const initial_middle = state.temp_tax_middle ?? state.tax_middle_class;
        const initial_upper = state.temp_tax_upper ?? state.tax_upper_class;

        const delta_lower = state.tax_lower_class - initial_lower;
        const delta_middle = state.tax_middle_class - initial_middle;
        const delta_upper = state.tax_upper_class - initial_upper;

        let working_class_support = 0;
        let middle_class_support = 0;
        let upper_class_support = 0;
        let budget_flow = 0;
        let faistas_dissent = 0;
        let puristas_dissent = 0;

        // Apply Lower class tax dynamic impacts
        if (delta_lower < 0) {
          working_class_support += Math.abs(delta_lower) * 1.5;
          budget_flow -= Math.abs(delta_lower) * 0.15;
        } else if (delta_lower > 0) {
          working_class_support -= delta_lower * 2.0;
          faistas_dissent += delta_lower * 1.0;
          puristas_dissent += delta_lower * 1.0;
          budget_flow += delta_lower * 0.20;
        }

        // Apply Middle class tax dynamic impacts
        if (delta_middle > 0) {
          middle_class_support -= delta_middle * 1.0;
          budget_flow += delta_middle * 0.15;
        } else if (delta_middle < 0) {
          middle_class_support += Math.abs(delta_middle) * 0.8;
          budget_flow -= Math.abs(delta_middle) * 0.10;
        }

        // Apply Upper class tax dynamic impacts
        if (delta_upper > 0) {
          upper_class_support -= delta_upper * 1.5;
          budget_flow += delta_upper * 0.25;
          faistas_dissent -= delta_upper * 0.4;
          puristas_dissent -= delta_upper * 0.4;
        } else if (delta_upper < 0) {
          faistas_dissent += Math.abs(delta_upper) * 1.5;
          puristas_dissent += Math.abs(delta_upper) * 1.5;
          upper_class_support += Math.abs(delta_upper) * 0.3;
          budget_flow -= Math.abs(delta_upper) * 0.20;
        }

        let newClasses = state.classes;
        // Working Class: Obreros + Braceros
        newClasses = adjustClassSupport(newClasses, 'Obreros', 'CNT_FAI', working_class_support);
        newClasses = adjustClassSupport(newClasses, 'Braceros', 'CNT_FAI', working_class_support);

        // Middle Class: Labradores + PequenaBurguesia + Intelectuales
        newClasses = adjustClassSupport(newClasses, 'Labradores', 'CNT_FAI', middle_class_support);
        newClasses = adjustClassSupport(newClasses, 'PequenaBurguesia', 'CNT_FAI', middle_class_support);
        newClasses = adjustClassSupport(newClasses, 'Intelectuales', 'CNT_FAI', middle_class_support);

        // Upper Class: Burguesia + Latifundistas
        newClasses = adjustClassSupport(newClasses, 'Burguesia', 'CNT_FAI', upper_class_support);
        newClasses = adjustClassSupport(newClasses, 'Latifundistas', 'CNT_FAI', upper_class_support);

        const newFactions = adjustFactionDissents(state.factions, {
          Faistas: faistas_dissent,
          Puristas: puristas_dissent
        });

        return {
          classes: newClasses,
          factions: newFactions,
          budget: Math.max(-30, state.budget + budget_flow),
          // Clear temp variables
          temp_tax_lower: undefined,
          temp_tax_middle: undefined,
          temp_tax_upper: undefined,
          currentEvent: fiscalPolicyEvent // return to main menu
        };
      }
    },
    {
      text: 'Cancel and Discard Staged Income Tax Changes',
      textZh: '放弃本次所得税率修改并返回',
      subtitle: 'Restore the previous income tax rates and return to the fiscal policy menu.',
      subtitleZh: '恢复原有所得税率，并返回财政政策菜单。',
      effect: (state: GameState) => ({
        // Restore values
        tax_lower_class: state.temp_tax_lower ?? state.tax_lower_class,
        tax_middle_class: state.temp_tax_middle ?? state.tax_middle_class,
        tax_upper_class: state.temp_tax_upper ?? state.tax_upper_class,
        // Clear temp variables
        temp_tax_lower: undefined,
        temp_tax_middle: undefined,
        temp_tax_upper: undefined,
        currentEvent: fiscalPolicyEvent // return to main menu
      })
    }
  ]
};

export const fiscalPolicyTariffConsumptionEvent: GameEvent = {
  id: 'fiscal_policy_tariff_consumption',
  title: 'Fiscal Policy: Tariffs & Consumption Taxes',
  titleZh: '财政政策：关税与国内消费税率改革',
  description: 'Adjust cross-border import tariffs to shield industries, or ease regressive consumption taxes on general household goods and foodstuffs to relieve impoverished laborers.',
  descriptionZh: '调整跨国进口商品的关税以保护国内集体化工业，或减轻大众商品消费税以在最大程度上给广大劳苦大众减负。',
  renderContent: () => React.createElement(TariffConsumptionAdjuster, null),
  options: [
    {
      text: 'Submit and Codify Tariff and Consumption Tax Rates',
      textZh: '提交并批准通过关税与消费税率法案',
      subtitle: 'Apply the staged tariff and consumption tax rates and return to the fiscal policy menu.',
      subtitleZh: '落实当前暂定的关税与消费税率，并返回财政政策菜单。',
      effect: (state: GameState) => {
        const initial_tariff = state.temp_tax_tariff ?? state.tax_tariff;
        const initial_consumption = state.temp_tax_consumption ?? state.tax_consumption;

        const delta_tariff = state.tax_tariff - initial_tariff;
        const delta_consumption = state.tax_consumption - initial_consumption;

        let working_class_support = 0;
        let budget_flow = 0;
        let faistas_dissent = 0;
        let puristas_dissent = 0;
        let international_friction = 0;
        let forex_gain = 0;

        // Tariffs
        if (delta_tariff > 0) {
          budget_flow += delta_tariff * 0.15;
          international_friction -= delta_tariff * 0.5;
          forex_gain += delta_tariff * 1.0;
        } else if (delta_tariff < 0) {
          budget_flow -= Math.abs(delta_tariff) * 0.12;
          international_friction += Math.abs(delta_tariff) * 0.3;
        }

        // Consumption
        if (delta_consumption < 0) {
          working_class_support += Math.abs(delta_consumption) * 1.0;
          budget_flow -= Math.abs(delta_consumption) * 0.18;
          faistas_dissent -= Math.abs(delta_consumption) * 0.5;
          puristas_dissent -= Math.abs(delta_consumption) * 0.5;
        } else if (delta_consumption > 0) {
          working_class_support -= delta_consumption * 1.5;
          budget_flow += delta_consumption * 0.22;
          faistas_dissent += delta_consumption * 0.8;
          puristas_dissent += delta_consumption * 0.8;
        }

        let newClasses = state.classes;
        // Working Class: Obreros + Braceros
        newClasses = adjustClassSupport(newClasses, 'Obreros', 'CNT_FAI', working_class_support);
        newClasses = adjustClassSupport(newClasses, 'Braceros', 'CNT_FAI', working_class_support);

        const newFactions = adjustFactionDissents(state.factions, {
          Faistas: faistas_dissent,
          Puristas: puristas_dissent
        });

        return {
          classes: newClasses,
          factions: newFactions,
          budget: Math.max(-30, state.budget + budget_flow),
          foreign_exchange: Math.max(0, Math.min(1000, state.foreign_exchange + forex_gain)),
          relations: {
            ...state.relations,
            uk: Math.max(0, Math.min(100, state.relations.uk + international_friction)),
            france: Math.max(0, Math.min(100, state.relations.france + international_friction))
          },
          // Clear temp variables
          temp_tax_tariff: undefined,
          temp_tax_consumption: undefined,
          currentEvent: fiscalPolicyEvent // return to main menu
        };
      }
    },
    {
      text: 'Cancel and Discard Tariff and Consumption Tax Changes',
      textZh: '放弃本次关税消费税修改并返回',
      subtitle: 'Restore the previous tariff and consumption tax rates and return to the fiscal policy menu.',
      subtitleZh: '恢复原有关税与消费税率，并返回财政政策菜单。',
      effect: (state: GameState) => ({
        // Restore values
        tax_tariff: state.temp_tax_tariff ?? state.tax_tariff,
        tax_consumption: state.temp_tax_consumption ?? state.tax_consumption,
        // Clear temp variables
        temp_tax_tariff: undefined,
        temp_tax_consumption: undefined,
        currentEvent: fiscalPolicyEvent // return to main menu
      })
    }
  ]
};

export const fiscalPolicyEvent: GameEvent = {
  id: 'fiscal_policy_event',
  title: 'Fiscal Policy',
  titleZh: '财政政策研判大议会',
  description: 'Now that the CNT controls the Ministry of Finance, we must decide how to manage our revenues, tax burdens, trade barriers, and state funding. Choose a specific sub-agenda to adjust, or execute a progressive social tax mobilization.',
  descriptionZh: '既然全国劳工联盟（CNT）全面掌控了财政部，我们必须对税收结构、公社预算、进出口壁垒和合作生产援助计划做出关键决定。请选择专属子法案议程进行专项修订，或推行全面财富再分配累进税制革命。',
  options: [
    {
      text: 'Reform Income Taxes (Proceed to submenu)',
      textZh: '向无产阶级免税倾斜：改革所得税法案（进入所得税率子菜单）',
      subtitle: 'Open the income tax adjustment panel and stage changes before approval.',
      subtitleZh: '打开所得税率调整面板，在批准前暂存修改。',
      effect: (state: GameState) => ({
        // Ensure starting values are backed up if not already
        temp_tax_lower: state.temp_tax_lower ?? state.tax_lower_class,
        temp_tax_middle: state.temp_tax_middle ?? state.tax_middle_class,
        temp_tax_upper: state.temp_tax_upper ?? state.tax_upper_class,
        currentEvent: fiscalPolicyIncomeTaxesEvent
      })
    },
    {
      text: 'Modify Import Tariffs & Consumption Taxes (Proceed to submenu)',
      textZh: '促进公社工业与减负大众：调整关税与消费税（进入子菜单）',
      subtitle: 'Open the tariff and consumption tax panel and stage changes before approval.',
      subtitleZh: '打开关税与消费税调整面板，在批准前暂存修改。',
      effect: (state: GameState) => ({
        // Ensure starting values are backed up if not already
        temp_tax_tariff: state.temp_tax_tariff ?? state.tax_tariff,
        temp_tax_consumption: state.temp_tax_consumption ?? state.tax_consumption,
        currentEvent: fiscalPolicyTariffConsumptionEvent
      })
    },

    {
      text: 'Conclude Fiscal Policy Review',
      textZh: '结束国家财政政策审计，落实当前政策。',
      subtitle: 'Keep all current tax rates and trigger a standard policy cooldown.',
      subtitleZh: '保持所有现有税率不变，并执行标准的财政研判冷却。',
      effect: (state: GameState) => ({
        temp_tax_lower: undefined,
        temp_tax_middle: undefined,
        temp_tax_upper: undefined,
        temp_tax_tariff: undefined,
        temp_tax_consumption: undefined,
        fiscal_policy_timer: 6, // cooldown set
        currentEvent: null
      })
    }
  ]
};

export const fiscalPolicy: Card = {
  id: 'fiscal_policy',
  title: 'Fiscal Policy',
  titleZh: '财政政策',
  type: 'Government',
  description: 'Now that the CNT controls the Ministry of Finance, we can reshape taxes and tariffs according to libertarian communist principles.',
  descriptionZh: '既然全国劳工联盟掌控了财政部，我们就可以依照自由共产主义原则来重塑税收与关税。',
  cost: 1,
  condition: (state: GameState) => state.cntStance === 'govern' && (state.ministers.finance === 'CNT') && (state.fiscal_policy_timer || 0) <= 0,
  effect: (state: GameState) => {
    return {
      // Secure current state values before entering menus
      temp_tax_lower: state.tax_lower_class,
      temp_tax_middle: state.tax_middle_class,
      temp_tax_upper: state.tax_upper_class,
      temp_tax_tariff: state.tax_tariff,
      temp_tax_consumption: state.tax_consumption,
      currentEvent: fiscalPolicyEvent
    };
  }
};
