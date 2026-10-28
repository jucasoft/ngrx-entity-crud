import { Comparer, EntityCrudAdapter, IdSelector } from './models';
import { createEntityAdapter } from '@ngrx/entity';
import { createInitialCrudStateFactory } from './entity_state';
import { createCrudSelectorsFactory } from './state_selectors';
import { createCrudActionsFactory } from './actions';
import { createCrudReducerFactory } from './reducer';

export function createCrudEntityAdapter<T>(options?: {
  selectId?: IdSelector<T>;
  sortComparer?: false | Comparer<T>;
}): EntityCrudAdapter<T>;

export function createCrudEntityAdapter<T>(options?: {
  selectId?: IdSelector<T>;
  sortComparer?: false | Comparer<T>;
}): EntityCrudAdapter<T> {
  // Da @ngrx/entity 20 gli overload richiedono `selectId` (o `T extends {id}`): con le opzioni
  // facoltative di questa API si sceglie quello generico, che a runtime accetta anche
  // `undefined` (default `selectId: e => e.id`). Solo tipi: il codice emesso non cambia.
  const adapter = createEntityAdapter<T>(
    options as { selectId: IdSelector<T>; sortComparer?: false | Comparer<T> }
  );
  const stateFactory = createInitialCrudStateFactory<T>();
  const selectorsFactory = createCrudSelectorsFactory<T>(adapter);
  const actionsFactory = createCrudActionsFactory<T>();
  const reducerFactory = createCrudReducerFactory<T>(adapter);

  return Object.assign(
    {},
    adapter,
    stateFactory,
    selectorsFactory,
    actionsFactory,
    reducerFactory
  );
}
