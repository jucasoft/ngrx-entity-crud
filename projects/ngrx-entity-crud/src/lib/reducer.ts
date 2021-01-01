import {Actions, EntityCrudState, ICriteria, OptRequest} from './models';
import {EntityAdapter} from '@ngrx/entity';
import {createReducer, on} from '@ngrx/store';
import {On} from '@ngrx/store/src/reducer_creator';

export function evalData<T>(fn: () => T, def: any = null): T {
  try {
    return fn();
  } catch (e) {
    return def;
  }
}

export function createCrudOns<T, S extends EntityCrudState<T>>(adapter: EntityAdapter<T>, initialState: S, actions: Actions<T>): { [key: string]: On<S> } {
  const searchRequestOn = on(actions.SearchRequest, (state: S, criteria: ICriteria) => {
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
  });
  const deleteRequestOn = on(actions.DeleteRequest, (state: S, request: OptRequest<T>) => {
    return Object.assign(
      {},
      state,
      {isLoading: true}
    );
  });
  const editRequestOn = on(actions.EditRequest, (state: S, request: OptRequest<T>) => {
    return Object.assign(
      {},
      state,
      {isLoading: true}
    );
  });
  const createRequestOn = on(actions.CreateRequest, (state: S, request: OptRequest<T>) => {
    return Object.assign(
      {},
      state,
      {isLoading: true}
    );
  });
  const selectRequestOn = on(actions.SelectRequest, (state: S, request: OptRequest<T>) => {
    return Object.assign(
      {},
      state,
      {isLoading: true}
    );
  });

  const searchSuccessOn = on(actions.SearchSuccess, (state: S, {type, items, request }) => {
    console.log('createCrudOns()');
    const mode = evalData(() => request.mode, null) || 'setAll';
    let method;
    switch (mode) {
      case  'REFRESH' : {
        // console.log('REFRESH');
        method = adapter.setAll;
        break;
      }
      case 'upsertMany': {
        // console.log('upsertMany');
        method = adapter.upsertMany;
        break;
      }
      case 'setAll': {
        // console.log('setAll');
        method = adapter.setAll;
        break;
      }
      default: {
        // console.log('default');
        method = adapter.setAll;
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
  });
  const deleteSuccessOn = on(actions.DeleteSuccess, (state: S, {type, id}) => adapter.removeOne(id,
    Object.assign(
      {}, state,
      {
        isLoaded: true,
        isLoading: false,
        error: null
      }
    )));
  const deleteOn = on(actions.Delete, (state: S, {type, id}) => adapter.removeOne(id,
    Object.assign(
      {}, state,
      {
        isLoaded: true,
        isLoading: false,
        error: null
      }
    )));
  const responseOn = on(actions.Response, (state: S, response) => {
    const responses = [...state.responses, response];
    return {...{}, ...state, ...{responses}};
  });

  const resetResponsesOn = on(actions.ResetResponses, (state: S) => {
      const responses = [];
      return {...state, ...{responses}};
    }
  );
  const createSuccessOn = on(actions.CreateSuccess, (state: S, {type, item}) => adapter.addOne(item,
    Object.assign(
      {}, state,
      {
        isLoaded: true,
        isLoading: false,
        error: null
      }
    )));
  const createOn = on(actions.Create, (state: S, {type, item}) => adapter.addOne(item,
    Object.assign(
      {}, state,
      {
        isLoaded: true,
        isLoading: false,
        error: null
      }
    )));
  const editSuccessOn = on(actions.EditSuccess, (state: S, {item, type}) => adapter.upsertOne(item,
    Object.assign(
      {}, state,
      {
        isLoaded: true,
        isLoading: false,
        error: null
      }
    )));
  const editOn = on(actions.Edit, (state: S, {item, type}) => adapter.upsertOne(item,
    Object.assign(
      {}, state,
      {
        isLoaded: true,
        isLoading: false,
        error: null
      }
    )));
  const filtersOn = on(actions.Filters, (state: S, {type, filters}) => Object.assign({}, state, {filters}));
  const selectItemOn = on(actions.SelectItem, (state: S, {type, item}) => Object.assign({}, state, {itemSelected: item}));
  const selectItemsOn = on(actions.SelectItems, (state: S, {type, items}) => Object.assign({}, state, {itemsSelected: items}));
  const selectSuccessOn = on(actions.SelectSuccess, (state: S, {type, item}) =>
    Object.assign(
      {}, state,
      {
        itemSelected: item,
        isLoaded: true,
        isLoading: false,
        error: null
      }
    ));
  const searchFailureOn = on(
    actions.SearchFailure,
    (state: S, {type, error}) => Object.assign(
      {},
      state,
      {
        isLoaded: false,
        isLoading: false,
        error
      }
    ));
  const deleteFailureOn = on(
    actions.DeleteFailure,
    (state: S, {type, error}) => Object.assign(
      {},
      state,
      {
        isLoaded: false,
        isLoading: false,
        error
      }
    ));
  const createFailureOn = on(
    actions.CreateFailure,
    (state: S, {type, error}) => Object.assign(
      {},
      state,
      {
        isLoaded: false,
        isLoading: false,
        error
      }
    ));
  const editFailureOn = on(
    actions.EditFailure,
    (state: S, {error, type}) => Object.assign(
      {},
      state,
      {
        isLoaded: false,
        isLoading: false,
        error
      }
    ));
  const selectFailureOn = on(
    actions.SelectFailure,
    (state: S, {error, type}) => Object.assign(
      {},
      state,
      {
        isLoaded: false,
        isLoading: false,
        error
      }
    ));
  const resetOn = on(actions.Reset, () => initialState);
  return {
    responseOn,
    resetResponsesOn,
    searchRequestOn,
    deleteRequestOn,
    editRequestOn,
    createRequestOn,
    selectRequestOn,
    searchSuccessOn,
    deleteSuccessOn,
    createSuccessOn,
    selectSuccessOn,
    editSuccessOn,
    searchFailureOn,
    deleteFailureOn,
    createFailureOn,
    selectFailureOn,
    editFailureOn,
    resetOn,
    filtersOn,
    selectItemsOn,
    selectItemOn,
    editOn,
    createOn,
    deleteOn
  };

}

export function createCrudReducerFactory<T>(adapter: EntityAdapter<T>) {
  function createCrudReducer<S extends EntityCrudState<T>>(initialState: S, actions: Actions<T>, ...ons: On<S>[]) {
    const {
      responseOn,
      resetResponsesOn,
      searchRequestOn,
      deleteRequestOn,
      editRequestOn,
      createRequestOn,
      selectRequestOn,
      searchSuccessOn,
      deleteSuccessOn,
      createSuccessOn,
      selectSuccessOn,
      editSuccessOn,
      searchFailureOn,
      deleteFailureOn,
      createFailureOn,
      selectFailureOn,
      editFailureOn,
      resetOn,
      filtersOn,
      selectItemsOn,
      selectItemOn,
      editOn,
      createOn,
      deleteOn
    } = createCrudOns(adapter, initialState, actions);
    const totalOns: On<S>[] = [
      ...ons,
      responseOn,
      resetResponsesOn,
      searchRequestOn,
      deleteRequestOn,
      editRequestOn,
      createRequestOn,
      selectRequestOn,
      searchSuccessOn,
      deleteSuccessOn,
      createSuccessOn,
      selectSuccessOn,
      editSuccessOn,
      searchFailureOn,
      deleteFailureOn,
      createFailureOn,
      selectFailureOn,
      editFailureOn,
      resetOn,
      filtersOn,
      selectItemsOn,
      selectItemOn,
      editOn,
      createOn,
      deleteOn
    ];
    return createReducer<S>(initialState,
      ...totalOns
    );
  }

  return {
    createCrudReducer
  };
}
