import {
  GameState,
  LawId,
  LawStance,
  LawStanceModifier,
  LegalStanceParty,
  PoliticalActor,
  Party,
} from './types';

export const LAW_STANCE_SCORE: Record<LawStance, number> = {
  strongly_support: 8,
  support: 4,
  neutral: 0,
  oppose: -4,
  strongly_oppose: -8,
};

export const LEGAL_STANCE_PARTIES: LegalStanceParty[] = [
  'POUM', 'PCE', 'PSOE', 'PS', 'ERC', 'IR', 'UR', 'PNV',
  'PRR', 'DLR', 'AP', 'RE', 'CT', 'FE',
];

export type LawCategory = 'economy' | 'society' | 'security';

export interface LawDefinition {
  id: LawId;
  category: LawCategory;
  name: { en: string; zh: string };
  levels: { level: number; name: { en: string; zh: string } }[];
}

const levelNames = (names: string[], namesEn: string[] = names) => names.map((zh, level) => ({
  level,
  name: { zh, en: namesEn[level] || `Level ${level}` },
}));

export const LAW_DEFINITIONS: LawDefinition[] = [
  {
    id: 'max_hours_law', category: 'economy', name: { en: 'Maximum Hours', zh: '最高工时' },
    levels: levelNames(['无限制', '非严格40小时工作制', '城市40小时工作制', '严格40小时工作制', '36小时工作制'], ['No Limits', 'Non-strict 40-hour Workweek', 'Urban 40-hour Workweek', 'Strict 40-hour Workweek', '36-hour Workweek']),
  },
  {
    id: 'min_wage', category: 'economy', name: { en: 'Minimum Wage', zh: '最低工资' },
    levels: levelNames(['无', '最低限度', '基本', '生活工资', '优厚'], ['None', 'Minimal', 'Basic', 'Living Wage', 'Generous']),
  },
  {
    id: 'workplace_safety', category: 'economy', name: { en: 'Workplace Safety', zh: '工作环境安全' },
    levels: levelNames(['无安全保障', '基础安全', '中等安全', '严格安全', '全面安全'], ['None', 'Basic', 'Moderate', 'Strict', 'Comprehensive']),
  },
  {
    id: 'union_status', category: 'economy', name: { en: 'Union Status', zh: '工会地位' },
    levels: levelNames(['工会非法', '结社自由', '混合陪审团', '集体谈判', '委员会控制'], ['Union Outlawed', 'Freedom of Association', 'Mixed Jury', 'Collective Bargaining', 'Committee Control']),
  },
  {
    id: 'land_law', category: 'economy', name: { en: 'Land Law', zh: '土地法' },
    levels: levelNames(['无土地改革', '土地改革法', '强制土地没收', '革命集体化'], ['No Land Reform', 'Land Reform Act', 'Compulsory Expropriation', 'Revolutionary Collectivization']),
  },
  {
    id: 'political_rights', category: 'society', name: { en: 'Political Rights', zh: '政治权利' },
    levels: levelNames(['无选举', '男性普选权', '有限女性选举权', '完全普选'], ['No Elections', 'Male Suffrage', 'Limited Women Suffrage', 'Universal Suffrage']),
  },
  {
    id: 'womens_rights', category: 'society', name: { en: "Women's Rights", zh: '女性权利' },
    levels: levelNames(['传统妇女地位', '民事婚姻合法化', '离婚合法化', '女性堕胎权', '全面性别平等'], ['Traditional Status of Women', 'Civil Marriage Legalized', 'Divorce Legalized', 'Abortion Rights for Women', 'Full Gender Equality']),
  },
  {
    id: 'religion_policy', category: 'society', name: { en: 'Religion Policy', zh: '宗教政策' },
    levels: levelNames(['国教', '信仰自由', '世俗社会', '国家无神论'], ['State Religion', 'Freedom of Belief', 'Secular Society', 'State Atheism']),
  },
  {
    id: 'education_institutions', category: 'society', name: { en: 'Education System', zh: '教育制度' },
    levels: levelNames(['教会学校', '传统教育', '理性教育', '现代教育'], ['Church Schools', 'Traditional Education', 'Rational Education', 'Modern Education']),
  },
  {
    id: 'language_policy', category: 'society', name: { en: 'Language Policy', zh: '语言政策' },
    levels: levelNames(['强制卡斯蒂利亚语', '有限承认', '自治双轨', '多语制度', '世界语'], ['Castilian Only', 'Limited Recognition', 'Dual Track', 'Multilingualism', 'Esperanto']),
  },
  {
    id: 'public_order_law', category: 'security', name: { en: 'Public Order Law', zh: '公共秩序法' },
    levels: levelNames(['管辖权法', '公共秩序法', '共和国防卫法', '宪政与集会保障法案', '公社防卫委员会'], ['Jurisdiction Law', 'Public Order Law', 'Defense of the Republic Act', 'Constitutional Guarantee Act', 'Commune Defense Committee']),
  },
  {
    id: 'security_corps_law', category: 'security', name: { en: 'Security Corps Law', zh: '治安机关法' },
    levels: levelNames(['国民警卫队主导', '组建突击卫队', '治安部队忠诚审查', '改组共和国国民警卫队', '工人巡逻队'], ['Guardia Civil Dominance', 'Assault Guards Formation', 'Security Forces Loyalty Purge', 'Reorganize Republican Guard', 'Worker Patrols']),
  },
  {
    id: 'army_reform_law', category: 'security', name: { en: 'Army Reform Law', zh: '军队改革法' },
    levels: levelNames(['维持旧军官团', '阿萨尼亚军事改革', '共和国武装改革', '共和国人民军', '民兵纵队体系'], ['Old Officer Corps', 'Azana Military Reforms', 'Republican Armed Forces Reform', "People's Republican Army", 'Militia Column System']),
  },
  {
    id: 'militia_legality_law', category: 'security', name: { en: 'Militia Legality Law', zh: '民兵合法性法' },
    levels: levelNames(['准军事组织非法', '默许地方民兵', '武装工会法令', '后方民兵治安统合', '反法西斯民兵委员会'], ['Paramilitaries Illegal', 'Tolerate Local Militias', 'Armed Unions Decree', 'Rearguard Militia Integration', 'Anti-fascist Militia Committee']),
  },
];

const LAW_BY_ID = Object.fromEntries(LAW_DEFINITIONS.map(def => [def.id, def])) as Record<LawId, LawDefinition>;
export const LAW_LEVEL_LIMITS = Object.fromEntries(
  LAW_DEFINITIONS.map(definition => [definition.id, definition.levels.length - 1])
) as Record<LawId, number>;

export const clampLawLevel = (lawId: LawId, value: number) => {
  const rounded = Number.isFinite(value) ? Math.round(value) : 0;
  return Math.max(0, Math.min(LAW_LEVEL_LIMITS[lawId], rounded));
};

export const normalizeDomesticPolicyLawLevels = (
  domesticPolicy: GameState['domesticPolicy']
): GameState['domesticPolicy'] => {
  const normalized = { ...domesticPolicy };
  for (const definition of LAW_DEFINITIONS) {
    normalized[definition.id] = clampLawLevel(definition.id, Number(domesticPolicy[definition.id] || 0));
  }
  return normalized;
};

const clampPreference = (score: number) => Math.max(-10, Math.min(10, Math.round(score)));

type PartyLawPreferenceMatrix = Record<PoliticalActor, Record<LawId, number[]>>;

// Each actor has an explicit programme. Similar parties deliberately retain
// separate rows so later events and congresses can move them independently.
export const BASELINE_LAW_PREFERENCES: PartyLawPreferenceMatrix = {
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

const scoreToStance = (score: number): LawStance => {
  const clamped = clampPreference(score);
  if (clamped >= 7) return 'strongly_support';
  if (clamped >= 2) return 'support';
  if (clamped <= -7) return 'strongly_oppose';
  if (clamped <= -2) return 'oppose';
  return 'neutral';
};

const stanceToScore = (stance: LawStance) => LAW_STANCE_SCORE[stance];

export const isCNTParliamentaryActor = (state: GameState, cortes?: Record<Party, number>) => {
  const prrevsSeats = cortes?.PRRevS || state.cortes?.PRRevS || 0;
  return state.cntStance === 'govern' || (state.isPRRevSFormed && prrevsSeats > 0);
};

export const isLegalStancePartyPresent = (state: GameState, party: LegalStanceParty) => {
  // These identities are created by explicit historical events.  The
  // remaining legal parties exist from the start of the Republic.
  if (party === 'POUM') return Boolean(state.poum_founded);
  if (party === 'PS') return Boolean(state.ps_founded);
  if (party === 'FE') return Boolean(state.fe_founded);
  return true;
};

export const getLegalStanceActors = (state: GameState, cortes?: Record<Party, number>): PoliticalActor[] => {
  // CNT is always selectable as a political actor, even while it remains
  // outside parliament.  Its seat weight is still resolved separately.
  return [
    ...LEGAL_STANCE_PARTIES.filter(party => isLegalStancePartyPresent(state, party)),
    'CNT_FAI',
  ];
};

export const getLegalActorSeats = (state: GameState, actor: PoliticalActor, cortes?: Record<Party, number>) => {
  if (actor === 'CNT_FAI') return cortes?.PRRevS || state.cortes?.PRRevS || 0;
  return cortes?.[actor] || state.cortes?.[actor] || 0;
};

export const getLawDefinition = (lawId: LawId) => LAW_BY_ID[lawId];

export const getBaselineLawStanceScore = (actor: PoliticalActor, lawId: LawId, targetLevel: number) => {
  const definition = LAW_BY_ID[lawId];
  const maxLevel = definition.levels.length - 1;
  const values = BASELINE_LAW_PREFERENCES[actor][lawId];
  const level = clampLawLevel(lawId, targetLevel);
  return clampPreference(values[Math.max(0, Math.min(maxLevel, level))] ?? 0);
};

const isModifierActive = (state: GameState, modifier: LawStanceModifier) => {
  if (modifier.expiresAtMonth === undefined) return true;
  const currentMonth = state.year * 12 + state.month;
  return currentMonth <= modifier.expiresAtMonth;
};

export const getEffectiveLawStanceScore = (state: GameState, actor: PoliticalActor, lawId: LawId, targetLevel: number) => {
  let score = getBaselineLawStanceScore(actor, lawId, targetLevel);
  const modifiers = (state.lawStanceModifiers || []).filter(modifier =>
    modifier.actor === actor &&
    modifier.lawId === lawId &&
    isModifierActive(state, modifier) &&
    (modifier.targetLevel === undefined || modifier.targetLevel === 'all' || modifier.targetLevel === targetLevel)
  );

  const overrides = modifiers.filter(modifier => modifier.override !== undefined);
  if (overrides.length > 0) score = stanceToScore(overrides[overrides.length - 1].override!);
  score += modifiers.reduce((sum, modifier) => sum + (modifier.delta || 0), 0);
  return clampPreference(score);
};

export const getEffectiveLawStance = (state: GameState, actor: PoliticalActor, lawId: LawId, targetLevel: number): LawStance => {
  return scoreToStance(getEffectiveLawStanceScore(state, actor, lawId, targetLevel));
};

/** Return a partial state suitable for a card/event option effect. */
export const applyLawStanceModifier = (state: GameState, modifier: LawStanceModifier): Partial<GameState> => ({
  lawStanceModifiers: [...(state.lawStanceModifiers || []), modifier],
});

// Alias used by future card/event effects.  Keeping one implementation avoids
// direct nested mutation of GameState in individual content files.
export const adjustLawStance = applyLawStanceModifier;

export interface PartyLawSatisfaction {
  overall: number;
  byCategory: Record<LawCategory, number>;
  contributions: Record<LawId, number>;
}

export const getPartyLawSatisfaction = (state: GameState, actor: PoliticalActor): PartyLawSatisfaction => {
  const categoryTotals: Record<LawCategory, { weighted: number; weight: number }> = {
    economy: { weighted: 0, weight: 0 },
    society: { weighted: 0, weight: 0 },
    security: { weighted: 0, weight: 0 },
  };
  const contributions = {} as Record<LawId, number>;

  for (const definition of LAW_DEFINITIONS) {
    const currentLevel = Number(state.domesticPolicy[definition.id] || 0);
    const level = Math.max(0, Math.min(definition.levels.length - 1, currentLevel));
    const score = getEffectiveLawStanceScore(state, actor, definition.id, level);
    // Equal weight is the first-pass rule.  Keeping the calculation here
    // makes future per-law importance weights easy to add without changing UI.
    const contribution = Math.round((score / 10) * 100);
    contributions[definition.id] = contribution;
    categoryTotals[definition.category].weighted += contribution;
    categoryTotals[definition.category].weight += 1;
  }

  const byCategory = {
    economy: Math.round(categoryTotals.economy.weighted / categoryTotals.economy.weight),
    society: Math.round(categoryTotals.society.weighted / categoryTotals.society.weight),
    security: Math.round(categoryTotals.security.weighted / categoryTotals.security.weight),
  };
  const totalWeighted = Object.values(categoryTotals).reduce((sum, item) => sum + item.weighted, 0);
  const totalWeight = Object.values(categoryTotals).reduce((sum, item) => sum + item.weight, 0);
  return { overall: Math.round(totalWeighted / totalWeight), byCategory, contributions };
};

export const getParliamentWeightedLawSatisfaction = (state: GameState, cortes?: Record<Party, number>) => {
  const actors = getLegalStanceActors(state, cortes);
  const weighted = actors.reduce((sum, actor) => sum + getPartyLawSatisfaction(state, actor).overall * getLegalActorSeats(state, actor, cortes), 0);
  const seats = actors.reduce((sum, actor) => sum + getLegalActorSeats(state, actor, cortes), 0);
  return seats > 0 ? Math.round(weighted / seats) : 0;
};
