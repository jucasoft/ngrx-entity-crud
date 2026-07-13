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
  /**
   * TUTTE le chiavi top-level dello stato root, incluse le slice non-CRUD (es. `router`) e
   * quelle escluse da blacklist/whitelist: `slices` è la vista FILTRATA per il pannello store,
   * `mountedKeys` è la verità dello stato root per le correlazioni (es. pannello Tables).
   * Opzionale per retro-compatibilità dei report costruiti a mano nei test dei consumer.
   */
  mountedKeys?: string[];
  /**
   * Conteggio entità per OGNI slice CRUD plural montata, NON filtrato da blacklist/whitelist
   * (stessa regola di `mountedKeys`): è la sorgente della colonna "entities" del pannello
   * Live grids. Opzionale per retro-compatibilità dei report costruiti a mano.
   */
  mountedEntityCounts?: Record<string, number>;
  /** Presente solo se è stato fornito un `lazyReportUrl` e il fetch è riuscito. */
  lazy?: NecLazyEntry[];
  /** Timestamp ISO di generazione del `lazy-report.json` (per segnalare snapshot stantii). */
  lazyReportGeneratedAt?: string;
}

// ---------------------------------------------------------------------------
// Tabelle (inventario statico da `table-report.json` + correlazione runtime)
// ---------------------------------------------------------------------------

/**
 * Stato runtime degli store referenziati da una griglia: `loaded` se tutte le slice sono
 * montate, `partial` se solo alcune, `not-loaded` se nessuna, `no-store` se il componente
 * della griglia non referenzia alcuno store.
 */
export type NecGridRuntimeStatus = 'loaded' | 'partial' | 'not-loaded' | 'no-store';

/** Una griglia censita da `ngrx-entity-crud:table-report` (ag-Grid o PrimeNG `p-table`). */
export interface NecTableGridEntry {
  component: string;
  selector: string | null;
  file: string;
  /** `'ag-grid'` | `'p-table'` (stringa aperta: il report può evolvere). */
  kind: string;
  /** Etichetta di posizione dal report (es. `views/product-browser`, `core/components/log`). */
  where: string;
  section: string | null;
  inlineTemplate: boolean;
  /** Chiavi (dasherizzate) degli store referenziati dal componente della griglia. */
  stores: string[];
  /** Sottoinsieme di `stores` le cui slice risultano montate nello stato root. */
  mountedStores: string[];
  columnsCount: number;
  /** Entry di colonna non analizzabili staticamente (spread/factory), contate dal report. */
  columnsDynamicEntries: number;
  columnsSource: string | null;
  colDefType: string | null;
  /** `field` delle colonne estratte via AST (solo se il report include `columns`). */
  columnFields: string[];
  isOrphan: boolean;
  verdict: string | null;
  /** Correlazione runtime con le slice montate (vedi {@link NecGridRuntimeStatus}). */
  runtimeStatus: NecGridRuntimeStatus;
}

export interface NecTableSummary {
  grids: number;
  agGrid: number;
  pTable: number;
  orphans: number;
  agGridEnterprise: boolean;
}

/** Inventario tabelle prodotto da `table-report --format=json`, arricchito a runtime. */
export interface NecTableReport {
  /** Timestamp ISO di generazione del `table-report.json` (per segnalare snapshot stantii). */
  generatedAt?: string;
  summary?: NecTableSummary;
  grids: NecTableGridEntry[];
}

// ---------------------------------------------------------------------------
// Registry runtime delle griglie (opt-in, vedi NecGridRegistryService)
// ---------------------------------------------------------------------------

/**
 * Sottoinsieme STRUTTURALE delle `GridApi` di ag-Grid usato dal registry: il consumer passa
 * `params.api` in `onGridReady` e il typing combacia per struttura, senza che la libreria
 * dipenda da ag-grid (le istanze non sono enumerabili dall'esterno: serve la registrazione
 * esplicita, stesso principio di `NEC_IDB_ADAPTER`). Tutti i metodi sono opzionali e letti
 * in modo difensivo: con versioni di ag-Grid che non li espongono (o li espongono sulla
 * vecchia `columnApi`) il dato corrispondente risulta `null`, nessun errore.
 */
export interface NecGridHandle {
  getDisplayedRowCount?(): number;
  getSelectedRows?(): unknown[];
  getFilterModel?(): Record<string, unknown> | null;
  getColumnState?(): Array<{colId: string; sort?: 'asc' | 'desc' | null; sortIndex?: number | null}>;
  setFilterModel?(model: null): void;
  deselectAll?(): void;
  autoSizeAllColumns?(): void;
  isDestroyed?(): boolean;
}

/** Metadati opzionali della registrazione: correlano la griglia a slice e componente. */
export interface NecGridHandleMeta {
  /** Chiave della slice NgRx nello stato root (es. `product_browser`): abilita la colonna "entities". */
  store?: string;
  /** Nome del componente che ospita la griglia (solo informativo). */
  component?: string;
}

/** Snapshot di una griglia registrata, letto dal registry a ogni refresh della dashboard. */
export interface NecLiveGridEntry {
  /** Id della registrazione: bersaglio delle azioni (autosize / clear filters / clear selection). */
  id: number;
  key: string;
  store: string | null;
  component: string | null;
  /** Righe attualmente visualizzate (post filtri); `null` se l'handle non lo espone. */
  displayedRows: number | null;
  selectedCount: number | null;
  /**
   * Numero di colonne con un filtro attivo; `null` se il filter model non è leggibile
   * (un ritorno `null` dell'handle vale come "nessun filtro" → `0`).
   */
  filterCount: number | null;
  /**
   * Colonne ordinate, in ordine di `sortIndex`, come `"<colId> <asc|desc>"`;
   * `null` se il column state non è leggibile (diverso da `[]`: nessun sort attivo).
   */
  sortedColumns: string[] | null;
  /** Timestamp ISO della registrazione (`onGridReady`). */
  registeredAt: string;
}
