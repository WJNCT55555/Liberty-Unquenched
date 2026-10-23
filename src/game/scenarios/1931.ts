/**
 * April 1931 — the Second Republic is proclaimed. The Provisional Government
 * holds office, the Cortes has not been elected yet, and the CNT is a hostile
 * outsider.
 */
import { INITIAL_CLASSES } from '../parties';
import { getDefaultOrganizationState } from '../organizations';
import { getDefaultUnionShare } from '../unions';
import type { ScenarioDefinition } from './types';
import { INITIAL_CONTROL_SHARES } from './controlShares';

export const SCENARIO_1931: ScenarioDefinition = {
  id: '1931',
  startYear: 1931,
  startMonth: 4,
  civilWarStatus: 'not_started',
  generalElectionSchedule: {
    lastElectionAt: null,
    nextElectionAt: { year: 1931, month: 6 },
    reason: 'constituent',
  },

  government: {
    type: 'Provisional Government',
    typeZh: '临时政府',
    president: 'Niceto Alcalá-Zamora',
    presidentZh: '尼塞托·阿尔卡拉-萨莫拉',
    primeMinister: 'Niceto Alcalá-Zamora',
    primeMinisterZh: '尼塞托·阿尔卡拉-萨莫拉',
  },

  ministers: {
    labor: 'PSOE',
    health: 'PSOE',
    justice: 'PSOE',
    // 1931 年不存在工业部与商业部：工业与商业迟至 1933 年 12 月才从劳动部体系中分出
    // （见 `events/industry_commerce_ministry.ts`）。这两个字段在 1936 剧本才有归属。
    industry: 'Other',
    commerce: 'Other',
    interior: 'DLR',
    agriculture: 'Other',
    // 公共教育部的史实首任部长是马塞利诺·多明戈（激进社会共和党，1934 年并入 IR）；
    // 在本作的党派表里，这一时期的共和派小党人物记作 `Other`。
    education: 'Other',
    // 公共工程部（时为 Fomento），首任部长为激进社会党人阿尔瓦罗·德·阿尔博诺斯。
    publicWorks: 'Other',
    finance: 'PSOE',
    estado: 'PRR',
    war: 'Other',
  },

  // No elected Cortes yet at the April 1931 start.
  cortes: undefined,

  classes: INITIAL_CLASSES,

  domesticPolicy: {
    land_law: 0,
    public_order_law: 0,
    security_corps_law: 0,
    army_reform_law: 0,
    // Local party militias are tolerated from the proclamation onward; the 1931
    // start is the floor of the militia-legality ladder, not its zero.
    militia_legality_law: 1,
    land_reform_progress: 0,
    regional_autonomy_progress: 0,
    judiciary_reform_progress: 0,
    health_reform_progress: 0,
    max_hours_law: 1,
    min_wage: 0,
    workplace_safety: 0,
    political_rights: 1,
    womens_rights: 0,
    religion_policy: 0,
    education_institutions: 0,
    language_policy: 0,
    union_status: 1,
    mixed_jury_cnt_opposed: false,
  },

  organizations: () => getDefaultOrganizationState('1931'),
  unionShare: () => getDefaultUnionShare('1931'),

  controlShares: INITIAL_CONTROL_SHARES['1931'],

  economy: {
    growth: 1.2,
    inflation: 1.4,
    unemployment: 14.5,
    budget: 10.0,
    goldReserves: 2200,
    foreignExchange: 180,
    publicDebt: 500,
    hasIssuedWarBonds: false,
    militarySpending: 15,
  },

  history: {
    psFounded: false,
    feFounded: false,
    poumFounded: false,
    cedaFormed: false,
    irFormed: false,
    urFormed: false,
    // The Thirty are still inside the CNT at this start; the split is a 1931 decision.
    treintistasLeft: false,
    // The Falange-JONS merger is February 1934.
    falangeJons: false,
    isCasasViejasTriggered: false,
    isJabaliTriggered: false,
    isRepublicanSocialistDissolved: false,
    isCedaRadicalDissolved: false,
    dissolutionCount: 0,
    impeachPresidentAvailable: false,
    isPresidentImpeached: false,
    presidentElectionSeen: false,
    pceAcceptsComintern: false,
    coupSystemActive: false,
  },

  armedEntityManpower: {
    cnt_defense_committees: 0,
    maoc: 0,
    poum_militias: 0,
    ugt_socialist_militias: 0,
    requetes: 0,
    falange_first_line: 0,
  },

  regionalStatuses: {
    andalusia: 'direct',
    catalonia: 'direct',
    basque: 'direct',
    galicia: 'direct',
    asturias: 'direct',
  },

  superEvent: 'abdication_alfonso',
};
