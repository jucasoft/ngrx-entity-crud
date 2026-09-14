import {Actions, EntityCrudAdapter, EntityCrudState} from '../lib/models';
import {createCrudEntityAdapter} from '../lib/create_adapter';
import {toDictionary} from '../lib/utils';

/**
 * Copre la famiglia di reducer che cancella elementi mentre esistono voci in
 * `entitiesSelected` (usato sia per la selezione multipla sia come bozza locale).
 *
 * Il difetto originale era invisibile senza selezione attiva: con `idsSelected: []` il
 * filtro sbagliato produceva comunque `[]`. Questi test partono quindi SEMPRE da uno stato
 * con selezioni popolate.
 */

const NAME = 'pizza';

class Pizza {
  id: number;
  name: string;
}

class Doc {
  code: string;
  title: string;
}

describe('Reducers - delete con selezione attiva', () => {
  let adapter: EntityCrudAdapter<Pizza>;
  let state: EntityCrudState<Pizza>;
  let actions: Actions<Pizza>;
  let featureReducer;

  const pizzas: Pizza[] = [
    {id: 0, name: 'a'},
    {id: 1, name: 'b'},
    {id: 2, name: 'c'},
    {id: 3, name: 'd'},
  ];

  /** Stato di partenza con alcune entità in `entitiesSelected` (le "bozze"). */
  const withSelected = (items: Pizza[], extra: Partial<EntityCrudState<Pizza>> = {}) => {
    const entitiesSelected = toDictionary(items, adapter);
    return {
      ...state,
      entitiesSelected,
      idsSelected: Object.keys(entitiesSelected),
      ...extra,
    };
  };

  beforeEach(() => {
    adapter = createCrudEntityAdapter<Pizza>({selectId: (model) => model.id});
    state = adapter.getInitialCrudState();
    state = adapter.setAll(pizzas, state);
    actions = adapter.createCrudActions(NAME);
    featureReducer = adapter.createCrudReducer(state, actions);
  });

  describe('DeleteSuccess', () => {
    it('should keep every selected item when deleting an unselected one', () => {
      const fromState = withSelected([pizzas[0], pizzas[1], pizzas[2]]);

      const result = featureReducer(fromState, actions.DeleteSuccess({id: '3', request: null}));

      expect(result.idsSelected).toEqual(['0', '1', '2']);
      expect(Object.keys(result.entitiesSelected)).toEqual(['0', '1', '2']);
      expect(result.entitiesSelected['1']).toEqual(pizzas[1]);
    });

    it('should drop only the deleted item from the selection', () => {
      const fromState = withSelected([pizzas[0], pizzas[1], pizzas[2]]);

      const result = featureReducer(fromState, actions.DeleteSuccess({id: '1', request: null}));

      expect(result.idsSelected).toEqual(['0', '2']);
      expect(result.entitiesSelected['1']).toBeUndefined();
      expect(result.entitiesSelected['0']).toEqual(pizzas[0]);
      expect(result.entitiesSelected['2']).toEqual(pizzas[2]);
    });

    it('should keep idsSelected and entitiesSelected aligned', () => {
      const fromState = withSelected([pizzas[0], pizzas[1], pizzas[2]]);

      const result = featureReducer(fromState, actions.DeleteSuccess({id: '2', request: null}));

      expect(result.idsSelected).toEqual(Object.keys(result.entitiesSelected));
    });

    it('should remove the deleted entity from entities as well', () => {
      const fromState = withSelected([pizzas[0], pizzas[1]]);

      const result = featureReducer(fromState, actions.DeleteSuccess({id: '1', request: null}));

      expect(result.entities['1']).toBeUndefined();
      expect(result.ids).not.toContain(1);
    });

    it('should preserve idSelected/itemSelected when another item is deleted', () => {
      const fromState = withSelected([pizzas[0]], {idSelected: 2, itemSelected: pizzas[2]});

      const result = featureReducer(fromState, actions.DeleteSuccess({id: '0', request: null}));

      expect(result.idSelected).toBe(2);
      expect(result.itemSelected).toEqual(pizzas[2]);
    });
  });

  describe('DeleteManySuccess', () => {
    it('should not drop selected items whose id merely matches an array index', () => {
      // `'0' in ['7', '8']` è true (indice 0 esiste): il vecchio filtro rimuoveva
      // le selezioni con id 0 e 1 pur non essendo state cancellate.
      const fromState = withSelected([pizzas[0], pizzas[1], pizzas[2]]);

      const result = featureReducer(
        fromState,
        actions.DeleteManySuccess({ids: ['7', '8'], request: null})
      );

      expect(result.idsSelected).toEqual(['0', '1', '2']);
      expect(Object.keys(result.entitiesSelected)).toEqual(['0', '1', '2']);
    });

    it('should drop exactly the deleted items from the selection', () => {
      const fromState = withSelected([pizzas[0], pizzas[1], pizzas[2]]);

      const result = featureReducer(
        fromState,
        actions.DeleteManySuccess({ids: ['0', '2'], request: null})
      );

      expect(result.idsSelected).toEqual(['1']);
      expect(result.entitiesSelected['1']).toEqual(pizzas[1]);
      expect(result.entitiesSelected['0']).toBeUndefined();
      expect(result.entitiesSelected['2']).toBeUndefined();
    });

    it('should preserve idSelected when its value only matches an array index', () => {
      const fromState = withSelected([pizzas[1]], {idSelected: 0, itemSelected: pizzas[0]});

      const result = featureReducer(
        fromState,
        actions.DeleteManySuccess({ids: ['7', '8'], request: null})
      );

      expect(result.idSelected).toBe(0);
      expect(result.itemSelected).toEqual(pizzas[0]);
    });

    it('should preserve idSelected/itemSelected when another item is deleted', () => {
      const fromState = withSelected([pizzas[1]], {idSelected: 2, itemSelected: pizzas[2]});

      const result = featureReducer(
        fromState,
        actions.DeleteManySuccess({ids: ['1'], request: null})
      );

      expect(result.idSelected).toBe(2);
      expect(result.itemSelected).toEqual(pizzas[2]);
    });

    it('should clear idSelected when the selected item is deleted', () => {
      const fromState = withSelected([pizzas[1]], {idSelected: 1, itemSelected: pizzas[1]});

      const result = featureReducer(
        fromState,
        actions.DeleteManySuccess({ids: ['1'], request: null})
      );

      expect(result.idSelected).toBeNull();
      expect(result.itemSelected).toBeNull();
    });

    it('should tolerate an empty ids list', () => {
      const fromState = withSelected([pizzas[0], pizzas[1]]);

      const result = featureReducer(
        fromState,
        actions.DeleteManySuccess({ids: [], request: null})
      );

      expect(result.idsSelected).toEqual(['0', '1']);
    });
  });

  describe('DeleteManySuccess con id stringa', () => {
    let docAdapter: EntityCrudAdapter<Doc>;
    let docState: EntityCrudState<Doc>;
    let docActions: Actions<Doc>;
    let docReducer;

    const docs: Doc[] = [
      {code: 'abc', title: 'primo'},
      {code: 'def', title: 'secondo'},
      {code: 'ghi', title: 'terzo'},
    ];

    beforeEach(() => {
      docAdapter = createCrudEntityAdapter<Doc>({selectId: (model) => model.code});
      docState = docAdapter.getInitialCrudState();
      docState = docAdapter.setAll(docs, docState);
      docActions = docAdapter.createCrudActions('doc');
      docReducer = docAdapter.createCrudReducer(docState, docActions);
    });

    it('should drop selected items with non numeric ids', () => {
      // `'abc' in ['abc']` è false (le chiavi dell'array sono '0'): il vecchio filtro
      // non rimuoveva mai nulla e la selezione conservava entità già cancellate.
      const entitiesSelected = toDictionary(docs, docAdapter);
      const fromState = {
        ...docState,
        entitiesSelected,
        idsSelected: Object.keys(entitiesSelected),
      };

      const result = docReducer(
        fromState,
        docActions.DeleteManySuccess({ids: ['abc', 'ghi'], request: null})
      );

      expect(result.idsSelected).toEqual(['def']);
      expect(result.entitiesSelected['abc']).toBeUndefined();
      expect(result.entitiesSelected['ghi']).toBeUndefined();
      expect(result.entitiesSelected['def']).toEqual(docs[1]);
    });
  });

  describe('id 0 come id valido', () => {
    // `0` è falsy: le guardie `!!state.idSelected` e `!idSelected` lo trattavano come
    // "nessuna selezione", con due effetti opposti — non azzerare mai l'id 0 cancellato,
    // e azzerare `itemSelected` anche quando la selezione andava conservata.

    it('DeleteSuccess should keep the selection when another item is deleted', () => {
      const fromState = withSelected([pizzas[1]], {idSelected: 0, itemSelected: pizzas[0]});

      const result = featureReducer(fromState, actions.DeleteSuccess({id: '1', request: null}));

      expect(result.idSelected).toBe(0);
      expect(result.itemSelected).toEqual(pizzas[0]);
    });

    it('DeleteSuccess should clear the selection when item 0 is the deleted one', () => {
      const fromState = withSelected([pizzas[0]], {idSelected: 0, itemSelected: pizzas[0]});

      const result = featureReducer(fromState, actions.DeleteSuccess({id: '0', request: null}));

      expect(result.idSelected).toBeNull();
      expect(result.itemSelected).toBeNull();
    });

    it('DeleteSuccess should clear the selection despite the id type mismatch', () => {
      // idSelected numerico, id dell'action stringa: `2 === '2'` era false.
      const fromState = withSelected([pizzas[2]], {idSelected: 2, itemSelected: pizzas[2]});

      const result = featureReducer(fromState, actions.DeleteSuccess({id: '2', request: null}));

      expect(result.idSelected).toBeNull();
      expect(result.itemSelected).toBeNull();
    });

    it('DeleteManySuccess should clear the selection when item 0 is among the deleted ones', () => {
      const fromState = withSelected([pizzas[0]], {idSelected: 0, itemSelected: pizzas[0]});

      const result = featureReducer(
        fromState,
        actions.DeleteManySuccess({ids: ['0', '3'], request: null})
      );

      expect(result.idSelected).toBeNull();
      expect(result.itemSelected).toBeNull();
    });

    it('Delete should keep idSelected 0 when another item is deleted', () => {
      const fromState = withSelected([pizzas[1]], {idSelected: 0, itemSelected: pizzas[0]});

      const result = featureReducer(fromState, actions.Delete({id: '1'}));

      expect(result.idSelected).toBe(0);
    });

    it('Delete should clear idSelected when item 0 is the deleted one', () => {
      const fromState = withSelected([pizzas[0]], {idSelected: 0, itemSelected: pizzas[0]});

      const result = featureReducer(fromState, actions.Delete({id: '0'}));

      expect(result.idSelected).toBeNull();
    });
  });

  describe('Delete (locale)', () => {
    it('should drop only the deleted item and keep the two structures aligned', () => {
      const fromState = withSelected([pizzas[0], pizzas[1], pizzas[2]]);

      const result = featureReducer(fromState, actions.Delete({id: '1'}));

      expect(result.idsSelected).toEqual(['0', '2']);
      expect(Object.keys(result.entitiesSelected)).toEqual(['0', '2']);
      expect(result.idsSelected).toEqual(Object.keys(result.entitiesSelected));
      expect(result.entitiesSelected['1']).toBeUndefined();
    });

    it('should keep every selected item when deleting an unselected one', () => {
      const fromState = withSelected([pizzas[0], pizzas[1]]);

      const result = featureReducer(fromState, actions.Delete({id: '3'}));

      expect(result.idsSelected).toEqual(['0', '1']);
      expect(Object.keys(result.entitiesSelected)).toEqual(['0', '1']);
    });
  });
});
