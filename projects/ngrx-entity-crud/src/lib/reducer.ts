import {Actions, EntityCrudState} from './models';
import {EntityAdapter} from '@ngrx/entity';
import {createReducer, on} from '@ngrx/store';

export function createCrudReducerFactory<T>(adapter: EntityAdapter<T>) {

  function createCrudReducer<S extends EntityCrudState<T>>(initialState: S, actions: Actions<T>) {
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

    return createReducer<S>(initialState,

      on(SearchRequest, (state: S, {type, path, mode, queryParams}) => {
        if (!path && !mode && !queryParams) {
          throw new Error('It is not possible a search without payload, use :\'{criteria:{}}\'');
        }
        if (mode === 'REFRESH') {
          return Object.assign(
            {},
            state,
            {
              isLoading: true,
              lastCriteria: {path, mode, queryParams}
            }
          );
        }
        return adapter.removeAll(
          Object.assign(
            {},
            state,
            {
              isLoading: true,
              lastCriteria: {path, mode, queryParams}
            })
        );
      }),
      on(DeleteRequest, EditRequest, CreateRequest, (state: S, {item, options, type}) => {
        return Object.assign(
          {},
          state,
          {isLoading: true}
        );
      }),
      on(SearchSuccess, (state: S, {type, items}) => adapter.addAll(items, Object.assign(
        {},
        state,
        {
          isLoaded: true,
          isLoading: false,
          error: null
        }
      ))),
      on(DeleteSuccess, (state: S, {type, id}) => adapter.removeOne(id,
        Object.assign(
          {}, state,
          {
            isLoaded: true,
            isLoading: false,
            error: null
          }
        ))),
      on(CreateSuccess, (state: S, {type, item}) => adapter.addOne(item,
        Object.assign(
          {}, state,
          {
            isLoaded: true,
            isLoading: false,
            error: null
          }
        ))),
      on(EditSuccess, (state: S, {item, type}) => adapter.upsertOne(item,
        Object.assign(
          {}, state,
          {
            isLoaded: true,
            isLoading: false,
            error: null
          }
        ))),
      on(Filters, (state: S, {type, filters}) => Object.assign({}, state, {filters})),
      on(SelectItem, (state: S, {type, item}) => Object.assign({}, state, {itemSelected: item})),
      on(SelectItems, (state: S, {type, items}) => Object.assign({}, state, {itemsSelected: items})),
      on(SelectSuccess, (state: S, {type, item}) =>
        Object.assign(
          {}, state,
          {
            itemSelected: item,
            isLoaded: true,
            isLoading: false,
            error: null
          }
        )),
      on(
        SearchFailure,
        DeleteFailure,
        CreateFailure,
        (state: S, {type, error}) => Object.assign(
          {},
          state,
          {
            isLoaded: false,
            isLoading: false,
            error
          }
        )),
      on(
        EditFailure,
        SelectFailure,
        (state: S, {error, type}) => Object.assign(
          {},
          state,
          {
            isLoaded: false,
            isLoading: false,
            error
          }
        )),
      on(Reset, () => initialState)
    );
  }

  return {
    createCrudReducer
  };
}
