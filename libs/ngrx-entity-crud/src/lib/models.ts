import {EntityAdapter, EntityState} from '@ngrx/entity';
import {Action, ActionCreator, MemoizedSelector} from '@ngrx/store';

// COPIATO DA @ngrx/store/src/models
// se viene importato da @ngrx/store/src/models, da errori nei progetti dove viene utilizzato.
export declare interface TypedAction<T extends string> extends Action {
  readonly type: T;
}

// COPIATO DA @ngrx/store/src/models
// se viene importato da @ngrx/entity/src/models, da errori nei progetti dove viene utilizzato.
export interface DictionaryNum<T> {
  [id: number]: T | undefined;
}

export declare abstract class Dictionary<T> implements DictionaryNum<T> {
  [id: string]: T | undefined;
}

// COPIATO DA @ngrx/store/src/models
// se viene importato da @ngrx/entity/src/models, da errori nei progetti dove viene utilizzato.
export type IdSelectorStr<T> = (model: T) => string;
export type IdSelectorNum<T> = (model: T) => number;
// COPIATO DA @ngrx/store/src/models
// se viene importato da @ngrx/entity/src/models, da errori nei progetti dove viene utilizzato.
export type IdSelector<T> = IdSelectorStr<T> | IdSelectorNum<T>;

// per evitare l'importazione
// import {Comparer, EntityAdapter, IdSelector} from '@ngrx/entity/src/models';
// ho copiato i seguenti type
export declare type ComparerStr<T> = (a: T, b: T) => string;
export declare type Comparer<T> = (a: T, b: T) => number;

export interface EntitySelectors<T, V> {
  /**
   * - used to select a group of ids
   * @param (state: V) => string[] | number[]
   */
  selectIds: (state: V) => string[] | number[];
  /**
   * - used to select a group of entities
   * @param (state: V) => Dictionary<T>
   */
  selectEntities: (state: V) => Dictionary<T>;
  /**
   * - used to select all items
   * @param (state: V) => T[]
   */
  selectAll: (state: V) => T[];
  /**
   * - used to select the sum of items
   * @param (state: V) => number
   */
  selectTotal: (state: V) => number;
}

export enum CrudEnum {
  SEARCH = 'Search',
  DELETE = 'Delete',
  CREATE = 'Create',
  EDIT = 'Edit',
  SELECT = 'Select',
  RESET = 'Reset',
}

export enum ActionEnum {
  RESPONSE = 'Response',
  REQUEST = 'Request',
  FAILURE = 'Failure',
  SUCCESS = 'Success',
}

export interface OptRequestBase {
  /**
   * is added to the service route,
   * in some cases it is necessary to invoke a sub-route.
   * if the service was "user" and the sub-route "user/accept":
   * path:["accept"]
   */
  path?: any[];
  /**
   * Dispatched actions in case of error.
   */
  onFault?: Action[];
  /**
   * Dispatched actions in the event of a positive response
   */
  onResult?: Action[];

  /**
   * se true, al completamento della chiamata asincrona, verrà inviata un'azione di tipo Response,
   * contenente le informazioni sulla chiamata e la risposta.
   * In questo modo sarà possibile analizzare l'andamento
   */
  dispatchResponse?: boolean;

  /**
  * used to override the root of the service
  */
  basePath?: string;
}

/**
 * - criteria: ICriteria: criteria di ricerca
 */
export interface ICriteria<QP = any> extends OptRequestBase {
  /**
   *
   * "REFRESH" the store will be deleted before making the remote call, all the elements will be added to the call result.
   *
   */
  mode?: 'REFRESH' | 'upsertMany' | 'upsertMany-updateMany-selected' | 'addAll';

  queryParams?: QP;
}

export interface OptRequest<T = any> extends OptRequestBase {
  mutationParams: T;
  /**
   * options optional
   */
  options?: any;
}

export interface OptResponse<T> {
  actionType: string;
  response: Response<T>;
  request: ICriteria | OptRequest;
}

export interface OptEffect {
  /**
   * per ogni stringa presente nell'attributo, verrà spedita una notifica Response.
   * in questo modo, chi invia la notifica potrà poi filtrare i dati in base alla chiave inviata.
   */
  dispatchResponse?: boolean;
}

export interface Response<T> {
  data: T | any;
  hasError: boolean;
  message: string;
}

export interface FilterMetadata {
  value?: any;
  matchMode?: string;
  renderFunction?: (value: any) => string;
}

export interface CrudBaseState<T> {
  error: string;
  isLoading: boolean;
  isLoaded: boolean;
  lastCriteria: ICriteria;
  responses: OptResponse<T>[];
}

export interface SingleCrudState<T> extends CrudBaseState<T> {
  item: T
}

export interface CrudState<T> extends CrudBaseState<T>, EntityState<T> {
  filters: { [s: string]: FilterMetadata; };
  idsSelected: string[] | number[];
  itemSelected: T;
  idSelected: string | number;
  entitiesSelected: Dictionary<T>;
}

export interface EntityCrudBaseSelectors<T, V> {

  /**
   * - used to select last criteria
   * @param (state: V) => ICriteria
   */
  selectLastCriteria: (state: V) => ICriteria;
  /**
   * - used to select an error
   * @param (state: V) => string
   */
  selectError: (state: V) => string;
  /**
   * - returns true if there are calls in progress
   * @@param (state: V) => boolean
   */
  selectIsLoading: (state: V) => boolean;
  /**
   * - returns true if all calls are completed
   * @@param (state: V) => boolean
   */
  selectIsLoaded: (state: V) => boolean;
  /**
   * - used to select response variable contained in the formula
   * @param (state: V) => OptResponse<T>[]
   */
  selectResponses: (state: V) => OptResponse<T>[];

  /**
   * - used to select selectedItem
   * - populated with action "...SelectedItems({item})",
   * - local clone, does not match the instance in the store
   * @param (state: V) => T
   */
  selectItemSelected: (state: V) => T;
}

export interface EntitySingleCrudSelectors<T, V> extends EntityCrudBaseSelectors<T, V> {
  selectItem: (state: V) => T;
}

export interface EntityCrudSelectors<T, V> extends EntityCrudBaseSelectors<T, V>, EntitySelectors<T, V> {
  /**
   * - used to select selected id
   * - populated with action "...SelectedItem({item})",
   * @param (state: V) => string | number
   */
  selectIdSelected: (state: V) => string | number;
  /**
   * - used to select selected ids
   * - populated with action "...SelectedItems({item})",
   * @param (state: V) => string[] | number[]
   */
  selectIdsSelected: (state: V) => string[] | number[];
  /**
   * - used to select selected item
   * - populated with action "...SelectedItems({item:{id:string ...}})",
   * - same instance of the store (state.entities)
   * - the selector is created with:
   *    - selectIdSelected + selectEntities,
   * @param (state: V) => T
   */
  selectItemSelectedOrigin: (state: V) => T;
  /**
   * - used to select a group of selected items
   * - populated with action "...SelectedItems({item})",
   * - local clone, does not match the instance in the store
   * @param (state: V) => T[]
   */
  selectItemsSelected: (state: V) => T[];

  /**
   * - used to select a group of selected entities
   * - populated with action "...SelectedItems({item})",
   * - local clone, does not match the instance in the store
   * @param (state: V) => Dictionary<T>
   */
  selectEntitiesSelected: (state: V) => Dictionary<T>;
  /**
   * - used to select a group of selected items
   * - populated with action "...SelectedItems({item})",
   * - same instance of the store (state.entities)
   *    - selectIdsSelected + selectEntities,
   * @param (state: V) => T[]
   */
  selectItemsSelectedOrigin: (state: V) => T[];
  /**
   * - used to select filters
   * @param (state: V) => {[s: string]: FilterMetadata;}
   */
  selectFilters: (state: V) => { [s: string]: FilterMetadata; };
  /**
   * - used to select filtered items
   * @param MemoizedSelector<V, T[]>
   */
  selectFilteredItems: MemoizedSelector<V, T[]>;

}


export interface EntityCrudBaseState<T> {
  error: string;
  isLoading: boolean;
  isLoaded: boolean;
  lastCriteria: ICriteria;
  // ogni entità registra l'azione scatenata e la risposta dal server.
  responses: OptResponse<T>[];
}

export interface EntitySingleCrudState<T> extends EntityCrudBaseState<T> {
  item: T;
  itemSelected: T;
}

export interface EntityCrudState<T> extends EntityCrudBaseState<T>, EntityState<T> {
  filters: { [s: string]: FilterMetadata; };
  itemSelected: T;
  idSelected: string | number;

  entitiesSelected: Dictionary<T>;

  idsSelected: string[] | number[];
}

export interface EntityCrudAdapter<T> extends EntityAdapter<T> {
  getInitialCrudState(): EntityCrudState<T>;

  getInitialCrudState<S extends object>(state: S): EntityCrudState<T> & S;

  getCrudSelectors<V>(selectState: (state: V) => EntityCrudState<T>): EntityCrudSelectors<T, V>;

  createCrudActions(name: string): Actions<T>;

  // todo modificare la firma del metodo, tipizzare Actions<any>
  createCrudReducer<S>(initialState: S, actions: Actions<any>);
}

interface PropsSearchSuccess<T> {
  items: T;
  request: ICriteria;
}

export interface SingularActions<T> {
  // azione dispacciata dall'effect se:
  // OptRequestBase.dispatchResponse === true
  // OptEffect.dispatchResponse === true
  Response: ActionCreator<string, (props: OptResponse<T | T[]>) => OptResponse<T | T[]> & TypedAction<string>>;
  ResetResponses: ActionCreator<string, () => { type: string; }>;

  /**
   *  - action used to execute a request to select an item
   * @example store.dispatch(actions.SelectRequest(payload));
   * @param item: T
   * @param path?: any[]
   * @param onFault?: Action[]
   * @param onResult?: Action[]
   * @param dispatchResponse?: boolean
   */
  SelectRequest: ActionCreator<string, (props: ICriteria) => ICriteria & TypedAction<string>>;
  SelectFailure: ActionCreator<string, (props: { error: string; }) => { error: string; } & TypedAction<string>>;
  SelectSuccess: ActionCreator<string, (props: { item: T, request: OptRequest }) => { item: T, request: OptRequest } & TypedAction<string>>;


  /**
   *  - action used to execute a request to modify an item
   * @example store.dispatch(actions.EditRequest(payload));
   * @param item: T
   * @param path?: any[]
   * @param onFault?: Action[]
   * @param onResult?: Action[]
   * @param dispatchResponse?: boolean
   */
  EditRequest: ActionCreator<string, (props: OptRequest) => OptRequest & TypedAction<string>>;
  EditFailure: ActionCreator<string, (props: { error: string; }) => { error: string; } & TypedAction<string>>;
  EditSuccess: ActionCreator<string, (props: { item: T, request: OptRequest }) => { item: T, request: OptRequest } & TypedAction<string>>;

  /**
   * - action used to execute a store reset
   * @example store.dispatch(actions.Reset());
   * @param type: string
   */
  Reset: ActionCreator<string, () => { type: string; }>;

  /**
   * - action used to modify an item on the store
   * @example store.dispatch(actions.Edit(payload));
   * @param item: T
   */
  Edit: ActionCreator<string, (props: { item: T; }) => { item: T; } & TypedAction<string>>;

  /**
   * - action used to identify a single item to select
   * @example store.dispatch(actions.SelectItem(payload));
   * @param item: T
   */
  SelectItem: ActionCreator<string, (props: { item: T; }) => { item: T; } & TypedAction<string>>;

}

export interface Actions<T> extends SingularActions<T> {

  /**
   * - action used to execute asynchronous researches
   * @example StoreActions.SearchRequest({queryParams: {}})
   * - mode?: 'REFRESH': se viene passato il valore REFRESH, il dato presente nello store viene cancellato prima di eseguire la chiamata,
   *        altrimenti il dato verrà sostituito al result della chiamata
   * @param mode?: 'REFRESH' | 'upsertMany' | 'addAll'
   * @param queryParams?: any
   * @param path?: any[]
   * @param onFault?: Action[]
   * @param onResult?: Action[]
   * @param dispatchResponse?: boolean
   * @param type: string
   *
   */
  SearchRequest: ActionCreator<string, (props: ICriteria) => ICriteria & TypedAction<string>>;
  SearchFailure: ActionCreator<string, (props: { error: string; }) => { error: string; } & TypedAction<string>>;
  SearchSuccess: ActionCreator<string, (props: { items: T[], request: ICriteria }) => { items: T[], request: ICriteria } & TypedAction<string>>;

  /**
   * - action used to execute a request to remove an item
   * @example const toState: State = featureReducer(state, actions.DeleteRequest(payload));
   * @param item: T
   * @param path?: any[]
   * @param onFault?: Action[]
   * @param onResult?: Action[]
   * @param dispatchResponse?: boolean
   */
  DeleteRequest: ActionCreator<string, (props: OptRequest) => OptRequest & TypedAction<string>>;
  DeleteFailure: ActionCreator<string, (props: { error: string; }) => { error: string; } & TypedAction<string>>;
  DeleteSuccess: ActionCreator<string, (props: { id: string, request: OptRequest }) => { id: string, request: OptRequest } & TypedAction<string>>;

  /**
   * - action used to execute a request to remove more items
   * @example this.store$.dispatch(<%= clazz %>StoreActions.DeleteManyRequest({items}));
   * @param items: T[]
   * @param path?: any[]
   * @param onFault?: Action[]
   * @param onResult?: Action[]
   * @param dispatchResponse?: boolean
   */
  DeleteManyRequest: ActionCreator<string, (props: OptRequest) => OptRequest & TypedAction<string>>;
  DeleteManyFailure: ActionCreator<string, (props: { error: string; }) => { error: string; } & TypedAction<string>>;
  DeleteManySuccess: ActionCreator<string, (props: { ids: string[], request: OptRequest }) => { ids: string[], request: OptRequest } & TypedAction<string>>;

  /**
   * - action used to execute a request to create a new item
   * @example  store.dispatch(actions.CreateRequest(payload));
   * @param item: T
   * @param path?: any[]
   * @param onFault?: Action[]
   * @param onResult?: Action[]
   * @param dispatchResponse?: boolean
   */
  CreateRequest: ActionCreator<string, (props: OptRequest) => OptRequest & TypedAction<string>>;
  CreateFailure: ActionCreator<string, (props: { error: string; }) => { error: string; } & TypedAction<string>>;
  CreateSuccess: ActionCreator<string, (props: { item: T, request: OptRequest }) => { item: T, request: OptRequest } & TypedAction<string>>;

  /**
   * - action used to execute a request to create more new items
   * @example store.dispatch(actions.CreateManyRequest(payload));
   * @param items: T[]
   * @param path?: any[]
   * @param onFault?: Action[]
   * @param onResult?: Action[]
   * @param dispatchResponse?: boolean
   */
  CreateManyRequest: ActionCreator<string, (props: OptRequest<T[] | T>) => OptRequest<T[] | T> & TypedAction<string>>;
  CreateManyFailure: ActionCreator<string, (props: { error: string; }) => { error: string; } & TypedAction<string>>;
  CreateManySuccess: ActionCreator<string, (props: { items: T[], request: OptRequest }) => { items: T[], request: OptRequest } & TypedAction<string>>;

  /**
   *  - action used to execute a request to modify more items
   * @example store.dispatch(actions.EditManyRequest(payload));
   * @param items: T[]
   * @param path?: any[]
   * @param onFault?: Action[]
   * @param onResult?: Action[]
   * @param dispatchResponse?: boolean
   */
  EditManyRequest: ActionCreator<string, (props: OptRequest) => OptRequest & TypedAction<string>>;
  EditManyFailure: ActionCreator<string, (props: { error: string; }) => { error: string; } & TypedAction<string>>;
  EditManySuccess: ActionCreator<string, (props: { items: T[], request: OptRequest }) => { items: T[], request: OptRequest } & TypedAction<string>>;

  /**
   * - action used to apply some filters on data
   * @example store.dispatch(actions.Filters(payload));
   * @param filters: { [s: string]: FilterMetadata;}
   */
  Filters: ActionCreator<string, (props: { filters: { [s: string]: FilterMetadata; }; }) => { filters: { [s: string]: FilterMetadata; }; } & TypedAction<string>>;

  // selezione locale di + elementi
  /**
   * - action used to identify a group of items to select
   * @example store.dispatch(actions.SelectItems(payload));
   * @param items: T[]
   */
  SelectItems: ActionCreator<string, (props: { items: T[]; }) => { items: T[]; } & TypedAction<string>>;
  // TODO: doc
  AddManySelected: ActionCreator<string, (props: { items: T[]; }) => { items: T[]; } & TypedAction<string>>;
  // TODO: doc
  RemoveManySelected: ActionCreator<string, (props: { ids: string[]; }) => { ids: string[]; } & TypedAction<string>>;
  // TODO: doc
  RemoveAllSelected: ActionCreator<string>;

  /**
   * - action used to create an item on the store
   * @example store.dispatch(actions.Create(payload));
   * @param item: T
   */
  Create: ActionCreator<string, (props: { item: T; }) => { item: T; } & TypedAction<string>>;

  /**
   * - action used to remove an item on the store
   * @example const toState: State = featureReducer(expectState, actions.Delete(payload));
   * @param id: string
   */
  Delete: ActionCreator<string, (props: { id: string; }) => { id: string; } & TypedAction<string>>;

}
