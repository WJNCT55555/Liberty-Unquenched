/**
 * July 1936 — the Popular Front governs, Azaña has replaced Alcalá-Zamora as
 * president after the impeachment, and the civil war is already running. The
 * start opens directly into the mobilization chain.
 */
import { SCENARIO_1936_CLASSES } from '../parties';
import { getDefaultOrganizationState } from '../organizations';
import { getDefaultUnionShare } from '../unions';
import type { ScenarioDefinition } from './types';

export const SCENARIO_1936: ScenarioDefinition = {
  id: '1936',
  startYear: 1936,
  startMonth: 7,
  civilWarStatus: 'ongoing',

  government: {
    type: 'Popular Front Cabinet',
    typeZh: '人民阵线内阁',
    president: 'Manuel Azaña',
    presidentZh: '曼努埃尔·阿萨尼亚',
    primeMinister: 'Santiago Casares Quiroga',
    primeMinisterZh: '圣地亚哥·卡萨雷斯·基罗加',
  },

  ministers: {
    labor: 'ERC',
    health: 'ERC',
    justice: 'UR',
    industry: 'Other',
    interior: 'Other',
    war: 'IR',
    agriculture: 'IR',
    finance: 'IR',
    estado: 'IR',
  },

  // February 1936 Cortes: the Popular Front majority.
  cortes: {
    PSOE: 99, IR: 87, UR: 37, ERC: 36, PCE: 17, POUM: 1, PS: 2, AP: 88, RE: 12, CT: 10,
    FE: 0, PRR: 5, PNV: 10, DLR: 0, Other: 66, PRRevS: 0,
  },

  classes: SCENARIO_1936_CLASSES,

  /**
   * Same values as the 1933 start: replaying the 1931 scenario forward through
   * the real reducer (`scripts/scenario-history-probe.ts`) shows no law-level change
   * between November 1933 and July 1936 — the February 1936 Popular Front
   * election restores amnesty rather than a statute level, and the historical
   * Azaña presidency only advances land-reform progress. The July 1933 Public
   * Order Law is therefore still the regime in force here, at level 1.
   *
   * `land_reform_progress` stays at 0 for the same reason as in 1933: the
   * land-reform journal is inactive when a scenario opens.
   */
  domesticPolicy: {
    land_law: 1,
    public_order_law: 1,
    security_corps_law: 1,
    army_reform_law: 1,
    militia_legality_law: 1,
    land_reform_progress: 0,
    regional_autonomy_progress: 0,
    max_hours_law: 0,
    min_wage: 0,
    workplace_safety: 0,
    political_rights: 2,
    womens_rights: 1,
    religion_policy: 2,
    education_institutions: 1,
    language_policy: 1,
    union_status: 2,
    mixed_jury_cnt_opposed: true,
  },

  organizations: () => getDefaultOrganizationState('1936'),
  unionShare: () => getDefaultUnionShare('1936'),

  economy: {
    growth: 3.5,
    inflation: 5.8,
    unemployment: 12.0,
    budget: 15.0,
    goldReserves: 1800,
    foreignExchange: 90,
    publicDebt: 1100,
    hasIssuedWarBonds: true,
    militarySpending: 40,
  },

  history: {
    psFounded: true,
    feFounded: true,
    poumFounded: true,
    cedaFormed: true,
    irFormed: true,
    urFormed: true,
    // The Treintista split is long past and the Syndicalist Party already exists.
    treintistasLeft: true,
    // The Falange and the JONS merged in February 1934; the merged party is the
    // one the July 1936 start faces.
    falangeJons: true,
    isCasasViejasTriggered: true,
    isJabaliTriggered: false,
    isRepublicanSocialistDissolved: true,
    isCedaRadicalDissolved: true,
    // The Cortes has already been dissolved twice and the president replaced.
    dissolutionCount: 2,
    impeachPresidentAvailable: true,
    isPresidentImpeached: true,
    presidentElectionSeen: true,
    coupSystemActive: true,
  },

  // July 1936 militia levels, used by the direct civil-war start.
  armedEntityManpower: {
    cnt_defense_committees: 50000,
    maoc: 10000,
    poum_militias: 5000,
    ugt_socialist_militias: 20000,
    requetes: 30000,
    falange_first_line: 10000,
  },

  regionalStatuses: {
    andalusia: 'direct',
    catalonia: 'autonomy',
    basque: 'direct',
    galicia: 'direct',
    asturias: 'direct',
  },

  superEvent: 'spanish_civil_war',
};
