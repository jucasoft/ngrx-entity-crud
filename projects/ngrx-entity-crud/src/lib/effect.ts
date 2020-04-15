import {ofType} from '@ngrx/effects';
import {Actions, OptEffect, OptRequest, Response} from './models';
import {from, Observable, of} from 'rxjs';
import {Action} from '@ngrx/store';
import {catchError, map, switchMap} from 'rxjs/operators';
import {BaseCrudService} from './base-crud.service';

export const searchRequestEffect:
  <T>(actions$, actions: Actions<T>, service: BaseCrudService<T>, optEffect?: OptEffect) => Observable<Action> =
  <T>(actions$, actions: Actions<T>, service: BaseCrudService<T>, optEffect?: OptEffect) => actions$.pipe(
    ofType(actions.SearchRequest),
    switchMap(payload => service.search(payload).pipe(
      // @ts-ignore
      map((response: Response<T[]>) => ({response, payload}))
    )),
    switchMap(({response, payload}) => {
        const result: Action[] = [];
        if (response.hasError) {
          result.push(actions.SearchFailure({error: response.message}));
          if (payload.onFault) {
            result.push(...payload.onFault);
          }
        } else {
          result.push(actions.SearchSuccess({items: response.data}));
          result.push(actions.Filters({filters: {}}));
          if (payload.onResult) {
            result.push(...payload.onResult);
          }
        }

        if ((optEffect || {}).dispatchResponse || payload.dispatchResponse) {
          result.push(actions.Response({
            actionType: payload.type,
            request: payload,
            response
          }));
        }

        return result;
      }
    ),
    catchError((error, caught) => {
        const response = [];
        response.push(actions.EditFailure({error}));
        response.push(actions.Response({
          actionType: 'Failure',
          request: null,
          response: {hasError: true, message: error.message, data: null}
        }));
        return from(response);
      }
    ),
  );

export const deleteRequestEffect:
  <T>(actions$, actions: Actions<T>, service: BaseCrudService<T>, clazz: any, optEffect?: OptEffect) => Observable<Action> =
  <T>(actions$, actions: Actions<T>, service: BaseCrudService<T>, clazz: any, optEffect?: OptEffect) => actions$.pipe(
    ofType(actions.DeleteRequest),
    switchMap(payload => service.delete((payload as OptRequest<T>).item).pipe(
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
        } else {
          if (!clazz.selectId) {
            throw Error('the selectId method is not present in the managed entity.');
          }
          const id = clazz.selectId(payload.item);
          result.push(actions.DeleteSuccess({id}));
          if (payload.onResult) {
            result.push(...payload.onResult);
          }
        }

        if ((optEffect || {}).dispatchResponse || payload.dispatchResponse) {
          result.push(actions.Response({
            actionType: payload.type,
            request: payload,
            response
          }));
        }

        return result;
      }
    ),
    catchError((error, caught) => {
        const response = [];
        response.push(actions.EditFailure({error}));
        response.push(actions.Response({
          actionType: 'Failure',
          request: null,
          response: {hasError: true, message: error.message, data: null}
        }));
        return from(response);
      }
    ),
  );

export const createRequestEffect:
  <T>(actions$, actions: Actions<T>, service: BaseCrudService<T>, optEffect?: OptEffect) => Observable<Action> =
  <T>(actions$, actions: Actions<T>, service: BaseCrudService<T>, optEffect?: OptEffect) => actions$.pipe(
    ofType(actions.CreateRequest),
    switchMap(payload => service.create((payload as OptRequest<T>)).pipe(
      // @ts-ignore
      map((response: Response<T>) => ({response, payload}))
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

        if ((optEffect || {}).dispatchResponse || payload.dispatchResponse) {
          result.push(actions.Response({
            actionType: payload.type,
            request: payload,
            response
          }));
        }

        return result;
      }
    ),
    catchError((error, caught) => {
        const response = [];
        response.push(actions.EditFailure({error}));
        response.push(actions.Response({
          actionType: 'Failure',
          request: null,
          response: {hasError: true, message: error.message, data: null}
        }));
        return from(response);
      }
    ),
  );

export const editRequestEffect:
  <T>(actions$, actions: Actions<T>, service: BaseCrudService<T>, optEffect?: OptEffect) => Observable<Action> =
  <T>(actions$, actions: Actions<T>, service: BaseCrudService<T>, optEffect?: OptEffect) => actions$.pipe(
    ofType(actions.EditRequest),
    switchMap(payload => service.update((payload as OptRequest<T>)).pipe(
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
        } else {
          const item = response.data;
          result.push(actions.EditSuccess({item}));
          if (payload.onResult) {
            result.push(...payload.onResult);
          }
        }

        if ((optEffect || {}).dispatchResponse || payload.dispatchResponse) {
          result.push(actions.Response({
            actionType: payload.type,
            request: payload,
            response
          }));
        }

        return result;
      }
    ),
    catchError((error, caught) => {
        const response = [];
        response.push(actions.EditFailure({error}));
        response.push(actions.Response({
          actionType: 'Failure',
          request: null,
          response: {hasError: true, message: error.message, data: null}
        }));
        return from(response);
      }
    ),
  );

export const selectRequestEffect:
  <T>(actions$, actions: Actions<T>, service: BaseCrudService<T>, optEffect?: OptEffect) => Observable<Action> =
  <T>(actions$, actions: Actions<T>, service: BaseCrudService<T>, optEffect?: OptEffect) => actions$.pipe(
    ofType(actions.SelectRequest),
    switchMap(payload => service.select((payload as OptRequest<T>).item).pipe(
      // @ts-ignore
      map((response: Response<T>) => ({response, payload}))
    )),
    switchMap(({response, payload}) => {
        const result = [];
        if (response.hasError) {
          result.push(actions.SelectFailure({error: response.message}));
          if (payload.onFault) {
            result.push(...payload.onFault);
          }
        } else {
          const item = response.data;
          result.push(actions.SelectSuccess({item}));
          if (payload.onResult) {
            result.push(...payload.onResult);
          }
        }

        if ((optEffect || {}).dispatchResponse || payload.dispatchResponse) {
          result.push(actions.Response({
            actionType: payload.type,
            request: payload,
            response
          }));
        }

        return result;
      }
    ),
    catchError((error, caught) => {
        const response = [];
        response.push(actions.EditFailure({error}));
        response.push(actions.Response({
          actionType: 'Failure',
          request: null,
          response: {hasError: true, message: error.message, data: null}
        }));
        return from(response);
      }
    ),
  );
