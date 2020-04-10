import {Actions, EntityCrudState, ICriteria, OptRequest} from './models';
import {EntityAdapter} from '@ngrx/entity';
import {createReducer, on} from '@ngrx/store';

export function evalData<T>(fn: () => T, def: any = null): T {
  try {
    return fn();
  } catch (e) {
    return def;
  }
}

export function createCrudReducerFactory<T>(adapter: EntityAdapter<T>) {

  function createCrudReducer<S extends EntityCrudState<T>>(initialState: S, actions: Actions<T>) {
    const {
      Response,
      ResetResponses,

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
      SelectItem,

      Edit,
      Create,
      Delete,
    } = actions;

    return createReducer<S>(initialState,

      on(SearchRequest, (state: S, criteria: ICriteria) => {
        if (!criteria.path && !criteria.mode && !criteria.queryParams) {
          throw new Error('It is not possible a search without payload, use :\'{criteria:{}}\'');
        }
        if (criteria.mode === 'REFRESH' || criteria.mode === 'upsertMany') {
          return Object.assign(
            {},
            state,
            {
              isLoading: true,
              lastCriteria: criteria
            }
          );
        }
        return adapter.removeAll(
          Object.assign(
            {},
            state,
            {
              isLoading: true,
              lastCriteria: criteria
            })
        );
      }),
      on(DeleteRequest, EditRequest, CreateRequest, (state: S, request: OptRequest<T>) => {
        return Object.assign(
          {},
          state,
          {isLoading: true}
        );
      }),
      on(SearchSuccess, (state: S, {type, items}) => {
        const mode = evalData(() => state.lastCriteria.mode, null) || 'addAll';
        let method;
        switch (mode) {
          case  'REFRESH' : {
            // console.log('REFRESH');
            method = adapter.addAll;
            break;
          }
          case 'upsertMany': {
            // console.log('upsertMany');
            method = adapter.upsertMany;
            break;
          }
          case 'addAll': {
            // console.log('addAll');
            method = adapter.addAll;
            break;
          }
          default: {
            // console.log('default');
            method = adapter.addAll;
            break;
          }
        }

        return method(items, Object.assign(
          {},
          state,
          {
            isLoaded: true,
            isLoading: false,
            error: null
          }
        ));
      }),
      on(DeleteSuccess, Delete, (state: S, {type, id}) => adapter.removeOne(id,
        Object.assign(
          {}, state,
          {
            isLoaded: true,
            isLoading: false,
            error: null
          }
        ))),
      on(Response, (state: S, response) => {
          const responses = [...state.responses, response];
          return {...{}, ...state, ...{responses}};
        }
      ),
      on(ResetResponses, (state: S) => {
          const responses = [];
          return {...state, ...{responses}};
        }
      ),
      on(CreateSuccess, Create, (state: S, {type, item}) => adapter.addOne(item,
        Object.assign(
          {}, state,
          {
            isLoaded: true,
            isLoading: false,
            error: null
          }
        ))),
      on(EditSuccess, Edit, (state: S, {item, type}) => adapter.upsertOne(item,
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
