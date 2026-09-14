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

  it('con enabled: false ogni operazione è un no-op', async () => {
    const disabled = makeService({enabled: false});

    await disabled.writeSearch('coins', {}, [{id: '1', name: 'BTC'}], selectId);
    await disabled.putDrafts('coins', [{id: '1', name: 'BTC'}], selectId);

    expect(await disabled.stats('coins')).toBeNull();
    expect(await disabled.readSection('coins')).toBeNull();

    disabled.ngOnDestroy();
  });
});
