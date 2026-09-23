import {ActionReducer, createReducer, on, ReducerTypes} from '@ngrx/store';
import {Actions} from 'ngrx-entity-crud';
import {NecSectionCheck} from './models';
import {createPersistenceActions, NecPersistenceActions} from './nec-persistence-actions';

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

/**
 * @param persistenceActions gruppo creato da `createPersistenceActions(feature)`: se omesso le azioni
 *   vengono ricreate da `feature` (compatibilità con le beta precedenti).
 * @param crudActions azioni CRUD della sezione: se presenti, una `SearchRequest` azzera `stats` del
 *   check (gli effects hanno appena cancellato i dati locali con `purgeSection`), cosi'
 *   `<nec-restore-search>` non propone piu' un ripristino di dati che non esistono.
 */
export function createPersistenceReducer<T = unknown>(
  feature: string,
  persistenceActions: NecPersistenceActions = createPersistenceActions(feature),
  crudActions?: Actions<T>
): ActionReducer<NecPersistenceState> {
  const sectionCheckSuccess = persistenceActions.SectionCheckSuccess;
  const setSectionSaveMode = persistenceActions.SetSectionSaveMode;
  const crudOns: ReducerTypes<NecPersistenceState, any>[] = crudActions
    ? [on(crudActions.SearchRequest, (state): NecPersistenceState => ({
      ...state,
      check: state.check ? {...state.check, stats: null, autoRestoreTriggered: false} : state.check,
    }))]
    : [];
  return createReducer(
    NEC_PERSISTENCE_INITIAL_STATE,
    ...crudOns,
    on(sectionCheckSuccess, (state, {check}): NecPersistenceState => ({...state, check})),
    on(setSectionSaveMode, (state, {mode}): NecPersistenceState => ({
      ...state,
      check: state.check
        ? {...state.check, saveMode: mode}
        : {stats: null, autoRestoreTriggered: false, saveMode: mode},
    }))
  );
}
