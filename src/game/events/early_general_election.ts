import type { GameEvent } from '../types';
import {
  generalElectionResultDescription,
  generalElectionResultOptions,
  renderGeneralElectionResults,
} from './general_election';

const earlyElectionLeafMeta = {
  category: 'politics' as const,
  flow: 'inline.leaf' as const,
  series: ['government_crisis', 'elections', 'early_election'],
  tags: ['election', 'external'],
};

/**
 * Save-compatible legacy id. Presidential dissolution now waits for the date in
 * generalElectionSchedule and new campaigns resolve through general_election_results.
 */
export const earlyGeneralElectionResults: GameEvent = {
  id: 'early_general_election_results',
  meta: earlyElectionLeafMeta,
  condition: () => false,
  title: 'Results of the Early General Election',
  titleZh: '提前大选结果',
  description: generalElectionResultDescription.en,
  descriptionZh: generalElectionResultDescription.zh,
  renderContent: renderGeneralElectionResults,
  options: generalElectionResultOptions,
};
