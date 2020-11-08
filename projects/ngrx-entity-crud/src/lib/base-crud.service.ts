import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';

import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {ICriteria, OptRequest, Response} from './models';

@Injectable({
  providedIn: 'root'
})
export class BaseCrudService<T> {

  protected service = '';
  protected id = 'id';
  private debug = false;

  debugMode() {
    this.debug = true;
  }

  constructor(protected http: HttpClient) {
  }

  httpOptions = () => {
    return {
      headers: new HttpHeaders({'Content-Type': 'application/json'})
    };
  }

  creates(value: T[]): Observable<Response<T[]>> {
    if (typeof (console) !== 'undefined' && this.debug) {
      console.log('%c BaseCrudService.creates()', 'color: #777777');
      console.log('%c Extended from: ' + this.constructor.name, 'color: #777777');
      console.log.apply(console, arguments);
    }
    return this.http.post<Response<T[]>>(`${this.getUrl()}`, value, this.httpOptions());
  }

  create(opt: OptRequest<T>): Observable<Response<T>> {
    if (typeof (console) !== 'undefined' && this.debug) {
      console.log('%c BaseCrudService.create()', 'color: #777777');
      console.log('%c Extended from: ' + this.constructor.name, 'color: #777777');
      console.log.apply(console, arguments);
    }
    const path = !!opt && !!opt.path ? opt.path : null;
    return this.http.post<Response<T>>(`${this.getUrl(path)}`, opt.item, this.httpOptions());
  }

  search(value?: ICriteria): Observable<Response<T[]>> {
    if (typeof (console) !== 'undefined' && this.debug) {
      console.log('BaseCrudService.search()');
      console.log('Extended from: ' + this.constructor.name);
      console.log.apply(console, arguments);
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
    if (typeof (console) !== 'undefined' && this.debug) {
      console.log('%c BaseCrudService.select()', 'color: #777777');
      console.log('%c Extended from: ' + this.constructor.name, 'color: #777777');
      console.log.apply(console, arguments);
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
      console.log.apply(console, arguments);
    }
    const id = this.getId(opt.item);
    const path = !!opt && !!opt.path ? opt.path : null;
    return this.http.put<Response<T>>(`${this.getUrl(path)}/${id}`, opt.item, this.httpOptions());
  }

  delete(opt: OptRequest<T>): Observable<Response<string>> {
    if (typeof (console) !== 'undefined' && this.debug) {
      console.log('%c BaseCrudService.delete()', 'color: #777777');
      console.log('%c Extended from: ' + this.constructor.name, 'color: #777777');
      console.log.apply(console, arguments);
    }
    const id = this.getId(opt.item);
    const path = !!opt && !!opt.path ? opt.path : null;
    return this.http.delete<Response<string>>(`${this.getUrl(path)}/${id}`, this.httpOptions());
  }

  protected getId = (value) => value[this.id];

  protected getUrl(path?: string[]): string {
    const result = !!path ? `${this.service}/${path.join('/')}` : this.service;
    if (typeof (console) !== 'undefined' && this.debug) {
      console.log('%c BaseCrudService.getUrl(path?:string[]): string', 'color: #777777');
      console.log('%c path: ' + path, 'color: #777777');
      console.log('%c Extended from: ' + this.constructor.name, 'color: #777777');
      console.log('%c result: ' + result, 'color: #777777');
      console.log.apply(console, arguments);
    }
    return result;
  }

}
