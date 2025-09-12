import {Injectable} from '@angular/core';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {BaseCrudService} from './base-crud.service';
import {IBaseCrudService} from './ibase-crud-service';
import {ICriteria, Response} from './models';

@Injectable({
  providedIn: 'root'
})
export class BaseSingularCrudService<T> extends BaseCrudService<T> implements IBaseCrudService<T> {


  select(opt: ICriteria): Observable<Response<T>> {
    console.log('BaseSingularCrudService.select()');

    if (typeof (console) !== 'undefined' && this.debug) {
      console.log('BaseCrudService.search()');
      console.log('Extended from: ' + this.constructor.name);
    }
    const url = opt && opt.hasOwnProperty('path') && !!opt.path ? opt.path.join('/') : '';
    let httpOptions = this.httpOptions();

    if (opt && opt.hasOwnProperty('queryParams') && !!opt.queryParams) {
      httpOptions = ({...httpOptions, ...{params: opt.queryParams}});
    }

    console.log('httpOptions', httpOptions);
    console.log('url', url);
    console.log('this.getUrl()', this.getUrl());

    return this.http.get(this.getUrl() + url, httpOptions).pipe(
      map(this.searchMap),
    ) as Observable<Response<T>>;

  }

}
