import {on, reducer} from 'ts-action';
import {Actions, EntityCrudState} from './models';
import {EntityAdapter} from '@ngrx/entity';

export function createCrudReducerFactory<T>(adapter: EntityAdapter<T>) {

  function createCrudReducer<S>(initialState: S, actions: Actions<T>) {
    const {
      SearchRequest,
      DeleteRequest,
      EditRequest,
      CreateRequest,
      SelectRequest,

      SearchSuccess,
      DeleteSuccess,
      CreateSuccess,
      SelectSuccess,
      EditSuccess,

      SearchFailure,
      DeleteFailure,
      CreateFailure,
      SelectFailure,
      EditFailure,

      // azioni locali:
      Reset,
      Filters,
      SelectItems,
      SelectItem
    } = actions;

    return reducer([
      on({SearchRequest}, (state: EntityCrudState<T>, {payload}) => {
        if (!payload) {
          throw new Error('It is not possible a search without payload, use :\'{criteria:{}}\'');
        }
        if (payload.mode === 'REFRESH') {
          return ({
            ...state,
            isLoading: true,
            lastCriteria: payload.criteria
          });
        }
        return adapter.removeAll(({
          ...state,
          isLoading: true,
          lastCriteria: payload.criteria
        }));
      }),
      on({DeleteRequest, EditRequest, CreateRequest}, (state: EntityCrudState<T>, {payload}) => {
        return ({
          ...state,
          isLoading: true
        });
      }),
      on(SearchRequest, (state: EntityCrudState<T>, {payload}) => {
        // TODO: verificare se sia necessario svuotare ulteriori dati.
        return ({
          ...state,
          isLoading: true
        });
      }),
      on(SearchSuccess, (state: EntityCrudState<T>, {payload}) => adapter.addAll(payload.items, {
        ...state,
        isLoaded: true,
        isLoading: false,
        error: null
      })),
      on(DeleteSuccess, (state: EntityCrudState<T>, {payload}) => adapter.removeOne(payload.id, {
        ...state,
        isLoaded: true,
        isLoading: false,
        error: null
      })),
      on(CreateSuccess, (state: EntityCrudState<T>, {payload}) => adapter.addOne(payload.item, {
        ...state,
        isLoaded: true,
        isLoading: false,
        error: null
      })),
      on(EditSuccess, (state: EntityCrudState<T>, {payload}) => adapter.upsertOne(payload.item, {
        ...state,
        isLoaded: true,
        isLoading: false,
        error: null
      })),
      on(Filters, (state: EntityCrudState<T>, {payload}) => ({...state, ...{filters: payload.filters}})),
      on(SelectItem, (state: EntityCrudState<T>, {payload}) => ({...state, ...{itemSelected: payload.item}})),
      on(SelectItems, (state: EntityCrudState<T>, {payload}) => ({...state, ...{itemsSelected: payload.items}})),
      on(SelectSuccess, (state: EntityCrudState<T>, {payload}) => ({
        ...state,
        itemSelected: payload.item,
        isLoaded: true,
        isLoading: false,
        error: null
      })),
      on(Reset, () => initialState),
      on({
        SearchFailure,
        DeleteFailure,
        CreateFailure,
        EditFailure,
        SelectFailure,
      }, (state, {payload}) => ({
        ...state,
        isLoaded: false,
        isLoading: false,
        error: payload.error
      }))
    ], initialState);

  }

  return {
    createCrudReducer
  };
}
