import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {map, mergeMap} from 'rxjs/operators';
import {ICriteria, OptManyRequest, OptRequest, Response} from './models';
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

  createMany(opt: OptManyRequest<T>): Observable<Response<T[]>>;

  search(value?: ICriteria): Observable<Response<T[]>>;

  select(opt: OptRequest<T>): Observable<Response<T>>;

  update(opt: OptRequest<T>): Observable<Response<T>>;

  updateMany(opt: OptManyRequest<T>): Observable<Response<T[]>>;

  delete(opt: OptRequest<T>): Observable<Response<string[]>>;

  deleteMany(opt: OptManyRequest<T>): Observable<Response<string[]>>;

  getUrl(path?: string[]): string;
}

@Injectable({
  providedIn: 'root'
})
export class BaseCrudService<T> implements IBaseCrudService<T> {

  service = '';
  id = 'id';
  debug = true;

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
    return this.http.post<Response<T>>(`${this.getUrl(path)}`, opt.item, this.httpOptions());
  }

  createMany(opt: OptManyRequest<T>): Observable<Response<T[]>> {
    const result = opt.items.map(item => {
      const optB: OptRequest<T> = {...opt, item};
      return this.create(optB).pipe(
        map(value => ({...value, data: [value.data]})) // trasformo la singola risposta da {data:T} in {data:T[]}
      );
    });
    return of(...result).pipe(
      mergeMap(value => value)
    );
  }

  search(value?: ICriteria): Observable<Response<T[]>> {
    if (typeof (console) !== 'undefined' && this.debug) {
      console.log('BaseCrudService.search()');
      console.log('Extended from: ' + this.constructor.name);
    }
    const url = value && value.hasOwnProperty('path') && !!value.path ? value.path.join('/') : '';
    console.log('url', url);
    let httpOptions = this.httpOptions();

    if (value && value.hasOwnProperty('queryParams') && !!value.queryParams) {
      httpOptions = ({...httpOptions, ...{params: value.queryParams}});
    }
    console.log('this.getUrl() + url', this.getUrl() + url);
    console.log('httpOptions', httpOptions);
    return this.http.get(this.getUrl() + url, httpOptions).pipe(
      map(this.searchMap),
    ) as Observable<Response<T[]>>;

  }

  searchMap = res => res;

  select(opt: OptRequest<T>): Observable<Response<T>> {
    if (typeof (console) !== 'undefined' && this.debug) {
      console.log('%c BaseCrudService.select()', 'color: #777777');
      console.log('%c Extended from: ' + this.constructor.name, 'color: #777777');
    }

    const id = this.getId(opt.item);
    const path = !!opt && !!opt.path ? opt.path : null;
    return this
      .http
      .get<Response<T>>(`${this.getUrl(path)}/${id}`, this.httpOptions());
  }

  update(opt: OptRequest<T>): Observable<Response<T>> {
    if (typeof (console) !== 'undefined' && this.debug) {
      console.log('%c BaseCrudService.update()', 'color: #777777');
      console.log('%c Extended from: ' + this.constructor.name, 'color: #777777');
    }
    const id = this.getId(opt.item);
    const path = !!opt && !!opt.path ? opt.path : null;
    return this.http.put<Response<T>>(`${this.getUrl(path)}/${id}`, opt.item, this.httpOptions());
  }

  updateMany(opt: OptManyRequest<T>): Observable<Response<T[]>> {
    const result = opt.items.map(item => {
      const optB: OptRequest<T> = {...opt, item};
      return this.update(optB).pipe(
        map(value => ({...value, data: [value.data]})) // trasformo la singola risposta da {data:T} in {data:T[]}
      );
    });
    return of(...result).pipe(
      mergeMap(value => value)
    );
  }

  delete(opt: OptRequest<T>): Observable<Response<string>> {
    if (typeof (console) !== 'undefined' && this.debug) {
      console.log('%c BaseCrudService.delete()', 'color: #777777');
      console.log('%c Extended from: ' + this.constructor.name, 'color: #777777');
    }
    const id = this.getId(opt.item);
    const path = !!opt && !!opt.path ? opt.path : null;
    return this.http.delete<Response<string>>(`${this.getUrl(path)}/${id}`, this.httpOptions());
  }

  deleteMany(opt: OptManyRequest<T>): Observable<Response<string[]>> {
    const result = opt.items.map(item => {
      const optB: OptRequest<T> = {...opt, item};
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
