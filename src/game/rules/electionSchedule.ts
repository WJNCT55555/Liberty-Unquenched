import type {
  CoalitionId,
  GameState,
  GeneralElectionParticipation,
  GeneralElectionReason,
  GeneralElectionSchedule,
} from '../types';

const CONSTITUENT_ELECTION = { year: 1931, month: 6 } as const;
const FIRST_HISTORICAL_EARLY_ELECTION = { year: 1933, month: 11 } as const;
const SECOND_HISTORICAL_EARLY_ELECTION = { year: 1936, month: 2 } as const;
const GENERAL_ELECTION_TERM_MONTHS = 48;

type ElectionScheduleSource = Pick<
  GameState,
  | 'year'
  | 'month'
  | 'isRepublicanSocialistDissolved'
  | 'isCedaRadicalDissolved'
> & Partial<Pick<GameState, 'generalElectionSchedule' | 'dissolutionCount' | 'governmentCrisisSequence'>>;

const compareDates = (
  left: GeneralElectionSchedule['nextElectionAt'],
  right: GeneralElectionSchedule['nextElectionAt'],
) => (left.year * 12 + left.month) - (right.year * 12 + right.month);

const laterDate = (
  left: GeneralElectionSchedule['nextElectionAt'],
  right: GeneralElectionSchedule['nextElectionAt'],
) => compareDates(left, right) >= 0 ? left : right;

export const addElectionMonths = (
  date: GeneralElectionSchedule['nextElectionAt'],
  months: number,
): GeneralElectionSchedule['nextElectionAt'] => {
  const zeroBasedMonth = date.year * 12 + date.month - 1 + months;
  return {
    year: Math.floor(zeroBasedMonth / 12),
    month: (zeroBasedMonth % 12) + 1,
  };
};

const isElectionDate = (value: unknown): value is GeneralElectionSchedule['nextElectionAt'] => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<GeneralElectionSchedule['nextElectionAt']>;
  return Number.isInteger(candidate.year)
    && Number.isInteger(candidate.month)
    && Number(candidate.month) >= 1
    && Number(candidate.month) <= 12;
};

const ELECTION_REASONS = new Set<GeneralElectionReason>([
  'constituent',
  'term_expiry',
  'government_crisis',
]);
const ELECTION_PARTICIPATION = new Set<GeneralElectionParticipation>([
  'abstain',
  'support_left',
  'prrevs_independent',
  'prrevs_left_alliance',
]);

const isElectionSchedule = (value: unknown): value is GeneralElectionSchedule => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<GeneralElectionSchedule>;
  return (candidate.lastElectionAt === null || isElectionDate(candidate.lastElectionAt))
    && isElectionDate(candidate.nextElectionAt)
    && ELECTION_REASONS.has(candidate.reason as GeneralElectionReason)
    && (candidate.participation === undefined
      || ELECTION_PARTICIPATION.has(candidate.participation));
};

/**
 * Reconstruct the schedule displayed by pre-migration builds.
 * Used only for old saves or malformed schedule data; new games write the
 * schedule explicitly and election/crisis transitions keep it current.
 */
export const inferLegacyGeneralElectionSchedule = (
  state: ElectionScheduleSource,
): GeneralElectionSchedule => {
  const currentDate = { year: state.year, month: state.month };

  if (compareDates(currentDate, CONSTITUENT_ELECTION) < 0) {
    return {
      lastElectionAt: null,
      nextElectionAt: { ...CONSTITUENT_ELECTION },
      reason: 'constituent',
    };
  }

  if (compareDates(currentDate, FIRST_HISTORICAL_EARLY_ELECTION) < 0) {
    return state.isRepublicanSocialistDissolved
      ? {
          lastElectionAt: { ...CONSTITUENT_ELECTION },
          nextElectionAt: { ...FIRST_HISTORICAL_EARLY_ELECTION },
          reason: 'government_crisis',
          crisis: {
            coalitionId: 'republican_socialist',
            sequence: Math.max(1, state.governmentCrisisSequence || state.dissolutionCount || 0),
          },
        }
      : {
          lastElectionAt: { ...CONSTITUENT_ELECTION },
          nextElectionAt: addElectionMonths(CONSTITUENT_ELECTION, GENERAL_ELECTION_TERM_MONTHS),
          reason: 'term_expiry',
        };
  }

  if (compareDates(currentDate, SECOND_HISTORICAL_EARLY_ELECTION) < 0) {
    return state.isCedaRadicalDissolved
      ? {
          lastElectionAt: { ...FIRST_HISTORICAL_EARLY_ELECTION },
          nextElectionAt: { ...SECOND_HISTORICAL_EARLY_ELECTION },
          reason: 'government_crisis',
          crisis: {
            coalitionId: 'ceda_radical',
            sequence: Math.max(2, state.governmentCrisisSequence || state.dissolutionCount || 0),
          },
        }
      : {
          lastElectionAt: { ...FIRST_HISTORICAL_EARLY_ELECTION },
          nextElectionAt: addElectionMonths(FIRST_HISTORICAL_EARLY_ELECTION, GENERAL_ELECTION_TERM_MONTHS),
          reason: 'term_expiry',
        };
  }

  return {
    lastElectionAt: { ...SECOND_HISTORICAL_EARLY_ELECTION },
    nextElectionAt: addElectionMonths(SECOND_HISTORICAL_EARLY_ELECTION, GENERAL_ELECTION_TERM_MONTHS),
    reason: 'term_expiry',
  };
};

export const normalizeGeneralElectionSchedule = (
  state: ElectionScheduleSource,
): GeneralElectionSchedule => (
  isElectionSchedule(state.generalElectionSchedule)
    ? state.generalElectionSchedule
    : inferLegacyGeneralElectionSchedule(state)
);

/** Record a completed general election and open a fresh four-year term. */
export const scheduleElectionAfterCompletedElection = (
  state: Pick<GameState, 'year' | 'month'>,
): GeneralElectionSchedule => {
  const electionDate = { year: state.year, month: state.month };
  return {
    lastElectionAt: electionDate,
    nextElectionAt: addElectionMonths(electionDate, GENERAL_ELECTION_TERM_MONTHS),
    reason: 'term_expiry',
  };
};

/**
 * Preserve the historical election dates for the first two constitutional
 * crises. Other crises receive a one-month caretaker interval before voting.
 */
export const scheduleElectionAfterGovernmentCrisis = (
  state: ElectionScheduleSource,
  coalitionId: CoalitionId,
  crisisSequence: number,
): GeneralElectionSchedule => {
  const currentDate = { year: state.year, month: state.month };
  const historicalDate = coalitionId === 'republican_socialist'
    ? FIRST_HISTORICAL_EARLY_ELECTION
    : coalitionId === 'ceda_radical'
      ? SECOND_HISTORICAL_EARLY_ELECTION
      : addElectionMonths(currentDate, 1);
  const previous = normalizeGeneralElectionSchedule(state);

  return {
    lastElectionAt: previous.lastElectionAt,
    nextElectionAt: { ...laterDate(historicalDate, addElectionMonths(currentDate, 1)) },
    reason: 'government_crisis',
    crisis: {
      coalitionId,
      sequence: crisisSequence,
    },
  };
};

export type ScheduledGeneralElectionKind = 'historical_1933' | 'historical_1936' | 'general';

/** Returns the one election root allowed to enter for the current schedule. */
export const getDueGeneralElectionKind = (
  state: GameState,
): ScheduledGeneralElectionKind | null => {
  if (state.civilWarStatus !== 'not_started') return null;
  const schedule = normalizeGeneralElectionSchedule(state);
  if (compareDates({ year: state.year, month: state.month }, schedule.nextElectionAt) < 0) return null;

  if (
    schedule.reason === 'government_crisis'
    && schedule.crisis?.coalitionId === 'republican_socialist'
    && schedule.crisis.sequence === 1
    && schedule.nextElectionAt.year === 1933
    && schedule.nextElectionAt.month === 11
  ) return 'historical_1933';

  if (
    schedule.reason === 'government_crisis'
    && schedule.crisis?.coalitionId === 'ceda_radical'
    && schedule.crisis.sequence === 2
    && schedule.nextElectionAt.year === 1936
    && schedule.nextElectionAt.month === 2
  ) return 'historical_1936';

  return 'general';
};

export const setGeneralElectionParticipation = (
  state: GameState,
  participation: GeneralElectionParticipation,
): GameState['generalElectionSchedule'] => ({
  ...normalizeGeneralElectionSchedule(state),
  participation,
});
