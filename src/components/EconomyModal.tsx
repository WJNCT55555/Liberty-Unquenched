import React from 'react';
import { GameState } from '../game/types';
import { X, TrendingUp, Percent, Users, Landmark, AlertTriangle, ShieldCheck, HelpCircle, Coins, DollarSign, Activity, ShoppingCart } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  dispatch: (action: any) => void;
  isZh: boolean;
}

const MinimalPieChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  size?: number;
}> = ({ data, size = 44 }) => {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  const r = 24; // solid radius
  const cx = 32;
  const cy = 32;

  if (total <= 0) return <div style={{ width: size, height: size }} className="rounded-full bg-ink/10 opacity-30" />;

  let accumulatedPercent = 0;
  
  const paths = data.map((slice, i) => {
    const valueMap = slice.value / total;
    if (valueMap <= 0.0001) return null;
    
    if (valueMap >= 0.999) {
      return (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill={slice.color}
        />
      );
    }
    
    const startX = Math.cos(2 * Math.PI * accumulatedPercent);
    const startY = Math.sin(2 * Math.PI * accumulatedPercent);
    accumulatedPercent += valueMap;
    const endX = Math.cos(2 * Math.PI * accumulatedPercent);
    const endY = Math.sin(2 * Math.PI * accumulatedPercent);
    const largeArcFlag = valueMap > 0.5 ? 1 : 0;
    
    const sx = cx + startX * r;
    const sy = cy + startY * r;
    const ex = cx + endX * r;
    const ey = cy + endY * r;
    
    const pathData = [
      `M ${cx} ${cy}`,
      `L ${sx.toFixed(1)} ${sy.toFixed(1)}`,
      `A ${r} ${r} 0 ${largeArcFlag} 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`,
      `Z`
    ].join(' ');
    
    return (
      <path
        key={i}
        d={pathData}
        fill={slice.color}
        className="transition-all duration-300 hover:opacity-85"
      />
    );
  });

  return (
    <div className="relative group flex-shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" className="w-full h-full transform -rotate-90 select-none">
        <circle cx={cx} cy={cy} r={r} fill="rgba(0,0,0,0.05)" />
        {paths}
      </svg>
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col bg-slate-900 text-white text-[8px] font-mono p-1.5 rounded whitespace-nowrap shadow-md z-40 gap-0.5 leading-none">
        {data.map((d, i) => d.value > 0 && (
          <div key={i} className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: d.color }} />
            <span className="text-zinc-300">{d.label}:</span>
            <span className="font-bold text-white">{d.value.toFixed(1)}M</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const SingleIndicatorLineChart: React.FC<{
  history: { growth: number; inflation: number; unemployment: number; month: number; year: number }[];
  currentYear: number;
  currentMonth: number;
  metric: 'growth' | 'inflation' | 'unemployment';
  color: string;
  isZh: boolean;
}> = ({ history, currentYear, currentMonth, metric, color, isZh }) => {
  // Generate data for months 1 to 12 of currentYear
  const monthsData = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const record = history.find(h => h.year === currentYear && h.month === m);
    return {
      month: m,
      value: record ? record[metric] : null
    };
  });

  // Filter out nulls to find min and max for scaling
  const activePoints = monthsData.filter(d => d.value !== null) as { month: number; value: number }[];

  let minVal = 0;
  let maxVal = 10;
  if (activePoints.length > 0) {
    const values = activePoints.map(p => p.value);
    minVal = Math.max(0, Math.min(...values) - 0.5);
    maxVal = Math.max(1, Math.max(...values) + 0.5);
  }
  const valRange = maxVal - minVal || 1;

  const width = 180;
  const height = 50;
  const padLeft = 16;
  const padRight = 6;
  const padTop = 6;
  const padBottom = 12;

  const getX = (m: number) => {
    return padLeft + ((m - 1) / 11) * (width - padLeft - padRight);
  };

  const getY = (v: number) => {
    const ratio = (v - minVal) / valRange;
    return height - padBottom - ratio * (height - padTop - padBottom);
  };

  // Generate SVG path for the active line segment
  let pathD = '';
  if (activePoints.length > 0) {
    pathD = activePoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.month).toFixed(1)} ${getY(p.value).toFixed(1)}`)
      .join(' ');
  }

  const monthLabels = isZh 
    ? ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
    : ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

  const [hoveredM, setHoveredM] = React.useState<number | null>(null);

  return (
    <div className="flex flex-col justify-between select-none">
      <div className="relative w-full h-[50px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {/* Horizontal dashed guide grid lines */}
          {[0, 0.5, 1].map((r, i) => {
            const val = minVal + r * valRange;
            const y = getY(val);
            return (
              <g key={i} className="opacity-20">
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="0.3"
                  strokeDasharray="1 1.5"
                  className="text-ink"
                />
                <text
                  x={padLeft - 3}
                  y={y + 1.5}
                  textAnchor="end"
                  fontSize="5.5"
                  className="fill-ink-light font-mono"
                >
                  {val.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Line Path */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={color}
              strokeWidth="1.25"
              strokeLinecap="round"
              className="opacity-90"
            />
          )}

          {/* Invisible interactive columns for month hovering */}
          {monthsData.map((d, i) => {
            const x = getX(d.month);
            const colWidth = (width - padLeft - padRight) / 11;
            return (
              <rect
                key={i}
                x={x - colWidth / 2}
                y={padTop}
                width={colWidth}
                height={height - padTop - padBottom}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => d.value !== null && setHoveredM(d.month)}
                onMouseLeave={() => setHoveredM(null)}
              />
            );
          })}

          {/* Active dots */}
          {activePoints.map((p, i) => {
            const cx = getX(p.month);
            const cy = getY(p.value);
            const isCurrent = p.month === currentMonth;
            const isHovered = p.month === hoveredM;
            return (
              <g key={i}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isCurrent ? "2.2" : isHovered ? "2.0" : "1.2"}
                  fill={color}
                  stroke={isCurrent || isHovered ? "#fff" : "none"}
                  strokeWidth="0.75"
                />
              </g>
            );
          })}
        </svg>

        {/* Hover label */}
        {hoveredM !== null && (() => {
          const point = activePoints.find(p => p.month === hoveredM);
          if (!point) return null;
          return (
            <div className="absolute right-1 top-1 bg-slate-900 border border-white/10 text-white text-[7px] font-mono rounded px-1 py-0.5 pointer-events-none select-none z-50">
              {hoveredM}{isZh ? '月' : 'M'}: <span className="font-bold">{point.value.toFixed(1)}%</span>
            </div>
          );
        })()}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-[7px] font-mono text-ink-light px-1 border-t border-ink/5 pt-0.5 mt-0.5">
        {monthLabels.map((lbl, idx) => {
          const m = idx + 1;
          const isCurrent = m === currentMonth;
          const isFut = m > currentMonth;
          return (
            <span 
              key={idx} 
              className={`w-3 text-center transition-all ${
                isCurrent 
                  ? 'font-bold text-ink scale-110' 
                  : isFut 
                    ? 'opacity-30' 
                    : 'opacity-70'
              }`}
            >
              {lbl}
            </span>
          );
        })}
      </div>
    </div>
  );
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  dispatch: (action: any) => void;
  isZh: boolean;
}

export const EconomyModal: React.FC<Props> = ({ isOpen, onClose, state, dispatch, isZh }) => {
  if (!isOpen) return null;

  const handleAdjustValue = (
    key: 'tax_lower_class' | 'tax_middle_class' | 'tax_upper_class' | 'tax_tariff' | 'tax_consumption' | 'military_spending',
    amount: number,
    min = 1,
    max = 100
  ) => {
    const currentVal = state[key] !== undefined 
      ? (state[key] as number) 
      : (key === 'military_spending' ? 15 : 10);
    const newVal = Math.max(min, Math.min(max, currentVal + amount));
    dispatch({
      type: 'UPDATE_TAXES',
      payload: {
        [key]: newVal
      }
    });
  };

  const isCivilWar = state.civilWarStatus === 'ongoing';
  const milSpendVal = state.military_spending !== undefined ? state.military_spending : 15;

  // Live Revenue Calculation
  const taxLowerRate = (state.tax_lower_class !== undefined ? state.tax_lower_class : 5) / 100;
  const taxMiddleRate = (state.tax_middle_class !== undefined ? state.tax_middle_class : 15) / 100;
  const taxUpperRate = (state.tax_upper_class !== undefined ? state.tax_upper_class : 25) / 100;
  const taxTarRate = (state.tax_tariff !== undefined ? state.tax_tariff : 10) / 100;
  const taxConsRate = (state.tax_consumption !== undefined ? state.tax_consumption : 8) / 100;

  const incomeTaxRev = (taxLowerRate * 4.0) + (taxMiddleRate * 3.5) + (taxUpperRate * 4.5);
  const tariffRev = taxTarRate * (isCivilWar ? 2.0 : 5.0);
  const consumptionTaxRev = taxConsRate * 8.0;
  const estimatedRevenue = incomeTaxRev + tariffRev + consumptionTaxRev;

  // Live Expenditures Calculation (including new variables)
  let estimatedExpenditures = 1.0; // Basic civil administration
  let maxHoursCost = 0;
  switch (state.domesticPolicy.max_hours_law) {
    case 2: maxHoursCost = 0.15; break;
    case 3: maxHoursCost = 0.25; break;
    case 4: maxHoursCost = 0.4; break;
    default: maxHoursCost = 0; break;
  }
  estimatedExpenditures += maxHoursCost;

  let workplaceSafetyCost = 0;
  switch (state.domesticPolicy.workplace_safety) {
    case 1: workplaceSafetyCost = 0.05; break;
    case 2: workplaceSafetyCost = 0.1; break;
    case 3: workplaceSafetyCost = 0.2; break;
    case 4: workplaceSafetyCost = 0.35; break;
    default: workplaceSafetyCost = 0; break;
  }
  estimatedExpenditures += workplaceSafetyCost;
  
  let minWageCost = 0;
  switch (state.domesticPolicy.min_wage) {
    case 1: minWageCost = 0.05; break;
    case 2: minWageCost = 0.15; break;
    case 3: minWageCost = 0.30; break;
    case 4: minWageCost = 0.50; break;
    default: minWageCost = 0; break;
  }
  estimatedExpenditures += minWageCost;

  let educationCost = 0;
  if (state.domesticPolicy.education_institutions === 2) {
    educationCost = 0.05;
  } else if (state.domesticPolicy.education_institutions === 3) {
    educationCost = 0.10;
  }
  estimatedExpenditures += educationCost;

  if (isCivilWar) estimatedExpenditures += 3.5;

  const milCost = (milSpendVal / 100) * (isCivilWar ? 8.0 : 3.0);
  const debtInterestCost = (state.public_debt !== undefined ? state.public_debt : 500.0) * ((isCivilWar ? 0.05 : 0.02) / 12);
  const landLawLevel = state.domesticPolicy.land_law ?? (state.domesticPolicy.land_reform_law_enabled ? 1 : 0);
  const isLandReformPaused = (landLawLevel === 1) && (state.budget <= 0);
  const landCompCost = (landLawLevel === 1 && !isLandReformPaused) ? 0.4 : 0.0;

  estimatedExpenditures += milCost;
  estimatedExpenditures += debtInterestCost;
  estimatedExpenditures += landCompCost;

  const estimatedDelta = estimatedRevenue - estimatedExpenditures;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-paper border-2 border-ink w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl relative">
        
        {/* Header */}
        <div className="border-b-2 border-ink border-opacity-30 p-4 flex justify-between items-center bg-ink/5">
          <div className="flex items-center gap-2">
            <Landmark className="w-6 h-6 text-ink-light" />
            <h2 className="font-typewriter text-2xl font-bold">
              {isZh ? '财政与税收' : 'Finance & Taxation'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-ink/10 transition-colors border border-transparent hover:border-ink cursor-pointer"
            id="close-economy-modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Outer Split View */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden font-mono text-xs">
          
          {/* Left Column: Balancing, indicators, treasury intervention */}
          <div className="w-full lg:w-[60%] lg:flex-shrink-0 border-r-0 lg:border-r-2 border-ink border-opacity-30 p-4 overflow-y-auto flex flex-col gap-4 bg-ink/5">
            
            {/* Bento-like 8 indicators grid */}
            <div>
              <h3 className="font-typewriter text-xs font-bold pb-1 border-b border-ink/20 uppercase tracking-wider mb-2">
                {isZh ? '宏观经济指标' : 'Macroeconomic Status indicators'}
              </h3>
              
              <div className="grid grid-cols-3 gap-2 mb-3">
                {/* Economy Growth */}
                <div className="bg-paper border border-ink/10 p-2 rounded-xs flex flex-col shadow-xs">
                  <div className="flex items-center justify-between text-ink-light leading-none">
                    <span className="text-[9px] uppercase font-bold tracking-tight">{isZh ? '增长率' : 'GDP Growth'}</span>
                    <TrendingUp className="w-3 h-3 text-ink-light" />
                  </div>
                  <span className="text-base font-bold text-ink mt-1 mb-1">
                    {(state.economy_growth !== undefined ? state.economy_growth : 2.5).toFixed(2)}%
                  </span>
                  <div className="border-t border-ink/5 pt-1.5 mt-1">
                    <SingleIndicatorLineChart
                      history={state.economyHistory || []}
                      currentYear={state.year}
                      currentMonth={state.month}
                      metric="growth"
                      color="#2563eb"
                      isZh={isZh}
                    />
                  </div>
                </div>

                {/* Inflation */}
                <div className="bg-paper border border-ink/10 p-2 rounded-xs flex flex-col shadow-xs">
                  <div className="flex items-center justify-between text-ink-light leading-none">
                    <span className="text-[9px] uppercase font-bold tracking-tight">{isZh ? '通货膨胀' : 'Inflation'}</span>
                    <Percent className="w-3 h-3 text-ink-light" />
                  </div>
                  <span className={`text-base font-bold mt-1 mb-1 ${state.inflation_rate > 15 || (state.gold_reserves ?? 2200) < 500 ? 'text-cnt-red font-extrabold animate-pulse' : 'text-ink'}`}>
                    {(state.inflation_rate !== undefined ? state.inflation_rate : 3.5).toFixed(2)}%
                  </span>
                  <div className="border-t border-ink/5 pt-1.5 mt-1">
                    <SingleIndicatorLineChart
                      history={state.economyHistory || []}
                      currentYear={state.year}
                      currentMonth={state.month}
                      metric="inflation"
                      color="#dc2626"
                      isZh={isZh}
                    />
                  </div>
                </div>

                {/* Unemployment */}
                <div className="bg-paper border border-ink/10 p-2 rounded-xs flex flex-col shadow-xs">
                  <div className="flex items-center justify-between text-ink-light leading-none">
                    <span className="text-[9px] uppercase font-bold tracking-tight">{isZh ? '失业率' : 'Unemployment'}</span>
                    <Users className="w-3 h-3 text-ink-light" />
                  </div>
                  <span className="text-base font-bold text-ink mt-1 mb-1">
                    {(state.unemployment_rate !== undefined ? state.unemployment_rate : 11.2).toFixed(2)}%
                  </span>
                  <div className="border-t border-ink/5 pt-1.5 mt-1">
                    <SingleIndicatorLineChart
                      history={state.economyHistory || []}
                      currentYear={state.year}
                      currentMonth={state.month}
                      metric="unemployment"
                      color="#7e22ce"
                      isZh={isZh}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-2">
                {/* Regular Budget */}
                <div className="bg-paper border border-ink/10 p-2 rounded-xs flex flex-col justify-between shadow-xs">
                  <div className="flex items-center justify-between text-ink-light leading-none">
                    <span className="text-[9px] uppercase font-bold tracking-tight">{isZh ? '国库预算' : 'Treasury Budget'}</span>
                    <Landmark className="w-3 h-3 text-ink-light" />
                  </div>
                  <span className={`text-base font-bold mt-1 ${state.budget >= 0 ? 'text-green-700' : 'text-cnt-red'}`}>
                    {(state.budget !== undefined ? state.budget : 12.0).toFixed(2)}M ₧
                  </span>
                </div>

                {/* Gold Reserves */}
                <div className="bg-paper border border-ink/10 p-2 rounded-xs flex flex-col justify-between shadow-xs">
                  <div className="flex items-center justify-between text-ink-light leading-none">
                    <span className="text-[9px] uppercase font-bold tracking-tight">{isZh ? '黄金储备' : 'Gold Reserves'}</span>
                    <Coins className="w-3 h-3 text-yellow-600" />
                  </div>
                  <span className={`text-base font-bold mt-1 ${(state.gold_reserves ?? 2200) < 500 ? 'text-cnt-red font-extrabold' : 'text-amber-800'}`}>
                    {(state.gold_reserves ?? 2200).toFixed(0)}M ₧
                  </span>
                </div>

                {/* Foreign Exchange */}
                <div className="bg-paper border border-ink/10 p-2 rounded-xs flex flex-col justify-between shadow-xs">
                  <div className="flex items-center justify-between text-ink-light leading-none">
                    <span className="text-[9px] uppercase font-bold tracking-tight">{isZh ? '外汇储备' : 'Foreign FX'}</span>
                    <DollarSign className="w-3 h-3 text-green-700" />
                  </div>
                  <span className={`text-base font-bold mt-1 ${(state.foreign_exchange ?? 180) < 30 ? 'text-orange-600 font-bold' : 'text-green-800'}`}>
                    {(state.foreign_exchange ?? 180).toFixed(1)}M ₧
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                {/* Public Debt */}
                <div className="bg-paper border border-ink/10 p-2 rounded-xs flex flex-col justify-between shadow-xs col-span-2">
                  <div className="flex items-center justify-between text-ink-light leading-none">
                    <span className="text-[9px] uppercase font-bold tracking-tight">{isZh ? '国家公共债务累计' : 'Soevereign Public Debt'}</span>
                    <Activity className="w-3 h-3 text-red-500" />
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className={`text-base font-bold ${state.public_debt > 1500 ? 'text-cnt-red font-extrabold' : 'text-slate-700'}`}>
                      {(state.public_debt !== undefined ? state.public_debt : 500.0).toFixed(2)}M ₧
                    </span>
                    <span className="text-[8px] text-ink-light">
                      {isZh ? `年息: ${isCivilWar ? '5%' : '2%'}` : `Int Rate: ${isCivilWar ? '5%' : '2%'}`}
                    </span>
                  </div>
                </div>

                {/* War Bonds */}
                {state.has_issued_war_bonds && (
                  <div className="bg-orange-50 border border-orange-200 p-2 rounded-xs flex flex-col justify-between shadow-xs col-span-2">
                    <span className="text-[8px] uppercase font-bold tracking-tight text-orange-700">{isZh ? '爱国战时公债' : 'National War Bonds'}</span>
                    <span className="text-xs font-bold text-orange-800 mt-1 animate-pulse">
                      {isZh ? '已完成紧急发行' : 'Emergency Issued'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Detailed balance sheet forecast */}
            <div className="bg-paper border border-ink/20 p-3 rounded-xs flex flex-col gap-2 shadow-xs">
              <h4 className="font-bold border-b border-ink/10 pb-0.5 text-ink uppercase tracking-wide text-[10px] flex justify-between">
                <span>{isZh ? '预估月度收支明细' : 'Treasury Monthly Projection'}</span>
                <span className="text-ink-light font-normal text-[8px]">{isZh ? '即时推演' : 'Live Projection'}</span>
              </h4>
              
              <div className="flex flex-col md:flex-row gap-4 font-mono">
                {/* Left Column: Line items details */}
                <div className="flex-1 flex flex-col gap-1 text-[10px] leading-relaxed">
                  {/* Revenue */}
                  <div className="flex justify-between text-ink-light border-b border-dotted border-ink/10 pb-0.5">
                    <span>{isZh ? '・所得税总额:' : '• Income Tax Revenue:'}</span>
                    <span className="font-bold text-ink">{incomeTaxRev.toFixed(2)}M ₧</span>
                  </div>
                  <div className="flex justify-between text-ink-light border-b border-dotted border-ink/10 pb-0.5">
                    <span>{isZh ? '・关税壁垒总额:' : '• Tariffs Revenue:'}</span>
                    <span className="font-bold text-ink">{tariffRev.toFixed(2)}M ₧</span>
                  </div>
                  <div className="flex justify-between text-ink-light border-b border-dotted border-ink/10 pb-0.5">
                    <span>{isZh ? '・消费税总额:' : '• Consumption Tax:'}</span>
                    <span className="font-bold text-ink">{consumptionTaxRev.toFixed(2)}M ₧</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-green-700 font-bold text-[11px] mt-1 border-t border-green-200/50 pt-1 pb-0.5">
                    <span>{isZh ? '【预计总财政收入】' : 'Total Revenue Estimate'}</span>
                    <span className="text-[12px] font-extrabold">+{estimatedRevenue.toFixed(2)}M ₧</span>
                  </div>

                  {/* Expense details */}
                  <div className="h-px bg-ink/10 my-1 font-sans" />

                  <div className="flex justify-between text-ink-light border-b border-dotted border-ink/10 pb-0.5">
                    <span>{isZh ? '・政府基础行政款:' : '• Civilian Administration:'}</span>
                    <span className="font-bold text-ink">1.00M ₧</span>
                  </div>
                  {maxHoursCost > 0 && (
                    <div className="flex justify-between text-ink-light border-b border-dotted border-ink/10 pb-0.5">
                      <span>{isZh ? '・最高工时法执行:' : '• Max Hours Enforcement:'}</span>
                      <span className="font-bold text-ink">{maxHoursCost.toFixed(2)}M ₧</span>
                    </div>
                  )}
                  {workplaceSafetyCost > 0 && (
                    <div className="flex justify-between text-ink-light border-b border-dotted border-ink/10 pb-0.5">
                      <span>{isZh ? '・工作环境安全:' : '• Workplace Safety:'}</span>
                      <span className="font-bold text-ink">{workplaceSafetyCost.toFixed(2)}M ₧</span>
                    </div>
                  )}
                  {minWageCost > 0 && (
                    <div className="flex justify-between text-ink-light border-b border-dotted border-ink/10 pb-0.5">
                      <span>{isZh ? '・最低工资保障监察:' : '• Min Wage Compliance:'}</span>
                      <span className="font-bold text-ink">{minWageCost.toFixed(2)}M ₧</span>
                    </div>
                  )}
                  {educationCost > 0 && (
                    <div className="flex justify-between text-ink-light border-b border-dotted border-ink/10 pb-0.5">
                      <span>{isZh ? '・教育制度财政拨款:' : '• Education Allocation:'}</span>
                      <span className="font-bold text-ink">{educationCost.toFixed(2)}M ₧</span>
                    </div>
                  )}
                  {isCivilWar && (
                    <div className="flex justify-between text-ink-light border-b border-dotted border-ink/10 pb-0.5">
                      <span>{isZh ? '・内战全面动员战争开销:' : '• War Mobilization Cost:'}</span>
                      <span className="font-bold text-ink">3.50M ₧</span>
                    </div>
                  )}
                  <div className="flex justify-between text-ink-light border-b border-dotted border-ink/10 pb-0.5">
                    <span>{isZh ? '・国防军事常备预算:' : '• Defense Military Budget:'}</span>
                    <span className="font-bold text-ink">{milCost.toFixed(2)}M ₧</span>
                  </div>
                  <div className="flex justify-between text-ink-light border-b border-dotted border-ink/10 pb-0.5">
                    <span>{isZh ? '・公债利息偿还划款:' : '• Debt Sovereign Interest:'}</span>
                    <span className="font-bold text-ink">{debtInterestCost.toFixed(2)}M ₧</span>
                  </div>
                  {landLawLevel === 1 && (
                    <div className="flex justify-between text-ink-light border-b border-dotted border-ink/10 pb-0.5">
                      <span>{isZh ? '・土地改革补偿与安置费:' : '• Land Compensation Cost:'}</span>
                      <span className="font-bold text-ink">
                        {isLandReformPaused ? (
                          <span className="text-cnt-red text-[10px] font-mono uppercase tracking-tight">
                            {isZh ? '⌛ 预算赤字・已暂停' : '⌛ Deficit • Paused'}
                          </span>
                        ) : (
                          `${landCompCost.toFixed(2)}M ₧`
                        )}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-cnt-red font-bold text-[11px] mt-1 border-t border-red-200/50 pt-1 pb-0.5">
                    <span>{isZh ? '【法案与政策总支出】' : 'Total Expenditures'}</span>
                    <span className="text-[12px] font-extrabold">-{estimatedExpenditures.toFixed(2)}M ₧</span>
                  </div>

                  <div className="h-px bg-ink/30 my-1"/>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-ink">{isZh ? '每月净增收 (赤字将转为国债):' : 'Net Monthly Surplus (Deficit goes to Debt):'}</span>
                    <span className={`font-bold px-1.5 py-0.5 rounded-sm ${estimatedDelta >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-cnt-red'}`}>
                      {estimatedDelta >= 0 ? '+' : ''}{estimatedDelta.toFixed(2)}M ₧
                    </span>
                  </div>
                </div>

                {/* Right Column: Mini charts side panel */}
                <div className="w-full md:w-[28%] flex flex-row md:flex-col justify-around items-center gap-4 py-1">
                  {/* Revenue Pie Chart */}
                  <div className="flex flex-col items-center text-center gap-1.5">
                    <MinimalPieChart
                      data={[
                        { label: isZh ? '所得税' : 'Income Tax', value: incomeTaxRev, color: '#16a34a' },
                        { label: isZh ? '关税' : 'Tariff', value: tariffRev, color: '#d97706' },
                        { label: isZh ? '消费税' : 'Cons. Tax', value: consumptionTaxRev, color: '#2563eb' },
                      ]}
                      size={84}
                    />
                  </div>

                  {/* Expenditure Pie Chart */}
                  <div className="flex flex-col items-center text-center gap-1.5 leading-none">
                    <MinimalPieChart
                      data={[
                        { label: isZh ? '政府行政' : 'Civil Admin', value: 1.0, color: '#64748b' },
                        { label: isZh ? '最高工时' : 'Max Hours', value: maxHoursCost, color: '#a855f7' },
                        { label: isZh ? '工作安全' : 'Workplace Safety', value: workplaceSafetyCost, color: '#7c3aed' },
                        { label: isZh ? '最低工资' : 'Min Wage', value: minWageCost, color: '#ec4899' },
                        { label: isZh ? '教育制度' : 'Education', value: educationCost, color: '#0ea5e9' },
                        { label: isZh ? '内战开销' : 'War Cost', value: isCivilWar ? 3.5 : 0, color: '#ef4444' },
                        { label: isZh ? '常备军费' : 'Defense Mil', value: milCost, color: '#b91c1c' },
                        { label: isZh ? '债务利息' : 'Debt Int', value: debtInterestCost, color: '#0f172a' },
                        { label: isZh ? '土改补偿' : 'Land Comp', value: landLawLevel === 1 ? landCompCost : 0, color: '#eab308' },
                      ].filter(d => d.value > 0)}
                      size={84}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* National Intervention Actions (Wartime & Peacetime Emergency) */}
            <div className="bg-paper border-2 border-dashed border-ink/30 p-3 rounded-xs flex flex-col gap-2">
              <h4 className="font-bold text-ink uppercase tracking-wider text-[10px] flex items-center gap-1">
                <Landmark className="w-3 h-3 text-orange-600" />
                <span>{isZh ? '国库紧急干预行动方案' : 'Emergency Sovereign Interventions'}</span>
              </h4>
              
              <div className="flex flex-col gap-1.5">
                {/* Action 1: Sell Gold Reserves */}
                <div className="flex flex-col gap-1 border-b border-ink/10 pb-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[10px] text-amber-800">{isZh ? '抛售比塞塔黄金储备换外汇' : 'Sell Gold for Foreign Exchange'}</span>
                    <button
                      onClick={() => dispatch({ type: 'SELL_GOLD_FOR_FX' })}
                      disabled={(state.gold_reserves ?? 2200) < 100}
                      className="px-2 py-0.5 bg-ink text-paper text-[9px] uppercase font-bold hover:bg-ink-light disabled:bg-ink/10 disabled:text-ink/40 cursor-pointer rounded-xs"
                    >
                      {isZh ? '抛售 100M 黄金' : 'Sell 100M Gold'}
                    </button>
                  </div>
                  <p className="text-[8px] text-ink-light leading-none leading-snug">
                    {isZh 
                      ? '【抛售黄金】扣除黄金储备 100M，增加外汇储备 100M。然而，无实物资产 backing 会推升国内通胀率 +1.5%。'
                      : 'Lose 100M Gold reserves to immediately buy 100M liquid FX. Beware: lower reserves trigger currency lack of backing (+1.5% inflation).'}
                  </p>
                </div>

                {/* Action 2: Issue War Bonds */}
                <div className="flex flex-col gap-1 border-b border-ink/10 pb-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[10px] text-orange-700">{isZh ? '发行爱国战时公债募款（限一次）' : 'Issue National War Bonds (One-time)'}</span>
                    <button
                      onClick={() => dispatch({ type: 'ISSUE_WAR_BONDS' })}
                      disabled={state.has_issued_war_bonds}
                      className="px-2 py-0.5 bg-ink text-paper text-[9px] uppercase font-bold hover:bg-ink-light disabled:bg-ink/10 disabled:text-ink/40 cursor-pointer rounded-xs"
                    >
                      {state.has_issued_war_bonds 
                        ? (isZh ? '已发行' : 'Issued') 
                        : (isZh ? '发行 50M 国债' : 'Issue 50M Bonds')}
                    </button>
                  </div>
                  <p className="text-[8px] text-ink-light leading-snug">
                    {isZh 
                      ? '【一次性融资】国库预算立即增加 50M ₧，并吸收 10M ₧ 国际外汇声援，但公共债务会增加 60M ₧（溢价偿还本息），且增加通货膨胀 +1.2%。'
                      : 'One-time fund raising: gains +50M budget & +10M foreign exchange, but adds +60M to Sovereign Debt and spikes inflation by +1.2%.'}
                  </p>
                </div>

                {/* Action 3: Urgent weapon import */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[10px] text-green-700">{isZh ? '消耗外汇紧急进口外国武器军火' : 'Foreign Weapon Emergency Import'}</span>
                    <button
                      onClick={() => dispatch({ type: 'BUY_RESOURCES_URGENT' })}
                      disabled={(state.foreign_exchange ?? 180) < 25.0}
                      className="px-2 py-0.5 bg-ink text-paper text-[9px] uppercase font-bold hover:bg-ink-light disabled:bg-ink/10 disabled:text-ink/40 cursor-pointer rounded-xs"
                    >
                      <span className="flex items-center gap-0.5">
                        <ShoppingCart className="w-2.5 h-2.5" />
                        {isZh ? '支付工本 25M 外汇' : 'Pay 25M FX'}
                      </span>
                    </button>
                  </div>
                  <p className="text-[8px] text-ink-light leading-snug">
                    {isZh 
                      ? '【紧急军购】消耗外汇储备 25M ₧，立即进口 2 点社会资源、 1 点军事军备。外汇短缺时将无法向苏联、法国等采购。'
                      : 'Spend 25M foreign currency to urgently bypass bottlenecks and receive +2 resources & +1 armaments from overseas mills.'}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Tax policy + New systems (spending adjustments) */}
          <div className="w-full lg:w-[40%] lg:flex-shrink-0 p-4 overflow-y-auto flex flex-col gap-4 bg-paper bg-opacity-70">
            
            {/* National tax sliders */}
            <div>
              <h3 className="font-typewriter text-xs font-bold pb-1 border-b border-ink/20 uppercase tracking-wider mb-2">
                {isZh ? '税收政策法案（宏观收入端）' : 'State Tax Policies (Macro Revenue Side)'}
              </h3>

              <div className="flex flex-col gap-2.5">
                {/* 1. Lower Class Tax */}
                <div className="border border-ink/10 p-2.5 rounded-sm bg-paper-light">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-ink text-[11px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                      {isZh ? '无产阶级所得税' : 'Working Class Income Tax'}
                    </span>
                    <span className="font-mono font-bold text-xs bg-ink/5 px-1 py-0.5 rounded-sm">
                      {state.tax_lower_class !== undefined ? state.tax_lower_class : 5}%
                    </span>
                  </div>
                  <p className="text-[9px] text-ink-light leading-snug mb-1.5">
                    {isZh 
                      ? '直接对广大工农无产阶级个人课税。由于其人数极其庞杂，稍微增加一百分点会导致购买力严重缩水，损害整体 GDP 增长率，但能稍许降低总通胀。'
                      : 'A tax on the bulk of the population. Higher rates squeeze general consumer spending and GDP growth, but curb high inflation.'}
                  </p>
                  <div className="flex justify-end gap-1">
                    <button onClick={() => handleAdjustValue('tax_lower_class', -5, 1, 100)} className="px-2 py-0.5 border border-ink text-[10px] font-bold hover:bg-ink hover:text-paper rounded-xs cursor-pointer">-5%</button>
                    <button onClick={() => handleAdjustValue('tax_lower_class', -1, 1, 100)} className="px-2 py-0.5 border border-ink text-[10px] font-bold hover:bg-ink hover:text-paper rounded-xs cursor-pointer">-1%</button>
                    <button onClick={() => handleAdjustValue('tax_lower_class', 1, 1, 100)} className="px-2 py-0.5 border border-ink text-[10px] font-bold hover:bg-ink hover:text-paper rounded-xs cursor-pointer">+1%</button>
                    <button onClick={() => handleAdjustValue('tax_lower_class', 5, 1, 100)} className="px-2 py-0.5 border border-ink text-[10px] font-bold hover:bg-ink hover:text-paper rounded-xs cursor-pointer">+5%</button>
                  </div>
                </div>

                {/* 2. Middle Class Tax */}
                <div className="border border-ink/10 p-2.5 rounded-sm bg-paper-light">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-ink text-[11px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      {isZh ? '中产阶层所得税' : 'Middle Class Income Tax'}
                    </span>
                    <span className="font-mono font-bold text-xs bg-ink/5 px-1 py-0.5 rounded-sm">
                      {state.tax_middle_class !== undefined ? state.tax_middle_class : 15}%
                    </span>
                  </div>
                  <p className="text-[9px] text-ink-light leading-snug mb-1.5">
                    {isZh 
                      ? '针对办事员、小职员、中小商业家等阶层的税率。相较无产阶级，购买力挤压温和一些，是较为平稳的国库来源。'
                      : 'Levy on local shopkeepers and civil servants. Solid treasury contribution with slightly reduced populist anger, but mildly slows trade.'}
                  </p>
                  <div className="flex justify-end gap-1">
                    <button onClick={() => handleAdjustValue('tax_middle_class', -5, 1, 100)} className="px-2 py-0.5 border border-ink text-[10px] font-bold hover:bg-ink hover:text-paper rounded-xs cursor-pointer">-5%</button>
                    <button onClick={() => handleAdjustValue('tax_middle_class', -1, 1, 100)} className="px-2 py-0.5 border border-ink text-[10px] font-bold hover:bg-ink hover:text-paper rounded-xs cursor-pointer">-1%</button>
                    <button onClick={() => handleAdjustValue('tax_middle_class', 1, 1, 100)} className="px-2 py-0.5 border border-ink text-[10px] font-bold hover:bg-ink hover:text-paper rounded-xs cursor-pointer">+1%</button>
                    <button onClick={() => handleAdjustValue('tax_middle_class', 5, 1, 100)} className="px-2 py-0.5 border border-ink text-[10px] font-bold hover:bg-ink hover:text-paper rounded-xs cursor-pointer">+5%</button>
                  </div>
                </div>

                {/* 3. Upper Class Tax */}
                <div className="border border-ink/10 p-2.5 rounded-sm bg-paper-light">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-ink text-[11px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                      {isZh ? '上层阶级所得税' : 'Upper Class Income Tax'}
                    </span>
                    <span className="font-mono font-bold text-xs bg-ink/5 px-1 py-0.5 rounded-sm">
                      {state.tax_upper_class !== undefined ? state.tax_upper_class : 25}%
                    </span>
                  </div>
                  <p className="text-[9px] text-ink-light leading-snug mb-1.5">
                    {isZh 
                      ? '课征于寡头、重工豪强和庄园大地主的累进税。最丰厚的财富来源，但过高征税会导致资本外流或停产罢工，失业率会随之明显攀升。'
                      : 'Highly progressive income levy on industrial magnates and landed grandees. Deep treasury yield, but too high levels freeze local hiring.'}
                  </p>
                  <div className="flex justify-end gap-1">
                    <button onClick={() => handleAdjustValue('tax_upper_class', -5, 1, 100)} className="px-2 py-0.5 border border-ink text-[10px] font-bold hover:bg-ink hover:text-paper rounded-xs cursor-pointer">-5%</button>
                    <button onClick={() => handleAdjustValue('tax_upper_class', -1, 1, 100)} className="px-2 py-0.5 border border-ink text-[10px] font-bold hover:bg-ink hover:text-paper rounded-xs cursor-pointer">-1%</button>
                    <button onClick={() => handleAdjustValue('tax_upper_class', 1, 1, 100)} className="px-2 py-0.5 border border-ink text-[10px] font-bold hover:bg-ink hover:text-paper rounded-xs cursor-pointer">+1%</button>
                    <button onClick={() => handleAdjustValue('tax_upper_class', 5, 1, 100)} className="px-2 py-0.5 border border-ink text-[10px] font-bold hover:bg-ink hover:text-paper rounded-xs cursor-pointer">+5%</button>
                  </div>
                </div>

                {/* 4. Import Tariffs */}
                <div className="border border-ink/10 p-2.5 rounded-sm bg-paper-light">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-ink text-[11px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                      {isZh ? '对外关税' : 'Import Tariffs'}
                    </span>
                    <span className="font-mono font-bold text-xs bg-ink/5 px-1 py-0.5 rounded-sm">
                      {state.tax_tariff !== undefined ? state.tax_tariff : 10}%
                    </span>
                  </div>
                  <p className="text-[9px] text-ink-light leading-snug mb-1.5">
                    {isZh 
                      ? '对海外竞品设置重重壁垒以保护民族轻重工商业。能保证稳固外汇与部分关税收入，但直接抬高国内进口商品零售物价，导致极高通胀率。'
                      : 'Protects domestic trade via import walls. Generates protective tariff pools, but drives up raw price index (imports inflation).'}
                  </p>
                  <div className="flex justify-end gap-1">
                    <button onClick={() => handleAdjustValue('tax_tariff', -5, 1, 100)} className="px-2 py-0.5 border border-ink text-[10px] font-bold hover:bg-ink hover:text-paper rounded-xs cursor-pointer">-5%</button>
                    <button onClick={() => handleAdjustValue('tax_tariff', -1, 1, 100)} className="px-2 py-0.5 border border-ink text-[10px] font-bold hover:bg-ink hover:text-paper rounded-xs cursor-pointer">-1%</button>
                    <button onClick={() => handleAdjustValue('tax_tariff', 1, 1, 100)} className="px-2 py-0.5 border border-ink text-[10px] font-bold hover:bg-ink hover:text-paper rounded-xs cursor-pointer">+1%</button>
                    <button onClick={() => handleAdjustValue('tax_tariff', 5, 1, 100)} className="px-2 py-0.5 border border-ink text-[10px] font-bold hover:bg-ink hover:text-paper rounded-xs cursor-pointer">+5%</button>
                  </div>
                </div>

                {/* 5. Consumption Tax */}
                <div className="border border-ink/10 p-2.5 rounded-sm bg-paper-light">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-ink text-[11px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                      {isZh ? '消费税' : 'Consumption Tax'}
                    </span>
                    <span className="font-mono font-bold text-xs bg-ink/5 px-1 py-0.5 rounded-sm">
                      {state.tax_consumption !== undefined ? state.tax_consumption : 8}%
                    </span>
                  </div>
                  <p className="text-[9px] text-ink-light leading-snug mb-1.5">
                    {isZh 
                      ? '针对一切商业交易中的附加增值流通税。最不易随政治波动的全民税项，能极稳定提供收入，但对中低阶层购买力略带抑制。'
                      : 'A steady and broad transaction tax. Very stable revenue source, but broad levels reduce merchant exchange slightly.'}
                  </p>
                  <div className="flex justify-end gap-1">
                    <button onClick={() => handleAdjustValue('tax_consumption', -5, 1, 100)} className="px-2 py-0.5 border border-ink text-[10px] font-bold hover:bg-ink hover:text-paper rounded-xs cursor-pointer">-5%</button>
                    <button onClick={() => handleAdjustValue('tax_consumption', -1, 1, 100)} className="px-2 py-0.5 border border-ink text-[10px] font-bold hover:bg-ink hover:text-paper rounded-xs cursor-pointer">-1%</button>
                    <button onClick={() => handleAdjustValue('tax_consumption', 1, 1, 100)} className="px-2 py-0.5 border border-ink text-[10px] font-bold hover:bg-ink hover:text-paper rounded-xs cursor-pointer">+1%</button>
                    <button onClick={() => handleAdjustValue('tax_consumption', 5, 1, 100)} className="px-2 py-0.5 border border-ink text-[10px] font-bold hover:bg-ink hover:text-paper rounded-xs cursor-pointer">+5%</button>
                  </div>
                </div>
              </div>
            </div>

            {/* NEW: Expenditure side parameters */}
            <div>
              <h3 className="font-typewriter text-xs font-bold pb-1 border-b border-ink/20 uppercase tracking-wider mb-2">
                {isZh ? '国防预算与社会法案（宏观支出端）' : 'Sovereign Budgets & Reform Laws (Expenditures Side)'}
              </h3>

              <div className="flex flex-col gap-2.5">
                {/* 1. Military Spend Allocation */}
                <div className="border-2 border-slate-400 p-2.5 rounded bg-amber-50/20">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-ink text-[11px] flex items-center gap-1.5">
                      <span className="px-1 py-0.5 bg-slate-700 text-white font-mono text-[8px] uppercase tracking-tight">Defense</span>
                      {isZh ? '国家常备国防军事预算' : 'Regular National Military Budget'}
                    </span>
                    <span className="font-mono font-bold text-xs bg-slate-200 px-1.5 py-0.5 rounded text-ink">
                      {milSpendVal}%
                    </span>
                  </div>
                  <p className="text-[9px] text-ink-light leading-snug mb-1.5">
                    {isZh
                      ? '【军费决定忠诚】国防常规开销比例（和平时期预期 15% ）。低于预期会导致常规陆军军官深感愤怒不满，右翼军官暗中勾结，军事政变概率持续飙升；增加国防支出可以极高抑制政变并每月自动生产多达数十倍的武器军备。'
                      : 'Defense funding limits. Underfunding below 15% Peacetime standard sparks army officer mutiny, directly accelerating military coup progress. Higher rates yield automated armaments.'}
                  </p>
                  <div className="flex justify-end gap-1">
                    <button onClick={() => handleAdjustValue('military_spending', -10, 5, 100)} className="px-2 py-0.5 border border-ink text-[10px] font-bold hover:bg-ink hover:text-paper rounded-xs cursor-pointer">-10%</button>
                    <button onClick={() => handleAdjustValue('military_spending', -1, 5, 100)} className="px-2 py-0.5 border border-ink text-[10px] font-bold hover:bg-ink hover:text-paper rounded-xs cursor-pointer">-1%</button>
                    <button onClick={() => handleAdjustValue('military_spending', 1, 5, 100)} className="px-2 py-0.5 border border-ink text-[10px] font-bold hover:bg-ink hover:text-paper rounded-xs cursor-pointer">+1%</button>
                    <button onClick={() => handleAdjustValue('military_spending', 10, 5, 100)} className="px-2 py-0.5 border border-ink text-[10px] font-bold hover:bg-ink hover:text-paper rounded-xs cursor-pointer">+10%</button>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
