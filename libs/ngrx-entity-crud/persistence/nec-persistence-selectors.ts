import {createFeatureSelector, createSelector, MemoizedSelector} from '@ngrx/store';
import {NecSaveMode, NecSectionCheck} from './models';
import {necPersistenceFeatureKey, NecPersistenceState} from './nec-persistence-reducer';

export interface NecPersistenceSelectors {
  readonly sectionCheck: MemoizedSelector<object, NecSectionCheck | null>;
  /** Comodo per il toggle in `<nec-restore-search>`: default `'on-draft'` prima di ogni check. */
  readonly saveMode: MemoizedSelector<object, NecSaveMode>;
}

export function createPersistenceSelectors(feature: string): NecPersistenceSelectors {
  const selectPersistenceState = createFeatureSelector<NecPersistenceState>(necPersistenceFeatureKey(feature));
  const sectionCheck = createSelector(selectPersistenceState, (state) => state?.check ?? null);
  const saveMode = createSelector(sectionCheck, (check) => check?.saveMode ?? 'on-draft');
  return {sectionCheck, saveMode};
}
