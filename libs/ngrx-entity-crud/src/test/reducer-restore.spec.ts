import {Actions, EntityCrudAdapter, EntityCrudState} from '../lib/models';
import {createCrudEntityAdapter} from '../lib/create_adapter';

/**
 * Copre `Restore*` (Fase 1 di `ngrx-entity-crud-persistence-plan.md`): il ciclo
 * Request/Success/Failure che ripopola una sezione da una fonte locale (IndexedDB, via
 * `ngrx-entity-crud/persistence`) invece che dal server. A differenza di `SearchSuccess`,
 * `RestoreSuccess` non interpreta nessun `mode`: è sempre una sostituzione completa di
 * `entities` + `entitiesSelected`, perché quello che arriva è già esattamente lo stato salvato.
 */

const NAME = 'pizza';

class Pizza {
  id: number;
  name: string;
}

describe('Reducers - Restore*', () => {
  let adapter: EntityCrudAdapter<Pizza>;
  let state: EntityCrudState<Pizza>;
  let actions: Actions<Pizza>;
  let featureReducer;

  const pizzas: Pizza[] = [
    {id: 0, name: 'a'},
    {id: 1, name: 'b'},
    {id: 2, name: 'c'},
  ];

  beforeEach(() => {
    adapter = createCrudEntityAdapter<Pizza>({selectId: (model) => model.id});
    state = adapter.getInitialCrudState();
    actions = adapter.createCrudActions(NAME);
    featureReducer = adapter.createCrudReducer(state, actions);
  });

  describe('RestoreRequest', () => {
    it('sets isLoading true and clears a previous error, without touching entities', () => {
      const fromState = {...state, ...adapter.setAll(pizzas, state), error: 'boom'};

      const result = featureReducer(fromState, actions.RestoreRequest());

      expect(result.isLoading).toBe(true);
      expect(result.isLoaded).toBe(false);
      expect(result.error).toBeNull();
      expect(result.ids).toEqual(fromState.ids);
    });
  });

  describe('RestoreSuccess', () => {
    it('repopulates entities, entitiesSelected, idsSelected and lastCriteria in one step', () => {
      const fromState = {...state, isLoading: true};
      const criteria = {queryParams: {q: 'x'}};

      const result = featureReducer(
        fromState,
        actions.RestoreSuccess({items: pizzas, selected: [pizzas[0], pizzas[2]], criteria})
      );

      expect(result.ids).toEqual([0, 1, 2]);
      expect(result.entities['1']).toEqual(pizzas[1]);
      expect(result.idsSelected).toEqual(['0', '2']);
      expect(result.entitiesSelected['0']).toEqual(pizzas[0]);
      expect(result.entitiesSelected['2']).toEqual(pizzas[2]);
      expect(result.entitiesSelected['1']).toBeUndefined();
      expect(result.lastCriteria).toEqual(criteria);
      expect(result.isLoading).toBe(false);
      expect(result.isLoaded).toBe(true);
      expect(result.error).toBeNull();
    });

    it('replaces whatever was in entities before, it does not merge', () => {
      const stale = [{id: 9, name: 'stale'}];
      const fromState = adapter.setAll(stale, state);

      const result = featureReducer(
        fromState,
        actions.RestoreSuccess({items: pizzas, selected: [], criteria: {}})
      );

      expect(result.entities['9']).toBeUndefined();
      expect(result.ids).toEqual([0, 1, 2]);
    });

    it('clears entitiesSelected/idsSelected when there are no drafts to restore', () => {
      const result = featureReducer(
        state,
        actions.RestoreSuccess({items: pizzas, selected: [], criteria: {}})
      );

      expect(result.idsSelected).toEqual([]);
      expect(result.entitiesSelected).toEqual({});
    });
  });

  describe('RestoreFailure', () => {
    it('sets the error and stops loading, without touching entities', () => {
      const fromState = {...adapter.setAll(pizzas, state), isLoading: true};

      const result = featureReducer(fromState, actions.RestoreFailure({error: 'IndexedDB non disponibile'}));

      expect(result.isLoading).toBe(false);
      expect(result.isLoaded).toBe(false);
      expect(result.error).toBe('IndexedDB non disponibile');
      expect(result.ids).toEqual(fromState.ids);
    });
  });
});
