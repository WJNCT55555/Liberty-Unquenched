/**
 * Scenario descriptor contract.
 *
 * A `ScenarioDefinition` is a *complete* named description of everything that
 * differs between the 1931 / 1933 / 1936 starts. Every field is required, and
 * `SCENARIOS` is typed `Record<ScenarioId, ScenarioDefinition>`, so:
 *
 *   - a new scenario cannot be registered without filling in every field;
 *   - a scenario file cannot omit a field and silently inherit 1931's value,
 *     because `NEUTRAL_STATE` has all scenario-owned keys deleted.
 *
 * Anything that is identical across scenarios (map resource pools, police corps
 * baselines, card decks, relations, advisors, …) deliberately does NOT appear
 * here; it lives in the neutral base.
 */
import type { GameState } from '../types';
import type { ArmedEntityId } from '../../map/types_map';

export type ScenarioId = GameState['scenario'];
type ScenarioMilitiaEntityId = Extract<ArmedEntityId,
  | 'cnt_defense_committees'
  | 'maoc'
  | 'poum_militias'
  | 'ugt_socialist_militias'
  | 'requetes'
  | 'falange_first_line'
>;

/** Economy scalars applied at the start of the scenario. */
export interface ScenarioEconomy {
  growth: number;
  inflation: number;
  unemployment: number;
  budget: number;
  goldReserves: number;
  foreignExchange: number;
  publicDebt: number;
  hasIssuedWarBonds: boolean;
  militarySpending: number;
}

/**
 * "What has already happened by the time this scenario opens."
 *
 * These are the flags the peace-time history events would have written had the
 * scenario been played from 1931. They exist so a later start does not replay its
 * own past. Keeping them named (rather than inlined as ternaries) is what makes
 * the pairing between an event gate and its pre-applied flag reviewable.
 */
export interface ScenarioHistoryFlags {
  psFounded: boolean;
  feFounded: boolean;
  poumFounded: boolean;
  cedaFormed: boolean;
  irFormed: boolean;
  urFormed: boolean;
  /** True once the Treintista faction has left or been expelled from the CNT. */
  treintistasLeft: boolean;
  /** True once the Falange and the JONS have merged (February 1934). */
  falangeJons: boolean;
  isCasasViejasTriggered: boolean;
  isJabaliTriggered: boolean;
  isRepublicanSocialistDissolved: boolean;
  isCedaRadicalDissolved: boolean;
  dissolutionCount: number;
  impeachPresidentAvailable: boolean;
  isPresidentImpeached: boolean;
  presidentElectionSeen: boolean;
  coupSystemActive: boolean;
}

export interface ScenarioDefinition {
  id: ScenarioId;

  startYear: GameState['year'];
  startMonth: number;

  /** 1936 opens mid-civil-war; the other two open in peace. */
  civilWarStatus: Extract<GameState['civilWarStatus'], 'not_started' | 'ongoing'>;

  /** The election cycle already in force when the scenario opens. */
  generalElectionSchedule: GameState['generalElectionSchedule'];

  government: GameState['government'];
  ministers: GameState['ministers'];

  /**
   * `undefined` for 1931 — the scenario opens before the first elected Cortes,
   * and the initialization has always assigned `undefined` here. Preserved.
   */
  cortes: Record<string, number> | undefined;

  classes: GameState['classes'];
  domesticPolicy: GameState['domesticPolicy'];

  /**
   * Organization registry and union shares are derived from the scenario id by
   * the keyed tables in `organizations.ts` / `unions.ts` (both typed against the
   * scenario union, so completeness is enforced there). They are exposed as
   * thunks so every start gets freshly built objects, exactly as the previous
   * inline `getDefaultOrganizationState(scenario)` calls did.
   */
  organizations: () => GameState['organizations'];
  unionShare: () => NonNullable<GameState['unionShare']>;

  economy: ScenarioEconomy;
  history: ScenarioHistoryFlags;

  armedEntityManpower: Record<ScenarioMilitiaEntityId, number>;
  regionalStatuses: GameState['regionalStatuses'];

  superEvent: GameState['superEvent'];
}
