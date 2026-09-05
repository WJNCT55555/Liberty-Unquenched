import React from 'react';
import { useGame } from '../game/GameContext';
import { Party, SocialClass, GameState } from '../game/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { AnimatePresence, motion } from 'motion/react';
import { PARTY_COLORS, CLASS_COLORS, CLASS_INFO } from '../game/constants';
import { getPartyName, getPartyColor } from '../game/partyNames';
import { COALITION_DEFS } from '../game/coalitions';
import { getPartySupport, updateCoalitions } from '../game/utils';
import { MapFaction } from '../map/types_map';
import { FACTION_NAMES } from '../game/labels';
import { getOverallFactionDissent } from '../game/utils/factionEffects';
import { getOrganizationsForOwner, isOrganizationEstablished } from '../game/organizations';

// Resolve public emblems through Vite's deployment base path; a root-relative
// `/img/...` URL would break when the game is hosted under `/Liberty-Unquenched/`.
const ASSET_BASE_URL = (import.meta as any).env?.BASE_URL || '/';
const resolveOrganizationIcon = (iconPath: string) => (
  `${ASSET_BASE_URL}${iconPath.replace(/^\/+/, '')}`
);
const ORGANIZATION_GLOW_CLASS = 'transition-[filter] duration-200 group-hover:brightness-110 group-hover:drop-shadow-[0_1px_2px_rgba(43,43,43,0.45)]';

const formatRelationValue = (value: number): string => {
  if (!Number.isFinite(value)) return '0';
  const rounded = Math.abs(value) < 0.005 ? 0 : Number(value.toFixed(2));
  return String(rounded);
};

const calculatePartySupport = (state: GameState, party: 'CNT_FAI' | Party) => {
  let totalSupport = 0;
  for (const classId in state.classes) {
    const classData = state.classes[classId as SocialClass];
    const pop = CLASS_INFO[classId as SocialClass].pop / 100;
    const classTotalPoints = Object.values(classData.support).reduce((sum, val) => sum + val, 0) || 1;
    const relativePercent = (classData.support[party] / classTotalPoints) * 100;
    totalSupport += pop * relativePercent;
  }
  return Number(totalSupport.toFixed(2));
};

const getPartySupportBreakdown = (state: GameState, party: 'CNT_FAI' | Party) => {
  const breakdown: { classId: SocialClass; contribution: number }[] = [];
  for (const classId in state.classes) {
    const classData = state.classes[classId as SocialClass];
    const pop = CLASS_INFO[classId as SocialClass].pop / 100;
    const classTotalPoints = Object.values(classData.support).reduce((sum, val) => sum + val, 0) || 1;
    const relativePercent = (classData.support[party] / classTotalPoints) * 100;
    const contribution = pop * relativePercent;
    if (contribution > 0) {
      breakdown.push({ classId: classId as SocialClass, contribution });
    }
  }
  return breakdown.sort((a, b) => b.contribution - a.contribution);
};

export const SidePanel = () => {
  const { state, dispatch } = useGame();
  const isZh = state.language === 'zh';

  const factionNames = FACTION_NAMES;

  
  const pieData = [
    { name: isZh ? factionNames.Treintistas.zh : factionNames.Treintistas.en, value: state.factions.Treintistas.influence, color: '#4a4a4a' },
    { name: isZh ? factionNames.Cenetistas.zh : factionNames.Cenetistas.en, value: state.factions.Cenetistas.influence, color: '#1a1a1a' },
    { name: isZh ? factionNames.Faistas.zh : factionNames.Faistas.en, value: state.factions.Faistas.influence, color: '#cc0000' },
    { name: isZh ? factionNames.Puristas.zh : factionNames.Puristas.en, value: state.factions.Puristas.influence, color: '#8b0000' },
  ];

  if (state.factions.Jabalistas && state.factions.Jabalistas.influence > 0) {
    pieData.push({
      name: isZh ? factionNames.Jabalistas.zh : factionNames.Jabalistas.en,
      value: state.factions.Jabalistas.influence,
      color: '#14532d'
    });
  }

  const overallDissent = getOverallFactionDissent(state.factions);

  const getDissentLevel = (dissent: number, isZh: boolean) => {
    if (dissent < 20) return isZh ? '极低' : 'Very Low';
    if (dissent < 40) return isZh ? '低' : 'Low';
    if (dissent < 60) return isZh ? '中等' : 'Medium';
    if (dissent < 80) return isZh ? '高' : 'High';
    return isZh ? '极高' : 'Very High';
  };

  const getDissentColor = (dissent: number) => {
    if (dissent < 20) return 'text-green-700';
    if (dissent < 40) return 'text-green-600';
    if (dissent < 60) return 'text-yellow-600';
    if (dissent < 80) return 'text-orange-600';
    return 'text-cnt-red font-bold';
  };

  const getBureaucratizationLevel = (level: number, isZh: boolean) => {
    if (level <= 25) return isZh ? '极低' : 'Very Low';
    if (level <= 50) return isZh ? '低' : 'Low';
    if (level <= 75) return isZh ? '中高' : 'Medium-High';
    return isZh ? '高' : 'High';
  };

  const getRelationText = (value: number, type: 'western' | 'socialist', isZh: boolean) => {
    if (type === 'western') {
      if (value <= 20) return isZh ? '反对' : 'Opposed';
      if (value <= 40) return isZh ? '冷漠' : 'Indifferent';
      if (value <= 60) return isZh ? '中立' : 'Neutral';
      if (value <= 80) return isZh ? '不干涉' : 'Non-Intervention';
      return isZh ? '援助' : 'Aiding';
    } else {
      if (value <= 20) return isZh ? '反对' : 'Opposed';
      if (value <= 40) return isZh ? '冷漠' : 'Indifferent';
      if (value <= 60) return isZh ? '中立' : 'Neutral';
      if (value <= 80) return isZh ? '支持' : 'Supporting';
      return isZh ? '援助' : 'Aiding';
    }
  };

  const getRelationColor = (value: number) => {
    if (value <= 20) return 'text-cnt-red';
    if (value <= 40) return 'text-orange-600';
    if (value <= 60) return 'text-ink-light';
    if (value <= 80) return 'text-green-600';
    return 'text-green-700 font-bold';
  };

  const getPartyRelationLevel = (value: number, isZh: boolean) => {
    if (value <= 30) return isZh ? '敌对' : 'Hostile';
    if (value <= 50) return isZh ? '紧张' : 'Tense';
    if (value <= 70) return isZh ? '警惕' : 'Wary';
    return isZh ? '协作' : 'Collaborative';
  };

  const getPartyRelationColor = (value: number) => {
    if (value <= 30) return 'text-red-600 font-bold';
    if (value <= 50) return 'text-orange-600';
    if (value <= 70) return 'text-yellow-600';
    return 'text-green-600 font-bold';
  };

  const partyDescriptions: Record<Party, { en: string, zh: string }> = {
    POUM: { en: 'Anti-Stalinist Marxist party, potential ally in revolution.', zh: '反斯大林主义的马克思主义政党，革命中的潜在盟友。' },
    PCE: { en: 'Ideological arch-nemesis, competing for revolutionary leadership.', zh: '意识形态宿敌，竞争革命领导权。' },
    PSOE: { en: 'Competing for the worker base, delicate relationship.', zh: '竞争工人基础，关系微妙。' },
    PS: { en: 'Ideologically close, but seen as "traitors" by CNT radicals.', zh: '意识形态较接近，但被 CNT 激进派视为“叛徒”。' },
    ERC: { en: 'Catalan center-left nationalist party, friendly but prioritizes Catalan autonomy.', zh: '加泰罗尼亚中左翼民族主义政党，态度友好，但优先保障加泰罗尼亚自治。' },
    IR: { en: 'Sees CNT as a necessary but dangerous ally.', zh: '视 CNT 为必要但危险的盟友。' },
    UR: { en: 'More conservative, fears radical methods of the CNT.', zh: '较保守，恐惧 CNT 的激进手段。' },
    PNV: { en: 'Basque regionalist party, moderate and conservative but democratic.', zh: '巴斯克民族主义政党，温和保守但拥护民主。' },
    PRR: { en: 'Centrist Republican party, pursuing moderate reforms under the Republic.', zh: '中间派共和政党，主张在共和国框架下进行温和改革。' },
    DLR: { en: 'Conservative Republican party, defending property and order.', zh: '保守共和政党，捍卫财产与秩序。' },
    AP: { en: 'Catholic conservative party, defending religion and property.', zh: '天主教保守政党，捍卫宗教与财产。' },
    RE: { en: 'Monarchist party, seeking to restore the King.', zh: '君主主义政党，寻求恢复国王。' },
    CT: { en: 'Traditionalist and Carlist party, deeply conservative.', zh: '传统主义与卡洛斯派政党，极其保守。' },
    FE: { en: 'Party using syndicalism as a means but with opposite goals.', zh: '同样以工团作为手段的政党但目的相反。' },
    Other: { en: 'Small parties and undecided voters.', zh: '小党派与未定派系。' },
    PRRevS: { en: 'Our revolutionary syndicalist party representing the CNT in the Cortes.', zh: '我们在议会中代表 CNT 的革命共和工团党。' }
  };

  const getNationalisationText = (val: number, isZh: boolean) => {
    if (val === 0) return isZh ? '不存在' : 'None';
    if (val === 1) return isZh ? '关键行业国有化' : 'Key Industries';
    if (val === 2) return isZh ? '中等国有化' : 'Moderate';
    if (val === 3 || val === 4) return isZh ? '深度国有化' : 'Extensive';
    return isZh ? '全面国有化' : 'Total';
  };

  const getLandReformText = (val: number, isZh: boolean) => {
    if (val === 0) return isZh ? '私人土地兼并' : 'Private Consolidation';
    if (val === 1) return isZh ? '轻微土地改革' : 'Minor Reform';
    if (val === 2) return isZh ? '中等土地改革' : 'Moderate Reform';
    if (val === 3) return isZh ? '重大' : 'Major';
    return isZh ? '全面' : 'Total';
  };

  const getMaxHoursText = (val: number, isZh: boolean) => {
    if (val === 0) return isZh ? '无限制' : 'No Limits';
    if (val === 1) return isZh ? '70小时工作制' : '70-Hour Week';
    if (val === 2) return isZh ? '56小时工作制' : '56-Hour Week';
    if (val === 3) return isZh ? '40小时工作制' : '40-Hour Week';
    return isZh ? '36小时工作制' : '36-Hour Week';
  };

  const getMinWageText = (val: number, isZh: boolean) => {
    if (val === 0) return isZh ? '无' : 'None';
    if (val === 1) return isZh ? '最低限度' : 'Minimal';
    if (val === 2) return isZh ? '基本' : 'Basic';
    if (val === 3) return isZh ? '生活工资' : 'Living Wage';
    return isZh ? '优厚' : 'Generous';
  };

  const getWorkplaceSafetyText = (val: number, isZh: boolean) => {
    if (val === 0) return isZh ? '无' : 'None';
    if (val === 1) return isZh ? '基本' : 'Basic';
    if (val === 2) return isZh ? '中等' : 'Moderate';
    if (val === 3) return isZh ? '严格' : 'Strict';
    return isZh ? '全面' : 'Comprehensive';
  };

  const getPoliticalRightsText = (val: number, isZh: boolean) => {
    if (val === 0) return isZh ? '无选举' : 'No Elections';
    if (val === 1) return isZh ? '男性普选权' : 'Male Suffrage';
    if (val === 2) return isZh ? '有限女性选举权' : 'Limited Women Suffrage';
    return isZh ? '完全普选' : 'Universal Suffrage';
  };

  const getReligionPolicyText = (val: number, isZh: boolean) => {
    if (val === 0) return isZh ? '国教' : 'State Religion';
    if (val === 1) return isZh ? '信仰自由' : 'Freedom of Belief';
    if (val === 2) return isZh ? '世俗社会' : 'Secular Society';
    return isZh ? '国家无神论' : 'State Atheism';
  };

  const getEducationInstitutionsText = (val: number, isZh: boolean) => {
    if (val === 0) return isZh ? '教会学校' : 'Church Schools';
    if (val === 1) return isZh ? '传统教育' : 'Traditional Education';
    if (val === 2) return isZh ? '理性教育' : 'Rational Education';
    return isZh ? '现代教育' : 'Modern Education';
  };

  const getLanguagePolicyText = (val: number, isZh: boolean) => {
    if (val === 0) return isZh ? '强制卡斯蒂利亚语' : 'Castilian Only';
    if (val === 1) return isZh ? '有限承认' : 'Limited Recognition';
    if (val === 2) return isZh ? '自治双轨' : 'Dual Track';
    if (val === 3) return isZh ? '多语制' : 'Multilingualism';
    return isZh ? '世界语' : 'Esperanto';
  };

  const getUnionStatusText = (val: number, isZh: boolean) => {
    if (val === 0) return isZh ? '工会非法' : 'Union Outlawed';
    if (val === 1) return isZh ? '结社自由' : 'Freedom of Association';
    if (val === 2) return isZh ? '混合陪审团' : 'Mixed Jury';
    if (val === 3) return isZh ? '集体谈判' : 'Collective Bargaining';
    return isZh ? '委员会控制' : 'Committee Control';
  };

  const getPolicyColorClass = (val: number, maxVal: number) => {
    if (val === 0) return 'text-ink-light';
    if (val >= maxVal - 1 && maxVal > 1) return 'text-cnt-red font-bold';
    if (val === maxVal && maxVal === 1) return 'text-cnt-red font-bold';
    return 'text-ink';
  };

  return (
    <div className="w-72 shrink-0 min-w-0 box-border border-r-2 border-ink bg-paper p-6 flex flex-col gap-2 overflow-x-hidden overflow-y-auto">
      
      {state.civilWarStatus !== 'not_started' ? (
        <AccordionSection title={isZh ? '西班牙内战' : 'Spanish Civil War'} defaultOpen={true}>
          <div className="flex flex-col gap-4">
            {(() => {
              const provincesList = Object.values(state.provinces || {}) as any[];
              const totalProvinces = provincesList.length;
              let computedProgress = 50;
              if (totalProvinces > 0) {
                if (state.activeWar === 'asturias_war') {
                  const workersCount = provincesList.filter(p => p.owner === MapFaction.WORKERS_ALLIANCE).length;
                  const repCount = provincesList.filter(p => p.owner === MapFaction.REPUBLICAN).length;
                  const totalActive = workersCount + repCount;
                  if (totalActive > 0) {
                    computedProgress = (repCount / totalActive) * 100;
                  }
                } else {
                  const nationalistCount = provincesList.filter(p => p.owner === MapFaction.NATIONALIST).length;
                  const republicanCount = provincesList.filter(p => p.owner === MapFaction.REPUBLICAN).length;
                  const totalActive = nationalistCount + republicanCount;
                  if (totalActive > 0) {
                    computedProgress = (nationalistCount / totalActive) * 100;
                  }
                }
              }

              return (
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span>
                      {state.activeWar === 'asturias_war' 
                        ? (isZh ? '工农联盟' : 'Alliance') 
                        : (isZh ? '共和军' : 'Republic')}
                    </span>
                    <span>
                      {state.activeWar === 'asturias_war'
                        ? (isZh ? '政府军' : 'Government')
                        : (isZh ? '国民军' : 'Nationalist')}
                    </span>
                  </div>
                  <div className="h-4 w-full bg-zinc-300 border border-ink relative">
                    <div 
                      className="absolute top-0 bottom-0 left-0 bg-red-600 border-r border-ink transition-all duration-500" 
                      style={{ width: `${100 - computedProgress}%` }}
                    />
                    <div 
                      className="absolute top-0 bottom-0 right-0 bg-blue-800 transition-all duration-500" 
                      style={{ width: `${computedProgress}%` }}
                    />
                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-ink z-10" />
                  </div>
                  <div className="text-center text-xs font-mono mt-1 text-ink-light">
                    {state.activeWar === 'asturias_war'
                      ? (isZh ? '阿斯图里亚斯战况' : 'Asturias Front')
                      : (isZh ? '前线战况 (控制省份比例)' : 'War Progress (Province Ratio)')}
                  </div>
                </div>
              );
            })()}

            {/* Spain Civil War Faction/Republican stats */}
            {(() => {
              const repResources = state.mapResources?.[MapFaction.REPUBLICAN] || {
                manpower: 15000,
                industrialCapacity: 100,
                commandPoints: 2,
                supplies: 8000,
                tankReserve: 10
              };
              return (
                <div className="flex flex-col gap-2 font-mono text-xs border-t border-b border-ink/10 py-3 my-1">
                  <h4 className="font-display font-bold text-ink uppercase tracking-wider mb-1 text-[11px] text-cnt-red">
                    {isZh ? '共和军军事资源' : 'Republican War Resources'}
                  </h4>
                  <div className="flex justify-between items-center border-b border-ink/5 pb-1">
                    <span className="text-ink-light">{isZh ? '人力' : 'Manpower'}</span>
                    <span className="font-bold">{(repResources.manpower ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-ink/5 pb-1">
                    <span className="text-ink-light">{isZh ? '工业产量' : 'Industrial Cap.'}</span>
                    <span className="font-bold">{(repResources.industrialCapacity ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-ink/5 pb-1">
                    <span className="text-ink-light">{isZh ? '指挥点' : 'Command Points'}</span>
                    <span className="font-bold">{(repResources.commandPoints ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-ink/5 pb-1">
                    <span className="text-ink-light">{isZh ? '后勤物资' : 'Supplies'}</span>
                    <span className="font-bold">{(repResources.supplies ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-1">
                    <span className="text-ink-light">{isZh ? '坦克储备' : 'Tank Reserve'}</span>
                    <span className="font-bold">{(repResources.tankReserve ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              );
            })()}

            {/* Map View Button */}
            <button 
              onClick={() => dispatch({ type: 'TOGGLE_MAP_VIEW' })}
              className={`w-full py-2 border text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                state.currentView === 'map' 
                  ? 'bg-red-700/20 border-red-600 text-red-600 shadow-[0_0_8px_rgba(220,38,38,0.2)] hover:bg-red-700/30' 
                  : 'bg-ink/10 border-ink/30 text-ink hover:bg-ink/15 hover:border-ink/50'
              }`}
            >
              {state.currentView === 'map' 
                ? (isZh ? '关闭地图' : 'Close Map') 
                : (isZh ? '查看战区地图' : 'View War Map')}
            </button>
          </div>
        </AccordionSection>
      ) : (
        <AccordionSection title={isZh ? '西班牙地图' : 'Spain Map'} defaultOpen={true}>
          <div className="flex flex-col gap-4">
            {/* Map View Button */}
            <button 
              onClick={() => dispatch({ type: 'TOGGLE_MAP_VIEW' })}
              className={`w-full py-2 border text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                state.currentView === 'map' 
                  ? 'bg-accent/20 border-accent text-accent shadow-[0_0_8px_rgba(166,124,82,0.2)] hover:bg-accent/30' 
                  : 'bg-ink/10 border-ink/30 text-ink hover:bg-ink/15 hover:border-ink/50'
              }`}
            >
              {state.currentView === 'map' 
                ? (isZh ? '关闭地图' : 'Close Map') 
                : (isZh ? '查看全国地图' : 'View Spain Map')}
            </button>
          </div>
        </AccordionSection>
      )}

      <AccordionSection title={isZh ? '共和危机' : 'Republican Crisis'} defaultOpen={true}>
        <div className="flex flex-col gap-4">
          <StatBar 
            name={isZh ? '紧张局势' : 'Tension'} 
            value={state.stats.tension} 
            color="bg-red-600" 
            tooltip={
              isZh 
                ? `内战爆发的风险（当前难度下当紧张局势达到 ${state.difficulty === 'easy' || state.difficulty === 'sandbox' ? 95 : state.difficulty === 'hard' ? 70 : 80} 时将触发内战）` 
                : `Risk of Civil War (Civil war will trigger when tension reaches ${state.difficulty === 'easy' || state.difficulty === 'sandbox' ? 95 : state.difficulty === 'hard' ? 70 : 80} in this difficulty)`
            } 
          />
          <StatBar name={isZh ? '共和国权威' : 'Rep. Authority'} value={state.stats.republicanAuthority} color="bg-blue-600" tooltip={isZh ? '政府的控制力' : 'Government Control'} />
          <StatBar name={isZh ? '军官忠诚' : 'Army Loyalty'} value={state.stats.armyLoyalty} color="bg-green-600" tooltip={isZh ? '军队对共和国的忠诚度' : 'Army Loyalty to Republic'} />
          <StatBar name={isZh ? '革命热情' : 'Revolutionary Fervor'} value={state.stats.revolutionaryFervor} color="bg-cnt-red" tooltip={isZh ? '社会革命的进展' : 'Progress of Social Revolution'} />
          <StatBar name={isZh ? '工人控制度' : 'Worker Control'} value={state.stats.workerControl} color="bg-orange-600" tooltip={isZh ? '工人对工厂和土地的控制' : 'Worker Control of Factories and Land'} />
        </div>
      </AccordionSection>

      <AccordionSection title={isZh ? '国内政治' : 'Domestic Politics'} defaultOpen={true}>
        <div className="flex flex-col gap-2 text-xs font-mono">
          {/* Next Election Date indicator */}
          {(() => {
            let nextElectionText = '';
            if (state.civilWarStatus !== 'not_started') {
              nextElectionText = isZh ? '已停摆 (内战爆发)' : 'Suspended (Civil War)';
            } else {
              const year = state.year;
              const month = state.month;
              
              if (year < 1931 || (year === 1931 && month < 6)) {
                nextElectionText = isZh ? '1931年6月 (制宪议会大选)' : 'June 1931 (Constituent Cortes)';
              } else if (year < 1933 || (year === 1933 && month < 11)) {
                if (state.isRepublicanSocialistDissolved) {
                  nextElectionText = isZh ? '1933年11月 (因内阁危机提前大选)' : 'November 1933 (Early Election due to Cabinet Crisis)';
                } else {
                  nextElectionText = isZh ? '1935年6月 (四年期满)' : 'June 1935 (4-Year Term)';
                }
              } else if (year < 1936 || (year === 1936 && month < 2)) {
                if (state.isCedaRadicalDissolved) {
                  nextElectionText = isZh ? '1936年2月 (因丑闻与联盟瓦解提前大选)' : 'February 1936 (Early Election due to Scandal & Collapse)';
                } else {
                  nextElectionText = isZh ? '1937年11月 (四年期满)' : 'November 1937 (4-Year Term)';
                }
              } else {
                nextElectionText = isZh ? '1940年2月 (四年期满)' : 'February 1940 (4-Year Term)';
              }
            }

            return (
              <div className="flex justify-between items-center border-b border-ink/20 pb-1.5 mb-1 text-[11px]">
                <span className="text-ink-light font-bold uppercase tracking-wider">{isZh ? '下一次选举' : 'NEXT ELECTION'}</span>
                <span className="font-bold text-accent">{nextElectionText}</span>
              </div>
            );
          })()}

          {/* CNT立场 (Placed above government composition) - elevated to GameState top-level field */}
          {(() => {
            const stanceLabels: Record<string, { en: string; zh: string }> = {
              oppose: { en: 'Oppose', zh: '反对' },
              cooperate: { en: 'Cooperate', zh: '合作' },
              govern: { en: 'Govern', zh: '执政' }
            };
            const stanceText = isZh ? stanceLabels[state.cntStance]?.zh : stanceLabels[state.cntStance]?.en;
            return (
              <div className="flex justify-between items-center bg-paper-dark p-2 relative overflow-hidden mb-2" id="cnt-stance-indicator">
                <div className="flex flex-col gap-0.5">
                  <span className="font-typewriter text-[9px] uppercase tracking-wider text-ink-light leading-none">
                    {isZh ? 'CNT立场' : 'CNT STANCE'}
                  </span>
                </div>
                <div className={`px-2 py-0.5 font-display text-[10px] uppercase border-2 font-bold rotate-[-1deg] shadow-[1px_1px_0px_#1a1a1a] transition-all duration-300 ${
                  state.cntStance === 'govern' ? 'bg-paper text-emerald-800 border-emerald-800' :
                  state.cntStance === 'cooperate' ? 'bg-paper text-indigo-950 border-indigo-950' :
                  'bg-paper text-cnt-red border-cnt-red animate-pulse'
                }`}>
                  {stanceText}
                </div>
              </div>
            );
          })()}

          <div className="flex justify-between items-center border-b border-ink/20 pb-1">
            <span className="text-ink-light">{isZh ? '政府构成' : 'Government'}</span>
            <span className="font-bold">{isZh ? state.government.typeZh : state.government.type}</span>
          </div>
          <div className="flex justify-between items-center border-b border-ink/20 pb-1">
            <span className="text-ink-light">{isZh ? '总统' : 'President'}</span>
            <span>{isZh ? state.government.presidentZh : state.government.president}</span>
          </div>
          <div className="flex justify-between items-center border-b border-ink/20 pb-1">
            <span className="text-ink-light">{isZh ? '总理' : 'PM'}</span>
            <span>{isZh ? state.government.primeMinisterZh : state.government.primeMinister}</span>
          </div>

          {/* Active Coalition Details Pane (Inside domestic politics, placed under government info) */}
          {(state.activeCoalitions || []).map((activeCoalition, idx) => {
            const def = COALITION_DEFS.find(d => d.id === activeCoalition.activeId);
            if (!def) return null;

            const coalitionName = isZh ? def.nameZh : def.name;
            const isRuling = state.rulingCoalition === activeCoalition.activeId;

            return (
              <div key={activeCoalition.activeId} className="flex flex-col gap-2.5 font-typewriter text-xs bg-paper-dark p-2.5 relative overflow-hidden my-3 border-l-2" style={{ borderColor: isRuling ? '#cc0000' : '#4b5563' }}>
                <div className="font-bold text-[10px] uppercase tracking-wider flex justify-between items-center text-ink">
                  <span>{coalitionName}</span>
                  {isRuling && <span className="bg-cnt-red text-white px-1 py-0.5 text-[8px] rounded-sm">{isZh ? '执政联盟' : 'RULING'}</span>}
                </div>

                {/* Cohesion gauge with radial dots (halftone) and classic scale reference */}
                <div className="flex flex-col gap-1 pb-1.5 border-b border-ink/10">
                  <div className="flex justify-between font-typewriter text-[9px] uppercase tracking-wider text-ink-light">
                    <span>{isZh ? '政党联盟团结度' : 'Coalition Cohesion'}</span>
                    <span className="font-bold text-ink">{activeCoalition.cohesion}/100</span>
                  </div>
                  <div className="h-3 w-full border border-ink/20 bg-paper relative overflow-hidden">
                    <div 
                      className="h-full bg-ink bg-halftone transition-all duration-1000" 
                      style={{ width: `${activeCoalition.cohesion}%` }}
                      title={isZh ? `政党联盟团结度: ${activeCoalition.cohesion}` : `Coalition cohesion factor: ${activeCoalition.cohesion}`}
                    />
                  </div>
                  <div className="flex justify-between text-[7px] font-typewriter text-ink-light/70 uppercase leading-none mt-0.5 select-none">
                    <span>[0 DISSOLVED]</span>
                    <span>[50 SECURE]</span>
                    <span>[100 STEADFAST]</span>
                  </div>
                </div>

                {/* Attitude to CNT: 0-100 progress bar */}
                <div className="flex flex-col gap-1 pb-1.5 border-b border-ink/10">
                  <div className="flex justify-between font-typewriter text-[9px] uppercase tracking-wider text-ink-light">
                    <span>{isZh ? '联盟对CNT的态度' : 'Coalition\'s Attitude to CNT'}</span>
                    <span className={`font-bold ${
                      activeCoalition.cntAttitude >= 35 ? 'text-green-700' : 
                      activeCoalition.cntAttitude <= -30 ? 'text-cnt-red font-extrabold animate-pulse' : 
                      'text-ink'
                    }`}>
                      {Math.round((activeCoalition.cntAttitude + 100) / 2)}/100
                    </span>
                  </div>
                  
                  {/* Progress bar from 0 to 100 */}
                  <div className="h-3 w-full border border-ink/20 bg-paper relative overflow-hidden">
                    <div 
                      className="h-full bg-ink bg-halftone transition-all duration-1000"
                      style={{ width: `${(activeCoalition.cntAttitude + 100) / 2}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[7px] font-typewriter text-ink-light/80 uppercase tracking-tight select-none mt-0.5">
                    <span className="text-cnt-red font-bold">0% {isZh ? '敌对' : 'HOSTILE'}</span>
                    <span>50% {isZh ? '中立' : 'NEUTRAL'}</span>
                    <span className="text-ink font-bold">100% {isZh ? '友好' : 'FRIENDLY'}</span>
                  </div>
                </div>

                {/* Redrawn register sheet for member contributions */}
                <div className="flex flex-col gap-1 mt-1 border-t border-ink/20 pt-2">
                  <div className="grid grid-cols-4 text-[8px] text-ink-light uppercase pb-1 font-bold tracking-wider font-typewriter border-b border-ink/20">
                    <span>{isZh ? '结盟政党' : 'PARTY COAL.'}</span>
                    <span className="text-right">{isZh ? '承诺度' : 'COMMIT'}</span>
                    <span className="text-right">{isZh ? '派系力量' : 'POWER'}</span>
                    <span className="text-right">{isZh ? '合算贡献' : 'WEIGHT'}</span>
                  </div>
                  
                  <div className="flex flex-col gap-1 mt-1 font-typewriter">
                    {(() => {
                      // Compute total support of all parties currently in the alliance
                      const totalAllianceSupport = def.members.reduce((sum, m) => {
                        const sVal = m === 'CNT_FAI' ? calculatePartySupport(state, 'CNT_FAI') : (state.partySupport?.[m as Party] ?? calculatePartySupport(state, m as Party));
                        return sum + sVal;
                      }, 0);

                      return def.members.map(member => {
                        const contribution = activeCoalition.memberContributions[member as Party] ?? 80;
                        const supportVal = member === 'CNT_FAI' ? calculatePartySupport(state, 'CNT_FAI') : (state.partySupport?.[member as Party] ?? calculatePartySupport(state, member as Party));
                        
                        // Coalition faction power = (partySupport / sum of all coalition parties support) * 100%
                        const factionPowerPct = totalAllianceSupport > 0 ? (supportVal / totalAllianceSupport) * 100 : 100 / (def.members.length || 1);
                        const weightedContrib = contribution * (factionPowerPct / 100);

                        const pColor = member === 'CNT_FAI' ? (getPartyColor(state, 'CNT_FAI')) : (getPartyColor(state, member as any) || '#9ca3af');
                        const pLabel = getPartyName(state, member as any, isZh, true);

                        return (
                          <div key={member} className="grid grid-cols-4 text-[9px] items-center py-0.5 border-b border-dashed border-ink/10 last:border-0 font-typewriter">
                            <div className="flex items-center gap-1 font-bold">
                              <div className="w-1.5 h-1.5 border border-ink" style={{ backgroundColor: pColor }} />
                              <span className="tracking-tight text-ink">{pLabel}</span>
                            </div>
                            <span className="text-right text-ink-light" title={isZh ? `执政契约投入/承诺指度: ${contribution}` : `Party commitment score: ${contribution}`}>{contribution}</span>
                            <span className="text-right text-ink-light" title={isZh ? `全国支持率: ${supportVal.toFixed(1)}%` : `National support: ${supportVal.toFixed(1)}%`}>
                              {factionPowerPct.toFixed(1)}%
                            </span>
                            <span className="text-right font-bold text-ink" title={isZh ? `合算贡献 = 承诺度 ${contribution} * 派系力量 ${factionPowerPct.toFixed(1)}%` : `Weight = Commit ${contribution} * Power ${factionPowerPct.toFixed(1)}%`}>
                              {weightedContrib.toFixed(1)}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </AccordionSection>

      <AccordionSection title={isZh ? '政党关系' : 'Party Relations'} defaultOpen={true}>
        <div className="flex flex-col gap-2 text-xs font-mono">
          <div className="flex flex-col gap-1">
            {(Object.entries(state.partyRelations) as [Party, number][]).map(([party, value]) => {
              if (party === 'PS' && !state.ps_founded) return null;
              if (party === 'FE' && !state.fe_founded) return null;
              if (party === 'POUM' && !state.poum_founded) return null;
              return (
                <div key={party} className="flex justify-between items-center text-[10px] group relative">
                  <span className="cursor-help border-b border-dotted border-ink/30" title={isZh ? partyDescriptions[party].zh : partyDescriptions[party].en}>
                    {party}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 bg-ink/10 border border-ink/30 overflow-hidden">
                      <div className="h-full bg-ink/50" style={{ width: `${value}%` }} />
                    </div>
                    <span className={`min-w-[5.5rem] text-right whitespace-nowrap ${getPartyRelationColor(value)}`}>
                      {getPartyRelationLevel(value, isZh)} <span className="text-ink-light font-normal">({formatRelationValue(value)}/100)</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AccordionSection>

      <AccordionSection title={isZh ? '地区问题' : 'Regional Issues'} defaultOpen={true}>
        <div className="flex flex-col gap-2 text-xs">
          {(() => {
            const REGIONS_CONFIG = [
              { id: 'andalusia', nameEn: 'Andalusia', nameZh: '安达卢西亚' },
              { id: 'catalonia', nameEn: 'Catalonia', nameZh: '加泰罗尼亚' },
              { id: 'basque', nameEn: 'Basque Country', nameZh: '巴斯克' },
              { id: 'galicia', nameEn: 'Galicia', nameZh: '加利西亚' },
              { id: 'asturias', nameEn: 'Asturias', nameZh: '阿斯图里亚斯' },
            ] as const;

            return (
              <div className="flex flex-col gap-2 font-mono">
                {REGIONS_CONFIG.map((region) => {
                  const currentStatus = state.regionalStatuses?.[region.id] || 'direct';
                  return (
                    <div 
                      key={region.id} 
                      className="flex justify-between items-center p-2 bg-paper-dark/40 border border-ink/10 rounded-sm hover:border-ink/20 transition-all"
                    >
                      <span className="font-display font-medium uppercase tracking-wider text-xs text-ink/90">
                        {isZh ? region.nameZh : region.nameEn}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-[2px] font-bold uppercase transition-all ${
                        currentStatus === 'independent' ? 'bg-rose-50 text-rose-800 border border-rose-200 shadow-sm' :
                        currentStatus === 'autonomy' ? 'bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-sm' :
                        'bg-zinc-50 text-zinc-700 border border-zinc-200 shadow-sm'
                      }`}>
                        {isZh 
                          ? (currentStatus === 'independent' ? '独立' : currentStatus === 'autonomy' ? '自治' : '直辖')
                          : (currentStatus === 'independent' ? 'Independent' : currentStatus === 'autonomy' ? 'Autonomous' : 'Centralized')
                        }
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </AccordionSection>

      {state.cortes && (
        <AccordionSection title={isZh ? '制宪议会' : 'Constituent Cortes'} defaultOpen={true}>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-mono mb-1">
              <span>{isZh ? '左翼' : 'Left'}</span>
              <span>{getPartyName(state, 'AP', isZh, true)}</span>
            </div>
            <div className="h-4 w-full flex rounded-sm overflow-hidden border border-ink bg-paper-dark">
              {(Object.entries(state.cortes) as [Party, number][])
                .filter(([_, seats]) => seats > 0)
                .sort((a, b) => {
                  const order = ['POUM', 'PCE', 'PRRevS', 'PSOE', 'PS', 'ERC', 'IR', 'UR', 'PNV', 'PRR', 'DLR', 'Other', 'AP', 'RE', 'CT', 'FE'];
                  return order.indexOf(a[0]) - order.indexOf(b[0]);
                })
                .map(([party, seats]) => (
                <div 
                  key={party}
                  className="h-full transition-all duration-1000"
                  style={{ 
                    width: `${(seats / 470) * 100}%`,
                    backgroundColor: getPartyColor(state, party as any) || '#9ca3af'
                  }}
                  title={`${party}: ${seats}`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono mt-1">
              {(Object.entries(state.cortes) as [Party, number][])
                .filter(([_, seats]) => seats > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([party, seats]) => (
                <div key={party} className="flex items-center gap-1">
                  <div className="w-2 h-2 border border-ink" style={{ backgroundColor: getPartyColor(state, party as any) || '#9ca3af' }} />
                  {party}: {seats}
                </div>
              ))}
            </div>
          </div>
        </AccordionSection>
      )}

      {state.cortes && (
        <AccordionSection title={isZh ? '内阁部长' : 'Cabinet Ministers'} defaultOpen={true}>
          <div className="flex flex-col gap-2 text-xs font-mono">
            <MinisterRow deptKey="labor" nameEn="Labor" nameZh="劳工部" party={state.ministers.labor} />
            <MinisterRow deptKey="health" nameEn="Health" nameZh="卫生部" party={state.ministers.health} />
            <MinisterRow deptKey="justice" nameEn="Justice" nameZh="司法部" party={state.ministers.justice} />
            <MinisterRow deptKey="industry" nameEn="Industry" nameZh="工业部" party={state.ministers.industry} />
            <MinisterRow deptKey="interior" nameEn="Interior" nameZh="内政部" party={state.ministers.interior} />
            <MinisterRow deptKey="finance" nameEn="Finance" nameZh="财政部" party={state.ministers.finance || 'AP'} />
            <MinisterRow deptKey="agriculture" nameEn="Agriculture" nameZh="农业部" party={state.ministers.agriculture || 'AP'} />
            <MinisterRow deptKey="war" nameEn="War" nameZh="战争部" party={state.ministers.war} />
            <MinisterRow deptKey="estado" nameEn="State (Foreign)" nameZh="国务部" party={state.ministers.estado || 'AP'} />
          </div>
        </AccordionSection>
      )}



      <AccordionSection title={isZh ? '国家经济与税收' : 'National Economy'} defaultOpen={true}>
        <div className="flex flex-col gap-3 text-xs font-mono">
          {/* Miniature Top Indicators Grid */}
          <div className="grid grid-cols-2 gap-2 bg-paper-light border border-ink/10 rounded-sm p-2 shadow-inner">
            <div className="flex flex-col">
              <span className="text-[10px] text-ink-light uppercase tracking-tight">{isZh ? '经济增长率' : 'Growth Rate'}</span>
              <span className="text-sm font-bold text-ink">{(state.economy_growth !== undefined ? state.economy_growth : 2.5).toFixed(1)}%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-ink-light uppercase tracking-tight">{isZh ? '通货膨胀率' : 'Inflation Rate'}</span>
              <span className={`text-sm font-bold ${(state.inflation_rate !== undefined ? state.inflation_rate : 3.5) > 15 ? 'text-cnt-red font-extrabold animate-pulse' : 'text-ink'}`}>
                {(state.inflation_rate !== undefined ? state.inflation_rate : 3.5).toFixed(1)}%
              </span>
            </div>
            <div className="flex flex-col mt-1">
              <span className="text-[10px] text-ink-light uppercase tracking-tight">{isZh ? '失业率' : 'Unemployment'}</span>
              <span className="text-sm font-bold text-ink">{(state.unemployment_rate !== undefined ? state.unemployment_rate : 11.2).toFixed(1)}%</span>
            </div>
            <div className="flex flex-col mt-1">
              <span className="text-[10px] text-ink-light uppercase tracking-tight">{isZh ? '国家财政预算' : 'Gov Budget'}</span>
              <span className={`text-sm font-bold ${(state.budget !== undefined ? state.budget : 12.0) >= 0 ? 'text-green-700' : 'text-cnt-red'}`}>
                {(state.budget !== undefined ? state.budget : 12.0).toFixed(1)}M ₧
              </span>
            </div>
            {/* Extended indicators */}
            <div className="flex flex-col mt-1 border-t border-ink/5 pt-1">
              <span className="text-[10px] text-ink-light uppercase tracking-tight">{isZh ? '黄金/外汇储备' : 'Gold / FX Reserves'}</span>
              <span className="text-sm font-bold text-amber-800">
                {(state.gold_reserves ?? 2200).toFixed(0)}M/{(state.foreign_exchange ?? 180).toFixed(0)}M ₧
              </span>
            </div>
            <div className="flex flex-col mt-1 border-t border-ink/5 pt-1">
              <span className="text-[10px] text-ink-light uppercase tracking-tight">{isZh ? '公债规模' : 'Public Debt'}</span>
              <span className="text-sm font-bold text-slate-700">
                {(state.public_debt ?? 500.0).toFixed(0)}M ₧
              </span>
            </div>
          </div>
        </div>
      </AccordionSection>

      <AccordionSection title={isZh ? '内部派系' : 'Internal Factions'} defaultOpen={true}>
        <div className="flex flex-col gap-4">
          <FactionBar 
            name={isZh ? factionNames.Treintistas.zh : factionNames.Treintistas.en} 
            influence={state.factions.Treintistas.influence} 
            dissent={state.factions.Treintistas.dissent}
            color="bg-ink-light" 
          />
          <FactionBar 
            name={isZh ? factionNames.Cenetistas.zh : factionNames.Cenetistas.en} 
            influence={state.factions.Cenetistas.influence} 
            dissent={state.factions.Cenetistas.dissent}
            color="bg-ink" 
          />
          <FactionBar 
            name={isZh ? factionNames.Faistas.zh : factionNames.Faistas.en} 
            influence={state.factions.Faistas.influence} 
            dissent={state.factions.Faistas.dissent}
            color="bg-cnt-red" 
          />
          <FactionBar 
            name={isZh ? factionNames.Puristas.zh : factionNames.Puristas.en} 
            influence={state.factions.Puristas.influence} 
            dissent={state.factions.Puristas.dissent}
            color="bg-red-900" 
          />
          {state.factions.Jabalistas && state.factions.Jabalistas.influence > 0 && (
            <FactionBar 
              name={isZh ? factionNames.Jabalistas.zh : factionNames.Jabalistas.en} 
              influence={state.factions.Jabalistas.influence} 
              dissent={state.factions.Jabalistas.dissent}
              color="bg-amber-700" 
            />
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="h-24 w-24">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={40}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#f4f1ea', border: '1px solid #141414', borderRadius: 0, fontFamily: 'monospace' }}
                  itemStyle={{ color: '#141414' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col items-end text-right">
            <span className="font-typewriter text-[10px] uppercase text-ink-light tracking-wider">
              {isZh ? '整体异议度' : 'Overall Dissent'}
            </span>
            <span className={`font-display text-xl ${getDissentColor(overallDissent)}`}>
              {getDissentLevel(overallDissent, isZh)}
            </span>
            <span className="font-typewriter text-xs opacity-80">
              {overallDissent.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-ink/20">
          <div className="flex justify-between items-center mb-1">
            <span className="font-typewriter text-xs uppercase font-bold">
              {isZh ? '官僚度' : 'Bureaucratization'}
            </span>
            <span className="font-typewriter text-xs">
              {state.stats.bureaucratization.toFixed(0)}% ({getBureaucratizationLevel(state.stats.bureaucratization, isZh)})
            </span>
          </div>
          <div className="h-2 w-full border border-ink bg-paper-dark relative overflow-hidden">
            <div 
              className="h-full bg-ink transition-all duration-500" 
              style={{ width: `${state.stats.bureaucratization}%` }}
            />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-ink/20">
          <div className="flex justify-between items-center mb-1">
            <span className="font-typewriter text-xs uppercase font-bold">
              {isZh ? 'CNT 投票率与流向' : 'CNT Voting Rate & Flow'}
            </span>
            <span className="font-typewriter text-xs">
              {(state.cntVotingRate || 0).toFixed(0)}%
            </span>
          </div>
          <div className="h-4 w-full border border-ink bg-paper-dark flex overflow-hidden">
            {(() => {
              if ((state.cntVotingRate || 0) === 0) return null;

              if (isOrganizationEstablished(state, 'PRRevS')) {
                return (
                  <div 
                    className="h-full transition-all duration-500" 
                    style={{ width: `${(state.cntVotingRate || 0)}%`, backgroundColor: PARTY_COLORS['PS'] }}
                    title={isZh ? '革命共和工团党 (PRRevS)' : 'PRRevS'}
                  />
                );
              } else {
                const pceSupport = calculatePartySupport(state, 'PCE');
                const poumSupport = state.poum_founded ? calculatePartySupport(state, 'POUM') : 0;
                const psoeSupport = calculatePartySupport(state, 'PSOE');
                const irSupport = calculatePartySupport(state, 'IR');
                const ercSupport = calculatePartySupport(state, 'ERC');
                const totalLeftSupport = pceSupport + poumSupport + psoeSupport + irSupport + ercSupport;
                
                if (totalLeftSupport === 0) {
                  return (
                    <div 
                      className="h-full bg-cnt-red transition-all duration-500" 
                      style={{ width: `${(state.cntVotingRate || 0)}%` }}
                    />
                  );
                }

                return (
                  <>
                    <div className="h-full transition-all duration-500" style={{ width: `${(pceSupport / totalLeftSupport) * (state.cntVotingRate || 0)}%`, backgroundColor: PARTY_COLORS['PCE'] }} title="PCE" />
                    {state.poum_founded && <div className="h-full transition-all duration-500" style={{ width: `${(poumSupport / totalLeftSupport) * (state.cntVotingRate || 0)}%`, backgroundColor: PARTY_COLORS['POUM'] }} title="POUM" />}
                    <div className="h-full transition-all duration-500" style={{ width: `${(psoeSupport / totalLeftSupport) * (state.cntVotingRate || 0)}%`, backgroundColor: PARTY_COLORS['PSOE'] }} title="PSOE" />
                    <div className="h-full transition-all duration-500" style={{ width: `${(irSupport / totalLeftSupport) * (state.cntVotingRate || 0)}%`, backgroundColor: PARTY_COLORS['IR'] }} title="IR" />
                    <div className="h-full transition-all duration-500" style={{ width: `${(ercSupport / totalLeftSupport) * (state.cntVotingRate || 0)}%`, backgroundColor: PARTY_COLORS['ERC'] }} title="ERC" />
                  </>
                );
              }
            })()}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-ink/20">
          <div className="flex justify-between items-center mb-2">
            <span className="font-typewriter text-xs uppercase font-bold">
              {isZh ? 'CNT-FAI 组织' : 'CNT-FAI Organizations'}
            </span>
            <span className="font-mono text-[9px] text-ink-light">
              {isZh ? '悬停查看月度效果' : 'Hover for monthly effects'}
            </span>
          </div>
          <div className="grid w-full min-w-0 grid-cols-4 gap-x-2 gap-y-3">
            {getOrganizationsForOwner('CNT_FAI')
              .filter((definition) => isOrganizationEstablished(state, definition.id))
              .map((definition, index) => {
                const typeLabel = isZh
                  ? ({ union: '工会', political: '政治组织', youth: '青年组织', women: '女性组织', agricultural: '农业组织', militia: '民兵组织' } as const)[definition.type]
                  : ({ union: 'Union', political: 'Political', youth: 'Youth', women: 'Women', agricultural: 'Agricultural', militia: 'Militia' } as const)[definition.type];
                const fullName = isZh ? definition.nameZh : definition.name;
                const monthlyEffect = isZh ? definition.monthlyEffectTextZh : definition.monthlyEffectText;
                const capability = isZh ? definition.capabilityTextZh : definition.capabilityText;
                return (
                  <div key={definition.id} className="relative group min-w-0 flex justify-center">
                    <div
                      className="h-11 w-11 shrink-0 flex items-center justify-center"
                      title={`${fullName}\n${typeLabel}\n${monthlyEffect}${capability ? `\n${capability}` : ''}`}
                    >
                      {definition.icon ? (
                        <img
                          src={resolveOrganizationIcon(definition.icon)}
                          alt={definition.abbreviation}
                          className={`h-full w-full object-contain ${ORGANIZATION_GLOW_CLASS} ${definition.id === 'FIJL' ? 'rounded-full' : ''}`}
                          onError={(event) => {
                            // Keep an intentional abbreviation badge when an
                            // optional art asset is unavailable in a build.
                            event.currentTarget.style.display = 'none';
                            event.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : (
                        <span className={`font-display text-[11px] font-bold text-cnt-red leading-none text-center ${ORGANIZATION_GLOW_CLASS}`} data-organization-fallback>
                          {definition.abbreviation}
                        </span>
                      )}
                      {definition.icon && (
                        <span className={`hidden font-display text-[11px] font-bold text-cnt-red leading-none text-center ${ORGANIZATION_GLOW_CLASS}`} data-organization-fallback>
                          {definition.abbreviation}
                        </span>
                      )}
                    </div>
                    <span className="absolute -bottom-1 left-1/2 max-w-full -translate-x-1/2 overflow-hidden text-ellipsis bg-ink text-paper px-1 text-[8px] font-mono leading-tight whitespace-nowrap">
                      {definition.abbreviation}
                    </span>
                    <div className={`pointer-events-none absolute z-30 bottom-full mb-2 w-40 rounded-sm border border-ink bg-paper p-2 text-[10px] font-mono leading-snug text-ink opacity-0 shadow-lg transition-opacity group-hover:opacity-100 ${
                      index % 4 === 0 ? 'left-0' : index % 4 === 3 ? 'right-0' : 'left-1/2 -translate-x-1/2'
                    }`}>
                      <div className="font-bold text-[11px]">{fullName}</div>
                      <div className="text-ink-light">{typeLabel}</div>
                      <div className="mt-1 border-t border-ink/10 pt-1">
                        <span className="font-bold">{isZh ? '月度效果：' : 'Monthly: '}</span>{monthlyEffect}
                      </div>
                      {capability && (
                        <div className="mt-1 text-ink-light">
                          <span className="font-bold">{isZh ? '能力：' : 'Capability: '}</span>{capability}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </AccordionSection>

      <AccordionSection title={isZh ? '武装情况' : 'Armed Forces'} defaultOpen={true}>
        <div className="mb-4">
          <h3 className="font-typewriter text-sm font-bold mb-2 opacity-80">{isZh ? '政府军' : 'Regular Army'}</h3>
          <LoyaltyBar 
            name={isZh ? '正规军' : 'Ejército Regular'} 
            manpower={state.armedForces.regularArmy.manpower} 
            loyalty={state.armedForces.regularArmy.loyalty} 
          />
          <MilitiaItem name={isZh ? '非洲军团 (Ejército de África)' : 'Ejército de África'} manpower={state.armedForces.militias.africaArmy} color="bg-yellow-600" isAfrica={true} />
        </div>

        <div className="mb-4">
          <h3 className="font-typewriter text-sm font-bold mb-2 opacity-80">{isZh ? '治安部队' : 'Security Forces'}</h3>
          <LoyaltyBar 
            name={isZh ? '国民警卫队' : 'Guardia Nacional Republicana'} 
            manpower={state.armedForces.guardiaNacional.manpower} 
            loyalty={state.armedForces.guardiaNacional.loyalty} 
          />
          <LoyaltyBar 
            name={isZh ? '突击卫队' : 'Guardia de Asalto'} 
            manpower={state.armedForces.guardiaAsalto.manpower} 
            loyalty={state.armedForces.guardiaAsalto.loyalty} 
          />
        </div>

        <div>
          <h3 className="font-typewriter text-sm font-bold mb-2 opacity-80">{isZh ? '准军事组织' : 'Paramilitary'}</h3>
          <div className="flex flex-col gap-1">
            <MilitiaItem name="Milicias Confederales" manpower={state.armedForces.militias.cntFai} color="bg-cnt-red" isHighlighted={true} />
            <MilitiaItem name="MAOC" manpower={state.armedForces.militias.maoc} color="bg-red-700" />
            <MilitiaItem name="Milicias del POUM" manpower={state.armedForces.militias.poum} color="bg-red-500" />
            <MilitiaItem name="Milicias de la UGT" manpower={state.armedForces.militias.ugt} color="bg-red-400" />
            <MilitiaItem name="Requeté" manpower={state.armedForces.militias.requete} color="bg-yellow-800" />
            <MilitiaItem name="Milicias Falangistas" manpower={state.armedForces.militias.falange} color="bg-blue-800" />
          </div>
        </div>

        {state.civilWarStatus !== 'not_started' && (
          <div className="mt-4">
            <h3 className="font-typewriter text-sm font-bold mb-2 opacity-80">{isZh ? '国际纵队' : 'International Brigades'}</h3>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between font-typewriter text-xs uppercase tracking-wider">
                <span>{isZh ? '状态' : 'Status'}</span>
                <span className={state.internationalBrigadesFormed ? 'text-green-700 font-bold' : 'text-ink-light'}>
                  {state.internationalBrigadesFormed ? (isZh ? '已组建' : 'Formed') : (isZh ? '未组建' : 'Not Formed')}
                </span>
              </div>
              {state.internationalBrigadesFormed && (
                <div className="flex justify-between font-typewriter text-xs uppercase tracking-wider">
                  <span>{isZh ? '兵力' : 'Strength'}</span>
                  <span>{state.internationalBrigades.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </AccordionSection>

      <AccordionSection title={isZh ? '阶层民意' : 'Social Classes'}>
        <div className="flex flex-col gap-4">
          {Object.entries(CLASS_INFO).map(([id, info]) => {
            const classSupport = state.classes[id as SocialClass].support;
            return (
              <ClassBar 
                key={id}
                name={isZh ? info.nameZh : info.nameEn}
                pop={info.pop}
                support={classSupport.CNT_FAI}
                supportData={classSupport}
                appeal={isZh ? info.appealZh : ''}
                sensitive={isZh ? info.sensitiveZh : ''}
                description={isZh ? (info.descriptionZh || '') : (info.descriptionEn || '')}
              />
            );
          })}
        </div>
      </AccordionSection>

      <AccordionSection title={isZh ? '全国支持率' : 'National Support'}>
        <div className="flex flex-col gap-4">
          <AllianceBar name={getPartyName(state, 'CNT_FAI', isZh, true)} value={calculatePartySupport(state, 'CNT_FAI')} color={getPartyColor(state, 'CNT_FAI')} breakdown={getPartySupportBreakdown(state, 'CNT_FAI')} />
          {state.poum_founded && <AllianceBar name={getPartyName(state, 'POUM', isZh, true)} value={calculatePartySupport(state, 'POUM')} color={PARTY_COLORS['POUM']} breakdown={getPartySupportBreakdown(state, 'POUM')} />}
          <AllianceBar name={getPartyName(state, 'PCE', isZh, true)} value={calculatePartySupport(state, 'PCE')} color={PARTY_COLORS['PCE']} breakdown={getPartySupportBreakdown(state, 'PCE')} />
          <AllianceBar name={getPartyName(state, 'PSOE', isZh, true)} value={calculatePartySupport(state, 'PSOE')} color={PARTY_COLORS['PSOE']} breakdown={getPartySupportBreakdown(state, 'PSOE')} />
          {state.ps_founded && <AllianceBar name={getPartyName(state, 'PS', isZh, true)} value={calculatePartySupport(state, 'PS')} color={PARTY_COLORS['PS']} breakdown={getPartySupportBreakdown(state, 'PS')} />}
          <AllianceBar name={getPartyName(state, 'ERC', isZh, true)} value={calculatePartySupport(state, 'ERC')} color={PARTY_COLORS['ERC']} breakdown={getPartySupportBreakdown(state, 'ERC')} />
          <AllianceBar name={getPartyName(state, 'IR', isZh, true)} value={calculatePartySupport(state, 'IR')} color={PARTY_COLORS['IR']} breakdown={getPartySupportBreakdown(state, 'IR')} />
          <AllianceBar name={getPartyName(state, 'UR', isZh, true)} value={calculatePartySupport(state, 'UR')} color={PARTY_COLORS['UR']} breakdown={getPartySupportBreakdown(state, 'UR')} />
          <AllianceBar name={getPartyName(state, 'PNV', isZh, true)} value={calculatePartySupport(state, 'PNV')} color={PARTY_COLORS['PNV']} breakdown={getPartySupportBreakdown(state, 'PNV')} />
          <AllianceBar name={getPartyName(state, 'PRR', isZh, true)} value={calculatePartySupport(state, 'PRR')} color={PARTY_COLORS['PRR']} breakdown={getPartySupportBreakdown(state, 'PRR')} />
          <AllianceBar name={getPartyName(state, 'DLR', isZh, true)} value={calculatePartySupport(state, 'DLR')} color={PARTY_COLORS['DLR']} breakdown={getPartySupportBreakdown(state, 'DLR')} />
          <AllianceBar name={getPartyName(state, 'AP', isZh, true)} value={calculatePartySupport(state, 'AP')} color={PARTY_COLORS['AP']} breakdown={getPartySupportBreakdown(state, 'AP')} />
          <AllianceBar name={getPartyName(state, 'RE', isZh, true)} value={calculatePartySupport(state, 'RE')} color={PARTY_COLORS['RE']} breakdown={getPartySupportBreakdown(state, 'RE')} />
          <AllianceBar name={getPartyName(state, 'CT', isZh, true)} value={calculatePartySupport(state, 'CT')} color={PARTY_COLORS['CT']} breakdown={getPartySupportBreakdown(state, 'CT')} />
          {state.fe_founded && <AllianceBar name={getPartyName(state, 'FE', isZh, true)} value={calculatePartySupport(state, 'FE')} color={PARTY_COLORS['FE']} breakdown={getPartySupportBreakdown(state, 'FE')} />}
          <AllianceBar name={getPartyName(state, 'Other', isZh, true)} value={calculatePartySupport(state, 'Other')} color={PARTY_COLORS['Other']} breakdown={getPartySupportBreakdown(state, 'Other')} />
        </div>
      </AccordionSection>

      <AccordionSection title={isZh ? '国际关系' : 'International Relations'}>
        <div className="flex flex-col gap-2">
          <RelationItem name={isZh ? '英国' : 'UK'} value={state.relations.uk} text={getRelationText(state.relations.uk, 'western', isZh)} colorClass={getRelationColor(state.relations.uk)} />
          <RelationItem name={isZh ? '美国' : 'USA'} value={state.relations.usa} text={getRelationText(state.relations.usa, 'western', isZh)} colorClass={getRelationColor(state.relations.usa)} />
          <RelationItem name={isZh ? '法国' : 'France'} value={state.relations.france} text={getRelationText(state.relations.france, 'western', isZh)} colorClass={getRelationColor(state.relations.france)} />
          <RelationItem name={isZh ? '葡萄牙' : 'Portugal'} value={state.relations.portugal} text={getRelationText(state.relations.portugal, 'western', isZh)} colorClass={getRelationColor(state.relations.portugal)} />
          <RelationItem name={isZh ? '德国' : 'Germany'} value={state.relations.germany} text={getRelationText(state.relations.germany, 'western', isZh)} colorClass={getRelationColor(state.relations.germany)} />
          <RelationItem name={isZh ? '意大利' : 'Italy'} value={state.relations.italy} text={getRelationText(state.relations.italy, 'western', isZh)} colorClass={getRelationColor(state.relations.italy)} />
          <div className="h-px bg-ink/20 my-1" />
          <RelationItem name={isZh ? '苏联' : 'USSR'} value={state.relations.ussr} text={getRelationText(state.relations.ussr, 'socialist', isZh)} colorClass={getRelationColor(state.relations.ussr)} />
          <RelationItem name={isZh ? '墨西哥' : 'Mexico'} value={state.relations.mexico} text={getRelationText(state.relations.mexico, 'socialist', isZh)} colorClass={getRelationColor(state.relations.mexico)} />
          <RelationItem name={isZh ? '国际社会主义者' : 'Int. Socialists'} value={state.relations.internationalSocialists} text={getRelationText(state.relations.internationalSocialists, 'socialist', isZh)} colorClass={getRelationColor(state.relations.internationalSocialists)} />
        </div>
      </AccordionSection>
    </div>
  );
};

const RelationItem: React.FC<{ name: string; value: number; text: string; colorClass: string }> = ({ name, value, text, colorClass }) => (
  <div className="flex justify-between items-center font-typewriter text-xs uppercase tracking-wider">
    <span>{name}</span>
    <span className="flex items-center gap-1.5 whitespace-nowrap" title={`${formatRelationValue(value)}/100`}>
      <span className={colorClass}>{text}</span>
      <span className="text-ink-light font-normal">({formatRelationValue(value)}/100)</span>
    </span>
  </div>
);

const PolicyItem: React.FC<{ name: string; text: string; colorClass: string }> = ({ name, text, colorClass }) => (
  <div className="flex justify-between items-center font-typewriter text-[10px] uppercase tracking-wider py-1 border-b border-dotted border-ink/30">
    <span>{name}</span>
    <span className={colorClass}>{text}</span>
  </div>
);

const AccordionSection: React.FC<{ title: string; defaultOpen?: boolean; children: React.ReactNode }> = ({ title, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  return (
    <div className="mb-2">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center font-display text-xl uppercase border-b-2 border-ink pb-1 mb-3 text-left hover:text-cnt-red transition-colors"
      >
        <span>{title}</span>
        <span className="text-sm font-typewriter">{isOpen ? '▼' : '▶'}</span>
      </button>
      {isOpen && <div className="flex flex-col gap-2 animate-in slide-in-from-top-2 fade-in duration-200">{children}</div>}
    </div>
  );
};

const ClassBar: React.FC<{ name: string; pop: number; support: number; supportData: Record<'CNT_FAI' | Party, number>; appeal: string; sensitive: string; description?: string }> = ({ name, pop, support, supportData, appeal, sensitive, description }) => {
  const { state } = useGame();
  const isZh = state.language === 'zh';
  
  
  const sortedSupport = (Object.entries(supportData) as [string, number][])
    .filter(([_, val]) => val > 0)
    .sort((a, b) => b[1] - a[1]);
    
  const totalSupport = sortedSupport.reduce((sum, [_, val]) => sum + val, 0) || 1;
  const relativeSupportPercent = Number(((support / totalSupport) * 100).toFixed(2));
    
  const pieData = sortedSupport.map(([party, val]) => ({
    name: getPartyName(state, party as any, isZh, true),
    value: val,
    fill: getPartyColor(state, party as any) || '#9ca3af'
  }));
  
  const [isHovered, setIsHovered] = React.useState(false);
  
  return (
    <div className="flex flex-col gap-1 group relative" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <div className="flex justify-between font-typewriter text-xs uppercase tracking-wider">
        <span className="truncate pr-2 cursor-help border-b border-dotted border-ink" title={isZh ? `核心诉求: ${appeal}\n敏感议题: ${sensitive}` : ''}>{name} ({pop}%)</span>
        <span>{relativeSupportPercent.toFixed(2)}%</span>
      </div>
      <div className="h-3 w-full border border-ink bg-paper-dark relative overflow-hidden">
        <div 
          className={`h-full bg-cnt-red transition-all duration-500 bg-halftone`} 
          style={{ width: `${relativeSupportPercent}%` }}
        />
      </div>
      
      {/* Custom Tooltip on Hover */}
      {isHovered && (
      <div className="absolute left-0 top-full mt-1 w-full bg-paper border border-ink p-2 text-[10px] font-typewriter z-50 shadow-md">
        {description && (
          <div className="mb-2 text-ink-light leading-tight italic border-b border-ink/20 pb-2">{description}</div>
        )}
        <div className="font-bold mb-1 border-b border-ink/20 pb-1">{isZh ? '政党支持率' : 'Party Support'}</div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-20 h-20 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={35} stroke="none">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-0.5 flex-1">
            {sortedSupport.map(([party, val]) => (
              <div key={party} className="flex justify-between text-ink-light items-center">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getPartyColor(state, party as any) || '#9ca3af' }} />
                  <span>{getPartyName(state, party as any, isZh, true)}</span>
                </div>
                <span>{((val / totalSupport) * 100).toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="font-bold mb-1">{isZh ? '核心诉求' : 'Core Appeal'}:</div>
        <div className="mb-2 text-ink-light leading-tight">{appeal}</div>
        <div className="font-bold mb-1">{isZh ? '敏感议题' : 'Sensitive Issues'}:</div>
        <div className="text-ink-light leading-tight">{sensitive}</div>
      </div>
      )}
    </div>
  );
};

const FactionBar: React.FC<{ name: string; influence: number; dissent: number; color: string }> = ({ name, influence, dissent, color }) => {
  const { state } = useGame();
  const isZh = state.language === 'zh';
  
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between font-typewriter text-xs uppercase tracking-wider">
        <span className="truncate pr-2" title={name}>{name}</span>
        <span>{influence}%</span>
      </div>
      <div className="h-3 w-full border border-ink bg-paper-dark relative overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500 bg-halftone`} 
          style={{ width: `${influence}%` }}
        />
      </div>
      <div className="flex justify-between font-typewriter text-[10px] uppercase tracking-wider mt-1 opacity-80">
        <span>{isZh ? '分歧度' : 'Dissent'}</span>
        <span className={dissent > 75 ? 'text-cnt-red font-bold' : ''}>{dissent}%</span>
      </div>
      <div className="h-1.5 w-full border border-ink bg-paper-dark relative overflow-hidden">
        <div 
          className={`h-full bg-cnt-red transition-all duration-500`} 
          style={{ width: `${dissent}%` }}
        />
      </div>
    </div>
  );
};

const AllianceBar: React.FC<{ name: string; value: number; color: string; breakdown?: { classId: SocialClass; contribution: number }[] }> = ({ name, value, color, breakdown }) => {
  const { state } = useGame();
  const isZh = state.language === 'zh';
  const [isHovered, setIsHovered] = React.useState(false);
  
  const exactTotal = breakdown?.reduce((sum, b) => sum + b.contribution, 0) || 1;

  const pieData = breakdown?.map(b => ({
    name: isZh ? CLASS_INFO[b.classId].nameZh : CLASS_INFO[b.classId].nameEn,
    value: b.contribution,
    fill: CLASS_COLORS[b.classId] || '#9ca3af'
  })) || [];

  return (
  <div className="flex flex-col gap-1 relative" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
    <div className="flex justify-between font-typewriter text-xs uppercase tracking-wider">
      <span className={breakdown ? "cursor-help border-b border-dotted border-ink" : ""}>{name}</span>
      <span>{value.toFixed(2)}%</span>
    </div>
    <div className="h-3 w-full border border-ink bg-paper-dark relative overflow-hidden">
      <div 
        className={`h-full transition-all duration-500 bg-halftone`} 
        style={{ width: `${value}%`, backgroundColor: color }}
      />
    </div>
    {breakdown && breakdown.length > 0 && isHovered && (
      <div className="absolute left-0 top-full mt-1 w-full bg-paper border border-ink p-2 text-[10px] font-typewriter z-50 shadow-md">
        <div className="font-bold mb-1 border-b border-ink/20 pb-1">{isZh ? '支持者阶层构成' : 'Supporter Demographics'}</div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-20 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={35} stroke="none">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-0.5 flex-1">
            {breakdown.map(b => (
              <div key={b.classId} className="flex justify-between text-ink-light items-center">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CLASS_COLORS[b.classId] || '#9ca3af' }} />
                  <span>{isZh ? CLASS_INFO[b.classId].nameZh : CLASS_INFO[b.classId].nameEn}</span>
                </div>
                <div className="text-right">
                  <span>{((b.contribution / exactTotal) * 100).toFixed(2)}%</span>
                  <span className="text-[8px] opacity-70 ml-1">({b.contribution.toFixed(2)}% {isZh ? '全国' : 'Pop'})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
  </div>
)};

const LoyaltyBar: React.FC<{ name: string; manpower: number; loyalty: number }> = ({ name, manpower, loyalty }) => {
  const { state } = useGame();
  const isZh = state.language === 'zh';
  
  return (
    <div className="flex flex-col gap-1 mb-3">
      <div className="flex justify-between font-typewriter text-[10px] uppercase tracking-wider">
        <span className="truncate pr-1" title={name}>{name}</span>
        <span className="flex-shrink-0">{manpower.toLocaleString()} {isZh ? '人' : ''}</span>
      </div>
      <div className="h-3 w-full border border-ink bg-[#1a1a1a] relative overflow-hidden flex group cursor-help">
        <div 
          className="h-full bg-republic-purple transition-all duration-500" 
          style={{ width: `${loyalty}%` }}
        />
        {/* Tooltip */}
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-max bg-paper border border-ink p-1 text-[10px] font-typewriter z-50 hidden group-hover:block shadow-md">
          {isZh ? `忠于共和: ${loyalty}% | 倾向叛乱: ${100 - loyalty}%` : `Loyal to Republic: ${loyalty}% | Leaning to Rebellion: ${100 - loyalty}%`}
        </div>
      </div>
    </div>
  );
};

const MilitiaItem: React.FC<{ name: string; manpower: number; color: string; isAfrica?: boolean; isHighlighted?: boolean }> = ({ name, manpower, color, isAfrica, isHighlighted }) => {
  const { state } = useGame();
  const isZh = state.language === 'zh';
  
  let extraClasses = '';
  if (isAfrica) {
    extraClasses = 'text-yellow-800 font-bold bg-yellow-500/20 px-1 border-yellow-800/50';
  } else if (isHighlighted) {
    extraClasses = 'text-cnt-red font-bold bg-cnt-red/10 px-1 border-cnt-red/50';
  }

  return (
    <div className={`flex justify-between items-center font-typewriter text-[10px] uppercase tracking-wider py-1 border-b border-dotted border-ink/30 ${extraClasses}`}>
      <div className="flex items-center gap-1.5 overflow-hidden">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`}></div>
        <span className="truncate" title={name}>{name}</span>
      </div>
      <span className="flex-shrink-0 pl-1">{manpower.toLocaleString()} {isZh ? '人' : ''}</span>
    </div>
  );
};

const StatBar: React.FC<{ name: string; value: number; color: string; tooltip?: string }> = ({ name, value, color, tooltip }) => (
  <div className="flex flex-col gap-1 group relative">
    <div className="flex justify-between font-typewriter text-[10px] uppercase tracking-wider">
      <span className={tooltip ? "cursor-help border-b border-dotted border-ink" : ""} title={tooltip}>{name}</span>
      <span>{Math.round(value)}%</span>
    </div>
    <div className="h-3 w-full border border-ink bg-paper-dark relative overflow-hidden">
      <div 
        className={`h-full ${color} transition-all duration-500 bg-halftone`} 
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

export const PARTY_INFLUENCE_INFO: Record<string, {
  name: { en: string; zh: string };
  dissent: { en: string; zh: string };
  stability: { en: string; zh: string };
  desc: { en: string; zh: string };
}> = {
  CNT: {
    name: { en: "CNT (Anarcho-Syndicalist)", zh: "CNT (无政府工团主义)" },
    dissent: { 
      en: "Minimizes dissent among Cenetistas and Faistas. However, it provokes severe outrage and dissent among Treintistas and moderate constitutionalists who oppose radical overreach.", 
      zh: "极大降低工团派与无政府主义者群体的分歧度。然而，由于路线激进且反宪政，反过来会在三十人集团及温和民主人士中引发强烈不满，显著推高其分歧度。"
    },
    stability: { 
      en: "Harshly reduces Government Stability. Republican allies (IR, PRR) view CNT control of core ministries with existential alarm, leading to minimal consensus and high risk of gridlock.", 
      zh: "极大地削弱联合政府的宪政稳定性。温和共和政群对无政府主义者直接掌管国家核心部门感到深度恐慌，导致内阁合作极其脆弱、效率下降且加速右翼政变的密谋。" 
    },
    desc: {
      en: "Represents the revolutionary union. Prioritizes worker counter-power, complete administrative transparency, and direct action over institutional pragmatism.",
      zh: "代表革命工会的意志。高度重视工人自决权力、徹底精简官僚冗员和直接行动，而非体制层面的务实妥协。"
    }
  },
  PSOE: {
    name: { en: "PSOE (Socialist)", zh: "PSOE (工人社会党 / 左翼)" },
    dissent: { 
      en: "Soothes Treintistas who respect public reformist policies. However, Cenetistas and Faistas remain highly suspicious of socialist state-builder centralized doctrines, mildly raising radical dissent.", 
      zh: "能够有效安抚主张公开改良主义的「三十人集团」。但是，强硬的工团派与无政府主义者、纯粹派对社会党的中央权力与官僚体制教条抱有天然警惕，导致激进分歧缓慢累积。"
    },
    stability: { 
      en: "Maintains high Government Stability. PSOE represents a massive parliamentary force capable of sustaining state bureaucracies and commanding respect among middle-class progressives.", 
      zh: "显著巩固联合政府稳定性。作为议会制内的中流砥柱，社工党拥有庞大的选民根基和极强的行政底蕴，擅长稳控公务队伍秩序与稳健的法案立法运行。" 
    },
    desc: {
      en: "A mass social democratic reformist party. Focuses on robust state legislation, social-democratic planning, and gradual constitutional pathways.",
      zh: "规模庞大的社会民主主义改良政党。聚焦于强化国家干预立法、主张循序渐进的民主宪政转型及民生福利网保障。"
    }
  },
  IR: {
    name: { en: "IR (Left Republican)", zh: "IR (左翼共和国人 / 自由左翼)" },
    dissent: { 
      en: "Satisfies Treintistas expecting constitutional preservation, but severely worsens dissent among radical Faistas and Puristas who view the bourgeois democratic establishment as an obstacle to revolution.", 
      zh: "深受企盼宪政稳定的三十人集团温和派人士支持；然而这对于彻底推倒代议制政体的无政府主义者、纯粹派和杜鲁蒂之友而言意味着革命力量被资本主义体制驯服，将引起极高分歧。"
    },
    stability: { 
      en: "Excellent Government Stability. They embody constitutional legitimacy and the rule of law, reassuring foreign democratic powers, civil administrators, and constitutional military officers.", 
      zh: "提供最强的政府法统及政治稳定性。作为第二共和国最可靠的宪政火种与温和自由力量代表，可有效抚平军警高层和公共文官的恐慌，极大减少体制内讧。" 
    },
    desc: {
      en: "The standard bourgeois left-liberal party led by Manuel Azaña. Champions constitutional democracy, anticlericalism, and moderate agrarian/educational improvements.",
      zh: "由阿萨尼亚领导的左翼自由派政党。崇尚民主宪政、世俗世德、捍卫议会至上，提倡温和的农地改良与国民教育改造。"
    }
  },
  PRR: {
    name: { en: "PRR (Radical Republican / Centrist)", zh: "PRR (激进共和党 / 中右中间派)" },
    dissent: { 
      en: "Sparks widespread dissent and deep bitterness across almost all CNT and radical working-class circles, who interpret their presence as capitalistic compromise and opportunistic betrayal.", 
      zh: "在全劳联内部及广大工人阶级基层诱发大范围分歧与深重敌意。大多数派系会将其视为对劳苦大众利益的资产阶级勾兑与机会主义背叛。" 
    },
    stability: { 
      en: "Moderate Government Stability. Satisfies middle-road conservative elements, but leaves the progressive social project gridlocked, fragile, and highly volatile under sudden crisis.", 
      zh: "带来中等的政府稳定性。能局部安抚部分中右翼与有产阶级，但会阻碍任何实质的社会改良项目，导致内阁无法达成共识，在强烈阶级摩擦下极易陷于瘫痪。" 
    },
    desc: {
      en: "A centrist anti-clerical party whose opportunist concessions toward conservative and clerical factions alienate the left-wing coalition.",
      zh: "中右翼机会主义世俗派。在土地与工人工资等核心利益上频繁偏袒雇主，极度缺乏工人阶级支持，饱受争议。"
    }
  },
  DLR: {
    name: { en: "DLR (Liberal Republican Right)", zh: "DLR (自由共和右翼 / 保守共和派)" },
    dissent: { 
      en: "Moderates political transitions, but keeping conservative republicans in power mildly increases dissent among revolutionary purists and anarchists.", 
      zh: "有助于缓和宪政过渡时期的政治张力。但保留保守派共和党人执政会轻微增加革命纯粹派与无政府主义者的不信任与分歧度。" 
    },
    stability: { 
      en: "Fosters constitutional stability and legal continuity. Provides reassurance to middle-class moderates, property owners, and legalistic elements.", 
      zh: "有利于维护宪政秩序、法治统一与体制稳定性。能够显著安抚中产阶级温和派、有产者及体制内的守法力量。" 
    },
    desc: {
      en: "A conservative republican party led by Alcalá-Zamora and Miguel Maura. Dedicated to a secular, democratic but conservative constitutional Republic.",
      zh: "由阿尔卡拉-萨莫拉和米格尔·莫拉领导的保守派共和政党。致力于在尊重私有产权和基本秩序的前提下，建设一个世俗、民主但稳健的共和国。"
    }
  },
  ERC: {
    name: { en: "ERC (Catalan Republican Left)", zh: "ERC (加泰罗尼亚共和左翼)" },
    dissent: { 
      en: "Soothes regional autonomic expectations. However, conservative and highly centralized factions view their presence with concern, mildly increasing central friction.", 
      zh: "极大安抚加泰罗尼亚及地方自治主义者的期盼。然而，强硬的中央集权派和保守势力会对联邦化的倾向深感戒备，中度推高中央政治分歧。" 
    },
    stability: { 
      en: "Provides good stability in Catalonia and regional governments, though it might spark concerns of separatism among traditionalist military officers.", 
      zh: "在区域自治管理和民主阵线上提供良好的稳定性。但会在军警保守派和传统主义国家机器中引发对国家分裂的担忧。" 
    },
    desc: {
      en: "A left-wing Catalan nationalist and republican party. Champions Catalan autonomy, social progressivism, and secular democratic reforms.",
      zh: "加泰罗尼亚左翼民族主义与共和派政党。坚定主张加泰罗尼亚自治，提倡社会进步主义和世俗化民主改革。"
    }
  },
  UR: {
    name: { en: "UR (Republican Union)", zh: "UR (共和联盟 / 温和左翼)" },
    dissent: { 
      en: "Provides a reliable constitutional bridge, satisfying moderate progressives and reformist union members alike.", 
      zh: "作为稳健的宪政桥梁，有效满足温和进步派与改良主义工会代表的政治预期。" 
    },
    stability: { 
      en: "Enhances constitutional stability by uniting centrist and left-wing republican sentiments behind legal continuity and moderate reforms.", 
      zh: "通过团结中左翼共和派力量，维护法制延续性和稳步社会改良，显著提升宪政框架下的政府稳定性。" 
    },
    desc: {
      en: "A center-left republican party formed by Martínez Barrio. Focused on constitutional stability, civil liberties, and moderate social progressivism.",
      zh: "由马丁内斯·巴里奥领导的中左翼共和主义政党。致力于宪政稳定、公民自由 and 温和渐进的社会进步政策。"
    }
  },
  Other: {
    name: { en: "Other / Unaligned Technocrats", zh: "其他 / 无党籍技术专家" },
    dissent: { 
      en: "Slightly elevated faction dissent due to the lack of clear ideological and class representation.", 
      zh: "对分歧度产生中性或略微推高的影响。因为各派系均不视其为自己的政治或阶级利益代言人。" 
    },
    stability: { 
      en: "Reduced stability as technocrats or non-aligned ministers lack the massive party machinery and legislative weight needed to enforce policy consensus.", 
      zh: "对内阁稳定性缺乏显著支撑。无党派人士不具备强力党团的掩护和法案立案背景，极易在强烈的政治狂风中随风倒，行动力差。" 
    },
    desc: {
      en: "Apolitical technocrats, military professionals, or minority alignments covering specific operational duties under temporary cabinets.",
      zh: "非政治化的事务官署、功利军警官僚或过渡政府性质的代理人，仅做临时业务运作。"
    }
  }
};

export const DEPT_INFO_PACK: Record<string, {
  name: { en: string; zh: string };
  focus: { en: string; zh: string };
}> = {
  labor: {
    name: { en: "Ministry of Labor", zh: "劳工部" },
    focus: { 
      en: "Maintains industrial peace and arbitrates strikes. A CNT Labor Minister can pass humane 40-hour workweeks and safety standards, directly building union legitimacy.",
      zh: "负责维护工业生产稳定、裁决大范围停工与工人大罢工。CNT部长在位时，可发布历史性的「四十小时工作周」与工业安全章程，极大抬升工会统摄力。"
    }
  },
  health: {
    name: { en: "Ministry of Health", zh: "卫生与社会工作部" },
    focus: { 
      en: "Manages healthcare, welfare centers, and regional clinics. Crucial to support cooperative supply networks and socialized local welfare structures.",
      zh: "掌管医院体系、育幼院、社会福利站和互助抗疫网。是联合会推广自主化、去集权化的公共卫生活动与社会福利的有力平台。"
    }
  },
  justice: {
    name: { en: "Ministry of Justice", zh: "司法部" },
    focus: { 
      en: "Oversees criminal courts, legal code amendments, and general amnesty. Critical to legally shield collective acquisitions and release political prisoners.",
      zh: "执掌司法裁决、法案宪法修订以及发布国家特赦令。是解除地主司法纠缠、在法律上确认工人强占土地房屋有效、并赦免革命战士的防护盾。"
    }
  },
  industry: {
    name: { en: "Ministry of Industry", zh: "工业部" },
    focus: { 
      en: "Shapes industrial planning, trade regulations, and factory collectivization codes. Directs raw material allocations for weapons production and civilian infrastructure.",
      zh: "管辖工矿采掘、原材料配给、关税调节以及集体化工厂监督。决定战时军事供应链和民用产品供需的大后方生产力布局。"
    }
  },
  interior: {
    name: { en: "Ministry of the Interior", zh: "内政部 (治安与政法)" },
    focus: { 
      en: "Commands the municipal security forces, assault guards, and public order. The primary shield to suppress coup attempts, dismantle spy cells, and patrol urban stability.",
      zh: "调遣国民警警卫队、突击警卫队并操持全境公共秩序。是刺探右翼军官暗谋、实施定点逮捕、压制反革命暴动及战时清特务的关键安全堡垒。"
    }
  },
  agriculture: {
    name: { en: "Ministry of Agriculture", zh: "农业部" },
    focus: { 
      en: "Overlooks land reforms, estate expropriations, and grain distribution. A CNT Agriculture Minister enables collective farming card selections to mobilize rural laborers.",
      zh: "农牧业事务及土地改革，决定西班牙境内数百万饥饿的无地日雇农对政权的态度。CNT部长在位时可执行大农场征收。"
    }
  },
  finance: {
    name: { en: "Ministry of Finance", zh: "财政部" },
    focus: { 
      en: "Oversees public budget, tax rates, tariff levels, and national currency/gold reserves. Excellent for implementing libertarian communist wealth redistribution policies.",
      zh: "主管国家预算、所得税税率、海陆关税与国家金库/外汇储备。是在财政层面上贯彻自由共产主义、重塑社会分配机制、实现财富再分配的最强工具。"
    }
  },
  war: {
    name: { en: "Ministry of War", zh: "战争部 (国防)" },
    focus: { 
      en: "Governs troop enlistments, heavy weapons factories, and regular army command. Critical for central military policy cards to reform defensive chains against reactionary forces.",
      zh: "统御国防陆海军编制、战训以及国防预算，是把持合法重武装力量的最终底牌，可极大增强抵抗叛乱叛军的战备。"
    }
  }
};

const MinisterRow: React.FC<{
  deptKey: string;
  nameEn: string;
  nameZh: string;
  party: string;
}> = ({ deptKey, nameEn, nameZh, party }) => {
  const { state } = useGame();
  const isZh = state.language === 'zh';
  const [isHovered, setIsHovered] = React.useState(false);

  const cleanParty = party || 'Other';
  const partyInfo = PARTY_INFLUENCE_INFO[cleanParty] || PARTY_INFLUENCE_INFO['Other'];
  const partyLabel = party === 'CNT'
    ? getPartyName(state, 'CNT_FAI', isZh)
    : getPartyName(state, party as Party, isZh);
  const deptInfo = DEPT_INFO_PACK[deptKey] || { name: { en: nameEn, zh: nameZh }, focus: { en: '', zh: '' } };

  const isUpward = ['interior', 'agriculture', 'war', 'finance'].includes(deptKey);

  return (
    <div 
      className="flex justify-between items-center border-b border-ink/20 pb-1 relative group cursor-help select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span>{isZh ? nameZh : nameEn}</span>
      <span className={party === 'CNT' ? 'text-cnt-red font-bold' : ''}>{partyLabel}</span>

      {/* Tooltip on Hover positioned to stay within the SidePanel bounds and prevent horizontal clipping */}
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
                {partyLabel}
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
