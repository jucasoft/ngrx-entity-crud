/**
 * Secondary entry-point `ngrx-entity-crud/devtools`.
 *
 * Dashboard di gestione progetto: riepiloghi runtime di localStorage, IndexedDB (agnostico)
 * e store NgRx + sezioni promovibili al lazy loading. Tree-shakable: chi non lo importa non
 * lo paga nel bundle. Vedi `ngrx-entity-crud-dashboard-plan.md`.
 */

export * from './models';
export * from './idb-adapter.token';
export * from './agnostic-selectors';
export * from './mask';
export * from './probes/nec-local-storage-probe.service';
export * from './probes/nec-indexeddb-probe.service';
export * from './probes/nec-store-probe.service';
export * from './probes/nec-table-report-probe.service';
export * from './nec-dashboard.component';
