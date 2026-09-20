# Architecture Migration Plan

## Goals

- Keep gameplay and save behavior unchanged while reducing dependency direction and state coupling.
- Make content definitions importable without React context or application-store initialization.
- Let UI consumers subscribe to the smallest stable read model they need.
- Reduce `GameContext.tsx` to store wiring and root orchestration.
- End with one canonical game state model and explicit scheduled/restorable registries.

## Target dependency direction

```text
React UI
  -> selectors + dispatch contracts
  -> stable game store
  -> root reducer / phase orchestrator
  -> domain reducers and pure rules
  -> domain types

content registries
  -> cards / events / advisors
  -> domain types and pure rules

map UI / AI
  -> one MapRuntimeState selected from the canonical GameState
```

Content, rules, and domain types must never import `GameContext`.

## Migration rules

1. Each change set must preserve current behavior and have a focused regression test.
2. Do not rename persisted fields while moving code. Save-schema changes require a separate migration.
3. Compatibility exports must have a named consumer and a removal phase.
4. Add selectors for real consumers, not for API symmetry.
5. Prefer pure extraction over new classes, factories, services, or generic effect DSLs.
6. Do not combine reducer extraction with balance changes or card-content rewrites.

## Phase 0 - Baseline and guardrails

Status: completed for the first migration slice.

- Run type checking, coalition audit, existing behavior tests, and production builds.
- Add an architecture test that imports the runtime card registry and rejects content imports of `GameContext`.
- Keep Node/tsx-compatible infrastructure so reducer tests do not require Vite globals.

Exit criteria:

- All existing test scripts pass.
- Main application and local editor build.
- Runtime card registries can be imported independently.

## Phase 1 - Dependency inversion and selector foundation

Status: completed.

- Move pure selectors out of `GameContext.tsx` into `src/game/selectors.ts`.
- Preserve selector re-exports temporarily so existing imports do not break.
- Inject `state` and the narrow dispatch contract into custom card/event UI.
- Remove every content-layer import of `GameContext`.
- Migrate screens that can use stable, narrow selectors without changing domain contracts.

Completed in the first slice:

- Fiscal-policy custom UI receives `state` and `dispatch` through `renderContent`.
- Pure selectors live in `src/game/selectors.ts`.
- `EndingScreen` remains unsubscribed until a real ending exists.
- `SaveManagerModal` subscribes to a full snapshot only while it is open.
- Unused speculative economy, political, and save selector wrappers were removed instead of being carried forward.

Completed in the closing slice:

- `MainArea`, deck controls, and the card selector use narrow subscriptions plus the dispatch-only hook.
- `SandboxMenu` takes a full snapshot only while open and is unsubscribed while hidden.
- Selector caching now invalidates on selector/equality changes as well as store snapshot changes, so prop- or local-state-dependent selectors cannot return a stale cached slice.
- Presentational `SidePanel` children receive already-read display data instead of creating nested full-store subscriptions.
- The architecture guard now rejects new `useGame()` consumers and exported selectors without production consumers.
- The four remaining compatibility-hook calls are explicit Phase 2 inputs:
  - `AdvisorPanel` evaluates advisor conditions and subtitles against the complete state contract;
  - `EventModal` evaluates event text, conditions, effect previews, and custom render callbacks;
  - `CardView` evaluates card conditions against the complete state contract;
  - the root `SidePanel` currently renders a broad cross-domain diagnostic/read model.

Exit criteria:

- `rg "GameContext" src/game/{events,action_affairs,government_affairs,military_affairs,advisors,journal}` returns no imports.
- Components no longer use `useGame()` when a narrow selector is sufficient.
- Every added selector has at least one consumer.

Exit result: all criteria satisfied. The remaining full-state consumers are not simple field readers; replacing them safely requires the Phase 2 view-model work described below.

Completion verification: type checking and coalition audit, architecture boundaries, production build, and all existing domain/save/scenario regression scripts pass.

## Phase 2 - Complete UI subscription migration

Status: completed.

- Classify consumers into:
  - simple field readers;
  - derived read-model consumers;
  - callback-heavy consumers whose conditions currently require full `GameState`;
  - snapshot-on-demand consumers such as save management.
- Use direct selectors for simple readers.
- Build memoized view-model selectors for card, event, and advisor availability instead of passing the whole state merely to call `condition(state)` during rendering.
- For save and sandbox operations, read a snapshot only while the modal is open or through a narrow store query API; do not keep hidden modals subscribed.
- Move leaf components away from nested `useGame()` subscriptions by passing already-selected display data.

Completed implementation:

- Removed the `useGame()` compatibility hook and its state-bearing context type.
- Added equality-stabilized event, card, advisor, journal, economy, political, law, and SidePanel read boundaries.
- Moved dynamic event titles/options, card conditions, advisor availability, and journal progress callbacks into pure view-model selectors.
- Restricted full snapshots to mounted custom event content, save management, and sandbox editing through `useGameSnapshotWhen`.
- Split top-bar detail modals so each subscribes only to its own domain equality boundary while mounted.
- Added architecture guards for the retired hook, raw full-state selectors, the audited snapshot allowlist, and selectors without consumers.
- Added focused stable-slice/changed-slice regression coverage in `test:selectors`.

Exit criteria:

- `useGame()` has no production consumers.
- The compatibility hook is deleted.
- Economy, political, event, map, ending, advisor, and save UI have explicit read boundaries.
- Selector equality behavior has focused tests for stable and changed slices.

Exit audit: all criteria are satisfied. Selector and architecture tests, the complete domain/save/scenario regression suite, editor build, and production build pass.

## Phase 3 - Extract root orchestration from GameContext

Status: completed.

- Extract battle resolution into a pure combat module.
- Extract AI-turn execution behind a typed `MapRuntimeState` contract.
- Extract `NEXT_PHASE` into an explicit phase/month orchestrator.
- Move ending and achievement post-processing behind one named post-reducer pipeline.
- Keep `GameContext.tsx` responsible only for store construction, subscription, autosave triggering, and reducer dispatch.

Completed implementation:

- Moved battle resolution to `rules/combat.ts` and made its random source injectable.
- Moved AI turn execution to `rules/mapAiTurn.ts` and initially narrowed it behind transitional runtime contracts; Phase 4 replaced those contracts with the canonical `MapRuntimeState`.
- Moved `NEXT_PHASE` month/phase ordering to `rules/phaseOrchestrator.ts`.
- Moved invariant repair, ending detection, and achievement tracking to one `reducers/postReducer.ts` pipeline.
- Moved the root reducer to `reducers/gameReducer.ts`; `GameContext.tsx` now contains only store/provider/hook wiring.
- Added deterministic combat, AI-turn, and phase-ordering coverage in `test:orchestration`, plus architecture guards that prevent these responsibilities from returning to the context.

Exit criteria:

- `GameContext.tsx` contains no combat arithmetic, AI planning, or monthly business rules.
- Extracted functions have deterministic tests.
- Phase ordering remains covered by wartime, May Days, rules, and save tests.

Exit audit: all code criteria are satisfied. Type checking, coalition audit, effect-preview, armament-income, rules, wartime, May Days, union-share, save, architecture-boundary, selector, scenario-parity, deterministic orchestration tests, and the production build pass. The build retains the pre-existing large-chunk warning but reports no error.

## Phase 4 - Unify the map state boundary

Status: completed.

- Move shared map identifiers and entity types into a leaf model that does not import `GameState`.
- Replace `src/map/types_map.ts::GameState` with a minimal `MapRuntimeState`.
- Implement one `selectMapRuntimeState` adapter.
- Migrate Sidebar and AI to that contract.
- Remove manually duplicated default resources and `as any` adapters.

Completed implementation:

- Removed the duplicate map `GameState`; the application `GameState` now extends the leaf `MapRuntimeState` contract.
- Moved map-owned identifiers, army provenance, and Iberian-defense runtime types into `map/types_map.ts`, which no longer imports from the game layer.
- Added `selectMapRuntimeState` and migrated `MapView`/`Sidebar` to canonical `map*` field names without rebuilding an alias-shaped sidebar state.
- Isolated organization-dependent militia recruitment behind `selectMapRecruitmentPools`, so it does not widen the map runtime contract.
- Migrated the AI planner, AI turn executor, faction rules, and capitulation settlement to `MapRuntimeState`; removed the transitional `AiPlanningState` model and `GameState` bridge casts.
- Centralized map resource defaults in `createDefaultMapResources`; removed duplicated UI fallbacks and applied the same defaults to scenarios, the editor sandbox, and old-save normalization.
- Added save migration coverage for absent and partial map state, selector stability tests, and architecture guards for the single-`GameState` and leaf-module boundaries.
- Kept `mapReducer` on the full application `GameState` because recruitment deliberately writes organization-owned armed-entity pools; forcing that write path through the UI read model would hide a real cross-domain transaction rather than simplify it.

Exit criteria:

- Only one type is named `GameState`.
- No `game/types -> map/types -> game/types` cycle remains.
- Map AI, map reducer, saves, and all war tests pass.

Exit audit: all criteria are satisfied. Type checking, coalition audit, effect-preview, armament-income, rules, wartime, May Days, union-share, save, architecture-boundary, selector, scenario-parity, deterministic orchestration tests, and the production build pass. The build retains the pre-existing large-chunk warning but reports no error.

## Phase 5 - Separate runtime registries

Status: completed.

- Replace the broad `data.ts` dependency with explicit registries:
  - `cardRegistry`;
  - `scheduledEventRegistry`;
  - `restorableEventRegistry`.
- Keep inline nodes/leaves out of the scheduled registry unless they are explicit entry points.
- Add uniqueness, classification, hydration, and independent-import tests.

Completed implementation:

- Replaced `data.ts` with the explicit `CARD_REGISTRY`, `SCHEDULED_EVENT_REGISTRY`, and `RESTORABLE_EVENT_REGISTRY` modules under `game/registries`.
- Removed the event-directory runtime barrel; production consumers now import either one registry or one concrete event definition.
- Reduced the scheduler catalog to 57 actual date/condition/forced-entry candidates. It contains only `solo` and `inline.root` definitions; external roots and all chain nodes/leaves are excluded.
- Built a separate 130-definition hydration catalog containing all scheduled events plus every exported external root, node, and leaf, while rejecting conflicting persisted IDs.
- Switched reducer hydration from the scheduler catalog to the restorable catalog, so chain-only callbacks survive both serialized save loading and `LOAD_STATE` transitions.
- Added registry-level duplicate checks and focused tests for uniqueness, classification, authored-event coverage, chain-only hydration, shared definition identity, and import independence.
- Kept `GameEvent.meta` editor-only: production registration is an explicit list and does not filter or trigger events from `meta.flow`.

Exit criteria:

- Scheduled events and save hydration have separate types and tests.
- Content registration cannot introduce application-store dependencies.
- No chain-only node can enter monthly scheduling accidentally.

Exit audit: all criteria are satisfied. `test:registries` verifies 26 cards, 57 scheduled events, and 130 restorable event definitions. Type checking, coalition audit, effect-preview, armament-income, rules, wartime, May Days, union-share, save, architecture-boundary, selector, registry, scenario-parity, deterministic orchestration tests, and the production build pass. The build retains the pre-existing large-chunk warning but reports no error.

## Phase 6 - Remove migration scaffolding and dead code

Status: completed.

- Delete unused selector hooks, compatibility aliases, unused barrels, and superseded preview helpers.
- Move legacy save compatibility into explicit deserialization migrations.
- Decide each write-only state field: implement its consumer, migrate it, or delete it.
- Fix or remove one-off tools that are not part of package scripts and CI.

Completed implementation:

- Deleted the unused reducer/rules barrels, GameContext compatibility re-exports, speculative type aliases, preview helpers, old policy-formatting UI, and other statically verified unused symbols.
- Replaced the `POLICY_DEFINITIONS` compatibility path with the canonical `LAW_DEFINITIONS` / `LAW_DEFINITION_BY_ID` exports and migrated every consumer.
- Centralized old-save repair in `saveMigrations.ts`. Runtime organization and combat code now uses `armedForces.entityPools` as the only militia manpower/equipment model; legacy `militias`, organization `militiaManpower`, old organization IDs, and old pool IDs exist only inside the migration boundary and migration tests.
- Deleted the orphaned `tools/sim.mjs`, `tools/driver.ts`, and `tools/check_unused_imports.cjs` utilities and removed their stale documentation references.
- Removed four unused local editor roadmap implementations and the superseded one-shot sandbox execution API while keeping the active flow workbench and session-based test bench.
- Deleted `mapAiConfig` and the confirmed dead fields `educationSecularized`, `womensRightsReformed`, `internationalBrigadesArrived`, and `navyStatus`.
- Intentionally retained `warRuntime`, `fe_leadership_crisis`, `africaArmyStatus`, `molaStatus`, `francoAfricaControl`, and `usa_total_embargo` for planned gameplay. Architecture tests protect this explicit allowlist from accidental cleanup.
- Enabled `noUnusedLocals` for the repository and added architecture guards that keep deleted barrels, legacy runtime militia fields, policy aliases, and orphan tools from returning.

Exit criteria:

- Every compatibility layer has a current consumer.
- Every persisted field is read by gameplay/UI or documented as migration-only.
- Static unused-export and invalid-tool checks run in CI.

Exit audit: all criteria are satisfied for the verified cleanup scope. Type checking, coalition audit, effect-preview, armament-income, rules, wartime, May Days, union-share, save migration, architecture-boundary, selector, registry, scenario-parity, deterministic orchestration tests, the main production build, and the local editor build pass. Both Vite builds retain only their pre-existing large-chunk warnings.

## Phase 7 - Tighten compiler and build boundaries

Status: in progress (`noUnusedLocals` completed; parameter and strictness rollout remains).

- Enable `noUnusedLocals` and `noUnusedParameters` directory by directory.
- Enable strict options incrementally after the state and map boundaries are stable.
- Introduce lazy loading only at real screen/content boundaries; do not split declarative content into artificial services.
- Add a single aggregate test command for CI.

Exit criteria:

- Strictness exceptions are explicit and localized.
- Main regressions, architecture boundaries, and builds are covered by one CI workflow.
- The temporary selector re-exports from `GameContext` are removed.

## Recommended change-set order

1. Dependency-cycle fix and selector extraction.
2. Read-only/presentational UI consumers.
3. Callback-heavy UI read models.
4. Root reducer orchestration extraction.
5. Map state unification.
6. Registry separation.
7. Compatibility/dead-code deletion and stricter compiler settings.

Do not combine phases 3-5 in one change set; they touch the same central state flow and need independent rollback points.
