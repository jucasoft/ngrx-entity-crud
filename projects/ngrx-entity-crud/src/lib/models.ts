import {EntityAdapter, EntityState} from '@ngrx/entity';
import {FilterMetadata} from 'primeng/api';
import {EntitySelectors} from '@ngrx/entity/src/models';
import {MemoizedSelector} from '@ngrx/store';
import {ActionCreator} from 'ts-action';
import {IFilter} from './filter';

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
  queryParams: any;
  path: string;
}

export interface Response<T> {
  data: T[];
  message: { level: string, message: string, detail: string };
}

export interface FilterMetadata {
  value?: any;
  matchMode?: string;
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
  selectFilters: (state: V) => { [s: string]: IFilter; };
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
  SearchRequest: ActionCreator<string, (payload: { criteria: ICriteria; mode?: 'REFRESH' }) => { payload: { criteria: ICriteria; mode?: 'REFRESH' }; type: string; }>;
  SearchFailure: ActionCreator<string, (payload: { error: string; }) => { payload: { error: string; }; type: string; }>;
  SearchSuccess: ActionCreator<string, (payload: { items: T[]; }) => { payload: { items: T[]; }; type: string; }>;

  DeleteRequest: ActionCreator<string, (payload: { item: T; }) => { payload: { item: T; }; type: string; }>;
  DeleteFailure: ActionCreator<string, (payload: { error: string; }) => { payload: { error: string; }; type: string; }>;
  DeleteSuccess: ActionCreator<string, (payload: { id: string; }) => { payload: { id: string; }; type: string; }>;

  CreateRequest: ActionCreator<string, (payload: { item: T | T[]; }) => { payload: { item: T; }; type: string; }>;
  CreateFailure: ActionCreator<string, (payload: { error: string; }) => { payload: { error: string; }; type: string; }>;
  CreateSuccess: ActionCreator<string, (payload: { item: T; }) => { payload: { item: T; }; type: string; }>;

  SelectRequest: ActionCreator<string, (payload: { item: T | T[]; }) => { payload: { item: T; }; type: string; }>;
  SelectFailure: ActionCreator<string, (payload: { error: string; }) => { payload: { error: string; }; type: string; }>;
  SelectSuccess: ActionCreator<string, (payload: { item: T; }) => { payload: { item: T; }; type: string; }>;

  EditRequest: ActionCreator<string, (payload: { item: T; }) => { payload: { item: T; }; type: string; }>;
  EditFailure: ActionCreator<string, (payload: { error: string; }) => { payload: { error: string; }; type: string; }>;
  EditSuccess: ActionCreator<string, (payload: { item: T; }) => { payload: { item: T; }; type: string; }>;

  Reset: ActionCreator<string, () => { type: string; }>;
  Filters: ActionCreator<string, (payload: { filters: { [s: string]: FilterMetadata; }; }) =>
    { payload: { filters: { [s: string]: FilterMetadata; }; }; type: string; }>;

  // selezione locale di + elementi
  SelectItems: ActionCreator<string, (payload: { items: T[]; }) => { payload: { items: T[]; }; type: string; }>;
  // selezione locale di un elemento
  SelectItem: ActionCreator<string, (payload: { item: T; }) => { payload: { item: T; }; type: string; }>;

  Edit: ActionCreator<string, (payload: { item: T; }) => { payload: { item: T; }; type: string; }>;
  Create: ActionCreator<string, (payload: { item: T | T[]; }) => { payload: { item: T; }; type: string; }>;
  Delete: ActionCreator<string, (payload: { item: T; }) => { payload: { item: T; }; type: string; }>;

}
