import {CrudState, EntityCrudSelectors, EntityCrudState, ICriteria} from './models';
import {FilterMetadata} from 'primeng/api';
import {createSelector, MemoizedSelector} from '@ngrx/store';
import {filter, IFilter} from './filter';

export function createCrudSelectorsFactory<T>(adapter) {

  function getCrudSelectors<V>(
    selectState: (state: V) => EntityCrudState<T>
  ): EntityCrudSelectors<T, V>;
  function getCrudSelectors<V>(
    selectState: (state: V) => EntityCrudState<T>
  ): EntityCrudSelectors<T, V> {

    const getError = (state: CrudState<T>): any => state.error;
    const getIsLoading = (state: CrudState<T>): boolean => state.isLoading;
    const getIsLoaded = (state: CrudState<T>): boolean => state.isLoaded;
    const getFilters = (state: CrudState<T>): { [s: string]: FilterMetadata; } => state.filters;
    const getLastCriteria = (state: CrudState<T>): ICriteria => state.lastCriteria;
    const getItemSelected = (state: CrudState<T>): T => state.itemSelected;
    const getItemsSelected = (state: CrudState<T>): T[] => state.itemsSelected;

    const selectError: MemoizedSelector<V, any> = createSelector(selectState, getError);
    const selectIsLoading: MemoizedSelector<V, boolean> = createSelector(selectState, getIsLoading);
    const selectIsLoaded: MemoizedSelector<V, boolean> = createSelector(selectState, getIsLoaded);
    const selectFilters: MemoizedSelector<V, { [s: string]: IFilter; }> = createSelector(
      selectState,
      getFilters
    );
    const selectLastCriteria: MemoizedSelector<V, ICriteria> = createSelector(selectState, getLastCriteria);
    const selectItemSelected: MemoizedSelector<V, T> = createSelector(selectState, getItemSelected);
    const selectItemsSelected: MemoizedSelector<V, T[]> = createSelector(selectState, getItemsSelected);

    const {
      selectAll,
      selectEntities,
      selectIds,
      selectTotal
    } = adapter.getSelectors(selectState);

    const selectFilteredItems: MemoizedSelector<any, T[]> = createSelector([selectAll, selectFilters],
      (allTasks: T[], filters: { [s: string]: IFilter; }): T[] => {
        return filter<T>(allTasks, filters);
      }
    );

    return {
      selectError,
      selectIsLoading,
      selectIsLoaded,
      selectFilters,
      selectFilteredItems,
      selectAll,
      selectEntities,
      selectIds,
      selectTotal,
      selectLastCriteria,
      selectItemSelected,
      selectItemsSelected,
    };
  }

  return {getCrudSelectors};
}
