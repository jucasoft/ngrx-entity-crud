import {ICriteria, OptRequest, Response} from './models';
import {Observable} from 'rxjs';

export interface IBaseCrudService<T> {

  create(opt: OptRequest<T>): Observable<Response<T>>;

  createMany(opt: OptRequest<T[] | T>): Observable<Response<T[]>>;

  search(value?: ICriteria): Observable<Response<T[]>>;

  select(opt: ICriteria): Observable<Response<T>>;

  update(opt: OptRequest<T>): Observable<Response<T>>;

  updateMany(opt: OptRequest<T[] | T>): Observable<Response<T[]>>;

  delete(opt: OptRequest<T>): Observable<Response<string[]>>;

  deleteMany(opt: OptRequest<T[] | T>): Observable<Response<string[]>>;

}
