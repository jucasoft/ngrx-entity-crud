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
