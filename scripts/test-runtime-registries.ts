import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { CARD_REGISTRY } from '../src/game/registries/cardRegistry';
import { SCHEDULED_EVENT_REGISTRY } from '../src/game/registries/scheduledEventRegistry';
import { RESTORABLE_EVENT_REGISTRY } from '../src/game/registries/restorableEventRegistry';
import { INITIAL_ADVISORS } from '../src/game/advisors';
import { PRE_START_STATE } from '../src/game/scenarios';
import { civilWarSetup, civilWarStep31 } from '../src/game/events/civil_war/civil_war_setup';
import { elections1931Results } from '../src/game/events/elections_1931_results';
import { cabinetFormation1931 } from '../src/game/events/elections_1931_results';
import { ramonCampaignEvent1 } from '../src/game/events/ramon_campaign_events';
import { coalitionDissolutionEvents } from '../src/game/events/coalition_dissolution';
import { deserializeGameState, serializeGameState } from '../src/game/saveGame';

const uniqueIds = (name: string, values: readonly { id: string }[]) => {
  const ids = values.map((value) => value.id);
  assert.equal(new Set(ids).size, ids.length, `${name} must not contain duplicate ids.`);
  return new Set(ids);
};

const cardIds = uniqueIds('Card registry', CARD_REGISTRY);
const scheduledIds = uniqueIds('Scheduled event registry', SCHEDULED_EVENT_REGISTRY);
const restorableIds = uniqueIds('Restorable event registry', RESTORABLE_EVENT_REGISTRY);
assert(cardIds.size > 0);

for (const event of SCHEDULED_EVENT_REGISTRY) {
  assert(event.date || event.condition, `Scheduled event ${event.id} needs a scheduling contract.`);
  assert(
    event.meta?.flow === 'solo' || event.meta?.flow === 'inline.root',
    `Chain-only event ${event.id} must not enter the scheduled registry.`,
  );
  assert(restorableIds.has(event.id), `Scheduled event ${event.id} must also be restorable.`);
  assert.equal(
    RESTORABLE_EVENT_REGISTRY.find((candidate) => candidate.id === event.id),
    event,
    `Scheduled and restorable registries must share one definition for ${event.id}.`,
  );
}

for (const event of [civilWarSetup, elections1931Results, cabinetFormation1931, ramonCampaignEvent1, civilWarStep31]) {
  assert(!scheduledIds.has(event.id), `${event.id} is entered externally or through a chain, not by the scheduler.`);
  assert(restorableIds.has(event.id), `${event.id} must remain available to save hydration.`);
}

const eventFiles = (directory: string): string[] => fs.readdirSync(directory, { withFileTypes: true })
  .flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return eventFiles(entryPath);
    return /\.tsx?$/.test(entry.name) ? [entryPath] : [];
  });

/** Read authored definitions statically; importing editor metadata is never runtime scheduling logic. */
const literalAuthoredEventIds = eventFiles(path.join('src', 'game', 'events')).flatMap((file) => {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  return source.statements.flatMap((statement) => {
    if (!ts.isVariableStatement(statement)
      || !statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) return [];
    return statement.declarationList.declarations.flatMap((declaration) => {
      if (declaration.type?.getText(source) !== 'GameEvent' || !declaration.initializer || !ts.isObjectLiteralExpression(declaration.initializer)) return [];
      const idProperty = declaration.initializer.properties.find((property): property is ts.PropertyAssignment => (
        ts.isPropertyAssignment(property) && property.name.getText(source) === 'id'
      ));
      return idProperty && ts.isStringLiteral(idProperty.initializer) ? [idProperty.initializer.text] : [];
    });
  });
});
const authoredEventIds = [
  ...literalAuthoredEventIds,
  ...coalitionDissolutionEvents.map(event => event.id),
];

assert.equal(new Set(authoredEventIds).size, authoredEventIds.length, 'Authored GameEvent ids must be unique.');
assert.deepEqual(
  [...new Set(authoredEventIds)].filter((id) => !restorableIds.has(id)),
  [],
  'Every exported authored GameEvent must be present in the restorable registry.',
);
assert.equal(restorableIds.size, authoredEventIds.length, 'The restorable registry must contain exactly the authored event definitions.');

const chainState = {
  ...PRE_START_STATE,
  screen: 'game' as const,
  phase: 'event' as const,
  currentEvent: civilWarStep31,
  pendingEvents: [],
};
const restored = deserializeGameState(serializeGameState(chainState), {
  cards: CARD_REGISTRY,
  advisors: INITIAL_ADVISORS,
  events: RESTORABLE_EVENT_REGISTRY,
});
assert.equal(restored.currentEvent?.id, civilWarStep31.id);
assert.equal(typeof restored.currentEvent?.options[0]?.effect, 'function', 'Chain-only callbacks must hydrate without scheduler registration.');

console.log(`Runtime registries passed: ${CARD_REGISTRY.length} cards, ${SCHEDULED_EVENT_REGISTRY.length} scheduled events, ${RESTORABLE_EVENT_REGISTRY.length} restorable events.`);
