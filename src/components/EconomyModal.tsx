import React from 'react';
import { GameState } from '../game/types';
import { X, TrendingUp, Percent, Users, Landmark, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  dispatch: (action: any) => void;
  isZh: boolean;
}

export const EconomyModal: React.FC<Props> = ({ isOpen, onClose, state, dispatch, isZh }) => {
  if (!isOpen) return null;

  const handleAdjustTax = (taxKey: 'tax_lower_class' | 'tax_middle_class' | 'tax_upper_class' | 'tax_tariff' | 'tax_consumption', amount: number) => {
    const currentVal = state[taxKey] !== undefined ? (state[taxKey] as number) : 10;
    const newVal = Math.max(1, Math.min(100, currentVal + amount));
    dispatch({
      type: 'UPDATE_TAXES',
      payload: {
        [taxKey]: newVal
      }
    });
  };

  const isCivilWar = state.civilWarStatus === 'ongoing';

  // Calculate live estimation of monthly tax revenue
  const taxLowerRate = (state.tax_lower_class !== undefined ? state.tax_lower_class : 5) / 100;
  const taxMiddleRate = (state.tax_middle_class !== undefined ? state.tax_middle_class : 15) / 100;
  const taxUpperRate = (state.tax_upper_class !== undefined ? state.tax_upper_class : 25) / 100;
  const taxTarRate = (state.tax_tariff !== undefined ? state.tax_tariff : 10) / 100;
  const taxConsRate = (state.tax_consumption !== undefined ? state.tax_consumption : 8) / 100;

  const incomeTaxRev = (taxLowerRate * 4.0) + (taxMiddleRate * 3.5) + (taxUpperRate * 4.5);
  const tariffRev = taxTarRate * (isCivilWar ? 2.0 : 5.0);
  const consumptionTaxRev = taxConsRate * 8.0;
  const estimatedRevenue = incomeTaxRev + tariffRev + consumptionTaxRev;

  // Monthly expenditure estimate
  let estimatedExpenditures = 1.0;
  if (state.domesticPolicy.max_hours_law > 0) estimatedExpenditures += 0.3;
  if (state.domesticPolicy.min_wage > 0) estimatedExpenditures += 0.2;
  if (isCivilWar) estimatedExpenditures += 3.5;

  const estimatedDelta = estimatedRevenue - estimatedExpenditures;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-paper border-2 border-ink w-full max-w-5xl md:h-[85vh] flex flex-col shadow-2xl relative">
        
        {/* Header */}
        <div className="border-b-2 border-ink border-opacity-30 p-4 flex justify-between items-center bg-ink/5">
          <div className="flex items-center gap-2">
            <Landmark className="w-6 h-6 text-ink-light" />
            <h2 className="font-typewriter text-2xl font-bold">
              {isZh ? '国家财政与宏观经济管理' : 'State Treasury & National Economy'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-ink/10 transition-colors border border-transparent hover:border-ink"
            id="close-economy-modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Outer Split View */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden font-mono text-xs">
          
          {/* Left Column: National Balance sheet and Macro monitors */}
          <div className="flex-1 md:max-w-md border-r-0 md:border-r-2 border-ink border-opacity-30 p-5 overflow-y-auto flex flex-col gap-5 bg-ink/5">
            <div>
              <h3 className="font-typewriter text-base font-bold pb-1.5 border-b border-ink/20 uppercase tracking-wider mb-3">
                {isZh ? '宏观经济运行指标' : 'Macroeconomic Indicators'}
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Economy Growth */}
                <div className="bg-paper border border-ink/10 p-3 rounded-sm flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-ink-light mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-tight">{isZh ? '经济增长率' : 'GDP Growth'}</span>
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xl font-bold text-ink">
                    {(state.economy_growth !== undefined ? state.economy_growth : 2.5).toFixed(2)}%
                  </span>
                  <span className="text-[9px] text-ink-light mt-1">
                    {isZh ? '理想区间: 2% - 8%' : 'Optimal: 2% - 8%'}
                  </span>
                </div>

                {/* Inflation */}
                <div className="bg-paper border border-ink/10 p-3 rounded-sm flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-ink-light mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-tight">{isZh ? '通货膨胀率' : 'Inflation'}</span>
                    <Percent className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-xl font-bold ${(state.inflation_rate !== undefined ? state.inflation_rate : 3.5) > 15 ? 'text-cnt-red font-extrabold animate-pulse' : 'text-ink'}`}>
                    {(state.inflation_rate !== undefined ? state.inflation_rate : 3.5).toFixed(2)}%
                  </span>
                  <span className="text-[9px] text-ink-light mt-1">
                    {(state.inflation_rate !== undefined ? state.inflation_rate : 3.5) > 15 
                      ? (isZh ? '⚠️ 严重通膨' : '⚠️ Hyperinflation') 
                      : (isZh ? '正常区间: 1% - 6%' : 'Target: 1% - 6%')}
                  </span>
                </div>

                {/* Unemployment */}
                <div className="bg-paper border border-ink/10 p-3 rounded-sm flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-ink-light mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-tight">{isZh ? '失业率' : 'Unemployment'}</span>
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xl font-bold text-ink">
                    {(state.unemployment_rate !== undefined ? state.unemployment_rate : 11.2).toFixed(2)}%
                  </span>
                  <span className="text-[9px] text-ink-light mt-1">
                    {isZh ? '高失业率会导致民意下滑' : 'High rates damage regime support'}
                  </span>
                </div>

                {/* Budget treasury */}
                <div className="bg-paper border border-ink/10 p-3 rounded-sm flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-ink-light mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-tight">{isZh ? '国库盈余/赤字' : 'Treasury Reserve'}</span>
                    <Landmark className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-xl font-bold ${(state.budget !== undefined ? state.budget : 12.0) >= 0 ? 'text-green-700' : 'text-cnt-red'}`}>
                    {(state.budget !== undefined ? state.budget : 12.0).toFixed(2)}M ₧
                  </span>
                  <span className="text-[9px] text-ink-light mt-1">
                    {(state.budget !== undefined ? state.budget : 12.0) < -5 
                      ? (isZh ? '🔴 处于破产危机' : '🔴 Sovereign Debt risk') 
                      : (isZh ? '比塞塔本位储备' : 'Peseta standard')}
                  </span>
                </div>
              </div>
            </div>

            {/* Live budget accounting */}
            <div className="bg-paper border border-ink/30 p-4 rounded-sm flex flex-col gap-2.5 shadow-md">
              <h4 className="font-bold border-b border-ink/10 pb-1 text-ink uppercase tracking-wide text-xs">
                {isZh ? '国家财政收支估算/月' : 'Sovereign Budget Forecast (Monthly)'}
              </h4>
              
              <div className="flex flex-col gap-1.5 text-[11px] leading-relaxed">
                <div className="flex justify-between text-ink-light">
                  <span>{isZh ? '・所得税预计收入:' : '• Income Tax Revenue:'}</span>
                  <span className="font-bold text-ink">{incomeTaxRev.toFixed(2)}M ₧</span>
                </div>
                <div className="flex justify-between text-ink-light">
                  <span>{isZh ? '・关税预计收入:' : '• Tariffs Revenue:'}</span>
                  <span className="font-bold text-ink">{tariffRev.toFixed(2)}M ₧</span>
                </div>
                <div className="flex justify-between text-ink-light">
                  <span>{isZh ? '・消费税预计收入:' : '• Consumption Tax:'}</span>
                  <span className="font-bold text-ink">{consumptionTaxRev.toFixed(2)}M ₧</span>
                </div>
                
                <div className="h-px bg-ink/10 my-1" />
                
                <div className="flex justify-between text-green-700 font-bold">
                  <span>{isZh ? '【预计总财政收入】' : 'Total Revenue Estimate'}</span>
                  <span>+{estimatedRevenue.toFixed(2)}M ₧</span>
                </div>
                
                <div className="flex justify-between text-cnt-red font-bold">
                  <span>{isZh ? '【行政与政策总支出】' : 'Total Expenditures'}</span>
                  <span>-{estimatedExpenditures.toFixed(2)}M ₧</span>
                </div>

                <div className="h-px bg-ink/30 my-1"/>

                <div className="flex justify-between items-center">
                  <span className="font-bold text-ink">{isZh ? '每月预算净盈余:' : 'Net Monthly Surplus:'}</span>
                  <span className={`text-sm font-bold px-1.5 py-0.5 rounded-sm ${estimatedDelta >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-cnt-red'}`}>
                    {estimatedDelta >= 0 ? '+' : ''}{estimatedDelta.toFixed(2)}M ₧
                  </span>
                </div>
              </div>
            </div>

            {/* War effects warning */}
            {isCivilWar && (
              <div className="bg-red-50 border border-cnt-red/30 p-3.5 rounded-sm flex gap-2 text-cnt-red leading-relaxed shadow-sm">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold text-xs uppercase tracking-tight">{isZh ? '战时紧急经济状态' : 'Marshall State of War'}</span>
                  <p className="text-[10px] mt-0.5 text-red-900">
                    {isZh 
                      ? '西班牙内战正在进行！每月维持战争需要额外支出 3.5M ₧，对外国际贸易阻断导致关税收入缩减 60%，基础经济成长受到严重挫伤 -6.0%。'
                      : 'Civil war is raging! Military spending drains 3.5M ₧ monthly, tariff yields sliced by 60% due to trade collapse, and growth base slashed by -6.0%.'}
                  </p>
                </div>
              </div>
            )}

            {!isCivilWar && (
              <div className="bg-green-50 border border-green-800/20 p-3 text-green-800 leading-relaxed shadow-xs">
                <div className="flex items-center gap-1.5 font-bold text-[11px] mb-1">
                  <ShieldCheck className="w-4 h-4 text-green-700" />
                  <span>{isZh ? '和平时期平稳财政' : 'Peacetime Balanced Budget'}</span>
                </div>
                <p className="text-[10px] text-green-900/80 leading-normal">
                  {isZh 
                    ? '在没有全面内战的情况下，国家商业流动性充裕。增加税收可以积累超额盈余额度，但税率过高（特别是工作阶级税）会引起群众的愤怒或打击内需增长。'
                    : 'Unrestricted state operations. High taxation provides massive budgetary resources, but heavy working class income tax suppresses social support.'}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Tax policy adjusting workspace WITHOUT sliders */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 bg-paper bg-opacity-70">
            <h3 className="font-typewriter text-base font-bold pb-1.5 border-b border-ink/20 uppercase tracking-wider mb-2">
              {isZh ? '税收政策法案管理' : 'Tax Policy & Rate Regulation'}
            </h3>

            {/* The 5 Non-slider discrete cards */}
            
            {/* 1. Working Class (Lower Class) Income Tax */}
            <div className="border border-ink/20 p-4 rounded bg-paper-light shadow-sm hover:border-ink/50 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 bg-[#4c51bf] text-white font-bold text-[9px] rounded-xs uppercase tracking-tight">Lower Class</span>
                  <h4 className="font-bold text-ink text-[13px]">{isZh ? '无产阶级个人所得税' : 'Working Class Income Tax'}</h4>
                </div>
                <p className="text-[10px] text-ink-light leading-relaxed">
                  {isZh 
                    ? '对广大工农阶层直接课征所得税。轻微加征可以平抑高通货膨胀，但由于该阶层人口极其庞大，提高税率会直接大幅挫伤经济成长。'
                    : 'Direct tax on laborers and peasantry. Mild increases combat high inflation. However, due to large demographics, too high rates suppress national growth.'}
                </p>
              </div>
              
              <div className="flex-shrink-0 flex items-center gap-3">
                <span className="font-bold text-lg text-ink font-mono bg-ink/5 px-2 py-1 rounded w-16 text-center border border-ink/10">
                  {state.tax_lower_class !== undefined ? state.tax_lower_class : 5}%
                </span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleAdjustTax('tax_lower_class', -5)}
                    className="px-2 py-1 border border-ink text-xs font-bold bg-paper hover:bg-ink hover:text-paper transition-all cursor-pointer rounded-sm"
                  >-5%</button>
                  <button 
                    onClick={() => handleAdjustTax('tax_lower_class', -1)}
                    className="px-2 py-1 border border-ink text-xs font-bold bg-paper hover:bg-ink hover:text-paper transition-all cursor-pointer rounded-sm"
                  >-1%</button>
                  <button 
                    onClick={() => handleAdjustTax('tax_lower_class', 1)}
                    className="px-2 py-1 border border-ink text-xs font-bold bg-paper hover:bg-ink hover:text-paper transition-all cursor-pointer rounded-sm"
                  >+1%</button>
                  <button 
                    onClick={() => handleAdjustTax('tax_lower_class', 5)}
                    className="px-2 py-1 border border-ink text-xs font-bold bg-paper hover:bg-ink hover:text-paper transition-all cursor-pointer rounded-sm"
                  >+5%</button>
                </div>
              </div>
            </div>

            {/* 2. Middle Class Income Tax */}
            <div className="border border-ink/20 p-4 rounded bg-paper-light shadow-sm hover:border-ink/50 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 bg-[#d69e2e] text-white font-bold text-[9px] rounded-xs uppercase tracking-tight">Middle Class</span>
                  <h4 className="font-bold text-ink text-[13px]">{isZh ? '中产阶层个人所得税' : 'Middle Class Income Tax'}</h4>
                </div>
                <p className="text-[10px] text-ink-light leading-relaxed">
                  {isZh 
                    ? '针对中等收入群体（小官吏、商业主、富裕职员）的收入课税。在不严重伤害工农阶层的前提下稳健增加财政收入，但由于伤害其购买力，增加本税会使失业率和经济负荷升高。'
                    : 'Progressive tax on minor civil servants, shopkeepers, and white-collar workers. Generates buffer revenue with reduced populist blowback, but marginally dampens local hiring.'}
                </p>
              </div>
              
              <div className="flex-shrink-0 flex items-center gap-3">
                <span className="font-bold text-lg text-ink font-mono bg-ink/5 px-2 py-1 rounded w-16 text-center border border-ink/10">
                  {state.tax_middle_class !== undefined ? state.tax_middle_class : 15}%
                </span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleAdjustTax('tax_middle_class', -5)}
                    className="px-2 py-1 border border-ink text-xs font-bold bg-paper hover:bg-ink hover:text-paper transition-all cursor-pointer rounded-sm"
                  >-5%</button>
                  <button 
                    onClick={() => handleAdjustTax('tax_middle_class', -1)}
                    className="px-2 py-1 border border-ink text-xs font-bold bg-paper hover:bg-ink hover:text-paper transition-all cursor-pointer rounded-sm"
                  >-1%</button>
                  <button 
                    onClick={() => handleAdjustTax('tax_middle_class', 1)}
                    className="px-2 py-1 border border-ink text-xs font-bold bg-paper hover:bg-ink hover:text-paper transition-all cursor-pointer rounded-sm"
                  >+1%</button>
                  <button 
                    onClick={() => handleAdjustTax('tax_middle_class', 5)}
                    className="px-2 py-1 border border-ink text-xs font-bold bg-paper hover:bg-ink hover:text-paper transition-all cursor-pointer rounded-sm"
                  >+5%</button>
                </div>
              </div>
            </div>

            {/* 3. Upper Class Income Tax */}
            <div className="border border-ink/20 p-4 rounded bg-paper-light shadow-sm hover:border-ink/50 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 bg-[#e53e3e] text-white font-bold text-[9px] rounded-xs uppercase tracking-tight">Upper Class</span>
                  <h4 className="font-bold text-ink text-[13px]">{isZh ? '有产阶级/大资本家所得税' : 'Upper Class Income Tax'}</h4>
                </div>
                <p className="text-[10px] text-ink-light leading-relaxed">
                  {isZh 
                    ? '针对大地主、金融寡头和工业巨头课征的高额资本出资税。最丰厚的特定财富蓄水池，但超高的税负会强力打击富余资本的再投资意向，导致社会失业率飙升，同时略微抑制通货膨胀。'
                    : 'Targeted high margin collection from grand landowners and industrial monopolies. Deep revenue yields, but overtaxing heavily chills local capital investments and spikes unemployment.'}
                </p>
              </div>
              
              <div className="flex-shrink-0 flex items-center gap-3">
                <span className="font-bold text-lg text-ink font-mono bg-ink/5 px-2 py-1 rounded w-16 text-center border border-ink/10">
                  {state.tax_upper_class !== undefined ? state.tax_upper_class : 25}%
                </span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleAdjustTax('tax_upper_class', -5)}
                    className="px-2 py-1 border border-ink text-xs font-bold bg-paper hover:bg-ink hover:text-paper transition-all cursor-pointer rounded-sm"
                  >-5%</button>
                  <button 
                    onClick={() => handleAdjustTax('tax_upper_class', -1)}
                    className="px-2 py-1 border border-ink text-xs font-bold bg-paper hover:bg-ink hover:text-paper transition-all cursor-pointer rounded-sm"
                  >-1%</button>
                  <button 
                    onClick={() => handleAdjustTax('tax_upper_class', 1)}
                    className="px-2 py-1 border border-ink text-xs font-bold bg-paper hover:bg-ink hover:text-paper transition-all cursor-pointer rounded-sm"
                  >+1%</button>
                  <button 
                    onClick={() => handleAdjustTax('tax_upper_class', 5)}
                    className="px-2 py-1 border border-ink text-xs font-bold bg-paper hover:bg-ink hover:text-paper transition-all cursor-pointer rounded-sm"
                  >+5%</button>
                </div>
              </div>
            </div>

            {/* 4. Tariffs / Trade Barriers */}
            <div className="border border-ink/20 p-4 rounded bg-paper-light shadow-sm hover:border-ink/50 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 bg-[#4a5568] text-white font-bold text-[9px] rounded-xs uppercase tracking-tight">Trade</span>
                  <h4 className="font-bold text-ink text-[13px]">{isZh ? '国境关税壁垒' : 'Import Tariffs'}</h4>
                </div>
                <p className="text-[10px] text-ink-light leading-relaxed">
                  {isZh 
                    ? '对所有进入共和国国境的海外商品设立关税防线。有利于保护民族中小工商业，但严重的边际进口限制会使国内进口物价大幅度攀升（即高通货膨胀）。'
                    : 'Tariff protection walls erected at domestic frontiers. Shelters minor national factories from imported rivals, but directly accelerates retail import inflation.'}
                </p>
              </div>
              
              <div className="flex-shrink-0 flex items-center gap-3">
                <span className="font-bold text-lg text-ink font-mono bg-ink/5 px-2 py-1 rounded w-16 text-center border border-ink/10">
                  {state.tax_tariff !== undefined ? state.tax_tariff : 10}%
                </span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleAdjustTax('tax_tariff', -5)}
                    className="px-2 py-1 border border-ink text-xs font-bold bg-paper hover:bg-ink hover:text-paper transition-all cursor-pointer rounded-sm"
                  >-5%</button>
                  <button 
                    onClick={() => handleAdjustTax('tax_tariff', -1)}
                    className="px-2 py-1 border border-ink text-xs font-bold bg-paper hover:bg-ink hover:text-paper transition-all cursor-pointer rounded-sm"
                  >-1%</button>
                  <button 
                    onClick={() => handleAdjustTax('tax_tariff', 1)}
                    className="px-2 py-1 border border-ink text-xs font-bold bg-paper hover:bg-ink hover:text-paper transition-all cursor-pointer rounded-sm"
                  >+1%</button>
                  <button 
                    onClick={() => handleAdjustTax('tax_tariff', 5)}
                    className="px-2 py-1 border border-ink text-xs font-bold bg-paper hover:bg-ink hover:text-paper transition-all cursor-pointer rounded-sm"
                  >+5%</button>
                </div>
              </div>
            </div>

            {/* 5. Consumption Tax */}
            <div className="border border-ink/20 p-4 rounded bg-[#fbfaf7] shadow-sm hover:border-ink/50 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 bg-[#319795] text-white font-bold text-[9px] rounded-xs uppercase tracking-tight">Regressive</span>
                  <h4 className="font-bold text-ink text-[13px]">{isZh ? '零售消费税' : 'Consumption Tax'}</h4>
                </div>
                <p className="text-[10px] text-ink-light leading-relaxed">
                  {isZh 
                    ? '针对日常零售服务和商品的流通税。最平稳和广泛的增收税，但会使民间商业交易略微蒙受打击、减缓经济流通。'
                    : 'Broad transactional levy placed directly on goods and utility trade. Offers a highly non-volatile source of revenue, but lowers retail transactions.'}
                </p>
              </div>
              
              <div className="flex-shrink-0 flex items-center gap-3">
                <span className="font-bold text-lg text-ink font-mono bg-ink/5 px-2 py-1 rounded w-16 text-center border border-ink/10">
                  {state.tax_consumption !== undefined ? state.tax_consumption : 8}%
                </span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleAdjustTax('tax_consumption', -5)}
                    className="px-2 py-1 border border-ink text-xs font-bold bg-paper hover:bg-ink hover:text-paper transition-all cursor-pointer rounded-sm"
                  >-5%</button>
                  <button 
                    onClick={() => handleAdjustTax('tax_consumption', -1)}
                    className="px-2 py-1 border border-ink text-xs font-bold bg-paper hover:bg-ink hover:text-paper transition-all cursor-pointer rounded-sm"
                  >-1%</button>
                  <button 
                    onClick={() => handleAdjustTax('tax_consumption', 1)}
                    className="px-2 py-1 border border-ink text-xs font-bold bg-paper hover:bg-ink hover:text-paper transition-all cursor-pointer rounded-sm"
                  >+1%</button>
                  <button 
                    onClick={() => handleAdjustTax('tax_consumption', 5)}
                    className="px-2 py-1 border border-ink text-xs font-bold bg-paper hover:bg-ink hover:text-paper transition-all cursor-pointer rounded-sm"
                  >+5%</button>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
