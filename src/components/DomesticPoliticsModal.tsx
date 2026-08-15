import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { PARTY_INFLUENCE_INFO, DEPT_INFO_PACK } from './SidePanel';
import { GameState, Party, CoalitionId } from '../game/types';
import { COALITION_DEFS } from '../game/coalitions';
import { PARTY_COLORS, getPartySupport } from '../game/parties';
import { getPartyName, getPartyColor } from '../game/partyNames';
import { calculateElectionResults } from '../game/utils/election';
import { ParliamentChart } from './ParliamentChart';
import { X, Users, Vote, Briefcase, Info, Layers, UserCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  isZh: boolean;
}


// Party historical ideologies
const PARTY_IDEOLOGIES: Record<Party | 'CNT_FAI', { en: string; zh: string }> = {
  CNT_FAI: { en: 'Anarcho-Syndicalism', zh: '无政府工团主义' },
  PSOE: { en: 'Socialism', zh: '社会民主主义/社会主义' },
  IR: { en: 'Left Republicanism', zh: '左翼共和主义' },
  UR: { en: 'Moderate Republicanism', zh: '温和左翼共和主义' },
  PCE: { en: 'Communism (Marxism-Leninism)', zh: '共产主义 (马列主义)' },
  PS: { en: 'Revolutionary Syndicalism', zh: '工团主义参政派' },
  FE: { en: 'Fascism / National Syndicalism', zh: '法西斯主义/国家工团主义' },
  POUM: { en: 'Anti-Stalinist Marxism', zh: '反斯大林主义马克思主义' },
  AP: { en: 'Catholic Conservatism / Right-wing Autonomism', zh: '天主教保守主义/右翼自治联盟' },
  CT: { en: 'Carlist Traditionalism', zh: '卡洛斯传统主义 / 保王派' },
  RE: { en: 'Alfonsist Monarchism', zh: '阿方索派君主主义 / 保皇派' },
  DLR: { en: 'Centrist Liberal Republicanism', zh: '自由共和主义 / 中间派' },
  PRR: { en: 'Centrist Liberal Republicanism', zh: '自由共和主义 / 中间派' },
  ERC: { en: 'Catalan Left Nationalism', zh: '加泰罗尼亚左翼民族主义' },
  PNV: { en: 'Basque Christian Democracy', zh: '巴斯克基督教民主与民族主义' },
  Other: { en: 'Independents & Minor Factions', zh: '独立人士与地方小党派' },
  PRRevS: { en: 'Revolutionary Syndicalism', zh: '革命共和工团参政派' }
};

const MINISTRIES_DEF = [
  { id: 'labor', name: { en: 'Ministry of Labor', zh: '劳工部' } },
  { id: 'health', name: { en: 'Ministry of Health & Social Welfare', zh: '卫生与社会福利部' } },
  { id: 'justice', name: { en: 'Ministry of Justice', zh: '司法部' } },
  { id: 'industry', name: { en: 'Ministry of Industry & Commerce', zh: '工业与商业部' } },
  { id: 'interior', name: { en: 'Ministry of Interior', zh: '内政部' } },
  { id: 'war', name: { en: 'Ministry of War', zh: '战争部' } },
  { id: 'agriculture', name: { en: 'Ministry of Agriculture', zh: '农业部' } },
  { id: 'finance', name: { en: 'Ministry of Finance', zh: '财政部' } },
  { id: 'estado', name: { en: 'Ministry of State (Foreign Affairs)', zh: '外交与国务部' } },
] as const;

interface CabinetDeptCardProps {
  dept: typeof MINISTRIES_DEF[number];
  state: GameState;
  isZh: boolean;
  rulingMembers: (Party | 'CNT_FAI')[];
}

const CabinetDeptCard: React.FC<CabinetDeptCardProps> = ({ dept, state, isZh, rulingMembers }) => {
  const [isHovered, setIsHovered] = useState(false);
  const ministerParty = state.ministers[dept.id as keyof typeof state.ministers] || 'Other';
  const ministerPartyKey: Party | 'CNT_FAI' = ministerParty === 'CNT' ? 'CNT_FAI' : ministerParty;
  const ministerPartyLabel = ministerParty === 'CNT'
    ? getPartyName(state, 'CNT_FAI', isZh)
    : getPartyName(state, ministerParty, isZh);
  const color = getPartyColor(state, ministerPartyKey);
  const isRulingParty = rulingMembers.includes(ministerPartyKey);

  const cleanParty = ministerParty || 'Other';
  const partyInfo = PARTY_INFLUENCE_INFO[cleanParty] || PARTY_INFLUENCE_INFO['Other'];
  const deptInfo = DEPT_INFO_PACK[dept.id] || { name: { en: dept.name.en, zh: dept.name.zh }, focus: { en: '', zh: '' } };

  // Adjust tooltip upward if near the bottom of the list
  const isUpward = ['finance', 'estado', 'agriculture', 'war'].includes(dept.id);

  return (
    <div 
      className="border border-ink/10 p-3 bg-paper flex flex-col justify-between rounded-sm shadow-xs relative cursor-help select-none hover:border-ink/30 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="text-[10px] uppercase font-bold text-ink-light tracking-wider truncate">
        {isZh ? dept.name.zh : dept.name.en}
      </span>
      <div className="flex items-center justify-between mt-2 border-t border-dashed border-ink/10 pt-2">
        <span className="font-mono text-xs font-bold flex items-center gap-1.5" style={{ color }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
          {ministerPartyLabel}
        </span>
        <span 
          className={`text-[8px] px-1.5 py-0.5 rounded-xs font-mono font-bold ${
            ministerParty === 'CNT'
              ? 'bg-cnt-red text-paper'
              : isRulingParty 
                ? 'bg-ink/5 text-ink border border-ink/10' 
                : 'bg-ink/10 text-ink-light'
          }`}
        >
          {ministerParty === 'CNT' 
            ? getPartyName(state, 'CNT_FAI', isZh)
            : isRulingParty 
              ? (isZh ? '执政党' : 'Ruling') 
              : (isZh ? '在野/看守' : 'Opposition')}
        </span>
      </div>

      <AnimatePresence>
        {isHovered && (
          <motion.div 
            initial={{ opacity: 0, y: isUpward ? 8 : -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isUpward ? 8 : -8 }}
            className={`absolute left-0 w-full bg-[#f4f1ea] border-2 border-ink p-3 text-[11px] font-typewriter z-50 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] leading-relaxed text-ink pointer-events-none ${
              isUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
            }`}
          >
            {/* Folder tab design accent */}
            <div className="absolute top-0 left-0 w-1.5 h-full bg-ink"></div>
            
            <div className="pl-2">
              <div className="font-display text-xs uppercase border-b border-ink/30 pb-0.5 mb-1.5 text-ink font-bold">
                {isZh ? deptInfo.name.zh : deptInfo.name.en}
              </div>
              <p className="italic text-ink-light mb-2 text-[10px] leading-tight">
                {isZh ? deptInfo.focus.zh : deptInfo.focus.en}
              </p>
              
              <div className="font-bold border-b border-ink/20 pb-0.5 mb-1 text-ink uppercase tracking-wide text-[10px]">
                {isZh ? '部长政党背景的影响' : 'Minister Party Influence'}
              </div>
              <div className="text-cnt-red font-bold mb-1.5">
                {ministerPartyLabel}
              </div>
              
              <div className="mb-1.5 text-[10px] leading-tight">
                <span className="font-bold text-ink">{isZh ? '【派系分歧影响】' : '[Faction Dissent]'}</span>: <br/>
                <span className="text-ink-light">{isZh ? partyInfo.dissent.zh : partyInfo.dissent.en}</span>
              </div>
              
              <div className="text-[10px] leading-tight">
                <span className="font-bold text-ink">{isZh ? '【政府稳定影响】' : '[Gov Stability]'}</span>: <br/>
                <span className="text-ink-light">{isZh ? partyInfo.stability.zh : partyInfo.stability.en}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const DomesticPoliticsModal: React.FC<Props> = ({ isOpen, onClose, state, isZh }) => {
  if (!isOpen) return null;

  // 1. Parliament Details
  const cortes = (state.cortes || calculateElectionResults(state)) as Record<Party, number>;
  const totalCortesSeats = cortes ? (Object.values(cortes) as number[]).reduce((sum, s) => sum + s, 0) : 0;
  const hasCortes = totalCortesSeats > 0;

  const partyOrder: (Party | 'CNT_FAI')[] = [
    'POUM', 'PCE', 'PSOE', 'PS', 'PRRevS', 'ERC', 'IR', 'UR', 'PNV', 'PRR', 'DLR', 'Other', 'AP', 'RE', 'CT', 'FE'
  ];

  // Map to ParliamentChart data
  const chartData = partyOrder
    .filter(party => party !== 'CNT_FAI' && (cortes[party as Party] || 0) > 0)
    .map(party => ({
      id: party,
      name: getPartyName(state, party, isZh),
      seats: cortes[party as Party] || 0,
      color: getPartyColor(state, party)
    }));

  // Calculate Next Election Date
  const getNextElectionText = () => {
    if (state.civilWarStatus !== 'not_started') {
      return isZh ? '已停摆 (内战爆发)' : 'Suspended (Civil War)';
    }
    const year = state.year;
    const month = state.month;
    
    if (year < 1931 || (year === 1931 && month < 6)) {
      return isZh ? '1931年6月 (制宪议会大选)' : 'June 1931 (Constituent Cortes)';
    } else if (year < 1933 || (year === 1933 && month < 11)) {
      if (state.isRepublicanSocialistDissolved) {
        return isZh ? '1933年11月 (因内阁危机提前大选)' : 'November 1933 (Early Election due to Cabinet Crisis)';
      } else {
        return isZh ? '1935年6月 (四年期满)' : 'June 1935 (4-Year Term)';
      }
    } else if (year < 1936 || (year === 1936 && month < 2)) {
      if (state.isCedaRadicalDissolved) {
        return isZh ? '1936年2月 (因丑闻与联盟瓦解提前大选)' : 'February 1936 (Early Election due to Scandal & Collapse)';
      } else {
        return isZh ? '1937年11月 (四年期满)' : 'November 1937 (4-Year Term)';
      }
    } else {
      return isZh ? '1940年2月 (四年期满)' : 'February 1940 (4-Year Term)';
    }
  };


  const allParties = ['POUM', 'PCE', 'PSOE', 'PS', 'ERC', 'IR', 'UR', 'PNV', 'PRR', 'DLR', 'AP', 'RE', 'CT', 'FE', 'CNT_FAI'] as const;
  const presentParties = allParties.filter(p => {
    if (p === 'POUM' && !state.poum_founded) return false;
    if (p === 'FE' && !state.fe_founded) return false;
    if (p === 'PS' && !state.ps_founded) return false;
    return true;
  });
  const activeCoalitionId = state.rulingCoalition;
  const activeCoalitionDef = activeCoalitionId ? COALITION_DEFS.find(c => c.id === activeCoalitionId) : null;
  const rulingMembers = activeCoalitionDef ? activeCoalitionDef.members.filter(m => presentParties.includes(m as any)) : [];

  const getPartyGroups = () => {
    const groups: {
      id: string;
      name: { en: string; zh: string };
      type: 'ruling' | 'opposition_alliance' | 'single';
      members: (Party | 'CNT_FAI')[];
      description?: { en: string; zh: string };
    }[] = [];

    const unassigned = [...presentParties];

    // First process active coalitions
    const activeCoalitions = state.activeCoalitions || [];
    
    activeCoalitions.forEach(coalition => {
      const def = COALITION_DEFS.find(c => c.id === coalition.activeId);
      if (!def) return;
      
      const membersPresent = def.members.filter(m => unassigned.includes(m as any));
      if (membersPresent.length === 0) return;

      const isRuling = state.rulingCoalition === coalition.activeId;
      
      groups.push({
        id: (isRuling ? 'ruling_' : 'opposition_') + coalition.activeId,
        name: { 
          en: (isRuling ? 'Ruling Coalition: ' : 'Active Coalition: ') + def.name, 
          zh: (isRuling ? '执政内阁联盟：' : '活跃联盟：') + def.nameZh 
        },
        type: isRuling ? 'ruling' : 'opposition_alliance',
        members: membersPresent,
        description: {
          en: isRuling ? 'Currently forming the active government cabinet.' : 'An active political block currently out of government.',
          zh: isRuling ? '当前主持并组成共和国政府内阁的执政联盟。' : '当前处于在野状态的活跃政治联盟。'
        }
      });
      
      membersPresent.forEach(m => {
        const idx = unassigned.indexOf(m as any);
        if (idx > -1) unassigned.splice(idx, 1);
      });
    });

    // Remaining are single lines
    unassigned.forEach(party => {
      groups.push({
        id: `single_${party}`,
        name: { en: 'Independent Party', zh: '独立政治力量' },
        type: 'single',
        members: [party]
      });
    });

    return groups;
  };

  const partyGroups = getPartyGroups();

  // Coalition cohesion texts and explanations
  const getCohesionExplanation = (cohesion: number) => {
    if (cohesion >= 80) {
      return {
        en: 'Excellent stability. Major laws pass smoothly with minimal legislative friction.',
        zh: '极高凝聚力。各阁员党配合默契，法案能极其顺畅地通过。'
      };
    } else if (cohesion >= 50) {
      return {
        en: 'Stable cabinet. Some policy compromises are required to prevent coalition fractures.',
        zh: '中等凝聚力。日常政务稳定，但通过重大改革法案时需要各党互相妥协协商。'
      };
    } else {
      return {
        en: 'Severe vulnerability. High risk of division, gridlock, and sudden cabinet collapse.',
        zh: '低凝聚力！内阁内部矛盾重重，政见严重割裂，极易面临倒阁危机或议会重组。'
      };
    }
  };

  // Helper to get Leader Image with dynamic fallback
  const getLeaderImage = (name: string): string | null => {
    if (!name) return null;
    const baseUrl = (import.meta as any).env.BASE_URL || '/';
    const nameLower = name.toLowerCase();

    if (nameLower.includes('lerroux')) {
      return `${baseUrl}img/Portrait/alejandro_lerroux_garcia.png`;
    }
    if (nameLower.includes('alfonso')) {
      return `${baseUrl}img/Portrait/alfonso_xiii.png`;
    }
    if (nameLower.includes('largo caballero') || nameLower.includes('largocaballero')) {
      return `${baseUrl}img/Portrait/francisco_largo_caballero.png`;
    }
    if (nameLower.includes('gil-robles') || nameLower.includes('gil robles')) {
      return `${baseUrl}img/Portrait/jose_maria_gil_robles.png`;
    }
    if (nameLower.includes('azaña') || nameLower.includes('azana')) {
      return `${baseUrl}img/Portrait/manuel_azana_diaz_gallo.png`;
    }
    if (nameLower.includes('alcalá-zamora') || nameLower.includes('alcala-zamora') || nameLower.includes('alcalá zamora') || nameLower.includes('alcala zamora')) {
      return `${baseUrl}img/Portrait/niceto_alcala_zamora_y_torres.png`;
    }
    if (nameLower.includes('sanjurjo')) {
      return `${baseUrl}img/Portrait/sanjurjo_sacane.png`;
    }
    if (nameLower.includes('ramon') || nameLower.includes('ramón') || nameLower.includes('franco')) {
      return `${baseUrl}img/Advisors/ramon_franco.png`;
    }

    // Convert to snake_case style as common in codebase
    const normalized = name.replace(/\s+/g, '_').replace(/á/g, 'a').replace(/ñ/g, 'n').replace(/ó/g, 'o').replace(/é/g, 'e').replace(/í/g, 'i');
    return `${baseUrl}img/${normalized}.png?v=2`;
  };

  const rulingCoalitionState = state.activeCoalitions?.find(c => c.activeId === state.rulingCoalition);
  const activeCoalitionCohesion = rulingCoalitionState?.cohesion ?? 100;
  const activeCohesionExplanation = getCohesionExplanation(activeCoalitionCohesion);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-paper border-2 border-ink w-full max-w-6xl h-[90vh] md:h-[85vh] flex flex-col shadow-2xl relative">
        
        {/* Header */}
        <div className="border-b-2 border-ink border-opacity-30 p-4 flex justify-between items-center bg-ink/5">
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-cnt-red" />
            <h2 className="font-typewriter text-2xl font-bold">
              {isZh ? '西班牙共和国国内政局与内阁' : 'Domestic Politics & Government Cabinet'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-ink/10 transition-colors border border-transparent hover:border-ink"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Contents */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-halftone">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Parliament, Parliament parameters, Governing Coalition, and Parties/Alliances */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Card 1: Parliament & Stats */}
              <div className="border-2 border-ink p-5 bg-paper shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-ink/20 pb-3 mb-4 gap-2">
                  <div>
                    <h3 className="font-typewriter text-lg font-bold flex items-center gap-2">
                      <Vote className="w-5 h-5 text-ink-light" />
                      {isZh ? '西班牙国民议会 (Cortes Generales)' : 'Cortes Generales of Spain'}
                    </h3>
                    <p className="text-xs text-ink/60 mt-1">
                      {isZh 
                        ? '最高立法机构，总席位470席，通过法案需半数以上 (236席)。' 
                        : 'The legislature consists of 470 deputies. Enacting laws requires 236 seats.'}
                    </p>
                  </div>
                </div>

                {/* Parliament Chart Container */}
                <div className="py-4 px-4 border border-ink/5 bg-ink/[0.02] rounded-sm min-h-[220px] mb-4">
                  {hasCortes ? (
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                      {/* Left Side: Chart */}
                      <div className="w-full md:w-[72%] flex justify-center overflow-hidden">
                        <ParliamentChart data={chartData} width={360} height={180} />
                      </div>
                      
                      {/* Right Side: Party Legend */}
                      <div className="w-full md:w-[28%] border-l border-ink/10 pl-3 h-[180px] overflow-y-auto pr-1 flex flex-col gap-1.5 custom-scrollbar">
                        {chartData.map(item => (
                          <div key={item.id} className="flex items-center justify-between text-[11px] font-mono leading-tight py-0.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span 
                                className="w-2.5 h-2.5 inline-block shrink-0 border border-ink/10" 
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="font-bold text-ink shrink-0">{item.name}</span>
                            </div>
                            <span className="font-bold text-ink text-right shrink-0 ml-2">
                              {item.seats}{isZh ? '席' : 'S'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-ink/40 font-typewriter">
                      {isZh ? '[ 议会目前处于解散或非活跃状态 ]' : '[ Parliament is currently dissolved or inactive ]'}
                    </div>
                  )}
                </div>

                {/* Parliament Running Parameters */}
                <div className="space-y-3">
                  <h4 className="font-typewriter text-xs uppercase font-bold text-ink-light tracking-wider">
                    {isZh ? '■ 议会运行核心参数' : '■ Core Parliamentary Parameters'}
                  </h4>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="border border-ink/15 p-2 bg-paper">
                      <span className="text-[9px] uppercase font-bold text-ink-light block">
                        {isZh ? '法定议席总数' : 'Total Seats'}
                      </span>
                      <span className="font-display text-lg font-bold text-ink mt-1.5 block">470</span>
                    </div>

                    <div className="border border-ink/15 p-2 bg-paper">
                      <span className="text-[9px] uppercase font-bold text-ink-light block">
                        {isZh ? '半数起步门槛' : 'Majority Barrier'}
                      </span>
                      <span className="font-display text-lg font-bold text-ink mt-1.5 block">236</span>
                    </div>

                    <div className="border border-ink/15 p-2 bg-paper flex flex-col justify-between">
                      <span className="text-[9px] uppercase font-bold text-ink-light block">
                        {isZh ? '下届大选日程' : 'Next Election'}
                      </span>
                      <span className="font-typewriter text-[11px] font-bold text-cnt-red mt-1.5 tracking-tight leading-tight block">
                        {getNextElectionText()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="border border-ink/15 p-2.5 bg-paper flex justify-between items-center">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-ink-light block">
                          {isZh ? '执政内阁占有席位' : 'Government Seats'}
                        </span>
                        <span className="font-display text-lg font-bold text-cnt-red">
                          {rulingMembers.length > 0 
                            ? rulingMembers.reduce((sum, party) => sum + (cortes[party as Party] || 0), 0)
                            : (isZh ? '看守内阁 / 无数据' : 'Caretaker / None')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-bold text-ink-light block">
                          {isZh ? '议席比例 / 多数状态' : 'Seat Share & Status'}
                        </span>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink-light block">
                          {(() => {
                            if (rulingMembers.length === 0) return isZh ? '弱势看守政府' : 'Weak Caretaker';
                            const govSeats = rulingMembers.reduce((sum, party) => sum + (cortes[party as Party] || 0), 0);
                            const pct = ((govSeats / 470) * 100).toFixed(1);
                            const isMajority = govSeats >= 236;
                            return `${pct}% / ${isMajority ? (isZh ? '多数' : 'Majority') : (isZh ? '少数' : 'Minority')}`;
                          })()}
                        </span>
                      </div>
                    </div>

                    {/* Coalition Dissent if applicable */}
                    {state.coalition_dissent !== undefined ? (
                      <div className="border border-ink/15 p-2.5 bg-paper flex justify-between items-center">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-ink-light block">
                            {isZh ? '内阁联盟不满度' : 'Coalition Dissent'}
                          </span>
                          <span className="font-display text-base font-bold text-ink">
                            {state.coalition_dissent.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-1/2 bg-ink/10 h-2 border border-ink/25 overflow-hidden">
                          <div 
                            className="h-full bg-cnt-red transition-all duration-500" 
                            style={{ width: `${Math.min(100, state.coalition_dissent)}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="border border-ink/15 p-2.5 bg-paper/50 flex items-center justify-center text-[10px] text-ink/40 font-mono">
                        {isZh ? '暂无内阁冲突数据' : 'Stable Coalition'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 2: Ruling Coalition (Governing Party Alliance) */}
              <div className="border-2 border-ink p-5 bg-paper shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-ink/5 rotate-45 transform translate-x-12 -translate-y-12 -z-10" />
                
                <div className="border-b border-ink/20 pb-3 mb-4">
                  <h3 className="font-typewriter text-lg font-bold flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-cnt-red" />
                    {isZh ? '执政党联盟与凝聚力' : 'Governing Alliance & Cohesion'}
                  </h3>
                  <p className="text-xs text-ink/60 mt-1">
                    {isZh 
                      ? '内阁政权由以下执政伙伴党派联合组成，其内部凝聚力决定政权的施政成效。' 
                      : 'The administration is formed by the following governing coalition partners.'}
                  </p>
                </div>

                {/* Cabinet Meta Info */}
                <div className="border border-ink/15 p-3.5 bg-ink/[0.02] rounded-sm">
                  <div className="space-y-3">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-ink-light block">
                        {isZh ? '当前执政联盟类型' : 'Current Coalition Block'}
                      </span>
                      <span className="font-typewriter text-base font-bold text-cnt-red block">
                        {activeCoalitionDef 
                          ? (isZh ? activeCoalitionDef.nameZh : activeCoalitionDef.name)
                          : (isZh ? '临时总统看守政府 / 独立执政' : 'Provisional Caretaker Government / Single Administration')}
                      </span>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs font-mono font-bold">
                        <span>{isZh ? '联盟内部凝聚力:' : 'Cabinet Cohesion:'} {activeCoalitionCohesion}%</span>
                        <span className="text-cnt-red">
                          {isZh ? activeCohesionExplanation.zh : activeCohesionExplanation.en}
                        </span>
                      </div>
                      <div className="h-2.5 w-full border border-ink bg-ink/10 relative overflow-hidden rounded-sm">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            activeCoalitionCohesion >= 80 
                              ? 'bg-green-700' 
                              : activeCoalitionCohesion >= 50 
                                ? 'bg-amber-600' 
                                : 'bg-cnt-red'
                          }`}
                          style={{ width: `${activeCoalitionCohesion}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Party Alliances and Factions */}
              <div className="border-2 border-ink p-5 bg-paper shadow-sm">
                <div className="border-b border-ink/20 pb-3 mb-4">
                  <h3 className="font-typewriter text-lg font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-ink-light" />
                    {isZh ? '共和国各政党、政治派系与联盟' : 'Parties, Alliances & Political Blocs'}
                  </h3>
                  <p className="text-xs text-ink/60 mt-1">
                    {isZh 
                      ? '列出国内所有现存政党的席位分布、大选得票率及从属。' 
                      : 'Comprehensive list of political groups and their seats.'}
                  </p>
                </div>

                <div className="space-y-5">
                  {partyGroups.map((group) => {
                    const isRuling = group.type === 'ruling';
                    const isAlliance = group.type === 'opposition_alliance';
                    
                    return (
                      <div 
                        key={group.id} 
                        className={`border ${
                          isRuling 
                            ? 'border-cnt-red/30 bg-cnt-red/[0.01]' 
                            : isAlliance 
                              ? 'border-ink/20 bg-ink/[0.01]' 
                              : 'border-ink/10 bg-transparent'
                        } p-3 rounded-sm`}
                      >
                        {/* Group Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-ink/10 pb-2 mb-2 gap-1">
                          <div>
                            <h4 className={`font-typewriter text-sm font-bold ${isRuling ? 'text-cnt-red' : 'text-ink'}`}>
                              {isZh ? group.name.zh : group.name.en}
                            </h4>
                          </div>
                          <div className="text-[9px] font-mono font-bold text-ink-light uppercase">
                            {isRuling 
                              ? (isZh ? '[ 执政阵营 ]' : '[ Ruling ]') 
                              : isAlliance 
                                ? (isZh ? '[ 在野联盟 ]' : '[ Opposition ]') 
                                : (isZh ? '[ 独立派系 ]' : '[ Non-aligned ]')}
                          </div>
                        </div>

                        {/* Member Parties */}
                        <div className="divide-y divide-ink/10">
                          {group.members.map((party) => {
                            const seats = party === 'CNT_FAI' ? 0 : (cortes[party as Party] || 0);
                            const seatPct = totalCortesSeats > 0 ? ((seats / totalCortesSeats) * 100).toFixed(1) : '0.0';
                            const support = getPartySupport(state, party);
                            const color = getPartyColor(state, party);
                            const isRulingParty = rulingMembers.includes(party);

                            return (
                              <div key={party} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 hover:bg-ink/[0.02] px-1 transition-colors rounded-xs">
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <div 
                                    className="w-2 h-8 flex-shrink-0 mt-0.5" 
                                    style={{ backgroundColor: color }}
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-bold font-typewriter text-sm">
                                        {getPartyName(state, party, isZh)}
                                      </span>
                                      {isRulingParty && (
                                        <span className="text-[8px] uppercase font-bold border border-cnt-red text-cnt-red px-1 bg-cnt-red/5 rounded-xs">
                                          {isZh ? '阁员' : 'Cabinet'}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-ink/60 font-mono mt-0.5">
                                      {isZh ? PARTY_IDEOLOGIES[party].zh : PARTY_IDEOLOGIES[party].en}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 justify-between sm:justify-end text-right font-mono text-[11px] sm:text-xs">
                                  <div>
                                    <span className="text-[8px] text-ink-light block uppercase leading-none mb-0.5">
                                      {isZh ? '议席' : 'Seats'}
                                    </span>
                                    <span className="font-bold text-ink">
                                      {party === 'CNT_FAI' 
                                        ? (isZh ? '不参政' : 'Non-parl') 
                                        : `${seats} 席 (${seatPct}%)`}
                                    </span>
                                  </div>
                                  <div className="border-l border-ink/10 pl-3 min-w-[65px]">
                                    <span className="text-[8px] text-ink-light block uppercase leading-none mb-0.5">
                                      {isZh ? '民意' : 'Support'}
                                    </span>
                                    <span className="font-bold text-ink">
                                      {support.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Right Column: President & Prime Minister, Cabinet Department Portfolios */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Card 4: Executive Leadership (President & Prime Minister) */}
              <div className="border-2 border-ink p-5 bg-paper shadow-sm">
                <div className="border-b border-ink/20 pb-3 mb-4">
                  <h3 className="font-typewriter text-lg font-bold flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-cnt-red" />
                    {isZh ? '共和国最高行政领导人' : 'Executive Leadership of the Republic'}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* President Card */}
                  <div className="border border-ink/25 p-4 bg-paper flex flex-col items-center text-center rounded-sm shadow-xs relative">
                    {/* Avatar Box on Top */}
                    <div className="w-24 h-32 border-2 border-ink bg-ink/5 flex items-center justify-center overflow-hidden relative mb-3 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
                      <img 
                        src={getLeaderImage(state.government.president)} 
                        alt={state.government.president}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        style={{ display: 'none' }}
                        onLoad={(e) => {
                          e.currentTarget.style.display = 'block';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'none';
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div className="flex items-center justify-center text-ink/30 w-full h-full text-[10px] font-mono uppercase text-center p-1 leading-tight">
                        {/* Leave blank if no avatar file */}
                      </div>
                    </div>
                    {/* Content below Avatar */}
                    <div className="w-full flex-1 min-w-0 z-10 flex flex-col items-center">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-cnt-red font-typewriter block mb-1">
                        {isZh ? '共和国总统' : 'President of the Republic'}
                      </span>
                      <h4 className="font-bold font-typewriter text-base truncate mb-1">
                        {isZh ? (state.government.presidentZh || state.government.president) : state.government.president}
                      </h4>
                    </div>
                  </div>

                  {/* Prime Minister Card */}
                  <div className="border border-ink/25 p-4 bg-paper flex flex-col items-center text-center rounded-sm shadow-xs relative">
                    {/* Avatar Box on Top */}
                    <div className="w-24 h-32 border-2 border-ink bg-ink/5 flex items-center justify-center overflow-hidden relative mb-3 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
                      <img 
                        src={getLeaderImage(state.government.primeMinister)} 
                        alt={state.government.primeMinister}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        style={{ display: 'none' }}
                        onLoad={(e) => {
                          e.currentTarget.style.display = 'block';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'none';
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div className="flex items-center justify-center text-ink/30 w-full h-full text-[10px] font-mono uppercase text-center p-1 leading-tight">
                        {/* Leave blank if no avatar file */}
                      </div>
                    </div>
                    {/* Content below Avatar */}
                    <div className="w-full flex-1 min-w-0 z-10 flex flex-col items-center">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-cnt-red font-typewriter block mb-1">
                        {isZh ? '政府总理' : 'Prime Minister'}
                      </span>
                      <h4 className="font-bold font-typewriter text-base truncate mb-1">
                        {isZh ? (state.government.primeMinisterZh || state.government.primeMinister) : state.government.primeMinister}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 5: Cabinet Department Portfolios */}
              <div className="border-2 border-ink p-5 bg-paper shadow-sm">
                <div className="border-b border-ink/20 pb-3 mb-4">
                  <h3 className="font-typewriter text-lg font-bold flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-ink-light" />
                    {isZh ? '内阁各部委阁员分布' : 'Distribution of Ministerial Portfolios'}
                  </h3>
                  <p className="text-xs text-ink/60 mt-1">
                    {isZh 
                      ? '政府各行政部门部长职位由各参政党派担任，施政需要各部部长协同配合。' 
                      : 'Governing parties direct individual ministries to run the state administration.'}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  {MINISTRIES_DEF.map((dept) => (
                    <CabinetDeptCard 
                      key={dept.id}
                      dept={dept}
                      state={state}
                      isZh={isZh}
                      rulingMembers={rulingMembers}
                    />
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
