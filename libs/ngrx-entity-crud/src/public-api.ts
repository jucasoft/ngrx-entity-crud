export * from './lib/models';
// Contratto dei servizi CRUD: già nella firma delle API pubbliche (es. `createManyCall`), ora
// anche importabile. ng-packagr 20+ pubblica un solo .d.ts per entry point, quindi l'import
// profondo `ngrx-entity-crud/lib/ibase-crud-service` non è più disponibile.
export * from './lib/ibase-crud-service';
export * from './lib/create_adapter';
export * from './lib/effect-create';
export * from './lib/effect-create-many';
export * from './lib/effect-delete';
export * from './lib/effect-delete-many';
export * from './lib/effect-edit';
export * from './lib/effect-edit-many';
export * from './lib/effect-search';
export * from './lib/effect-select';
export * from './lib/base-crud.service';
export * from './lib/base-singular-crud.service';
export * from './lib/base-crud-gql.service';
export * from './lib/actions';
export { getInitialSingleCrudState } from './lib/entity_state';
export { createCrudOns, createSingularCrudOns, evalData } from './lib/reducer';
export { getSingeCrudSelectors } from './lib/state_selectors';
