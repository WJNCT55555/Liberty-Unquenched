/**
 * November 1933 — the Republican–Socialist coalition has collapsed, the
 * Radical–CEDA government takes office after the right's election victory, and
 * Catalonia already holds its autonomy statute.
 */
import { SCENARIO_1933_CLASSES } from '../parties';
import { getDefaultOrganizationState } from '../organizations';
import { getDefaultUnionShare } from '../unions';
import type { ScenarioDefinition } from './types';
import { INITIAL_CONTROL_SHARES } from './controlShares';

export const SCENARIO_1933: ScenarioDefinition = {
  id: '1933',
  startYear: 1933,
  startMonth: 11,
  civilWarStatus: 'not_started',
  generalElectionSchedule: {
    lastElectionAt: { year: 1933, month: 11 },
    nextElectionAt: { year: 1937, month: 11 },
    reason: 'term_expiry',
  },

  government: {
    type: 'Radical-CEDA Coalition',
    typeZh: '激进党-CEDA联合政府',
    president: 'Niceto Alcalá-Zamora',
    presidentZh: '尼塞托·阿尔卡拉-萨莫拉',
    primeMinister: 'Alejandro Lerroux',
    primeMinisterZh: '亚历杭德罗·勒鲁',
  },

  ministers: {
    labor: 'PRR',
    health: 'PRR',
    justice: 'Other',
    industry: 'Other',
    interior: 'Other',
    war: 'PRR',
    agriculture: 'Other',
    finance: 'PRR',
    estado: 'Other',
  },

  // November 1933 Cortes: the right's victory, CEDA as the largest single bloc.
  cortes: {
    AP: 115, PRR: 102, PSOE: 59, ERC: 17, RE: 14, CT: 20, FE: 1, IR: 5, UR: 1, PNV: 11,
    DLR: 0, POUM: 0, PCE: 1, PS: 0, Other: 124, PRRevS: 0,
  },

  classes: SCENARIO_1933_CLASSES,

  /**
   * Replayed forward from the 1931 scenario through the real reducer
   * (`scripts/scenario-history-probe.ts`) so this start carries what a 1931 game has
   * actually accumulated by November 1933:
   *   1931-05  Azaña's military reform   army_reform_law 0->1, security_corps_law 0->1
   *   1931-11  Mixed Juries law          union_status 1->2, mixed_jury_cnt_opposed -> true
   *   1931-12  Constitution of 1931      political_rights 1->2, womens_rights 0->1,
   *                                      religion_policy 0->2, education_institutions 0->1
   *   1932-08  Sanjurjada                land_law 0->1
   *   1932-09  Catalan statute           language_policy 0->1
   *   1933-07  Public Order Law          public_order_law 0->1 (repeals the 1931 Defense Act)
   *   1933-11  CEDA/Radical rollback     max_hours_law 1->0
   *
   * `militia_legality_law` is 1 through the whole peacetime replay: the ladder is
   * pushed only by the three wartime events in `events/civil_war/militia_legality.ts`,
   * which need an ongoing civil war, so every scenario opens on level 1
   * ("Tolerate Local Militias") and none of the rungs can fire before July 1936.
   *
   * `land_reform_progress` stays at 0 on purpose: it tracks the land-reform
   * journal, which is inactive when a scenario opens, so the simulated monthly
   * drift the replay shows (6 by November 1933) is runtime state, not history.
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

  organizations: () => getDefaultOrganizationState('1933'),
  unionShare: () => getDefaultUnionShare('1933'),

  controlShares: INITIAL_CONTROL_SHARES['1933'],

  economy: {
    growth: 2.1,
    inflation: 2.5,
    unemployment: 18.2,
    budget: 8.0,
    goldReserves: 2100,
    foreignExchange: 140,
    publicDebt: 750,
    hasIssuedWarBonds: false,
    militarySpending: 12,
  },

  history: {
    psFounded: false,
    // The Falange was founded in October 1933, before this start.
    feFounded: true,
    poumFounded: false,
    cedaFormed: true,
    irFormed: false,
    urFormed: false,
    // The Treintista split has already happened, so the Syndicalist Party can be
    // founded from 1934-07 onwards instead of being permanently unreachable.
    treintistasLeft: true,
    // The Falange-JONS merger is February 1934, still ahead at this start.
    falangeJons: false,
    isCasasViejasTriggered: true,
    isJabaliTriggered: false,
    isRepublicanSocialistDissolved: true,
    isCedaRadicalDissolved: false,
    dissolutionCount: 1,
    impeachPresidentAvailable: false,
    isPresidentImpeached: false,
    presidentElectionSeen: false,
    coupSystemActive: true,
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
    catalonia: 'autonomy',
    basque: 'direct',
    galicia: 'direct',
    asturias: 'direct',
  },

  superEvent: null,
};
