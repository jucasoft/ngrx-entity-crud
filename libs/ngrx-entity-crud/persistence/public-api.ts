/**
 * Secondary entry-point `ngrx-entity-crud/persistence`.
 *
 * Persistenza locale IndexedDB per sezioni CRUD: risultato di ricerca salvato in blocco,
 * bozze salvate una per entità. Tree-shakable: chi non lo importa non lo paga nel bundle.
 * Vedi `ngrx-entity-crud-persistence-plan.md`.
 *
 * Fase 0-3: entry-point + servizio IDB (`NecPersistenceService`) + effect factory
 * (`createPersistenceEffects`, che DIPENDE dal core per `Actions<T>`/`ICriteria` — a differenza
 * del servizio IDB, che resta agnostico) + componente (`NecRestoreSearchComponent`, che dipende
 * anche da PrimeNG: `p-button`/`p-tag` soltanto, classi identiche v16↔v19).
 */

export * from './models';
export * from './persistence-config.token';
export * from './nec-persistence.service';
export * from './nec-persistence.module';
export * from './nec-persistence-effects';
export * from './nec-restore-search.component';
