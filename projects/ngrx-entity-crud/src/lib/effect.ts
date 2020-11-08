import {ofType} from '@ngrx/effects';
import {Actions, OptEffect, OptRequest, Response} from './models';
import {from, MonoTypeOperatorFunction, Observable} from 'rxjs';
import {Action} from '@ngrx/store';
import {catchError, map, switchMap} from 'rxjs/operators';
import {BaseCrudService} from './base-crud.service';

// export const editCall = <T>():MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
// return input$=>input$.pipe()
// };
// export const editResponse = <T>():MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
// return input$=>input$.pipe()
// };
// export const editError = <T>():MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
// return input$=>input$.pipe()
// };
// export const editRequest = <T>():MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
// return input$=>input$.pipe()
// };

// export const selectCall = <T>():MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
// return input$=>input$.pipe()
// };
// export const selectResponse = <T>():MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
// return input$=>input$.pipe()
// };
// export const selectError = <T>():MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
// return input$=>input$.pipe()
// };
// export const selectRequest = <T>():MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
// return input$=>input$.pipe()
// };


export const searchCall = <T>(service: BaseCrudService<T>): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
    switchMap(payload => service.search(payload).pipe(
      map((response: Response<T[]>) => ({response, payload}))
    ))
  );
};

export const searchResponse = <T>(actions: Actions<T>, optEffect?: OptEffect): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
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
            const onResults = (payload.onResult as Action[]).map(a => (a as any).newAction ? (a as any).newAction(response, payload) : a);
            result.push(...onResults);
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
    )
  );
};

export const searchError = <T>(actions: Actions<T>): MonoTypeOperatorFunction<any> => { // TODO: tipizzare any
  return input$ => input$.pipe(
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
};

export const searchRequest = <T>(actions: Actions<T>, service: BaseCrudService<T>, optEffect?: OptEffect): MonoTypeOperatorFunction<Action> => {
  return input$ => input$.pipe(
    ofType(actions.SearchRequest),
    searchCall(service),
    searchResponse(actions, optEffect),
    searchError(actions)
  );
};

/**
 * @deprecated use:
 *
 * actions$.pipe(
 *   searchRequest(actions$, actions, service, clazz, optEffect)
 * );
 *
 * or:
 *
 * actions$.pipe(
 *  ofType(actions.SearchRequest),
 *  searchCall(service),
 *  searchResponse(actions, clazz, optEffect),
 *  searchError(actions)
 *  );
 *
 */

export const searchRequestEffect = <T>(actions$, actions: Actions<T>, service: BaseCrudService<T>, optEffect?: OptEffect) => actions$.pipe(
  searchRequest(actions$, service, optEffect)
);

const deleteCall = <T>(service: BaseCrudService<T>): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
    switchMap(payload => service.delete((payload as OptRequest<T>)).pipe(
      map((response: Response<string>) => ({response, payload}))
    )),
  );
};

export const deleteResponse = <T>(actions: Actions<T>, clazz: any, optEffect?: OptEffect): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
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
            const onResults = (payload.onResult as Action[]).map(a => (a as any).newAction ? (a as any).newAction(response, payload) : a);
            result.push(...onResults);
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
  );
};

export const deleteError = <T>(actions: Actions<T>): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
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
    )
  );
};

export const deleteRequest = <T>(actions$, actions: Actions<T>, service: BaseCrudService<T>, clazz: any, optEffect?: OptEffect): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
    ofType(actions.DeleteRequest),
    deleteCall(service),
    deleteResponse(actions, clazz, optEffect),
    deleteError(actions)
  );
};

/**
 * @deprecated use:
 *
 * actions$.pipe(
 *   deleteRequest(actions$, actions, service, clazz, optEffect)
 * );
 *
 * or:
 *
 * actions$.pipe(
 *  ofType(actions.DeleteRequest),
 *  deleteCall(service),
 *  deleteResponse(actions, clazz, optEffect),
 *  deleteError(actions)
 *  );
 *
 */
export const deleteRequestEffect = <T>(actions$, actions: Actions<T>, service: BaseCrudService<T>, clazz: any, optEffect?: OptEffect) => actions$.pipe(
  deleteRequest(actions$, actions, service, clazz, optEffect)
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
            const onResults = (payload.onResult as Action[]).map(a => (a as any).newAction ? (a as any).newAction(response, payload) : a);
            result.push(...onResults);
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
            const onResults = (payload.onResult as Action[]).map(a => (a as any).newAction ? (a as any).newAction(response, payload) : a);
            result.push(...onResults);
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
    switchMap(payload => service.select((payload as OptRequest<T>)).pipe(
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
            const onResults = (payload.onResult as Action[]).map(a => (a as any).newAction ? (a as any).newAction(response, payload) : a);
            result.push(...onResults);
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
