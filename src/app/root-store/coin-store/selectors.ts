import {createFeatureSelector, MemoizedSelector} from '@ngrx/store';

import {adapter, State} from './state';
import {Names} from './names';

export const selectState: MemoizedSelector<object, State> = createFeatureSelector<State>(Names.NAME);

export const {
  selectTotal,
  selectIds,
  selectEntities,
  selectFilters,
  selectError,
  selectIsLoading,
  selectIsLoaded,
  selectFilteredItems,
  selectAll
} = adapter.getCrudSelectors(selectState);
