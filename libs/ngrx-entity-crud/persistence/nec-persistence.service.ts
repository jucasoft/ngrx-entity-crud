import {Inject, Injectable, OnDestroy, Optional} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {
  NecDraftRecord,
  NecEntityDictionary,
  NecPersistenceConfig,
  NecSaveMode,
  NecSearchRecord,
  NecSectionData,
  NecSectionStats,
} from './models';
import {NEC_DEFAULT_PERSISTENCE_CONFIG, NEC_PERSISTENCE_CONFIG} from './persistence-config.token';

const SEARCH_STORE = 'search';
const META_STORE = 'meta';
const DRAFTS_STORE = 'drafts';
const DRAFTS_FEATURE_INDEX = 'feature';
const PREFS_STORE = 'sectionPrefs';
const DEFAULT_SAVE_MODE: NecSaveMode = 'on-draft';

interface NecSectionPrefs {
  feature: string;
  saveMode: NecSaveMode;
}

/**
 * Servizio IndexedDB dedicato alla persistenza locale delle sezioni CRUD.
 *
 * Tre object store: `search`/`meta` a chiave esplicita (= nome feature), `drafts` a chiave
 * composta `[feature, id]` con indice su `feature`. `meta` è separato dal blob `search` apposta:
 * una `get()` su `search[feature]` forza IndexedDB a deserializzare l'intero blob `entities`
 * anche se poi servisse solo `count`, il che vanificherebbe la lettura leggera che il check di
 * freschezza (decisione 11 del piano) richiede al momento della creazione della sezione.
 *
 * Nessuna libreria esterna (`idb-keyval`, `Dexie`, ...): stesso stile difensivo del probe in
 * `devtools/probes/nec-indexeddb-probe.service.ts` (timeout impliciti via Promise, gestione di
 * `onblocked`/`onerror`), ma qui il servizio possiede lo schema e lo crea davvero.
 */
@Injectable({providedIn: 'root'})
export class NecPersistenceService implements OnDestroy {
  private readonly config: NecPersistenceConfig;
  private dbPromise: Promise<IDBDatabase> | null = null;
  private readonly pendingWritesSubject = new BehaviorSubject<number>(0);
  readonly pendingWrites$: Observable<number> = this.pendingWritesSubject.asObservable();
  private beforeUnloadRegistered = false;

  private readonly beforeUnloadHandler = (event: BeforeUnloadEvent): void => {
    event.preventDefault();
    event.returnValue = '';
  };

  constructor(@Optional() @Inject(NEC_PERSISTENCE_CONFIG) config: NecPersistenceConfig | null) {
    this.config = {...NEC_DEFAULT_PERSISTENCE_CONFIG, ...(config ?? {})};
    if (this.isEnabled() && typeof navigator !== 'undefined' && navigator.storage?.persist) {
      navigator.storage.persist().catch(() => {
        /* è una richiesta, non una garanzia: nessuna azione da intraprendere sull'esito */
      });
    }
  }

  ngOnDestroy(): void {
    this.setBeforeUnloadRegistered(false);
    this.pendingWritesSubject.complete();
  }

  // ---- scritture -----------------------------------------------------------

  async writeSearch<T, C = unknown>(
    feature: string,
    criteria: C,
    items: T[],
    selectId: (item: T) => string | number
  ): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }
    const ids: string[] = [];
    const entities: NecEntityDictionary<T> = {};
    for (const item of items) {
      const id = String(selectId(item));
      ids.push(id);
      entities[id] = item;
    }
    const at = Date.now();
    const bytes = this.byteSize({criteria, ids, entities});
    const record: NecSearchRecord<T, C> = {criteria, ids, entities, count: ids.length, bytes, at};
    const meta: NecSectionStats = {feature, count: record.count, bytes, draftCount: 0, at};

    await this.runWrite([SEARCH_STORE, META_STORE], (tx) => {
      tx.objectStore(SEARCH_STORE).put(record, feature);
      tx.objectStore(META_STORE).put(meta, feature);
    });
  }

  async purgeSection(feature: string): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }
    await this.runWrite([SEARCH_STORE, META_STORE, DRAFTS_STORE], (tx) => {
      tx.objectStore(SEARCH_STORE).delete(feature);
      tx.objectStore(META_STORE).delete(feature);
      this.deleteDraftsInTx(tx, feature);
    });
  }

  async putDrafts<T>(feature: string, items: T[], selectId: (item: T) => string | number): Promise<void> {
    if (!this.isEnabled() || !items.length) {
      return;
    }
    await this.runWrite([DRAFTS_STORE, META_STORE], (tx) => {
      const draftsStore = tx.objectStore(DRAFTS_STORE);
      const at = Date.now();
      for (const item of items) {
        const record: NecDraftRecord<T> = {feature, id: String(selectId(item)), item, at};
        draftsStore.put(record);
      }
      this.refreshDraftCount(tx, feature);
    });
  }

  async deleteDrafts(feature: string, ids: Array<string | number>): Promise<void> {
    if (!this.isEnabled() || !ids.length) {
      return;
    }
    await this.runWrite([DRAFTS_STORE, META_STORE], (tx) => {
      const draftsStore = tx.objectStore(DRAFTS_STORE);
      for (const id of ids) {
        draftsStore.delete([feature, String(id)]);
      }
      this.refreshDraftCount(tx, feature);
    });
  }

  async deleteAllDrafts(feature: string): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }
    await this.runWrite([DRAFTS_STORE, META_STORE], (tx) => {
      // Cancella TUTTE le bozze della feature: draftCount diventa 0 per costruzione, senza
      // bisogno di ricontare via index('feature').count(). Ricontare qui sarebbe anche
      // sbagliato: quella query verrebbe accodata (ed eseguita) prima che il cursore di
      // cancellazione, che riusa la stessa request avanzando con `continue()`, abbia
      // effettivamente rimosso i record — l'ordine delle request IndexedDB segue l'ordine di
      // CREAZIONE, non di completamento.
      this.deleteDraftsInTx(tx, feature);
      const metaStore = tx.objectStore(META_STORE);
      const metaRequest = metaStore.get(feature) as IDBRequest<NecSectionStats | undefined>;
      metaRequest.onsuccess = () => {
        const existing = metaRequest.result;
        if (existing) {
          metaStore.put({...existing, draftCount: 0}, feature);
        }
      };
    });
  }

  /**
   * Preferenza per sezione, in un object store separato da `search`/`meta`/`drafts` apposta:
   * `purgeSection` (chiamato su ogni `SearchRequest`, decisione 6 del piano) cancella quei tre, ma
   * la scelta dell'utente sul "come salvare" deve sopravvivere alla ricerca successiva.
   */
  async setSaveMode(feature: string, saveMode: NecSaveMode): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }
    const prefs: NecSectionPrefs = {feature, saveMode};
    await this.runWrite([PREFS_STORE], (tx) => {
      tx.objectStore(PREFS_STORE).put(prefs, feature);
    });
  }

  // ---- letture ---------------------------------------------------------------

  async getSaveMode(feature: string): Promise<NecSaveMode> {
    if (!this.isEnabled()) {
      return DEFAULT_SAVE_MODE;
    }
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([PREFS_STORE], 'readonly');
      const request = tx.objectStore(PREFS_STORE).get(feature) as IDBRequest<NecSectionPrefs | undefined>;
      request.onsuccess = () => resolve(request.result?.saveMode ?? DEFAULT_SAVE_MODE);
      request.onerror = () => reject(request.error ?? new Error('lettura saveMode fallita'));
    });
  }

  /** Lettura leggera: solo i quattro campi di `meta`, mai il blob `entities`/`drafts`. */
  async stats(feature: string): Promise<NecSectionStats | null> {
    if (!this.isEnabled()) {
      return null;
    }
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([META_STORE], 'readonly');
      const request = tx.objectStore(META_STORE).get(feature) as IDBRequest<NecSectionStats | undefined>;
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error ?? new Error('lettura stats fallita'));
    });
  }

  /**
   * Tutte le sezioni con dati locali: un cursore sull'intero object store `meta` (piccolo per
   * costruzione, decisione 4 del piano: una sezione contiene al più l'ultima ricerca). Usato dal
   * pannello sezioni della dashboard (`provideNecIdbAdapterFromPersistence`), mai dal check di
   * freschezza di una singola sezione (quello resta `stats(feature)`, mirato).
   */
  async listSections(): Promise<NecSectionStats[]> {
    if (!this.isEnabled()) {
      return [];
    }
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([META_STORE], 'readonly');
      const sections: NecSectionStats[] = [];
      const cursorRequest = tx.objectStore(META_STORE).openCursor();
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (cursor) {
          sections.push(cursor.value as NecSectionStats);
          cursor.continue();
        }
      };
      tx.oncomplete = () => resolve(sections);
      tx.onerror = () => reject(tx.error ?? new Error('lettura sezioni fallita'));
    });
  }

  /** Lettura completa: blocco di ricerca + bozze, per la traduzione di `RestoreRequest`. */
  async readSection<T, C = unknown>(feature: string): Promise<NecSectionData<T, C> | null> {
    if (!this.isEnabled()) {
      return null;
    }
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([SEARCH_STORE, DRAFTS_STORE], 'readonly');
      const searchRequest = tx.objectStore(SEARCH_STORE).get(feature) as IDBRequest<
        NecSearchRecord<T, C> | undefined
      >;
      const drafts: NecEntityDictionary<T> = {};
      const index = tx.objectStore(DRAFTS_STORE).index(DRAFTS_FEATURE_INDEX);
      const cursorRequest = index.openCursor(IDBKeyRange.only(feature));
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (cursor) {
          const value = cursor.value as NecDraftRecord<T>;
          drafts[value.id] = value.item;
          cursor.continue();
        }
      };
      tx.oncomplete = () => {
        const search = searchRequest.result;
        resolve(search ? {...search, drafts} : null);
      };
      tx.onerror = () => reject(tx.error ?? new Error('lettura sezione fallita'));
    });
  }

  async estimateStorage(): Promise<StorageEstimate | null> {
    if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
      return null;
    }
    try {
      return await navigator.storage.estimate();
    } catch {
      return null;
    }
  }

  // ---- apertura DB -----------------------------------------------------------

  private open(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }
    if (typeof indexedDB === 'undefined') {
      this.dbPromise = Promise.reject(new Error('IndexedDB non disponibile in questo contesto'));
      return this.dbPromise;
    }
    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName as string, this.config.dbVersion);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(SEARCH_STORE)) {
          db.createObjectStore(SEARCH_STORE);
        }
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE);
        }
        if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
          const drafts = db.createObjectStore(DRAFTS_STORE, {keyPath: ['feature', 'id']});
          drafts.createIndex(DRAFTS_FEATURE_INDEX, 'feature');
        }
        if (!db.objectStoreNames.contains(PREFS_STORE)) {
          db.createObjectStore(PREFS_STORE);
        }
      };
      request.onblocked = () =>
        reject(new Error('apertura IndexedDB bloccata (versionchange in un\'altra scheda)'));
      request.onerror = () => reject(request.error ?? new Error('apertura IndexedDB fallita'));
      request.onsuccess = () => resolve(request.result);
    });
    return this.dbPromise;
  }

  // ---- interni -----------------------------------------------------------------

  private deleteDraftsInTx(tx: IDBTransaction, feature: string): void {
    const index = tx.objectStore(DRAFTS_STORE).index(DRAFTS_FEATURE_INDEX);
    const cursorRequest = index.openCursor(IDBKeyRange.only(feature));
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  }

  private refreshDraftCount(tx: IDBTransaction, feature: string): void {
    const index = tx.objectStore(DRAFTS_STORE).index(DRAFTS_FEATURE_INDEX);
    const countRequest = index.count(IDBKeyRange.only(feature));
    countRequest.onsuccess = () => {
      const draftCount = countRequest.result;
      const metaStore = tx.objectStore(META_STORE);
      const metaRequest = metaStore.get(feature) as IDBRequest<NecSectionStats | undefined>;
      metaRequest.onsuccess = () => {
        const existing = metaRequest.result;
        const meta: NecSectionStats = existing
          ? {...existing, draftCount}
          : {feature, count: 0, bytes: 0, draftCount, at: Date.now()};
        metaStore.put(meta, feature);
      };
    };
  }

  private runWrite(stores: string[], work: (tx: IDBTransaction) => void): Promise<void> {
    this.setBeforeUnloadRegistered(true);
    this.pendingWritesSubject.next(this.pendingWritesSubject.value + 1);
    return this.open()
      .then(
        (db) =>
          new Promise<void>((resolve, reject) => {
            const tx = db.transaction(stores, 'readwrite');
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error ?? new Error('scrittura fallita'));
            tx.onabort = () => reject(tx.error ?? new Error('scrittura interrotta'));
            work(tx);
          })
      )
      .finally(() => {
        const next = Math.max(0, this.pendingWritesSubject.value - 1);
        this.pendingWritesSubject.next(next);
        if (next === 0) {
          this.setBeforeUnloadRegistered(false);
        }
      });
  }

  private byteSize(value: unknown): number {
    try {
      return JSON.stringify(value).length;
    } catch {
      return 0;
    }
  }

  private isEnabled(): boolean {
    return this.config.enabled !== false;
  }

  private setBeforeUnloadRegistered(shouldBeRegistered: boolean): void {
    if (typeof window === 'undefined') {
      return;
    }
    if (shouldBeRegistered && !this.beforeUnloadRegistered) {
      window.addEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadRegistered = true;
    } else if (!shouldBeRegistered && this.beforeUnloadRegistered) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadRegistered = false;
    }
  }
}
