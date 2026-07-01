import React from 'react';
import { MapFaction as Faction, Province, Army } from './types_map';
import { Swords, Factory, Users, Package, Crosshair, X, Star } from 'lucide-react';

interface WarSummaryProps {
  provinces: Record<string, Province>;
  armies: Army[];
  resources: Record<Faction, {
    manpower: number;
    industrialCapacity: number;
    commandPoints: number;
    supplies: number;
    tankReserve: number;
  }>;
  isZh: boolean;
  onClose: () => void;
  activeWar?: string;
}

export const WarSummary: React.FC<WarSummaryProps> = ({
  provinces,
  armies,
  resources,
  isZh,
  onClose,
  activeWar,
}) => {
  const isAsturias = activeWar === 'asturias_war';
  const f1 = isAsturias ? Faction.WORKERS_ALLIANCE : Faction.REPUBLICAN;
  const f2 = isAsturias ? Faction.REPUBLICAN : Faction.NATIONALIST;

  // Dynamic names
  const f1Name = isZh 
    ? (isAsturias ? '工人自治政府' : '共和派阵线') 
    : (isAsturias ? "Workers' Alliance" : "REPUBLICAN FRONT");
  const f1SubName = isZh
    ? (isAsturias ? '「工农红军民兵」' : '「反法西斯同盟」')
    : (isAsturias ? '"RED GUARDS"' : '"POPULAR COMBATANTS"');
  const f1Title = isZh
    ? (isAsturias ? '阿斯图里亚斯工人革命委员会' : '共和民主与工人民兵')
    : (isAsturias ? "ASTURIAS REVOLUTIONARY COMMITTEE" : "THE PEOPLE’S ARMY");

  const f2Name = isZh
    ? (isAsturias ? '共和国政府军' : '国民派军人集团')
    : (isAsturias ? "Republican Government" : "NATIONALIST JUNTA");
  const f2SubName = isZh
    ? (isAsturias ? '「政府宪兵与守备队」' : '「救国军事委员会」')
    : (isAsturias ? '"GOVERNMENT FORCES"' : '"NATIONALIST JUNTA"');
  const f2Title = isZh
    ? (isAsturias ? '马德里中央政府军与内卫部队' : '常规军、摩洛哥军团与长枪党')
    : (isAsturias ? "REPUBLICAN REGULAR GARRISONS" : "NATIONALIST ARMY");

  const f1ColorClass = isAsturias ? 'bg-cnt-red' : 'bg-republic-purple';
  const f1TextClass = isAsturias ? 'text-cnt-red' : 'text-republic-purple';
  const f2ColorClass = isAsturias ? 'bg-blue-600' : 'bg-republic-yellow';
  const f2TextClass = isAsturias ? 'text-blue-600' : 'text-republic-yellow';

  // 1. Calculate Province Stats & Strategic Values
  let f1StrategicValue = 0;
  let f2StrategicValue = 0;
  let f1ProvincesCount = 0;
  let f2ProvincesCount = 0;
  let f1TotalFactories = 0;
  let f2TotalFactories = 0;

  const provinceList = Object.values(provinces) as Province[];
  provinceList.forEach((prov) => {
    if (prov.owner === f1) {
      f1StrategicValue += prov.strategicValue || 0;
      f1ProvincesCount++;
      f1TotalFactories += prov.industry || 0;
    } else if (prov.owner === f2) {
      f2StrategicValue += prov.strategicValue || 0;
      f2ProvincesCount++;
      f2TotalFactories += prov.industry || 0;
    }
  });

  // Prevent divide-by-zero
  const totalSV = f1StrategicValue + f2StrategicValue || 1;
  const f1SVPercent = Math.round((f1StrategicValue / totalSV) * 100);
  const f2SVPercent = 100 - f1SVPercent;

  // 2. Calculate Army Stats
  let f1DivisionsCount = 0;
  let f2DivisionsCount = 0;

  let f1Infantry = 0;
  let f1Artillery = 0;
  let f1Tanks = 0;
  let f1ActiveManpower = 0;

  let f2Infantry = 0;
  let f2Artillery = 0;
  let f2Tanks = 0;
  let f2ActiveManpower = 0;

  armies.forEach((army) => {
    if (army.faction === f1) {
      f1DivisionsCount++;
      f1Infantry += army.composition.infantry || 0;
      f1Artillery += army.composition.artillery || 0;
      f1Tanks += army.composition.tanks || 0;
      f1ActiveManpower += army.manpower || 0;
    } else if (army.faction === f2) {
      f2DivisionsCount++;
      f2Infantry += army.composition.infantry || 0;
      f2Artillery += army.composition.artillery || 0;
      f2Tanks += army.composition.tanks || 0;
      f2ActiveManpower += army.manpower || 0;
    }
  });

  // Resources from context
  const f1Res = resources[f1] || { manpower: 0, industrialCapacity: 0, supplies: 0, tankReserve: 0 };
  const f2Res = resources[f2] || { manpower: 0, industrialCapacity: 0, supplies: 0, tankReserve: 0 };

  // Balance ratios for specific metrics
  const getRatioPercent = (val1: number, val2: number) => {
    const total = val1 + val2;
    if (total === 0) return 50;
    return Math.round((val1 / total) * 100);
  };

  const infRatio = getRatioPercent(f1Infantry, f2Infantry);
  const artRatio = getRatioPercent(f1Artillery, f2Artillery);
  const tankRatio = getRatioPercent(f1Tanks, f2Tanks);
  const icRatio = getRatioPercent(f1Res.industrialCapacity, f2Res.industrialCapacity);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 backdrop-blur-xs p-4 overflow-y-auto">
      {/* Container - Styled using vintage paper aesthetic of Liberty Unquenched */}
      <div className="relative w-full max-w-5xl bg-paper text-ink border-4 border-ink shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] flex flex-col overflow-hidden max-h-[92vh] font-serif">
        
        {/* Halftone Texture Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[radial-gradient(var(--color-ink)_1px,transparent_1px)] [background-size:8px_8px] z-0" />
        
        {/* Poster Header */}
        <div className="bg-ink text-paper p-5 flex flex-col md:flex-row justify-between items-start md:items-center relative border-b-4 border-cnt-red z-10">
          <div className="flex items-center gap-4">
            {/* Constructivist Red Square Accent */}
            <div className="w-14 h-14 bg-cnt-red flex items-center justify-center border-2 border-paper rotate-3 hover:rotate-0 transition-transform shadow-md shrink-0">
              <Swords className="w-8 h-8 text-paper" />
            </div>
            <div>
              <h2 className="font-display text-2xl md:text-3xl tracking-widest text-paper font-black uppercase leading-tight">
                {isZh ? '战略形势总决算书' : 'STRATEGIC WAR ASSESSMENT'}
              </h2>
              <p className="font-typewriter text-[10px] text-paper-dark uppercase tracking-widest mt-1">
                {isZh ? '★ 西班牙最高军事委员会机密通告 ★' : '★ SUPREME DEFENSE COUNCIL CONFIDENTIAL BULLETIN ★'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-3 md:mt-0 w-full md:w-auto justify-end">
            <div className="hidden sm:flex border-2 border-dashed border-cnt-red text-cnt-red font-typewriter text-[10px] font-bold px-2.5 py-1 uppercase rounded tracking-widest -rotate-3 select-none">
              {isZh ? '禁止外传' : 'CLASSIFIED'}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 border-2 border-paper bg-ink flex items-center justify-center text-paper hover:bg-cnt-red hover:text-paper transition-colors shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]"
            >
              <X className="w-5 h-5 font-bold" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Area */}
        <div className="p-4 md:p-6 flex-1 overflow-y-auto space-y-6 select-text z-10 relative">
          
          {/* Tagline / Propaganda motto */}
          <div className="bg-paper-dark/50 border-y border-ink/20 p-3 flex flex-col md:flex-row justify-between items-center gap-3 relative">
            <div className="absolute top-0 bottom-0 left-0 w-2.5 bg-cnt-red" />
            <div className="pl-4">
              <span className="font-typewriter text-xs text-cnt-red font-bold uppercase tracking-widest block">
                {isZh ? '战略阵线态势' : 'FRONT-LINE SITUATION REPORT'}
              </span>
              <span className="font-serif italic text-xs text-ink/70">
                {isZh ? '“所有的工厂、所有的武器、所有的资源，都是为了胜利！”' : '"All factories, all weapons, all resources for the ultimate victory!"'}
              </span>
            </div>
            <div className="bg-cnt-red text-paper font-typewriter text-[10px] font-black px-3 py-1 uppercase tracking-wider transform -skew-x-12 border border-ink/20">
              {f1Name} VS {f2Name}
            </div>
          </div>

          {/* 1. Progress Bar: Total Strategic Value (Left Purple/Red, Right Yellow/Blue) */}
          <div className="bg-paper-dark/20 border-2 border-ink p-5 space-y-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-ink/5 rounded-full -mr-8 -mt-8" />
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs font-typewriter font-bold">
              <div className={`flex items-center gap-2 ${f1TextClass}`}>
                <Star className="w-4 h-4 fill-current" />
                <span className="uppercase text-sm">
                  {f1Name} [{f1StrategicValue} {isZh ? '战略值' : 'SV'}]
                </span>
              </div>
              <span className="text-ink/50 tracking-widest text-[10px] uppercase font-serif italic">
                {isZh ? '── 全国战略控制权对比 ──' : '── BALANCE OF TOTAL STRATEGIC CONTROL ──'}
              </span>
              <div className={`flex items-center gap-2 ${f2TextClass}`}>
                <span className="uppercase text-sm">
                  [{f2StrategicValue} {isZh ? '战略值' : 'SV'}] {f2Name}
                </span>
                <Star className="w-4 h-4 fill-current" />
              </div>
            </div>

            {/* Retro Balance Bar - f1 vs f2 */}
            <div className="relative h-7 w-full bg-paper-dark border-2 border-ink overflow-hidden flex shadow-[3px_3px_0px_0px_rgba(26,26,26,0.15)]">
              {/* Left Column (f1) */}
              <div 
                style={{ width: `${f1SVPercent}%` }} 
                className={`h-full ${f1ColorClass} transition-all duration-700 flex items-center pl-3 border-r border-ink`}
              >
                {f1SVPercent > 12 && (
                  <span className="text-xs font-typewriter font-black text-paper">
                    {f1SVPercent}%
                  </span>
                )}
              </div>
              {/* Right Column (f2) */}
              <div 
                style={{ width: `${f2SVPercent}%` }} 
                className={`h-full ${f2ColorClass} transition-all duration-700 flex items-center justify-end pr-3`}
              >
                {f2SVPercent > 12 && (
                  <span className="text-xs font-typewriter font-black text-white">
                    {f2SVPercent}%
                  </span>
                )}
              </div>
              {/* Center pointer */}
              <div 
                style={{ left: `${f1SVPercent}%` }}
                className="absolute top-0 bottom-0 w-1.5 bg-cnt-red transform -translate-x-1/2 z-10"
              />
            </div>
            
            <p className="text-[11px] font-serif text-ink-light text-center leading-relaxed">
              {isZh 
                ? '上述战局进度条由双方占领行省的「总战略价值」占比决定。攻克高战略价值的核心大城市（如马德里、巴塞罗那）能迅速拉偏战线进度。' 
                : 'The war balance reflects the total combined Strategic Value of controlled sectors. Securing urban hubs is vital to swing the strategic frontline.'}
            </p>
          </div>

          {/* 2. Side-by-Side Comparison Blocks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* F1 FRONT */}
            <div className="bg-paper-dark/10 border-2 border-ink p-5 space-y-6 relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              {/* Faction color accent rail */}
              <div className={`absolute top-0 left-0 w-2 h-full ${f1ColorClass}`} />
              
              {/* Faction Title Block */}
              <div className="border-b-2 border-ink/20 pb-4 pl-2">
                <div className="flex justify-between items-center">
                  <span className={`${f1ColorClass} text-paper font-typewriter text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wider`}>
                    {f1Name}
                  </span>
                  <span className="font-typewriter text-[10px] text-ink/50 font-bold uppercase tracking-wider">
                    {f1SubName}
                  </span>
                </div>
                <h3 className="font-display text-xl text-ink tracking-widest uppercase mt-2">
                  {f1Title}
                </h3>
              </div>

              {/* Data Blocks */}
              <div className="space-y-4">
                
                {/* Industrial Output */}
                <div className="border border-ink/20 p-3 bg-paper-dark/30 hover:bg-paper-dark/50 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-typewriter text-[11px] text-ink/60 uppercase font-black tracking-wider flex items-center gap-1.5">
                      <Factory className={`w-3.5 h-3.5 ${f1TextClass}`} /> {isZh ? '工业动员 / 工厂' : 'INDUSTRIAL CAPACITY'}
                    </span>
                    <span className={`font-typewriter text-[10px] ${isAsturias ? 'bg-cnt-red/15 text-cnt-red border-cnt-red/30' : 'bg-republic-purple/15 text-republic-purple border-republic-purple/30'} px-2 font-bold border`}>
                      {f1ProvincesCount} {isZh ? '省份' : 'Sectors'}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="font-display text-xl font-black text-ink">
                      {f1Res.industrialCapacity} <span className="text-xs font-typewriter font-medium">IC</span>
                    </span>
                    <span className="font-typewriter text-xs text-ink font-bold">
                      {f1TotalFactories} {isZh ? '核心军工厂' : 'Core Factories'}
                    </span>
                  </div>
                </div>

                {/* Manpower Resource */}
                <div className="border border-ink/20 p-3 bg-paper-dark/30 hover:bg-paper-dark/50 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-typewriter text-[11px] text-ink/60 uppercase font-black tracking-wider flex items-center gap-1.5">
                      <Users className={`w-3.5 h-3.5 ${f1TextClass}`} /> {isZh ? '动员兵源 / 在役数' : 'MANPOWER STATUS'}
                    </span>
                    <span className={`font-typewriter text-[10px] ${isAsturias ? 'bg-cnt-red/15 text-cnt-red border-cnt-red/30' : 'bg-republic-purple/15 text-republic-purple border-republic-purple/30'} px-2 font-bold border`}>
                      {f1DivisionsCount} {isZh ? '军团' : 'Divisions'}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="font-display text-xl font-black text-ink">
                      {f1Res.manpower.toLocaleString()} <span className="text-xs font-typewriter font-medium">{isZh ? '储备' : 'Reserve'}</span>
                    </span>
                    <span className="font-typewriter text-xs text-ink font-bold">
                      {f1ActiveManpower.toLocaleString()} {isZh ? '前线在役' : 'Active Duty'}
                    </span>
                  </div>
                </div>

                {/* Logistics & Supplies */}
                <div className="border border-ink/20 p-3 bg-paper-dark/30 hover:bg-paper-dark/50 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-typewriter text-[11px] text-ink/60 uppercase font-black tracking-wider flex items-center gap-1.5">
                      <Package className={`w-3.5 h-3.5 ${f1TextClass}`} /> {isZh ? '后勤补给物资' : 'LOGISTICS & MUNITIONS'}
                    </span>
                    <span className={`font-typewriter text-xs ${f1TextClass} font-bold`}>
                      {isZh ? `装甲车辆: ${f1Res.tankReserve}` : `Tanks Ready: ${f1Res.tankReserve}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="font-display text-xl font-black text-ink">
                      {f1Res.supplies.toLocaleString()} <span className="text-xs font-typewriter font-medium">tons</span>
                    </span>
                    <span className="font-typewriter text-xs text-cnt-red font-bold">
                      {isZh ? '前线供应饱和' : 'Supplies Sustained'}
                    </span>
                  </div>
                </div>

                {/* ORBAT Detailed Grid */}
                <div className="border-2 border-ink p-4 bg-ink text-paper space-y-3 relative">
                  <div className="absolute top-0 right-0 bg-cnt-red text-paper font-typewriter text-[8px] font-bold px-1.5 py-0.5 uppercase">
                    {isZh ? '师部名册' : 'ORBAT'}
                  </div>
                  <h4 className="font-typewriter text-xs text-paper-dark uppercase tracking-widest font-black border-b border-paper/10 pb-1.5">
                    {isZh ? '■ 前线作战武力细目' : '■ FRONT-LINE FORCE COMPOSITION'}
                  </h4>
                  
                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="bg-ink-light p-2 border border-paper/10">
                      <span className="block text-[9px] text-paper-dark uppercase tracking-wider">{isZh ? '步兵主力' : 'Infantry'}</span>
                      <span className="font-display text-lg font-black text-paper">{f1Infantry.toLocaleString()}</span>
                    </div>
                    <div className="bg-ink-light p-2 border border-paper/10">
                      <span className="block text-[9px] text-paper-dark uppercase tracking-wider">{isZh ? '野战火炮' : 'Artillery'}</span>
                      <span className="font-display text-lg font-black text-paper">{f1Artillery.toLocaleString()}</span>
                    </div>
                    <div className="bg-ink-light p-2 border border-paper/10">
                      <span className="block text-[9px] text-paper-dark uppercase tracking-wider">{isZh ? '装甲/坦克' : 'Armor Units'}</span>
                      <span className="font-display text-lg font-black text-paper">{f1Tanks.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* F2 FRONT */}
            <div className="bg-paper-dark/10 border-2 border-ink p-5 space-y-6 relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              {/* Faction color accent rail */}
              <div className={`absolute top-0 left-0 w-2 h-full ${f2ColorClass}`} />
              
              {/* Faction Title Block */}
              <div className="border-b-2 border-ink/20 pb-4 pl-2">
                <div className="flex justify-between items-center">
                  <span className={`${f2ColorClass} text-white font-typewriter text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wider`}>
                    {f2Name}
                  </span>
                  <span className="font-typewriter text-[10px] text-ink/50 font-bold uppercase tracking-wider">
                    {f2SubName}
                  </span>
                </div>
                <h3 className="font-display text-xl text-ink tracking-widest uppercase mt-2">
                  {f2Title}
                </h3>
              </div>

              {/* Data Blocks */}
              <div className="space-y-4">
                
                {/* Industrial Output */}
                <div className="border border-ink/20 p-3 bg-paper-dark/30 hover:bg-paper-dark/50 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-typewriter text-[11px] text-ink/60 uppercase font-black tracking-wider flex items-center gap-1.5">
                      <Factory className={`w-3.5 h-3.5 ${f2TextClass}`} /> {isZh ? '工业动员 / 工厂' : 'INDUSTRIAL CAPACITY'}
                    </span>
                    <span className={`font-typewriter text-[10px] ${isAsturias ? 'bg-republic-purple/15 text-republic-purple border-republic-purple/30' : 'bg-republic-yellow/15 text-ink border-republic-yellow/30'} px-2 font-bold border`}>
                      {f2ProvincesCount} {isZh ? '省份' : 'Sectors'}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="font-display text-xl font-black text-ink">
                      {f2Res.industrialCapacity} <span className="text-xs font-typewriter font-medium">IC</span>
                    </span>
                    <span className="font-typewriter text-xs text-ink font-bold">
                      {f2TotalFactories} {isZh ? '核心军工厂' : 'Core Factories'}
                    </span>
                  </div>
                </div>

                {/* Manpower Resource */}
                <div className="border border-ink/20 p-3 bg-paper-dark/30 hover:bg-paper-dark/50 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-typewriter text-[11px] text-ink/60 uppercase font-black tracking-wider flex items-center gap-1.5">
                      <Users className={`w-3.5 h-3.5 ${f2TextClass}`} /> {isZh ? '动员兵源 / 在役数' : 'MANPOWER STATUS'}
                    </span>
                    <span className={`font-typewriter text-[10px] ${isAsturias ? 'bg-republic-purple/15 text-republic-purple border-republic-purple/30' : 'bg-republic-yellow/15 text-ink border-republic-yellow/30'} px-2 font-bold border`}>
                      {f2DivisionsCount} {isZh ? '军团' : 'Divisions'}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="font-display text-xl font-black text-ink">
                      {f2Res.manpower.toLocaleString()} <span className="text-xs font-typewriter font-medium">{isZh ? '储备' : 'Reserve'}</span>
                    </span>
                    <span className="font-typewriter text-xs text-ink font-bold">
                      {f2ActiveManpower.toLocaleString()} {isZh ? '前线在役' : 'Active Duty'}
                    </span>
                  </div>
                </div>

                {/* Logistics & Supplies */}
                <div className="border border-ink/20 p-3 bg-paper-dark/30 hover:bg-paper-dark/50 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-typewriter text-[11px] text-ink/60 uppercase font-black tracking-wider flex items-center gap-1.5">
                      <Package className={`w-3.5 h-3.5 ${f2TextClass}`} /> {isZh ? '后勤补给物资' : 'LOGISTICS & MUNITIONS'}
                    </span>
                    <span className={`font-typewriter text-xs ${f2TextClass} font-bold`}>
                      {isZh ? `装甲车辆: ${f2Res.tankReserve}` : `Tanks Ready: ${f2Res.tankReserve}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="font-display text-xl font-black text-ink">
                      {f2Res.supplies.toLocaleString()} <span className="text-xs font-typewriter font-medium">tons</span>
                    </span>
                    <span className="font-typewriter text-xs text-ink-light font-bold">
                      {isZh ? '物资保障充沛' : 'Supplies Secured'}
                    </span>
                  </div>
                </div>

                {/* ORBAT Detailed Grid */}
                <div className="border-2 border-ink p-4 bg-ink text-paper space-y-3 relative">
                  <div className="absolute top-0 right-0 bg-cnt-red text-paper font-typewriter text-[8px] font-bold px-1.5 py-0.5 uppercase">
                    {isZh ? '军部名册' : 'ORBAT'}
                  </div>
                  <h4 className="font-typewriter text-xs text-paper-dark uppercase tracking-widest font-black border-b border-paper/10 pb-1.5">
                    {isZh ? '■ 前线作战武力细目' : '■ FRONT-LINE FORCE COMPOSITION'}
                  </h4>
                  
                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="bg-ink-light p-2 border border-paper/10">
                      <span className="block text-[9px] text-paper-dark uppercase tracking-wider">{isZh ? '步兵主力' : 'Infantry'}</span>
                      <span className="font-display text-lg font-black text-paper">{f2Infantry.toLocaleString()}</span>
                    </div>
                    <div className="bg-ink-light p-2 border border-paper/10">
                      <span className="block text-[9px] text-paper-dark uppercase tracking-wider">{isZh ? '野战火炮' : 'Artillery'}</span>
                      <span className="font-display text-lg font-black text-paper">{f2Artillery.toLocaleString()}</span>
                    </div>
                    <div className="bg-ink-light p-2 border border-paper/10">
                      <span className="block text-[9px] text-paper-dark uppercase tracking-wider">{isZh ? '装甲/坦克' : 'Armor Units'}</span>
                      <span className="font-display text-lg font-black text-paper">{f2Tanks.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* 3. Bottom Strength Balance Metrics Bar */}
          <div className="bg-paper-dark/20 border-2 border-ink p-5 space-y-4 shadow-sm relative">
            
            {/* Rubber Stamp mark decoration */}
            <div className="absolute bottom-3 right-6 border-4 border-double border-cnt-red/35 text-cnt-red/35 font-display text-xs px-3.5 py-1.5 rounded tracking-widest uppercase rotate-12 select-none pointer-events-none hidden md:block">
              {isZh ? '部参谋长签署' : 'APPROVED STAFF'}
            </div>

            <div className="flex items-center gap-2 border-b border-ink/20 pb-2">
              <Crosshair className="w-5 h-5 text-cnt-red" />
              <h4 className="font-display text-md tracking-wider font-black text-ink uppercase">
                {isZh ? `双边总体对抗实力对比指数 (${f1Name} vs ${f2Name})` : `MILITARY CAPACITY STRENGTH METRICS (${f1Name.toUpperCase()} VS ${f2Name.toUpperCase()})`}
              </h4>
            </div>

            <div className="space-y-4 font-typewriter text-xs text-ink">
              
              {/* Infantry Bar */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] md:text-xs">
                  <span className="font-bold">{isZh ? `${f1Name}步兵: ${f1Infantry.toLocaleString()}` : `${f1Name} Infantry: ${f1Infantry.toLocaleString()}`}</span>
                  <span className="font-serif italic text-ink/60 font-medium">{isZh ? '步兵作战兵力对比' : 'INFANTRY STRENGTH'}</span>
                  <span className="font-bold">{isZh ? `${f2Infantry.toLocaleString()} :${f2Name}步兵` : `${f2Infantry.toLocaleString()} :${f2Name}`}</span>
                </div>
                <div className="h-3 w-full bg-paper-dark border border-ink overflow-hidden flex shadow-inner">
                  <div style={{ width: `${infRatio}%` }} className={`h-full ${f1ColorClass} border-r border-ink/40 transition-all duration-500`} />
                  <div style={{ width: `${100 - infRatio}%` }} className={`h-full ${f2ColorClass} transition-all duration-500`} />
                </div>
              </div>

              {/* Artillery Bar */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] md:text-xs">
                  <span className="font-bold">{isZh ? `${f1Name}火炮: ${f1Artillery.toLocaleString()}` : `${f1Name} Artillery: ${f1Artillery.toLocaleString()}`}</span>
                  <span className="font-serif italic text-ink/60 font-medium">{isZh ? '重武力火力对比' : 'ARTILLERY CAPACITY'}</span>
                  <span className="font-bold">{isZh ? `${f2Artillery.toLocaleString()} :${f2Name}火炮` : `${f2Artillery.toLocaleString()} :${f2Name}`}</span>
                </div>
                <div className="h-3 w-full bg-paper-dark border border-ink overflow-hidden flex shadow-inner">
                  <div style={{ width: `${artRatio}%` }} className={`h-full ${f1ColorClass} border-r border-ink/40 transition-all duration-500`} />
                  <div style={{ width: `${100 - artRatio}%` }} className={`h-full ${f2ColorClass} transition-all duration-500`} />
                </div>
              </div>

              {/* Tanks Bar */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] md:text-xs">
                  <span className="font-bold">{isZh ? `${f1Name}装甲: ${f1Tanks.toLocaleString()}` : `${f1Name} Armor: ${f1Tanks.toLocaleString()}`}</span>
                  <span className="font-serif italic text-ink/60 font-medium">{isZh ? '战车装甲实力对比' : 'ARMORED TANK SCALE'}</span>
                  <span className="font-bold">{isZh ? `${f2Tanks.toLocaleString()} :${f2Name}装甲` : `${f2Tanks.toLocaleString()} :${f2Name}`}</span>
                </div>
                <div className="h-3 w-full bg-paper-dark border border-ink overflow-hidden flex shadow-inner">
                  <div style={{ width: `${tankRatio}%` }} className={`h-full ${f1ColorClass} border-r border-ink/40 transition-all duration-500`} />
                  <div style={{ width: `${100 - tankRatio}%` }} className={`h-full ${f2ColorClass} transition-all duration-500`} />
                </div>
              </div>

              {/* Industrial Capacity Bar */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] md:text-xs">
                  <span className="font-bold">{isZh ? `${f1Name}工业: ${f1Res.industrialCapacity}` : `${f1Name} IC: ${f1Res.industrialCapacity}`}</span>
                  <span className="font-serif italic text-ink/60 font-medium">{isZh ? '工业动员潜能对比' : 'INDUSTRIAL RATIO'}</span>
                  <span className="font-bold">{isZh ? `${f2Res.industrialCapacity} :${f2Name}工业` : `${f2Res.industrialCapacity} :${f2Name}`}</span>
                </div>
                <div className="h-3 w-full bg-paper-dark border border-ink overflow-hidden flex shadow-inner">
                  <div style={{ width: `${icRatio}%` }} className={`h-full ${f1ColorClass} border-r border-ink/40 transition-all duration-500`} />
                  <div style={{ width: `${100 - icRatio}%` }} className={`h-full ${f2ColorClass} transition-all duration-500`} />
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Vintage Poster Action Footer */}
        <div className="bg-ink p-5 border-t-4 border-cnt-red flex flex-col sm:flex-row justify-between items-center gap-4 z-10">
          <p className="font-typewriter text-[10px] text-paper-dark text-center sm:text-left tracking-wider max-w-md leading-relaxed">
            {isZh 
              ? '★ 西班牙武装力量战斗实力即时演算报告。本报告由前线大本营参谋部通讯兵每回合同步更新，所有数据源于作战省份与部队的实际在线统计。' 
              : '★ Generated directly from division rosters & territorial asset records. Keep secure. Death to fascism, long live the revolution.'}
          </p>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-10 py-3 bg-cnt-red hover:bg-paper text-paper hover:text-ink border-2 border-ink font-display text-sm font-black tracking-widest uppercase transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] hover:shadow-none"
          >
            {isZh ? '誓死坚守 / 返回作战地图' : 'ACKNOWLEDGE SITUATION'}
          </button>
        </div>
      </div>
    </div>
  );
};
