import {NEC_IDB_ADAPTER} from 'ngrx-entity-crud/devtools';
import {provideNecIdbAdapterFromPersistence} from './nec-persistence-idb-adapter';
import {NecPersistenceService} from './nec-persistence.service';
import {NecSectionStats} from './models';

/**
 * `provideNecIdbAdapterFromPersistence` (Fase 4 del piano): ponte verso `NEC_IDB_ADAPTER` di
 * `devtools/`, così `<nec-dashboard>` mostra le sezioni persistite con nomi e conteggi veri.
 */
describe('provideNecIdbAdapterFromPersistence', () => {
  it('fornisce NEC_IDB_ADAPTER con una useFactory che dipende da NecPersistenceService', () => {
    const provider = provideNecIdbAdapterFromPersistence();

    expect(provider).toEqual(
      expect.objectContaining({provide: NEC_IDB_ADAPTER, deps: [NecPersistenceService]})
    );
  });

  it('mappa ogni sezione in un "database" virtuale con gli store search/drafts', async () => {
    const sections: NecSectionStats[] = [
      {feature: 'coins', count: 100, bytes: 12345, draftCount: 3, at: Date.now()},
      {feature: 'orders', count: 5, bytes: 200, draftCount: 0, at: Date.now()},
    ];
    const persistence = {listSections: jest.fn().mockResolvedValue(sections)} as unknown as NecPersistenceService;

    const provider = provideNecIdbAdapterFromPersistence() as unknown as {
      useFactory: (p: NecPersistenceService) => { name: string; isAvailable: () => boolean; listDatabases: () => Promise<unknown> };
    };
    const adapter = provider.useFactory(persistence);

    expect(adapter.isAvailable()).toBe(true);
    const databases = await adapter.listDatabases();

    expect(databases).toEqual([
      {name: 'coins', version: null, stores: [{name: 'search', count: 100}, {name: 'drafts', count: 3}]},
      {name: 'orders', version: null, stores: [{name: 'search', count: 5}, {name: 'drafts', count: 0}]},
    ]);
    expect(persistence.listSections).toHaveBeenCalledTimes(1);
  });

  it('nessuna sezione locale: elenco vuoto', async () => {
    const persistence = {listSections: jest.fn().mockResolvedValue([])} as unknown as NecPersistenceService;
    const provider = provideNecIdbAdapterFromPersistence() as unknown as {
      useFactory: (p: NecPersistenceService) => { listDatabases: () => Promise<unknown[]> };
    };

    const adapter = provider.useFactory(persistence);

    expect(await adapter.listDatabases()).toEqual([]);
  });
});
