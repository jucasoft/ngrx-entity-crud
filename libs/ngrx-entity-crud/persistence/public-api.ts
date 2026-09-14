/**
 * Secondary entry-point `ngrx-entity-crud/persistence`.
 *
 * Persistenza locale IndexedDB per sezioni CRUD: risultato di ricerca salvato in blocco,
 * bozze salvate una per entità. Tree-shakable: chi non lo importa non lo paga nel bundle.
 * Vedi `ngrx-entity-crud-persistence-plan.md`.
 *
 * Fase 0-2: entry-point + servizio IDB (`NecPersistenceService`) + effect factory
 * (`createPersistenceEffects`, che DIPENDE dal core per `Actions<T>`/`ICriteria` — a differenza
 * del servizio IDB, che resta agnostico). `<nec-restore-search>` (Fase 3) si aggiunge qui in
 * seguito, senza rompere questa superficie.
 */

export * from './models';
export * from './persistence-config.token';
export * from './nec-persistence.service';
export * from './nec-persistence.module';
export * from './nec-persistence-effects';
