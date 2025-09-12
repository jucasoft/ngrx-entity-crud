import {Injectable} from '@angular/core';
import {ICriteria, OptRequest, Response} from './models';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {IBaseCrudService} from './ibase-crud-service';

@Injectable({
  providedIn: 'root'
})
export class BaseCrudGqlService<T> implements IBaseCrudService<T> {
  public service

  protected apollo: any;

  search(value?: ICriteria): Observable<Response<T[]>> {
    return this.query(value);
  }

  select(opt: OptRequest): Observable<Response<T>> {
    return this.mutate(opt)
  }

  create(opt: OptRequest): Observable<Response<T>> {
    return this.mutate(opt)
  }

  createMany(opt: OptRequest): Observable<Response<T[]>> {
    return this.mutate(opt)
  }

  update(opt: OptRequest): Observable<Response<T>> {
    return this.mutate(opt)
  }

  updateMany(opt: OptRequest): Observable<Response<T[]>> {
    return this.mutate(opt);
  }

  delete(opt: OptRequest): Observable<Response<string>> {
    return this.mutate(opt)
  }

  deleteMany(opt: OptRequest): Observable<Response<string[]>> {
    return this.mutate(opt)
  }

  //todo tolgo tipizzazione  MutationOptions mutateMany(opt: OptRequest<MutationOptions>): Observable<Response<string[]>> {
  mutateMany(opt: OptRequest): Observable<Response<string[]>> {
    return this.apollo.mutate(opt.mutationParams).pipe(
      map((response: any) => {
        debugger
        return ({
          message: '',
          hasError: false,
          data: (response.data as any).allCoins
        })
      })
    )
  }

  //todo tolgo tipizzazione  MutationOptions mutate(opt: OptRequest<MutationOptions>): Observable<Response<string[]>> {
  mutate(opt: OptRequest): Observable<Response<string[]>> {
    return this.apollo.mutate(opt.mutationParams).pipe(
      map((response: any) => {
        debugger
        return ({
          message: '',
          hasError: false,
          data: (response.data as any).allCoins
        })
      })
    )
  }

  //todo tolgo tipizzazione QueryOptions query(value?: ICriteria<QueryOptions>): Observable<Response<T[]>> {
  query(value?: ICriteria): Observable<Response<T[]>> {
    console.log('CoinService.search()');
    return this.apollo
      .query(value.queryParams).pipe(
        map((response: any) => {
          debugger
          return ({
            message: '',
            hasError: false,
            data: (response.data as any).allCoins
          })
        })
      )
  }
}
