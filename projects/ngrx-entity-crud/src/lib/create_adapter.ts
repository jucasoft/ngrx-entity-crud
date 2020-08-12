import {EntityCrudAdapter} from './models';
import {createEntityAdapter} from '@ngrx/entity';
import {createInitialCrudStateFactory} from './entity_state';
import {createCrudSelectorsFactory} from './state_selectors';
import {createCrudActionsFactory} from './actions';
import {createCrudReducerFactory} from './reducer';

// per evitare l'importazione
// import {Comparer, EntityAdapter, IdSelector} from '@ngrx/entity/src/models';
// ho copiato i seguenti type
export declare type ComparerStr<T> = (a: T, b: T) => string;
export declare type Comparer<T> = (a: T, b: T) => number;

export declare type IdSelectorStr<T> = (model: T) => string;
export declare type IdSelectorNum<T> = (model: T) => number;
export declare type IdSelector<T> = IdSelectorStr<T> | IdSelectorNum<T>;

export function createCrudEntityAdapter<T>(options?: {
  selectId?: IdSelector<T>;
  sortComparer?: false | Comparer<T>;
}): EntityCrudAdapter<T>;

export function createCrudEntityAdapter<T>(options?: {
  selectId?: IdSelector<T>;
  sortComparer?: false | Comparer<T>;
}): EntityCrudAdapter<T> {

  const adapter = createEntityAdapter<T>(options);
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
