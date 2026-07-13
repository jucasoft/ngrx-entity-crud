import {NecGridRegistryService} from './nec-grid-registry.service';
import {NecGridHandle} from './models';

/** Handle finto con il sottoinsieme di GridApi letto dal registry (tutto sovrascrivibile). */
function fakeHandle(overrides: Partial<NecGridHandle> = {}): NecGridHandle {
  return {
    getDisplayedRowCount: () => 42,
    getSelectedRows: () => [{}, {}],
    getFilterModel: () => ({name: {type: 'contains', filter: 'a'}}),
    getColumnState: () => [
      {colId: 'name', sort: 'asc', sortIndex: 1},
      {colId: 'id', sort: 'desc', sortIndex: 0},
      {colId: 'version', sort: null},
    ],
    setFilterModel: jest.fn(),
    deselectAll: jest.fn(),
    autoSizeAllColumns: jest.fn(),
    isDestroyed: () => false,
    ...overrides,
  };
}

describe('NecGridRegistryService', () => {
  let service: NecGridRegistryService;

  beforeEach(() => {
    service = new NecGridRegistryService();
  });

  it('register/read: snapshot completo con meta e id di registrazione', () => {
    service.register('product-browser', fakeHandle(), {
      store: 'product_browser',
      component: 'ProductBrowserListComponent',
    });

    const grids = service.read();
    expect(grids.length).toBe(1);
    expect(grids[0]).toEqual(
      expect.objectContaining({
        key: 'product-browser',
        store: 'product_browser',
        component: 'ProductBrowserListComponent',
        displayedRows: 42,
        selectedCount: 2,
        filterCount: 1,
        // ordinate per sortIndex, non per posizione nel column state
        sortedColumns: ['id desc', 'name asc'],
      })
    );
    expect(typeof grids[0].id).toBe('number');
    expect(grids[0].registeredAt).toEqual(expect.any(String));
  });

  it('senza meta: store e component sono null', () => {
    service.register('log', fakeHandle());
    expect(service.read()[0].store).toBeNull();
    expect(service.read()[0].component).toBeNull();
  });

  it('il disposer rimuove SOLO la registrazione a cui appartiene', () => {
    const disposeA = service.register('a', fakeHandle());
    service.register('b', fakeHandle());

    disposeA();
    const keys = service.read().map((g) => g.key);
    expect(keys).toEqual(['b']);
    // idempotente: un secondo dispose non tocca le altre registrazioni
    disposeA();
    expect(service.read().length).toBe(1);
  });

  it('stessa key registrata due volte: due entry con id diversi', () => {
    service.register('coin', fakeHandle());
    service.register('coin', fakeHandle());
    const grids = service.read();
    expect(grids.length).toBe(2);
    expect(grids[0].id).not.toBe(grids[1].id);
  });

  it('handle distrutto: espulso al read successivo (niente righe zombie)', () => {
    let destroyed = false;
    service.register('dead', fakeHandle({isDestroyed: () => destroyed}));

    expect(service.read().length).toBe(1);
    destroyed = true;
    expect(service.read().length).toBe(0);
    // rimosso dalla MAPPA, non solo filtrato: anche "resuscitando" l'handle non ricompare
    destroyed = false;
    expect(service.read().length).toBe(0);
  });

  it('register spazza gli handle distrutti accumulati senza unregister', () => {
    // Rete di sicurezza per i disposer dimenticati: senza dashboard aperta nessuno chiama
    // read(), quindi è il mount successivo a ripulire.
    service.register('leaked', fakeHandle({isDestroyed: () => true}));
    service.register('fresh', fakeHandle());
    expect(service.read().map((g) => g.key)).toEqual(['fresh']);
  });

  it('metodi assenti: i valori corrispondenti degradano a null', () => {
    service.register('minimal', {});
    const g = service.read()[0];
    expect(g.displayedRows).toBeNull();
    expect(g.selectedCount).toBeNull();
    expect(g.filterCount).toBeNull();
    expect(g.sortedColumns).toBeNull(); // non leggibile, diverso da [] (nessun sort attivo)
  });

  it('metodi che lanciano: nessuna eccezione, valori null', () => {
    const boom = () => {
      throw new Error('grid disposed');
    };
    service.register('broken', fakeHandle({
      getDisplayedRowCount: boom,
      getSelectedRows: boom,
      getFilterModel: boom,
      getColumnState: boom,
      isDestroyed: boom, // anche il check di vita è difensivo: handle mantenuto
    }));

    const g = service.read()[0];
    expect(g.displayedRows).toBeNull();
    expect(g.selectedCount).toBeNull();
    expect(g.filterCount).toBeNull();
    expect(g.sortedColumns).toBeNull();
  });

  it('filter model vuoto o null = 0 filtri attivi (diverso da non leggibile = null)', () => {
    service.register('nofilters', fakeHandle({getFilterModel: () => ({})}));
    expect(service.read()[0].filterCount).toBe(0);

    // alcuni wrapper usano null al posto di {} per "nessun filtro": stessa semantica
    service.register('nullmodel', fakeHandle({getFilterModel: () => null}));
    expect(service.read().find((g) => g.key === 'nullmodel')?.filterCount).toBe(0);
  });

  it('column state leggibile ma senza sort attivi: [] (diverso da null)', () => {
    service.register('nosort', fakeHandle({getColumnState: () => [{colId: 'a', sort: null}]}));
    expect(service.read()[0].sortedColumns).toEqual([]);
  });

  it('azioni: raggiungono l\'handle giusto e tornano false su id inesistente', () => {
    const handle = fakeHandle();
    service.register('a', fakeHandle());
    service.register('b', handle);
    const idB = service.read().find((g) => g.key === 'b')?.id as number;

    expect(service.autoSizeColumns(idB)).toBe(true);
    expect(service.clearFilters(idB)).toBe(true);
    expect(service.clearSelection(idB)).toBe(true);
    expect(handle.autoSizeAllColumns).toHaveBeenCalledTimes(1);
    expect(handle.setFilterModel).toHaveBeenCalledWith(null);
    expect(handle.deselectAll).toHaveBeenCalledTimes(1);

    expect(service.autoSizeColumns(9999)).toBe(false);
  });

  it('azione su handle che lancia: false, nessuna eccezione', () => {
    service.register('broken', fakeHandle({
      setFilterModel: () => {
        throw new Error('disposed');
      },
    }));
    const id = service.read()[0].id;
    expect(service.clearFilters(id)).toBe(false);
  });

  it('azione con metodo assente: true (no-op consapevole, la registrazione esiste)', () => {
    service.register('minimal', {});
    const id = service.read()[0].id;
    expect(service.autoSizeColumns(id)).toBe(true);
  });
});
