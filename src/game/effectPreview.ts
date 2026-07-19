import {
  EffectPreviewLine,
  Faction,
  GameEvent,
  GameState,
  Party,
  SocialClass
} from './types';
import { collectClassSupportAdjustments, collectFactionInfluenceAdjustments, getDissentMultiplier } from './utils';
import type { ClassPoliticalForce, ClassSupportAdjustment, FactionInfluenceAdjustment } from './utils';

type Labels = { label: string; labelZh: string };
type FieldConfig = Labels & { reverseTone?: boolean; suffix?: string; suffixZh?: string };

const POSITIVE_KEYS = new Set(['enabled', 'formed', 'completed', 'unlocked', 'established', 'secured', 'resolved', 'arrived']);

const TOP_LEVEL_FIELDS: Record<string, FieldConfig> = {
  actionsLeft: { label: 'AP', labelZh: '行动点' },
  resources: { label: 'Resources', labelZh: '资源' },
  armaments: { label: 'Armaments', labelZh: '军备' },
  dues: { label: 'Dues', labelZh: '会费' },
  budget: { label: 'Budget', labelZh: '预算' },
  gold_reserves: { label: 'Gold reserves', labelZh: '黄金储备' },
  foreign_exchange: { label: 'Foreign exchange', labelZh: '外汇' },
  public_debt: { label: 'Public debt', labelZh: '公共债务', reverseTone: true },
  military_spending: { label: 'Military spending', labelZh: '军事开支' },
  coalition_dissent: { label: 'Coalition dissent', labelZh: '执政联盟不满', reverseTone: true },
  coupProgress: { label: 'Coup progress', labelZh: '政变进度', reverseTone: true },
  economy_growth: { label: 'Economic growth', labelZh: '经济增长' },
  inflation_rate: { label: 'Inflation', labelZh: '通胀率', reverseTone: true },
  unemployment_rate: { label: 'Unemployment', labelZh: '失业率', reverseTone: true },
  workersAllianceProgress: { label: 'Workers Alliance progress', labelZh: '工人联盟进度' },
  cntVotingRate: { label: 'CNT voting rate', labelZh: 'CNT投票率' },
  prrevsConstructionLevel: { label: 'PRRevS construction level', labelZh: 'PRRevS建设等级' },
  prrevs_formed_months: { label: 'PRRevS formed months', labelZh: 'PRRevS成立月数' },
  ateneos_established: { label: 'Ateneos Libertarios', labelZh: '自由雅典学苑' },
  advisorActionTimer: { label: 'Advisor cooldown', labelZh: '顾问冷却', reverseTone: true },
  fundraising_timer: { label: 'Fundraising cooldown', labelZh: '筹款冷却', reverseTone: true },
  propaganda_timer: { label: 'Media cooldown', labelZh: '媒体冷却', reverseTone: true },
  mitin_popular_timer: { label: 'Popular Assembly cooldown', labelZh: '群众集会冷却', reverseTone: true },
  prrevs_campaign_timer: { label: 'PRRevS campaign cooldown', labelZh: 'PRRevS竞选冷却', reverseTone: true },
  organizations_timer: { label: 'Organizations cooldown', labelZh: '组织事务冷却', reverseTone: true },
  international_relations_timer: { label: 'International contacts cooldown', labelZh: '国际联系冷却', reverseTone: true },
  choose_enemies_timer: { label: 'Choosing enemies cooldown', labelZh: '选择敌人冷却', reverseTone: true },
  inter_party_relationships_timer: { label: 'Inter-party relations cooldown', labelZh: '党际关系冷却', reverseTone: true },
  military_policy_timer: { label: 'Military policy cooldown', labelZh: '军事政策冷却', reverseTone: true },
  agricultural_policy_timer: { label: 'Agricultural policy cooldown', labelZh: '农业政策冷却', reverseTone: true },
  labor_rights_timer: { label: 'Labor rights cooldown', labelZh: '劳工权利冷却', reverseTone: true },
  labor_affairs_timer: { label: 'Labor affairs cooldown', labelZh: '劳工事务冷却', reverseTone: true },
  fiscal_policy_timer: { label: 'Fiscal policy cooldown', labelZh: '财政政策冷却', reverseTone: true },
  internationalBrigades: { label: 'International Brigades', labelZh: '国际纵队' },
  militiaCombatPower: { label: 'Militia combat power', labelZh: '民兵战斗力' },
  tankResearchProgress: { label: 'Tank research progress', labelZh: '坦克研发进度' },
  aragonTimer: { label: 'Aragon cooldown', labelZh: '阿拉贡冷却', reverseTone: true },
  militiaReorgTimer: { label: 'Militia reorganization cooldown', labelZh: '民兵整编冷却', reverseTone: true },
  tankTimer: { label: 'Tank program cooldown', labelZh: '坦克项目冷却', reverseTone: true },
  covert_ops_france: { label: 'Covert operations in France', labelZh: '法国秘密行动' },
  covert_ops_portugal: { label: 'Covert operations in Portugal', labelZh: '葡萄牙秘密行动' },
  radio: { label: 'Radio network', labelZh: '广播网络' },
  cinema: { label: 'Cinema network', labelZh: '电影网络' },
  commercialized_propaganda: { label: 'Commercial propaganda', labelZh: '商业化宣传' },
  campaign_propaganda: { label: 'Campaign propaganda', labelZh: '动员宣传' },
  ideological_propaganda: { label: 'Ideological propaganda', labelZh: '意识形态宣传' },
  socialism: { label: 'Socialism', labelZh: '社会主义倾向' },
  nationalism: { label: 'Nationalism', labelZh: '民族主义倾向' },
  pacifism: { label: 'Pacifism', labelZh: '和平主义倾向' },
  democratization: { label: 'Democratization', labelZh: '民主化倾向' },
  pro_republic: { label: 'Pro-Republic sentiment', labelZh: '亲共和国倾向' },
  leverage: { label: 'Leverage', labelZh: '政治筹码' }
};

const BOOLEAN_FIELDS: Record<string, Labels> = {
  isPRRevSFormed: { label: 'PRRevS formed', labelZh: 'PRRevS成立' },
  fijl_established: { label: 'FIJL established', labelZh: 'FIJL成立' },
  mujeres_libres_established: { label: 'Mujeres Libres established', labelZh: '自由妇女组织成立' },
  internationalBrigadesFormed: { label: 'International Brigades formed', labelZh: '国际纵队成立' },
  tankResearchCompleted: { label: 'Tank research completed', labelZh: '坦克研发完成' },
  aragonCouncilExists: { label: 'Aragon Council exists', labelZh: '阿拉贡委员会存在' },
  hasArmoredCars: { label: 'Armored cars unlocked', labelZh: '装甲车辆解锁' },
  impeachPresidentAvailable: { label: 'Impeachment available', labelZh: '弹劾可用' },
  isPresidentImpeached: { label: 'President impeached', labelZh: '总统已被弹劾' },
  gibraltar_resolved: { label: 'Gibraltar resolved', labelZh: '直布罗陀问题已处理' },
  andorra_secured: { label: 'Andorra secured', labelZh: '安道尔通道已确保' },
  usa_total_embargo: { label: 'US total embargo', labelZh: '美国全面禁运' },
  latin_american_diaspora_mobilized: { label: 'Latin American diaspora mobilized', labelZh: '拉美侨民已动员' },
  educationSecularized: { label: 'Education secularized', labelZh: '教育世俗化' },
  womensRightsReformed: { label: 'Women rights reformed', labelZh: '妇女权利改革' },
  moscowGoldTransferred: { label: 'Moscow gold transferred', labelZh: '莫斯科黄金已转移' },
  pceInPower: { label: 'PCE in power', labelZh: 'PCE掌权' },
  pceAcceptsComintern: { label: 'PCE accepts Comintern', labelZh: 'PCE接受共产国际' },
  militaryDeckEnabled: { label: 'Military deck enabled', labelZh: '武装事务牌库启用' }
};

const STAT_LABELS: Record<keyof GameState['stats'], Labels & { reverseTone?: boolean }> = {
  armyLoyalty: { label: 'Army loyalty', labelZh: '军队忠诚' },
  tension: { label: 'Tension', labelZh: '紧张局势', reverseTone: true },
  workerControl: { label: 'Worker control', labelZh: '工人控制' },
  anarchistMilitia: { label: 'Anarchist militia', labelZh: '无政府主义民兵' },
  republicanAuthority: { label: 'Republican authority', labelZh: '共和国权威' },
  revolutionaryFervor: { label: 'Revolutionary fervor', labelZh: '革命热情' },
  bureaucratization: { label: 'Bureaucratization', labelZh: '官僚化', reverseTone: true }
};

const DOMESTIC_POLICY_LABELS: Record<keyof GameState['domesticPolicy'], Labels & { reverseTone?: boolean }> = {
  land_reform_progress: { label: 'Land reform progress', labelZh: '土地改革进度' },
  regional_autonomy_progress: { label: 'Regional autonomy progress', labelZh: '区域自治进度' },
  max_hours_law: { label: 'Maximum-hours law', labelZh: '最高工时法' },
  min_wage: { label: 'Minimum wage', labelZh: '最低工资' },
  workplace_safety: { label: 'Workplace safety', labelZh: '工作场所安全' },
  political_rights: { label: 'Political rights', labelZh: '政治权利' },
  religion_policy: { label: 'Religious policy', labelZh: '宗教政策' },
  education_institutions: { label: 'Education institutions', labelZh: '教育机构' },
  language_policy: { label: 'Language policy', labelZh: '语言政策' },
  union_status: { label: 'Union status', labelZh: '工会地位' },
  land_reform_law_enabled: { label: 'Land reform law enabled', labelZh: '土地改革法启用' },
  mixed_jury_cnt_opposed: { label: 'CNT opposes mixed juries', labelZh: 'CNT反对混合陪审团' }
};

const RELATION_LABELS: Record<keyof GameState['relations'], Labels> = {
  uk: { label: 'UK relations', labelZh: '英国关系' },
  usa: { label: 'USA relations', labelZh: '美国关系' },
  france: { label: 'France relations', labelZh: '法国关系' },
  germany: { label: 'Germany relations', labelZh: '德国关系' },
  italy: { label: 'Italy relations', labelZh: '意大利关系' },
  portugal: { label: 'Portugal relations', labelZh: '葡萄牙关系' },
  ussr: { label: 'USSR relations', labelZh: '苏联关系' },
  mexico: { label: 'Mexico relations', labelZh: '墨西哥关系' },
  internationalSocialists: { label: 'International socialist relations', labelZh: '国际社会主义者关系' },
  syndicalistParty: { label: 'Syndicalist Party relations', labelZh: '工团党关系' }
};

const FACTION_LABELS: Record<Faction, Labels> = {
  Treintistas: { label: 'Treintistas', labelZh: '三十人派' },
  Cenetistas: { label: 'Cenetistas', labelZh: '工团派' },
  Faistas: { label: 'FAIstas', labelZh: 'FAI派' },
  Puristas: { label: 'Puristas', labelZh: '纯粹派' },
  Jabalistas: { label: 'Jabalistas', labelZh: '哈巴利派' }
};

const CLASS_LABELS: Record<SocialClass, Labels> = {
  Obreros: { label: 'Obreros', labelZh: '工人' },
  Braceros: { label: 'Braceros', labelZh: '雇农' },
  Labradores: { label: 'Labradores', labelZh: '自耕农' },
  Latifundistas: { label: 'Latifundistas', labelZh: '大地主' },
  PequenaBurguesia: { label: 'Petite bourgeoisie', labelZh: '小资产阶级' },
  Intelectuales: { label: 'Intellectuals', labelZh: '知识分子' },
  Burguesia: { label: 'Bourgeoisie', labelZh: '资产阶级' },
  Clero: { label: 'Clergy', labelZh: '教会' }
};

const PARTY_LABELS: Record<'CNT_FAI' | Party, Labels> = {
  CNT_FAI: { label: 'CNT-FAI', labelZh: 'CNT-FAI' },
  POUM: { label: 'POUM', labelZh: 'POUM' },
  PCE: { label: 'PCE', labelZh: 'PCE' },
  PSOE: { label: 'PSOE', labelZh: 'PSOE' },
  PS: { label: 'Syndicalist Party', labelZh: '工团党' },
  ERC: { label: 'ERC', labelZh: 'ERC' },
  IR: { label: 'Republican Left', labelZh: '共和左翼' },
  UR: { label: 'Republican Union', labelZh: '共和联盟' },
  PNV: { label: 'PNV', labelZh: 'PNV' },
  PRR: { label: 'PRR', labelZh: '共和激进党' },
  DLR: { label: 'DLR', labelZh: '自由共和右翼' },
  AP: { label: 'Popular Action', labelZh: '人民行动党' },
  RE: { label: 'Spanish Renovation', labelZh: '西班牙革新党' },
  CT: { label: 'Traditionalist Communion', labelZh: '传统主义联盟' },
  FE: { label: 'Falange', labelZh: '长枪党' },
  Other: { label: 'Other parties', labelZh: '其他政党' },
  PRRevS: { label: 'PRRevS', labelZh: 'PRRevS' }
};

const CLASS_FORCES_TO_REPORT = new Set(['CNT_FAI', 'PRR', 'PCE', 'FE', 'POUM', 'PSOE', 'PS']);

export const formatSignedNumber = (value: number): string => {
  const normalized = Math.abs(value) < 0.005 ? 0 : Number(value.toFixed(2));
  const asText = normalized.toFixed(2).replace(/\.?0+$/, '');
  return normalized > 0 ? `+${asText}` : asText;
};

export const formatEffectPreviewLine = (line: EffectPreviewLine, isZh: boolean): string => {
  if (line.text || line.textZh) {
    return isZh ? line.textZh || line.text || '' : line.text || line.textZh || '';
  }

  const label = isZh ? line.labelZh || line.label || '' : line.label || line.labelZh || '';
  const suffix = isZh ? line.suffixZh || line.suffix || '' : line.suffix || line.suffixZh || '';
  const value = line.value === undefined ? '' : ` ${formatSignedNumber(line.value)}${suffix}`;
  return `${label}${value}`;
};

const toneFromValue = (value: number, reverseTone = false): EffectPreviewLine['tone'] => {
  if (Math.abs(value) < 0.005) return 'neutral';
  const positive = value > 0;
  return positive === !reverseTone ? 'positive' : 'negative';
};

export const effectLine = (
  label: string,
  labelZh: string,
  value: number,
  options: { reverseTone?: boolean; suffix?: string; suffixZh?: string } = {}
): EffectPreviewLine => ({
  label,
  labelZh,
  value,
  suffix: options.suffix,
  suffixZh: options.suffixZh,
  tone: toneFromValue(value, options.reverseTone)
});

export const textPreview = (
  text: string,
  textZh: string,
  tone: EffectPreviewLine['tone'] = 'neutral'
): EffectPreviewLine => ({
  text,
  textZh,
  tone
});

export const scaledDelta = (state: GameState, delta: number): number => delta * getDissentMultiplier(state.factions);

const resolveDelta = (state: GameState, delta: number, scaledByDissent?: boolean): number => (
  scaledByDissent ? scaledDelta(state, delta) : delta
);

export const resourcePreview = (delta: number): EffectPreviewLine => effectLine('Resources', '资源', delta);
export const armamentPreview = (delta: number): EffectPreviewLine => effectLine('Armaments', '军备', delta);
export const budgetPreview = (delta: number): EffectPreviewLine => effectLine('Budget', '预算', delta);

export const statPreview = (
  state: GameState,
  stat: keyof GameState['stats'],
  delta: number,
  options: { scaledByDissent?: boolean } = {}
): EffectPreviewLine => {
  const labels = STAT_LABELS[stat];
  return effectLine(labels.label, labels.labelZh, resolveDelta(state, delta, options.scaledByDissent), {
    reverseTone: labels.reverseTone
  });
};

export const factionDissentPreview = (faction: Faction, delta: number): EffectPreviewLine => {
  const labels = FACTION_LABELS[faction];
  return effectLine(`${labels.label} dissent`, `${labels.labelZh}不满`, delta, { reverseTone: true });
};

export const factionInfluencePreview = (faction: Faction, delta: number): EffectPreviewLine => {
  const labels = FACTION_LABELS[faction];
  return effectLine(`${labels.label} influence`, `${labels.labelZh}影响力`, delta);
};

export const classSupportPreview = (
  state: GameState,
  socialClass: SocialClass,
  force: ClassPoliticalForce | 'PRRevS',
  delta: number,
  options: { scaledByDissent?: boolean } = {}
): EffectPreviewLine => {
  const classLabels = CLASS_LABELS[socialClass];
  const partyLabels = PARTY_LABELS[force];
  return effectLine(
    `${classLabels.label} support for ${partyLabels.label}`,
    `${classLabels.labelZh}对${partyLabels.labelZh}支持率`,
    resolveDelta(state, delta, options.scaledByDissent)
  );
};

export const partyRelationPreview = (party: Exclude<Party, 'PRRevS'>, delta: number): EffectPreviewLine => {
  const labels = PARTY_LABELS[party];
  return effectLine(`Relations with ${labels.label}`, `与${labels.labelZh}关系`, delta);
};

export const partySupportPreview = (party: Party, delta: number): EffectPreviewLine => {
  const labels = PARTY_LABELS[party];
  return effectLine(`${labels.label} support`, `${labels.labelZh}支持率`, delta);
};

export const relationPreview = (relation: keyof GameState['relations'], delta: number): EffectPreviewLine => {
  const labels = RELATION_LABELS[relation];
  return effectLine(labels.label, labels.labelZh, delta);
};

export const domesticPolicyPreview = (
  policy: keyof GameState['domesticPolicy'],
  delta: number
): EffectPreviewLine => {
  const labels = DOMESTIC_POLICY_LABELS[policy];
  return effectLine(labels.label, labels.labelZh, delta, { reverseTone: labels.reverseTone });
};

export const timerPreview = (field: keyof GameState, value: number): EffectPreviewLine => {
  const labels = TOP_LEVEL_FIELDS[String(field)] || humanizeKey(String(field));
  return textPreview(
    `${labels.label} set to ${formatSignedNumber(value).replace('+', '')}`,
    `${labels.labelZh}设为 ${formatSignedNumber(value).replace('+', '')}`,
    'neutral'
  );
};

export const eventPreview = (title: string, titleZh: string): EffectPreviewLine => (
  textPreview(`Open event: ${title}`, `打开事件：${titleZh}`)
);

export const endEventPreview = (): EffectPreviewLine => textPreview('End current event', '结束当前事件');

const humanizeKey = (key: string): Labels => ({
  label: key.replace(/_/g, ' '),
  labelZh: key
});

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null
);

const clonePlain = <T>(value: T): T => {
  if (value === undefined || value === null) return value;
  return JSON.parse(JSON.stringify(value)) as T;
};

const cloneStateForPreview = (state: GameState): GameState => ({
  ...state,
  stats: { ...state.stats },
  factions: clonePlain(state.factions),
  classes: clonePlain(state.classes),
  partyRelations: { ...state.partyRelations },
  partySupport: { ...state.partySupport },
  relations: { ...state.relations },
  domesticPolicy: { ...state.domesticPolicy },
  armedForces: clonePlain(state.armedForces),
  government: { ...state.government },
  ministers: { ...state.ministers },
  regionalStatuses: { ...state.regionalStatuses },
  journal: clonePlain(state.journal),
  eventHistory: clonePlain(state.eventHistory)
});

const getNumeric = (value: unknown): number | null => (
  typeof value === 'number' && Number.isFinite(value) ? value : null
);

const addNumericDelta = (
  lines: EffectPreviewLine[],
  labels: FieldConfig,
  before: unknown,
  after: unknown
) => {
  const beforeNumber = getNumeric(before);
  const afterNumber = getNumeric(after);
  if (beforeNumber === null || afterNumber === null) return;

  const delta = afterNumber - beforeNumber;
  if (Math.abs(delta) < 0.005) return;

  lines.push(effectLine(labels.label, labels.labelZh, delta, {
    reverseTone: labels.reverseTone,
    suffix: labels.suffix,
    suffixZh: labels.suffixZh
  }));
};

const addBooleanChange = (
  lines: EffectPreviewLine[],
  labels: Labels,
  before: unknown,
  after: unknown
) => {
  if (typeof before !== 'boolean' || typeof after !== 'boolean' || before === after) return;

  const enabled = after;
  lines.push(textPreview(
    `${labels.label}: ${enabled ? 'enabled' : 'disabled'}`,
    `${labels.labelZh}：${enabled ? '启用' : '关闭'}`,
    enabled ? 'positive' : 'negative'
  ));
};

const addTopLevelDiffs = (
  lines: EffectPreviewLine[],
  before: GameState,
  afterPartial: Partial<GameState>
) => {
  const beforeRecord = before as unknown as Record<string, unknown>;
  const afterRecord = afterPartial as Record<string, unknown>;

  Object.keys(TOP_LEVEL_FIELDS).forEach((key) => {
    if (!(key in afterRecord)) return;
    addNumericDelta(lines, TOP_LEVEL_FIELDS[key], beforeRecord[key], afterRecord[key]);
  });

  Object.keys(BOOLEAN_FIELDS).forEach((key) => {
    if (!(key in afterRecord)) return;
    addBooleanChange(lines, BOOLEAN_FIELDS[key], beforeRecord[key], afterRecord[key]);
  });
};

const addStatsDiffs = (
  lines: EffectPreviewLine[],
  before: GameState['stats'],
  after?: Partial<GameState['stats']>
) => {
  if (!after) return;
  (Object.keys(STAT_LABELS) as (keyof GameState['stats'])[]).forEach((key) => {
    if (!(key in after)) return;
    const labels = STAT_LABELS[key];
    addNumericDelta(lines, labels, before[key], after[key]);
  });
};

const addDomesticPolicyDiffs = (
  lines: EffectPreviewLine[],
  before: GameState['domesticPolicy'],
  after?: Partial<GameState['domesticPolicy']>
) => {
  if (!after) return;
  (Object.keys(DOMESTIC_POLICY_LABELS) as (keyof GameState['domesticPolicy'])[]).forEach((key) => {
    if (!(key in after)) return;
    const labels = DOMESTIC_POLICY_LABELS[key];
    if (typeof before[key] === 'boolean' || typeof after[key] === 'boolean') {
      addBooleanChange(lines, labels, before[key], after[key]);
    } else {
      addNumericDelta(lines, labels, before[key], after[key]);
    }
  });
};

const addFactionInfluenceAdjustmentLines = (
  lines: EffectPreviewLine[],
  adjustments: FactionInfluenceAdjustment[]
) => {
  const orderedAdjustments: FactionInfluenceAdjustment[] = [];
  const adjustmentByFaction = new Map<Faction, FactionInfluenceAdjustment>();

  adjustments.forEach((adjustment) => {
    const existing = adjustmentByFaction.get(adjustment.faction);
    if (existing) {
      existing.delta += adjustment.delta;
      return;
    }

    const entry = { ...adjustment };
    adjustmentByFaction.set(adjustment.faction, entry);
    orderedAdjustments.push(entry);
  });

  orderedAdjustments.forEach(({ faction, delta }) => {
    if (Math.abs(delta) < 0.005) return;

    const labels = FACTION_LABELS[faction];
    lines.push(effectLine(`${labels.label} influence`, `${labels.labelZh}影响力`, delta));
  });
};

const addFactionsDiffs = (
  lines: EffectPreviewLine[],
  before: GameState['factions'],
  after?: Partial<GameState['factions']>,
  influenceAdjustments: FactionInfluenceAdjustment[] = []
) => {
  if (!after) return;
  const hasInfluenceTrace = influenceAdjustments.length > 0;

  if (hasInfluenceTrace) {
    addFactionInfluenceAdjustmentLines(lines, influenceAdjustments);
  }

  (Object.keys(before) as Faction[]).forEach((faction) => {
    const nextFaction = after[faction];
    if (!nextFaction) return;
    const labels = FACTION_LABELS[faction];
    if (!hasInfluenceTrace) {
      addNumericDelta(
      lines,
      { label: `${labels.label} influence`, labelZh: `${labels.labelZh}影响力` },
      before[faction].influence,
      nextFaction.influence
    );
    }
    addNumericDelta(
      lines,
      { label: `${labels.label} dissent`, labelZh: `${labels.labelZh}不满`, reverseTone: true },
      before[faction].dissent,
      nextFaction.dissent
    );
  });
};

const addPartyRelationDiffs = (
  lines: EffectPreviewLine[],
  before: GameState['partyRelations'],
  after?: Partial<GameState['partyRelations']>
) => {
  if (!after) return;
  (Object.keys(before) as Exclude<Party, 'PRRevS'>[]).forEach((party) => {
    if (!(party in after)) return;
    const labels = PARTY_LABELS[party];
    addNumericDelta(lines, { label: `Relations with ${labels.label}`, labelZh: `与${labels.labelZh}关系` }, before[party], after[party]);
  });
};

const addPartySupportDiffs = (
  lines: EffectPreviewLine[],
  before: GameState['partySupport'],
  after?: Partial<GameState['partySupport']>
) => {
  if (!after) return;
  (Object.keys(before) as Party[]).forEach((party) => {
    if (!(party in after)) return;
    const labels = PARTY_LABELS[party];
    addNumericDelta(lines, { label: `${labels.label} support`, labelZh: `${labels.labelZh}支持率` }, before[party], after[party]);
  });
};

const addClassSupportAdjustmentLines = (
  lines: EffectPreviewLine[],
  adjustments: ClassSupportAdjustment[]
) => {
  const orderedAdjustments: ClassSupportAdjustment[] = [];
  const adjustmentByKey = new Map<string, ClassSupportAdjustment>();

  adjustments.forEach((adjustment) => {
    const key = `${adjustment.socialClass}:${adjustment.force}`;
    const existing = adjustmentByKey.get(key);
    if (existing) {
      existing.delta += adjustment.delta;
      return;
    }

    const entry = { ...adjustment };
    adjustmentByKey.set(key, entry);
    orderedAdjustments.push(entry);
  });

  orderedAdjustments.forEach(({ socialClass, force, delta }) => {
    if (Math.abs(delta) < 0.005) return;

    const classLabels = CLASS_LABELS[socialClass];
    const partyLabels = PARTY_LABELS[force] || humanizeKey(force);
    lines.push(effectLine(
      `${classLabels.label} support for ${partyLabels.label}`,
      `${classLabels.labelZh}对${partyLabels.labelZh}支持率`,
      delta
    ));
  });
};

const addRelationsDiffs = (
  lines: EffectPreviewLine[],
  before: GameState['relations'],
  after?: Partial<GameState['relations']>
) => {
  if (!after) return;
  (Object.keys(RELATION_LABELS) as (keyof GameState['relations'])[]).forEach((key) => {
    if (!(key in after)) return;
    addNumericDelta(lines, RELATION_LABELS[key], before[key], after[key]);
  });
};

const addClassSupportDiffs = (
  lines: EffectPreviewLine[],
  before: GameState['classes'],
  after?: Partial<GameState['classes']>
) => {
  if (!after) return;
  (Object.keys(before) as SocialClass[]).forEach((socialClass) => {
    const nextClass = after[socialClass];
    if (!nextClass?.support) return;

    const beforeSupport = before[socialClass].support as Record<string, number>;
    const afterSupport = nextClass.support as Record<string, number>;
    Object.keys(afterSupport).forEach((force) => {
      if (!CLASS_FORCES_TO_REPORT.has(force)) return;
      const beforeValue = beforeSupport[force];
      const afterValue = afterSupport[force];
      if (typeof beforeValue !== 'number' || typeof afterValue !== 'number') return;

      const delta = afterValue - beforeValue;
      if (Math.abs(delta) < 0.5) return;

      const classLabels = CLASS_LABELS[socialClass];
      const partyLabels = PARTY_LABELS[force as 'CNT_FAI' | Party] || humanizeKey(force);
      lines.push(effectLine(
        `${classLabels.label} support for ${partyLabels.label}`,
        `${classLabels.labelZh}对${partyLabels.labelZh}支持率`,
        delta
      ));
    });
  });
};

const addArmedForcesDiffs = (
  lines: EffectPreviewLine[],
  before: GameState['armedForces'],
  after?: Partial<GameState['armedForces']>
) => {
  if (!after) return;

  if (after.regularArmy) {
    addNumericDelta(lines, { label: 'Regular army manpower', labelZh: '正规军人力' }, before.regularArmy.manpower, after.regularArmy.manpower);
    addNumericDelta(lines, { label: 'Regular army loyalty', labelZh: '正规军忠诚' }, before.regularArmy.loyalty, after.regularArmy.loyalty);
  }

  if (after.guardiaNacional) {
    addNumericDelta(lines, { label: 'Guardia Nacional manpower', labelZh: '国民卫队人力' }, before.guardiaNacional.manpower, after.guardiaNacional.manpower);
    addNumericDelta(lines, { label: 'Guardia Nacional loyalty', labelZh: '国民卫队忠诚' }, before.guardiaNacional.loyalty, after.guardiaNacional.loyalty);
  }

  if (after.guardiaAsalto) {
    addNumericDelta(lines, { label: 'Guardia de Asalto manpower', labelZh: '突击卫队人力' }, before.guardiaAsalto.manpower, after.guardiaAsalto.manpower);
    addNumericDelta(lines, { label: 'Guardia de Asalto loyalty', labelZh: '突击卫队忠诚' }, before.guardiaAsalto.loyalty, after.guardiaAsalto.loyalty);
  }

  if (after.militias) {
    Object.keys(before.militias).forEach((key) => {
      const militiaKey = key as keyof GameState['armedForces']['militias'];
      if (!(militiaKey in after.militias!)) return;
      const labels = humanizeKey(`${militiaKey} militia`);
      addNumericDelta(lines, labels, before.militias[militiaKey], after.militias[militiaKey]);
    });
  }
};

const addGovernmentDiffs = (
  lines: EffectPreviewLine[],
  before: GameState['government'],
  after?: Partial<GameState['government']>
) => {
  if (!after) return;
  if (after.president && after.president !== before.president) {
    lines.push(textPreview(`President: ${after.president}`, `总统：${after.presidentZh || after.president}`));
  }
  if (after.primeMinister && after.primeMinister !== before.primeMinister) {
    lines.push(textPreview(`Prime minister: ${after.primeMinister}`, `总理：${after.primeMinisterZh || after.primeMinister}`));
  }
};

const getEventTitleText = (event: GameEvent, state: GameState): { en: string; zh: string } => {
  const title = typeof event.title === 'function' ? event.title(state) : event.title;
  const titleZhRaw = event.titleZh ?? event.title;
  const titleZh = typeof titleZhRaw === 'function' ? titleZhRaw(state) : titleZhRaw;
  return { en: title, zh: titleZh };
};

const addCurrentEventLine = (
  lines: EffectPreviewLine[],
  state: GameState,
  partial: Partial<GameState>
) => {
  if (partial.currentEvent) {
    const title = getEventTitleText(partial.currentEvent, state);
    lines.push(eventPreview(title.en, title.zh));
    return;
  }

  if (state.currentEvent) {
    lines.push(endEventPreview());
  }
};

const hasVisibleStateLines = (lines: EffectPreviewLine[]) => (
  lines.some((line) => line.value !== undefined || (line.text && !line.text.startsWith('Open event')))
);

const buildFallbackPreview = (
  state: GameState,
  option: GameEvent['options'][number]
): EffectPreviewLine[] => {
  const previewState = cloneStateForPreview(state);
  const classSupportTrace = collectClassSupportAdjustments(() => (
    collectFactionInfluenceAdjustments(() => option.effect(previewState))
  ));
  const partial = classSupportTrace.result.result;
  const classSupportAdjustments = classSupportTrace.adjustments;
  const factionInfluenceAdjustments = classSupportTrace.result.adjustments;
  const lines: EffectPreviewLine[] = [];

  addTopLevelDiffs(lines, state, partial);
  addStatsDiffs(lines, state.stats, partial.stats);
  addDomesticPolicyDiffs(lines, state.domesticPolicy, partial.domesticPolicy);
  addFactionsDiffs(lines, state.factions, partial.factions, factionInfluenceAdjustments);
  if (classSupportAdjustments.length > 0) {
    addClassSupportAdjustmentLines(lines, classSupportAdjustments);
  } else {
    addClassSupportDiffs(lines, state.classes, partial.classes);
  }
  addPartyRelationDiffs(lines, state.partyRelations, partial.partyRelations);
  addPartySupportDiffs(lines, state.partySupport, partial.partySupport);
  addRelationsDiffs(lines, state.relations, partial.relations);
  addArmedForcesDiffs(lines, state.armedForces, partial.armedForces);
  addGovernmentDiffs(lines, state.government, partial.government);

  addCurrentEventLine(lines, state, partial);

  if (lines.length === 1 && !hasVisibleStateLines(lines) && isRecord(partial) && Object.keys(partial).length === 0) {
    return [endEventPreview()];
  }

  return lines;
};

export const getOptionEffectPreview = (
  state: GameState,
  option: GameEvent['options'][number]
): EffectPreviewLine[] => {
  if (option.effectPreview) {
    return option.effectPreview(state).filter((line) => {
      if (line.value === undefined) return Boolean(line.text || line.textZh || line.label || line.labelZh);
      return Math.abs(line.value) >= 0.005;
    });
  }

  try {
    return buildFallbackPreview(state, option);
  } catch {
    return [
      textPreview('Effect preview unavailable', '效果预览不可用')
    ];
  }
};

export const enabledPreview = (label: string, labelZh: string): EffectPreviewLine => {
  const key = label.toLowerCase();
  const isPositive = [...POSITIVE_KEYS].some((token) => key.includes(token));
  return textPreview(`${label}: enabled`, `${labelZh}：启用`, isPositive ? 'positive' : 'neutral');
};
