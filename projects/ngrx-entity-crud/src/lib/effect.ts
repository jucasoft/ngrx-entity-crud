import {ofType} from '@ngrx/effects';
import {Actions, ICriteria, OptRequest, Response} from './models';
import {Observable, of} from 'rxjs';
import {Action} from '@ngrx/store';
import {catchError, concatMap, map, switchMap} from 'rxjs/operators';
import {BaseCrudService} from './base-crud.service';

export const searchRequestEffect:
  <T>(actions$, actions: Actions<T>, service: BaseCrudService<T>) => Observable<Action> =
  <T>(actions$, actions: Actions<T>, service: BaseCrudService<T>) => actions$.pipe(
    ofType(actions.SearchRequest),
    switchMap(criteria => service.search(criteria).pipe(
      // @ts-ignore
      map((response: Response<T[]>) => ({response, criteria}))
    )),
    switchMap(({response, criteria}: { response: Response<T[]>, criteria: ICriteria }) => {
        const result: Action[] = [];
        if (response.hasError) {
          result.push(actions.SearchFailure({error: response.message}));
          if (criteria.onFault) {
            result.push(...criteria.onFault);
          }
          if (criteria.onFaultFunction) {
            criteria.onFaultFunction();
          }
        } else {
          result.push(actions.SearchSuccess({items: response.data}));
          result.push(actions.Filters({filters: {}}));
          if (criteria.onResult) {
            result.push(...criteria.onResult);
          }
          if (criteria.onResultFunction) {
            criteria.onResultFunction();
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

export const deleteRequestEffect:
  <T>(actions$, actions: Actions<T>, service: BaseCrudService<T>, clazz: any) => Observable<Action> =
  <T>(actions$, actions: Actions<T>, service: BaseCrudService<T>, clazz: any) => actions$.pipe(
    ofType(actions.DeleteRequest),
    concatMap(payload => service.delete((payload as OptRequest<T>).item).pipe(
      // @ts-ignore
      map((response: Response<string>) => ({response, payload}))
    )),
    switchMap(({response, payload}) => {
        const result = [];
        if (response.hasError) {
          result.push(actions.DeleteFailure({error: response.message}));
          if (payload.onFault) {
            result.push(...payload.onFault);
          }
          if (payload.onFaultFunction) {
            payload.onFaultFunction();
          }
        } else {
          if (!!clazz.selectId) {
            throw Error('the selectId method is not present in the managed entity.');
          }
          const id = clazz.selectId(payload.item);
          result.push(actions.DeleteSuccess({id}));
          if (payload.onResult) {
            result.push(...payload.onResult);
          }
          if (payload.onResultFunction) {
            payload.onResultFunction();
          }
        }
        return result;
      }
    ),
    catchError(error =>
      of(actions.DeleteFailure({error}))
    )
  );

export const createRequestEffect:
  <T>(actions$, actions: Actions<T>, service: BaseCrudService<T>) => Observable<Action> =
  <T>(actions$, actions: Actions<T>, service: BaseCrudService<T>) => actions$.pipe(
    ofType(actions.CreateRequest),
    switchMap(payload => service.create((payload as OptRequest<T>).item).pipe(
      // @ts-ignore
      map((response: Response<Hashtag>) => ({response, payload}))
    )),
    switchMap(({response, payload}) => {
        const result = [];
        if (response.hasError) {
          result.push(actions.CreateFailure({error: response.message}));
          if (payload.onFault) {
            result.push(...payload.onFault);
          }
          if (payload.onFaultFunction) {
            payload.onFaultFunction();
          }
        } else {
          const item = response.data;
          result.push(actions.CreateSuccess({item}));
          if (payload.onResult) {
            result.push(...payload.onResult);
          }
          if (payload.onResultFunction) {
            payload.onResultFunction();
          }
        }
        return result;
      }
    ),
    catchError(error =>
      of(actions.CreateFailure({error}))
    )
  );

export const editRequestEffect:
  <T>(actions$, actions: Actions<T>, service: BaseCrudService<T>) => Observable<Action> =
  <T>(actions$, actions: Actions<T>, service: BaseCrudService<T>) => actions$.pipe(
    ofType(actions.EditRequest),
    switchMap(payload => service.update((payload as OptRequest<T>).item).pipe(
      // @ts-ignore
      map((response: Response<T>) => ({response, payload}))
    )),
    switchMap(({response, payload}) => {
        const result = [];
        if (response.hasError) {
          result.push(actions.EditFailure({error: response.message}));
          if (payload.onFault) {
            result.push(...payload.onFault);
          }
          if (payload.onFaultFunction) {
            payload.onFaultFunction();
          }
        } else {
          const item = response.data;
          result.push(actions.EditSuccess({item}));
          if (payload.onResult) {
            result.push(...payload.onResult);
          }
          if (payload.onResultFunction) {
            payload.onResultFunction();
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

export const selectRequestEffect:
  <T>(actions$, actions: Actions<T>, service: BaseCrudService<T>) => Observable<Action> =
  <T>(actions$, actions: Actions<T>, service: BaseCrudService<T>) => actions$.pipe(
    ofType(actions.EditRequest),
    switchMap(payload => service.select((payload as OptRequest<T>).item).pipe(
      // @ts-ignore
      map((response: Response<Field>) => ({response, payload}))
    )),
    switchMap(({response, payload}) => {
        const result = [];

        if (response.hasError) {
          result.push(actions.EditFailure({error: response.message}));
          if (payload.onFault) {
            result.push(...payload.onFault);
          }
          if (payload.onFaultFunction) {
            payload.onFaultFunction();
          }
        } else {
          const item = response.data;
          result.push(actions.EditSuccess({item}));
          if (payload.onResult) {
            result.push(...payload.onResult);
          }
          if (payload.onResultFunction) {
            payload.onResultFunction();
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
