import React, { useState } from 'react';
import { GameState } from '../game/types';
import { ShieldAlert, BookOpen, Scaling, Hammer, Plane as Plant, Heart, Baby, Book, MapPin, X, Languages, Users } from 'lucide-react';

interface PolicyLevel {
  level: number;
  name: { en: string; zh: string };
  desc: { en: string; zh: string };
  effect?: { en: string; zh: string };
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
      id: 'max_hours_law',
      name: { en: 'Max Hours', zh: '最高工时' },
      icon: <Scaling className="w-5 h-5" />,
      levels: [
        { 
          level: 0, 
          name: { en: 'No Limits', zh: '无限制' }, 
          desc: { en: 'Workers toil day and night with no legal protection.', zh: '工人们日以继夜地劳作，没有法律保护。' },
          effect: { en: 'No monthly budget or unemployment rate effects.', zh: '无每月预算或失业率影响。' }
        },
        { 
          level: 1, 
          name: { en: '70-Hour Week', zh: '70小时工作制' }, 
          desc: { en: 'A harsh limit, but a limit nonetheless.', zh: '一个严苛的限制，但总算是个限制。' },
          effect: { en: 'Monthly budget expenditure: +0.30M. Unemployment Rate: -1.5%.', zh: '每月预算支出：+0.30M。失业率：-1.5%。' }
        },
        { 
          level: 2, 
          name: { en: '56-Hour Week', zh: '56小时工作制' }, 
          desc: { en: 'Six days a week of intense labor.', zh: '一周六天的高强度劳动。' },
          effect: { en: 'Monthly budget expenditure: +0.30M. Unemployment Rate: -1.5%.', zh: '每月预算支出：+0.30M。失业率：-1.5%。' }
        },
        { 
          level: 3, 
          name: { en: '40-Hour Week', zh: '40小时工作制' }, 
          desc: { en: 'The historical eight hours a day victory.', zh: '历史性的八小时工作制胜利。' },
          effect: { en: 'Monthly budget expenditure: +0.30M. Unemployment Rate: -1.5%.', zh: '每月预算支出：+0.30M。失业率：-1.5%。' }
        },
        { 
          level: 4, 
          name: { en: '36-Hour Week', zh: '36小时工作制' }, 
          desc: { en: 'Highly advanced worker protections.', zh: '高度发达的工人权益保障。' },
          effect: { en: 'Monthly budget expenditure: +0.30M. Unemployment Rate: -1.5%.', zh: '每月预算支出：+0.30M。失业率：-1.5%。' }
        }
      ]
    },
    {
      id: 'min_wage',
      name: { en: 'Minimum Wage', zh: '最低工资' },
      icon: <BookOpen className="w-5 h-5" />,
      levels: [
        { 
          level: 0, 
          name: { en: 'None', zh: '无' }, 
          desc: { en: 'Wages are dictated entirely by the free market.', zh: '工资完全由自由市场决定。' },
          effect: { en: 'No monthly budget expenditure.', zh: '无每月最低工资保障支出。' }
        },
        { 
          level: 1, 
          name: { en: 'Minimal', zh: '最低限度' }, 
          desc: { en: 'Prevents absolute starvation.', zh: '防止了绝对的饥饿。' },
          effect: { en: 'Monthly budget expenditure: +0.05M.', zh: '每月最低工资保障支出：+0.05M。' }
        },
        { 
          level: 2, 
          name: { en: 'Basic', zh: '基本' }, 
          desc: { en: 'A baseline wage for survival.', zh: '维持生存的基本工资。' },
          effect: { en: 'Monthly budget expenditure: +0.15M.', zh: '每月最低工资保障支出：+0.15M。' }
        },
        { 
          level: 3, 
          name: { en: 'Living Wage', zh: '生活工资' }, 
          desc: { en: 'Enough to support a modest living.', zh: '足以维持体面生活的工资。' },
          effect: { en: 'Monthly budget expenditure: +0.30M.', zh: '每月最低工资保障支出：+0.30M。' }
        },
        { 
          level: 4, 
          name: { en: 'Generous', zh: '优厚' }, 
          desc: { en: 'Workers take a commanding share of produced value.', zh: '工人分享了他们生产出的大部分价值。' },
          effect: { en: 'Monthly budget expenditure: +0.50M.', zh: '每月最低工资保障支出：+0.50M。' }
        }
      ]
    },
    {
      id: 'workplace_safety',
      name: { en: 'Workplace Safety', zh: '工作环境安全' },
      icon: <ShieldAlert className="w-5 h-5" />,
      levels: [
        { 
          level: 0, 
          name: { en: 'None', zh: '无' }, 
          desc: { en: 'Profits are paramount; lives are cheap.', zh: '利润至上；生命廉价。' },
          effect: { en: 'No active monthly effects.', zh: '无主动的月度效果。' }
        },
        { 
          level: 1, 
          name: { en: 'Basic', zh: '基本' }, 
          desc: { en: 'Simple regulations to prevent massive disasters.', zh: '防止大规模灾难的简单规定。' },
          effect: { en: 'Basic workplace protection (event factor).', zh: '提供基础的工作安全等级（影响事件触发）。' }
        },
        { 
          level: 2, 
          name: { en: 'Moderate', zh: '中等' }, 
          desc: { en: 'Regular inspections and mandatory gear.', zh: '定期检查和强制性装备。' },
          effect: { en: 'Moderate workplace protection (event factor).', zh: '提供中等的工作安全等级（影响事件触发）。' }
        },
        { 
          level: 3, 
          name: { en: 'Strict', zh: '严格' }, 
          desc: { en: 'Workers can shut down unsafe operations.', zh: '工人可以叫停不安全的作业。' },
          effect: { en: 'Strict workplace protection (event factor).', zh: '提供严格的工作安全等级（影响事件触发）。' }
        },
        { 
          level: 4, 
          name: { en: 'Comprehensive', zh: '全面' }, 
          desc: { en: 'Total priority to human life over production speed.', zh: '人命绝对优先于生产速度。' },
          effect: { en: 'Comprehensive workplace protection (event factor).', zh: '提供全面的工作安全等级（影响事件触发）。' }
        }
      ]
    },
    {
      id: 'union_status',
      name: { en: 'Union Status', zh: '工会地位' },
      icon: <Users className="w-5 h-5" />,
      levels: [
        {
          level: 0,
          name: { en: 'Union Outlawed', zh: '工会非法' },
          desc: { en: 'Unions are banned and labor organization is heavily suppressed.', zh: '工会被取缔，劳工组织受到严厉打击。' },
          effect: { en: 'None', zh: '暂无效果' }
        },
        {
          level: 1,
          name: { en: 'Freedom of Association', zh: '结社自由' },
          desc: { en: 'Workers are legally permitted to form independent associations.', zh: '工人们被法律允许成立独立的社团。' },
          effect: { en: 'None', zh: '暂无效果' }
        },
        {
          level: 2,
          name: { en: 'Mixed Jury', zh: '混合陪审团' },
          desc: { en: 'Resolves disputes between workers and employers via state mediation.', zh: '通过国家调解来解决工人与雇主之间的纠纷。' },
          effect: { en: 'Decreases revolutionary fervor by 1 per month.', zh: '每月革命狂热 -1。' }
        },
        {
          level: 3,
          name: { en: 'Collective Bargaining', zh: '集体谈判' },
          desc: { en: 'Unions are fully recognized as the exclusive bargaining agents for workers.', zh: '工会被完全承认为工人的排他性谈判代理人。' },
          effect: { en: 'None', zh: '暂无效果' }
        },
        {
          level: 4,
          name: { en: 'Committee Control', zh: '委员会控制' },
          desc: { en: 'Industrial control and factory management are transferred directly to worker councils.', zh: '工业控制和工厂管理直接转交到工人委员会手中。' },
          effect: { en: 'None', zh: '暂无效果' }
        }
      ]
    }
  ],
  society: [
    {
      id: 'political_rights',
      name: { en: 'Political Rights', zh: '政治权利' },
      icon: <Baby className="w-5 h-5" />,
      levels: [
        { 
          level: 0, 
          name: { en: 'No Elections', zh: '无选举' }, 
          desc: { en: 'No democratic elections are held.', zh: '不举行任何民主选举。' },
          effect: { en: 'No active monthly effects.', zh: '无月度效果。' }
        },
        { 
          level: 1, 
          name: { en: 'Male Suffrage', zh: '男性普选权' }, 
          desc: { en: 'Universal suffrage is restricted to men.', zh: '普选投票权仅限于男性。' },
          effect: { en: 'Monthly Revolutionary Fervor: +0.5.', zh: '每月革命热情：+0.5。' }
        },
        { 
          level: 2, 
          name: { en: 'Limited Women Suffrage', zh: '有限女性选举权' }, 
          desc: { en: 'Women have limited voting rights.', zh: '女性拥有受限的投票参与权。' },
          effect: { en: 'Monthly Class Support: Middle Class (Pequeña Burguesía) support for PRR +0.05; Clergy (Clero) support for AP +0.05.', zh: '每月阶层支持度：小资产阶级对PRR支持度 +0.05/月；神职人员对AP支持度 +0.05/月。' }
        },
        { 
          level: 3, 
          name: { en: 'Universal Suffrage', zh: '完全普选' }, 
          desc: { en: 'Universal political rights and suffrage regardless of gender.', zh: '不分性别的普选权和完整的政治权利。' },
          effect: { en: 'Monthly Class Support: Peasants (Labradores) support for PSOE +0.05; Middle Class (Pequeña Burguesía) support for PSOE +0.05; Workers (Obreros) support for PCE +0.05.', zh: '每月阶层支持度：自耕农对PSOE支持度 +0.05/月；小资产阶级对PSOE支持度 +0.05/月；产业工人对PCE支持度 +0.05/月。' }
        }
      ]
    },
    {
      id: 'religion_policy',
      name: { en: 'Religion Policy', zh: '宗教权利' },
      icon: <Heart className="w-5 h-5" />,
      levels: [
        { 
          level: 0, 
          name: { en: 'State Religion', zh: '国教' }, 
          desc: { en: 'The Catholic Church dictates morals and laws.', zh: '天主教会主导着道德和法律。' },
          effect: { en: 'Influences religious support and conservative events.', zh: '影响神职人员与宗教阶层对天主教会事件的反馈。' }
        },
        { 
          level: 1, 
          name: { en: 'Freedom of Belief', zh: '信仰自由' }, 
          desc: { en: 'The Church holds sway, but others are tolerated.', zh: '教会仍有影响，但容忍其他信仰。' },
          effect: { en: 'Moderate tolerance (influences religious stability events).', zh: '中等容忍度（影响宗教和信仰稳定类事件）。' }
        },
        { 
          level: 2, 
          name: { en: 'Secular Society', zh: '世俗社会' }, 
          desc: { en: 'Strict separation of church and state.', zh: '严格的政教分离。' },
          effect: { en: 'Strict separation (leads to state secularization events).', zh: '严格世俗化（触发与教会、学校世俗化相关的事件）。' }
        },
        { 
          level: 3, 
          name: { en: 'State Atheism', zh: '国家无神论' }, 
          desc: { en: 'Religion is discouraged or actively suppressed.', zh: '宗教被劝阻或受到积极压制。' },
          effect: { en: 'Active restriction (strongly triggers anti-clerical resistance/rebellion risk).', zh: '积极压制宗教（强烈提高宗教保守派和极右翼势力的敌对热情）。' }
        }
      ]
    },
    {
      id: 'education_institutions',
      name: { en: 'Education System', zh: '教育制度' },
      icon: <Book className="w-5 h-5" />,
      levels: [
        { 
          level: 0, 
          name: { en: 'Church Schools', zh: '教会学校' }, 
          desc: { en: 'Education is a monopoly of religious orders.', zh: '教育是宗教团体的垄断。' },
          effect: { en: 'No monthly budget expenditure. No social class support effects.', zh: '无每月预算支出。无阶层支持度影响。' }
        },
        { 
          level: 1, 
          name: { en: 'Traditional Education', zh: '传统教育' }, 
          desc: { en: 'State schools exist but are highly conservative.', zh: '公立学校存在但高度保守。' },
          effect: { en: 'No monthly budget expenditure. No social class support effects.', zh: '无每月预算支出。无阶层支持度影响。' }
        },
        { 
          level: 2, 
          name: { en: 'Rational Education', zh: '理性教育' }, 
          desc: { en: 'Secular, progressive curriculum.', zh: '世俗、进步的课程体系。' },
          effect: { en: 'Monthly budget expenditure: +0.05M. If Ateneos are established, CNT-FAI support increases: Workers (Obreros) +0.05*Level/month; Intellectuals +0.01*Level/month; Braceros +0.06*Level/month.', zh: '每月预算支出：+0.05M。若已建立现代学校（Ateneos）：产业工人对CNT-FAI支持度 +0.05*现代学校等级/月；知识分子对CNT-FAI支持度 +0.01*现代学校等级/月；雇农对CNT-FAI支持度 +0.06*现代学校等级/月。' }
        },
        { 
          level: 3, 
          name: { en: 'Modern Education', zh: '现代教育' }, 
          desc: { en: 'Radical pedagogical methods and absolute secularism.', zh: '激进的教学方法与绝对的世俗主义。' },
          effect: { en: 'Monthly budget expenditure: +0.10M.', zh: '每月预算支出：+0.10M。' }
        }
      ]
    },
    {
      id: 'regional_autonomy_progress',
      name: { en: 'Regional Autonomy', zh: '地方自治' },
      icon: <MapPin className="w-5 h-5" />,
      levels: [
        { 
          level: 0, 
          name: { en: 'Centralized', zh: '中央集权' }, 
          desc: { en: 'Madrid dictates all policy.', zh: '马德里支配一切政策。' },
          effect: { en: 'No regional autonomy (triggers centralist faction approval).', zh: '强化中央集权（提高保守派和保皇派满意度）。' }
        },
        { 
          level: 1, 
          name: { en: 'Minor Devolution', zh: '轻微放权' }, 
          desc: { en: 'Some cultural rights recognized.', zh: '承认一些文化权利。' },
          effect: { en: 'Slight devolution (minor regional faction support changes).', zh: '轻微地方文化自治（微弱改变地方政党关系）。' }
        },
        { 
          level: 2, 
          name: { en: 'Autonomy Statutes', zh: '自治章程' }, 
          desc: { en: 'Regions like Catalonia have their own parliaments.', zh: '加泰罗尼亚等地区拥有自己的议会。' },
          effect: { en: 'Regional parliaments (grants autonomy to Catalonia, impacts ERC relations).', zh: '地方自治章程通过（授予加泰罗尼亚和巴斯克自治，提高ERC/PNV支持度）。' }
        },
        { 
          level: 3, 
          name: { en: 'Federalism', zh: '联邦制' }, 
          desc: { en: 'A union of equal regional republics.', zh: '平等的区域共和国联盟。' },
          effect: { en: 'Federal union (strong changes in regional relations, conservative opposition).', zh: '重组为联邦制国家（大幅提升地方满意度，但引起保守派和军方的强烈不满）。' }
        },
        { 
          level: 4, 
          name: { en: 'Self-Determination', zh: '民族自决' }, 
          desc: { en: 'Right to absolute independence.', zh: '绝对的独立权利。' },
          effect: { en: 'Full self-determination (may lead to regional independence, extreme nationalist opposition).', zh: '享有完全自决和脱离联邦权（极大提高左翼满意度，但极易引发军人政变或极右内战风暴）。' }
        }
      ]
    },
    {
      id: 'language_policy',
      name: { en: 'Language Policy', zh: '语言政策' },
      icon: <Languages className="w-5 h-5" />,
      levels: [
        {
          level: 0,
          name: { en: 'Castilian Only', zh: '强制卡斯蒂利亚语' },
          desc: { en: 'Castilian Spanish is enforced as the sole official language of the state.', zh: '强制将卡斯蒂利亚语作为国家唯一的官方语言。' },
          effect: { en: 'None', zh: '暂无效果' }
        },
        {
          level: 1,
          name: { en: 'Limited Recognition', zh: '有限承认' },
          desc: { en: 'Regional languages are tolerated in minor local contexts.', zh: '在次要的地方场合容忍地方语言。' },
          effect: { en: 'None', zh: '暂无效果' }
        },
        {
          level: 2,
          name: { en: 'Dual Track', zh: '自治双轨' },
          desc: { en: 'Co-official status of regional languages alongside Castilian in autonomous regions.', zh: '自治区域内，地方语言与卡斯蒂利亚语并列为共同官方语言。' },
          effect: { en: 'None', zh: '暂无效果' }
        },
        {
          level: 3,
          name: { en: 'Multilingualism', zh: '多语制' },
          desc: { en: 'The state actively promotes and supports linguistic diversity across all institutions.', zh: '国家积极促进和支持所有机构的语言多样性。' },
          effect: { en: 'None', zh: '暂无效果' }
        },
        {
          level: 4,
          name: { en: 'Esperanto', zh: '世界语' },
          desc: { en: 'Adopt the constructed international auxiliary language as a symbol of universal brotherhood.', zh: '采用人造国际辅助语言作为普遍手足情谊的象征。' },
          effect: { en: 'None', zh: '暂无效果' }
        }
      ]
    }
  ]
};

const getDynamicPolicyEffects = (
  id: string,
  level: number,
  isZh: boolean,
  state: GameState
): string[] => {
  if (id === 'education_institutions') {
    if (level === 0 || level === 1) {
      return isZh
        ? ['无每月预算支出', '无阶层支持度影响']
        : ['No monthly budget expenditure', 'No social class support effects'];
    }
    if (level === 2) {
      const obrerosVal = (0.05 * state.ateneos_established).toFixed(2);
      const intelectualesVal = (0.01 * state.ateneos_established).toFixed(2);
      const bracerosVal = (0.06 * state.ateneos_established).toFixed(2);
      return isZh
        ? [
            '每月预算支出：+0.05M',
            `产业工人对CNT-FAI支持度 月度增加 +${obrerosVal}`,
            `知识分子对CNT-FAI支持度 月度增加 +${intelectualesVal}`,
            `雇农对CNT-FAI支持度 月度增加 +${bracerosVal}`
          ]
        : [
            'Monthly budget expenditure: +0.05M',
            `Workers (Obreros) support for CNT-FAI monthly increase: +${obrerosVal}`,
            `Intellectuals (Intelectuales) support for CNT-FAI monthly increase: +${intelectualesVal}`,
            `Peasants (Braceros) support for CNT-FAI monthly increase: +${bracerosVal}`
          ];
    }
    if (level === 3) {
      return isZh
        ? ['每月预算支出：+0.10M']
        : ['Monthly budget expenditure: +0.10M'];
    }
  }

  if (id === 'min_wage') {
    if (level === 0) {
      return isZh
        ? ['无每月最低工资保障支出']
        : ['No monthly minimum wage expenditure'];
    }
    if (level === 1) {
      return isZh
        ? ['最低工资保障支出 每月+0.05M']
        : ['Monthly minimum wage expenditure: +0.05M'];
    }
    if (level === 2) {
      return isZh
        ? ['最低工资保障支出 每月+0.15M']
        : ['Monthly minimum wage expenditure: +0.15M'];
    }
    if (level === 3) {
      return isZh
        ? ['最低工资保障支出 每月+0.30M']
        : ['Monthly minimum wage expenditure: +0.30M'];
    }
    if (level === 4) {
      return isZh
        ? ['最低工资保障支出 每月+0.50M']
        : ['Monthly minimum wage expenditure: +0.50M'];
    }
  }

  if (id === 'political_rights') {
    if (level === 0) {
      return isZh
        ? ['无选举权及民主投票效果']
        : ['No elections or democratic voting effects'];
    }
    if (level === 1) {
      return isZh
        ? ['每月革命热情：+0.5']
        : ['Monthly Revolutionary Fervor: +0.5'];
    }
    if (level === 2) {
      return isZh
        ? [
            '小资产阶级对PRR支持度 月度增加 +0.05',
            '神职人员对AP支持度 月度增加 +0.05'
          ]
        : [
            'Middle Class (Pequeña Burguesía) support for PRR monthly increase: +0.05',
            'Clergy (Clero) support for AP monthly increase: +0.05'
          ];
    }
    if (level === 3) {
      return isZh
        ? [
            '自耕农对PSOE支持度 月度增加 +0.05',
            '小资产阶级对PSOE支持度 月度增加 +0.05',
            '产业工人对PCE支持度 月度增加 +0.05'
          ]
        : [
            'Peasants (Labradores) support for PSOE monthly increase: +0.05',
            'Middle Class (Pequeña Burguesía) support for PSOE monthly increase: +0.05',
            'Workers (Obreros) support for PCE monthly increase: +0.05'
          ];
    }
  }

  if (id === 'religion_policy') {
    if (level === 0 || level === 1 || level === 3) {
      return isZh
        ? ['无效果']
        : ['No monthly effects'];
    }
    if (level === 2) {
      return isZh
        ? [
            '共和国权威 月度增加 +0.05',
            '政变进度 月度增加 +0.1'
          ]
        : [
            'Republican Authority monthly increase: +0.05',
            'Coup Progress monthly increase: +0.1'
          ];
    }
  }

  if (id === 'union_status') {
    if (level === 2) {
      const effects = isZh
        ? ['革命狂热：每月 -1']
        : ['Monthly Revolutionary Fervor: -1'];
      if (state.domesticPolicy.mixed_jury_cnt_opposed) {
        effects.push(isZh
          ? '遭到 CNT 抵制：每月转移 5/12 产业工人支持度至 PSOE'
          : 'CNT Opposed: Monthly moves 5/12 worker support to PSOE'
        );
      }
      return effects;
    }
    return isZh
      ? ['无效果']
      : ['No active monthly effects'];
  }

  return [];
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
                  {isZh ? '社会经济' : 'Socioeconomics'}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {POLICIES_DEF.economy.map((policy) => {
                    const currentValue = state.domesticPolicy[policy.id];
                    const currentLevelName = policy.levels.find(l => l.level === currentValue)?.name;

                    return (
                      <button
                        key={policy.id}
                        onClick={() => setActivePolicy(policy)}
                        className="text-left p-4 border border-ink transition-all flex gap-4 bg-transparent hover:bg-ink hover:text-paper group"
                      >
                        {/* Current Law Icon on Left */}
                        <div className="flex-shrink-0 w-12 h-12 bg-ink/5 border border-ink/10 flex items-center justify-center overflow-hidden rounded-sm relative group-hover:border-paper/20">
                          <img 
                            src={`${(import.meta as any).env.BASE_URL || '/'}Law/${policy.levels.find(l => l.level === currentValue)?.name.en || ''}.png`}
                            alt={policy.levels.find(l => l.level === currentValue)?.name.en || ''}
                            referrerPolicy="no-referrer"
                            className="absolute inset-0 w-full h-full object-cover"
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
                          <div className="flex items-center justify-center text-ink/40 group-hover:text-paper/60 w-full h-full">
                            {policy.icon}
                          </div>
                        </div>

                        {/* Content on Right */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div className="flex justify-between items-center w-full">
                            <span className="font-bold font-typewriter text-lg group-hover:text-paper truncate">
                              {isZh ? policy.name.zh : policy.name.en}
                            </span>
                            <div className="flex gap-1 flex-shrink-0 ml-2">
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
                          <span className="text-sm font-medium text-ink-light group-hover:text-paper/80 mt-1 truncate">
                            {isZh ? currentLevelName?.zh : currentLevelName?.en}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Overview Mode: Middle Column - Society */}
              <div className="flex-1 border-r-0 md:border-r-2 border-ink border-opacity-30 p-6 overflow-y-auto flex flex-col gap-6 bg-ink/5">
                <h3 className="font-typewriter text-xl font-bold mb-2 flex items-center gap-2 border-b-2 border-ink pb-2">
                  <Book className="w-6 h-6 text-ink-light" />
                  {isZh ? '社会权利' : 'Social Rights'}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {POLICIES_DEF.society.map((policy) => {
                    const currentValue = state.domesticPolicy[policy.id];
                    const currentLevelName = policy.levels.find(l => l.level === currentValue)?.name;

                    return (
                      <button
                        key={policy.id}
                        onClick={() => setActivePolicy(policy)}
                        className="text-left p-4 border border-ink transition-all flex gap-4 bg-paper hover:bg-ink hover:text-paper group shadow-sm"
                      >
                        {/* Current Law Icon on Left */}
                        <div className="flex-shrink-0 w-12 h-12 bg-ink/5 border border-ink/10 flex items-center justify-center overflow-hidden rounded-sm relative group-hover:border-paper/20">
                          <img 
                            src={`${(import.meta as any).env.BASE_URL || '/'}Law/${policy.levels.find(l => l.level === currentValue)?.name.en || ''}.png`}
                            alt={policy.levels.find(l => l.level === currentValue)?.name.en || ''}
                            referrerPolicy="no-referrer"
                            className="absolute inset-0 w-full h-full object-cover"
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
                          <div className="flex items-center justify-center text-ink/40 group-hover:text-paper/60 w-full h-full">
                            {policy.icon}
                          </div>
                        </div>

                        {/* Content on Right */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div className="flex justify-between items-center w-full">
                            <span className="font-bold font-typewriter text-lg group-hover:text-paper truncate">
                              {isZh ? policy.name.zh : policy.name.en}
                            </span>
                            <div className="flex gap-1 flex-shrink-0 ml-2">
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
                          <span className="text-sm font-medium text-ink-light group-hover:text-paper/80 mt-1 truncate">
                            {isZh ? currentLevelName?.zh : currentLevelName?.en}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Overview Mode: Right Column - Bills */}
              <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 bg-paper">
                <h3 className="font-typewriter text-xl font-bold mb-2 flex items-center gap-2 border-b-2 border-ink pb-2">
                  <BookOpen className="w-6 h-6 text-ink-light" />
                  {isZh ? '政策法令' : 'Bills'}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className={`p-4 border-2 flex flex-col gap-2 relative transition-all ${
                    state.domesticPolicy.land_reform_law_enabled 
                      ? (state.budget <= 0 ? 'border-amber-600 bg-amber-50/10' : 'border-green-600 bg-green-50/30') 
                      : 'border-ink/20 bg-ink/5 opacity-60'
                  }`}>
                    <div className="flex justify-between items-start">
                      <span className="font-bold font-typewriter text-lg text-ink">
                        {isZh ? '土地改革法' : 'Land Reform Act'}
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 border font-typewriter tracking-wider ${
                        state.domesticPolicy.land_reform_law_enabled 
                          ? (state.budget <= 0 ? 'bg-amber-100 border-amber-600 text-amber-700' : 'bg-green-100 border-green-600 text-green-700') 
                          : 'bg-paper border-ink/20 text-ink/40'
                      }`}>
                        {state.domesticPolicy.land_reform_law_enabled 
                          ? (state.budget <= 0 ? (isZh ? '已暂停' : 'Paused') : (isZh ? '已启用' : 'Enacted')) 
                          : (isZh ? '未启用' : 'Inactive')}
                      </span>
                    </div>
                    <p className="text-xs text-ink/70 leading-relaxed font-sans mt-1">
                      {isZh 
                        ? '旨在促进农村闲置土地及大地主未开发土地的征收和分配，提供稳定的土地社会化进程。启用效果：每个月土地改革进度+1%。' 
                        : 'Organizes expropriation and fair allocation of unused agricultural estates. Once enacted, it automatically adds 1 point (1%) to Land Reform progress each month.'}
                    </p>
                    <div className="mt-2 text-[10px] font-bold font-typewriter uppercase flex items-center gap-1.5">
                      {state.domesticPolicy.land_reform_law_enabled ? (
                        state.budget <= 0 ? (
                          <span className="text-amber-700 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse inline-block" />
                            {isZh ? '⚠️ 经济赤字（国库预算 ≤ 0）：法案已暂停，补偿金暂不支付' : '⚠️ Deficit (Budget <= 0): Bill has been paused, compensation stopped'}
                          </span>
                        ) : (
                          <span className="text-green-700 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse inline-block" />
                            {isZh ? '持续运行中：土地划分推进中（每月支出 0.4M 固定补偿金）' : 'Active: Expropriation in progress (0.4M fixed monthly cost)'}
                          </span>
                        )
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
                          <div className="relative w-14 h-14 bg-ink/5 border border-ink/10 flex items-center justify-center overflow-hidden rounded-sm">
                            <img 
                              src={`${(import.meta as any).env.BASE_URL || '/'}Law/${lvl.name.en}.png`}
                              alt={lvl.name.en}
                              referrerPolicy="no-referrer"
                              className="absolute inset-0 w-full h-full object-cover"
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
                            <div className="flex items-center justify-center text-ink/40 w-full h-full">
                              {activePolicy.icon}
                            </div>
                          </div>
                          
                          {/* Level badge */}
                          <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-xs bg-paper ${
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
                          {((activePolicy?.id === 'education_institutions' || activePolicy?.id === 'min_wage' || activePolicy?.id === 'political_rights' || activePolicy?.id === 'religion_policy' || activePolicy?.id === 'union_status') && getDynamicPolicyEffects(activePolicy.id, lvl.level, isZh, state).length > 0) ? (
                            <div className="mt-2.5 p-3 bg-ink/5 border-l-4 border-cnt-red text-xs font-mono flex flex-col gap-1">
                              <span className="font-bold text-ink uppercase tracking-wider">
                                {isZh ? '■ 月度效果:' : '■ Monthly Effect:'}
                              </span>
                              <div className="text-ink-light leading-relaxed flex flex-col gap-1">
                                {getDynamicPolicyEffects(activePolicy.id, lvl.level, isZh, state).map((line, idx) => (
                                  <div key={idx} className="flex items-start gap-1">
                                    <span className="text-cnt-red">•</span>
                                    <span>{line}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            lvl.effect && (
                              <div className="mt-2.5 p-3 bg-ink/5 border-l-4 border-cnt-red text-xs font-mono flex flex-col gap-1">
                                <span className="font-bold text-ink uppercase tracking-wider">
                                  {isZh ? '■ 月度效果:' : '■ Monthly Effect:'}
                                </span>
                                <span className="text-ink-light leading-relaxed">
                                  {isZh ? lvl.effect.zh : lvl.effect.en}
                                </span>
                              </div>
                            )
                          )}
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
