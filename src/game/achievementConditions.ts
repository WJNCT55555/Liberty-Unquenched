import type { GameState } from './types';
import { ENDINGS } from './endings';
import { LAW_LEVEL_LIMITS } from './lawStances';
import { isOrganizationEstablished } from './organizations';
import { getOverallFactionDissent } from './utils/factionEffects';

/**
 * 成就判定的**纯函数部分**——刻意与 `achievements.tsx` 分开。
 *
 * `achievements.tsx` 依赖 React 与 `sonner`（弹出提示）、并在解锁时写 `localStorage`；
 * 无头环境（Mission Runner、脚本测试）里这两样都没有。把条件表放在这里，
 * 脚本就能用 `evaluateAchievements(state)` 问"这一局现在能解锁哪些成就"，
 * 而不必渲染界面、也不必真的去写存档。
 *
 * **只读**：不修改 state，不写存储，不发通知。
 */

/**
 * The three militants who led the armed workers of Barcelona shoulder to shoulder
 * (see events/civil_war/civil_war_setup.ts). All three begin in the advisor pool.
 */
export const THREE_MUSKETEERS = ['Francisco Ascaso', 'Buenaventura Durruti', 'Juan García Oliver'] as const;

export interface AchievementCheck {
  id: string;
  test: (state: GameState) => boolean;
}

/**
 * 与 `ACHIEVEMENTS` 一一对应：每个成就一条判定。新增成就时两处一起加
 * （`achievements.tsx` 会遍历本表解锁，Mission Runner 会遍历本表判定）。
 */
export const ACHIEVEMENT_CHECKS: AchievementCheck[] = [
  { id: 'A_CHILDREN', test: state => state.ending === ENDINGS.CHILDREN_OF_THE_PEOPLE },
  { id: 'A_FRANCO', test: state => state.ending === ENDINGS.WE_HAVE_PASSED },
  { id: 'A_POPULAR', test: state => state.ending === ENDINGS.POPULAR_FRONT },
  { id: 'A_RICH', test: state => state.armaments >= 50 },
  { id: 'A_BARRICADES', test: state => (state.armedForces.entityPools.cnt_defense_committees.manpower ?? 0) > 100000 },
  { id: 'A_UNITY', test: state => getOverallFactionDissent(state.factions) === 0 },
  {
    id: 'A_DURRUTI',
    test: state => state.civilWarStatus === 'won'
      && state.durrutiAlive
      && state.factions.Faistas.influence > Math.max(
        state.factions.Treintistas.influence,
        state.factions.Cenetistas.influence,
        state.factions.Puristas.influence,
      ),
  },
  {
    id: 'A_CATALONIA',
    test: state => state.regionalStatuses?.catalonia === 'independent'
      && (state.cataloniaControl === 'cnt_fai' || state.cataloniaControl === 'committee'),
  },
  { id: 'A_THEOLOGY', test: state => state.classes.Clero.support.CNT_FAI >= 40 },
  { id: 'A_TIZNAOS', test: state => Boolean(state.hasArmoredCars) },
  {
    id: 'A_MUJERES',
    test: state => isOrganizationEstablished(state, 'ML')
      && state.domesticPolicy.womens_rights >= LAW_LEVEL_LIMITS.womens_rights,
  },
  { id: 'A_YOUNG_WORLD', test: state => Boolean(state.internationalBrigadesFormed) },
  {
    id: 'A_CULTURAL_REV',
    test: state => state.domesticPolicy.womens_rights >= LAW_LEVEL_LIMITS.womens_rights
      && state.domesticPolicy.education_institutions >= LAW_LEVEL_LIMITS.education_institutions
      && (state.ateneos_established || 0) >= 5,
  },
  { id: 'A_OTHER_FRANCO', test: state => state.government.president === 'Ramón Franco' },
  {
    // The eight figures targeted by "propaganda by the deed"; other events can kill
    // some of them as well, so this is not an assassination-only goal.
    id: 'A_NONE_LEFT',
    test: state => state.francoStatus === 'dead'
      && state.queipoStatus === 'dead'
      && state.sanjurjoStatus === 'dead'
      && state.calvoSoteloStatus === 'dead'
      && state.primoDeRiveraStatus === 'dead'
      && state.ramiroLedesmaStatus === 'dead'
      && state.zamoraStatus === 'dead'
      && state.alfonsoXIIIStatus === 'dead',
  },
  { id: 'A_SIN_PARTIDO', test: state => isOrganizationEstablished(state, 'PRRevS') },
  {
    // Strictly "always opposed": the flag is only ever cleared, and gating on the
    // ending keeps it from firing on turn one.
    id: 'A_NO_VOTEIS',
    test: state => Boolean(state.isGameOver) && (state.cntStanceAlwaysOpposed ?? (state.cntStance === 'oppose')),
  },
  {
    id: 'A_MOSQUETEROS',
    test: state => THREE_MUSKETEERS.every(id => state.activeAdvisors?.some(advisor => advisor?.id === id)),
  },
  { id: 'A_ESPERANTO', test: state => state.domesticPolicy.language_policy >= LAW_LEVEL_LIMITS.language_policy },
  { id: 'A_OLIMPIADA', test: state => (state.eventHistory?.resolved || []).includes('olimpiada_popular') },
  {
    id: 'A_MONEY_ENDS',
    test: state => (state.currency_abolition ?? 0) >= 3 && state.currency_abolished_declared === true,
  },
];

/** 当前状态已满足的成就 id（纯读取，供 Mission Runner 与测试使用）。 */
export const evaluateAchievements = (state: GameState): string[] =>
  ACHIEVEMENT_CHECKS.filter(check => check.test(state)).map(check => check.id);
