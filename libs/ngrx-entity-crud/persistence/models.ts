/**
 * Secondary entry-point `ngrx-entity-crud/persistence`.
 *
 * Tipi del layer di persistenza locale (IndexedDB) per sezioni CRUD: risultato di ricerca
 * salvato in blocco, bozze salvate una per entità. Vedi `ngrx-entity-crud-persistence-plan.md`.
 *
 * Agnostico rispetto al core (`src/lib`): nessun import da lì, per restare indipendente e
 * usabile anche prima che `Restore*` esista nel reducer (Fase 0 rispetto a Fase 1 del piano).
 */

export type NecEntityDictionary<T> = { [id: string]: T | undefined };

/**
 * `'on-draft'` (default): il blocco ricerca si scrive solo alla prima bozza, niente prompt Restore
 * su una ricerca senza bozze. `'always'`: torna a scrivere il blocco su ogni `SearchSuccess`, per
 * chi preferisce ritrovare anche i soli risultati della ricerca al riavvio. Preferenza per sezione,
 * scelta dall'utente finale tramite `<nec-restore-search>`, sopravvive a `purgeSection` (vive in un
 * object store separato da `search`/`meta`/`drafts`, vedi `ngrx-entity-crud-persistence-plan.md`).
 */
export type NecSaveMode = 'on-draft' | 'always';

export interface NecAutoRestoreConfig {
  /** Età massima (ms) del blocco salvato oltre la quale il ripristino NON parte da solo. */
  maxAgeMs: number;
  /** Dimensione massima (byte) del blocco oltre la quale il ripristino NON parte da solo. */
  maxBytes?: number;
}

export interface NecPersistenceConfig {
  dbName?: string;
  dbVersion?: number;
  /** Debounce (ms) che la effect factory applica alle scritture delle bozze. */
  debounceMs?: number;
  /** `false` disattiva scritture e letture: ogni operazione diventa un no-op. */
  enabled?: boolean;
  /** Default globale, sovrascrivibile per sezione in `createPersistenceEffects`. Opt-in. */
  autoRestore?: NecAutoRestoreConfig;
}

/** Metadati soltanto: quello che serve al check di freschezza, mai il blob `entities`. */
export interface NecSectionStats {
  feature: string;
  count: number;
  bytes: number;
  draftCount: number;
  at: number;
}

/** Esito del check leggero eseguito alla creazione della sezione (decisioni 11/12 del piano). */
export interface NecSectionCheck {
  stats: NecSectionStats | null;
  autoRestoreTriggered: boolean;
  saveMode: NecSaveMode;
}

export interface NecSearchRecord<T, C = unknown> {
  criteria: C;
  ids: string[];
  entities: NecEntityDictionary<T>;
  count: number;
  bytes: number;
  at: number;
}

export interface NecDraftRecord<T> {
  feature: string;
  id: string;
  item: T;
  at: number;
}

/** Risultato di `readSection`: il blocco di ricerca più le bozze correnti della sezione. */
export interface NecSectionData<T, C = unknown> extends NecSearchRecord<T, C> {
  drafts: NecEntityDictionary<T>;
}
