import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {map, mergeMap} from 'rxjs/operators';
import {ICriteria, OptRequest, Response} from './models';
import {Observable, of} from 'rxjs';

export interface IBaseCrudService<T> {
  service: string;
  id: string;
  debug: boolean;
  http: HttpClient;
  httpOptions: () => { headers: HttpHeaders };
  searchMap: (res) => any;
  getId: (value) => any;

  debugMode(): void;

  create(opt: OptRequest<T>): Observable<Response<T>>;

  createMany(opt: OptRequest<T[] | T>): Observable<Response<T[]>>;

  search(value?: ICriteria): Observable<Response<T[]>>;

  select(opt: OptRequest<T>): Observable<Response<T>>;

  update(opt: OptRequest<T>): Observable<Response<T>>;

  updateMany(opt: OptRequest<T[] | T>): Observable<Response<T[]>>;

  delete(opt: OptRequest<T>): Observable<Response<string[]>>;

  deleteMany(opt: OptRequest<T[] | T>): Observable<Response<string[]>>;

  getUrl(path?: string[]): string;
}

@Injectable({
  providedIn: 'root'
})
export class BaseCrudService<T> implements IBaseCrudService<T> {

  service = '';
  id = 'id';
  debug = false;

  debugMode() {
    this.debug = true;
  }

  constructor(public http: HttpClient) {
  }

  httpOptions = () => {
    return {
      headers: new HttpHeaders({'Content-Type': 'application/json'})
    };
  }

  create(opt: OptRequest<T>): Observable<Response<T>> {
    if (typeof (console) !== 'undefined' && this.debug) {
      console.log('%c BaseCrudService.create()', 'color: #777777');
      console.log('%c Extended from: ' + this.constructor.name, 'color: #777777');
    }
    const path = !!opt && !!opt.path ? opt.path : null;
    return this.http.post<Response<T>>(`${this.getUrl(path)}`, opt.mutationParams, this.httpOptions());
  }

  createMany(opt: OptRequest<T[] | T>): Observable<Response<T[]>> {
    this.checkOptRequest(opt);
    const result = (opt.mutationParams as T[]).map(mutationParams => {
      const optB: OptRequest<T> = {...opt, mutationParams};
      return this.create(optB).pipe(
        map(value => ({...value, data: [value.data]})) // trasformo la singola risposta da {data:T} in {data:T[]}
      );
    });
    return of(...result).pipe(
      mergeMap(value => value)
    );
  }

  /**
   * metodo introdotto per la verifica di OptRequest
   * nella nuova versione è stato sostituito opt.item e opt.items con opt.mutationParams
   * in modo da renderlo compatibile come nomenclatura a graphql
   * @param opt
   */
  checkOptRequest(opt: any): boolean {
    if (opt && opt.hasOwnProperty('item') && !!opt.item) {
      throw new Error('Error, in new versions of the library the "items" or "item" attribute have been replaced by "mutationParams". all project attributes must be renamed.')
    }
    if (opt && opt.hasOwnProperty('items') && !!opt.items) {
      throw new Error('Error, in new versions of the library the "items" or "item" attribute have been replaced by "mutationParams". all project attributes must be renamed.')
    }
    return true;
  }

  search(value?: ICriteria): Observable<Response<T[]>> {
    if (typeof (console) !== 'undefined' && this.debug) {
      console.log('BaseCrudService.search()');
      console.log('Extended from: ' + this.constructor.name);
    }
    const url = value && value.hasOwnProperty('path') && !!value.path ? value.path.join('/') : '';
    let httpOptions = this.httpOptions();

    if (value && value.hasOwnProperty('queryParams') && !!value.queryParams) {
      httpOptions = ({...httpOptions, ...{params: value.queryParams}});
    }
    return this.http.get(this.getUrl() + url, httpOptions).pipe(
      map(this.searchMap),
    ) as Observable<Response<T[]>>;

  }

  searchMap = res => res;

  select(opt: OptRequest<T>): Observable<Response<T>> {
    this.checkOptRequest(opt);
    if (typeof (console) !== 'undefined' && this.debug) {
      console.log('%c BaseCrudService.select()', 'color: #777777');
      console.log('%c Extended from: ' + this.constructor.name, 'color: #777777');
    }

    const id = this.getId(opt.mutationParams);
    const path = !!opt && !!opt.path ? opt.path : null;
    return this
      .http
      .get<Response<T>>(`${this.getUrl(path)}/${id}`, this.httpOptions());
  }

  update(opt: OptRequest<T>): Observable<Response<T>> {
    this.checkOptRequest(opt);
    if (typeof (console) !== 'undefined' && this.debug) {
      console.log('%c BaseCrudService.update()', 'color: #777777');
      console.log('%c Extended from: ' + this.constructor.name, 'color: #777777');
    }
    const id = this.getId(opt.mutationParams);
    const path = !!opt && !!opt.path ? opt.path : null;
    return this.http.put<Response<T>>(`${this.getUrl(path)}/${id}`, opt.mutationParams, this.httpOptions());
  }

  updateMany(opt: OptRequest<T[] | T>): Observable<Response<T[]>> {
    this.checkOptRequest(opt);
    const result = (opt.mutationParams as T[]).map(mutationParams => {
      const optB: OptRequest<T> = {...opt, mutationParams};
      return this.update(optB).pipe(
        map(value => ({...value, data: [value.data]})) // trasformo la singola risposta da {data:T} in {data:T[]}
      );
    });
    return of(...result).pipe(
      mergeMap(value => value)
    );
  }

  delete(opt: OptRequest<T>): Observable<Response<string>> {
    this.checkOptRequest(opt);
    if (typeof (console) !== 'undefined' && this.debug) {
      console.log('%c BaseCrudService.delete()', 'color: #777777');
      console.log('%c Extended from: ' + this.constructor.name, 'color: #777777');
    }
    const id = this.getId(opt.mutationParams);
    const path = !!opt && !!opt.path ? opt.path : null;
    return this.http.delete<Response<string>>(`${this.getUrl(path)}/${id}`, this.httpOptions());
  }

  deleteMany(opt: OptRequest<T[] | T>): Observable<Response<string[]>> {
    this.checkOptRequest(opt);
    const result = (opt.mutationParams as T[]).map(mutationParams => {
      const optB: OptRequest<T> = {...opt, mutationParams};
      return this.delete(optB);
    });
    return of(...result).pipe(
      mergeMap(value => value)
    );
  }

  getId = (value) => value[this.id];

  getUrl(path?: string[]): string {
    const result = !!path ? `${this.service}/${path.join('/')}` : this.service;
    if (typeof (console) !== 'undefined' && this.debug) {
      console.log('%c BaseCrudService.getUrl(path?:string[]): string', 'color: #777777');
      console.log('%c path: ' + path, 'color: #777777');
      console.log('%c Extended from: ' + this.constructor.name, 'color: #777777');
      console.log('%c result: ' + result, 'color: #777777');
    }
    return result;
  }

}
