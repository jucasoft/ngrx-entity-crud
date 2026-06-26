/**
 * Modelli dei report prodotti dai probe della dashboard (`ngrx-entity-crud/devtools`).
 *
 * Sono volutamente indipendenti dai tipi del main entry-point: i probe leggono lo stato
 * per CONVENZIONE (vedi `EntityCrudBaseState` in `src/lib/models.ts`), non per tipo, così
 * il sotto-modulo `devtools` resta autonomo e agnostico rispetto alla persistenza usata.
 */

// ---------------------------------------------------------------------------
// localStorage / sessionStorage
// ---------------------------------------------------------------------------

export interface NecStorageEntry {
  key: string;
  /** Byte verso la quota (UTF-16): `(key.length + value.length) * 2`. Metrica primaria. */
  bytesUtf16: number;
  /** Byte della serializzazione UTF-8 (`TextEncoder`/`Blob`). Metrica secondaria. */
  bytesUtf8: number;
}

export interface NecStorageReport {
  available: boolean;
  type: 'local' | 'session';
  entries: NecStorageEntry[];
  count: number;
  totalBytesUtf16: number;
  totalBytesUtf8: number;
}

/** Stima quota AGGREGATA per-origine (localStorage + IndexedDB + Cache), non scorporabile. */
export interface NecQuotaEstimate {
  available: boolean;
  usage?: number;
  quota?: number;
  /** Non-standard (solo Chromium): byte per area. Assente su Firefox/Safari. */
  usageDetails?: Record<string, number>;
}

// ---------------------------------------------------------------------------
// IndexedDB (agnostico)
// ---------------------------------------------------------------------------

export interface NecIdbStoreReport {
  name: string;
  /** Numero record (`objectStore.count()`); `null` se non determinabile. */
  count: number | null;
}

export interface NecIdbDbReport {
  name: string;
  version: number | null;
  stores: NecIdbStoreReport[];
  note?: string;
}

export interface NecIdbReport {
  available: boolean;
  /** `false` se non è stato possibile elencare i database (es. Firefox senza nomi forniti). */
  enumerable: boolean;
  /** Nome dell'adapter usato: `'native'`, il nome di un `NecIdbAdapter`, o `null`. */
  adapter: string | null;
  databases: NecIdbDbReport[];
  note?: string;
}

/** Un record di un object store IndexedDB, letto ON-DEMAND per la vista ad albero. */
export interface NecIdbEntry {
  /** Chiave primaria del record, serializzata a stringa. */
  key: string;
  /** Valore grezzo del record; la dashboard lo serializza/maschera prima di mostrarlo. */
  value: unknown;
}

/** Risultato della lettura on-demand dei record di un object store (vista ad albero). */
export interface NecIdbStoreEntries {
  db: string;
  store: string;
  entries: NecIdbEntry[];
  /** Conteggio totale dei record (`count()`); `null` se non determinabile. */
  total: number | null;
  /** `true` se `entries` è troncato rispetto a `total` (raggiunto il `limit`). */
  truncated: boolean;
  note?: string;
}

/**
 * Punto di estensione agnostico: il consumer può fornire un adapter esplicito (via
 * `NEC_IDB_ADAPTER`) per conteggi accurati quando la sua libreria di persistenza nasconde
 * i nomi DB. Quando assente, il probe usa solo le API native.
 */
export interface NecIdbAdapter {
  name: string;
  isAvailable(): boolean;
  listDatabases(): Promise<NecIdbDbReport[]>;
}

// ---------------------------------------------------------------------------
// Store NgRx + lazy
// ---------------------------------------------------------------------------

export type NecSliceKind = 'plural' | 'singular' | 'unknown';

export interface NecStoreSlice {
  key: string;
  kind: NecSliceKind;
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  /** Numero entità (solo slice `plural`). */
  entityCount?: number;
  responsesCount: number;
  /** `true` se la slice contiene dati: entità (`plural`), item (`singular`) o response. */
  hasData: boolean;
}

export type NecRuntimeStatus = 'loaded' | 'lazy-not-loaded' | 'unknown';

export interface NecLazyEntry {
  name: string;
  clazz?: string;
  type?: string;
  verdict?: string;
  isLazyCandidate: boolean;
  lazyRoute?: boolean;
  sections: string[];
  usedByShell: boolean;
  runtimeStatus: NecRuntimeStatus;
}

export interface NecStoreReport {
  slices: NecStoreSlice[];
  loadingNames: string[];
  errors: string[];
  /** Presente solo se è stato fornito un `lazyReportUrl` e il fetch è riuscito. */
  lazy?: NecLazyEntry[];
  /** Timestamp ISO di generazione del `lazy-report.json` (per segnalare snapshot stantii). */
  lazyReportGeneratedAt?: string;
}
