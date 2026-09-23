/**
 * Secondary entry-point `ngrx-entity-crud/persistence-ui`.
 *
 * Parte UI della persistenza locale, separata da `ngrx-entity-crud/persistence` (parte store) perche'
 * dipende da PrimeNG (`p-button`/`p-tag`) e da `ngrx-entity-crud/devtools` (adapter per
 * `<nec-dashboard>`): uno store che importa solo la parte store non si porta dietro queste dipendenze.
 */

export * from './nec-restore-search.component';
export * from './nec-persistence-idb-adapter';
