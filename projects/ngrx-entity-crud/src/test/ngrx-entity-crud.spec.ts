import {Actions, CrudState, EntityCrudAdapter, EntityCrudSelectors, EntityCrudState, ICriteria} from '../lib/models';
import {createCrudEntityAdapter} from '../lib/create_adapter';
import {createFeatureSelector, MemoizedSelector, Store} from '@ngrx/store';
import {toDictionary} from '../lib/utils';

export const NAME = 'client';

export class Pizza {
  id: number;
  name: string;
}

export interface State extends CrudState<Pizza> {
}

describe('Crud', () => {

  let adapter: EntityCrudAdapter<Pizza>;
  let state: EntityCrudState<Pizza>;
  let selectState: MemoizedSelector<object, State>;
  let selectors: EntityCrudSelectors<Pizza, object>;
  let featureReducer;
  let actions: Actions<Pizza>;

  beforeEach(() => {
    adapter = createCrudEntityAdapter<Pizza>({
      selectId: model => model.id
    });
    const items: Pizza[] = [{id: 0, name: 'a'}, {id: 1, name: 'b'}, {id: 2, name: 'c'}, {id: 3, name: 'd'}];
    state = adapter.getInitialCrudState();
    state = adapter.setAll(items, state);
    selectState = createFeatureSelector<State>(NAME);
    selectors = adapter.getCrudSelectors(selectState);
    actions = adapter.createCrudActions(NAME);
    featureReducer = adapter.createCrudReducer(state, actions);
  });
  describe('Reducers', () => {


    it('CreateRequest', () => {
      const payload = {mutationParams: {id: 5, name: 'e'}};
      const expectState: State = ({
        ...state,
        isLoading: true
      });
      const toState: State = featureReducer(state, actions.CreateRequest(payload));
      expect(expectState).toEqual(toState);
    });

    it('CreateManyRequest', () => {
      const payload = {mutationParams: [{id: 5, name: 'e'}, {id: 6, name: 'f'}]};
      const expectState: State = ({
        ...state,
        isLoading: true
      });
      const toState: State = featureReducer(state, actions.CreateManyRequest(payload));
      expect(expectState).toEqual(toState);
    });

    it('DeleteRequest', () => {
      const payload = {mutationParams: {id: 0, name: 'a'}};
      const expectState: State = ({
        ...state,
        isLoading: true
      });
      const toState: State = featureReducer(state, actions.DeleteRequest(payload));
      expect(expectState).toEqual(toState);
    });

    it('DeleteManyRequest', () => {
      const payload = {mutationParams: [{id: 0, name: 'a'}, {id: 1, name: 'b'}]};
      const expectState: State = ({
        ...state,
        isLoading: true
      });
      const toState: State = featureReducer(state, actions.DeleteManyRequest(payload));
      expect(expectState).toEqual(toState);
    });

    it('EditRequest', () => {
      const payload = {mutationParams: {id: 0, name: 'aa'}};
      const expectState: State = ({
        ...state,
        isLoading: true
      });
      const toState: State = featureReducer(state, actions.EditRequest(payload));
      expect(expectState).toEqual(toState);
    });

    it('EditRequest many elements', () => {
      const payload = {mutationParams: [{id: 0, name: 'aa'}, {id: 1, name: 'bb'}]};
      const expectState: State = ({
        ...state,
        isLoading: true
      });
      const toState: State = featureReducer(state, actions.EditManyRequest(payload));
      expect(expectState).toEqual(toState);
    });

    it('SearchRequest', () => {
      const action = actions.SearchRequest({queryParams: 'queryParams', path: ['path'], mode: undefined});
      const expectState: State = adapter.removeAll(({
        ...state,
        isLoading: true,
        lastCriteria: action
      }));
      const toState: State = featureReducer(state, action);
      expect(expectState).toEqual(toState);
    });

    it('SearchRequest', () => {
      const action = actions.SearchRequest({mode: 'REFRESH', queryParams: undefined, path: undefined});
      const expectState: State = ({
        ...state,
        isLoading: true,
        lastCriteria: action
      });
      const toState: State = featureReducer(state, action);
      expect(expectState).toEqual(toState);
    });

    it('SearchSuccess mode: "REFRESH"', () => {

      const items: Pizza[] = [{id: 4, name: 'e'}, {id: 5, name: 'f'}, {id: 6, name: 'g'}, {id: 7, name: 'h'}];

      const lastCriteria = actions.SearchRequest({mode: 'REFRESH', queryParams: undefined, path: undefined});

      const expectState: State = adapter.setAll(items, {
        ...state,
        isLoaded: true,
        isLoading: false,
        error: null,
        lastCriteria
      });

      const toState: State = featureReducer({...{}, ...state, ...{lastCriteria}}, actions.SearchSuccess({items, request: lastCriteria}));
      expect(expectState).toEqual(toState);
    });

    it('SearchSuccess mode: undefined', () => {

      const items: Pizza[] = [{id: 4, name: 'e'}, {id: 5, name: 'f'}, {id: 6, name: 'g'}, {id: 7, name: 'h'}];

      const lastCriteria = actions.SearchRequest({mode: undefined, queryParams: undefined, path: undefined});

      const expectState: State = adapter.setAll(items, {
        ...state,
        isLoaded: true,
        isLoading: false,
        error: null,
        lastCriteria
      });

      const toState: State = featureReducer({...{}, ...state, ...{lastCriteria}}, actions.SearchSuccess({items, request: lastCriteria}));
      expect(expectState).toEqual(toState);
    });

    it('SearchSuccess mode: "upsertMany"', () => {

      const items: Pizza[] = [{id: 4, name: 'e'}, {id: 5, name: 'f'}, {id: 6, name: 'g'}, {id: 7, name: 'h'}];

      const lastCriteria = actions.SearchRequest({mode: 'upsertMany', queryParams: undefined, path: undefined});

      const expectState: State = adapter.upsertMany(items, {
        ...state,
        isLoaded: true,
        isLoading: false,
        error: null,
        lastCriteria
      });

      const toState: State = featureReducer({...{}, ...state, ...{lastCriteria}}, actions.SearchSuccess({items, request: lastCriteria}));
      expect(expectState).toEqual(toState);
    });

    it('SearchSuccess mode: "setAll"', () => {

      const items: Pizza[] = [{id: 4, name: 'e'}, {id: 5, name: 'f'}, {id: 6, name: 'g'}, {id: 7, name: 'h'}];

      const lastCriteria = actions.SearchRequest({mode: 'addAll', queryParams: undefined, path: undefined});

      const expectState: State = adapter.setAll(items, {
        ...state,
        isLoaded: true,
        isLoading: false,
        error: null,
        lastCriteria
      });

      const toState: State = featureReducer({...{}, ...state, ...{lastCriteria}}, actions.SearchSuccess({items, request: lastCriteria}));
      expect(expectState).toEqual(toState);
    });

    it('DeleteSuccess', () => {
      const payload = {id: '0'};

      const expectState: State = adapter.removeOne(payload.id, {
        ...state,
        isLoaded: true,
        isLoading: false,
        error: null
      });

      const toState: State = featureReducer(expectState, actions.DeleteSuccess(payload));

      expect(expectState).toEqual(toState);
    });

    it('DeleteSuccess many elements', () => {
      const payload = {ids: ['0', '1']};

      const expectState: State = adapter.removeMany(payload.ids, {
        ...state,
        isLoaded: true,
        isLoading: false,
        error: null
      });

      const toState: State = featureReducer(expectState, actions.DeleteManySuccess(payload));

      expect(expectState).toEqual(toState);
    });

    it('CreateSuccess', () => {
      const payload = {item: {id: 5, name: 'create'}};

      const expectState: State = adapter.addOne(payload.item, {
        ...state,
        isLoaded: true,
        isLoading: false,
        error: null
      });

      const toState: State = featureReducer(state, actions.CreateSuccess(payload));

      expect(expectState).toEqual(toState);
    });

    it('EditSuccess', () => {
      const payload = {item: {id: 5, name: 'edit'}};

      const expectState: State = adapter.upsertOne(payload.item, {
        ...state,
        isLoaded: true,
        isLoading: false,
        error: null
      });

      const toState: State = featureReducer(state, actions.EditSuccess(payload));

      expect(expectState).toEqual(toState);
    });

    it('EditManySuccess', () => {
      const payload = {items: [{id: 5, name: 'edit'}, {id: 6, name: 'edit'}]};

      const expectState: State = adapter.upsertMany(payload.items, {
        ...state,
        isLoaded: true,
        isLoading: false,
        error: null
      });

      const toState: State = featureReducer(state, actions.EditManySuccess(payload));

      expect(expectState).toEqual(toState);
    });

    it('Filters', () => {
      const payload = {filters: {id: {value: 1, matchMode: 'startsWith'}}};

      const expectState: State = ({...state, ...{filters: payload.filters}});

      const toState: State = featureReducer(state, actions.Filters(payload));

      expect(expectState).toEqual(toState);
    });

    it('SelectItem', () => {
      const payload = {item: {id: 0, name: 'a'}};

      const expectState: State = ({...state, ...{itemSelected: payload.item, idSelected: payload.item.id}});

      const toState: State = featureReducer(state, actions.SelectItem(payload));

      expect(expectState).toEqual(toState);
    });

    it('SelectItems', () => {
      const payload = {items: [{id: 0, name: 'a'}, {id: 1, name: 'b'}]};

      const entitiesSelected = toDictionary(payload.items, adapter);
      const idsSelected = Object.keys(entitiesSelected);
      const expectState: State = ({...state, entitiesSelected, idsSelected});

      const toState: State = featureReducer(state, actions.SelectItems(payload));

      expect(expectState).toEqual(toState);
    });

    it('AddManySelected + RemoveManySelected', () => {
      const payloadA = {items: [{id: 0, name: 'a'}, {id: 1, name: 'b'}]};
      const payloadB = {items: [{id: 2, name: 'c'}, {id: 1, name: 'b'}]};

      let entitiesSelected = toDictionary([{id: 0, name: 'a'}, {id: 1, name: 'b'}, {id: 2, name: 'c'}], adapter);
      let idsSelected = Object.keys(entitiesSelected);
      let expectState: State = ({...state, entitiesSelected, idsSelected});
      let toState: State = featureReducer(state, actions.AddManySelected(payloadA));
      toState = featureReducer(toState, actions.AddManySelected(payloadB));
      expect(expectState).toEqual(toState);

      toState = featureReducer(toState, actions.RemoveManySelected({ids: ['0']}));

      entitiesSelected = toDictionary([{id: 1, name: 'b'}, {id: 2, name: 'c'}], adapter);
      idsSelected = Object.keys(entitiesSelected);
      expectState = ({...state, entitiesSelected, idsSelected});
      expect(expectState).toEqual(toState);
    });

    it('RemoveAllSelected', () => {
      const entitiesSelected = toDictionary([{id: 0, name: 'a'}, {id: 1, name: 'b'}, {id: 2, name: 'c'}], adapter);
      const idsSelected = Object.keys(entitiesSelected);
      const fromState: State = ({...state, entitiesSelected, idsSelected});
      const expectState: State = ({...state, entitiesSelected: {}, idsSelected: []});
      const toState: State = featureReducer(fromState, actions.RemoveAllSelected());
      expect(expectState).toEqual(toState);
    });

    it('SelectSuccess', () => {
      const payload = {item: {id: 0, name: 'a'}};

      const expectState: State = ({
        ...state,
        idSelected: payload.item.id,
        itemSelected: payload.item,
        isLoaded: true,
        isLoading: false,
        error: null
      });

      const toState: State = featureReducer(state, actions.SelectSuccess(payload));

      expect(expectState).toEqual(toState);
    });

    it('Reset', () => {
      const expectState: State = ({...state});
      const toState: State = featureReducer(state, actions.Reset());
      expect(expectState).toEqual(toState);
    });

    it('SearchFailure', () => {
      const payload = {error: 'error'};

      const expectState: State = ({
        ...state,
        isLoaded: false,
        isLoading: false,
        error: payload.error
      });

      const toState: State = featureReducer(state, actions.SearchFailure(payload));

      expect(expectState).toEqual(toState);
    });

    it('DeleteFailure', () => {
      const payload = {error: 'error'};

      const expectState: State = ({
        ...state,
        isLoaded: false,
        isLoading: false,
        error: payload.error
      });

      const toState: State = featureReducer(state, actions.DeleteFailure(payload));

      expect(expectState).toEqual(toState);
    });

    it('DeleteManyFailure', () => {
      const payload = {error: 'error'};

      const expectState: State = ({
        ...state,
        isLoaded: false,
        isLoading: false,
        error: payload.error
      });

      const toState: State = featureReducer(state, actions.DeleteManyFailure(payload));

      expect(expectState).toEqual(toState);
    });

    it('CreateFailure', () => {
      const payload = {error: 'error'};

      const expectState: State = ({
        ...state,
        isLoaded: false,
        isLoading: false,
        error: payload.error
      });

      const toState: State = featureReducer(state, actions.CreateFailure(payload));

      expect(expectState).toEqual(toState);
    });

    it('CreateManyFailure', () => {
      const payload = {error: 'error'};

      const expectState: State = ({
        ...state,
        isLoaded: false,
        isLoading: false,
        error: payload.error
      });

      const toState: State = featureReducer(state, actions.CreateManyFailure(payload));

      expect(expectState).toEqual(toState);
    });

    it('EditFailure', () => {
      const payload = {error: 'error'};

      const expectState: State = ({
        ...state,
        isLoaded: false,
        isLoading: false,
        error: payload.error
      });

      const toState: State = featureReducer(state, actions.EditFailure(payload));

      expect(expectState).toEqual(toState);
    });

    it('EditManyFailure', () => {
      const payload = {error: 'error'};

      const expectState: State = ({
        ...state,
        isLoaded: false,
        isLoading: false,
        error: payload.error
      });

      const toState: State = featureReducer(state, actions.EditManyFailure(payload));

      expect(expectState).toEqual(toState);
    });

    it('SelectFailure', () => {
      const payload = {error: 'error'};

      const expectState: State = ({
        ...state,
        isLoaded: false,
        isLoading: false,
        error: payload.error
      });

      const toState: State = featureReducer(state, actions.SelectFailure(payload));

      expect(expectState).toEqual(toState);
    });
  });

  describe('Actions', () => {

    it('CreateRequest', () => {
      const payload = {mutationParams: {id: 5, name: 'e'}};
      const expectedAction = actions.CreateRequest(payload);
      const store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
      store.dispatch(actions.CreateRequest(payload));
      expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
    });

    it('CreateMAnyRequest', () => {
      const payload = {mutationParams: [{id: 5, name: 'e'}, {id: 6, name: 'e'}]};
      const expectedAction = actions.CreateManyRequest(payload);
      const store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
      store.dispatch(actions.CreateManyRequest(payload));
      expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
    });

    it('DeleteRequest', () => {
      const payload = {mutationParams: {id: 0, name: 'a'}};
      const expectedAction = actions.DeleteRequest(payload);
      const store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
      store.dispatch(actions.DeleteRequest(payload));
      expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
    });

    it('DeleteRequest', () => {
      const payload = {mutationParams: [{id: 0, name: 'a'}, {id: 1, name: 'b'}]};
      const expectedAction = actions.DeleteManyRequest(payload);
      const store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
      store.dispatch(actions.DeleteManyRequest(payload));
      expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
    });

    it('EditRequest', () => {
      const payload = {mutationParams: {id: 0, name: 'aa'}};
      const expectedAction = actions.EditRequest(payload);
      const store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
      store.dispatch(actions.EditRequest(payload));
      expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
    });

    it('EditManyRequest', () => {
      const payload = {mutationParams: [{id: 0, name: 'a'}, {id: 1, name: 'b'}]};
      const expectedAction = actions.EditManyRequest(payload);
      const store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
      store.dispatch(actions.EditManyRequest(payload));
      expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
    });

    it('SearchRequest', () => {
      const payload: ICriteria = {queryParams: 'queryParams', path: ['path'], mode: undefined};
      const expectedAction = actions.SearchRequest(payload);
      const store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
      store.dispatch(actions.SearchRequest(payload));
      expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
    });

    it('SearchRequest', () => {
      const payload: ICriteria = {queryParams: undefined, path: undefined, mode: 'REFRESH'};
      const expectedAction = actions.SearchRequest(payload);
      const store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
      store.dispatch(actions.SearchRequest(payload));
      expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
    });

    it('SearchSuccess', () => {
      const items: Pizza[] = [{id: 4, name: 'e'}, {id: 5, name: 'f'}, {id: 6, name: 'g'}, {id: 7, name: 'h'}];
      const expectedAction = actions.SearchSuccess({items, request: null});
      const store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
      store.dispatch(actions.SearchSuccess({items, request: null}));
      expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
    });

    it('DeleteSuccess', () => {
      const payload = {id: '0'};
      const expectedAction = actions.DeleteSuccess(payload);
      const store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
      store.dispatch(actions.DeleteSuccess(payload));
      expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
    });

    it('DeleteManySuccess', () => {
      const payload = {ids: ['0', '1']};
      const expectedAction = actions.DeleteManySuccess(payload);
      const store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
      store.dispatch(actions.DeleteManySuccess(payload));
      expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
    });

    it('CreateSuccess', () => {
      const payload = {item: {id: 5, name: 'create'}};
      const expectedAction = actions.CreateSuccess(payload);
      const store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
      store.dispatch(actions.CreateSuccess(payload));
      expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
    });

    it('CreateManySuccess', () => {
      const payload = {items: [{id: 5, name: 'create'}, {id: 6, name: 'create'}]};
      const expectedAction = actions.CreateManySuccess(payload);
      const store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
      store.dispatch(actions.CreateManySuccess(payload));
      expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
    });

    it('EditSuccess', () => {
      const payload = {item: {id: 5, name: 'create'}};
      const expectedAction = actions.EditSuccess(payload);
      const store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
      store.dispatch(actions.EditSuccess(payload));
      expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
    });

    it('EditManySuccess', () => {
      const payload = {items: [{id: 5, name: 'edit'}, {id: 6, name: 'edit'}]};
      const expectedAction = actions.EditManySuccess(payload);
      const store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
      store.dispatch(actions.EditManySuccess(payload));
      expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
    });

    it('SelectItem', () => {
      const payload = {item: {id: 0, name: 'a'}};
      const expectedAction = actions.SelectItem(payload);
      const store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
      store.dispatch(actions.SelectItem(payload));
      expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
    });

    it('SelectItems', () => {
      const payload = {items: [{id: 0, name: 'a'}, {id: 1, name: 'b'}]};
      const expectedAction = actions.SelectItems(payload);
      const store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
      store.dispatch(actions.SelectItems(payload));
      expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
    });

    it('SelectSuccess', () => {
      const payload = {item: {id: 0, name: 'a'}};
      const expectedAction = actions.SelectSuccess(payload);
      const store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
      store.dispatch(actions.SelectSuccess(payload));
      expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
    });

    it('Reset', () => {
      const expectedAction = actions.Reset();
      const store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
      store.dispatch(actions.Reset());
      expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
    });

    it('SearchFailure', () => {
      const payload = {error: 'error'};
      const expectedAction = actions.SearchFailure(payload);
      const store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
      store.dispatch(actions.SearchFailure(payload));
      expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
    });

    it('DeleteFailure', () => {
      const payload = {error: 'error'};
      const expectedAction = actions.DeleteFailure(payload);
      const store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
      store.dispatch(actions.DeleteFailure(payload));
      expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
    });

    it('DeleteManyFailure', () => {
      const payload = {error: 'error'};
      const expectedAction = actions.DeleteManyFailure(payload);
      const store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
      store.dispatch(actions.DeleteManyFailure(payload));
      expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
    });

    it('CreateFailure', () => {
      const payload = {error: 'error'};
      const expectedAction = actions.CreateFailure(payload);
      const store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
      store.dispatch(actions.CreateFailure(payload));
      expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
    });

    it('CreateManyFailure', () => {
      const payload = {error: 'error'};
      const expectedAction = actions.CreateManyFailure(payload);
      const store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
      store.dispatch(actions.CreateManyFailure(payload));
      expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
    });

    it('EditFailure', () => {
      const payload = {error: 'error'};
      const expectedAction = actions.EditFailure(payload);
      const store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
      store.dispatch(actions.EditFailure(payload));
      expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
    });

    it('EditManyFailure', () => {
      const payload = {error: 'error'};
      const expectedAction = actions.EditManyFailure(payload);
      const store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
      store.dispatch(actions.EditManyFailure(payload));
      expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
    });

    it('SelectRequest', () => {
      const payload = {queryParams:{item: {id: 0, name: 'a'}}};
      const expectedAction = actions.SelectRequest(payload);
      const store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
      store.dispatch(actions.SelectRequest(payload));
      expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
    });

    it('SelectFailure', () => {
      const payload = {error: 'error'};
      const expectedAction = actions.SelectFailure(payload);
      const store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
      store.dispatch(actions.SelectFailure(payload));
      expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
    });

    it('Filters', () => {
      const payload = {filters: {id: {value: 1, matchMode: 'startsWith'}}};
      const expectedAction = actions.Filters(payload);
      const store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
      store.dispatch(actions.Filters(payload));
      expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
    });

    it('Edit', () => {
      const payload = {item: {id: 0, name: 'a'}};
      const expectedAction = actions.Edit(payload);
      const store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
      store.dispatch(actions.Edit(payload));
      expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
    });

    it('Create', () => {
      const payload = {item: {id: 0, name: 'a'}};
      const expectedAction = actions.Create(payload);
      const store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
      store.dispatch(actions.Create(payload));
      expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
    });

    // it('Delete', () => {
    //   const payload = {item: {id: '0', name: 'a'}};
    //   const expectedAction = actions.Delete(payload);
    //   const store = jasmine.createSpyObj<Store<State>>('store', ['dispatch']);
    //   store.dispatch(actions.Delete({id: '0'}));
    //   expect(store.dispatch).toHaveBeenCalledWith({id: '0'});
    // });

    it('Delete', () => {
      const payload = {id: '0'};

      const expectState: State = adapter.removeOne(payload.id, {
        ...state,
        isLoaded: true,
        isLoading: false,
        error: null
      });

      const toState: State = featureReducer(expectState, actions.Delete(payload));

      expect(expectState).toEqual(toState);
    });


  });
});
