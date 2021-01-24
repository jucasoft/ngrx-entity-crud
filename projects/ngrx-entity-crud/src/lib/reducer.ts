import {Actions, EntityCrudState, ICriteria, OptManyRequest, OptRequest} from './models';
import {EntityAdapter} from '@ngrx/entity';
import {createReducer, on} from '@ngrx/store';
import {On} from '@ngrx/store/src/reducer_creator';
import {isDevMode} from '@angular/core';
import {selectIdValue} from './utils';

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
  const deleteManyRequestOn = on(actions.DeleteManyRequest, (state: S, request: OptManyRequest<T>) => {
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
  const editManyRequestOn = on(actions.EditManyRequest, (state: S, request: OptManyRequest<T>) => {
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
  const createManyRequestOn = on(actions.CreateManyRequest, (state: S, request: OptManyRequest<T>) => {
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

  const searchSuccessOn = on(actions.SearchSuccess, (state: S, {type, items, request}) => {
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
  const deleteSuccessOn = on(actions.DeleteSuccess, (state: S, {type, id}) => {

      // tolgo dallo store.idsSelected l'elemento cancellato
      const idsSelected = (state.idsSelected as any[]).filter((idA) => idA === id);

      // se ho cancellato l'id seezionato, lo tolgo dallo store.
      const idSelected = !!state.idSelected && state.idSelected === id ? null : state.idSelected;

      return adapter.removeOne(id,
        Object.assign(
          {}, state,
          {
            isLoaded: true,
            isLoading: false,
            error: null,
            idSelected,
            idsSelected
          }
        ));
    }
  );

  const deleteManySuccessOn = on(actions.DeleteManySuccess, (state: S, {type, ids}) => {

    // tolgo dallo store.idsSelected gli elementi che sono stati cancellati.
    const idsSelected = (state.idsSelected as any[]).filter((id) => !(id in ids));

    // se ho cancellato l'id seezionato, lo tolgo dallo store.
    const idSelected = !!state.idSelected && state.idSelected in ids ? null : state.idSelected;

    return adapter.removeMany(ids,
      Object.assign(
        {}, state,
        {
          isLoaded: true,
          isLoading: false,
          error: null,
          idSelected,
          idsSelected
        }
      ));
  });

  const deleteOn = on(actions.Delete, (state: S, {type, id}) => {
      // tolgo dallo store.idsSelected l'elemento cancellato
      const idsSelected = (state.idsSelected as any[]).filter((idA) => idA === id);

      // se ho cancellato l'id seezionato, lo tolgo dallo store.
      const idSelected = !!state.idSelected && state.idSelected === id ? null : state.idSelected;

      return adapter.removeOne(id,
        Object.assign(
          {}, state,
          {
            isLoaded: true,
            isLoading: false,
            error: null,
            idSelected,
            idsSelected
          }
        ));
    }
  );
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
  const createManySuccessOn = on(actions.CreateManySuccess, (state: S, {type, items}) => adapter.addMany(items,
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
  const editManySuccessOn = on(actions.EditManySuccess, (state: S, {items, type}) => adapter.upsertMany(items,
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
  const selectItemsOn = on(actions.SelectItems, (state: S, {type, items}) => {
    const idsSelected = items.map(item => selectIdValue(item, adapter.selectId));
    const result = {
      ...state,
      idsSelected,
      itemsSelected: items
    };
    if (isDevMode()) {
      console.log(type);
      console.log('items', items);
      console.log('state', state);
      console.log('result', result);
    }
    return result;
  });
  const selectItemOn = on(actions.SelectItem, (state: S, {type, item}) => {
    const idSelected = selectIdValue(item, adapter.selectId);
    const result = {
      ...state,
      idSelected,
      itemSelected: item
    };
    if (isDevMode()) {
      console.log(type);
      console.log('item', item);
      console.log('state', state);
      console.log('result', result);
    }
    return result;
  });
  const selectSuccessOn = on(actions.SelectSuccess, (state: S, {type, item}) => {
      const idSelected = selectIdValue(item, adapter.selectId);
      const result = {
        ...state,
        idSelected,
        itemSelected: item,
        isLoaded: true,
        isLoading: false,
        error: null
      };
      if (isDevMode()) {
        console.log(type);
        console.log('item', item);
        console.log('state', state);
        console.log('result', result);
      }
      return result;
    }
  );
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
  const deleteManyFailureOn = on(
    actions.DeleteManyFailure,
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
  const createManyFailureOn = on(
    actions.CreateManyFailure,
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
  const editManyFailureOn = on(
    actions.EditManyFailure,
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
    deleteManyRequestOn,
    editRequestOn,
    editManyRequestOn,
    createRequestOn,
    createManyRequestOn,
    selectRequestOn,
    searchSuccessOn,
    deleteSuccessOn,
    deleteManySuccessOn,
    createSuccessOn,
    createManySuccessOn,
    selectSuccessOn,
    editSuccessOn,
    editManySuccessOn,
    searchFailureOn,
    deleteFailureOn,
    deleteManyFailureOn,
    createFailureOn,
    createManyFailureOn,
    selectFailureOn,
    editFailureOn,
    editManyFailureOn,
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
      deleteManyRequestOn,
      editRequestOn,
      editManyRequestOn,
      createRequestOn,
      createManyRequestOn,
      selectRequestOn,
      searchSuccessOn,
      deleteSuccessOn,
      deleteManySuccessOn,
      createSuccessOn,
      createManySuccessOn,
      selectSuccessOn,
      editSuccessOn,
      editManySuccessOn,
      searchFailureOn,
      deleteFailureOn,
      deleteManyFailureOn,
      createFailureOn,
      createManyFailureOn,
      selectFailureOn,
      editFailureOn,
      editManyFailureOn,
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
      deleteManyRequestOn,
      editRequestOn,
      editManyRequestOn,
      createRequestOn,
      createManyRequestOn,
      selectRequestOn,
      searchSuccessOn,
      deleteSuccessOn,
      deleteManySuccessOn,
      createSuccessOn,
      createManySuccessOn,
      selectSuccessOn,
      editSuccessOn,
      editManySuccessOn,
      searchFailureOn,
      deleteFailureOn,
      deleteManyFailureOn,
      createFailureOn,
      createManyFailureOn,
      selectFailureOn,
      editFailureOn,
      editManyFailureOn,
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
