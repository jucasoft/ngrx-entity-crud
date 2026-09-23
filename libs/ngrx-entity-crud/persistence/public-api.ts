/**
 * Secondary entry-point `ngrx-entity-crud/persistence` (parte store: nessuna dipendenza da PrimeNG
 * ne' da `ngrx-entity-crud/devtools`, cosi' ogni store puo' importarlo). Il componente
 * `<nec-restore-search>` e l'adapter per la dashboard stanno in `ngrx-entity-crud/persistence-ui`.
 *
 * Persistenza locale IndexedDB per sezioni CRUD: risultato di ricerca salvato in blocco,
 * bozze salvate una per entità. Tree-shakable: chi non lo importa non lo paga nel bundle.
 * Vedi `ngrx-entity-crud-persistence-plan.md`.
 *
 * Punto d'ingresso consigliato: `createPersistence` (azioni, reducer, selectors ed effects di una
 * sezione creati una sola volta). Le factory di basso livello restano esportate.
 *
 * Revisione dopo Fase 4: `createPersistenceReducer`/`createPersistenceSelectors` sostituiscono il
 * `sectionCheck$` esposto in precedenza dall'Effects — vedi
 * `docs/superpowers/specs/2026-09-17-persistence-section-check-store-design.md`.
 */

export * from './models';
export * from './persistence-config.token';
export * from './nec-persistence.service';
export * from './nec-persistence.module';
export * from './nec-persistence-actions';
export * from './nec-persistence-reducer';
export * from './nec-persistence-selectors';
export * from './nec-persistence-effects';
export * from './create-persistence';
