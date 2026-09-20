import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { CARD_REGISTRY } from '../src/game/registries/cardRegistry';

const contentRoots = [
  'src/game/action_affairs',
  'src/game/government_affairs',
  'src/game/military_affairs',
  'src/game/events',
  'src/game/registries',
  'src/game/advisors',
  'src/game/journal',
];

const sourceFiles = (directory: string): string[] => fs.readdirSync(directory, { withFileTypes: true })
  .flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(entryPath);
    return /\.tsx?$/.test(entry.name) ? [entryPath] : [];
  });

const normalizePath = (file: string) => file.split(path.sep).join('/');
const allSourceFiles = sourceFiles('src');

const contextImports = contentRoots
  .flatMap(sourceFiles)
  .filter((file) => /from\s+['"][^'"]*GameContext['"]/.test(fs.readFileSync(file, 'utf8')));

assert.deepEqual(
  contextImports,
  [],
  `Content modules must receive state and dispatch through their contracts instead of importing GameContext: ${contextImports.join(', ')}`,
);

// Phase 2 removes the compatibility hook completely. New consumers must choose
// a read model, dispatch-only access, or the explicitly audited snapshot hook.
const compatibilityHookConsumers = allSourceFiles
  .flatMap((file) => {
    const callCount = fs.readFileSync(file, 'utf8').match(/\buseGame\s*\(\s*\)/g)?.length || 0;
    return callCount > 0 ? [[normalizePath(file), callCount] as const] : [];
  })
  .sort(([left], [right]) => left.localeCompare(right));

assert.deepEqual(compatibilityHookConsumers, [], 'useGame() is retired; use an explicit selector or action boundary.');
assert(
  !/export\s+const\s+useGame\b/.test(fs.readFileSync(path.join('src', 'game', 'GameContext.tsx'), 'utf8')),
  'The retired useGame compatibility export must not be restored.',
);

// Phase 3 keeps React store wiring separate from domain orchestration.
const gameContextSource = fs.readFileSync(path.join('src', 'game', 'GameContext.tsx'), 'utf8');
const forbiddenGameContextResponsibilities = [
  'resolveBattle',
  'executeAiTurn',
  'calculateAiMoves',
  'calculateMonthlyPipeline',
  "case 'NEXT_PHASE'",
  'checkEndings',
  'checkAchievements',
];
assert.deepEqual(
  forbiddenGameContextResponsibilities.filter((symbol) => gameContextSource.includes(symbol)),
  [],
  'GameContext must remain store wiring only; rules and reducer orchestration belong in extracted modules.',
);
assert(
  /from\s+['"]\.\/reducers\/gameReducer['"]/.test(gameContextSource),
  'GameContext must delegate state transitions to the root reducer.',
);

const rootReducerSource = fs.readFileSync(path.join('src', 'game', 'reducers', 'gameReducer.ts'), 'utf8');
assert(rootReducerSource.includes('advancePhase(state)'), 'NEXT_PHASE must delegate to the phase orchestrator.');
assert(rootReducerSource.includes('applyPostReducerPipeline(state, newState)'), 'Root actions must share one named post-reducer pipeline.');

const aiPlannerSource = fs.readFileSync(path.join('src', 'map', 'lib', 'gameAi.ts'), 'utf8');
assert(
  /state:\s*Pick<MapRuntimeState,\s*'mapResources'\s*\|\s*'provinces'\s*\|\s*'armies'>/.test(aiPlannerSource),
  'The map AI planner must accept the canonical narrow MapRuntimeState contract.',
);
assert(
  !/\bAiPlanningState\b|state\.resources\b/.test(aiPlannerSource),
  'The superseded AI-only state vocabulary must not return.',
);

// Phase 4 keeps one canonical GameState and makes the map model a leaf module.
const gameStateDeclarations = allSourceFiles.flatMap((file) => (
  [...fs.readFileSync(file, 'utf8').matchAll(/\b(?:interface|type)\s+GameState\b/g)].map(() => normalizePath(file))
));
assert.deepEqual(gameStateDeclarations, ['src/game/types.ts'], 'Only the application model may declare GameState.');

const mapTypesSource = fs.readFileSync(path.join('src', 'map', 'types_map.ts'), 'utf8');
assert(!/from\s+['"][^'"]*game\/types['"]/.test(mapTypesSource), 'Map types must not import the application GameState.');
assert(/export\s+interface\s+MapRuntimeState\b/.test(mapTypesSource), 'The map package must expose its canonical runtime contract.');

const mapViewSource = fs.readFileSync(path.join('src', 'map', 'MapView.tsx'), 'utf8');
assert(/\buseMapRuntimeState\s*\(/.test(mapViewSource), 'MapView must subscribe through the map runtime selector.');
assert(!/\bsidebarState\b|\bgetMilitiaRecruitmentPools\b|manpower:\s*15000/.test(mapViewSource), 'MapView must not rebuild map state or map defaults.');

const mapAiTurnSource = fs.readFileSync(path.join('src', 'game', 'rules', 'mapAiTurn.ts'), 'utf8');
assert(!/\bAiPlanningState\b|as\s+unknown\s+as\s+GameState/.test(mapAiTurnSource), 'Map AI execution must not bridge models with casts.');

const legacyMapBoundaryUses = allSourceFiles.filter((file) => (
  /\buseMapState\b|\bselectMapState\b/.test(fs.readFileSync(file, 'utf8'))
));
assert.deepEqual(legacyMapBoundaryUses, [], 'The legacy broad map selector boundary must stay deleted.');

// Phase 5 keeps card discovery, event scheduling, and save hydration independent.
assert(!fs.existsSync(path.join('src', 'game', 'data.ts')), 'The broad data.ts registry must stay deleted.');
assert(!fs.existsSync(path.join('src', 'game', 'events', 'index.ts')), 'Event definitions must not double as a runtime registry barrel.');

const legacyRegistryImports = allSourceFiles.filter((file) => (
  /from\s+['"][^'"]*(?:\/data|\/events)['"]/.test(fs.readFileSync(file, 'utf8'))
));
assert.deepEqual(legacyRegistryImports, [], 'Production code must import one explicit registry or one event definition.');

const cardRegistrySource = fs.readFileSync(path.join('src', 'game', 'registries', 'cardRegistry.ts'), 'utf8');
const scheduledRegistrySource = fs.readFileSync(path.join('src', 'game', 'registries', 'scheduledEventRegistry.ts'), 'utf8');
assert(!/scheduledEventRegistry|restorableEventRegistry/.test(cardRegistrySource), 'Card registration must not load event registries.');
assert(!/cardRegistry|restorableEventRegistry/.test(scheduledRegistrySource), 'Event scheduling must not load card or hydration registries.');

const snapshotHookConsumers = allSourceFiles
  .flatMap((file) => {
    const callCount = fs.readFileSync(file, 'utf8').match(/\buseGameSnapshotWhen\s*\(/g)?.length || 0;
    return callCount > 0 ? [[normalizePath(file), callCount] as const] : [];
  })
  .sort(([left], [right]) => left.localeCompare(right));

assert.deepEqual(snapshotHookConsumers, [
  ['src/components/MainArea.tsx', 1],
  ['src/components/SandboxMenu.tsx', 1],
  ['src/components/SaveManagerModal.tsx', 1],
], 'Full snapshots are restricted to custom event content and mounted save/debug editors.');

const rawFullSnapshotConsumers = allSourceFiles.filter((file) => (
  /useGameSelector\s*\(\s*([A-Za-z_$][\w$]*)\s*=>\s*\1\s*[,)]/.test(fs.readFileSync(file, 'utf8'))
));
assert.deepEqual(rawFullSnapshotConsumers, [], 'Use a named domain selector or useGameSnapshotWhen() instead of a raw full-state selector.');

const selectorFile = path.join('src', 'game', 'selectors.ts');
const selectorSource = fs.readFileSync(selectorFile, 'utf8');
const exportedSelectors = [...selectorSource.matchAll(/export const (select[A-Za-z0-9_]+)/g)].map((match) => match[1]);
const selectorConsumerSources = allSourceFiles
  .filter((file) => normalizePath(file) !== normalizePath(selectorFile))
  .map((file) => fs.readFileSync(file, 'utf8'));

for (const selector of exportedSelectors) {
  assert(
    selectorConsumerSources.some((source) => new RegExp(`\\b${selector}\\b`).test(source)),
    `Selector ${selector} must have a production consumer. Delete speculative selectors instead of carrying them forward.`,
  );
}

// Phase 6 keeps migration-only shapes at the deserialization boundary and
// prevents deleted compatibility entry points from growing back.
[
  path.join('src', 'game', 'reducers', 'index.ts'),
  path.join('src', 'game', 'rules', 'index.ts'),
  path.join('tools', 'sim.mjs'),
  path.join('tools', 'driver.ts'),
  path.join('tools', 'check_unused_imports.cjs'),
].forEach((removedPath) => {
  assert(!fs.existsSync(removedPath), `${normalizePath(removedPath)} is a retired migration artifact and must stay deleted.`);
});

const runtimeSources = allSourceFiles
  .filter((file) => normalizePath(file) !== 'src/game/saveMigrations.ts')
  .map((file) => fs.readFileSync(file, 'utf8'));
assert(
  runtimeSources.every((source) => !/\bmilitiaManpower\b|armedForces(?:\?|)\.militias\b/.test(source)),
  'Legacy militia views may exist only inside saveMigrations.ts.',
);
assert(
  runtimeSources.every((source) => !/\bPOLICY_DEFINITIONS\b|\bPOLICY_DEFINITION_BY_ID\b|\bmapAiConfig\b/.test(source)),
  'Retired policy-definition aliases and map AI scaffold fields must stay deleted.',
);

const gameStateSource = fs.readFileSync(path.join('src', 'game', 'types.ts'), 'utf8');
[
  'warRuntime',
  'fe_leadership_crisis',
  'africaArmyStatus',
  'molaStatus',
  'francoAfricaControl',
  'usa_total_embargo',
].forEach((retainedField) => {
  assert(new RegExp(`\\b${retainedField}\\b`).test(gameStateSource), `${retainedField} is intentionally reserved for future gameplay and must remain in GameState.`);
});

const cardIds = CARD_REGISTRY.map((card) => card.id);
assert.equal(new Set(cardIds).size, cardIds.length, 'The runtime card registry must not contain duplicate ids.');
assert(cardIds.includes('fiscal_policy'), 'The fiscal policy card must remain available through the runtime registry.');

console.log(`Architecture boundary tests passed (${sourceFiles('src/game').length} game source files scanned).`);
