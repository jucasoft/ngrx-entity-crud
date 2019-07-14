import {EntityAdapter, EntityState} from '@ngrx/entity';
import {EntitySelectors} from '@ngrx/entity/src/models';
import {ActionCreator, MemoizedSelector} from '@ngrx/store';
import {TypedAction} from '@ngrx/store/src/models';

export enum CrudEnum {
  SEARCH = 'Search',
  DELETE = 'Delete',
  CREATE = 'Create',
  EDIT = 'Edit',
  SELECT = 'Select',
}

export enum ActionEnum {
  REQUEST = 'Request',
  FAILURE = 'Failure',
  SUCCESS = 'Success',
}

export interface ICriteria {
  queryParams?: any;
  path?: any[];
  mode?: 'REFRESH';
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

  /**
   * criteria: ICriteria: criteria di ricerca
   * mode?: 'REFRESH': se viene passato il valore REFRESH, il dato presente nello store viene ccancellato prima di eseguire la chiamata,
   *        altrimenti il dato verrà sostituito al result della chiamata
   */
  SearchRequest: ActionCreator<string, (props: ICriteria) => ICriteria & TypedAction<string>>;
  SearchFailure: ActionCreator<string, (props: { error: string; }) => { error: string; } & TypedAction<string>>;
  SearchSuccess: ActionCreator<string, (props: { items: T[]; }) => { items: T[]; } & TypedAction<string>>;

  DeleteRequest: ActionCreator<string, (props: { item: T; options?: { path: any[]; }; }) => { item: T; options?: { path: any[]; }; } & TypedAction<string>>;
  DeleteFailure: ActionCreator<string, (props: { error: string; }) => { error: string; } & TypedAction<string>>;
  DeleteSuccess: ActionCreator<string, (props: { id: string; }) => { id: string; } & TypedAction<string>>;

  CreateRequest: ActionCreator<string, (props: { item: T; options?: { path: any[]; }; }) => { item: T; options?: { path: any[]; }; } & TypedAction<string>>;
  CreateFailure: ActionCreator<string, (props: { error: string; }) => { error: string; } & TypedAction<string>>;
  CreateSuccess: ActionCreator<string, (props: { item: T; }) => { item: T; } & TypedAction<string>>;

  SelectRequest: ActionCreator<string, (props: { item: T; options?: { path: any[]; }; }) => { item: T; options?: { path: any[]; }; } & TypedAction<string>>;
  SelectFailure: ActionCreator<string, (props: { error: string; }) => { error: string; } & TypedAction<string>>;
  SelectSuccess: ActionCreator<string, (props: { item: T; }) => { item: T; } & TypedAction<string>>;

  EditRequest: ActionCreator<string, (props: { item: T; options?: { path: any[]; }; }) => { item: T; options?: { path: any[]; }; } & TypedAction<string>>;
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
  Delete: ActionCreator<string, (props: { item: T; }) => { item: T; } & TypedAction<string>>;

}
