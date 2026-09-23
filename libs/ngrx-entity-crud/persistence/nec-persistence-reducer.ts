import {ActionReducer, createReducer, on} from '@ngrx/store';
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
 */
export function createPersistenceReducer(
  feature: string,
  persistenceActions: NecPersistenceActions = createPersistenceActions(feature)
): ActionReducer<NecPersistenceState> {
  const sectionCheckSuccess = persistenceActions.SectionCheckSuccess;
  const setSectionSaveMode = persistenceActions.SetSectionSaveMode;
  return createReducer(
    NEC_PERSISTENCE_INITIAL_STATE,
    on(sectionCheckSuccess, (state, {check}): NecPersistenceState => ({...state, check})),
    on(setSectionSaveMode, (state, {mode}): NecPersistenceState => ({
      ...state,
      check: state.check
        ? {...state.check, saveMode: mode}
        : {stats: null, autoRestoreTriggered: false, saveMode: mode},
    }))
  );
}
