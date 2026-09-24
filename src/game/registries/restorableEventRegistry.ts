import type { GameEvent } from '../types';
import * as elections1931Definitions from '../events/elections_1931_results';
import * as elections1933Definitions from '../events/elections_1933';
import * as casasViejasDefinitions from '../events/casas_viejas';
import * as civilWarSetupDefinitions from '../events/civil_war/civil_war_setup';
import * as wartimeArrangementDefinitions from '../events/civil_war/wartime_power_arrangement';
import * as militarizationDefinitions from '../events/civil_war/militarization_crossroads';
import * as militiaLegalityDefinitions from '../events/civil_war/militia_legality';
import * as mayDaysDefinitions from '../events/civil_war/may_days';
import * as elections1936Definitions from '../events/elections_1936';
import * as generalElectionDefinitions from '../events/general_election';
import { coalitionDissolutionEvents } from '../events/coalition_dissolution';
import * as ramonCampaignDefinitions from '../events/ramon_campaign_events';
import * as presidentialElectionDefinitions from '../events/presidential_election_chain';
import * as asturiasDefinitions from '../events/asturias_revolution';
import * as cntThirdCongressDefinitions from '../events/cnt_third_congress';
import * as cntFourthCongressDefinitions from '../events/cnt_fourth_congress';
import { SCHEDULED_EVENT_REGISTRY } from './scheduledEventRegistry';
import { mergeRegistryDefinitions } from './registryUtils';
import * as economyDefinitions from '../events/economy';

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
 * 事件定义只能在调度表里出现一次的例外集合。
 *
 * 经济改造的开始事件是"可还原但不可调度"的：它们必须能被读档还原（否则旧档里正在展示的
 * 开始事件会失去 effect），但不进 `SCHEDULED_EVENT_REGISTRY`——它们的入队由编排层决定
 * （开局强制入队 / 战时权力安排后强制入队，见 `rules/monthlyPipeline.ts`）。
 */
const RESTORABLE_ONLY_EVENT_IDS = new Set<string>([
  'economy_free_commune_start',
  'economy_cooperative_path',
  'economy_after_the_revolution',
  'economy_wartime_route_choice',
]);

const economyRestorableEvents = (): GameEvent[] => (
  [...eventDefinitionsFrom(economyDefinitions), ...SCHEDULED_EVENT_REGISTRY]
    .filter((event) => !RESTORABLE_ONLY_EVENT_IDS.has(event.id))
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
  ...eventDefinitionsFrom(militarizationDefinitions),
  ...eventDefinitionsFrom(militiaLegalityDefinitions),
  ...eventDefinitionsFrom(mayDaysDefinitions),
  ...eventDefinitionsFrom(elections1936Definitions),
  ...eventDefinitionsFrom(generalElectionDefinitions),
  ...coalitionDissolutionEvents,
  ...eventDefinitionsFrom(ramonCampaignDefinitions),
  ...eventDefinitionsFrom(presidentialElectionDefinitions),
  ...eventDefinitionsFrom(asturiasDefinitions),
  ...eventDefinitionsFrom(cntThirdCongressDefinitions),
  ...eventDefinitionsFrom(cntFourthCongressDefinitions),
  // 经济改造：结果/失败/中间事件（`condition: () => false`，只由日志管线或卡牌选项推入），
  // 加上四个"可还原但不可调度"的开始事件（见 RESTORABLE_ONLY_EVENT_IDS 的说明）。
  ...economyRestorableEvents(),
]);
