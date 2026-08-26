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
  strongly_support: 2,
  support: 1,
  neutral: 0,
  oppose: -1,
  strongly_oppose: -2,
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
const clampScore = (score: number) => Math.max(-2, Math.min(2, Math.round(score)));

const familyOf = (actor: PoliticalActor): 'revolutionary' | 'socialist' | 'regional_left' | 'regional_center' | 'republican' | 'conservative' | 'traditionalist' => {
  if (actor === 'CNT_FAI' || actor === 'POUM' || actor === 'PCE') return 'revolutionary';
  if (actor === 'PSOE' || actor === 'PS') return 'socialist';
  if (actor === 'ERC') return 'regional_left';
  if (actor === 'PNV') return 'regional_center';
  if (actor === 'IR' || actor === 'UR') return 'republican';
  if (actor === 'PRR' || actor === 'DLR') return 'republican';
  return actor === 'AP' ? 'conservative' : 'traditionalist';
};

const curve = (family: ReturnType<typeof familyOf>, lawId: LawId, maxLevel: number): number[] => {
  const revolutionary = family === 'revolutionary';
  const socialist = family === 'socialist';
  const regionalLeft = family === 'regional_left';
  const regional = regionalLeft || family === 'regional_center';
  const republican = family === 'republican';
  const right = family === 'conservative' || family === 'traditionalist';
  const levels = (values: number[]) => values.slice(0, maxLevel + 1);

  if (['max_hours_law', 'min_wage', 'workplace_safety'].includes(lawId)) {
    if (revolutionary) return levels([-2, 1, 1, 2, 2]);
    if (socialist || regionalLeft) return levels([-2, 1, 2, 2, 1]);
    if (regional || republican) return levels([-1, 0, 1, 1, 0]);
    return levels([2, 1, 0, -1, -2]);
  }

  if (lawId === 'union_status') {
    if (revolutionary) return levels([-2, 0, 1, 2, 2]);
    if (socialist || regionalLeft) return levels([-2, 1, 2, 2, 1]);
    if (regional || republican) return levels([-1, 0, 1, 1, -1]);
    return levels([2, 1, 0, -1, -2]);
  }

  if (lawId === 'land_law') {
    if (revolutionary) return levels([-2, 0, 1, 2]);
    if (socialist || regionalLeft) return levels([-2, 1, 1, 0]);
    if (regional || republican) return levels([-1, 0, 1, -1]);
    return levels([2, 1, 0, -2]);
  }

  if (lawId === 'political_rights') {
    if (revolutionary || socialist || regionalLeft || republican) return levels([-2, 1, 2, 2]);
    return levels([-1, 0, 1, 1]);
  }

  if (lawId === 'religion_policy') {
    if (revolutionary) return levels([-2, 1, 2, 2]);
    if (socialist || regionalLeft || republican) return levels([-2, 1, 2, 1]);
    if (regional) return levels([0, 1, 1, -1]);
    return levels([2, 1, -1, -2]);
  }

  if (lawId === 'education_institutions') {
    if (revolutionary) return levels([-2, 0, 1, 2]);
    if (socialist || regionalLeft || republican) return levels([-1, 1, 2, 1]);
    if (regional) return levels([1, 1, 0, -1]);
    return levels([2, 1, 0, -1]);
  }

  if (lawId === 'language_policy') {
    if (regionalLeft) return levels([-2, 1, 2, 2, 2]);
    if (family === 'regional_center') return levels([-2, 1, 2, 2, 1]);
    if (revolutionary) return levels([0, 0, 1, 1, 1]);
    if (socialist) return levels([0, 1, 1, 1, 0]);
    if (republican) return levels([1, 0, -1, -1, -2]);
    return levels([2, 1, 0, -1, -2]);
  }

  if (lawId === 'public_order_law') {
    if (revolutionary) return levels([2, 1, 0, -1, -1]);
    if (socialist || regionalLeft) return levels([1, 1, 0, 0, -1]);
    if (republican || regional) return levels([0, 1, 1, 1, 0]);
    return levels([-1, 0, 1, 2, 1]);
  }

  if (lawId === 'security_corps_law') {
    if (revolutionary) return levels([-2, -1, 1, 1, 2]);
    if (socialist || regionalLeft) return levels([-1, 1, 1, 1, 0]);
    if (republican || regional) return levels([0, 1, 1, 0, -1]);
    return levels([2, 1, 1, 0, -1]);
  }

  if (lawId === 'army_reform_law') {
    if (revolutionary) return levels([-1, 0, 1, 1, 2]);
    if (socialist || regionalLeft) return levels([0, 1, 1, 0, 1]);
    if (republican || regional) return levels([0, 1, 1, 0, -1]);
    return levels([1, 1, 0, -1, -2]);
  }

  // Militia legality.  CNT and the revolutionary parties support the
  // worker-controlled end of the scale; the conservative right prefers the
  // first levels and state monopolisation of force.
  if (revolutionary) return levels([-2, 0, 1, 1, 2]);
  if (socialist || regionalLeft) return levels([-1, 1, 1, 0, 1]);
  if (republican || regional) return levels([0, 1, 0, 0, -1]);
  return levels([2, 1, 0, -1, -2]);
};

const scoreToStance = (score: number): LawStance => {
  const clamped = clampScore(score);
  if (clamped === 2) return 'strongly_support';
  if (clamped === 1) return 'support';
  if (clamped === -1) return 'oppose';
  if (clamped === -2) return 'strongly_oppose';
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
  const values = curve(familyOf(actor), lawId, maxLevel);
  return clampScore(values[Math.max(0, Math.min(maxLevel, targetLevel))] ?? 0);
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
  return clampScore(score);
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
    const contribution = Math.round((score / 2) * 100);
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
