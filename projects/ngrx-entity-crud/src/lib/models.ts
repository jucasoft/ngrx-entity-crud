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
  data: T;
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
  itemSelected: T;
  itemsSelected: T[];
  // ogni entità registra l'azione scatenata e la risposta dal server.
  responses: OptResponse<T>[];
}


export interface EntityCrudSelectors<T, V> extends EntitySelectors<T, V> {
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
  // attributo popolato dal result di SelectccRequest
  itemSelected: T;
  itemsSelected: T[];
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

export interface Actions<T> {

  // azione dispacciata dall'effect se:
  // OptRequestBase.dispatchResponse === true
  // OptEffect.dispatchResponse === true
  Response: ActionCreator<string, (props: OptResponse<T>) => OptResponse<T> & TypedAction<string>>;
  ResetResponses: ActionCreator<string, () => { type: string; }>;

  /**
   * criteria: ICriteria: criteria di ricerca
   * mode?: 'REFRESH': se viene passato il valore REFRESH, il dato presente nello store viene cancellato prima di eseguire la chiamata,
   *        altrimenti il dato verrà sostituito al result della chiamata
   */
  SearchRequest: ActionCreator<string, (props: ICriteria) => ICriteria & TypedAction<string>>;
  SearchFailure: ActionCreator<string, (props: { error: string; }) => { error: string; } & TypedAction<string>>;
  SearchSuccess: ActionCreator<string, (props: { items: T[]; }) => { items: T[]; } & TypedAction<string>>;

  DeleteRequest: ActionCreator<string, (props: OptRequest<T>) => OptRequest<T> & TypedAction<string>>;
  DeleteFailure: ActionCreator<string, (props: { error: string; }) => { error: string; } & TypedAction<string>>;
  DeleteSuccess: ActionCreator<string, (props: { id: string; }) => { id: string; } & TypedAction<string>>;

  CreateRequest: ActionCreator<string, (props: OptRequest<T>) => OptRequest<T> & TypedAction<string>>;
  CreateFailure: ActionCreator<string, (props: { error: string; }) => { error: string; } & TypedAction<string>>;
  CreateSuccess: ActionCreator<string, (props: { item: T; }) => { item: T; } & TypedAction<string>>;

  SelectRequest: ActionCreator<string, (props: OptRequest<T>) => OptRequest<T> & TypedAction<string>>;
  SelectFailure: ActionCreator<string, (props: { error: string; }) => { error: string; } & TypedAction<string>>;
  SelectSuccess: ActionCreator<string, (props: { item: T; }) => { item: T; } & TypedAction<string>>;

  EditRequest: ActionCreator<string, (props: OptRequest<T>) => OptRequest<T> & TypedAction<string>>;
  EditFailure: ActionCreator<string, (props: { error: string; }) => { error: string; } & TypedAction<string>>;
  EditSuccess: ActionCreator<string, (props: { item: T; }) => { item: T; } & TypedAction<string>>;

  Reset: ActionCreator<string, () => { type: string; }>;
  Filters: ActionCreator<string, (props: { filters: { [s: string]: FilterMetadata; }; }) => { filters: { [s: string]: FilterMetadata; }; } & TypedAction<string>>;

  // selezione locale di + elementi
  SelectItems: ActionCreator<string, (props: { items: T[]; }) => { items: T[]; } & TypedAction<string>>;
  // selezione locale di un elemento
  SelectItem: ActionCreator<string, (props: { item: T; }) => { item: T; } & TypedAction<string>>;

  Edit: ActionCreator<string, (props: { item: T; }) => { item: T; } & TypedAction<string>>;
  Create: ActionCreator<string, (props: { item: T; }) => { item: T; } & TypedAction<string>>;
  Delete: ActionCreator<string, (props: { id: string; }) => { id: string; } & TypedAction<string>>;

}
