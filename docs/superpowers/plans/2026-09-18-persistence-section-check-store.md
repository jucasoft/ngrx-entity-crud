# sectionCheck via Store Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `NecRestoreSearchComponent`'s `Injector.get(effects).sectionCheck$` with a normal NgRx selector, so the component never resolves an Effects class directly.

**Architecture:** Three new factories in `ngrx-entity-crud/persistence` — `createPersistenceReducer(feature)`, `createPersistenceSelectors(feature)` and a `createSectionCheckSuccessAction(feature)` action shared by both — sit next to the existing `createPersistenceEffects(config)`. The check effect (`autoRestoreCheckOn$`) dispatches the new action instead of writing to a `ReplaySubject`; a new, separate effect (`autoRestoreTriggerOn$`) turns a triggered check into `RestoreRequest`. `NecRestoreSearchComponent` swaps `@Input() effects!: Type<NecPersistenceEffects>` (resolved via `Injector`) for `@Input() selectors!: NecPersistenceSelectors` (read via `Store.select`).

**Tech Stack:** Angular (standalone components), `@ngrx/store` 19.2.1, `@ngrx/effects` 19.2.1, Jest, Angular schematics (EJS templates).

**Spec:** `docs/superpowers/specs/2026-09-17-persistence-section-check-store-design.md`

## Global Constraints

- No backward-compatibility shim: `19.4.0-beta` is not yet a stable release, so `@Input() effects` and `sectionCheck$` are removed outright, not deprecated.
- `libs/ngrx-entity-crud/persistence/models.ts` stays agnostic from the core (`src/lib`) — unchanged by this plan, still true after it.
- Every new action's `type` must be scoped per `feature` (`[${feature} Persistence] Section Check Success`), same mechanism `createCrudActions<T>(name)` already uses in the core, so a reducer only reacts to its own section's actions via `on()`'s type match — never by filtering a `feature` field in the payload by hand.
- Only `schematics/store/files/crud-store/plural/__clazz@dasherize__-store/__clazz@dasherize__-store.module.ts` references `createPersistenceEffects` today (`--persist`, CRUD-PLURAL only); `singular` is not involved.
- Run `npm run testLibs` after every task; every task must leave the suite green before its commit.

---

### Task 1: Relocate `NecSectionCheck` into `models.ts`

Pure move, no behavior change — a clean base for the new files in Tasks 2-4, which need `NecSectionCheck` without importing it from `nec-persistence-effects.ts` (that file will itself depend on the new action module in Task 5, which would create a circular import if `NecSectionCheck` stayed there).

**Files:**
- Modify: `libs/ngrx-entity-crud/persistence/models.ts`
- Modify: `libs/ngrx-entity-crud/persistence/nec-persistence-effects.ts`
- Modify: `libs/ngrx-entity-crud/persistence/nec-restore-search.component.ts`
- Modify: `libs/ngrx-entity-crud/persistence/nec-persistence-effects.spec.ts`
- Modify: `libs/ngrx-entity-crud/persistence/nec-restore-search.component.spec.ts`

**Interfaces:**
- Produces: `NecSectionCheck` (interface, unchanged shape: `{ stats: NecSectionStats | null; autoRestoreTriggered: boolean }`), now exported from `./models` instead of `./nec-persistence-effects`.

- [ ] **Step 1: Run the full persistence suite as a baseline**

Run: `npx nx test ngrx-entity-crud --testPathPattern=persistence`
Expected: PASS (all existing persistence tests green before touching anything)

- [ ] **Step 2: Add `NecSectionCheck` to `models.ts`**

In `libs/ngrx-entity-crud/persistence/models.ts`, after the `NecSectionStats` interface (after the closing `}` on line 38), add:

```ts

/** Esito del check leggero eseguito alla creazione della sezione (decisioni 11/12 del piano). */
export interface NecSectionCheck {
  stats: NecSectionStats | null;
  autoRestoreTriggered: boolean;
}
```

- [ ] **Step 3: Remove the interface from `nec-persistence-effects.ts` and import it from `models.ts`**

In `libs/ngrx-entity-crud/persistence/nec-persistence-effects.ts`:

Replace:
```ts
import {NecAutoRestoreConfig, NecPersistenceConfig, NecSectionStats} from './models';
```
with:
```ts
import {NecAutoRestoreConfig, NecPersistenceConfig, NecSectionCheck, NecSectionStats} from './models';
```

Delete this block entirely (it now lives in `models.ts`):
```ts
/** Esito del check leggero eseguito alla creazione della sezione (decisioni 11/12 del piano). */
export interface NecSectionCheck {
  stats: NecSectionStats | null;
  autoRestoreTriggered: boolean;
}
```

- [ ] **Step 4: Update the two consumers of `NecSectionCheck`**

In `libs/ngrx-entity-crud/persistence/nec-restore-search.component.ts`, replace:
```ts
import {NecPersistenceEffects, NecSectionCheck} from './nec-persistence-effects';
import {NecSectionStats} from './models';
```
with:
```ts
import {NecPersistenceEffects} from './nec-persistence-effects';
import {NecSectionCheck, NecSectionStats} from './models';
```

In `libs/ngrx-entity-crud/persistence/nec-persistence-effects.spec.ts`, replace:
```ts
import {createPersistenceEffects, NecSectionCheck} from './nec-persistence-effects';
import {NecPersistenceService} from './nec-persistence.service';
import {NecAutoRestoreConfig, NecPersistenceConfig, NecSectionStats} from './models';
```
with:
```ts
import {createPersistenceEffects} from './nec-persistence-effects';
import {NecPersistenceService} from './nec-persistence.service';
import {NecAutoRestoreConfig, NecPersistenceConfig, NecSectionCheck, NecSectionStats} from './models';
```

In `libs/ngrx-entity-crud/persistence/nec-restore-search.component.spec.ts`, replace:
```ts
import {NecPersistenceEffects, NecSectionCheck} from './nec-persistence-effects';
import {NecSectionStats} from './models';
```
with:
```ts
import {NecPersistenceEffects} from './nec-persistence-effects';
import {NecSectionCheck, NecSectionStats} from './models';
```

- [ ] **Step 5: Run the suite again — same result as the baseline**

Run: `npx nx test ngrx-entity-crud --testPathPattern=persistence`
Expected: PASS, same test count as Step 1

- [ ] **Step 6: Commit**

```bash
git add libs/ngrx-entity-crud/persistence/models.ts libs/ngrx-entity-crud/persistence/nec-persistence-effects.ts libs/ngrx-entity-crud/persistence/nec-restore-search.component.ts libs/ngrx-entity-crud/persistence/nec-persistence-effects.spec.ts libs/ngrx-entity-crud/persistence/nec-restore-search.component.spec.ts
git commit -m "$(cat <<'EOF'
refactor(persistence): move NecSectionCheck into models.ts

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: `createSectionCheckSuccessAction`

**Files:**
- Create: `libs/ngrx-entity-crud/persistence/nec-persistence-actions.ts`
- Test: `libs/ngrx-entity-crud/persistence/nec-persistence-actions.spec.ts`

**Interfaces:**
- Consumes: `NecSectionCheck` from `./models` (Task 1).
- Produces: `createSectionCheckSuccessAction(feature: string)` — an `@ngrx/store` action creator with `type` = `` `[${feature} Persistence] Section Check Success` `` and payload `{ check: NecSectionCheck }`. Called independently by `createPersistenceEffects` (Task 5) and `createPersistenceReducer` (Task 3) — both must pass the same `feature` string to get a matching `type`.

- [ ] **Step 1: Write the failing test**

Create `libs/ngrx-entity-crud/persistence/nec-persistence-actions.spec.ts`:

```ts
import {createSectionCheckSuccessAction} from './nec-persistence-actions';

describe('createSectionCheckSuccessAction', () => {
  it('produce un type scoped sulla feature', () => {
    const action = createSectionCheckSuccessAction('coins');
    expect(action.type).toBe('[coins Persistence] Section Check Success');
  });

  it('feature diverse producono type diversi', () => {
    const coins = createSectionCheckSuccessAction('coins');
    const orders = createSectionCheckSuccessAction('orders');
    expect(coins.type).not.toBe(orders.type);
  });

  it('porta il check nel payload', () => {
    const action = createSectionCheckSuccessAction('coins');
    const check = {stats: null, autoRestoreTriggered: false};
    expect(action({check})).toEqual({type: '[coins Persistence] Section Check Success', check});
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx nx test ngrx-entity-crud --testFile=libs/ngrx-entity-crud/persistence/nec-persistence-actions.spec.ts`
Expected: FAIL — `Cannot find module './nec-persistence-actions'`

- [ ] **Step 3: Implement**

Create `libs/ngrx-entity-crud/persistence/nec-persistence-actions.ts`:

```ts
import {createAction, props} from '@ngrx/store';
import {NecSectionCheck} from './models';

/**
 * `type` scoped per `feature`: chiamata sia da `createPersistenceEffects` (che dispatcha l'esito
 * del check) sia da `createPersistenceReducer` (che lo scrive nello store) — lo stesso meccanismo
 * di `createCrudActions<T>(name)` nel core, cosi' il reducer di ogni sezione riceve solo le
 * proprie azioni tramite il match sul `type`, senza filtrare `feature` a mano nel payload.
 */
export function createSectionCheckSuccessAction(feature: string) {
  return createAction(`[${feature} Persistence] Section Check Success`, props<{ check: NecSectionCheck }>());
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx nx test ngrx-entity-crud --testFile=libs/ngrx-entity-crud/persistence/nec-persistence-actions.spec.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add libs/ngrx-entity-crud/persistence/nec-persistence-actions.ts libs/ngrx-entity-crud/persistence/nec-persistence-actions.spec.ts
git commit -m "$(cat <<'EOF'
feat(persistence): add createSectionCheckSuccessAction

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: `createPersistenceReducer`

**Files:**
- Create: `libs/ngrx-entity-crud/persistence/nec-persistence-reducer.ts`
- Test: `libs/ngrx-entity-crud/persistence/nec-persistence-reducer.spec.ts`

**Interfaces:**
- Consumes: `createSectionCheckSuccessAction` (Task 2), `NecSectionCheck`/`NecSectionStats` from `./models`.
- Produces: `NecPersistenceState { check: NecSectionCheck | null }`, `NEC_PERSISTENCE_INITIAL_STATE: NecPersistenceState`, `necPersistenceFeatureKey(feature: string): string` (returns `` `${feature}:persistence` ``, the single place that owns this convention — Task 4's selectors and Task 8's schematic template both call it instead of hardcoding the string), `createPersistenceReducer(feature: string): ActionReducer<NecPersistenceState>`.

- [ ] **Step 1: Write the failing test**

Create `libs/ngrx-entity-crud/persistence/nec-persistence-reducer.spec.ts`:

```ts
import {createSectionCheckSuccessAction} from './nec-persistence-actions';
import {createPersistenceReducer, NEC_PERSISTENCE_INITIAL_STATE, necPersistenceFeatureKey} from './nec-persistence-reducer';
import {NecSectionStats} from './models';

describe('necPersistenceFeatureKey', () => {
  it('aggiunge il suffisso :persistence', () => {
    expect(necPersistenceFeatureKey('coins')).toBe('coins:persistence');
  });
});

describe('createPersistenceReducer', () => {
  const stats: NecSectionStats = {feature: 'coins', count: 10, bytes: 500, draftCount: 0, at: Date.now()};

  it('stato iniziale: check null', () => {
    const reducer = createPersistenceReducer('coins');
    expect(reducer(undefined, {type: '@@INIT'})).toEqual(NEC_PERSISTENCE_INITIAL_STATE);
  });

  it('SectionCheckSuccess della propria feature: scrive check', () => {
    const reducer = createPersistenceReducer('coins');
    const sectionCheckSuccess = createSectionCheckSuccessAction('coins');
    const check = {stats, autoRestoreTriggered: true};

    const state = reducer(undefined, sectionCheckSuccess({check}));

    expect(state).toEqual({check});
  });

  it("SectionCheckSuccess di un'altra feature: nessun effetto (type diverso, nessun filtro manuale necessario)", () => {
    const reducer = createPersistenceReducer('coins');
    const otherFeatureCheckSuccess = createSectionCheckSuccessAction('orders');

    const state = reducer(undefined, otherFeatureCheckSuccess({check: {stats, autoRestoreTriggered: true}}));

    expect(state).toEqual(NEC_PERSISTENCE_INITIAL_STATE);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx nx test ngrx-entity-crud --testFile=libs/ngrx-entity-crud/persistence/nec-persistence-reducer.spec.ts`
Expected: FAIL — `Cannot find module './nec-persistence-reducer'`

- [ ] **Step 3: Implement**

Create `libs/ngrx-entity-crud/persistence/nec-persistence-reducer.ts`:

```ts
import {ActionReducer, createReducer, on} from '@ngrx/store';
import {NecSectionCheck} from './models';
import {createSectionCheckSuccessAction} from './nec-persistence-actions';

export interface NecPersistenceState {
  check: NecSectionCheck | null;
}

export const NEC_PERSISTENCE_INITIAL_STATE: NecPersistenceState = {check: null};

/**
 * Chiave sotto cui questa slice va montata (`StoreModule.forFeature`) e da cui
 * `createPersistenceSelectors` la legge (`createFeatureSelector`) — un solo posto che decide il
 * formato, per evitare che le due stringhe letterali finiscano per scollarsi.
 */
export function necPersistenceFeatureKey(feature: string): string {
  return `${feature}:persistence`;
}

export function createPersistenceReducer(feature: string): ActionReducer<NecPersistenceState> {
  const sectionCheckSuccess = createSectionCheckSuccessAction(feature);
  return createReducer(
    NEC_PERSISTENCE_INITIAL_STATE,
    on(sectionCheckSuccess, (state, {check}): NecPersistenceState => ({...state, check}))
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx nx test ngrx-entity-crud --testFile=libs/ngrx-entity-crud/persistence/nec-persistence-reducer.spec.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add libs/ngrx-entity-crud/persistence/nec-persistence-reducer.ts libs/ngrx-entity-crud/persistence/nec-persistence-reducer.spec.ts
git commit -m "$(cat <<'EOF'
feat(persistence): add createPersistenceReducer

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `createPersistenceSelectors`

**Files:**
- Create: `libs/ngrx-entity-crud/persistence/nec-persistence-selectors.ts`
- Test: `libs/ngrx-entity-crud/persistence/nec-persistence-selectors.spec.ts`

**Interfaces:**
- Consumes: `necPersistenceFeatureKey`, `NecPersistenceState`, `NEC_PERSISTENCE_INITIAL_STATE` (Task 3); `NecSectionCheck` from `./models`.
- Produces: `NecPersistenceSelectors { readonly sectionCheck: MemoizedSelector<object, NecSectionCheck | null> }`, `createPersistenceSelectors(feature: string): NecPersistenceSelectors`. Task 6's component takes `NecPersistenceSelectors` as its `@Input() selectors` type.

- [ ] **Step 1: Write the failing test**

Create `libs/ngrx-entity-crud/persistence/nec-persistence-selectors.spec.ts`:

```ts
import {createPersistenceSelectors} from './nec-persistence-selectors';
import {NEC_PERSISTENCE_INITIAL_STATE, necPersistenceFeatureKey} from './nec-persistence-reducer';
import {NecSectionStats} from './models';

describe('createPersistenceSelectors', () => {
  const stats: NecSectionStats = {feature: 'coins', count: 10, bytes: 500, draftCount: 0, at: Date.now()};

  it('slice montata ma nessun check ancora ricevuto: sectionCheck null', () => {
    const selectors = createPersistenceSelectors('coins');
    const state = {[necPersistenceFeatureKey('coins')]: NEC_PERSISTENCE_INITIAL_STATE};

    expect(selectors.sectionCheck(state)).toBeNull();
  });

  it('sectionCheck legge il check scritto nella slice', () => {
    const selectors = createPersistenceSelectors('coins');
    const check = {stats, autoRestoreTriggered: false};
    const state = {[necPersistenceFeatureKey('coins')]: {check}};

    expect(selectors.sectionCheck(state)).toEqual(check);
  });

  it('due feature diverse leggono slice diverse', () => {
    const coinsSelectors = createPersistenceSelectors('coins');
    const ordersSelectors = createPersistenceSelectors('orders');
    const check = {stats, autoRestoreTriggered: true};
    const state = {
      [necPersistenceFeatureKey('coins')]: {check},
      [necPersistenceFeatureKey('orders')]: NEC_PERSISTENCE_INITIAL_STATE,
    };

    expect(coinsSelectors.sectionCheck(state)).toEqual(check);
    expect(ordersSelectors.sectionCheck(state)).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx nx test ngrx-entity-crud --testFile=libs/ngrx-entity-crud/persistence/nec-persistence-selectors.spec.ts`
Expected: FAIL — `Cannot find module './nec-persistence-selectors'`

- [ ] **Step 3: Implement**

Create `libs/ngrx-entity-crud/persistence/nec-persistence-selectors.ts`:

```ts
import {createFeatureSelector, createSelector, MemoizedSelector} from '@ngrx/store';
import {NecSectionCheck} from './models';
import {necPersistenceFeatureKey, NecPersistenceState} from './nec-persistence-reducer';

export interface NecPersistenceSelectors {
  readonly sectionCheck: MemoizedSelector<object, NecSectionCheck | null>;
}

export function createPersistenceSelectors(feature: string): NecPersistenceSelectors {
  const selectPersistenceState = createFeatureSelector<NecPersistenceState>(necPersistenceFeatureKey(feature));
  const sectionCheck = createSelector(selectPersistenceState, (state) => state.check);
  return {sectionCheck};
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx nx test ngrx-entity-crud --testFile=libs/ngrx-entity-crud/persistence/nec-persistence-selectors.spec.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add libs/ngrx-entity-crud/persistence/nec-persistence-selectors.ts libs/ngrx-entity-crud/persistence/nec-persistence-selectors.spec.ts
git commit -m "$(cat <<'EOF'
feat(persistence): add createPersistenceSelectors

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Refactor `createPersistenceEffects` — dispatch instead of `ReplaySubject`

**Files:**
- Modify: `libs/ngrx-entity-crud/persistence/nec-persistence-effects.ts`
- Modify: `libs/ngrx-entity-crud/persistence/nec-persistence-effects.spec.ts`

**Interfaces:**
- Consumes: `createSectionCheckSuccessAction` (Task 2).
- Produces: `NecPersistenceEffects` interface loses `sectionCheck$`, gains `autoRestoreTriggerOn$: Observable<Action>`. `autoRestoreCheckOn$` now always dispatches `createSectionCheckSuccessAction(feature)({check})` instead of a filtered `RestoreRequest`/nothing. Task 6's component no longer touches this interface at all (it depends on Task 4's selectors instead) — this task only affects `nec-persistence-effects.ts` and its own spec.

- [ ] **Step 1: Write the failing test**

Replace the entire `describe('check leggero alla creazione + auto-restore', ...)` block (currently lines 192-283 of `libs/ngrx-entity-crud/persistence/nec-persistence-effects.spec.ts`, right before the closing `});` of the outer `describe('createPersistenceEffects', ...)`) with:

```ts
  describe('check leggero alla creazione + auto-restore', () => {
    const sectionCheckSuccess = createSectionCheckSuccessAction(NAME);

    it('nessun dato locale: SectionCheckSuccess con stats null', async () => {
      const {effects} = setup({stats: jest.fn().mockResolvedValue(null)}, {maxAgeMs: 60000});
      const dispatched: Action[] = [];
      effects.autoRestoreCheckOn$.subscribe((a) => dispatched.push(a));

      await flushPromises();

      expect(dispatched).toEqual([sectionCheckSuccess({check: {stats: null, autoRestoreTriggered: false}})]);
    });

    it('dati entro soglia: SectionCheckSuccess con autoRestoreTriggered true, poi RestoreRequest da se\'', async () => {
      const stats: NecSectionStats = {feature: NAME, count: 10, bytes: 500, draftCount: 0, at: Date.now() - 1000};
      const {effects, actionsSubject} = setup({stats: jest.fn().mockResolvedValue(stats)}, {maxAgeMs: 60000});
      const triggered: Action[] = [];
      // Nella realta' un'azione dispatchata da un effect torna sullo stream actions$ tramite lo
      // Store; qui non c'e' un vero Store, quindi la si inoltra a mano cosi' autoRestoreTriggerOn$
      // (che ascolta actions$, non autoRestoreCheckOn$ direttamente) puo' reagire.
      effects.autoRestoreCheckOn$.subscribe((a) => actionsSubject.next(a));
      effects.autoRestoreTriggerOn$.subscribe((a) => triggered.push(a));

      await flushPromises();

      expect(triggered).toEqual([actions.RestoreRequest()]);
    });

    it('dati fuori soglia di eta\': nessun RestoreRequest automatico', async () => {
      const stats: NecSectionStats = {feature: NAME, count: 10, bytes: 500, draftCount: 0, at: Date.now() - 120000};
      const {effects, actionsSubject} = setup({stats: jest.fn().mockResolvedValue(stats)}, {maxAgeMs: 60000});
      const triggered: Action[] = [];
      effects.autoRestoreCheckOn$.subscribe((a) => actionsSubject.next(a));
      effects.autoRestoreTriggerOn$.subscribe((a) => triggered.push(a));

      await flushPromises();

      expect(triggered).toEqual([]);
    });

    it('fuori soglia di bytes pur essendo dentro la soglia di eta\': nessun RestoreRequest', async () => {
      const stats: NecSectionStats = {feature: NAME, count: 10, bytes: 5000, draftCount: 0, at: Date.now() - 1000};
      const {effects, actionsSubject} = setup({stats: jest.fn().mockResolvedValue(stats)}, {maxAgeMs: 60000, maxBytes: 1000});
      const triggered: Action[] = [];
      effects.autoRestoreCheckOn$.subscribe((a) => actionsSubject.next(a));
      effects.autoRestoreTriggerOn$.subscribe((a) => triggered.push(a));

      await flushPromises();

      expect(triggered).toEqual([]);
    });

    it('autoRestore non configurato ne\' per sezione ne\' globalmente: nessun RestoreRequest anche con dati freschi', async () => {
      const stats: NecSectionStats = {feature: NAME, count: 10, bytes: 500, draftCount: 0, at: Date.now()};
      const {effects, actionsSubject} = setup({stats: jest.fn().mockResolvedValue(stats)});
      const triggered: Action[] = [];
      effects.autoRestoreCheckOn$.subscribe((a) => actionsSubject.next(a));
      effects.autoRestoreTriggerOn$.subscribe((a) => triggered.push(a));

      await flushPromises();

      expect(triggered).toEqual([]);
    });

    it('il default globale si applica quando la sezione non specifica autoRestore', async () => {
      const stats: NecSectionStats = {feature: NAME, count: 10, bytes: 500, draftCount: 0, at: Date.now() - 1000};
      const {effects, actionsSubject} = setup(
        {stats: jest.fn().mockResolvedValue(stats)},
        undefined,
        {autoRestore: {maxAgeMs: 60000}}
      );
      const triggered: Action[] = [];
      effects.autoRestoreCheckOn$.subscribe((a) => actionsSubject.next(a));
      effects.autoRestoreTriggerOn$.subscribe((a) => triggered.push(a));

      await flushPromises();

      expect(triggered).toEqual([actions.RestoreRequest()]);
    });

    it('il parametro di sezione prevale sul default globale', async () => {
      const stats: NecSectionStats = {feature: NAME, count: 10, bytes: 500, draftCount: 0, at: Date.now() - 120000};
      const {effects, actionsSubject} = setup(
        {stats: jest.fn().mockResolvedValue(stats)},
        {maxAgeMs: 1000},
        {autoRestore: {maxAgeMs: 999999}}
      );
      const triggered: Action[] = [];
      effects.autoRestoreCheckOn$.subscribe((a) => actionsSubject.next(a));
      effects.autoRestoreTriggerOn$.subscribe((a) => triggered.push(a));

      await flushPromises();

      expect(triggered).toEqual([]);
    });
  });
```

Also add the import (top of the file, alongside the existing `./models` import):
```ts
import {createSectionCheckSuccessAction} from './nec-persistence-actions';
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx nx test ngrx-entity-crud --testFile=libs/ngrx-entity-crud/persistence/nec-persistence-effects.spec.ts`
Expected: FAIL — `effects.autoRestoreTriggerOn$` is `undefined`, and the "nessun dato locale" test's `dispatched` is `[]` instead of containing the `SectionCheckSuccess` action (current implementation still filters it out).

- [ ] **Step 3: Implement**

In `libs/ngrx-entity-crud/persistence/nec-persistence-effects.ts`:

Replace the imports block:
```ts
import {Inject, Injectable, Optional, Type} from '@angular/core';
import {Actions as NgrxActions, createEffect, ofType} from '@ngrx/effects';
import {Action} from '@ngrx/store';
import {defer, EMPTY, from, merge, Observable, of, ReplaySubject} from 'rxjs';
import {catchError, debounceTime, filter, map, switchMap, tap} from 'rxjs/operators';
import {Actions, ICriteria} from 'ngrx-entity-crud';
import {NecAutoRestoreConfig, NecPersistenceConfig, NecSectionCheck, NecSectionStats} from './models';
import {NEC_PERSISTENCE_CONFIG} from './persistence-config.token';
import {NecPersistenceService} from './nec-persistence.service';
```
with:
```ts
import {Inject, Injectable, Optional, Type} from '@angular/core';
import {Actions as NgrxActions, createEffect, ofType} from '@ngrx/effects';
import {Action} from '@ngrx/store';
import {defer, EMPTY, from, merge, Observable, of} from 'rxjs';
import {catchError, debounceTime, filter, map, switchMap, tap} from 'rxjs/operators';
import {Actions, ICriteria} from 'ngrx-entity-crud';
import {NecAutoRestoreConfig, NecPersistenceConfig, NecSectionCheck, NecSectionStats} from './models';
import {NEC_PERSISTENCE_CONFIG} from './persistence-config.token';
import {NecPersistenceService} from './nec-persistence.service';
import {createSectionCheckSuccessAction} from './nec-persistence-actions';
```

Replace the `createPersistenceEffects` function's doc comment and the `NecPersistenceEffects` interface:
```ts
/**
 * Effect factory per sezione: genera una classe Angular Effects pronta per
 * `EffectsModule.forFeature([createPersistenceEffects({...})])` — lo stesso punto di
 * registrazione per store eager e lazy (vedi "Aggancio" in `ngrx-entity-crud-persistence-plan.md`).
 *
 * Traduce la tabella "Ciclo di vita per sezione" del piano in effect `{dispatch: false}` (scrivono
 * e basta), più due effect che dispatchano: la traduzione di `RestoreRequest` in lettura, e il
 * check leggero di freschezza eseguito una sola volta alla creazione — che dispatcha da sé
 * `RestoreRequest` se i dati locali rientrano in `autoRestore`.
 */
```
with:
```ts
/**
 * Effect factory per sezione: genera una classe Angular Effects pronta per
 * `EffectsModule.forFeature([createPersistenceEffects({...})])` — lo stesso punto di
 * registrazione per store eager e lazy (vedi "Aggancio" in `ngrx-entity-crud-persistence-plan.md`).
 *
 * Traduce la tabella "Ciclo di vita per sezione" del piano in effect `{dispatch: false}` (scrivono
 * e basta), più tre effect che dispatchano: la traduzione di `RestoreRequest` in lettura
 * (`restoreRequestOn$`), il check leggero di freschezza eseguito una sola volta alla creazione
 * (`autoRestoreCheckOn$`, dispatcha `SectionCheckSuccess` — lo stato lo scrive
 * `createPersistenceReducer`, lo legge `createPersistenceSelectors`) e la sua traduzione in
 * `RestoreRequest` quando i dati locali rientrano in `autoRestore` (`autoRestoreTriggerOn$`).
 */
```

Replace:
```ts
/**
 * Superficie pubblica della classe generata da `createPersistenceEffects`: gli effect richiesti
 * da `EffectsModule.forFeature([...])`, più `sectionCheck$` per il componente (Fase 3) e per i
 * test — che possono sottoscrivere ogni effect direttamente, senza passare da `EffectsModule`.
 */
export interface NecPersistenceEffects {
  /**
   * Esito del check leggero `stats(feature)` eseguito una sola volta, alla creazione della
   * sezione. Il componente (`<nec-restore-search>`, Fase 3) legge questo observable invece di
   * ripetere la query.
   */
  readonly sectionCheck$: Observable<NecSectionCheck>;
  readonly autoRestoreCheckOn$: Observable<Action>;
  readonly restoreRequestOn$: Observable<Action>;
```
with:
```ts
/**
 * Superficie pubblica della classe generata da `createPersistenceEffects`: gli effect richiesti
 * da `EffectsModule.forFeature([...])` — anche per i test, che possono sottoscrivere ogni effect
 * direttamente, senza passare da `EffectsModule`.
 */
export interface NecPersistenceEffects {
  readonly autoRestoreCheckOn$: Observable<Action>;
  /** Traduce un `SectionCheckSuccess` con `autoRestoreTriggered: true` in `RestoreRequest`. */
  readonly autoRestoreTriggerOn$: Observable<Action>;
  readonly restoreRequestOn$: Observable<Action>;
```

Inside the `NecSectionPersistenceEffects` class, replace the field declarations:
```ts
  @Injectable()
  class NecSectionPersistenceEffects implements NecPersistenceEffects {
    private readonly pendingDrafts = new Map<string, T>();
    private readonly checkSubject = new ReplaySubject<NecSectionCheck>(1);
    readonly sectionCheck$: Observable<NecSectionCheck> = this.checkSubject.asObservable();

    // Dichiarati qui ma assegnati nel corpo del costruttore (non come field initializer): per una
    // classe senza `extends`, i field initializer girano PRIMA del corpo del costruttore (spec
    // InitializeInstanceElements), quindi prima che le parameter property (actions$, persistence,
    // globalConfig) vengano assegnate — leggerle da un field initializer li trova `undefined`.
    // Vedi bug osservato a runtime: "Cannot read properties of undefined (reading 'pipe')".
    readonly autoRestoreCheckOn$: Observable<Action>;
    readonly restoreRequestOn$: Observable<Action>;
```
with:
```ts
  @Injectable()
  class NecSectionPersistenceEffects implements NecPersistenceEffects {
    private readonly pendingDrafts = new Map<string, T>();

    // Dichiarati qui ma assegnati nel corpo del costruttore (non come field initializer): per una
    // classe senza `extends`, i field initializer girano PRIMA del corpo del costruttore (spec
    // InitializeInstanceElements), quindi prima che le parameter property (actions$, persistence,
    // globalConfig) vengano assegnate — leggerle da un field initializer li trova `undefined`.
    // Vedi bug osservato a runtime: "Cannot read properties of undefined (reading 'pipe')".
    readonly autoRestoreCheckOn$: Observable<Action>;
    readonly autoRestoreTriggerOn$: Observable<Action>;
    readonly restoreRequestOn$: Observable<Action>;
```

Replace the constructor's opening (the check effect) and `evaluateAutoRestore`:
```ts
    constructor(
      private readonly actions$: NgrxActions,
      private readonly persistence: NecPersistenceService,
      @Optional() @Inject(NEC_PERSISTENCE_CONFIG) private readonly globalConfig: NecPersistenceConfig | null
    ) {
      // Check leggero eseguito UNA SOLA VOLTA: `createEffect` sottoscrive l'observable non appena
      // la classe viene istanziata da EffectsModule, quindi questo `defer` gira nello stesso istante
      // in cui la sezione (eager o lazy) viene creata, non quando un componente si monta.
      this.autoRestoreCheckOn$ = createEffect(() => defer(() => from(this.persistence.stats(feature))).pipe(
        map((stats) => this.evaluateAutoRestore(stats)),
        tap(({stats, autoRestoreTriggered}) => this.checkSubject.next({stats, autoRestoreTriggered})),
        map(({action}) => action),
        filter((action): action is Action => action !== null),
        catchError(() => {
          this.checkSubject.next({stats: null, autoRestoreTriggered: false});
          return EMPTY;
        })
      ));
```
with:
```ts
    constructor(
      private readonly actions$: NgrxActions,
      private readonly persistence: NecPersistenceService,
      @Optional() @Inject(NEC_PERSISTENCE_CONFIG) private readonly globalConfig: NecPersistenceConfig | null
    ) {
      const sectionCheckSuccess = createSectionCheckSuccessAction(feature);

      // Check leggero eseguito UNA SOLA VOLTA: `createEffect` sottoscrive l'observable non appena
      // la classe viene istanziata da EffectsModule, quindi questo `defer` gira nello stesso istante
      // in cui la sezione (eager o lazy) viene creata, non quando un componente si monta. Dispatcha
      // sempre SectionCheckSuccess: il reducer generato da createPersistenceReducer lo scrive nello
      // store, il componente lo legge da li' via createPersistenceSelectors — mai piu' un
      // side-channel fuori dallo store.
      this.autoRestoreCheckOn$ = createEffect(() => defer(() => from(this.persistence.stats(feature))).pipe(
        map((stats) => this.evaluateAutoRestore(stats)),
        map((check) => sectionCheckSuccess({check})),
        catchError(() => of(sectionCheckSuccess({check: {stats: null, autoRestoreTriggered: false}})))
      ));

      // Traduce un check con autoRestoreTriggered in RestoreRequest: separato dal check sopra cosi'
      // ogni effect dispatcha un solo tipo di esito.
      this.autoRestoreTriggerOn$ = createEffect(() => this.actions$.pipe(
        ofType(sectionCheckSuccess),
        filter(({check}) => check.autoRestoreTriggered),
        map(() => actions.RestoreRequest())
      ));
```

Replace `evaluateAutoRestore`:
```ts
    private evaluateAutoRestore(stats: NecSectionStats | null): NecSectionCheck & { action: Action | null } {
      const autoRestore = this.autoRestoreConfig();
      if (!stats || !autoRestore) {
        return {stats, autoRestoreTriggered: false, action: null};
      }
      const withinAge = Date.now() - stats.at <= autoRestore.maxAgeMs;
      const withinBytes = autoRestore.maxBytes === undefined || stats.bytes <= autoRestore.maxBytes;
      const triggered = withinAge && withinBytes;
      return {stats, autoRestoreTriggered: triggered, action: triggered ? actions.RestoreRequest() : null};
    }
```
with:
```ts
    private evaluateAutoRestore(stats: NecSectionStats | null): NecSectionCheck {
      const autoRestore = this.autoRestoreConfig();
      if (!stats || !autoRestore) {
        return {stats, autoRestoreTriggered: false};
      }
      const withinAge = Date.now() - stats.at <= autoRestore.maxAgeMs;
      const withinBytes = autoRestore.maxBytes === undefined || stats.bytes <= autoRestore.maxBytes;
      return {stats, autoRestoreTriggered: withinAge && withinBytes};
    }
```

Everything else in the file (`restoreRequestOn$`, `searchRequestOn$`, `searchSuccessOn$`, `draftsPutOn$`, `removeManySelectedOn$`, `removeAllSelectedOn$`, `deleteSuccessOn$`, `deleteManySuccessOn$`, `autoRestoreConfig`) is unchanged.

- [ ] **Step 4: Run it to verify it passes**

Run: `npx nx test ngrx-entity-crud --testFile=libs/ngrx-entity-crud/persistence/nec-persistence-effects.spec.ts`
Expected: PASS (all tests, including the 7 rewritten ones)

- [ ] **Step 5: Commit**

```bash
git add libs/ngrx-entity-crud/persistence/nec-persistence-effects.ts libs/ngrx-entity-crud/persistence/nec-persistence-effects.spec.ts
git commit -m "$(cat <<'EOF'
refactor(persistence): autoRestoreCheckOn$ dispatches SectionCheckSuccess instead of a ReplaySubject

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: `NecRestoreSearchComponent` reads the store, not an injected Effects class

**Files:**
- Modify: `libs/ngrx-entity-crud/persistence/nec-restore-search.component.ts`
- Modify: `libs/ngrx-entity-crud/persistence/nec-restore-search.component.spec.ts`

**Interfaces:**
- Consumes: `NecPersistenceSelectors` (Task 4).
- Produces: `NecRestoreSearchComponent<T>.selectors: NecPersistenceSelectors` (`@Input`), replacing `effects: Type<NecPersistenceEffects>`. No other public member changes.

- [ ] **Step 1: Write the failing test**

Replace the entire `describe('NecRestoreSearchComponent', ...)` block in `libs/ngrx-entity-crud/persistence/nec-restore-search.component.spec.ts` (everything from `describe('NecRestoreSearchComponent', () => {` to its closing `});`, i.e. from the line right after the `formatAge` describe block to the end of the file) with:

```ts
/**
 * Copre la derivazione dello stato (Fase 3 del piano, rivista dopo Fase 4): la vm deriva da
 * `selectors.sectionCheck` letto dallo store (`createPersistenceSelectors`) + il flusso di azioni,
 * senza mai ripetere `stats(feature)` ne' risolvere una classe Effects via `Injector`.
 */
describe('NecRestoreSearchComponent', () => {
  interface Coin {
    id: string;
    name: string;
  }

  const adapter = createCrudEntityAdapter<Coin>({selectId: (m) => m.id});
  const actions = adapter.createCrudActions('coins');

  // `NecPersistenceSelectors.sectionCheck` is a `MemoizedSelector`, not a plain function (it also
  // carries `.release`/`.projector`) — a hand-rolled arrow function wouldn't satisfy the type. The
  // fake `Store.select` below ignores which selector it's called with anyway (it always returns
  // `checkSubject`), so using the real factory here is both type-correct and simpler than faking it.
  const selectors: NecPersistenceSelectors = createPersistenceSelectors('coins');

  let dispatch: jest.Mock;
  let select: jest.Mock;
  let actionsSubject: Subject<Action>;
  let checkSubject: Subject<NecSectionCheck>;
  let pendingWrites$: BehaviorSubject<number>;
  let estimateStorage: jest.Mock;
  let component: NecRestoreSearchComponent<Coin>;
  let vmSubscription: Subscription;
  let latestVm: NecRestoreSearchViewModel | undefined;

  const stats: NecSectionStats = {
    feature: 'coins',
    count: 100,
    bytes: 340 * 1024,
    draftCount: 12,
    at: Date.now(),
  };

  /** `pendingWrites$` reale e' una BehaviorSubject (Fase 0): un fresh subscriber la vede subito. */
  function createComponent(): NecRestoreSearchComponent<Coin> {
    const fixture = TestBed.createComponent(NecRestoreSearchComponent<Coin>);
    const created = fixture.componentInstance;
    created.feature = 'coins';
    created.selectors = selectors;
    created.actions = actions;
    fixture.detectChanges(); // esegue ngOnInit
    return created;
  }

  beforeEach(() => {
    dispatch = jest.fn();
    actionsSubject = new Subject();
    checkSubject = new Subject<NecSectionCheck>();
    pendingWrites$ = new BehaviorSubject<number>(0);
    estimateStorage = jest.fn().mockResolvedValue(null);
    // Il componente chiama sempre store.select(this.selectors.sectionCheck): quale selector venga
    // passato non conta per questo doppio, restituisce sempre lo stesso Subject controllato dal test.
    select = jest.fn().mockReturnValue(checkSubject.asObservable());

    TestBed.configureTestingModule({
      imports: [NecRestoreSearchComponent],
      providers: [
        {provide: Store, useValue: {dispatch, select}},
        {provide: NgrxActionsClass, useValue: new NgrxActionsClass(actionsSubject)},
        {
          provide: NecPersistenceService,
          useValue: {pendingWrites$, estimateStorage},
        },
      ],
    });

    component = createComponent();
    // Sottoscrizione UNICA e persistente per tutto il test: `combineLatest` e' cold, una nuova
    // `.subscribe()` per ogni asserzione perderebbe i valori gia' emessi dai Subject non-replay.
    latestVm = undefined;
    vmSubscription = component.vm$.subscribe((vm) => {
      latestVm = vm;
    });
  });

  afterEach(() => {
    vmSubscription.unsubscribe();
  });

  /** Narrowing senza non-null assertion (vietata dal lint): fallisce il test se manca ancora. */
  function currentVm(): NecRestoreSearchViewModel {
    expect(latestVm).toBeDefined();
    return latestVm as NecRestoreSearchViewModel;
  }

  it('stato iniziale, prima di ogni esito del check: none', () => {
    expect(currentVm().state).toBe('none');
  });

  it('check senza dati locali: none', () => {
    checkSubject.next({stats: null, autoRestoreTriggered: false});
    expect(currentVm().state).toBe('none');
  });

  it('check con dati locali, fuori soglia: prompt con le stats', () => {
    checkSubject.next({stats, autoRestoreTriggered: false});
    const vm = currentVm();
    expect(vm.state).toBe('prompt');
    expect(vm.stats).toEqual(stats);
  });

  it('check con autoRestoreTriggered + RestoreRequest in volo: auto-restoring', () => {
    checkSubject.next({stats, autoRestoreTriggered: true});
    actionsSubject.next(actions.RestoreRequest());
    expect(currentVm().state).toBe('auto-restoring');
  });

  it('auto-restoring seguito da RestoreSuccess: torna a none, non a prompt', () => {
    checkSubject.next({stats, autoRestoreTriggered: true});
    actionsSubject.next(actions.RestoreRequest());
    actionsSubject.next(actions.RestoreSuccess({items: [], selected: [], criteria: {}}));
    expect(currentVm().state).toBe('none');
  });

  it('click su Restore: dispaccia RestoreRequest e passa a manual-restoring', () => {
    checkSubject.next({stats, autoRestoreTriggered: false});
    expect(currentVm().state).toBe('prompt');

    component.restore();
    actionsSubject.next(actions.RestoreRequest());

    expect(dispatch).toHaveBeenCalledWith(actions.RestoreRequest());
    expect(currentVm().state).toBe('manual-restoring');
  });

  it('RestoreFailure durante un restore manuale: torna a prompt con l\'errore visibile', () => {
    checkSubject.next({stats, autoRestoreTriggered: false});
    component.restore();
    actionsSubject.next(actions.RestoreRequest());

    actionsSubject.next(actions.RestoreFailure({error: 'IndexedDB non disponibile'}));

    const vm = currentVm();
    expect(vm.state).toBe('prompt');
    expect(vm.restoreError).toBe('IndexedDB non disponibile');
  });

  it('New search chiede conferma prima di scartare le bozze, poi torna a none', () => {
    checkSubject.next({stats, autoRestoreTriggered: false});

    expect(component.dismissPending()).toBe(false);
    component.requestNewSearch();
    expect(component.dismissPending()).toBe(true);
    component.cancelNewSearch();
    expect(component.dismissPending()).toBe(false);
    expect(currentVm().state).toBe('prompt');

    component.requestNewSearch();
    component.confirmNewSearch();

    expect(currentVm().state).toBe('none');
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('pendingWrites si riflette nella vm indipendentemente dallo stato principale', () => {
    checkSubject.next({stats: null, autoRestoreTriggered: false});
    pendingWrites$.next(3);

    expect(currentVm().pendingWrites).toBe(3);
  });

  it('quota quasi esaurita: quotaWarning true, letta una sola volta da estimateStorage', async () => {
    estimateStorage.mockResolvedValue({quota: 100, usage: 95});

    const freshComponent = createComponent();
    let freshVm: NecRestoreSearchViewModel | undefined;
    const sub = freshComponent.vm$.subscribe((vm) => {
      freshVm = vm;
    });

    await flush();

    expect(freshVm?.quotaWarning).toBe(true);
    expect(estimateStorage).toHaveBeenCalledTimes(2);
    sub.unsubscribe();
  });
});
```

Also replace the file's top imports:
```ts
import {Type} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {Action, Store} from '@ngrx/store';
import {Actions as NgrxActionsClass} from '@ngrx/effects';
import {BehaviorSubject, Subject, Subscription} from 'rxjs';
import {createCrudEntityAdapter} from 'ngrx-entity-crud';
import {formatAge, formatBytes, NecRestoreSearchComponent, NecRestoreSearchViewModel} from './nec-restore-search.component';
import {NecPersistenceService} from './nec-persistence.service';
import {NecPersistenceEffects} from './nec-persistence-effects';
import {NecSectionCheck, NecSectionStats} from './models';
```
with:
```ts
import {TestBed} from '@angular/core/testing';
import {Action, Store} from '@ngrx/store';
import {Actions as NgrxActionsClass} from '@ngrx/effects';
import {BehaviorSubject, Subject, Subscription} from 'rxjs';
import {createCrudEntityAdapter} from 'ngrx-entity-crud';
import {formatAge, formatBytes, NecRestoreSearchComponent, NecRestoreSearchViewModel} from './nec-restore-search.component';
import {NecPersistenceService} from './nec-persistence.service';
import {createPersistenceSelectors, NecPersistenceSelectors} from './nec-persistence-selectors';
import {NecSectionCheck, NecSectionStats} from './models';
```

(`formatBytes`/`formatAge` describe blocks at the top of the file are untouched.)

- [ ] **Step 2: Run it to verify it fails**

Run: `npx nx test ngrx-entity-crud --testFile=libs/ngrx-entity-crud/persistence/nec-restore-search.component.spec.ts`
Expected: FAIL — `created.selectors` doesn't exist on the component yet (TS error) / `store.select` isn't called by the current implementation.

- [ ] **Step 3: Implement**

In `libs/ngrx-entity-crud/persistence/nec-restore-search.component.ts`:

Replace the imports (note: `NecSectionCheck` already moved to `./models` by Task 1, so the "before"
state below already reflects that — this is not the original pre-Task-1 file):
```ts
import {ChangeDetectionStrategy, Component, Injector, Input, OnDestroy, OnInit, signal, Type} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {TagModule} from 'primeng/tag';
import {Store} from '@ngrx/store';
import {Actions as NgrxActions, ofType} from '@ngrx/effects';
import {BehaviorSubject, combineLatest, from, merge, Observable, Subject} from 'rxjs';
import {map, startWith, takeUntil} from 'rxjs/operators';
import {Actions} from 'ngrx-entity-crud';
import {NecPersistenceService} from './nec-persistence.service';
import {NecPersistenceEffects} from './nec-persistence-effects';
import {NecSectionCheck, NecSectionStats} from './models';
```
with:
```ts
import {ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {TagModule} from 'primeng/tag';
import {Store} from '@ngrx/store';
import {Actions as NgrxActions, ofType} from '@ngrx/effects';
import {BehaviorSubject, combineLatest, from, merge, Observable, Subject} from 'rxjs';
import {map, startWith, takeUntil} from 'rxjs/operators';
import {Actions} from 'ngrx-entity-crud';
import {NecPersistenceService} from './nec-persistence.service';
import {NecPersistenceSelectors} from './nec-persistence-selectors';
import {NecSectionCheck, NecSectionStats} from './models';
```

Replace the doc comment's paragraph about how the check is read:
```ts
 * La scelta tra gli stati 1-3 è già decisa alla creazione della sezione: legge `sectionCheck$`
 * dalla classe generata da `createPersistenceEffects` (risolta via `Injector`, stesso injector in
 * cui `EffectsModule.forFeature` l'ha registrata), non ripete la query `stats(feature)`.
```
with:
```ts
 * La scelta tra gli stati 1-3 è già decisa alla creazione della sezione: legge lo stato scritto da
 * `createPersistenceReducer` tramite il selector `sectionCheck` di `createPersistenceSelectors`
 * (`@Input() selectors`), non ripete la query `stats(feature)`.
```

Replace the `@Input`s:
```ts
  @Input() feature = '';
  @Input() effects!: Type<NecPersistenceEffects>;
  @Input() actions!: Actions<T>;
```
with:
```ts
  @Input() feature = '';
  @Input() selectors!: NecPersistenceSelectors;
  @Input() actions!: Actions<T>;
```

Replace the constructor:
```ts
  constructor(
    private readonly injector: Injector,
    private readonly store: Store,
    private readonly ngrxActions: NgrxActions,
    private readonly persistence: NecPersistenceService
  ) {
  }
```
with:
```ts
  constructor(
    private readonly store: Store,
    private readonly ngrxActions: NgrxActions,
    private readonly persistence: NecPersistenceService
  ) {
  }
```

Replace the first two lines of `ngOnInit`:
```ts
  ngOnInit(): void {
    const effectsInstance = this.injector.get(this.effects);
    const check$: Observable<NecSectionCheck | null> = effectsInstance.sectionCheck$.pipe(startWith(null));
```
with:
```ts
  ngOnInit(): void {
    const check$: Observable<NecSectionCheck | null> = this.store.select(this.selectors.sectionCheck).pipe(startWith(null));
```

Everything else in the file (the rest of `ngOnInit`, `ngOnDestroy`, `restore`, `requestNewSearch`, `confirmNewSearch`, `cancelNewSearch`, `statsSummary`, `draftsSummary`, `ageSummary`, `draftCountOf`, `isQuotaLow`, `formatBytes`, `formatAge`, the `@Component` decorator/template/styles) is unchanged.

- [ ] **Step 4: Run it to verify it passes**

Run: `npx nx test ngrx-entity-crud --testFile=libs/ngrx-entity-crud/persistence/nec-restore-search.component.spec.ts`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add libs/ngrx-entity-crud/persistence/nec-restore-search.component.ts libs/ngrx-entity-crud/persistence/nec-restore-search.component.spec.ts
git commit -m "$(cat <<'EOF'
refactor(persistence): NecRestoreSearchComponent reads sectionCheck via Store.select, not an injected Effects class

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Export the new factories from `public-api.ts`

**Files:**
- Modify: `libs/ngrx-entity-crud/persistence/public-api.ts`

**Interfaces:**
- Consumes: `nec-persistence-actions.ts`, `nec-persistence-reducer.ts`, `nec-persistence-selectors.ts` (Tasks 2-4).
- Produces: `createSectionCheckSuccessAction`, `NecPersistenceState`, `NEC_PERSISTENCE_INITIAL_STATE`, `necPersistenceFeatureKey`, `createPersistenceReducer`, `NecPersistenceSelectors`, `createPersistenceSelectors` all importable from `ngrx-entity-crud/persistence` — needed by Task 8 (schematic template) and Task 9 (README example).

- [ ] **Step 1: Write the failing test**

No new spec file — this is a barrel export. The verification is a build-level check: Task 8 imports `createPersistenceReducer`/`createPersistenceSelectors`/`necPersistenceFeatureKey` from `'ngrx-entity-crud/persistence'` in a generated schematic template, which only resolves once these are exported. As a standalone check now:

Run: `npx tsc --noEmit -p libs/ngrx-entity-crud/tsconfig.lib.json` (or open the file and confirm the three new modules aren't re-exported yet)
Expected: the new symbols are not importable from `ngrx-entity-crud/persistence` yet.

- [ ] **Step 2: Implement**

Replace `libs/ngrx-entity-crud/persistence/public-api.ts` in full:

```ts
/**
 * Secondary entry-point `ngrx-entity-crud/persistence`.
 *
 * Persistenza locale IndexedDB per sezioni CRUD: risultato di ricerca salvato in blocco,
 * bozze salvate una per entità. Tree-shakable: chi non lo importa non lo paga nel bundle.
 * Vedi `ngrx-entity-crud-persistence-plan.md`.
 *
 * Fase 0-3: entry-point + servizio IDB (`NecPersistenceService`) + effect factory
 * (`createPersistenceEffects`, che DIPENDE dal core per `Actions<T>`/`ICriteria` — a differenza
 * del servizio IDB, che resta agnostico) + componente (`NecRestoreSearchComponent`, che dipende
 * anche da PrimeNG: `p-button`/`p-tag` soltanto, classi identiche v16↔v19).
 *
 * Revisione dopo Fase 4: `createPersistenceReducer`/`createPersistenceSelectors` sostituiscono il
 * `sectionCheck$` esposto in precedenza dall'Effects — vedi
 * `docs/superpowers/specs/2026-09-17-persistence-section-check-store-design.md`.
 */

export * from './models';
export * from './persistence-config.token';
export * from './nec-persistence.service';
export * from './nec-persistence.module';
export * from './nec-persistence-actions';
export * from './nec-persistence-reducer';
export * from './nec-persistence-selectors';
export * from './nec-persistence-effects';
export * from './nec-restore-search.component';
export * from './nec-persistence-idb-adapter';
```

- [ ] **Step 3: Verify**

Run: `npx nx test ngrx-entity-crud --testPathPattern=persistence`
Expected: PASS (no regression — this is a pure export addition)

- [ ] **Step 4: Commit**

```bash
git add libs/ngrx-entity-crud/persistence/public-api.ts
git commit -m "$(cat <<'EOF'
feat(persistence): export createPersistenceReducer/createPersistenceSelectors from public-api

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Update the `--persist` schematic template

**Files:**
- Modify: `libs/ngrx-entity-crud/schematics/store/files/crud-store/plural/__clazz@dasherize__-store/__clazz@dasherize__-store.module.ts`

**Interfaces:**
- Consumes: `createPersistenceReducer`, `createPersistenceSelectors`, `necPersistenceFeatureKey` (Task 7, via `ngrx-entity-crud/persistence`).
- Produces: generated code exports `<Clazz>PersistenceReducer`/`<Clazz>PersistenceSelectors` alongside the existing `<Clazz>PersistenceEffects`, and registers a second `StoreModule.forFeature`.

This is an EJS template compiled by the Angular schematics `Tree` API, not TypeScript compiled directly by `tsc` — there's no unit test harness exercising it in this repo beyond the schematics' own collection tests (none exist for `--persist` specifically per `TODO.md`/existing test files). Verification here is: generate a section with `--persist=true` into a scratch app and confirm the emitted file compiles — matching how Fase 4 was verified per `ngrx-entity-crud-persistence-plan.md`.

- [ ] **Step 1: Replace the template file**

Replace `libs/ngrx-entity-crud/schematics/store/files/crud-store/plural/__clazz@dasherize__-store/__clazz@dasherize__-store.module.ts` in full:

```ts
import {InjectionToken, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActionReducer, StoreModule} from '@ngrx/store';
import {EffectsModule} from '@ngrx/effects';
import {<%= clazz %>StoreEffects} from './<%= dasherize(clazz) %>.effects';
import {featureReducer} from './<%= dasherize(clazz) %>.reducer';
import {State} from './<%= dasherize(clazz) %>.state';
import {Names} from './<%= dasherize(clazz) %>.names';
<% if (persist) { %>import {actions} from './<%= dasherize(clazz) %>.actions';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';
import {createPersistenceEffects, createPersistenceReducer, createPersistenceSelectors, necPersistenceFeatureKey} from 'ngrx-entity-crud/persistence';
<% } %>
export const INJECTION_TOKEN = new InjectionToken<ActionReducer<State>>(`${Names.NAME}-store Reducers`);
<% if (persist) { %>
// Persistenza locale IndexedDB (opt-in, generata da --persist): vedi ngrx-entity-crud/persistence
// e ngrx-entity-crud-persistence-plan.md. Effects/reducer/selectors sono chiusi su Names.NAME.
// <nec-restore-search> (Fase 3 del piano) legge lo stato via [selectors], non risolve piu' la
// classe Effects con l'Injector.
export const <%= clazz %>PersistenceEffects = createPersistenceEffects<<%= clazz %>>({
	feature: Names.NAME,
	selectId: <%= clazz %>.selectId,
	actions,
});
export const <%= clazz %>PersistenceReducer = createPersistenceReducer(Names.NAME);
export const <%= clazz %>PersistenceSelectors = createPersistenceSelectors(Names.NAME);
<% } %>
@NgModule({
	imports: [
		CommonModule,
		StoreModule.forFeature(Names.NAME, INJECTION_TOKEN),
		<% if (persist) { %>StoreModule.forFeature(necPersistenceFeatureKey(Names.NAME), <%= clazz %>PersistenceReducer),
		<% } %>EffectsModule.forFeature([<%= clazz %>StoreEffects<% if (persist) { %>, <%= clazz %>PersistenceEffects<% } %>]),
	],
	declarations: [],
	providers: [<%= clazz %>StoreEffects,
		{
			provide: INJECTION_TOKEN,
			useFactory: (): ActionReducer<State> => featureReducer
		}]
})
export class <%= clazz %>StoreModule {
}
```

- [ ] **Step 2: Run the schematics build**

There are no `*.spec.ts` files under `libs/ngrx-entity-crud/schematics/` today (confirmed before writing
this plan) — `--testPathPattern=schematics` would match zero tests and Jest would exit non-zero
("No tests found") without `passWithNoTests`, which isn't set in this repo's `jest.config.ts`. The
template is EJS, not plain TypeScript, so the only real verification available here is that the library
build (which runs ng-packagr, then compiles the schematics against `dist/ngrx-entity-crud`) still succeeds.

Run: `npm run build`
Expected: PASS — `nx build ngrx-entity-crud` (ng-packagr) followed by `build:schematics`
(`tsc -p dist/ngrx-entity-crud/tsconfig.schematics.json`) both succeed, with no TypeScript errors from
the updated template.

- [ ] **Step 3: Commit**

```bash
git add "libs/ngrx-entity-crud/schematics/store/files/crud-store/plural/__clazz@dasherize__-store/__clazz@dasherize__-store.module.ts"
git commit -m "$(cat <<'EOF'
feat(schematics): --persist also generates PersistenceReducer/PersistenceSelectors and registers the second StoreModule.forFeature

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Update docs (`README.md`, `TEST.md`, `ngrx-entity-crud-persistence-plan.md`)

**Files:**
- Modify: `libs/ngrx-entity-crud/README.md`
- Modify: `TEST.md`
- Modify: `ngrx-entity-crud-persistence-plan.md`

**Interfaces:** none (documentation only).

- [ ] **Step 1: Update `libs/ngrx-entity-crud/README.md`**

Replace:
```md
Local persistence (search results + drafts saved to IndexedDB, see the
[`ngrx-entity-crud/persistence`](#secondary-entry-point-ngrx-entity-crudpersistence) section below):
  - generates the `createPersistenceEffects` registration in `<clazz>-store.module.ts` and exports
    `<Clazz>PersistenceEffects`, so `EffectsModule.forFeature` picks it up automatically — same
    registration point for eager and lazy stores.
  - only meaningful for `--type=CRUD-PLURAL` (the other types don't have `entitiesSelected`/`Restore*`);
    passing it with another type is silently ignored, with a warning in the schematic log.
```
with:
```md
Local persistence (search results + drafts saved to IndexedDB, see the
[`ngrx-entity-crud/persistence`](#secondary-entry-point-ngrx-entity-crudpersistence) section below):
  - generates the `createPersistenceEffects`/`createPersistenceReducer`/`createPersistenceSelectors`
    registration in `<clazz>-store.module.ts`, exporting `<Clazz>PersistenceEffects`,
    `<Clazz>PersistenceReducer` and `<Clazz>PersistenceSelectors` — `EffectsModule.forFeature` and a
    second `StoreModule.forFeature` pick them up automatically, same registration point for eager
    and lazy stores.
  - only meaningful for `--type=CRUD-PLURAL` (the other types don't have `entitiesSelected`/`Restore*`);
    passing it with another type is silently ignored, with a warning in the schematic log.
```

Replace:
```md
Generates `CoinPersistenceEffects` in `coin-store.module.ts` and registers it alongside
`CoinStoreEffects`. Nothing else is required for the effects to work; to also show the local-data
status to the user, wrap the existing search button (see
[`ngrx-entity-crud/persistence`](#secondary-entry-point-ngrx-entity-crudpersistence) below).
```
with:
```md
Generates `CoinPersistenceEffects`, `CoinPersistenceReducer` and `CoinPersistenceSelectors` in
`coin-store.module.ts` and registers the effects/reducer alongside `CoinStoreEffects`. Nothing else
is required for the effects to work; to also show the local-data status to the user, wrap the
existing search button (see
[`ngrx-entity-crud/persistence`](#secondary-entry-point-ngrx-entity-crudpersistence) below).
```

Replace the "Per-section wiring" code blocks:
```md
```ts
import {createPersistenceEffects} from 'ngrx-entity-crud/persistence';
import {actions} from './coin.actions';
import {Coin} from '@models/vo/coin';
import {Names} from './coin.names';

export const CoinPersistenceEffects = createPersistenceEffects<Coin>({
  feature: Names.NAME,
  selectId: Coin.selectId,
  actions,
  // opzionale, sovrascrive il default globale di NecPersistenceModule.forRoot per QUESTA sezione:
  // autoRestore: {maxAgeMs: 60 * 60 * 1000},
});
```
```
```ts
@NgModule({
  imports: [
    // ...
    EffectsModule.forFeature([CoinStoreEffects, CoinPersistenceEffects]),
  ],
  providers: [CoinStoreEffects /* CoinPersistenceEffects non va in providers: e' gia' un Effects class */],
})
export class CoinStoreModule {}
```
```
with:
```md
```ts
import {createPersistenceEffects, createPersistenceReducer, createPersistenceSelectors, necPersistenceFeatureKey} from 'ngrx-entity-crud/persistence';
import {actions} from './coin.actions';
import {Coin} from '@models/vo/coin';
import {Names} from './coin.names';

export const CoinPersistenceEffects = createPersistenceEffects<Coin>({
  feature: Names.NAME,
  selectId: Coin.selectId,
  actions,
  // optional, overrides NecPersistenceModule.forRoot's global default for THIS section:
  // autoRestore: {maxAgeMs: 60 * 60 * 1000},
});
export const CoinPersistenceReducer = createPersistenceReducer(Names.NAME);
export const CoinPersistenceSelectors = createPersistenceSelectors(Names.NAME);
```
```
```ts
@NgModule({
  imports: [
    // ...
    StoreModule.forFeature(necPersistenceFeatureKey(Names.NAME), CoinPersistenceReducer),
    EffectsModule.forFeature([CoinStoreEffects, CoinPersistenceEffects]),
  ],
  providers: [CoinStoreEffects /* CoinPersistenceEffects/Reducer/Selectors don't go in providers */],
})
export class CoinStoreModule {}
```
```

Replace the `<nec-restore-search>` example and table:
```md
```ts
import {NecRestoreSearchComponent} from 'ngrx-entity-crud/persistence';
import {CoinPersistenceEffects} from '@root-store/coin-store';
```
```
```html
<nec-restore-search feature="coin" [effects]="CoinPersistenceEffects" [actions]="actions">
  <button pButton label="Search" icon="pi pi-search" (click)="search()"></button>
</nec-restore-search>
```

| Input | Type | Notes |
| --- | --- | --- |
| `feature` | `string` | Only used for display; must match the `feature` passed to `createPersistenceEffects`. |
| `effects` | `Type<NecPersistenceEffects>` | The class exported by `createPersistenceEffects` (`CoinPersistenceEffects` above), resolved via `Injector` — same one `EffectsModule.forFeature` registered, so no extra `stats()` query. |
| `actions` | `Actions<T>` | The section's action group (`actions` from `<clazz>.actions.ts`). |
| `quotaWarningThreshold` | `number` | Default `0.9`. Fraction of `storage.estimate()` above which the "storage almost full" tag appears. |
```
with:
```md
```ts
import {NecRestoreSearchComponent} from 'ngrx-entity-crud/persistence';
import {CoinPersistenceSelectors} from '@root-store/coin-store';
```
```
```html
<nec-restore-search feature="coin" [selectors]="CoinPersistenceSelectors" [actions]="actions">
  <button pButton label="Search" icon="pi pi-search" (click)="search()"></button>
</nec-restore-search>
```

| Input | Type | Notes |
| --- | --- | --- |
| `feature` | `string` | Only used for display; must match the `feature` passed to `createPersistenceEffects`. |
| `selectors` | `NecPersistenceSelectors` | The object returned by `createPersistenceSelectors` (`CoinPersistenceSelectors` above). The component reads `sectionCheck` from the store — no `Injector`, no dependency on the Effects class. |
| `actions` | `Actions<T>` | The section's action group (`actions` from `<clazz>.actions.ts`). |
| `quotaWarningThreshold` | `number` | Default `0.9`. Fraction of `storage.estimate()` above which the "storage almost full" tag appears. |
```

- [ ] **Step 2: Update `TEST.md`**

Replace:
```
#   import {CoinPersistenceEffects} from '@root-store/coin-store';
#   <nec-restore-search feature="coin" [effects]="CoinPersistenceEffects" [actions]="actions">
```
with:
```
#   import {CoinPersistenceSelectors} from '@root-store/coin-store';
#   <nec-restore-search feature="coin" [selectors]="CoinPersistenceSelectors" [actions]="actions">
```

- [ ] **Step 3: Update `ngrx-entity-crud-persistence-plan.md`**

Insert this new bullet right before the `- **Fase 5 — dopo la validazione sul campo.**` line (after the "Opzione `--persist` sullo schematic `section`" sub-bullet's closing text `...preferito a un automatismo fragile.`):

```md
- **Nota (revisione dopo Fase 4).** Il pattern di Fase 2/3 per `sectionCheck` — un Effect come fonte di
  stato, letto dal componente risolvendo la classe generata da `createPersistenceEffects` via `Injector`
  (`[effects]="LaClasseGenerata"`) — è stato sostituito: un Effect non deve essere una fonte di stato letta
  da un componente. `createPersistenceEffects` non espone più `sectionCheck$`/`ReplaySubject`;
  `autoRestoreCheckOn$` dispatcha `SectionCheckSuccess` (nuova azione con `type` scoped per `feature`,
  `nec-persistence-actions.ts`), un reducer dedicato (`createPersistenceReducer`, montato con un secondo
  `StoreModule.forFeature` su `necPersistenceFeatureKey(feature)`) lo scrive nello store, e
  `createPersistenceSelectors` lo espone al componente (`@Input() selectors` sostituisce `@Input() effects`
  + `Injector`). L'auto-dispatch di `RestoreRequest` è ora un effect separato (`autoRestoreTriggerOn$`) che
  ascolta `SectionCheckSuccess`. Vedi
  `docs/superpowers/specs/2026-09-17-persistence-section-check-store-design.md` per il design completo.
```

- [ ] **Step 4: Commit**

```bash
git add libs/ngrx-entity-crud/README.md TEST.md ngrx-entity-crud-persistence-plan.md
git commit -m "$(cat <<'EOF'
docs(persistence): document selectors-based sectionCheck wiring

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Full library test suite**

Run: `npm run testLibs`
Expected: PASS, no failing suites

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors (watch specifically for unused imports left over from removing `Injector`/`Type`/`ReplaySubject`/`NecPersistenceEffects` in Tasks 5-6)

- [ ] **Step 3: Build (library + schematics)**

Run: `npm run build`
Expected: PASS — confirms `dist/ngrx-entity-crud/persistence` picks up the three new files via `public-api.ts` (Task 7) and the schematics step compiles the updated EJS template (Task 8)

- [ ] **Step 4: Report**

No commit for this task — if any step fails, fix it within the task that introduced the regression (re-open that task, don't patch it here) and re-run Steps 1-3.
