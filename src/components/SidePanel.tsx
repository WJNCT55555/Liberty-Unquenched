import React from 'react';
import { useGame } from '../game/GameContext';
import { Faction, Party, SocialClass, GameState } from '../game/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { MapView } from './MapView';
import { DomesticPolicyModal } from './DomesticPolicyModal';
import { AnimatePresence } from 'motion/react';
import { PARTY_COLORS, CLASS_COLORS, CLASS_INFO } from '../game/constants';

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
  const { state } = useGame();
  const isZh = state.language === 'zh';
  const [isMapOpen, setIsMapOpen] = React.useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = React.useState(false);

  const factionNames: Record<Faction, { en: string, zh: string }> = {
    Treintistas: { en: 'Treintistas', zh: '三十人集团' },
    Cenetistas: { en: 'Cenetistas', zh: '工团分子' },
    Faistas: { en: 'Faistas', zh: '无政府主义者' },
    Puristas: { en: 'Puristas', zh: '纯粹派' }
  };

  const partyNames: Record<Party, { en: string, zh: string }> = {
    PSOE: { en: 'PSOE', zh: '工人社会党 (PSOE)' },
    IR: { en: 'IR', zh: '共和左翼 (IR)' },
    UR: { en: 'UR', zh: '共和联盟 (UR)' },
    PCE: { en: 'PCE', zh: '西班牙共产党 (PCE)' },
    PS: { en: 'PS', zh: '工团主义党 (PS)' },
    FE: { 
      en: state.falange_jons ? 'FE de las JONS' : 'Falange Española', 
      zh: state.falange_jons ? '长枪党 (FE de las JONS)' : '西班牙长枪党 (FE)' 
    },
    POUM: { en: 'POUM', zh: '马克思主义统一工人党 (POUM)' },
    AP: { en: 'Acción Popular', zh: '人民行动党 (AP)' },
    CT: { en: 'Traditionalist Communion', zh: '传统主义者 (CT)' },
    RE: { en: 'Spanish Renovation', zh: '西班牙革新 (RE)' },
    DLR: { en: 'Derecha Liberal Republicana', zh: '自由共和右翼 (DLR)' },
    Other: { en: 'Other', zh: '其他' }
  };

  const pieData = [
    { name: isZh ? factionNames.Treintistas.zh : factionNames.Treintistas.en, value: state.factions.Treintistas.influence, color: '#4a4a4a' },
    { name: isZh ? factionNames.Cenetistas.zh : factionNames.Cenetistas.en, value: state.factions.Cenetistas.influence, color: '#1a1a1a' },
    { name: isZh ? factionNames.Faistas.zh : factionNames.Faistas.en, value: state.factions.Faistas.influence, color: '#cc0000' },
    { name: isZh ? factionNames.Puristas.zh : factionNames.Puristas.en, value: state.factions.Puristas.influence, color: '#8b0000' },
  ];

  const overallDissent = 
    (state.factions.Treintistas.influence * state.factions.Treintistas.dissent +
     state.factions.Cenetistas.influence * state.factions.Cenetistas.dissent +
     state.factions.Faistas.influence * state.factions.Faistas.dissent +
     state.factions.Puristas.influence * state.factions.Puristas.dissent) / 100;

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
    PSOE: { en: 'Competing for the worker base, delicate relationship.', zh: '竞争工人基础，关系微妙。' },
    PCE: { en: 'Ideological arch-nemesis, competing for revolutionary leadership.', zh: '意识形态宿敌，竞争革命领导权。' },
    IR: { en: 'Sees CNT as a necessary but dangerous ally.', zh: '视 CNT 为必要但危险的盟友。' },
    UR: { en: 'More conservative, fears radical methods of the CNT.', zh: '较保守，恐惧 CNT 的激进手段。' },
    PS: { en: 'Ideologically close, but seen as "traitors" by CNT radicals.', zh: '意识形态较接近，但被 CNT 激进派视为“叛徒”。' },
    FE: { en: 'Party using syndicalism as a means but with opposite goals.', zh: '同样以工团作为手段的政党但目的相反。' },
    POUM: { en: 'Anti-Stalinist Marxist party, potential ally in revolution.', zh: '反斯大林主义的马克思主义政党，革命中的潜在盟友。' },
    AP: { en: 'Catholic conservative party, defending religion and property.', zh: '天主教保守政党，捍卫宗教与财产。' },
    CT: { en: 'Traditionalist and Carlist party, deeply conservative.', zh: '传统主义与卡洛斯派政党，极其保守。' },
    RE: { en: 'Monarchist party, seeking to restore the King.', zh: '君主主义政党，寻求恢复国王。' },
    DLR: { en: 'Conservative Republican party, defending property and order.', zh: '保守共和政党，捍卫财产与秩序。' },
    Other: { en: 'Small parties and undecided voters.', zh: '小党派与未定派系。' }
  };

  const popularFrontPieData = [
    { name: 'PCE', value: state.popularFrontFactions.pce, color: '#dc2626' }, // red-600
    { name: 'PSOE', value: state.popularFrontFactions.psoe, color: '#ea580c' }, // orange-600
    { name: 'IR', value: state.popularFrontFactions.ir, color: '#2563eb' }, // blue-600
    { name: 'UR', value: state.popularFrontFactions.ur, color: '#0284c7' }, // sky-600
  ];

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

  const getWomenSuffrageText = (val: number, isZh: boolean) => {
    if (val === 0) return isZh ? '无' : 'None';
    if (val === 1) return isZh ? '有限' : 'Limited';
    return isZh ? '完全' : 'Full';
  };

  const getReligionPolicyText = (val: number, isZh: boolean) => {
    if (val === 0) return isZh ? '国教' : 'State Religion';
    if (val === 1) return isZh ? '信仰自由' : 'Freedom of Belief';
    if (val === 2) return isZh ? '世俗社会' : 'Secular Society';
    return isZh ? '国家无神论' : 'State Atheism';
  };

  const getAbortionRightsText = (val: number, isZh: boolean) => {
    if (val === 0) return isZh ? '禁止' : 'Banned';
    if (val === 1) return isZh ? '非刑事化' : 'Decriminalized';
    return isZh ? '允许堕胎' : 'Legalized';
  };

  const getEducationInstitutionsText = (val: number, isZh: boolean) => {
    if (val === 0) return isZh ? '教会学校' : 'Church Schools';
    if (val === 1) return isZh ? '传统教育' : 'Traditional Education';
    if (val === 2) return isZh ? '理性教育' : 'Rational Education';
    return isZh ? '现代教育' : 'Modern Education';
  };

  const getPolicyColorClass = (val: number, maxVal: number) => {
    if (val === 0) return 'text-ink-light';
    if (val >= maxVal - 1 && maxVal > 1) return 'text-cnt-red font-bold';
    if (val === maxVal && maxVal === 1) return 'text-cnt-red font-bold';
    return 'text-ink';
  };

  return (
    <div className="w-72 border-r-2 border-ink bg-paper p-6 flex flex-col gap-2 overflow-y-auto">
      
      {state.civilWarStatus !== 'not_started' && (
        <AccordionSection title={isZh ? '西班牙内战' : 'Spanish Civil War'} defaultOpen={true}>
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span>{isZh ? '共和军推进' : 'Republic'}</span>
                <span>{isZh ? '国民军推进' : 'Nationalist'}</span>
              </div>
              <div className="h-4 w-full bg-zinc-300 border border-ink relative">
                <div 
                  className="absolute top-0 bottom-0 left-0 bg-red-600 border-r border-ink transition-all duration-500" 
                  style={{ width: `${100 - state.warProgress}%` }}
                />
                <div 
                  className="absolute top-0 bottom-0 right-0 bg-blue-800 transition-all duration-500" 
                  style={{ width: `${state.warProgress}%` }}
                />
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-ink z-10" />
              </div>
              <div className="text-center text-xs font-mono mt-1 text-ink-light">
                {isZh ? '前线战况' : 'War Progress'}
              </div>
            </div>
            {/* Map View Button */}
            <button 
              onClick={() => setIsMapOpen(true)}
              className="w-full py-2 border border-ink bg-ink/5 hover:bg-ink/10 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              {isZh ? '查看地图' : 'View Map'}
            </button>
          </div>
        </AccordionSection>
      )}

      <AccordionSection title={isZh ? '共和危机' : 'Republican Crisis'} defaultOpen={true}>
        <div className="flex flex-col gap-4">
          <StatBar name={isZh ? '紧张局势' : 'Tension'} value={state.stats.tension} color="bg-red-600" tooltip={isZh ? '内战爆发的风险' : 'Risk of Civil War'} />
          <StatBar name={isZh ? '共和国权威' : 'Rep. Authority'} value={state.stats.republicanAuthority} color="bg-blue-600" tooltip={isZh ? '政府的控制力' : 'Government Control'} />
          <StatBar name={isZh ? '军官忠诚' : 'Army Loyalty'} value={state.stats.armyLoyalty} color="bg-green-600" tooltip={isZh ? '军队对共和国的忠诚度' : 'Army Loyalty to Republic'} />
          <StatBar name={isZh ? '革命热情' : 'Revolutionary Fervor'} value={state.stats.revolutionaryFervor} color="bg-cnt-red" tooltip={isZh ? '社会革命的进展' : 'Progress of Social Revolution'} />
          <StatBar name={isZh ? '工人控制度' : 'Worker Control'} value={state.stats.workerControl} color="bg-orange-600" tooltip={isZh ? '工人对工厂和土地的控制' : 'Worker Control of Factories and Land'} />
          <StatBar name={isZh ? '经济状况' : 'Economy'} value={state.stats.economy} color="bg-yellow-600" tooltip={isZh ? '国家的经济健康度' : 'Economic Health'} />
        </div>
      </AccordionSection>

      <AccordionSection title={isZh ? '国内政治' : 'Domestic Politics'} defaultOpen={true}>
        <div className="flex flex-col gap-2 text-xs font-mono">
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
          
          <div className="mt-2 mb-1 font-bold text-[10px] uppercase tracking-wider text-ink-light">
            {isZh ? '政党关系 (对CNT-FAI)' : 'Party Relations (to CNT-FAI)'}
          </div>
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
                    <span className={`w-16 text-right ${getPartyRelationColor(value)}`}>
                      {getPartyRelationLevel(value, isZh)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AccordionSection>

      {state.cortes && (
        <AccordionSection title={isZh ? '制宪议会' : 'Constituent Cortes'} defaultOpen={true}>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-mono mb-1">
              <span>{isZh ? '左翼' : 'Left'}</span>
              <span>{isZh ? '右翼' : 'Right'}</span>
            </div>
            <div className="h-4 w-full flex rounded-sm overflow-hidden border border-ink bg-paper-dark">
              {(Object.entries(state.cortes) as [Party, number][])
                .filter(([_, seats]) => seats > 0)
                .sort((a, b) => {
                  const order = ['PCE', 'POUM', 'PS', 'PSOE', 'IR', 'UR', 'Other', 'AP', 'CT', 'RE', 'FE'];
                  return order.indexOf(a[0]) - order.indexOf(b[0]);
                })
                .map(([party, seats]) => (
                <div 
                  key={party}
                  className="h-full transition-all duration-1000"
                  style={{ 
                    width: `${(seats / 470) * 100}%`,
                    backgroundColor: PARTY_COLORS[party] || '#9ca3af'
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
                  <div className="w-2 h-2 border border-ink" style={{ backgroundColor: PARTY_COLORS[party] || '#9ca3af' }} />
                  {party}: {seats}
                </div>
              ))}
            </div>
          </div>
        </AccordionSection>
      )}

      <AccordionSection title={isZh ? '人民阵线' : 'Popular Front'} defaultOpen={state.civilWarStatus !== 'not_started'}>
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span>{isZh ? '团结度' : 'Unity'}</span>
              <span>{state.popularFrontUnity}%</span>
            </div>
            <div className="h-2 w-full bg-ink/10 border border-ink overflow-hidden">
              <div 
                className="h-full bg-orange-600 transition-all duration-500" 
                style={{ width: `${state.popularFrontUnity}%` }}
              />
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="h-24 w-24">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={popularFrontPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={20}
                    outerRadius={40}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {popularFrontPieData.map((entry, index) => (
                      <Cell key={`pf-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#f4f1ea', border: '1px solid #141414', borderRadius: 0, fontFamily: 'monospace' }}
                    itemStyle={{ color: '#141414' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 ml-4 flex flex-col justify-center gap-1">
              {popularFrontPieData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs font-mono">
                  <div className="w-3 h-3 border border-ink" style={{ backgroundColor: d.color }} />
                  <span>{d.name}</span>
                  <span className="ml-auto">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AccordionSection>

      {state.cortes && (
        <AccordionSection title={isZh ? '内阁部长' : 'Cabinet Ministers'} defaultOpen={true}>
          <div className="flex flex-col gap-2 text-xs font-mono">
            <div className="flex justify-between items-center border-b border-ink/20 pb-1">
              <span>{isZh ? '劳工部' : 'Labor'}</span>
              <span className={state.ministers.labor === 'CNT' ? 'text-cnt-red font-bold' : ''}>{state.ministers.labor}</span>
            </div>
            <div className="flex justify-between items-center border-b border-ink/20 pb-1">
              <span>{isZh ? '卫生部' : 'Health'}</span>
              <span className={state.ministers.health === 'CNT' ? 'text-cnt-red font-bold' : ''}>{state.ministers.health}</span>
            </div>
            <div className="flex justify-between items-center border-b border-ink/20 pb-1">
              <span>{isZh ? '司法部' : 'Justice'}</span>
              <span className={state.ministers.justice === 'CNT' ? 'text-cnt-red font-bold' : ''}>{state.ministers.justice}</span>
            </div>
            <div className="flex justify-between items-center border-b border-ink/20 pb-1">
              <span>{isZh ? '工业部' : 'Industry'}</span>
              <span className={state.ministers.industry === 'CNT' ? 'text-cnt-red font-bold' : ''}>{state.ministers.industry}</span>
            </div>
            <div className="flex justify-between items-center border-b border-ink/20 pb-1">
              <span>{isZh ? '内政部' : 'Interior'}</span>
              <span className={state.ministers.interior === 'CNT' ? 'text-cnt-red font-bold' : ''}>{state.ministers.interior}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>{isZh ? '战争部' : 'War'}</span>
              <span className={state.ministers.war === 'CNT' ? 'text-cnt-red font-bold' : ''}>{state.ministers.war}</span>
            </div>
          </div>
        </AccordionSection>
      )}

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
              {state.cntVotingRate.toFixed(0)}%
            </span>
          </div>
          <div className="h-4 w-full border border-ink bg-paper-dark flex overflow-hidden">
            {(() => {
              if (state.cntVotingRate === 0) return null;

              if (state.isPRRevSFormed) {
                return (
                  <div 
                    className="h-full transition-all duration-500" 
                    style={{ width: `${state.cntVotingRate}%`, backgroundColor: PARTY_COLORS['PS'] }}
                    title={isZh ? '革命共和工团党 (PRRevS)' : 'PRRevS'}
                  />
                );
              } else {
                const pceSupport = calculatePartySupport(state, 'PCE');
                const poumSupport = state.poum_founded ? calculatePartySupport(state, 'POUM') : 0;
                const psoeSupport = calculatePartySupport(state, 'PSOE');
                const irSupport = calculatePartySupport(state, 'IR');
                const totalLeftSupport = pceSupport + poumSupport + psoeSupport + irSupport;
                
                if (totalLeftSupport === 0) {
                  return (
                    <div 
                      className="h-full bg-cnt-red transition-all duration-500" 
                      style={{ width: `${state.cntVotingRate}%` }}
                    />
                  );
                }

                return (
                  <>
                    <div className="h-full transition-all duration-500" style={{ width: `${(pceSupport / totalLeftSupport) * state.cntVotingRate}%`, backgroundColor: PARTY_COLORS['PCE'] }} title="PCE" />
                    {state.poum_founded && <div className="h-full transition-all duration-500" style={{ width: `${(poumSupport / totalLeftSupport) * state.cntVotingRate}%`, backgroundColor: PARTY_COLORS['POUM'] }} title="POUM" />}
                    <div className="h-full transition-all duration-500" style={{ width: `${(psoeSupport / totalLeftSupport) * state.cntVotingRate}%`, backgroundColor: PARTY_COLORS['PSOE'] }} title="PSOE" />
                    <div className="h-full transition-all duration-500" style={{ width: `${(irSupport / totalLeftSupport) * state.cntVotingRate}%`, backgroundColor: PARTY_COLORS['IR'] }} title="IR" />
                  </>
                );
              }
            })()}
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

      <button 
        onClick={() => setIsPolicyModalOpen(true)}
        className="w-full py-3 px-4 bg-ink text-paper font-typewriter font-bold uppercase tracking-wider flex items-center justify-between hover:bg-ink-light transition-colors shadow-sm"
      >
        <span>{isZh ? '查看国内政策和法案' : 'View Domestic Policies'}</span>
        <span className="text-xl">➔</span>
      </button>

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
          <AllianceBar name={state.isPRRevSFormed ? "PRRevS" : "CNT-FAI"} value={calculatePartySupport(state, 'CNT_FAI')} color={state.isPRRevSFormed ? PARTY_COLORS['PS'] : PARTY_COLORS['CNT_FAI']} breakdown={getPartySupportBreakdown(state, 'CNT_FAI')} />
          {state.poum_founded && <AllianceBar name={isZh ? partyNames.POUM.zh : partyNames.POUM.en} value={calculatePartySupport(state, 'POUM')} color={PARTY_COLORS['POUM']} breakdown={getPartySupportBreakdown(state, 'POUM')} />}
          <AllianceBar name={isZh ? partyNames.PCE.zh : partyNames.PCE.en} value={calculatePartySupport(state, 'PCE')} color={PARTY_COLORS['PCE']} breakdown={getPartySupportBreakdown(state, 'PCE')} />
          <AllianceBar name={isZh ? partyNames.PSOE.zh : partyNames.PSOE.en} value={calculatePartySupport(state, 'PSOE')} color={PARTY_COLORS['PSOE']} breakdown={getPartySupportBreakdown(state, 'PSOE')} />
          <AllianceBar name={isZh ? partyNames.IR.zh : partyNames.IR.en} value={calculatePartySupport(state, 'IR')} color={PARTY_COLORS['IR']} breakdown={getPartySupportBreakdown(state, 'IR')} />
          <AllianceBar name={isZh ? partyNames.UR.zh : partyNames.UR.en} value={calculatePartySupport(state, 'UR')} color={PARTY_COLORS['UR']} breakdown={getPartySupportBreakdown(state, 'UR')} />
          <AllianceBar name={isZh ? partyNames.DLR.zh : partyNames.DLR.en} value={calculatePartySupport(state, 'DLR')} color={PARTY_COLORS['DLR']} breakdown={getPartySupportBreakdown(state, 'DLR')} />
          <AllianceBar name={isZh ? partyNames.AP.zh : partyNames.AP.en} value={calculatePartySupport(state, 'AP')} color={PARTY_COLORS['AP']} breakdown={getPartySupportBreakdown(state, 'AP')} />
          {state.fe_founded && <AllianceBar name={isZh ? partyNames.FE.zh : partyNames.FE.en} value={calculatePartySupport(state, 'FE')} color={PARTY_COLORS['FE']} breakdown={getPartySupportBreakdown(state, 'FE')} />}
          <AllianceBar name={isZh ? partyNames.CT.zh : partyNames.CT.en} value={calculatePartySupport(state, 'CT')} color={PARTY_COLORS['CT']} breakdown={getPartySupportBreakdown(state, 'CT')} />
          <AllianceBar name={isZh ? partyNames.RE.zh : partyNames.RE.en} value={calculatePartySupport(state, 'RE')} color={PARTY_COLORS['RE']} breakdown={getPartySupportBreakdown(state, 'RE')} />
          {state.ps_founded && <AllianceBar name={isZh ? partyNames.PS.zh : partyNames.PS.en} value={calculatePartySupport(state, 'PS')} color={PARTY_COLORS['PS']} breakdown={getPartySupportBreakdown(state, 'PS')} />}
          <AllianceBar name={isZh ? partyNames.Other.zh : partyNames.Other.en} value={calculatePartySupport(state, 'Other')} color={PARTY_COLORS['Other']} breakdown={getPartySupportBreakdown(state, 'Other')} />
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

      <AnimatePresence>
        {isMapOpen && <MapView onClose={() => setIsMapOpen(false)} />}
      </AnimatePresence>

      <DomesticPolicyModal 
        isOpen={isPolicyModalOpen} 
        onClose={() => setIsPolicyModalOpen(false)} 
        state={state} 
        isZh={isZh} 
      />
    </div>
  );
};

const RelationItem: React.FC<{ name: string; value: number; text: string; colorClass: string }> = ({ name, value, text, colorClass }) => (
  <div className="flex justify-between items-center font-typewriter text-xs uppercase tracking-wider">
    <span>{name}</span>
    <span className={colorClass} title={`${value}/100`}>{text}</span>
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
  
  const partyNames: Record<'CNT_FAI' | Party, { en: string, zh: string }> = {
    CNT_FAI: { en: state.isPRRevSFormed ? 'PRRevS' : 'CNT-FAI', zh: state.isPRRevSFormed ? '革命共和工团党' : 'CNT-FAI' },
    PSOE: { en: 'PSOE', zh: '工人社会党' },
    IR: { en: 'IR', zh: '共和左翼' },
    UR: { en: 'UR', zh: '共和联盟' },
    PCE: { en: 'PCE', zh: '共产党' },
    PS: { en: 'PS', zh: '工团主义党' },
    FE: { en: 'FE', zh: '长枪党' },
    POUM: { en: 'POUM', zh: '马统工党' },
    AP: { en: 'AP', zh: '人民行动党' },
    CT: { en: 'CT', zh: '传统主义者' },
    RE: { en: 'RE', zh: '西班牙革新' },
    DLR: { en: 'DLR', zh: '自由共和右翼' },
    Other: { en: 'Other', zh: '其他' }
  };

  const sortedSupport = (Object.entries(supportData) as [string, number][])
    .filter(([_, val]) => val > 0)
    .sort((a, b) => b[1] - a[1]);
    
  const totalSupport = sortedSupport.reduce((sum, [_, val]) => sum + val, 0) || 1;
  const relativeSupportPercent = Number(((support / totalSupport) * 100).toFixed(2));
    
  const pieData = sortedSupport.map(([party, val]) => ({
    name: isZh ? partyNames[party as 'CNT_FAI' | Party].zh : partyNames[party as 'CNT_FAI' | Party].en,
    value: val,
    fill: PARTY_COLORS[party] || '#9ca3af'
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
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PARTY_COLORS[party] || '#9ca3af' }} />
                  <span>{isZh ? partyNames[party as 'CNT_FAI' | Party].zh : partyNames[party as 'CNT_FAI' | Party].en}</span>
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
