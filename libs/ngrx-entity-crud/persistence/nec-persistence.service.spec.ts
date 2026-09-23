import 'fake-indexeddb/auto';
import {NecPersistenceService} from './nec-persistence.service';

interface Coin {
  id: string;
  name: string;
}

const selectId = (item: Coin): string => item.id;

function makeService(overrides: Record<string, unknown> = {}): NecPersistenceService {
  return new NecPersistenceService({
    dbName: `nec-persistence-test-${Math.random().toString(36).slice(2)}`,
    dbVersion: 1,
    debounceMs: 0,
    enabled: true,
    ...overrides,
  });
}

describe('NecPersistenceService', () => {
  let service: NecPersistenceService;

  beforeEach(() => {
    service = makeService();
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('nessun dato locale: stats e readSection restituiscono null', async () => {
    expect(await service.stats('coins')).toBeNull();
    expect(await service.readSection('coins')).toBeNull();
  });

  it('scrive il blocco di ricerca e lo rilegge per intero', async () => {
    const items: Coin[] = [
      {id: '1', name: 'BTC'},
      {id: '2', name: 'ETH'},
    ];
    await service.writeSearch('coins', {q: 'x'}, items, selectId);

    const stats = await service.stats('coins');
    expect(stats?.count).toBe(2);
    expect(stats?.draftCount).toBe(0);
    expect(stats?.bytes ?? 0).toBeGreaterThan(0);

    const section = await service.readSection<Coin>('coins');
    expect(section?.count).toBe(2);
    expect(section?.entities['1']?.name).toBe('BTC');
    expect(section?.drafts['1']).toBeUndefined();
  });

  it('una bozza scrive un solo record e aggiorna il conteggio senza toccare gli altri', async () => {
    await service.writeSearch(
      'coins',
      {},
      [
        {id: '1', name: 'BTC'},
        {id: '2', name: 'ETH'},
      ],
      selectId
    );

    await service.putDrafts('coins', [{id: '1', name: 'BTC-edited'}], selectId);

    const stats = await service.stats('coins');
    expect(stats?.draftCount).toBe(1);

    const section = await service.readSection<Coin>('coins');
    expect(section?.entities['1']?.name).toBe('BTC');
    expect(section?.drafts['1']?.name).toBe('BTC-edited');
    expect(section?.drafts['2']).toBeUndefined();
  });

  it('cancella una bozza e aggiorna il conteggio', async () => {
    await service.writeSearch('coins', {}, [{id: '1', name: 'BTC'}], selectId);
    await service.putDrafts('coins', [{id: '1', name: 'BTC-edited'}], selectId);

    await service.deleteDrafts('coins', ['1']);

    const stats = await service.stats('coins');
    expect(stats?.draftCount).toBe(0);
    const section = await service.readSection<Coin>('coins');
    expect(section?.drafts['1']).toBeUndefined();
  });

  it('deleteAllDrafts azzera il conteggio senza toccare il blocco di ricerca', async () => {
    await service.writeSearch('coins', {}, [{id: '1', name: 'BTC'}], selectId);
    await service.putDrafts('coins', [{id: '1', name: 'BTC-edited'}], selectId);

    await service.deleteAllDrafts('coins');

    const stats = await service.stats('coins');
    expect(stats?.draftCount).toBe(0);
    expect(stats?.count).toBe(1);
  });

  it('purgeSection cancella ricerca, meta e bozze della sezione', async () => {
    await service.writeSearch('coins', {}, [{id: '1', name: 'BTC'}], selectId);
    await service.putDrafts('coins', [{id: '1', name: 'BTC-edited'}], selectId);

    await service.purgeSection('coins');

    expect(await service.stats('coins')).toBeNull();
    expect(await service.readSection('coins')).toBeNull();
  });

  it('non tocca ricerca né bozze di un\'altra sezione', async () => {
    await service.writeSearch('coins', {}, [{id: '1', name: 'BTC'}], selectId);
    await service.writeSearch('orders', {}, [{id: '9', name: 'Order9'}], selectId);
    await service.putDrafts('coins', [{id: '1', name: 'BTC-edited'}], selectId);

    await service.purgeSection('coins');

    const ordersStats = await service.stats('orders');
    expect(ordersStats?.count).toBe(1);
  });

  it('listSections elenca tutte le sezioni con dati locali', async () => {
    expect(await service.listSections()).toEqual([]);

    await service.writeSearch('coins', {}, [{id: '1', name: 'BTC'}], selectId);
    await service.writeSearch('orders', {}, [{id: '9', name: 'Order9'}], selectId);
    await service.putDrafts('coins', [{id: '1', name: 'BTC-edited'}], selectId);

    const sections = await service.listSections();
    const byFeature = new Map(sections.map((s) => [s.feature, s]));
    expect(byFeature.size).toBe(2);
    expect(byFeature.get('coins')?.count).toBe(1);
    expect(byFeature.get('coins')?.draftCount).toBe(1);
    expect(byFeature.get('orders')?.count).toBe(1);
    expect(byFeature.get('orders')?.draftCount).toBe(0);
  });

  it('pendingWrites$ sale durante una scrittura e torna a zero alla fine', async () => {
    const values: number[] = [];
    const sub = service.pendingWrites$.subscribe((v) => values.push(v));

    await service.writeSearch('coins', {}, [{id: '1', name: 'BTC'}], selectId);

    sub.unsubscribe();
    expect(values[0]).toBe(0);
    expect(values).toContain(1);
    expect(values[values.length - 1]).toBe(0);
  });

  it('registra il listener beforeunload solo mentre c\'è una scrittura in volo', async () => {
    const addSpy = jest.spyOn(window, 'addEventListener');
    const removeSpy = jest.spyOn(window, 'removeEventListener');

    await service.writeSearch('coins', {}, [{id: '1', name: 'BTC'}], selectId);

    expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('getSaveMode senza preferenza impostata: default "on-draft"', async () => {
    expect(await service.getSaveMode('coins')).toBe('on-draft');
  });

  it('setSaveMode poi getSaveMode: rilegge il valore impostato', async () => {
    await service.setSaveMode('coins', 'always');

    expect(await service.getSaveMode('coins')).toBe('always');
  });

  it('purgeSection non tocca la preferenza saveMode', async () => {
    await service.setSaveMode('coins', 'always');
    await service.writeSearch('coins', {}, [{id: '1', name: 'BTC'}], selectId);

    await service.purgeSection('coins');

    expect(await service.getSaveMode('coins')).toBe('always');
  });

  it('migrazione: un DB gia\' esistente in versione 1 (senza sectionPrefs) apre in versione 2 senza perdere i dati', async () => {
    const dbName = `nec-persistence-migration-${Math.random().toString(36).slice(2)}`;

    // Simula uno store creato dalla versione precedente della libreria: solo i tre object store
    // originali, nessun sectionPrefs.
    const oldDb = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        db.createObjectStore('search');
        db.createObjectStore('meta');
        const drafts = db.createObjectStore('drafts', {keyPath: ['feature', 'id']});
        drafts.createIndex('feature', 'feature');
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = oldDb.transaction(['search', 'meta'], 'readwrite');
      tx.objectStore('search').put({criteria: {}, ids: ['1'], entities: {1: {id: '1', name: 'BTC'}}, count: 1, bytes: 10, at: Date.now()}, 'coins');
      tx.objectStore('meta').put({feature: 'coins', count: 1, bytes: 10, draftCount: 0, at: Date.now()}, 'coins');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    oldDb.close();

    const upgraded = makeService({dbName, dbVersion: 2});

    const stats = await upgraded.stats('coins');
    expect(stats?.count).toBe(1);
    expect(await upgraded.getSaveMode('coins')).toBe('on-draft');
    await upgraded.setSaveMode('coins', 'always');
    expect(await upgraded.getSaveMode('coins')).toBe('always');

    upgraded.ngOnDestroy();
  });

  describe('apertura del DB (open)', () => {
    /** Richiesta finta che non chiama mai nessun callback finché il test non lo decide. */
    function fakeOpenRequest(): IDBOpenDBRequest & Record<string, any> {
      return {} as IDBOpenDBRequest & Record<string, any>;
    }

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('un\'apertura fallita non resta in cache: la chiamata successiva ritenta', async () => {
      const failing = fakeOpenRequest();
      const realOpen = indexedDB.open.bind(indexedDB);
      jest.spyOn(indexedDB, 'open')
        .mockImplementationOnce(() => {
          setTimeout(() => failing.onerror?.(new Event('error')));
          return failing;
        })
        .mockImplementation(realOpen);

      await expect(service.stats('coins')).rejects.toThrow();
      await expect(service.stats('coins')).resolves.toBeNull();
    });

    it('un\'apertura che non risponde mai scade dopo openTimeoutMs e la chiamata successiva ritenta', async () => {
      const timedService = makeService({openTimeoutMs: 20});
      const hanging = fakeOpenRequest();
      const realOpen = indexedDB.open.bind(indexedDB);
      jest.spyOn(indexedDB, 'open')
        .mockImplementationOnce(() => hanging)
        .mockImplementation(realOpen);

      await expect(timedService.stats('coins')).rejects.toThrow(/timeout/i);
      await expect(timedService.stats('coins')).resolves.toBeNull();

      timedService.ngOnDestroy();
    });

    it('una connessione aperta dopo il timeout viene chiusa, non resta orfana', async () => {
      const timedService = makeService({openTimeoutMs: 20});
      const late = fakeOpenRequest();
      jest.spyOn(indexedDB, 'open').mockImplementationOnce(() => late);

      await expect(timedService.stats('coins')).rejects.toThrow(/timeout/i);

      const lateDb = {close: jest.fn()};
      Object.defineProperty(late, 'result', {value: lateDb});
      late.onsuccess?.(new Event('success'));

      expect(lateDb.close).toHaveBeenCalled();
      timedService.ngOnDestroy();
    });

    it('cede la connessione a una scheda che aggiorna la versione del DB (onversionchange)', async () => {
      const dbName = `nec-persistence-versionchange-${Math.random().toString(36).slice(2)}`;
      const oldTab = makeService({dbName, dbVersion: 1});
      await oldTab.writeSearch('coins', {}, [{id: '1', name: 'BTC'}], selectId);

      const newTab = makeService({dbName, dbVersion: 2});

      expect((await newTab.stats('coins'))?.count).toBe(1);

      oldTab.ngOnDestroy();
      newTab.ngOnDestroy();
    });
  });

  it('con enabled: false ogni operazione è un no-op', async () => {
    const disabled = makeService({enabled: false});

    await disabled.writeSearch('coins', {}, [{id: '1', name: 'BTC'}], selectId);
    await disabled.putDrafts('coins', [{id: '1', name: 'BTC'}], selectId);

    expect(await disabled.stats('coins')).toBeNull();
    expect(await disabled.readSection('coins')).toBeNull();
    expect(await disabled.listSections()).toEqual([]);
    await disabled.setSaveMode('coins', 'always');
    expect(await disabled.getSaveMode('coins')).toBe('on-draft');

    disabled.ngOnDestroy();
  });
});
