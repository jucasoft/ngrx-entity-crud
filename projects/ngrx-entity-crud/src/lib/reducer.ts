import {Actions, EntityCrudState, EntitySingleCrudState, ICriteria, OptRequest, SingularActions} from './models';
import {EntityAdapter} from '@ngrx/entity';
import {ActionCreator, createReducer, on, ReducerTypes} from '@ngrx/store';
import {selectIdValue, toDictionary} from './utils';

export function evalData<T>(fn: () => T, def: any = null): T {
  try {
    return fn();
  } catch (e) {
    return def;
  }
}

export function createCrudOns<T, S extends EntityCrudState<T>>(adapter: EntityAdapter<T>, initialState: S, actions: Actions<T>): { [key: string]: any } {
  const searchRequestOn = on(actions.SearchRequest, (state: S, criteria: ICriteria) => {
    if (!criteria.path && !criteria.mode && !criteria.queryParams) {
      throw new Error('It is not possible a search without payload, use :\'{criteria:{}}\'');
    }

    const mode = criteria.mode || '';
    let selectedStatePartial = {};
    // se nella stringa della modalit'
    if (mode.indexOf('updateMany-selected') !== -1) {
      const {itemSelected, idSelected, entitiesSelected, idsSelected} = state;
      selectedStatePartial = {itemSelected, idSelected, entitiesSelected, idsSelected};
    } else {
      const {itemSelected, idSelected, entitiesSelected, idsSelected} = initialState;
      selectedStatePartial = {itemSelected, idSelected, entitiesSelected, idsSelected};
    }

    const result = {
      ...state,
      isLoading: true,
      error: initialState.error,
      lastCriteria: criteria,
      ...selectedStatePartial
    }

    if (mode.indexOf('REFRESH') !== -1 || mode.indexOf('upsertMany') !== -1) {
      return result
    }

    return adapter.removeAll(result);
  });
  const deleteRequestOn = on(actions.DeleteRequest, (state: S, request: OptRequest) => {
    return Object.assign(
      {},
      state,
      {isLoading: true, error: initialState.error}
    );
  });
  const deleteManyRequestOn = on(actions.DeleteManyRequest, (state: S, request: OptRequest) => {
    return Object.assign(
      {},
      state,
      {isLoading: true, error: initialState.error}
    );
  });
  const editRequestOn = on(actions.EditRequest, (state: S, request: OptRequest) => {
    return Object.assign(
      {},
      state,
      {isLoading: true, error: initialState.error}
    );
  });
  const editManyRequestOn = on(actions.EditManyRequest, (state: S, request: OptRequest) => {
    return Object.assign(
      {},
      state,
      {isLoading: true, error: initialState.error}
    );
  });
  const createRequestOn = on(actions.CreateRequest, (state: S, request: OptRequest) => {
    return Object.assign(
      {},
      state,
      {isLoading: true, error: initialState.error}
    );
  });
  const createManyRequestOn = on(actions.CreateManyRequest, (state: S, request: OptRequest) => {
    return Object.assign(
      {},
      state,
      {isLoading: true, error: initialState.error}
    );
  });
  const selectRequestOn = on(actions.SelectRequest, (state: S, request: ICriteria) => {
    return Object.assign(
      {},
      state,
      {isLoading: true, error: initialState.error}
    );
  });

  const searchSuccessOn = on(actions.SearchSuccess, (state: S, {type, items, request}) => {
    const mode = evalData(() => request.mode, null) || 'setAll';
    let method;

    if (mode.indexOf('REFRESH') !== -1) {
      method = adapter.setAll;
    } else if (mode.indexOf('upsertMany') !== -1) {
      method = adapter.upsertMany;
    } else if (mode.indexOf('setAll') !== -1) {
      method = adapter.setAll;
    } else {
      method = adapter.setAll;
    }

    const selectedStatePartial = {entitiesSelected: state.entitiesSelected, idsSelected: state.idsSelected};
    if (mode.indexOf('updateMany-selected') !== -1) {
      // creo uno state temporaneo con i dati degli elementi selezionati
      const selectedState = {
        entities: state.entitiesSelected,
        ids: state.idsSelected
      }
      // preparo gli item ritornati dalla ricerca per aggiornare
      const itemsB: any = items.map((item) => (Object.assign({}, {id: adapter.selectId(item), changes: item})));
      // utilizzo il metodo adapter.updateMany per aggiornare gli elementi selezionati
      const newSelectedState = adapter.updateOne(itemsB, {...selectedState as any});

      selectedStatePartial.entitiesSelected = newSelectedState.entities;
      selectedStatePartial.idsSelected = newSelectedState.ids;
    }

    return method(items,
      {
        ...state,
        ...selectedStatePartial,
        isLoaded: true,
        isLoading: false,
        error: null
      }
    );
  });
  const deleteSuccessOn = on(actions.DeleteSuccess, (state: S, {type, id}) => {

      // tolgo dallo store.idsSelected l'elemento cancellato
      const idsSelected = (state.idsSelected as any[]).filter((idA) => idA === id);
      const entitiesSelected = idsSelected.reduce((prev, curr) => {
        prev[curr] = state.entitiesSelected[curr];
        return prev;
      }, {});

      // se ho cancellato l'id seezionato, lo tolgo dallo store.
      const idSelected = !!state.idSelected && state.idSelected === id ? null : state.idSelected;
      const itemSelected = !idSelected ? null : state.itemSelected;

      return adapter.removeOne(id,
        Object.assign(
          {}, state,
          {
            isLoaded: true,
            isLoading: false,
            error: null,
            idSelected,
            idsSelected,
            itemSelected,
            entitiesSelected
          }
        ));
    }
  );

  const deleteManySuccessOn = on(actions.DeleteManySuccess, (state: S, {type, ids}) => {

    // tolgo dallo store.idsSelected gli elementi che sono stati cancellati.
    const idsSelected: string[] = (state.idsSelected as any[]).filter((id) => !(id in ids));
    const entitiesSelected = idsSelected.reduce((prev, curr) => {
      prev[curr] = state.entitiesSelected[curr];
      return prev;
    }, {});

    // se ho cancellato l'id seezionato, lo tolgo dallo store.
    const idSelected = !!state.idSelected && state.idSelected in ids ? null : state.idSelected;
    const itemSelected = !idSelected ? null : state.itemSelected;
    return adapter.removeMany(ids,
      Object.assign(
        {}, state,
        {
          isLoaded: true,
          isLoading: false,
          error: null,
          idSelected,
          idsSelected,
          itemSelected,
          entitiesSelected
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

  const removeAllSelectedOn = on(actions.RemoveAllSelected, (state: S, {type}: { type: string }) => {
    const result = {
      ...state,
      idsSelected: [],
      // itemsSelected: [], //todo: @deprecated da cancellare questo tipo di assegnazione.
      entitiesSelected: {}
    };

    return result;
  });

  const addManySelectedOn = on(actions.AddManySelected, (state: S, {type, items}: { type: string, items: T[] }) => {
    const entitiesCurr = toDictionary(items, adapter);
    const entitiesSelected = {...state.entitiesSelected, ...entitiesCurr};
    const idsSelected = Object.keys(entitiesSelected);
    const result = {
      ...state,
      idsSelected,
      // itemsSelected: items, //todo: @deprecated da cancellare questo tipo di assegnazione.
      entitiesSelected
    };

    return result;
  });

  const removeManySelectedOn = on(actions.RemoveManySelected, (state: S, {type, ids}: { type: string, ids: string[] }) => {
    const idsAsString = ids.map(x => x + '');
    const idsSelected = Object.keys(state.entitiesSelected).filter(id => !idsAsString.includes(id + ''));
    const entitiesSelected = idsSelected.reduce((prec, curr) => ({...prec, [curr]: state.entitiesSelected[curr]}), {});
    // const itemsSelected = Object.values(entitiesSelected);

    const result = {
      ...state,
      idsSelected,
      // itemsSelected, //todo: @deprecated da cancellare questo tipo di assegnazione.
      entitiesSelected
    };

    return result;
  });

  const selectItemsOn = on(actions.SelectItems, (state: S, {type, items}) => {
    const entitiesSelected = toDictionary(items, adapter);
    const idsSelected = Object.keys(entitiesSelected);
    const result = {
      ...state,
      idsSelected,
      // itemsSelected: items,
      entitiesSelected
    };

    return result;
  });
  const selectItemOn = on(actions.SelectItem, (state: S, {type, item}) => {
    const idSelected = selectIdValue(item, adapter.selectId);
    const result = {
      ...state,
      idSelected,
      itemSelected: item
    };

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
  const resetOn = on(actions.Reset, (state: S) => ({...state, ...initialState}));
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
    removeAllSelectedOn,
    addManySelectedOn,
    removeManySelectedOn,
    selectItemOn,
    editOn,
    createOn,
    deleteOn
  };

}

export function createCrudReducerFactory<T>(adapter: EntityAdapter<T>) {
  function createCrudReducer<S extends EntityCrudState<T>>(initialState: S, actions: Actions<T>, ...ons: ReducerTypes<S, ActionCreator[]>[]) {
    const {...crudOns} = createCrudOns(adapter, initialState, actions);
    const totalOns: ReducerTypes<S, ActionCreator[]>[] = [
      ...ons,
      ...Object.values(crudOns)
    ];
    return createReducer<S>(initialState,
      ...totalOns
    );
  }

  return {
    createCrudReducer
  };
}


export function createSingularCrudOns<T, S extends EntitySingleCrudState<T>>(initialState: S, actions: SingularActions<T>): { [key: string]: any } {

  const selectRequestOn = on(actions.SelectRequest, (state: S, {type}) => (
    {
      ...state,
      isLoading: true,
      error: null
    }
  ));

  const selectSuccessOn = on(actions.SelectSuccess, (state: S, {type, item}) => (
    {
      ...state,
      item,
      isLoaded: true,
      isLoading: false,
      error: null
    }
  ));

  const selectFailureOn = on(actions.SelectFailure, (state: S, {type, error}) => ({
    ...state,
    isLoaded: false,
    isLoading: false,
    error
  }));

  const editRequestOn = on(actions.EditRequest, (state: S) => (
    {
      ...state,
      isLoading: true,
      error: null
    }
  ));

  const editSuccessOn = on(actions.EditSuccess, (state: S, {item, type}) => (
    {
      ...state,
      item,
      isLoaded: true,
      isLoading: false,
      error: null
    }
  ));

  const editOn = on(actions.Edit, (state: S, {item, type}) => (
    {
      ...state,
      item,
      isLoaded: true,
      isLoading: false,
      error: null
    }
  ));

  const editFailureOn = on(actions.EditFailure, (state: S, {type, error}) => ({
    ...state,
    isLoaded: false,
    isLoading: false,
    error
  }));

  const responseOn = on(actions.Response, (state: S, response) => {
    const responses = [...state.responses, response];
    return {...{}, ...state, ...{responses}};
  });

  const resetResponsesOn = on(actions.ResetResponses, (state: S) => {
      const responses = [];
      return {...state, ...{responses}};
    }
  );

  const resetOn = on(actions.Reset, (state: S) => ({...state, ...initialState}));
  return {
    responseOn,
    resetResponsesOn,

    selectRequestOn,
    selectSuccessOn,
    selectFailureOn,

    editRequestOn,
    editSuccessOn,
    editFailureOn,

    resetOn,
    editOn,
  };

}
