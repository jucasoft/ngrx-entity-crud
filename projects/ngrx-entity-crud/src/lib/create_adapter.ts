import {Comparer, EntityAdapter, IdSelector} from '@ngrx/entity/src/models';
import {EntityCrudAdapter} from './models';
import {createEntityAdapter} from '@ngrx/entity';
import {createInitialCrudStateFactory} from './entity_state';
import {createCrudSelectorsFactory} from './state_selectors';
import {createCrudActionsFactory} from './actions';
import {createCrudReducerFactory} from './reducer';

export function createCrudEntityAdapter<T>(options?: {
  selectId?: IdSelector<T>;
  sortComparer?: false | Comparer<T>;
}): EntityCrudAdapter<T>;
export function createCrudEntityAdapter<T>(options?: {
  selectId?: IdSelector<T>;
  sortComparer?: false | Comparer<T>;
}): EntityCrudAdapter<T> {

  const adapter: EntityAdapter<T> = createEntityAdapter<T>(options);
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
