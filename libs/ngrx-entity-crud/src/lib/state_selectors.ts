import {CrudBaseState, CrudState, Dictionary, EntityCrudBaseSelectors, EntityCrudBaseState, EntityCrudSelectors, EntityCrudState, EntitySingleCrudSelectors, EntitySingleCrudState, FilterMetadata, ICriteria, OptResponse, SingleCrudState} from './models';
import {createSelector, MemoizedSelector} from '@ngrx/store';
import {jNgrxFilter} from './j-ngrx-filter';

const getError = <T>(state: CrudBaseState<T>): any => state.error;
const getIsLoading = <T>(state: CrudBaseState<T>): boolean => state.isLoading;
const getIsLoaded = <T>(state: CrudBaseState<T>): boolean => state.isLoaded;
const getFilters = <T>(state: CrudState<T>): { [s: string]: FilterMetadata; } => state.filters;
const getLastCriteria = <T>(state: CrudBaseState<T>): ICriteria => state.lastCriteria;
const getItemSelected = <T>(state: CrudState<T>): T => state.itemSelected;
const getIdSelected = <T>(state: CrudState<T>): string | number => state.idSelected;
const getEntitiesSelected = <T>(state: CrudState<T>): Dictionary<T> => state.entitiesSelected;
const getIdsSelected = <T>(state: CrudState<T>): string[] | number[] => state.idsSelected;
const getRespones = <T>(state: CrudBaseState<T>): OptResponse<T>[] => state.responses;
const getItem = <T>(state: SingleCrudState<T>): T => state.item;

export function getCrudBaseSelectors<T, V>(
  selectState: (state: V) => EntityCrudBaseState<T>
): EntityCrudBaseSelectors<T, V> {
  const selectError: MemoizedSelector<V, any> = createSelector(selectState, getError);
  const selectIsLoading: MemoizedSelector<V, boolean> = createSelector(selectState, getIsLoading);
  const selectIsLoaded: MemoizedSelector<V, boolean> = createSelector(selectState, getIsLoaded);
  const selectLastCriteria: MemoizedSelector<V, ICriteria> = createSelector(selectState, getLastCriteria);
  const selectResponses: MemoizedSelector<V, OptResponse<T>[]> = createSelector(selectState, getRespones);

  const selectItemSelected: MemoizedSelector<V, T> = createSelector(selectState, getItemSelected) as MemoizedSelector<V, T>;

  return {
    selectError,
    selectIsLoading,
    selectIsLoaded,
    selectLastCriteria,
    selectResponses,
    selectItemSelected
  };
}

export function getSingeCrudSelectors<T, V>(
  selectState: (state: V) => EntitySingleCrudState<T>
): EntitySingleCrudSelectors<T, V> {
  const {
    selectError,
    selectIsLoading,
    selectIsLoaded,
    selectLastCriteria,
    selectResponses,
    selectItemSelected
  } = getCrudBaseSelectors(selectState);

  const selectItem: MemoizedSelector<V, T> = createSelector(selectState, getItem) as MemoizedSelector<V, T>
  return {
    selectItem,
    selectError,
    selectIsLoading,
    selectIsLoaded,
    selectLastCriteria,
    selectResponses,
    selectItemSelected
  };
}

export function createCrudSelectorsFactory<T>(adapter) {
  function getCrudSelectors<V>(
    selectState: (state: V) => EntityCrudState<T>
  ): EntityCrudSelectors<T, V> {

    const selectFilters: MemoizedSelector<V, { [s: string]: FilterMetadata; }> = createSelector(
      selectState,
      getFilters
    );

    const selectEntitiesSelected: MemoizedSelector<V, Dictionary<T>> = createSelector(selectState, getEntitiesSelected) as MemoizedSelector<V, Dictionary<T>>
    const selectItemsSelected: MemoizedSelector<V, T[]> = createSelector(selectEntitiesSelected, (entities: Dictionary<T>) => Object.values(entities)) as MemoizedSelector<V, T[]>

    const selectIdSelected: MemoizedSelector<V, string | number> = createSelector(selectState, getIdSelected);
    const selectIdsSelected: MemoizedSelector<V, string[] | number[]> = createSelector(selectState, getIdsSelected);

    const {
      selectError,
      selectIsLoading,
      selectIsLoaded,
      selectLastCriteria,
      selectResponses,
      selectItemSelected
    } = getCrudBaseSelectors(selectState);

    const {
      selectAll,
      selectEntities,
      selectIds,
      selectTotal
    } = adapter.getSelectors(selectState);

    const selectItemsSelectedOrigin = createSelector(
      selectIdsSelected,
      selectEntities,
      (ids: any[], entities: Dictionary<T>): any =>
        ids.map((id: any) => (entities[id] as T))
    );

    const selectItemSelectedOrigin = createSelector(
      selectIdSelected,
      selectEntities,
      (id, entities: Dictionary<T>): any => entities[id]
    );

    const selectFilteredItems: MemoizedSelector<any, T[]> = createSelector([selectAll, selectFilters],
      (allTasks: T[], filters: { [s: string]: FilterMetadata; }): T[] => {
        return jNgrxFilter<T>(allTasks, filters);
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
      selectIdSelected,
      selectItemSelected,
      selectItemSelectedOrigin,
      selectIdsSelected,
      selectItemsSelected,
      selectEntitiesSelected,
      selectItemsSelectedOrigin,
      selectResponses,
    };
  }

  return {getCrudSelectors};
}
