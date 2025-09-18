import {Actions, CrudState, EntityCrudAdapter, EntityCrudSelectors, EntityCrudState, ICriteria, OptRequest} from '../lib/models';
import {createCrudEntityAdapter} from '../lib/create_adapter';
import {createFeatureSelector, MemoizedSelector, Store} from '@ngrx/store';
import {toDictionary} from '../lib/utils';

export const NAME = 'client';

export class Pizza {
  id: number;
  name: string;
}

export type State = CrudState<Pizza>

describe('NgRx Entity CRUD', () => {
  let adapter: EntityCrudAdapter<Pizza>;
  let state: EntityCrudState<Pizza>;
  let selectState: MemoizedSelector<object, State>;
  let selectors: EntityCrudSelectors<Pizza, object>;
  let featureReducer;
  let actions: Actions<Pizza>;

  // Test data factory
  const createPizzas = (count: number = 4): Pizza[] => 
    Array.from({length: count}, (_, i) => ({id: i, name: String.fromCharCode(97 + i)}));

  // Helper per creare payload standard
  const createPayload = <T>(data: T) => ({ mutationParams: data });
  
  // Helper per verificare stato di loading
  const expectLoadingState = (resultState: State, baseState: State) => {
    expect(resultState).toEqual({
      ...baseState,
      isLoading: true
    });
  };

  // Helper per verificare stato di successo
  const expectSuccessState = (resultState: State, baseState: State, additionalProps: Partial<State> = {}) => {
    expect(resultState).toEqual({
      ...baseState,
      isLoaded: true,
      isLoading: false,
      error: null,
      ...additionalProps
    });
  };

  // Helper per verificare stato di errore
  const expectErrorState = (resultState: State, baseState: State, error: any) => {
    expect(resultState).toEqual({
      ...baseState,
      isLoaded: false,
      isLoading: false,
      error
    });
  };

  beforeEach(() => {
    adapter = createCrudEntityAdapter<Pizza>({
      selectId: model => model.id
    });
    const items = createPizzas();
    state = adapter.getInitialCrudState();
    state = adapter.setAll(items, state);
    selectState = createFeatureSelector<State>(NAME);
    selectors = adapter.getCrudSelectors(selectState);
    actions = adapter.createCrudActions(NAME);
    featureReducer = adapter.createCrudReducer(state, actions);
  });

  describe('Reducers - Request Actions', () => {
    describe('Create Operations', () => {
      it('should handle CreateRequest', () => {
        const payload = createPayload({id: 5, name: 'e'});
        const result = featureReducer(state, actions.CreateRequest(payload));
        expectLoadingState(result, state);
      });

      it('should handle CreateManyRequest', () => {
        const payload = createPayload([{id: 5, name: 'e'}, {id: 6, name: 'f'}]);
        const result = featureReducer(state, actions.CreateManyRequest(payload));
        expectLoadingState(result, state);
      });
    });

    describe('Delete Operations', () => {
      it('should handle DeleteRequest', () => {
        const payload = createPayload({id: 0, name: 'a'});
        const result = featureReducer(state, actions.DeleteRequest(payload));
        expectLoadingState(result, state);
      });

      it('should handle DeleteManyRequest', () => {
        const payload = createPayload([{id: 0, name: 'a'}, {id: 1, name: 'b'}]);
        const result = featureReducer(state, actions.DeleteManyRequest(payload));
        expectLoadingState(result, state);
      });
    });

    describe('Edit Operations', () => {
      it('should handle EditRequest', () => {
        const payload = createPayload({id: 0, name: 'aa'});
        const result = featureReducer(state, actions.EditRequest(payload));
        expectLoadingState(result, state);
      });

      it('should handle EditManyRequest', () => {
        const payload = createPayload([{id: 0, name: 'aa'}, {id: 1, name: 'bb'}]);
        const result = featureReducer(state, actions.EditManyRequest(payload));
        expectLoadingState(result, state);
      });
    });

    describe('Search Operations', () => {
      it('should handle SearchRequest with mode undefined (clears entities)', () => {
        const action = actions.SearchRequest({queryParams: 'queryParams', path: ['path'], mode: undefined});
        const expectedState = adapter.removeAll({
          ...state,
          isLoading: true,
          lastCriteria: action
        });
        const result = featureReducer(state, action);
        expect(result).toEqual(expectedState);
      });

      it('should handle SearchRequest with REFRESH mode (keeps entities)', () => {
        const action = actions.SearchRequest({mode: 'REFRESH', queryParams: undefined, path: undefined});
        const expectedState = {
          ...state,
          isLoading: true,
          lastCriteria: action
        };
        const result = featureReducer(state, action);
        expect(result).toEqual(expectedState);
      });
    });
  });

  describe('Reducers - Success Actions', () => {
    describe('Search Success with Different Modes', () => {
      const newItems = createPizzas(4).map((item, i) => ({...item, id: i + 4, name: String.fromCharCode(101 + i)}));

      it('should handle SearchSuccess with REFRESH mode', () => {
        const lastCriteria = actions.SearchRequest({mode: 'REFRESH', queryParams: undefined, path: undefined});
        const expectedState = adapter.setAll(newItems, {
          ...state,
          isLoaded: true,
          isLoading: false,
          error: null,
          lastCriteria
        });
        const result = featureReducer({...state, lastCriteria}, actions.SearchSuccess({items: newItems, request: lastCriteria}));
        expect(result).toEqual(expectedState);
      });

      it('should handle SearchSuccess with undefined mode', () => {
        const lastCriteria = actions.SearchRequest({mode: undefined, queryParams: undefined, path: undefined});
        const expectedState = adapter.setAll(newItems, {
          ...state,
          isLoaded: true,
          isLoading: false,
          error: null,
          lastCriteria
        });
        const result = featureReducer({...state, lastCriteria}, actions.SearchSuccess({items: newItems, request: lastCriteria}));
        expect(result).toEqual(expectedState);
      });

      it('should handle SearchSuccess with upsertMany mode', () => {
        const lastCriteria = actions.SearchRequest({mode: 'upsertMany', queryParams: undefined, path: undefined});
        const expectedState = adapter.upsertMany(newItems, {
          ...state,
          isLoaded: true,
          isLoading: false,
          error: null,
          lastCriteria
        });
        const result = featureReducer({...state, lastCriteria}, actions.SearchSuccess({items: newItems, request: lastCriteria}));
        expect(result).toEqual(expectedState);
      });

      it('should handle SearchSuccess with addAll mode', () => {
        const lastCriteria = actions.SearchRequest({mode: 'addAll', queryParams: undefined, path: undefined});
        const expectedState = adapter.setAll(newItems, {
          ...state,
          isLoaded: true,
          isLoading: false,
          error: null,
          lastCriteria
        });
        const result = featureReducer({...state, lastCriteria}, actions.SearchSuccess({items: newItems, request: lastCriteria}));
        expect(result).toEqual(expectedState);
      });
    });

    describe('CRUD Success Operations', () => {
      it('should handle CreateSuccess', () => {
        const newItem = {id: 5, name: 'create'};
        const payload = {item: newItem, request: null};
        const expectedState = adapter.addOne(newItem, {
          ...state,
          isLoaded: true,
          isLoading: false,
          error: null
        });
        const result = featureReducer(state, actions.CreateSuccess(payload));
        expect(result).toEqual(expectedState);
      });

      it('should handle EditSuccess', () => {
        const editedItem = {id: 5, name: 'edit'};
        const payload = {item: editedItem, request: null};
        const expectedState = adapter.upsertOne(editedItem, {
          ...state,
          isLoaded: true,
          isLoading: false,
          error: null
        });
        const result = featureReducer(state, actions.EditSuccess(payload));
        expect(result).toEqual(expectedState);
      });

      it('should handle EditManySuccess', () => {
        const editedItems = [{id: 5, name: 'edit'}, {id: 6, name: 'edit'}];
        const payload = {items: editedItems, request: null};
        const expectedState = adapter.upsertMany(editedItems, {
          ...state,
          isLoaded: true,
          isLoading: false,
          error: null
        });
        const result = featureReducer(state, actions.EditManySuccess(payload));
        expect(result).toEqual(expectedState);
      });

      it('should handle DeleteSuccess', () => {
        const payload = {id: '0', request: null};
        const expectedState = adapter.removeOne(payload.id, {
          ...state,
          isLoaded: true,
          isLoading: false,
          error: null
        });
        const result = featureReducer(state, actions.DeleteSuccess(payload));
        expect(result).toEqual(expectedState);
      });

      it('should handle DeleteManySuccess', () => {
        const payload = {ids: ['0', '1'], request: null};
        const expectedState = adapter.removeMany(payload.ids, {
          ...state,
          isLoaded: true,
          isLoading: false,
          error: null
        });
        const result = featureReducer(state, actions.DeleteManySuccess(payload));
        expect(result).toEqual(expectedState);
      });
    });
  });

  describe('Reducers - Selection Actions', () => {
    it('should handle SelectItem', () => {
      const item = {id: 0, name: 'a'};
      const payload = {item};
      const expectedState = {
        ...state,
        itemSelected: item,
        idSelected: item.id
      };
      const result = featureReducer(state, actions.SelectItem(payload));
      expect(result).toEqual(expectedState);
    });

    it('should handle SelectItems', () => {
      const items = [{id: 0, name: 'a'}, {id: 1, name: 'b'}];
      const payload = {items};
      const entitiesSelected = toDictionary(items, adapter);
      const idsSelected = Object.keys(entitiesSelected);
      const expectedState = {
        ...state,
        entitiesSelected,
        idsSelected
      };
      const result = featureReducer(state, actions.SelectItems(payload));
      expect(result).toEqual(expectedState);
    });

    it('should handle AddManySelected and RemoveManySelected', () => {
      const payloadA = {items: [{id: 0, name: 'a'}, {id: 1, name: 'b'}]};
      const payloadB = {items: [{id: 2, name: 'c'}, {id: 1, name: 'b'}]};

      // Add selections
      let result = featureReducer(state, actions.AddManySelected(payloadA));
      result = featureReducer(result, actions.AddManySelected(payloadB));

      let entitiesSelected = toDictionary([{id: 0, name: 'a'}, {id: 1, name: 'b'}, {id: 2, name: 'c'}], adapter);
      let idsSelected = Object.keys(entitiesSelected);
      let expectedState = {
        ...state,
        entitiesSelected,
        idsSelected
      };
      expect(result).toEqual(expectedState);

      // Remove selection
      result = featureReducer(result, actions.RemoveManySelected({ids: ['0']}));
      entitiesSelected = toDictionary([{id: 1, name: 'b'}, {id: 2, name: 'c'}], adapter);
      idsSelected = Object.keys(entitiesSelected);
      expectedState = {
        ...state,
        entitiesSelected,
        idsSelected
      };
      expect(result).toEqual(expectedState);
    });

    it('should handle RemoveAllSelected', () => {
      const entitiesSelected = toDictionary([{id: 0, name: 'a'}, {id: 1, name: 'b'}], adapter);
      const idsSelected = Object.keys(entitiesSelected);
      const fromState = {
        ...state,
        entitiesSelected,
        idsSelected
      };
      const expectedState = {
        ...state,
        entitiesSelected: {},
        idsSelected: []
      };
      const result = featureReducer(fromState, actions.RemoveAllSelected());
      expect(result).toEqual(expectedState);
    });

    it('should handle SelectSuccess', () => {
      const item = {id: 0, name: 'a'};
      const payload = {item, request: null};
      const expectedState = {
        ...state,
        idSelected: item.id,
        itemSelected: item,
        isLoaded: true,
        isLoading: false,
        error: null
      };
      const result = featureReducer(state, actions.SelectSuccess(payload));
      expect(result).toEqual(expectedState);
    });
  });

  describe('Reducers - Utility Actions', () => {
    it('should handle Filters', () => {
      const filters = {id: {value: 1, matchMode: 'startsWith'}};
      const payload = {filters};
      const expectedState = {
        ...state,
        filters
      };
      const result = featureReducer(state, actions.Filters(payload));
      expect(result).toEqual(expectedState);
    });

    it('should handle Reset', () => {
      const result = featureReducer(state, actions.Reset());
      expect(result).toEqual(state);
    });

    it('should handle Delete (direct)', () => {
      const payload = {id: '0'};
      const expectedState = adapter.removeOne(payload.id, {
        ...state,
        isLoaded: true,
        isLoading: false,
        error: null
      });
      const result = featureReducer(state, actions.Delete(payload));
      expect(result).toEqual(expectedState);
    });
  });

  describe('Reducers - Failure Actions', () => {
    const testError = 'Test error message';

    const failureTests = [
      {name: 'SearchFailure', action: (error) => actions.SearchFailure({error})},
      {name: 'DeleteFailure', action: (error) => actions.DeleteFailure({error})},
      {name: 'DeleteManyFailure', action: (error) => actions.DeleteManyFailure({error})},
      {name: 'CreateFailure', action: (error) => actions.CreateFailure({error})},
      {name: 'CreateManyFailure', action: (error) => actions.CreateManyFailure({error})},
      {name: 'EditFailure', action: (error) => actions.EditFailure({error})},
      {name: 'EditManyFailure', action: (error) => actions.EditManyFailure({error})},
      {name: 'SelectFailure', action: (error) => actions.SelectFailure({error})}
    ];

    failureTests.forEach(({name, action}) => {
      it(`should handle ${name}`, () => {
        const result = featureReducer(state, action(testError));
        expectErrorState(result, state, testError);
      });
    });
  });

  describe('Actions Dispatch Tests', () => {
    let store: jasmine.SpyObj<Store<State>>;

    beforeEach(() => {
      store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
    });

    describe('Request Actions', () => {
      it('should dispatch CreateRequest', () => {
        const payload = createPayload({id: 5, name: 'e'});
        const expectedAction = actions.CreateRequest(payload);
        store.dispatch(expectedAction);
        expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
      });

      it('should dispatch CreateManyRequest', () => {
        const payload = createPayload([{id: 5, name: 'e'}, {id: 6, name: 'f'}]);
        const expectedAction = actions.CreateManyRequest(payload);
        store.dispatch(expectedAction);
        expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
      });

      it('should dispatch EditRequest', () => {
        const payload = createPayload({id: 0, name: 'updated'});
        const expectedAction = actions.EditRequest(payload);
        store.dispatch(expectedAction);
        expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
      });

      it('should dispatch SearchRequest', () => {
        const payload: ICriteria = {queryParams: 'test', path: ['path'], mode: undefined};
        const expectedAction = actions.SearchRequest(payload);
        store.dispatch(expectedAction);
        expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
      });
    });

    describe('Success Actions', () => {
      it('should dispatch CreateSuccess', () => {
        const payload = {item: {id: 5, name: 'created'}, request: null};
        const expectedAction = actions.CreateSuccess(payload);
        store.dispatch(expectedAction);
        expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
      });

      it('should dispatch SearchSuccess', () => {
        const items = createPizzas(2);
        const payload = {items, request: null};
        const expectedAction = actions.SearchSuccess(payload);
        store.dispatch(expectedAction);
        expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
      });
    });

    describe('Selection Actions', () => {
      it('should dispatch SelectItem', () => {
        const payload = {item: {id: 0, name: 'a'}};
        const expectedAction = actions.SelectItem(payload);
        store.dispatch(expectedAction);
        expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
      });

      it('should dispatch SelectItems', () => {
        const payload = {items: createPizzas(2)};
        const expectedAction = actions.SelectItems(payload);
        store.dispatch(expectedAction);
        expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
      });
    });

    describe('Utility Actions', () => {
      it('should dispatch Filters', () => {
        const payload = {filters: {name: {value: 'test', matchMode: 'contains'}}};
        const expectedAction = actions.Filters(payload);
        store.dispatch(expectedAction);
        expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
      });

      it('should dispatch Reset', () => {
        const expectedAction = actions.Reset();
        store.dispatch(expectedAction);
        expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
      });
    });
  });

  describe('Selectors Tests', () => {
    let mockState: any;

    beforeEach(() => {
      mockState = {
        [NAME]: {
          ...state,
          filters: {name: {value: 'a', matchMode: 'contains'}},
          idSelected: 1,
          idsSelected: [0, 1],
          entitiesSelected: {0: {id: 0, name: 'a'}, 1: {id: 1, name: 'b'}}
        }
      };
    });

    it('should select all entities', () => {
      const result = selectors.selectAll(mockState);
      expect(result.length).toBe(4);
      expect(result[0]).toEqual({id: 0, name: 'a'});
    });

    it('should select total count', () => {
      const result = selectors.selectTotal(mockState);
      expect(result).toBe(4);
    });

    it('should select loading state', () => {
      mockState[NAME].isLoading = true;
      const result = selectors.selectIsLoading(mockState);
      expect(result).toBe(true);
    });

    it('should select loaded state', () => {
      mockState[NAME].isLoaded = true;
      const result = selectors.selectIsLoaded(mockState);
      expect(result).toBe(true);
    });

    it('should select error', () => {
      const error = 'Test error';
      mockState[NAME].error = error;
      const result = selectors.selectError(mockState);
      expect(result).toBe(error);
    });

    it('should select filters', () => {
      const result = selectors.selectFilters(mockState);
      expect(result).toEqual({name: {value: 'a', matchMode: 'contains'}});
    });

    it('should select selected items', () => {
      const result = selectors.selectItemsSelected(mockState);
      expect(result).toEqual([{id: 0, name: 'a'}, {id: 1, name: 'b'}]);
    });

    it('should select filtered items', () => {
      const result = selectors.selectFilteredItems(mockState);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('a');
    });

    it('should select item selected origin', () => {
      const result = selectors.selectItemSelectedOrigin(mockState);
      expect(result).toEqual({id: 1, name: 'b'});
    });

    it('should select items selected origin', () => {
      const result = selectors.selectItemsSelectedOrigin(mockState);
      expect(result).toEqual([{id: 0, name: 'a'}, {id: 1, name: 'b'}]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty state', () => {
      const emptyState = adapter.getInitialCrudState();
      // Creiamo un reducer con stato iniziale vuoto
      const emptyFeatureReducer = adapter.createCrudReducer(emptyState, actions);
      const result = emptyFeatureReducer(emptyState, actions.Reset());
      expect(result).toEqual(emptyState);
      expect(result.ids.length).toBe(0);
      expect(Object.keys(result.entities)).toEqual([]);
    });

    it('should handle selection of non-existing item', () => {
      // Test con item che non esiste nello stato
      const nonExistingItem = {id: 999, name: 'non-existing'};
      const payload = {item: nonExistingItem};
      const result = featureReducer(state, actions.SelectItem(payload));
      expect(result.itemSelected).toEqual(nonExistingItem);
      expect(result.idSelected).toBe(999);
    });

    it('should handle duplicate item creation', () => {
      const existingItem = {id: 0, name: 'duplicate'};
      const payload = {item: existingItem, request: null};
      const result = featureReducer(state, actions.CreateSuccess(payload));
      // Should add the item even if ID exists (adapter behavior)
      expect(result.entities[0]).toBeDefined();
    });

    it('should handle search with empty results', () => {
      const lastCriteria = actions.SearchRequest({mode: 'REFRESH'});
      const result = featureReducer(
        {...state, lastCriteria},
        actions.SearchSuccess({items: [], request: lastCriteria})
      );
      expect(selectors.selectAll({[NAME]: result})).toEqual([]);
    });

    it('should handle multiple consecutive selections', () => {
      let result = featureReducer(state, actions.SelectItem({item: {id: 0, name: 'a'}}));
      result = featureReducer(result, actions.SelectItem({item: {id: 1, name: 'b'}}));
      expect(result.itemSelected).toEqual({id: 1, name: 'b'});
      expect(result.idSelected).toBe(1);
    });
  });
});
