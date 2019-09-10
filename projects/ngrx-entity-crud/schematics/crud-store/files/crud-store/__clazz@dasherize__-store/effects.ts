import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Observable, of} from 'rxjs';
import {Action} from '@ngrx/store';
import {catchError, map, switchMap} from 'rxjs/operators';
import * as actions from './actions';
import {ICriteria, Response} from 'ngrx-entity-crud';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';
import {<%= clazz %>Service} from '@services/<%= dasherize(clazz) %>.service';



@Injectable()
export class <%= clazz %>StoreEffects {
    constructor(private readonly actions$: Actions, private readonly service: <%= clazz %>Service) {
    }

    @Effect()
    searchRequestEffect$: Observable<Action> = this.actions$.pipe(
      ofType(actions.SearchRequest),
      switchMap(criteria => this.service.search(criteria).pipe(
        map((response: Response<<%= clazz %>[]>) => ({response, criteria}))
      )),
      switchMap(({response, criteria}: { response: any, criteria: ICriteria }) => {
          const result: Action[] = [];
          if (response.hasError) {
            result.push(actions.SearchFailure({error: response.message}));
            if (criteria.onFault) {
              result.push(...criteria.onFault);
            }
          } else {
            result.push(actions.SearchSuccess({items: response.data}));
            result.push(actions.Filters({filters: {}}));
            if (criteria.onResult) {
              result.push(...criteria.onResult);
            }
          }
          return result;
        }
      ),
      catchError(error => {
          return of(actions.SearchFailure({error}));
        }
      ),
    );

    @Effect()
    deleteRequestEffect$: Observable<Action> = this.actions$.pipe(
      ofType(actions.DeleteRequest),
      switchMap(payload => this.service.delete(payload.item).pipe(
        map((response: Response<string>) => ({response, payload}))
      )),
      switchMap(({response, payload}) => {
          const result = [];
          if (response.hasError) {
            result.push(actions.DeleteFailure({error: response.message}));
            if (payload.onFault) {
              result.push(...payload.onFault);
            }
          } else {
            const id = <%= clazz %>.selectId(payload.item);
            result.push(actions.DeleteSuccess({id}));
            if (payload.onResult) {
              result.push(...payload.onResult);
            }
          }
          return result;
        }
      ),
      catchError(error =>
        of(actions.DeleteFailure({error}))
      )
    );

    @Effect()
    createRequestEffect$: Observable<Action> = this.actions$.pipe(
      ofType(actions.CreateRequest),
      switchMap(payload => this.service.create(payload.item).pipe(
        map((response: Response<<%= clazz %>>) => ({response, payload}))
      )),
      switchMap(({response, payload}) => {
          const result = [];
          if (response.hasError) {
            result.push(actions.CreateFailure({error: response.message}));
            if (payload.onFault) {
              result.push(...payload.onFault);
            }
          } else {
            const item = response.data;
            result.push(actions.CreateSuccess({item}));
            if (payload.onResult) {
              result.push(...payload.onResult);
            }
          }
          return result;
        }
      ),
      catchError(error =>
        of(actions.CreateFailure({error}))
      )
    );

    @Effect()
    editRequestEffect$: Observable<Action> = this.actions$.pipe(
      ofType(actions.EditRequest),
      switchMap(payload => this.service.update(payload.item).pipe(
        map((response: Response<<%= clazz %>>) => ({response, payload}))
      )),
      switchMap(({response, payload}) => {
          const result = [];
          if (response.hasError) {
            result.push(actions.EditFailure({error: response.message}));
            if (payload.onFault) {
              result.push(...payload.onFault);
            }
          } else {
            const item = response.data;
            result.push(actions.EditSuccess({item}));
            if (payload.onResult) {
              result.push(...payload.onResult);
            }
          }
          return result;
        }
      ),
      catchError(error => {
          return of(actions.EditFailure({error}));
        }
      ),
    );

}
