import React, { useState } from 'react';
import { GameState } from '../game/types';
import { ShieldAlert, BookOpen, Scaling, Hammer, Sprout, Heart, Baby, Book, MapPin, X, Languages, Users, ShieldCheck, Swords, Crosshair, UserCheck } from 'lucide-react';

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

const getLawIconFilename = (policyId: PolicyDef['id'], level: number): string => `${policyId}_${level}.png`;

export const POLICIES_DEF: Record<'economy' | 'society' | 'security', PolicyDef[]> = {
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
          effect: { en: 'Monthly revolutionary fervor: +1.', zh: '革命热情：+1/月。' }
        },
        { 
          level: 1, 
          name: { en: 'Non-strict 40-hour Workweek', zh: '非严格40小时工作制' },
          desc: { en: 'A flexible 40-hour standard with broad exceptions and weak enforcement.', zh: '实行带有广泛例外、执行力度较弱的40小时标准。' },
          effect: { en: 'Monthly revolutionary fervor: +0.5.', zh: '革命热情：+0.5/月。' }
        },
        { 
          level: 2, 
          name: { en: 'Urban 40-hour Workweek', zh: '城市40小时工作制' },
          desc: { en: 'The 40-hour standard is funded and enforced in the main urban industries.', zh: '在主要城市工业部门提供财政支持并执行40小时工作制。' },
          effect: { en: 'Monthly budget expenditure: +0.15M.', zh: '每月财政支出：+0.15M。' }
        },
        { 
          level: 3, 
          name: { en: 'Strict 40-hour Workweek', zh: '严格40小时工作制' },
          desc: { en: 'A rigorously enforced national 40-hour standard with public support for adjustment.', zh: '全国严格执行40小时标准，并由公共财政承担转型成本。' },
          effect: { en: 'Monthly budget expenditure: +0.25M. Revolutionary fervor: -0.5. Republican authority: +0.5. Unemployment rate: -1%.', zh: '每月财政支出：+0.25M；革命热情：-0.5；共和国权威：+0.5；失业率：-1%。' }
        },
        { 
          level: 4, 
          name: { en: '36-Hour Week', zh: '36小时工作制' }, 
          desc: { en: 'Highly advanced worker protections.', zh: '高度发达的工人权益保障。' },
          effect: { en: 'Monthly budget expenditure: +0.40M. Revolutionary fervor: -1. Unemployment rate: -1.5%.', zh: '每月财政支出：+0.40M；革命热情：-1；失业率：-1.5%。' }
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
          effect: { en: 'Monthly revolutionary fervor: +1.', zh: '革命热情：+1/月。' }
        },
        { 
          level: 1, 
          name: { en: 'Basic', zh: '基本' }, 
          desc: { en: 'Simple regulations to prevent massive disasters.', zh: '防止大规模灾难的简单规定。' },
          effect: { en: 'Monthly budget expenditure: +0.05M.', zh: '每月财政支出：+0.05M。' }
        },
        { 
          level: 2, 
          name: { en: 'Moderate', zh: '中等' }, 
          desc: { en: 'Regular inspections and mandatory gear.', zh: '定期检查和强制性装备。' },
          effect: { en: 'Monthly budget expenditure: +0.10M.', zh: '每月财政支出：+0.10M。' }
        },
        { 
          level: 3, 
          name: { en: 'Strict', zh: '严格' }, 
          desc: { en: 'Workers can shut down unsafe operations.', zh: '工人可以叫停不安全的作业。' },
          effect: { en: 'Monthly budget expenditure: +0.20M. Revolutionary fervor: -0.5. Republican authority: +0.5.', zh: '每月财政支出：+0.20M；革命热情：-0.5；共和国权威：+0.5。' }
        },
        { 
          level: 4, 
          name: { en: 'Comprehensive', zh: '全面' }, 
          desc: { en: 'Total priority to human life over production speed.', zh: '人命绝对优先于生产速度。' },
          effect: { en: 'Monthly budget expenditure: +0.35M. Revolutionary fervor: -1.', zh: '每月财政支出：+0.35M；革命热情：-1。' }
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
    },
    {
      id: 'land_law',
      name: { en: 'Land Law', zh: '土地法' },
      icon: <Sprout className="w-5 h-5" />,
      levels: [
        { 
          level: 0, 
          name: { en: 'No Land Reform', zh: '无土地改革' }, 
          desc: { en: 'Land remains concentrated in the hands of latifundistas. Peasants remain landless and restless.', zh: '土地仍高度集中于大地主之手，贫苦农民无地可耕，农村阶级矛盾剧烈。' },
          effect: { en: 'Monthly Revolutionary Fervor +1.', zh: '革命热情月度+1。' }
        },
        { 
          level: 1, 
          name: { en: 'Land Reform Act', zh: '土地改革法' }, 
          desc: { en: 'Organizes expropriation and fair allocation of unused agricultural estates with compensation.', zh: '旨在促进农村闲置土地及大地主未开发土地的征收和分配，提供稳定的土地社会化进程。' },
          effect: { en: 'Monthly Land Reform journal progress +1.', zh: '每月土地改革日志进度+1。' }
        },
        { 
          level: 2, 
          name: { en: 'Compulsory Land Expropriation', zh: '强制土地没收' }, 
          desc: { en: 'State forcibly expropriates large feudal estates without compensation to accelerate agrarian transformation.', zh: '国家强制没收大地主与贵族地产，不予经济补偿，全面加速土地再分配进程。' },
          effect: { en: 'Monthly Land Reform journal progress +1.5.', zh: '月度土地改革日志进度+1.5。' }
        },
        { 
          level: 3, 
          name: { en: 'Revolutionary Collectivization', zh: '革命集体化' }, 
          desc: { en: 'Abolishes private land ownership entirely, turning farms into worker-managed peasant collectives.', zh: '彻底废除土地私有制，将所有农场改组为农民与农业工人集体所有、民主管理的革命公社。' },
          effect: { en: 'Monthly Land Reform journal progress +2.', zh: '月度土地改革日志进度+2。' }
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
          effect: { en: 'Monthly revolutionary fervor: +1.', zh: '革命热情：+1/月。' }
        },
        {
          level: 3,
          name: { en: 'Multilingualism', zh: '多语制' },
          desc: { en: 'The state actively promotes and supports linguistic diversity across all institutions.', zh: '国家积极促进和支持所有机构的语言多样性。' },
          effect: { en: 'Monthly revolutionary fervor: +1.', zh: '革命热情：+1/月。' }
        },
        {
          level: 4,
          name: { en: 'Esperanto', zh: '世界语' },
          desc: { en: 'Adopt the constructed international auxiliary language as a symbol of universal brotherhood.', zh: '采用人造国际辅助语言作为普遍手足情谊的象征。' },
          effect: { en: 'Monthly Intellectuals support for CNT-FAI: +0.01. International Socialist relations: +1.5.', zh: '知识分子对CNT-FAI支持度：+0.01/月；国际社会主义者关系：+1.5/月。' }
        }
      ]
    }
  ],
  security: [
    {
      id: 'public_order_law',
      name: { en: 'Public Order Law', zh: '公共秩序法' },
      icon: <ShieldCheck className="w-5 h-5" />,
      levels: [
        {
          level: 0,
          name: { en: 'Jurisdiction Law', zh: '管辖权法' },
          desc: { en: 'Continuation of monarchist martial law practices, aggravating workers and peasants.', zh: '沿用君主制时期的戒严惯常，激化工农' },
          effect: { en: 'Monthly Revolutionary Fervor +1%; Monthly Republican Authority -0.5%', zh: '月度革命热情+1%；月度共和国权威-0.5%' }
        },
        {
          level: 1,
          name: { en: 'Public Order Law', zh: '公共秩序法' },
          desc: { en: 'Establish a modern security framework with three levels of state of emergency.', zh: '建立三级紧急状态的现代治安框架' },
          effect: { en: 'Monthly Revolutionary Fervor +0.5%; Monthly Republican Authority -0.5%', zh: '月度革命热情+0.5%；月度共和国权威-0.5%' }
        },
        {
          level: 2,
          name: { en: 'Defense of the Republic Act', zh: '共和国防卫法' },
          desc: { en: 'Grants the Ministry of Interior extrajudicial suppression powers, detonating left-wing discontent.', zh: '赋予内政部法外镇压权，引爆左翼不满' },
          effect: { en: 'Monthly Revolutionary Fervor -0.1%; Monthly Republican Authority +0.5%', zh: '月度革命热情-0.1%；月度共和国权威+0.5%' }
        },
        {
          level: 3,
          name: { en: 'Constitutional Assembly Guarantee Act', zh: '宪政与集会保障法案' },
          desc: { en: 'Liberal idealist route: High legitimacy, low coercive power.', zh: '自由派理想主义路线：合法性高、强制力低' },
          effect: { en: 'Monthly Revolutionary Fervor -0.5%; Monthly Republican Authority +0.1%', zh: '月度革命热情-0.5%；月度共和国权威+0.1%' }
        },
        {
          level: 4,
          name: { en: 'Commune Defense Committee', zh: '公社防卫委员会' },
          desc: { en: 'Acknowledges the reality of CNT-FAI taking over local power.', zh: '承认 CNT-FAI 接管地方政权的事实' },
          effect: { en: 'No monthly effects.', zh: '无效果' }
        }
      ]
    },
    {
      id: 'security_corps_law',
      name: { en: 'Security Corps Law', zh: '治安机关法' },
      icon: <Crosshair className="w-5 h-5" />,
      levels: [
        {
          level: 0,
          name: { en: 'Guardia Civil Dominance', zh: '国民警卫队主导' },
          desc: { en: 'Relies on Guardia Civil, strong rural suppression capability.', zh: '依赖 Guardia Civil，强农村镇压能力' },
          effect: { en: 'Monthly CNT support in Braceros +1%, Army Loyalty +0.05%', zh: 'CNT在Braceros中支持率+1%,军官忠诚度+0.05%' }
        },
        {
          level: 1,
          name: { en: 'Assault Guards Formation', zh: '组建突击卫队' },
          desc: { en: 'Establish modern urban riot police loyal to the Republic.', zh: '建立忠于共和国的现代化城市防暴警察' },
          effect: { en: 'No active monthly effects (WIP)', zh: '暂无效果（WIP）' }
        },
        {
          level: 2,
          name: { en: 'Security Forces Loyalty Purge', zh: '治安部队忠诚审查' },
          desc: { en: 'Purge right-wing officers, provoking reaction from old forces.', zh: '清洗右翼警员，刺激旧势力反弹' },
          effect: { en: 'No active monthly effects (WIP)', zh: '暂无效果（WIP）' }
        },
        {
          level: 3,
          name: { en: 'Reorganize National Republican Guard', zh: '改组共和国国民警卫队' },
          desc: { en: 'Historical 1936 GNR reform, integrating security forces.', zh: '史实 1936 年 GNR 改革，整合治安力量' },
          effect: { en: 'No active monthly effects (WIP)', zh: '暂无效果（WIP）' }
        },
        {
          level: 4,
          name: { en: 'Worker Patrols', zh: '工人巡逻队' },
          desc: { en: 'Historical Catalonia Patrullas de Control.', zh: '史实加泰罗尼亚 Patrullas de Control' },
          effect: { en: 'No active monthly effects (WIP)', zh: '暂无效果（WIP）' }
        }
      ]
    },
    {
      id: 'army_reform_law',
      name: { en: 'Army Reform Law', zh: '军队改革法' },
      icon: <Swords className="w-5 h-5" />,
      levels: [
        {
          level: 0,
          name: { en: 'Maintain Old Officer Corps', zh: '维持旧军官团' },
          desc: { en: 'The bloated, conservative "African Officer Corps" harbors anti-communist tendencies.', zh: '臃肿保守的“非洲军官团”潜伏反共倾向' },
          effect: { en: 'Monthly Republican Authority -0.5%, Army Loyalty -0.05%', zh: '共和国权威月度-0.5%,军官忠诚度-0.05%' }
        },
        {
          level: 1,
          name: { en: 'Azaña Military Reforms', zh: '阿萨尼亚军事改革' },
          desc: { en: 'Dismiss redundant officers, angering the military in the short term but improving structure long term.', zh: '裁撤冗余军官，短期惹怒军方，长期改善结构' },
          effect: { en: 'Monthly Republican Authority +0.5%, Army Loyalty -0.1%', zh: '共和国权威月度+0.5%,军官忠诚度-0.1%' }
        },
        {
          level: 2,
          name: { en: 'Republican Armed Forces Reform', zh: '共和国武装改革' },
          desc: { en: 'Historical early 1936 high-risk move exiling Franco and Mola.', zh: '史实 1936 年初流放弗朗科与莫拉的高风险操作' },
          effect: { en: 'Monthly Republican Authority +1%, Army Loyalty +0.1%', zh: '共和国权威月度+1%,军官忠诚度+0.1%' }
        },
        {
          level: 3,
          name: { en: 'People\'s Republican Army', zh: '共和国人民军' },
          desc: { en: 'Historical October 1936 military reorganization crisis route.', zh: '史实 1936 年 10 月军队重组危机路线' },
          effect: { en: 'No active monthly effects (WIP)', zh: '无效果（wip）' }
        },
        {
          level: 4,
          name: { en: 'Militia Column System', zh: '民兵纵队体系' },
          desc: { en: 'Abolish ranks, implement representative elections, the Durruti militia route.', zh: '废除军衔、实行代表选举的杜鲁蒂式民兵路线' },
          effect: { en: 'No active monthly effects (WIP)', zh: '无效果（wip）' }
        }
      ]
    },
    {
      id: 'militia_legality_law',
      name: { en: 'Militia Legality Law', zh: '民兵合法性法' },
      icon: <UserCheck className="w-5 h-5" />,
      levels: [
        {
          level: 0,
          name: { en: 'Paramilitaries Illegal', zh: '准军事组织非法' },
          desc: { en: 'Official ban, but cannot stop Falange and Syndicalists from going underground.', zh: '官方禁令，但无法阻止长枪党和工团转入地下' },
          effect: { en: 'No active monthly effects (WIP)', zh: '暂无效果（WIP）' }
        },
        {
          level: 1,
          name: { en: 'Tolerate Local Militias', zh: '默许地方民兵' },
          desc: { en: 'Turn a blind eye to armed youth wings of various parties (e.g. JSU).', zh: '对各党派青年团武装（如 JSU）睁一只眼闭一只眼' },
          effect: { en: 'No active monthly effects (WIP)', zh: '暂无效果（WIP）' }
        },
        {
          level: 2,
          name: { en: 'Armed Unions Decree', zh: '武装工会法令' },
          desc: { en: 'Historical July 1936 decision by the Giral government to arm the unions.', zh: '史实 1936 年 7 月吉拉尔政府向工会发枪的决定' },
          effect: { en: 'No active monthly effects (WIP)', zh: '暂无效果（WIP）' }
        },
        {
          level: 3,
          name: { en: 'Rearguard Militia Security Integration', zh: '后方民兵治安统合' },
          desc: { en: 'Legitimize militias taking over rear checkpoints and policing.', zh: '让民兵名正言顺地接管后方检查站与警务' },
          effect: { en: 'No active monthly effects (WIP)', zh: '暂无效果（WIP）' }
        },
        {
          level: 4,
          name: { en: 'Anti-Fascist Militia Committee', zh: '反法西斯民兵委员会' },
          desc: { en: 'Historical Catalonia CCMA, essentially a syndicalist parallel government.', zh: '史实加泰罗尼亚 CCMA，实质上的工团主义平行政府' },
          effect: { en: 'No active monthly effects (WIP)', zh: '暂无效果（WIP）' }
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

  if (id === 'land_law') {
    if (level === 0) {
      return isZh
        ? ['革命热情月度+1']
        : ['Monthly Revolutionary Fervor +1'];
    }
    if (level === 1) {
      const isPaused = state.budget <= 0;
      return isZh
        ? [
            '每月土地改革日志进度+1',
            isPaused
              ? '⚠️ 经济赤字（国库预算 ≤ 0）：法案已暂停，补偿金暂不支付，进度暂停'
              : '持续运行中：每月支出 0.4M 固定补偿金'
          ]
        : [
            'Monthly Land Reform journal progress +1',
            isPaused
              ? '⚠️ Deficit (Budget <= 0): Bill paused, compensation stopped, progress paused'
              : 'Active: 0.4M fixed monthly compensation cost'
          ];
    }
    if (level === 2) {
      return isZh
        ? ['月度土地改革日志进度+1.5', '无需支付土地补偿金']
        : ['Monthly Land Reform journal progress +1.5', 'No fixed compensation cost'];
    }
    if (level === 3) {
      return isZh
        ? ['月度土地改革日志进度+2', '无需支付土地补偿金']
        : ['Monthly Land Reform journal progress +2', 'No fixed compensation cost'];
    }
  }

  if (id === 'public_order_law') {
    if (level === 0) return isZh ? ['月度革命热情 +1%', '月度共和国权威 -0.5%'] : ['Monthly Revolutionary Fervor +1%', 'Monthly Republican Authority -0.5%'];
    if (level === 1) return isZh ? ['月度革命热情 +0.5%', '月度共和国权威 -0.5%'] : ['Monthly Revolutionary Fervor +0.5%', 'Monthly Republican Authority -0.5%'];
    if (level === 2) return isZh ? ['月度革命热情 -0.1%', '月度共和国权威 +0.5%'] : ['Monthly Revolutionary Fervor -0.1%', 'Monthly Republican Authority +0.5%'];
    if (level === 3) return isZh ? ['月度革命热情 -0.5%', '月度共和国权威 +0.1%'] : ['Monthly Revolutionary Fervor -0.5%', 'Monthly Republican Authority +0.1%'];
    if (level === 4) return isZh ? ['无效果'] : ['No monthly effects'];
  }

  if (id === 'security_corps_law') {
    if (level === 0) return isZh ? ['CNT在Braceros中支持率 +1%', '军官忠诚度 +0.05%'] : ['Monthly CNT support in Braceros +1%', 'Army Loyalty +0.05%'];
    return isZh ? ['暂无效果（WIP）'] : ['No active monthly effects (WIP)'];
  }

  if (id === 'army_reform_law') {
    if (level === 0) return isZh ? ['共和国权威月度 -0.5%', '军官忠诚度 -0.05%'] : ['Monthly Republican Authority -0.5%', 'Army Loyalty -0.05%'];
    if (level === 1) return isZh ? ['共和国权威月度 +0.5%', '军官忠诚度 -0.1%'] : ['Monthly Republican Authority +0.5%', 'Army Loyalty -0.1%'];
    if (level === 2) return isZh ? ['共和国权威月度 +1%', '军官忠诚度 +0.1%'] : ['Monthly Republican Authority +1%', 'Army Loyalty +0.1%'];
    return isZh ? ['无效果（WIP）'] : ['No active monthly effects (WIP)'];
  }

  if (id === 'militia_legality_law') {
    return isZh ? ['暂无效果（WIP）'] : ['No active monthly effects (WIP)'];
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
                    const currentLevel = policy.levels.find(l => l.level === currentValue);
                    const currentLevelName = currentLevel?.name;

                    return (
                      <button
                        key={policy.id}
                        onClick={() => setActivePolicy(policy)}
                        className="text-left p-4 border border-ink transition-all flex gap-4 bg-transparent hover:bg-ink hover:text-paper group"
                      >
                        {/* Current Law Icon on Left */}
                        <div className="flex-shrink-0 w-12 h-12 bg-ink/5 border border-ink/10 flex items-center justify-center overflow-hidden rounded-sm relative group-hover:border-paper/20">
                          <img 
                            src={`${(import.meta as any).env.BASE_URL || '/'}img/Law/${getLawIconFilename(policy.id, currentLevel?.level ?? 0)}`}
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

              {/* Overview Mode: Right Column - Society */}
              <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 bg-ink/5">
                <h3 className="font-typewriter text-xl font-bold mb-2 flex items-center gap-2 border-b-2 border-ink pb-2">
                  <Book className="w-6 h-6 text-ink-light" />
                  {isZh ? '社会权利' : 'Social Rights'}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {POLICIES_DEF.society.map((policy) => {
                    const currentValue = state.domesticPolicy[policy.id];
                    const currentLevel = policy.levels.find(l => l.level === currentValue);
                    const currentLevelName = currentLevel?.name;

                    return (
                      <button
                        key={policy.id}
                        onClick={() => setActivePolicy(policy)}
                        className="text-left p-4 border border-ink transition-all flex gap-4 bg-paper hover:bg-ink hover:text-paper group shadow-sm"
                      >
                        {/* Current Law Icon on Left */}
                        <div className="flex-shrink-0 w-12 h-12 bg-ink/5 border border-ink/10 flex items-center justify-center overflow-hidden rounded-sm relative group-hover:border-paper/20">
                          <img 
                            src={`${(import.meta as any).env.BASE_URL || '/'}img/Law/${getLawIconFilename(policy.id, currentLevel?.level ?? 0)}`}
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

              {/* Overview Mode: Right Column - Security */}
              <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 bg-ink/5 border-l-0 md:border-l-2 border-ink border-opacity-30">
                <h3 className="font-typewriter text-xl font-bold mb-2 flex items-center gap-2 border-b-2 border-ink pb-2">
                  <ShieldCheck className="w-6 h-6 text-ink-light" />
                  {isZh ? '社会安全' : 'Social Security'}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {POLICIES_DEF.security.map((policy) => {
                    const currentValue = state.domesticPolicy[policy.id];
                    const currentLevel = policy.levels.find(l => l.level === currentValue);
                    const currentLevelName = currentLevel?.name;

                    return (
                      <button
                        key={policy.id}
                        onClick={() => setActivePolicy(policy)}
                        className="text-left p-4 border border-ink transition-all flex gap-4 bg-paper hover:bg-ink hover:text-paper group shadow-sm"
                      >
                        {/* Current Law Icon on Left */}
                        <div className="flex-shrink-0 w-12 h-12 bg-ink/5 border border-ink/10 flex items-center justify-center overflow-hidden rounded-sm relative group-hover:border-paper/20">
                          <img 
                            src={`${(import.meta as any).env.BASE_URL || '/'}img/Law/${getLawIconFilename(policy.id, currentLevel?.level ?? 0)}`}
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
                              src={`${(import.meta as any).env.BASE_URL || '/'}img/Law/${getLawIconFilename(activePolicy.id, lvl.level)}`}
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
                          {((activePolicy?.id === 'education_institutions' || activePolicy?.id === 'min_wage' || activePolicy?.id === 'political_rights' || activePolicy?.id === 'religion_policy' || activePolicy?.id === 'union_status' || activePolicy?.id === 'land_law') && getDynamicPolicyEffects(activePolicy.id, lvl.level, isZh, state).length > 0) ? (
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
