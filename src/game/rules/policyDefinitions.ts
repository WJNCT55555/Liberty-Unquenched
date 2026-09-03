import type { GameState, LawId, Party, PoliticalActor, SocialClass } from '../types';

/**
 * Canonical domestic-policy catalog. Gameplay calculators, legal-stance views,
 * and policy UI all consume these definitions instead of maintaining parallel
 * level names, costs, effects, and stance tables.
 */
export type PolicyCategory = 'economy' | 'society' | 'security';
export type BilingualText = { en: string; zh: string };

export type PolicyStanceMatrix = Record<PoliticalActor, Record<LawId, readonly number[]>>;

export type PolicyCondition =
  | { kind: 'coupActive' }
  | { kind: 'ateneosEstablished'; minimum?: number }
  | { kind: 'mixedJuryOpposed' }
  | { kind: 'landReformFunded' };

export type PolicyModifier = (
  | {
      kind: 'stat';
      target: 'revolutionaryFervor' | 'republicanAuthority' | 'armyLoyalty';
      delta: number;
      round?: number;
    }
  | {
      kind: 'classSupport';
      targetClass: SocialClass;
      targetForce: 'CNT_FAI' | Exclude<Party, 'PRRevS'>;
      delta: number;
      scaleBy?: 'ateneos_established';
    }
  | {
      kind: 'relation';
      target: 'internationalSocialists';
      delta: number;
    }
  | {
      kind: 'economy';
      target: 'unemployment';
      delta: number;
    }
  | { kind: 'coupProgress'; delta: number }
  | { kind: 'landProgress'; delta: number }
) & { conditions?: readonly PolicyCondition[] };

export interface PolicyLevelDefinition {
  level: number;
  name: BilingualText;
  description: BilingualText;
  effect: BilingualText;
  cost?: { monthlyBudget?: number };
  conditions?: readonly PolicyCondition[];
  monthlyModifiers?: readonly PolicyModifier[];
  /** Baseline stance score (−10…10) for each political actor at this level. */
  stanceChanges?: Partial<Record<PoliticalActor, number>>;
}

export interface PolicyDefinition {
  id: LawId;
  category: PolicyCategory;
  name: BilingualText;
  levels: readonly PolicyLevelDefinition[];
}

const text = (en: string, zh: string): BilingualText => ({ en, zh });
const formatRatio = (value: number): string => {
  for (let denominator = 1; denominator <= 24; denominator += 1) {
    const numerator = Math.round(value * denominator);
    if (Math.abs(value - numerator / denominator) < 0.0001) return `${numerator}/${denominator}`;
  }
  return value.toFixed(2);
};
const level = (
  levelNumber: number,
  nameEn: string,
  nameZh: string,
  descriptionEn: string,
  descriptionZh: string,
  effectEn: string,
  effectZh: string,
  metadata: Omit<PolicyLevelDefinition, 'level' | 'name' | 'description' | 'effect'> = {},
): PolicyLevelDefinition => ({
  level: levelNumber,
  name: text(nameEn, nameZh),
  description: text(descriptionEn, descriptionZh),
  effect: text(effectEn, effectZh),
  ...metadata,
});

const BASE_POLICY_DEFINITIONS: readonly PolicyDefinition[] = [
  {
    id: 'max_hours_law', category: 'economy', name: text('Max Hours', '最高工时'), levels: [
      level(0, 'No Limits', '无限制', 'Workers toil without legal limits.', '工人没有法定工时保护。', 'Monthly revolutionary fervor: +1.', '革命热情：+1/月。', { monthlyModifiers: [{ kind: 'stat', target: 'revolutionaryFervor', delta: 1 }] }),
      level(1, 'Non-strict 40-hour Workweek', '非严格40小时工作制', 'A flexible 40-hour standard with weak enforcement.', '实行执行力度较弱的40小时标准。', 'Monthly revolutionary fervor: +0.5.', '革命热情：+0.5/月。', { monthlyModifiers: [{ kind: 'stat', target: 'revolutionaryFervor', delta: 0.5 }] }),
      level(2, 'Urban 40-hour Workweek', '城市40小时工作制', 'The 40-hour standard is enforced in urban industries.', '在城市工业部门执行40小时工作制。', 'Monthly budget expenditure: +0.15M.', '每月财政支出：+0.15M。', { cost: { monthlyBudget: 0.15 } }),
      level(3, 'Strict 40-hour Workweek', '严格40小时工作制', 'A rigorously enforced national standard.', '全国严格执行40小时标准。', 'Monthly budget +0.25M; fervor -0.5; authority +0.5; unemployment -1%.', '每月支出+0.25M；革命热情-0.5；共和国权威+0.5；失业率-1%。', { cost: { monthlyBudget: 0.25 }, monthlyModifiers: [{ kind: 'stat', target: 'revolutionaryFervor', delta: -0.5 }, { kind: 'stat', target: 'republicanAuthority', delta: 0.5 }, { kind: 'economy', target: 'unemployment', delta: -1 }] }),
      level(4, '36-Hour Week', '36小时工作制', 'Highly advanced worker protections.', '高度发达的工人权益保障。', 'Monthly budget +0.40M; fervor -1; unemployment -1.5%.', '每月支出+0.40M；革命热情-1；失业率-1.5%。', { cost: { monthlyBudget: 0.4 }, monthlyModifiers: [{ kind: 'stat', target: 'revolutionaryFervor', delta: -1 }, { kind: 'economy', target: 'unemployment', delta: -1.5 }] }),
    ],
  },
  {
    id: 'min_wage', category: 'economy', name: text('Minimum Wage', '最低工资'), levels: [
      level(0, 'None', '无', 'Wages are set by the market.', '工资由市场决定。', 'No monthly budget expenditure.', '无每月财政支出。'),
      level(1, 'Minimal', '最低限度', 'Prevents absolute starvation.', '防止绝对饥饿。', 'Monthly budget expenditure: +0.05M.', '每月财政支出：+0.05M。', { cost: { monthlyBudget: 0.05 } }),
      level(2, 'Basic', '基本', 'A baseline wage for survival.', '维持生存的基本工资。', 'Monthly budget expenditure: +0.15M.', '每月财政支出：+0.15M。', { cost: { monthlyBudget: 0.15 } }),
      level(3, 'Living Wage', '生活工资', 'Enough to support a modest living.', '足以维持体面生活。', 'Monthly budget expenditure: +0.30M.', '每月财政支出：+0.30M。', { cost: { monthlyBudget: 0.3 } }),
      level(4, 'Generous', '优厚', 'Workers receive a commanding share of value.', '工人分享大部分生产价值。', 'Monthly budget expenditure: +0.50M.', '每月财政支出：+0.50M。', { cost: { monthlyBudget: 0.5 } }),
    ],
  },
  {
    id: 'workplace_safety', category: 'economy', name: text('Workplace Safety', '工作环境安全'), levels: [
      level(0, 'None', '无', 'Profits are paramount; lives are cheap.', '利润至上，生命廉价。', 'Monthly revolutionary fervor: +1.', '革命热情：+1/月。', { monthlyModifiers: [{ kind: 'stat', target: 'revolutionaryFervor', delta: 1 }] }),
      level(1, 'Basic', '基本', 'Simple regulations prevent major disasters.', '以简单规定防止重大灾难。', 'Monthly budget expenditure: +0.05M.', '每月财政支出：+0.05M。', { cost: { monthlyBudget: 0.05 } }),
      level(2, 'Moderate', '中等', 'Regular inspections and mandatory gear.', '定期检查并配备强制防护装备。', 'Monthly budget expenditure: +0.10M.', '每月财政支出：+0.10M。', { cost: { monthlyBudget: 0.1 } }),
      level(3, 'Strict', '严格', 'Workers can shut down unsafe operations.', '工人可以叫停不安全作业。', 'Monthly budget +0.20M; fervor -0.5; authority +0.5.', '每月支出+0.20M；革命热情-0.5；共和国权威+0.5。', { cost: { monthlyBudget: 0.2 }, monthlyModifiers: [{ kind: 'stat', target: 'revolutionaryFervor', delta: -0.5 }, { kind: 'stat', target: 'republicanAuthority', delta: 0.5 }] }),
      level(4, 'Comprehensive', '全面', 'Human life has priority over production speed.', '人命绝对优先于生产速度。', 'Monthly budget +0.35M; fervor -1.', '每月支出+0.35M；革命热情-1。', { cost: { monthlyBudget: 0.35 }, monthlyModifiers: [{ kind: 'stat', target: 'revolutionaryFervor', delta: -1 }] }),
    ],
  },
  {
    id: 'union_status', category: 'economy', name: text('Union Status', '工会地位'), levels: [
      level(0, 'Union Outlawed', '工会非法', 'Unions are banned.', '工会被取缔。', 'No monthly effects.', '无月度效果。'),
      level(1, 'Freedom of Association', '结社自由', 'Independent associations are legal.', '独立社团合法。', 'No monthly effects.', '无月度效果。'),
      level(2, 'Mixed Jury', '混合陪审团', 'State mediation resolves labor disputes.', '由国家调解劳资纠纷。', 'Fervor -1/month; if CNT opposed, shift 5/12 worker support to PSOE.', '革命热情-1/月；若 CNT 反对，每月将 5/12 工人支持转给 PSOE。', { monthlyModifiers: [{ kind: 'stat', target: 'revolutionaryFervor', delta: -1 }, { kind: 'classSupport', targetClass: 'Obreros', targetForce: 'PSOE', delta: 5 / 12, conditions: [{ kind: 'mixedJuryOpposed' }] }] }),
      level(3, 'Collective Bargaining', '集体谈判', 'Unions are recognized bargaining agents.', '工会成为正式谈判代理人。', 'No monthly effects.', '无月度效果。'),
      level(4, 'Committee Control', '委员会控制', 'Worker councils manage factories.', '工人委员会管理工厂。', 'No monthly effects.', '无月度效果。'),
    ],
  },
  {
    id: 'land_law', category: 'economy', name: text('Land Law', '土地法'), levels: [
      level(0, 'No Land Reform', '无土地改革', 'Land remains concentrated in large estates.', '土地仍集中于大地主手中。', 'Monthly revolutionary fervor: +1.', '革命热情：+1/月。', { monthlyModifiers: [{ kind: 'stat', target: 'revolutionaryFervor', delta: 1 }] }),
      level(1, 'Land Reform Act', '土地改革法', 'Unused estates are expropriated with compensation.', '征收闲置大地产并提供补偿。', 'Progress +1/month; compensation costs 0.4M while funded.', '进度+1/月；预算为正时补偿支出0.4M。', { cost: { monthlyBudget: 0.4 }, conditions: [{ kind: 'landReformFunded' }], monthlyModifiers: [{ kind: 'landProgress', delta: 1, conditions: [{ kind: 'landReformFunded' }] }] }),
      level(2, 'Compulsory Land Expropriation', '强制土地没收', 'Large estates are expropriated without compensation.', '无补偿强制没收大地产。', 'Land Reform progress +1.5/month.', '土地改革进度+1.5/月。', { monthlyModifiers: [{ kind: 'landProgress', delta: 1.5 }] }),
      level(3, 'Revolutionary Collectivization', '革命集体化', 'Farms become worker-managed collectives.', '农场改组为工人管理的集体。', 'Land Reform progress +2/month.', '土地改革进度+2/月。', { monthlyModifiers: [{ kind: 'landProgress', delta: 2 }] }),
    ],
  },
  {
    id: 'political_rights', category: 'society', name: text('Political Rights', '政治权利'), levels: [
      level(0, 'No Elections', '无选举', 'No democratic elections are held.', '不举行民主选举。', 'No monthly effects.', '无月度效果。'),
      level(1, 'Male Suffrage', '男性普选权', 'Universal suffrage is restricted to men.', '普选权仅限男性。', 'Revolutionary fervor +0.5/month.', '革命热情+0.5/月。', { monthlyModifiers: [{ kind: 'stat', target: 'revolutionaryFervor', delta: 0.5 }] }),
      level(2, 'Limited Women Suffrage', '有限女性选举权', 'Women have limited voting rights.', '女性拥有有限投票权。', 'Pequena Burguesia support for PRR +0.05; Clergy support for AP +0.05/month.', '小资产阶级对 PRR、神职人员对 AP 支持度各+0.05/月。', { monthlyModifiers: [{ kind: 'classSupport', targetClass: 'PequenaBurguesia', targetForce: 'PRR', delta: 0.05 }, { kind: 'classSupport', targetClass: 'Clero', targetForce: 'AP', delta: 0.05 }] }),
      level(3, 'Universal Suffrage', '完全普选', 'Universal political rights regardless of gender.', '不分性别的完整政治权利。', 'Labradores→PSOE, Pequena Burguesia→PSOE, Obreros→PCE: +0.05/month.', '自耕农→PSOE、小资产阶级→PSOE、产业工人→PCE：各+0.05/月。', { monthlyModifiers: [{ kind: 'classSupport', targetClass: 'Labradores', targetForce: 'PSOE', delta: 0.05 }, { kind: 'classSupport', targetClass: 'PequenaBurguesia', targetForce: 'PSOE', delta: 0.05 }, { kind: 'classSupport', targetClass: 'Obreros', targetForce: 'PCE', delta: 0.05 }] }),
    ],
  },
  {
    id: 'womens_rights', category: 'society', name: text("Women's Rights", '女性权利'), levels: [
      level(0, 'Traditional Status of Women', '传统妇女地位', 'Family and civil life follow patriarchal rules.', '家庭与民事生活遵循家长制规范。', 'No monthly effects.', '无月度效果。'),
      level(1, 'Civil Marriage Legalized', '民事婚姻合法化', 'Civil marriage is recognized without church administration.', '民事婚姻无需教会主持即可生效。', 'Budget +0.05M; authority +0.2/month.', '每月支出+0.05M；共和国权威+0.2/月。', { cost: { monthlyBudget: 0.05 }, monthlyModifiers: [{ kind: 'stat', target: 'republicanAuthority', delta: 0.2 }] }),
      level(2, 'Divorce Legalized', '离婚合法化', 'Civil courts recognize dissolution of marriage.', '民事法院承认解除婚姻关系。', 'Budget +0.10M; authority +0.3/month.', '每月支出+0.10M；共和国权威+0.3/月。', { cost: { monthlyBudget: 0.1 }, monthlyModifiers: [{ kind: 'stat', target: 'republicanAuthority', delta: 0.3 }] }),
      level(3, 'Abortion Rights for Women', '女性堕胎权', 'Regulated medical care protects reproductive choice.', '受监管医疗服务保障生育选择权。', 'Budget +0.15M; authority -0.2/month.', '每月支出+0.15M；共和国权威-0.2/月。', { cost: { monthlyBudget: 0.15 }, monthlyModifiers: [{ kind: 'stat', target: 'republicanAuthority', delta: -0.2 }] }),
      level(4, 'Full Gender Equality', '全面性别平等', 'Institutions enforce equal status regardless of gender.', '各机构落实不分性别的平等地位。', 'Budget +0.30M; authority +0.4; fervor -0.2; Intellectuals→CNT-FAI +0.01/month.', '每月支出+0.30M；权威+0.4；热情-0.2；知识分子→CNT-FAI +0.01/月。', { cost: { monthlyBudget: 0.3 }, monthlyModifiers: [{ kind: 'stat', target: 'republicanAuthority', delta: 0.4 }, { kind: 'stat', target: 'revolutionaryFervor', delta: -0.2 }, { kind: 'classSupport', targetClass: 'Intelectuales', targetForce: 'CNT_FAI', delta: 0.01 }] }),
    ],
  },
  {
    id: 'religion_policy', category: 'society', name: text('Religion Policy', '宗教政策'), levels: [
      level(0, 'State Religion', '国教', 'The Catholic Church shapes morals and law.', '天主教会主导道德与法律。', 'No monthly effects.', '无月度效果。'),
      level(1, 'Freedom of Belief', '信仰自由', 'The Church remains influential while other beliefs are tolerated.', '保留教会影响并容忍其他信仰。', 'No monthly effects.', '无月度效果。'),
      level(2, 'Secular Society', '世俗社会', 'Church and state are strictly separated.', '严格政教分离。', 'Authority +0.05/month; coup progress +0.1/month while active.', '共和国权威+0.05/月；政变系统激活时政变进度+0.1/月。', { monthlyModifiers: [{ kind: 'stat', target: 'republicanAuthority', delta: 0.05 }, { kind: 'coupProgress', delta: 0.1, conditions: [{ kind: 'coupActive' }] }] }),
      level(3, 'State Atheism', '国家无神论', 'Religion is actively suppressed.', '宗教受到积极压制。', 'No monthly effects.', '无月度效果。'),
    ],
  },
  {
    id: 'education_institutions', category: 'society', name: text('Education System', '教育制度'), levels: [
      level(0, 'Church Schools', '教会学校', 'Education is controlled by religious orders.', '教育由宗教团体控制。', 'No monthly budget expenditure.', '无每月财政支出。'),
      level(1, 'Traditional Education', '传统教育', 'State schools remain conservative.', '公立学校仍然保守。', 'No monthly budget expenditure.', '无每月财政支出。'),
      level(2, 'Rational Education', '理性教育', 'A secular and progressive curriculum.', '世俗且进步的课程体系。', 'Budget +0.05M; with Ateneos, class support scales by their level.', '每月支出+0.05M；建立现代学校后阶层支持按其等级增加。', { cost: { monthlyBudget: 0.05 }, conditions: [{ kind: 'ateneosEstablished', minimum: 1 }], monthlyModifiers: [{ kind: 'classSupport', targetClass: 'Obreros', targetForce: 'CNT_FAI', delta: 0.05, scaleBy: 'ateneos_established', conditions: [{ kind: 'ateneosEstablished', minimum: 1 }] }, { kind: 'classSupport', targetClass: 'Intelectuales', targetForce: 'CNT_FAI', delta: 0.01, scaleBy: 'ateneos_established', conditions: [{ kind: 'ateneosEstablished', minimum: 1 }] }, { kind: 'classSupport', targetClass: 'Braceros', targetForce: 'CNT_FAI', delta: 0.06, scaleBy: 'ateneos_established', conditions: [{ kind: 'ateneosEstablished', minimum: 1 }] }] }),
      level(3, 'Modern Education', '现代教育', 'Radical pedagogy and secularism.', '激进教学法与绝对世俗化。', 'Monthly budget expenditure: +0.10M.', '每月财政支出：+0.10M。', { cost: { monthlyBudget: 0.1 } }),
    ],
  },
  {
    id: 'language_policy', category: 'society', name: text('Language Policy', '语言政策'), levels: [
      level(0, 'Castilian Only', '强制卡斯蒂利亚语', 'Castilian is the sole official language.', '卡斯蒂利亚语是唯一官方语言。', 'No monthly effects.', '无月度效果。'),
      level(1, 'Limited Recognition', '有限承认', 'Regional languages are tolerated locally.', '地方场合有限容忍地方语言。', 'No monthly effects.', '无月度效果。'),
      level(2, 'Dual Track', '自治双轨', 'Regional languages share official status in autonomous regions.', '自治区域内地方语言与卡斯蒂利亚语并列官方语言。', 'Revolutionary fervor +1/month.', '革命热情+1/月。', { monthlyModifiers: [{ kind: 'stat', target: 'revolutionaryFervor', delta: 1 }] }),
      level(3, 'Multilingualism', '多语制', 'The state supports linguistic diversity.', '国家支持语言多样性。', 'Revolutionary fervor +1/month.', '革命热情+1/月。', { monthlyModifiers: [{ kind: 'stat', target: 'revolutionaryFervor', delta: 1 }] }),
      level(4, 'Esperanto', '世界语', 'An international auxiliary language symbolizes brotherhood.', '国际辅助语言象征普遍手足情谊。', 'Intellectuals→CNT-FAI +0.01; international socialist relations +1.5/month.', '知识分子→CNT-FAI +0.01；国际社会主义者关系+1.5/月。', { monthlyModifiers: [{ kind: 'classSupport', targetClass: 'Intelectuales', targetForce: 'CNT_FAI', delta: 0.01 }, { kind: 'relation', target: 'internationalSocialists', delta: 1.5 }] }),
    ],
  },
  {
    id: 'public_order_law', category: 'security', name: text('Public Order Law', '公共秩序法'), levels: [
      level(0, 'Jurisdiction Law', '管辖权法', 'Old martial-law practices aggravate workers and peasants.', '沿用旧式戒严惯例，激化工农矛盾。', 'Fervor +1/month; authority -0.5/month.', '革命热情+1/月；共和国权威-0.5/月。', { monthlyModifiers: [{ kind: 'stat', target: 'revolutionaryFervor', delta: 1 }, { kind: 'stat', target: 'republicanAuthority', delta: -0.5 }] }),
      level(1, 'Public Order Law', '公共秩序法', 'A modern three-level emergency framework.', '建立三级紧急状态框架。', 'Fervor +0.5/month; authority -0.5/month.', '革命热情+0.5/月；共和国权威-0.5/月。', { monthlyModifiers: [{ kind: 'stat', target: 'revolutionaryFervor', delta: 0.5 }, { kind: 'stat', target: 'republicanAuthority', delta: -0.5 }] }),
      level(2, 'Defense of the Republic Act', '共和国防卫法', 'The Interior Ministry receives extrajudicial powers.', '内政部获得法外镇压权。', 'Fervor -0.1/month; authority +0.5/month.', '革命热情-0.1/月；共和国权威+0.5/月。', { monthlyModifiers: [{ kind: 'stat', target: 'revolutionaryFervor', delta: -0.1 }, { kind: 'stat', target: 'republicanAuthority', delta: 0.5 }] }),
      level(3, 'Constitutional Guarantee Act', '宪政与集会保障法案', 'A liberal route with high legitimacy and low coercion.', '自由派路线，合法性高而强制力低。', 'Fervor -0.5/month; authority +0.1/month.', '革命热情-0.5/月；共和国权威+0.1/月。', { monthlyModifiers: [{ kind: 'stat', target: 'revolutionaryFervor', delta: -0.5 }, { kind: 'stat', target: 'republicanAuthority', delta: 0.1 }] }),
      level(4, 'Commune Defense Committee', '公社防卫委员会', 'CNT-FAI local power is openly recognized.', '承认 CNT-FAI 接管地方政权。', 'No monthly effects.', '无月度效果。'),
    ],
  },
  {
    id: 'security_corps_law', category: 'security', name: text('Security Corps Law', '治安机关法'), levels: [
      level(0, 'Guardia Civil Dominance', '国民警卫队主导', 'Guardia Civil provides rural suppression.', '依赖国民警卫队进行农村镇压。', 'Braceros→CNT-FAI +0.01; army loyalty +0.05/month.', '雇农→CNT-FAI +0.01；军官忠诚度+0.05/月。', { monthlyModifiers: [{ kind: 'classSupport', targetClass: 'Braceros', targetForce: 'CNT_FAI', delta: 0.01 }, { kind: 'stat', target: 'armyLoyalty', delta: 0.05 }] }),
      level(1, 'Assault Guards Formation', '组建突击卫队', 'Modern urban riot police loyal to the Republic.', '建立忠于共和国的城市防暴警察。', 'No monthly effects.', '无月度效果。'),
      level(2, 'Security Forces Loyalty Purge', '治安部队忠诚审查', 'Right-wing officers are purged.', '清洗右翼警员。', 'No monthly effects.', '无月度效果。'),
      level(3, 'Reorganize Republican Guard', '改组共和国国民警卫队', 'Security forces are integrated.', '整合治安力量。', 'No monthly effects.', '无月度效果。'),
      level(4, 'Worker Patrols', '工人巡逻队', 'Catalan-style workers’ patrols are recognized.', '承认加泰罗尼亚式工人巡逻队。', 'No monthly effects.', '无月度效果。'),
    ],
  },
  {
    id: 'army_reform_law', category: 'security', name: text('Army Reform Law', '军队改革法'), levels: [
      level(0, 'Maintain Old Officer Corps', '维持旧军官团', 'The conservative African officer corps remains.', '保留保守的非洲军官团。', 'Authority -0.5/month; army loyalty -0.05/month.', '共和国权威-0.5/月；军官忠诚度-0.05/月。', { monthlyModifiers: [{ kind: 'stat', target: 'republicanAuthority', delta: -0.5 }, { kind: 'stat', target: 'armyLoyalty', delta: -0.05 }] }),
      level(1, 'Azaña Military Reforms', '阿萨尼亚军事改革', 'Redundant officers are dismissed.', '裁撤冗余军官。', 'Authority +0.5/month; army loyalty -0.1/month.', '共和国权威+0.5/月；军官忠诚度-0.1/月。', { monthlyModifiers: [{ kind: 'stat', target: 'republicanAuthority', delta: 0.5 }, { kind: 'stat', target: 'armyLoyalty', delta: -0.1 }] }),
      level(2, 'Republican Armed Forces Reform', '共和国武装改革', 'A high-risk republican reorganization.', '高风险的共和国军队重组。', 'Authority +1/month; army loyalty +0.1/month.', '共和国权威+1/月；军官忠诚度+0.1/月。', { monthlyModifiers: [{ kind: 'stat', target: 'republicanAuthority', delta: 1 }, { kind: 'stat', target: 'armyLoyalty', delta: 0.1 }] }),
      level(3, "People's Republican Army", '共和国人民军', 'A later military reorganization route.', '后续军队重组路线。', 'No monthly effects.', '无月度效果。'),
      level(4, 'Militia Column System', '民兵纵队体系', 'A representative militia route.', '代表制民兵路线。', 'No monthly effects.', '无月度效果。'),
    ],
  },
  {
    id: 'militia_legality_law', category: 'security', name: text('Militia Legality Law', '民兵合法性法'), levels: [
      level(0, 'Paramilitaries Illegal', '准军事组织非法', 'Paramilitary groups are officially banned.', '官方禁止准军事组织。', 'No monthly effects.', '无月度效果。'),
      level(1, 'Tolerate Local Militias', '默许地方民兵', 'Local party militias are tolerated.', '默许地方党派民兵。', 'No monthly effects.', '无月度效果。'),
      level(2, 'Armed Unions Decree', '武装工会法令', 'Unions may be armed during the crisis.', '危机期间允许工会武装。', 'No monthly effects.', '无月度效果。'),
      level(3, 'Rearguard Militia Integration', '后方民兵治安统合', 'Militias take over rear security checkpoints.', '民兵接管后方治安检查站。', 'No monthly effects.', '无月度效果。'),
      level(4, 'Anti-Fascist Militia Committee', '反法西斯民兵委员会', 'A syndicalist parallel security authority.', '工团主义平行治安机构。', 'No monthly effects.', '无月度效果。'),
    ],
  },
];

const POLICY_STANCE_SCORES: PolicyStanceMatrix = {
  CNT_FAI: {
    max_hours_law: [-10, 2, 4, 8, 10],
    min_wage: [-10, 1, 4, 7, 8],
    workplace_safety: [-10, 2, 4, 8, 10],
    union_status: [-10, 2, -4, 8, 10],
    land_law: [-10, 0, 6, 10],
    political_rights: [-10, -8, -6, -4],
    womens_rights: [-6, 3, 7, 9, 10],
    religion_policy: [-10, 2, 8, 5],
    education_institutions: [-8, -3, 8, 10],
    language_policy: [-4, 0, 4, 6, 9],
    public_order_law: [-8, -7, -10, 5, 10],
    security_corps_law: [-10, -8, -2, 3, 10],
    army_reform_law: [-8, -6, -2, -4, 10],
    militia_legality_law: [-10, -2, 7, 2, 10],
  },
  POUM: {
    max_hours_law: [-10, 2, 5, 9, 10],
    min_wage: [-10, 2, 5, 9, 10],
    workplace_safety: [-10, 2, 5, 9, 10],
    union_status: [-10, 1, 2, 8, 9],
    land_law: [-10, 1, 7, 10],
    political_rights: [-10, -1, 5, 8],
    womens_rights: [-8, 4, 8, 10, 10],
    religion_policy: [-9, 1, 8, 6],
    education_institutions: [-8, -1, 8, 9],
    language_policy: [-3, 1, 4, 6, 2],
    public_order_law: [-8, -5, -7, 6, 8],
    security_corps_law: [-8, -5, 2, 6, 7],
    army_reform_law: [-6, -2, 3, 8, 5],
    militia_legality_law: [-9, -2, 6, 7, 8],
  },
  PCE: {
    max_hours_law: [-10, 1, 4, 8, 6],
    min_wage: [-10, 1, 5, 9, 7],
    workplace_safety: [-9, 2, 5, 8, 7],
    union_status: [-10, 1, 3, 8, 6],
    land_law: [-10, 1, 9, 7],
    political_rights: [-10, 0, 6, 9],
    womens_rights: [-7, 4, 8, 6, 9],
    religion_policy: [-9, 1, 9, 7],
    education_institutions: [-7, 0, 7, 9],
    language_policy: [-2, 1, 4, 5, -4],
    public_order_law: [-6, -2, 0, 7, 4],
    security_corps_law: [-8, -1, 6, 9, 2],
    army_reform_law: [-5, 1, 6, 10, 1],
    militia_legality_law: [-9, -3, 4, 9, 2],
  },
  PSOE: {
    max_hours_law: [-9, 2, 5, 9, 5],
    min_wage: [-9, 2, 6, 9, 6],
    workplace_safety: [-9, 2, 6, 9, 7],
    union_status: [-9, 3, 8, 9, 4],
    land_law: [-9, 3, 8, 3],
    political_rights: [-10, 2, 7, 10],
    womens_rights: [-7, 5, 8, 4, 9],
    religion_policy: [-8, 3, 9, 1],
    education_institutions: [-7, 3, 8, 9],
    language_policy: [-2, 3, 6, 6, -3],
    public_order_law: [-5, 1, 2, 8, 0],
    security_corps_law: [-6, 2, 7, 8, -1],
    army_reform_law: [-3, 4, 8, 7, 0],
    militia_legality_law: [-7, 2, 6, 7, 0],
  },
  PS: {
    max_hours_law: [-10, 3, 6, 9, 8],
    min_wage: [-9, 2, 5, 8, 7],
    workplace_safety: [-10, 3, 6, 9, 9],
    union_status: [-10, 4, 1, 9, 8],
    land_law: [-9, 2, 6, 7],
    political_rights: [-9, 2, 6, 8],
    womens_rights: [-7, 4, 7, 9, 10],
    religion_policy: [-8, 3, 8, 4],
    education_institutions: [-7, 2, 8, 9],
    language_policy: [-2, 2, 5, 6, 2],
    public_order_law: [-7, -3, -5, 7, 6],
    security_corps_law: [-8, -4, 3, 6, 8],
    army_reform_law: [-5, -1, 4, 5, 8],
    militia_legality_law: [-9, 0, 7, 5, 9],
  },
  ERC: {
    max_hours_law: [-8, 3, 6, 8, 4],
    min_wage: [-8, 2, 6, 8, 4],
    workplace_safety: [-8, 3, 6, 8, 6],
    union_status: [-8, 4, 7, 7, 1],
    land_law: [-8, 3, 7, 2],
    political_rights: [-9, 3, 8, 10],
    womens_rights: [-6, 6, 9, 6, 10],
    religion_policy: [-8, 4, 9, 1],
    education_institutions: [-7, 3, 8, 9],
    language_policy: [-10, 2, 10, 9, 2],
    public_order_law: [-5, 1, 2, 9, 2],
    security_corps_law: [-4, 3, 7, 6, 0],
    army_reform_law: [-2, 5, 7, 5, -1],
    militia_legality_law: [-6, 3, 6, 5, 2],
  },
  IR: {
    max_hours_law: [-7, 2, 5, 7, 1],
    min_wage: [-7, 2, 5, 7, 1],
    workplace_safety: [-7, 3, 6, 8, 3],
    union_status: [-7, 4, 7, 6, -2],
    land_law: [-8, 4, 8, -2],
    political_rights: [-9, 4, 8, 10],
    womens_rights: [-6, 7, 9, 3, 9],
    religion_policy: [-9, 5, 10, 0],
    education_institutions: [-8, 5, 9, 10],
    language_policy: [1, 3, 5, 5, -5],
    public_order_law: [-4, 3, 5, 10, -2],
    security_corps_law: [-3, 5, 9, 6, -3],
    army_reform_law: [-2, 8, 8, 4, -4],
    militia_legality_law: [-5, 4, 4, 2, -5],
  },
  UR: {
    max_hours_law: [-5, 3, 5, 5, -2],
    min_wage: [-5, 2, 5, 5, -2],
    workplace_safety: [-5, 3, 6, 6, 1],
    union_status: [-5, 4, 7, 5, -4],
    land_law: [-6, 4, 7, -4],
    political_rights: [-8, 4, 7, 9],
    womens_rights: [-4, 7, 8, 0, 6],
    religion_policy: [-6, 6, 8, -3],
    education_institutions: [-5, 6, 8, 8],
    language_policy: [2, 3, 4, 3, -6],
    public_order_law: [-3, 5, 7, 8, -3],
    security_corps_law: [-2, 6, 8, 5, -4],
    army_reform_law: [0, 8, 7, 3, -5],
    militia_legality_law: [-3, 5, 2, 0, -6],
  },
  PNV: {
    max_hours_law: [-5, 3, 5, 4, -3],
    min_wage: [-4, 2, 4, 3, -4],
    workplace_safety: [-5, 4, 6, 6, 1],
    union_status: [-4, 5, 7, 4, -5],
    land_law: [-5, 5, 6, -5],
    political_rights: [-6, 4, 7, 8],
    womens_rights: [6, 1, -8, -10, -3],
    religion_policy: [6, 10, 3, -10],
    education_institutions: [7, 8, 1, -4],
    language_policy: [-10, 2, 10, 9, -5],
    public_order_law: [-2, 6, 8, 7, -5],
    security_corps_law: [1, 7, 7, 4, -5],
    army_reform_law: [2, 6, 5, 1, -6],
    militia_legality_law: [-1, 5, 1, -1, -6],
  },
  PRR: {
    max_hours_law: [-3, 4, 5, 2, -5],
    min_wage: [-3, 3, 4, 1, -6],
    workplace_safety: [-3, 4, 5, 3, -4],
    union_status: [-4, 4, 6, 1, -7],
    land_law: [-5, 4, 3, -8],
    political_rights: [-6, 6, 7, 7],
    womens_rights: [-1, 6, 5, -5, 2],
    religion_policy: [-4, 7, 5, -7],
    education_institutions: [-3, 7, 5, 3],
    language_policy: [6, 4, -1, -4, -9],
    public_order_law: [0, 7, 9, 5, -7],
    security_corps_law: [2, 8, 8, 4, -7],
    army_reform_law: [4, 8, 6, 1, -8],
    militia_legality_law: [3, 6, -2, -5, -9],
  },
  DLR: {
    max_hours_law: [-1, 4, 3, 0, -6],
    min_wage: [0, 3, 2, -2, -7],
    workplace_safety: [-1, 4, 4, 1, -5],
    union_status: [-1, 4, 5, -1, -8],
    land_law: [-1, 3, 0, -9],
    political_rights: [-3, 6, 6, 5],
    womens_rights: [3, 5, 0, -8, -4],
    religion_policy: [3, 8, 1, -9],
    education_institutions: [3, 8, 2, -3],
    language_policy: [7, 4, -2, -5, -10],
    public_order_law: [2, 8, 9, 5, -8],
    security_corps_law: [4, 9, 8, 3, -8],
    army_reform_law: [6, 9, 5, 0, -9],
    militia_legality_law: [5, 5, -3, -6, -10],
  },
  AP: {
    max_hours_law: [5, 3, 0, -5, -9],
    min_wage: [6, 3, 0, -5, -9],
    workplace_safety: [4, 4, 1, -4, -8],
    union_status: [7, 3, 1, -5, -10],
    land_law: [10, 5, -6, -10],
    political_rights: [-1, 5, 4, 2],
    womens_rights: [9, 2, -9, -10, -8],
    religion_policy: [10, 5, -7, -10],
    education_institutions: [10, 7, -5, -8],
    language_policy: [10, 5, -5, -8, -10],
    public_order_law: [6, 8, 10, 5, -8],
    security_corps_law: [10, 8, 6, 2, -10],
    army_reform_law: [10, 7, 3, -5, -10],
    militia_legality_law: [10, 5, -5, -8, -10],
  },
  RE: {
    max_hours_law: [7, 3, -2, -7, -10],
    min_wage: [8, 3, -3, -8, -10],
    workplace_safety: [6, 3, -2, -7, -10],
    union_status: [9, 2, -3, -8, -10],
    land_law: [10, 4, -9, -10],
    political_rights: [5, 1, -4, -8],
    womens_rights: [10, 0, -10, -10, -10],
    religion_policy: [10, 4, -8, -10],
    education_institutions: [10, 7, -7, -9],
    language_policy: [10, 5, -7, -9, -10],
    public_order_law: [9, 7, 8, 2, -10],
    security_corps_law: [10, 9, 7, 3, -10],
    army_reform_law: [10, 8, 4, -7, -10],
    militia_legality_law: [10, 6, -6, -9, -10],
  },
  CT: {
    max_hours_law: [7, 4, 0, -6, -9],
    min_wage: [7, 4, 0, -6, -9],
    workplace_safety: [6, 4, 1, -5, -8],
    union_status: [8, 4, 2, -5, -9],
    land_law: [10, 6, -7, -10],
    political_rights: [6, 1, -4, -8],
    womens_rights: [10, -4, -10, -10, -10],
    religion_policy: [10, 2, -9, -10],
    education_institutions: [10, 8, -8, -10],
    language_policy: [5, 6, 2, 0, -10],
    public_order_law: [8, 7, 9, 3, -9],
    security_corps_law: [10, 8, 7, 3, -9],
    army_reform_law: [10, 8, 5, -6, -10],
    militia_legality_law: [8, 7, -5, -8, -9],
  },
  FE: {
    max_hours_law: [4, 6, 4, 0, -7],
    min_wage: [3, 6, 5, 1, -6],
    workplace_safety: [3, 6, 5, 1, -6],
    union_status: [7, 1, -2, -8, -10],
    land_law: [4, 6, 1, -9],
    political_rights: [10, -1, -7, -10],
    womens_rights: [9, -2, -9, -10, -8],
    religion_policy: [7, 6, -3, -8],
    education_institutions: [7, 8, -2, -6],
    language_policy: [10, 6, -8, -10, -10],
    public_order_law: [8, 6, 10, 5, -10],
    security_corps_law: [8, 8, 9, 7, -9],
    army_reform_law: [9, 8, 8, 3, -9],
    militia_legality_law: [5, 8, 2, -4, -8],
  },
};

export const POLICY_STANCE_PREFERENCES: PolicyStanceMatrix = POLICY_STANCE_SCORES;

export const POLICY_DEFINITIONS: readonly PolicyDefinition[] = BASE_POLICY_DEFINITIONS.map(definition => ({
  ...definition,
  levels: definition.levels.map(levelDefinition => ({
    ...levelDefinition,
    stanceChanges: Object.fromEntries(
      (Object.keys(POLICY_STANCE_SCORES) as PoliticalActor[]).map(actor => [
        actor,
        POLICY_STANCE_SCORES[actor][definition.id][levelDefinition.level],
      ]),
    ) as Partial<Record<PoliticalActor, number>>,
  })),
}));

export const POLICY_DEFINITION_BY_ID = Object.fromEntries(
  POLICY_DEFINITIONS.map(definition => [definition.id, definition]),
) as Record<LawId, PolicyDefinition>;

export const getPolicyDefinition = (policyId: LawId): PolicyDefinition => POLICY_DEFINITION_BY_ID[policyId];

export const getPolicyLevelDefinition = (policyId: LawId, level: number): PolicyLevelDefinition | undefined =>
  getPolicyDefinition(policyId).levels.find(policyLevel => policyLevel.level === level);

/** Returns the player-facing monthly effect lines, including state-dependent details. */
export const getPolicyEffectLines = (
  policyId: LawId,
  level: number,
  state: GameState,
  isZh: boolean,
): string[] => {
  const levelDefinition = getPolicyLevelDefinition(policyId, level);
  if (!levelDefinition) return [];

  if (policyId === 'education_institutions' && level === 2) {
    const ateneosLevel = state.ateneos_established;
    const budgetCost = levelDefinition.cost?.monthlyBudget ?? 0;
    const classSupportValue = (targetClass: SocialClass) => (levelDefinition.monthlyModifiers ?? [])
      .filter((modifier): modifier is Extract<PolicyModifier, { kind: 'classSupport' }> => modifier.kind === 'classSupport' && modifier.targetClass === targetClass)
      .reduce((sum, modifier) => sum + modifier.delta * ateneosLevel, 0)
      .toFixed(2);
    const values = {
      workers: classSupportValue('Obreros'),
      intellectuals: classSupportValue('Intelectuales'),
      braceros: classSupportValue('Braceros'),
    };
    if (ateneosLevel <= 0) {
      return isZh
        ? [`每月预算支出：+${budgetCost.toFixed(2)}M`, '无阶层支持度影响（需先建立现代学校）']
        : [`Monthly budget expenditure: +${budgetCost.toFixed(2)}M`, 'No social class support effects until Ateneos are established'];
    }
    return isZh
      ? [`每月预算支出：+${budgetCost.toFixed(2)}M`, `产业工人对CNT-FAI支持度 月度增加 +${values.workers}`, `知识分子对CNT-FAI支持度 月度增加 +${values.intellectuals}`, `雇农对CNT-FAI支持度 月度增加 +${values.braceros}`]
      : [`Monthly budget expenditure: +${budgetCost.toFixed(2)}M`, `Workers (Obreros) support for CNT-FAI monthly increase: +${values.workers}`, `Intellectuals (Intelectuales) support for CNT-FAI monthly increase: +${values.intellectuals}`, `Peasants (Braceros) support for CNT-FAI monthly increase: +${values.braceros}`];
  }

  if (policyId === 'union_status' && level === 2) {
    const fervorDelta = (levelDefinition.monthlyModifiers ?? [])
      .find(modifier => modifier.kind === 'stat' && modifier.target === 'revolutionaryFervor')?.delta ?? 0;
    const effects = isZh
      ? [`革命狂热：每月 ${fervorDelta > 0 ? '+' : ''}${fervorDelta}`]
      : [`Monthly Revolutionary Fervor: ${fervorDelta > 0 ? '+' : ''}${fervorDelta}`];
    if (state.domesticPolicy.mixed_jury_cnt_opposed) {
      const transferDelta = (levelDefinition.monthlyModifiers ?? [])
        .find(modifier => modifier.kind === 'classSupport' && modifier.targetForce === 'PSOE')?.delta ?? 0;
      effects.push(isZh
        ? `遭到 CNT 抵制：每月将产业工人支持度转移 ${formatRatio(transferDelta)} 至 PSOE`
        : `CNT Opposed: Monthly shifts ${formatRatio(transferDelta)} worker support to PSOE`);
    }
    return effects;
  }

  if (policyId === 'land_law' && level === 1) {
    const isPaused = state.budget <= 0;
    const progressDelta = (levelDefinition.monthlyModifiers ?? [])
      .find(modifier => modifier.kind === 'landProgress')?.delta ?? 0;
    const compensationCost = levelDefinition.cost?.monthlyBudget ?? 0;
    return isZh
      ? [`每月土地改革日志进度+${progressDelta}`, isPaused ? '⚠️ 经济赤字（国库预算 ≤ 0）：法案已暂停，补偿金暂不支付，进度暂停' : `持续运行中：每月支出 ${compensationCost.toFixed(2)}M 固定补偿金`]
      : [`Monthly Land Reform journal progress +${progressDelta}`, isPaused ? '⚠️ Deficit (Budget <= 0): Bill paused, compensation stopped, progress paused' : `Active: ${compensationCost.toFixed(2)}M fixed monthly compensation cost`];
  }

  return [isZh ? levelDefinition.effect.zh : levelDefinition.effect.en];
};
