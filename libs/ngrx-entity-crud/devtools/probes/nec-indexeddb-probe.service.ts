import {Inject, Injectable, Optional} from '@angular/core';
import {NecIdbAdapter, NecIdbDbReport, NecIdbReport, NecIdbStoreReport} from '../models';
import {NEC_IDB_ADAPTER} from '../idb-adapter.token';

/**
 * Riepilogo IndexedDB AGNOSTICO rispetto alla libreria di persistenza.
 *
 * Priorità reale: (1) `NEC_IDB_ADAPTER` esplicito, (2) API native
 * (`indexedDB.databases()` + `open()` + `count()`). NESSUN import di librerie di
 * persistenza. Mostra il numero di record per object store; i byte per-store NON sono
 * misurabili e non vengono promessi (solo la quota aggregata, altrove).
 */
@Injectable({providedIn: 'root'})
export class NecIndexedDbProbeService {
  constructor(@Optional() @Inject(NEC_IDB_ADAPTER) private readonly adapter: NecIdbAdapter | null) {}

  /**
   * @param fallbackDatabaseNames nomi DB da ispezionare quando `indexedDB.databases()` non
   *   è supportato (Firefox / Safari vecchi). Passa qui i nomi noti della tua persistenza.
   * @param openTimeoutMs timeout per ogni `open()` (default 3000ms).
   */
  async read(fallbackDatabaseNames: string[] = [], openTimeoutMs = 3000): Promise<NecIdbReport> {
    // 1) adapter esplicito: path prioritario e agnostico, indipendente dalle API native
    //    (il consumer può fornire conteggi anche dove l'introspezione nativa non basta).
    if (this.adapter && this.adapter.isAvailable()) {
      try {
        const databases = await this.adapter.listDatabases();
        return {available: true, enumerable: true, adapter: this.adapter.name, databases};
      } catch {
        // degrada al path nativo
      }
    }

    // 2) path nativo: richiede l'API IndexedDB del browser
    if (typeof indexedDB === 'undefined') {
      return {
        available: false,
        enumerable: false,
        adapter: null,
        databases: [],
        note: 'IndexedDB non disponibile in questo contesto',
      };
    }

    const names = await this.listDatabaseNames(fallbackDatabaseNames);
    if (!names.length) {
      return {
        available: true,
        enumerable: false,
        adapter: 'native',
        databases: [],
        note:
          'Impossibile elencare i database: indexedDB.databases() non supportato (es. Firefox) ' +
          'e nessun nome fornito. Passa i nomi DB noti via input "idbDatabaseNames".',
      };
    }

    const databases: NecIdbDbReport[] = [];
    for (const name of names) {
      databases.push(await this.inspectDatabase(name, openTimeoutMs));
    }
    return {available: true, enumerable: true, adapter: 'native', databases};
  }

  private async listDatabaseNames(fallback: string[]): Promise<string[]> {
    const idbAny = indexedDB as unknown as {
      databases?: () => Promise<Array<{name?: string}>>;
    };
    if (typeof idbAny.databases === 'function') {
      try {
        const list = await idbAny.databases();
        const names = list.map((d) => d.name).filter((n): n is string => !!n);
        if (names.length) {
          return names;
        }
      } catch {
        // ignora: usa il fallback
      }
    }
    return Array.from(new Set(fallback.filter(Boolean)));
  }

  private inspectDatabase(name: string, timeoutMs: number): Promise<NecIdbDbReport> {
    return new Promise<NecIdbDbReport>((resolve) => {
      let settled = false;
      const done = (report: NecIdbDbReport): void => {
        if (settled) {
          return;
        }
        settled = true;
        resolve(report);
      };

      const timer = setTimeout(
        () => done({name, version: null, stores: [], note: 'timeout apertura DB'}),
        timeoutMs
      );

      let request: IDBOpenDBRequest;
      try {
        request = indexedDB.open(name);
      } catch {
        clearTimeout(timer);
        done({name, version: null, stores: [], note: 'open() fallita'});
        return;
      }

      request.onblocked = () => {
        clearTimeout(timer);
        done({
          name,
          version: null,
          stores: [],
          note: 'apertura bloccata (versionchange in un\'altra scheda)',
        });
      };

      request.onerror = () => {
        clearTimeout(timer);
        done({name, version: null, stores: [], note: 'errore apertura DB (o DB inesistente)'});
      };

      request.onupgradeneeded = (event) => {
        // Il DB non esisteva: NON crearne lo schema. Annulla la transazione di upgrade
        // (provoca onerror e rollback della creazione) per non sporcare l'origine.
        try {
          (event.target as IDBOpenDBRequest).transaction?.abort();
        } catch {
          /* noop */
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        const version = db.version;
        const storeNames = Array.from(db.objectStoreNames);

        if (!storeNames.length) {
          clearTimeout(timer);
          db.close();
          done({name, version, stores: []});
          return;
        }

        let tx: IDBTransaction;
        try {
          tx = db.transaction(storeNames, 'readonly');
        } catch {
          clearTimeout(timer);
          db.close();
          done({
            name,
            version,
            stores: storeNames.map((s): NecIdbStoreReport => ({name: s, count: null})),
          });
          return;
        }

        const stores: NecIdbStoreReport[] = storeNames.map((s) => ({name: s, count: null}));
        let pending = storeNames.length;
        const finalize = (): void => {
          if (--pending === 0) {
            clearTimeout(timer);
            db.close();
            done({name, version, stores});
          }
        };

        storeNames.forEach((s, idx) => {
          try {
            const countReq = tx.objectStore(s).count();
            countReq.onsuccess = () => {
              stores[idx].count = countReq.result;
              finalize();
            };
            countReq.onerror = () => finalize();
          } catch {
            finalize();
          }
        });
      };
    });
  }
}
