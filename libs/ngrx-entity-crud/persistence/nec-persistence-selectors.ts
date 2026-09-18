import {createFeatureSelector, createSelector, MemoizedSelector} from '@ngrx/store';
import {NecSectionCheck} from './models';
import {necPersistenceFeatureKey, NecPersistenceState} from './nec-persistence-reducer';

export interface NecPersistenceSelectors {
  readonly sectionCheck: MemoizedSelector<object, NecSectionCheck | null>;
}

export function createPersistenceSelectors(feature: string): NecPersistenceSelectors {
  const selectPersistenceState = createFeatureSelector<NecPersistenceState>(necPersistenceFeatureKey(feature));
  const sectionCheck = createSelector(selectPersistenceState, (state) => state?.check ?? null);
  return {sectionCheck};
}
