/**
 * Secondary entry-point `ngrx-entity-crud/persistence`.
 *
 * Persistenza locale IndexedDB per sezioni CRUD: risultato di ricerca salvato in blocco,
 * bozze salvate una per entità. Tree-shakable: chi non lo importa non lo paga nel bundle.
 * Vedi `ngrx-entity-crud-persistence-plan.md`.
 *
 * Fase 0: solo entry-point + servizio IDB. Nessuna dipendenza dal core (`Restore*` arriva in
 * Fase 1) né da NgRx: `createPersistenceEffects` (Fase 2) e `<nec-restore-search>` (Fase 3)
 * si aggiungono qui in seguito, senza rompere questa superficie.
 */

export * from './models';
export * from './persistence-config.token';
export * from './nec-persistence.service';
export * from './nec-persistence.module';
