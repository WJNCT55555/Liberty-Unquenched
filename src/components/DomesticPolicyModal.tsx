import React, { useState } from 'react';
import { GameState } from '../game/types';
import { ShieldAlert, BookOpen, Scaling, Hammer, Plane as Plant, Heart, Baby, Book, MapPin, X } from 'lucide-react';

interface PolicyLevel {
  level: number;
  name: { en: string; zh: string };
  desc: { en: string; zh: string };
}

interface PolicyDef {
  id: keyof GameState['domesticPolicy'];
  name: { en: string; zh: string };
  icon?: React.ReactNode;
  levels: PolicyLevel[];
}

export const POLICIES_DEF: Record<'economy' | 'society', PolicyDef[]> = {
  economy: [
    {
      id: 'nationalisation_progress',
      name: { en: 'Nationalisation', zh: '经济国有化' },
      icon: <Hammer className="w-5 h-5" />,
      levels: [
        { level: 0, name: { en: 'None', zh: '不存在' }, desc: { en: 'Capitalism operates without state interference.', zh: '资本主义在没有国家干预的情况下运行。' } },
        { level: 1, name: { en: 'Key Industries', zh: '关键行业国有化' }, desc: { en: 'The state controls vital utilities and infrastructure.', zh: '国家控制着重要的公用事业和基础设施。' } },
        { level: 2, name: { en: 'Moderate', zh: '中等国有化' }, desc: { en: 'Several major industries are run by the state.', zh: '几个主要行业由国家运营。' } },
        { level: 3, name: { en: 'Extensive', zh: '深度国有化' }, desc: { en: 'Most of the economy is state-owned or highly regulated.', zh: '大部分经济是国有的或受到高度监管。' } },
        { level: 4, name: { en: 'Total', zh: '全面国有化' }, desc: { en: 'A fully planned and collectivised economy.', zh: '完全的计划经济与集体化经济。' } }
      ]
    },

    {
      id: 'max_hours_law',
      name: { en: 'Max Hours', zh: '最高工时' },
      icon: <Scaling className="w-5 h-5" />,
      levels: [
        { level: 0, name: { en: 'No Limits', zh: '无限制' }, desc: { en: 'Workers toil day and night with no legal protection.', zh: '工人们日以继夜地劳作，没有法律保护。' } },
        { level: 1, name: { en: '70-Hour Week', zh: '70小时工作制' }, desc: { en: 'A harsh limit, but a limit nonetheless.', zh: '一个严苛的限制，但总算是个限制。' } },
        { level: 2, name: { en: '56-Hour Week', zh: '56小时工作制' }, desc: { en: 'Six days a week of intense labor.', zh: '一周六天的高强度劳动。' } },
        { level: 3, name: { en: '40-Hour Week', zh: '40小时工作制' }, desc: { en: 'The historical eight hours a day victory.', zh: '历史性的八小时工作制胜利。' } },
        { level: 4, name: { en: '36-Hour Week', zh: '36小时工作制' }, desc: { en: 'Highly advanced worker protections.', zh: '高度发达的工人权益保障。' } }
      ]
    },
    {
      id: 'min_wage',
      name: { en: 'Minimum Wage', zh: '最低工资' },
      icon: <BookOpen className="w-5 h-5" />,
      levels: [
        { level: 0, name: { en: 'None', zh: '无' }, desc: { en: 'Wages are dictated entirely by the free market.', zh: '工资完全由自由市场决定。' } },
        { level: 1, name: { en: 'Minimal', zh: '最低限度' }, desc: { en: 'Prevents absolute starvation.', zh: '防止了绝对的饥饿。' } },
        { level: 2, name: { en: 'Basic', zh: '基本' }, desc: { en: 'A baseline wage for survival.', zh: '维持生存的基本工资。' } },
        { level: 3, name: { en: 'Living Wage', zh: '生活工资' }, desc: { en: 'Enough to support a modest living.', zh: '足以维持体面生活的工资。' } },
        { level: 4, name: { en: 'Generous', zh: '优厚' }, desc: { en: 'Workers take a commanding share of produced value.', zh: '工人分享了他们生产出的大部分价值。' } }
      ]
    },
    {
      id: 'workplace_safety',
      name: { en: 'Workplace Safety', zh: '工作环境安全' },
      icon: <ShieldAlert className="w-5 h-5" />,
      levels: [
        { level: 0, name: { en: 'None', zh: '无' }, desc: { en: 'Profits are paramount; lives are cheap.', zh: '利润至上；生命廉价。' } },
        { level: 1, name: { en: 'Basic', zh: '基本' }, desc: { en: 'Simple regulations to prevent massive disasters.', zh: '防止大规模灾难的简单规定。' } },
        { level: 2, name: { en: 'Moderate', zh: '中等' }, desc: { en: 'Regular inspections and mandatory gear.', zh: '定期检查和强制性装备。' } },
        { level: 3, name: { en: 'Strict', zh: '严格' }, desc: { en: 'Workers can shut down unsafe operations.', zh: '工人可以叫停不安全的作业。' } },
        { level: 4, name: { en: 'Comprehensive', zh: '全面' }, desc: { en: 'Total priority to human life over production speed.', zh: '人命绝对优先于生产速度。' } }
      ]
    }
  ],
  society: [
    {
      id: 'women_suffrage',
      name: { en: 'Women Suffrage', zh: '女性投票权' },
      icon: <Baby className="w-5 h-5" />,
      levels: [
        { level: 0, name: { en: 'None', zh: '无' }, desc: { en: 'Politics is heavily male-dominated.', zh: '政治完全由男性主导。' } },
        { level: 1, name: { en: 'Limited', zh: '有限' }, desc: { en: 'Only specific groups of women can vote.', zh: '只有特定群体的女性拥有投票权。' } },
        { level: 2, name: { en: 'Full', zh: '完全' }, desc: { en: 'Universal suffrage regardless of gender.', zh: '不分性别的普选权。' } }
      ]
    },
    {
      id: 'religion_policy',
      name: { en: 'Religion Policy', zh: '宗教权利' },
      icon: <Heart className="w-5 h-5" />,
      levels: [
        { level: 0, name: { en: 'State Religion', zh: '国教' }, desc: { en: 'The Catholic Church dictates morals and laws.', zh: '天主教会主导着道德和法律。' } },
        { level: 1, name: { en: 'Freedom of Belief', zh: '信仰自由' }, desc: { en: 'The Church holds sway, but others are tolerated.', zh: '教会仍有影响，但容忍其他信仰。' } },
        { level: 2, name: { en: 'Secular Society', zh: '世俗社会' }, desc: { en: 'Strict separation of church and state.', zh: '严格的政教分离。' } },
        { level: 3, name: { en: 'State Atheism', zh: '国家无神论' }, desc: { en: 'Religion is discouraged or actively suppressed.', zh: '宗教被劝阻或受到积极压制。' } }
      ]
    },
    {
      id: 'abortion_rights',
      name: { en: 'Abortion Rights', zh: '堕胎权' },
      icon: <Heart className="w-5 h-5" />,
      levels: [
        { level: 0, name: { en: 'Banned', zh: '禁止' }, desc: { en: 'Strictly prohibited under all circumstances.', zh: '在任何情况下均被严格禁止。' } },
        { level: 1, name: { en: 'Decriminalized', zh: '非刑事化' }, desc: { en: 'Allowed in severe medical cases.', zh: '允许在严重的医疗案件中进行。' } },
        { level: 2, name: { en: 'Legalized', zh: '允许堕胎' }, desc: { en: 'Free choice granted to women.', zh: '赋予女性自由选择的权利。' } }
      ]
    },
    {
      id: 'education_institutions',
      name: { en: 'Education', zh: '教育机构' },
      icon: <Book className="w-5 h-5" />,
      levels: [
        { level: 0, name: { en: 'Church Schools', zh: '教会学校' }, desc: { en: 'Education is a monopoly of religious orders.', zh: '教育是宗教团体的垄断。' } },
        { level: 1, name: { en: 'Traditional Education', zh: '传统教育' }, desc: { en: 'State schools exist but are highly conservative.', zh: '公立学校存在但高度保守。' } },
        { level: 2, name: { en: 'Rational Education', zh: '理性教育' }, desc: { en: 'Secular, progressive curriculum.', zh: '世俗、进步的课程体系。' } },
        { level: 3, name: { en: 'Modern Education', zh: '现代教育' }, desc: { en: 'Radical pedagogical methods and absolute secularism.', zh: '激进的教学方法与绝对的世俗主义。' } }
      ]
    },
    {
      id: 'regional_autonomy_progress',
      name: { en: 'Regional Autonomy', zh: '地方自治' },
      icon: <MapPin className="w-5 h-5" />,
      levels: [
        { level: 0, name: { en: 'Centralized', zh: '中央集权' }, desc: { en: 'Madrid dictates all policy.', zh: '马德里支配一切政策。' } },
        { level: 1, name: { en: 'Minor Devolution', zh: '轻微放权' }, desc: { en: 'Some cultural rights recognized.', zh: '承认一些文化权利。' } },
        { level: 2, name: { en: 'Autonomy Statutes', zh: '自治章程' }, desc: { en: 'Regions like Catalonia have their own parliaments.', zh: '加泰罗尼亚等地区拥有自己的议会。' } },
        { level: 3, name: { en: 'Federalism', zh: '联邦制' }, desc: { en: 'A union of equal regional republics.', zh: '平等的区域共和国联盟。' } },
        { level: 4, name: { en: 'Self-Determination', zh: '民族自决' }, desc: { en: 'Right to absolute independence.', zh: '绝对的独立权利。' } }
      ]
    }
  ]
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  isZh: boolean;
}

export const DomesticPolicyModal: React.FC<Props> = ({ isOpen, onClose, state, isZh }) => {
  const [activePolicy, setActivePolicy] = useState<PolicyDef | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-paper border-2 border-ink w-full max-w-5xl md:h-[80vh] flex flex-col shadow-2xl relative">
        {/* Header */}
        <div className="border-b-2 border-ink border-opacity-30 p-4 flex justify-between items-center bg-ink/5">
          <div className="flex items-center gap-4">
            {activePolicy && (
              <button 
                onClick={() => setActivePolicy(null)}
                className="flex items-center gap-1 text-sm font-bold bg-ink text-paper px-3 py-1 hover:bg-ink-light transition-colors"
              >
                <span>{isZh ? '返回' : 'Back'}</span>
              </button>
            )}
            <h2 className="font-typewriter text-2xl font-bold">
              {activePolicy 
                ? (isZh ? activePolicy.name.zh : activePolicy.name.en) 
                : (isZh ? '国内政策法案' : 'Domestic Policies')}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-ink/10 transition-colors border border-transparent hover:border-ink"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {!activePolicy ? (
            <>
              {/* Overview Mode: Left Column - Economy */}
              <div className="flex-1 border-r-0 md:border-r-2 border-ink border-opacity-30 p-6 overflow-y-auto flex flex-col gap-6">
                <h3 className="font-typewriter text-xl font-bold mb-2 flex items-center gap-2 border-b-2 border-ink pb-2">
                  <Hammer className="w-6 h-6 text-ink-light" />
                  {isZh ? '经济法案 (Economy)' : 'Economy'}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {POLICIES_DEF.economy.map((policy) => {
                    const currentValue = state.domesticPolicy[policy.id];
                    const currentLevelName = policy.levels.find(l => l.level === currentValue)?.name;

                    return (
                      <button
                        key={policy.id}
                        onClick={() => setActivePolicy(policy)}
                        className="text-left p-4 border border-ink transition-all flex flex-col gap-2 bg-transparent hover:bg-ink hover:text-paper group"
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="font-bold font-typewriter text-lg group-hover:text-paper">{isZh ? policy.name.zh : policy.name.en}</span>
                          <div className="flex gap-1">
                            {policy.levels.map((lvl) => (
                              <div 
                                key={lvl.level} 
                                className={`w-3 h-3 rounded-full border border-ink/20 ${
                                  lvl.level === currentValue 
                                    ? 'bg-cnt-red group-hover:bg-paper' 
                                    : (lvl.level < currentValue 
                                        ? 'bg-ink/40 group-hover:bg-paper/40'
                                        : 'bg-transparent group-hover:bg-paper/10')
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm font-medium text-ink-light group-hover:text-paper/80">
                          {isZh ? currentLevelName?.zh : currentLevelName?.en}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Overview Mode: Middle Column - Society */}
              <div className="flex-1 border-r-0 md:border-r-2 border-ink border-opacity-30 p-6 overflow-y-auto flex flex-col gap-6 bg-ink/5">
                <h3 className="font-typewriter text-xl font-bold mb-2 flex items-center gap-2 border-b-2 border-ink pb-2">
                  <Book className="w-6 h-6 text-ink-light" />
                  {isZh ? '社会法案 (Society)' : 'Society'}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {POLICIES_DEF.society.map((policy) => {
                    const currentValue = state.domesticPolicy[policy.id];
                    const currentLevelName = policy.levels.find(l => l.level === currentValue)?.name;

                    return (
                      <button
                        key={policy.id}
                        onClick={() => setActivePolicy(policy)}
                        className="text-left p-4 border border-ink transition-all flex flex-col gap-2 bg-paper hover:bg-ink hover:text-paper group shadow-sm"
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="font-bold font-typewriter text-lg group-hover:text-paper">{isZh ? policy.name.zh : policy.name.en}</span>
                          <div className="flex gap-1">
                            {policy.levels.map((lvl) => (
                              <div 
                                key={lvl.level} 
                                className={`w-3 h-3 rounded-full border border-ink/20 ${
                                  lvl.level === currentValue 
                                    ? 'bg-cnt-red group-hover:bg-paper' 
                                    : (lvl.level < currentValue 
                                        ? 'bg-ink/40 group-hover:bg-paper/40'
                                        : 'bg-transparent group-hover:bg-paper/10')
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm font-medium text-ink-light group-hover:text-paper/80">
                          {isZh ? currentLevelName?.zh : currentLevelName?.en}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Overview Mode: Right Column - Bills */}
              <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 bg-paper">
                <h3 className="font-typewriter text-xl font-bold mb-2 flex items-center gap-2 border-b-2 border-ink pb-2">
                  <BookOpen className="w-6 h-6 text-ink-light" />
                  {isZh ? '法案与法令 (Bills)' : 'Bills & Acts'}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className={`p-4 border-2 flex flex-col gap-2 relative transition-all ${
                    state.domesticPolicy.land_reform_law_enabled 
                      ? 'border-green-600 bg-green-50/30' 
                      : 'border-ink/20 bg-ink/5 opacity-60'
                  }`}>
                    <div className="flex justify-between items-start">
                      <span className="font-bold font-typewriter text-lg text-ink">
                        {isZh ? '土地改革法' : 'Land Reform Act'}
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 border font-typewriter tracking-wider ${
                        state.domesticPolicy.land_reform_law_enabled 
                          ? 'bg-green-100 border-green-600 text-green-700' 
                          : 'bg-paper border-ink/20 text-ink/40'
                      }`}>
                        {state.domesticPolicy.land_reform_law_enabled 
                          ? (isZh ? '已启用' : 'Enacted') 
                          : (isZh ? '未启用' : 'Inactive')}
                      </span>
                    </div>
                    <p className="text-xs text-ink/70 leading-relaxed font-sans mt-1">
                      {isZh 
                        ? '旨在促进农村闲置土地及大地主未开发土地的征收和分配。该法案一旦正式签署启用，每个月将自动为土地改革进度+1%，提供稳定的土地社会化进程。' 
                        : 'Organizes expropriation and fair allocation of unused agricultural estates. Once enacted, it automatically adds 1 point (1%) to Land Reform progress each month.'}
                    </p>
                    <div className="mt-2 text-[10px] font-bold font-typewriter uppercase flex items-center gap-1.5">
                      {state.domesticPolicy.land_reform_law_enabled ? (
                        <span className="text-green-700 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse inline-block" />
                          {isZh ? '持续运行中：每月进度 +1%' : 'Active: Monthly Progress +1%'}
                        </span>
                      ) : (
                        <span className="text-ink/50">
                          {isZh ? '待激活（通过特定历史事件启动）' : 'Awaiting legislative launch'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={`p-4 border-2 flex flex-col gap-2 relative transition-all ${
                    state.domesticPolicy.mixed_jury_law_enabled 
                      ? 'border-green-600 bg-green-50/30' 
                      : 'border-ink/20 bg-ink/5 opacity-60'
                  }`}>
                    <div className="flex justify-between items-start">
                      <span className="font-bold font-typewriter text-lg text-ink">
                        {isZh ? '混合陪审团法' : 'Mixed Jury Law'}
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 border font-typewriter tracking-wider ${
                        state.domesticPolicy.mixed_jury_law_enabled 
                          ? 'bg-green-100 border-green-600 text-green-700' 
                          : 'bg-paper border-ink/20 text-ink/40'
                      }`}>
                        {state.domesticPolicy.mixed_jury_law_enabled 
                          ? (isZh ? '已启用' : 'Enacted') 
                          : (isZh ? '未启用' : 'Inactive')}
                      </span>
                    </div>
                    <p className="text-xs text-ink/70 leading-relaxed font-sans mt-1">
                      {isZh 
                        ? '旨在促进雇主与工人之间纠纷调解，规制待遇并保障其执行。法案启用后使革命狂热每月 -1。若遭到 CNT 抵制，则将长线削弱 CNT 在产业工人中的支持，转移至社会党 (PSOE)。' 
                        : 'Resolves disputes between workers and employers, and regulates wages, hours, and dismissals. Active effect decreases revolutionary fervor by 1 per month, and gradually erodes CNT support among workers if opposed by the union.'}
                    </p>
                    <div className="mt-2 text-[10px] font-bold font-typewriter uppercase flex items-center gap-1.5">
                      {state.domesticPolicy.mixed_jury_law_enabled ? (
                        <span className="text-green-700 flex flex-col gap-1">
                          <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-green-600 animate-pulse inline-block" />
                            {isZh ? '持续运行中：每月革命狂热 -1' : 'Active: Monthly Revolutionary Fervor -1'}
                          </span>
                          {state.domesticPolicy.mixed_jury_cnt_opposed && (
                            <span className="text-amber-700 flex items-center gap-1 font-semibold mt-1 normal-case">
                              ⚠️ {isZh ? '遭到 CNT 抵制：每月转移 5/12 产业工人支持度至 PSOE' : 'CNT Opposed: Monthly moves 5/12 worker support to PSOE'}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-ink/50">
                          {isZh ? '待激活（通过特定历史事件启动）' : 'Awaiting legislative launch'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Detail Mode: Single Column */
            <div className="w-full p-6 md:p-10 flex flex-col overflow-y-auto bg-ink/5 relative items-center">
              <div className="w-full max-w-3xl">
                <div className="flex items-center gap-4 mb-10 border-b-2 border-ink/20 pb-6">
                  <div className="p-4 bg-ink text-paper rounded-sm shadow-md">
                    {activePolicy.icon}
                  </div>
                  <h3 className="font-typewriter text-4xl font-bold">
                    {isZh ? activePolicy.name.zh : activePolicy.name.en}
                  </h3>
                </div>

                <div className="flex flex-col gap-6 relative isolate">
                  {/* Timeline line */}
                  <div className="absolute left-6 top-6 bottom-6 w-1 bg-ink/10 -z-10" />

                  {activePolicy.levels.map((lvl) => {
                    const isCurrent = state.domesticPolicy[activePolicy.id] === lvl.level;
                    
                    return (
                      <div 
                        key={lvl.level} 
                        className={`flex items-start gap-6 p-6 border-2 transition-colors ${
                          isCurrent 
                            ? 'border-ink bg-paper shadow-xl scale-[1.02] z-10' 
                            : 'border-transparent hover:border-ink/30 hover:bg-paper/50'
                        }`}
                      >
                        <div className="mt-1 flex-shrink-0 relative">
                          <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold text-lg bg-paper ${
                            isCurrent ? 'border-cnt-red text-cnt-red shadow-sm' : 'border-ink/20 text-ink-light'
                          }`}>
                            {lvl.level}
                          </div>
                        </div>
                        <div className="flex flex-col flex-1">
                          <div className="flex justify-between items-center mb-2">
                            <span className={`font-typewriter font-bold text-2xl ${isCurrent ? 'text-cnt-red' : ''}`}>
                              {isZh ? lvl.name.zh : lvl.name.en}
                            </span>
                            {isCurrent && (
                              <span className="text-sm border-2 px-3 py-1 border-cnt-red text-cnt-red font-bold uppercase tracking-widest bg-cnt-red/10 animate-pulse">
                                {isZh ? '当前生效' : 'Active'}
                              </span>
                            )}
                          </div>
                          <p className={`text-base leading-relaxed ${isCurrent ? 'text-ink font-medium' : 'text-ink-light'}`}>
                            {isZh ? lvl.desc.zh : lvl.desc.en}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
