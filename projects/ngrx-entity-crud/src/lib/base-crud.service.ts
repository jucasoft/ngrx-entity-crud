import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';

import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {ICriteria, Response} from './models';

@Injectable({
  providedIn: 'root'
})
export class BaseCrudService<T> {

  protected service = '';
  protected id = 'id';
  private debug: boolean = false;

  constructor(protected http: HttpClient) {
  }

  httpOptions = () => {
    return {
      headers: new HttpHeaders({"Content-Type": "application/json"})
    };
  };

  creates(value: T[]): Observable<Response<T[]>> {
    if (typeof (console) !== 'undefined' && this.debug) {
      console.log('%c BaseCrudService.creates()', 'color: #777777');
      console.log('%c Extended from: ' + this.constructor.name, 'color: #777777');
      console.log.apply(console, arguments);
    }
    return this.http.post<Response<T[]>>(`${this.getUrl()}`, value, this.httpOptions());
  }

  create(value: T, options?: { path: any[] }): Observable<Response<T>> {
    if (typeof (console) !== 'undefined' && this.debug) {
      console.log('%c BaseCrudService.create()', 'color: #777777');
      console.log('%c Extended from: ' + this.constructor.name, 'color: #777777');
      console.log.apply(console, arguments);
    }
    const path = !!options && !!options.path ? options.path : null;
    return this.http.post<Response<T>>(`${this.getUrl(path)}`, value, this.httpOptions());
  }

  /**
   *
   * @param value
   */
  search(value?: ICriteria): Observable<Response<T[]>> {
    console.log('BaseCrudService.search()');
    console.log('Extended from: ' + this.constructor.name);
    console.log.apply(console, arguments);
    if (this.isNewCriteria(value)) {
      const url = value && value.hasOwnProperty('path') && !!value.path ? value.path.join('/') : '';

      let httpOptions = this.httpOptions();

      if (value && value.hasOwnProperty('queryParams') && !!value.queryParams) {
        httpOptions = ({...httpOptions, ...{params: value.queryParams}});
      }

      return this.http.get(this.getUrl() + url, httpOptions).pipe(
        map(this.searchMap),
      ) as Observable<Response<T[]>>;
    }

    if (this.isOldCriteria(value)) {
      debugger;
      this.oldSearch(value);
    }
  }

  private oldSearch(value: ICriteria | string = ''): Observable<Response<T[]>> {

    let url = '';
    if (value !== '' && !value.hasOwnProperty('criteria')) {
      url = !!value['getValue'] ? value['getValue']() : value;
      url = url.indexOf('/') !== 0 ? '/' + url : url;
    }

    let httpOptions = this.httpOptions();
    if (value.hasOwnProperty('criteria')) {
      httpOptions = ({...httpOptions, ...{params: value['criteria']}});
    }

    return this.http.get(this.getUrl() + url, httpOptions).pipe(
      map(this.searchMap),
    ) as Observable<Response<T[]>>;

  }

  private isNewCriteria(criteria): boolean {
    return !criteria || criteria.hasOwnProperty('queryParams') || criteria.hasOwnProperty('path') || criteria.hasOwnProperty('mode');
  }

  isOldCriteria(criteria): boolean {
    return criteria.hasOwnProperty('criteria');
  }

  searchMap = res => res;

  select(value: T): Observable<Response<T>> {
    if (typeof (console) !== 'undefined' && this.debug) {
      console.log('%c BaseCrudService.select()', 'color: #777777');
      console.log('%c Extended from: ' + this.constructor.name, 'color: #777777');
      console.log.apply(console, arguments);
    }

    const id = this.getId(value);

    return this
      .http
      .get<Response<T>>(`${this.getUrl()}/${id}`, this.httpOptions());
  }

  update(value: T, options?: { path: any[] }): Observable<Response<T>> {
    if (typeof (console) !== 'undefined' && this.debug) {
      console.log('%c BaseCrudService.update()', 'color: #777777');
      console.log('%c Extended from: ' + this.constructor.name, 'color: #777777');
      console.log.apply(console, arguments);
    }
    const id = this.getId(value);
    const path = !!options && !!options.path ? options.path : null;
    return this.http.put<Response<T>>(`${this.getUrl(path)}/${id}`, value, this.httpOptions());
  }

  delete(value: T): Observable<Response<string>> {
    if (typeof (console) !== 'undefined' && this.debug) {
      console.log('%c BaseCrudService.delete()', 'color: #777777');
      console.log('%c Extended from: ' + this.constructor.name, 'color: #777777');
      console.log.apply(console, arguments);
    }
    return this
      .http
      .delete<Response<string>>(`${this.getUrl()}/${this.getId(value)}`, this.httpOptions());
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
