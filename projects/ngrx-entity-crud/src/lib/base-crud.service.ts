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

  constructor(protected http: HttpClient) {
  }

  httpOptions = () => {
    return {
      headers: new HttpHeaders()
    };
  }

  create(value: T): Observable<Response<T>> {
    console.log('BaseCrudService.create()');
    console.log('Extended from: ' + this.constructor.name);
    console.log.apply(console, arguments);

    const taskRuntime = value;
    return this.http.post<Response<T>>(`${this.getUrl()}`, value, this.httpOptions());
  }

  search(value?: ICriteria): Observable<Response<T>> {
    console.log('BaseCrudService.search()');
    console.log('Extended from: ' + this.constructor.name);
    console.log.apply(console, arguments);

    const url = value && value.hasOwnProperty('path') ? value.path : '';

    let httpOptions = this.httpOptions();

    if (value && value.hasOwnProperty('queryParams')) {
      httpOptions = ({...httpOptions, ...{params: value.queryParams}});
    }

    return this.http.get(this.getUrl() + url, httpOptions).pipe(
      map(this.searchMap),
    ) as Observable<Response<T>>;
  }

  searchMap = res => res;

  select(value: T | string): Observable<Response<T>> {
    console.log('BaseCrudService.select()');
    console.log('Extended from: ' + this.constructor.name);
    console.log.apply(console, arguments);
    const url = typeof value === 'string' ? value : value[this.id];
    return this
      .http
      .get<Response<T>>(`${this.getUrl()}/${url}`, this.httpOptions());
  }

  update(value: T): Observable<Response<T>> {
    console.log('BaseCrudService.update()');
    console.log('Extended from: ' + this.constructor.name);
    console.log.apply(console, arguments);
    return this.create(value);
  }

  delete(value: T): Observable<Response<T>> {
    console.log('BaseCrudService.delete()');
    console.log('Extended from: ' + this.constructor.name);
    console.log.apply(console, arguments);

    return this
      .http
      .delete<Response<T>>(`${this.getUrl()}`, this.httpOptions());
  }

  protected getUrl(): string {
    return this.service;
  }

}
