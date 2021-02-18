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
  selectIds: (state: V) => string[] | number[];
  selectEntities: (state: V) => Dictionary<T>;
  selectAll: (state: V) => T[];
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
   * per ogni stringa presente nell'attributo, verrà spedita una notifica Response.
   * in questo modo, chi invia la notifica potrà poi filtrare i fati in base alla chiave inviata.
   */
  dispatchResponse?: boolean;
}

export interface ICriteria extends OptRequestBase {
  /**
   *
   * "REFRESH" the store will be deleted before making the remote call, all the elements will be added to the call result.
   *
   */
  mode?: 'REFRESH' | 'upsertMany' | 'addAll';

  queryParams?: any;
}

export interface OptRequest<T> extends OptRequestBase {
  item: T;
}

export interface OptManyRequest<T> extends OptRequestBase {
  items: T[];
}

export interface OptResponse<T> {
  actionType: string;
  response: Response<T>;
  request: ICriteria | OptRequest<T>;
}

export interface OptEffect {
  /**
   * per ogni stringa presente nell'attributo, verrà spedita una notifica Response.
   * in questo modo, chi invia la notifica potrà poi filtrare i fati in base alla chiave inviata.
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

export interface CrudState<T> extends EntityState<T> {
  error: string;
  isLoading: boolean;
  isLoaded: boolean;
  filters: { [s: string]: FilterMetadata; };
  lastCriteria: ICriteria;
  idsSelected: string[] | number[];
  itemSelected: T;
  idSelected: string | number;
  itemsSelected: T[];
  // ogni entità registra l'azione scatenata e la risposta dal server.
  responses: OptResponse<T>[];
}

export interface EntityCrudSelectors<T, V> extends EntitySelectors<T, V> {
  selectIdSelected: (state: V) => string | number;
  selectIdsSelected: (state: V) => string[] | number[];
  selectItemSelected: (state: V) => T;
  selectItemsSelected: (state: V) => T[];
  selectLastCriteria: (state: V) => ICriteria;
  selectError: (state: V) => string;
  selectIsLoading: (state: V) => boolean;
  selectIsLoaded: (state: V) => boolean;
  selectFilters: (state: V) => { [s: string]: FilterMetadata; };
  selectFilteredItems: MemoizedSelector<V, T[]>;
  selectResponses: (state: V) => OptResponse<T>[];
}

export interface EntityCrudState<T> extends EntityState<T> {
  error: string;
  isLoading: boolean;
  isLoaded: boolean;
  filters: { [s: string]: FilterMetadata; };
  lastCriteria: ICriteria;
  /**
   * TODO: questo attributo andra sostituiro da una lista di id, d
   *  a utilizzare come riferimenti agli elementi selezionati.
   * @deprecated utilizzare entitySelected/idSelected
   */
  itemSelected: T;
  idSelected: string | number;
  /**
   * TODO: questo attributo andra sostituiro da una lista di id, d
   *  a utilizzare come riferimenti agli elementi selezionati.
   * @deprecated utilizzare entitySelected/idSelected
   */
  itemsSelected: T[];
  idsSelected: string[] | number[];
  // ogni entità registra l'azione scatenata e la risposta dal server.
  responses: OptResponse<T>[];
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

export interface Actions<T> {

  // azione dispacciata dall'effect se:
  // OptRequestBase.dispatchResponse === true
  // OptEffect.dispatchResponse === true
  Response: ActionCreator<string, (props: OptResponse<T | T[]>) => OptResponse<T | T[]> & TypedAction<string>>;
  ResetResponses: ActionCreator<string, () => { type: string; }>;

  /**
   * - action used to execute asynchronous researches
   * @example StoreActions.SearchRequest({queryParams: {}})
   * - criteria: ICriteria: criteria di ricerca
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
   * @param item: T
   * @param path?: any[]
   * @param onFault?: Action[]
   * @param onResult?: Action[]
   * @param dispatchResponse?: boolean
   */
  DeleteRequest: ActionCreator<string, (props: OptRequest<T>) => OptRequest<T> & TypedAction<string>>;
  DeleteFailure: ActionCreator<string, (props: { error: string; }) => { error: string; } & TypedAction<string>>;
  DeleteSuccess: ActionCreator<string, (props: { id: string; }) => { id: string; } & TypedAction<string>>;

  /**
   * - action used to execute a request to remove more items
   * @param items: T[]
   * @param path?: any[]
   * @param onFault?: Action[]
   * @param onResult?: Action[]
   * @param dispatchResponse?: boolean
   */
  DeleteManyRequest: ActionCreator<string, (props: OptManyRequest<T>) => OptManyRequest<T> & TypedAction<string>>;
  DeleteManyFailure: ActionCreator<string, (props: { error: string; }) => { error: string; } & TypedAction<string>>;
  DeleteManySuccess: ActionCreator<string, (props: { ids: string[]; }) => { ids: string[]; } & TypedAction<string>>;

  /**
   * - action used to execute a request to create a new item
   * @param item: T
   * @param path?: any[]
   * @param onFault?: Action[]
   * @param onResult?: Action[]
   * @param dispatchResponse?: boolean
   */
  CreateRequest: ActionCreator<string, (props: OptRequest<T>) => OptRequest<T> & TypedAction<string>>;
  CreateFailure: ActionCreator<string, (props: { error: string; }) => { error: string; } & TypedAction<string>>;
  CreateSuccess: ActionCreator<string, (props: { item: T; }) => { item: T; } & TypedAction<string>>;

  /**
   * - action used to execute a request to create more new items
   * @param items: T[]
   * @param path?: any[]
   * @param onFault?: Action[]
   * @param onResult?: Action[]
   * @param dispatchResponse?: boolean
   */
  CreateManyRequest: ActionCreator<string, (props: OptManyRequest<T>) => OptManyRequest<T> & TypedAction<string>>;
  CreateManyFailure: ActionCreator<string, (props: { error: string; }) => { error: string; } & TypedAction<string>>;
  CreateManySuccess: ActionCreator<string, (props: { items: T[]; }) => { items: T[]; } & TypedAction<string>>;

  /**
   *  - action used to execute a request to select an item
   * @param item: T
   * @param path?: any[]
   * @param onFault?: Action[]
   * @param onResult?: Action[]
   * @param dispatchResponse?: boolean
   */
  SelectRequest: ActionCreator<string, (props: OptRequest<T>) => OptRequest<T> & TypedAction<string>>;
  SelectFailure: ActionCreator<string, (props: { error: string; }) => { error: string; } & TypedAction<string>>;
  SelectSuccess: ActionCreator<string, (props: { item: T; }) => { item: T; } & TypedAction<string>>;

  /**
   *  - action used to execute a request to modify an item
   * @param item: T
   * @param path?: any[]
   * @param onFault?: Action[]
   * @param onResult?: Action[]
   * @param dispatchResponse?: boolean
   */
  EditRequest: ActionCreator<string, (props: OptRequest<T>) => OptRequest<T> & TypedAction<string>>;
  EditFailure: ActionCreator<string, (props: { error: string; }) => { error: string; } & TypedAction<string>>;
  EditSuccess: ActionCreator<string, (props: { item: T; }) => { item: T; } & TypedAction<string>>;

  /**
   *  - action used to execute a request to modify more items
   * @param items: T[]
   * @param path?: any[]
   * @param onFault?: Action[]
   * @param onResult?: Action[]
   * @param dispatchResponse?: boolean
   */
  EditManyRequest: ActionCreator<string, (props: OptManyRequest<T>) => OptManyRequest<T> & TypedAction<string>>;
  EditManyFailure: ActionCreator<string, (props: { error: string; }) => { error: string; } & TypedAction<string>>;
  EditManySuccess: ActionCreator<string, (props: { items: T[]; }) => { items: T[]; } & TypedAction<string>>;

  /**
   * - action used to execute a store reset
   * @param type: string
   */
  Reset: ActionCreator<string, () => { type: string; }>;

  /**
   * - action used to apply some filters on data
   * @param filters: { [s: string]: FilterMetadata;}
   */
  Filters: ActionCreator<string, (props: { filters: { [s: string]: FilterMetadata; }; }) => { filters: { [s: string]: FilterMetadata; }; } & TypedAction<string>>;

  // selezione locale di + elementi
  /**
   * - action used to identify a group of items to select
   * @param items: T[]
   */
  SelectItems: ActionCreator<string, (props: { items: T[]; }) => { items: T[]; } & TypedAction<string>>;
  // selezione locale di un elemento

  /**
   * - action used to identify a single item to select
   * @param item: T
   */
  SelectItem: ActionCreator<string, (props: { item: T; }) => { item: T; } & TypedAction<string>>;

  /**
   * - action used to modify an item on the store
   * @param item: T
   */
  Edit: ActionCreator<string, (props: { item: T; }) => { item: T; } & TypedAction<string>>;

  /**
   * - action used to create an item on the store
   * @param item: T
   */
  Create: ActionCreator<string, (props: { item: T; }) => { item: T; } & TypedAction<string>>;

  /**
   * - action used to remove an item on the store
   * @param id: string
   */
  Delete: ActionCreator<string, (props: { id: string; }) => { id: string; } & TypedAction<string>>;

}
