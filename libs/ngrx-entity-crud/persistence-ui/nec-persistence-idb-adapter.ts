import {Provider} from '@angular/core';
import {NEC_IDB_ADAPTER, NecIdbAdapter, NecIdbDbReport} from 'ngrx-entity-crud/devtools';
import {NecPersistenceService} from 'ngrx-entity-crud/persistence';

/**
 * Ponte verso `ngrx-entity-crud/devtools`: implementa `NecIdbAdapter` (`NEC_IDB_ADAPTER`) sopra
 * `NecPersistenceService`, così `<nec-dashboard>` — che di suo resta agnostica, vedi
 * `devtools/models.ts` — mostra le sezioni persistite con nomi e conteggi veri invece del solo
 * fallback nativo (utile in particolare su Firefox, dove `indexedDB.databases()` non esiste e la
 * dashboard richiederebbe altrimenti il nome del DB passato a mano).
 *
 * Ogni sezione (`listSections()`, un cursore leggero su `meta`) diventa un "database" virtuale
 * nel report — non il vero database fisico `nec-persistence`, che è uno solo: la vista per
 * sezione è quella utile in dashboard, non quella per object store fisico. `search`/`drafts`
 * riportano `count`/`draftCount` dallo stesso record `meta`, senza toccare i blob.
 *
 * Registrare accanto a `NecPersistenceModule.forRoot(...)`:
 * `providers: [provideNecIdbAdapterFromPersistence()]`.
 */
export function provideNecIdbAdapterFromPersistence(): Provider {
  return {
    provide: NEC_IDB_ADAPTER,
    useFactory: (persistence: NecPersistenceService): NecIdbAdapter => ({
      name: 'ngrx-entity-crud/persistence',
      isAvailable: () => true,
      listDatabases: async (): Promise<NecIdbDbReport[]> => {
        const sections = await persistence.listSections();
        return sections.map(
          (section): NecIdbDbReport => ({
            name: section.feature,
            version: null,
            stores: [
              {name: 'search', count: section.count},
              {name: 'drafts', count: section.draftCount},
            ],
          })
        );
      },
    }),
    deps: [NecPersistenceService],
  };
}
