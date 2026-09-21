import type { GameEvent } from '../types';
import * as elections1931Definitions from '../events/elections_1931_results';
import * as elections1933Definitions from '../events/elections_1933';
import * as casasViejasDefinitions from '../events/casas_viejas';
import * as civilWarSetupDefinitions from '../events/civil_war/civil_war_setup';
import * as wartimeArrangementDefinitions from '../events/civil_war/wartime_power_arrangement';
import * as mayDaysDefinitions from '../events/civil_war/may_days';
import * as elections1936Definitions from '../events/elections_1936';
import * as earlyElectionDefinitions from '../events/early_general_election';
import * as generalElectionDefinitions from '../events/general_election';
import { coalitionDissolutionEvents } from '../events/coalition_dissolution';
import * as ramonCampaignDefinitions from '../events/ramon_campaign_events';
import * as presidentialElectionDefinitions from '../events/presidential_election_chain';
import * as asturiasDefinitions from '../events/asturias_revolution';
import * as cntThirdCongressDefinitions from '../events/cnt_third_congress';
import * as cntFourthCongressDefinitions from '../events/cnt_fourth_congress';
import { SCHEDULED_EVENT_REGISTRY } from './scheduledEventRegistry';
import { mergeRegistryDefinitions } from './registryUtils';

const isGameEvent = (value: unknown): value is GameEvent => Boolean(
  value
  && typeof value === 'object'
  && typeof (value as GameEvent).id === 'string'
  && Array.isArray((value as GameEvent).options),
);

const eventDefinitionsFrom = (module: Record<string, unknown>): GameEvent[] => (
  Object.values(module).filter(isGameEvent)
);

/**
 * Definitions capable of rebuilding persisted event callbacks. Unlike the
 * scheduler, this catalog deliberately includes external roots, nodes and leaves.
 */
export const RESTORABLE_EVENT_REGISTRY: GameEvent[] = mergeRegistryDefinitions('restorable event', [
  ...SCHEDULED_EVENT_REGISTRY,
  ...eventDefinitionsFrom(elections1931Definitions),
  ...eventDefinitionsFrom(elections1933Definitions),
  ...eventDefinitionsFrom(casasViejasDefinitions),
  ...eventDefinitionsFrom(civilWarSetupDefinitions),
  ...eventDefinitionsFrom(wartimeArrangementDefinitions),
  ...eventDefinitionsFrom(mayDaysDefinitions),
  ...eventDefinitionsFrom(elections1936Definitions),
  ...eventDefinitionsFrom(earlyElectionDefinitions),
  ...eventDefinitionsFrom(generalElectionDefinitions),
  ...coalitionDissolutionEvents,
  ...eventDefinitionsFrom(ramonCampaignDefinitions),
  ...eventDefinitionsFrom(presidentialElectionDefinitions),
  ...eventDefinitionsFrom(asturiasDefinitions),
  ...eventDefinitionsFrom(cntThirdCongressDefinitions),
  ...eventDefinitionsFrom(cntFourthCongressDefinitions),
]);
