import {ofType} from '@ngrx/effects';
import {Actions, ICriteria, OptEffect, OptRequest, Response, SingularActions} from './models';
import {from, MonoTypeOperatorFunction} from 'rxjs';
import {Action} from '@ngrx/store';
import {catchError, concatMap, map, repeat, switchMap} from 'rxjs/operators';
import {IBaseCrudService} from './ibase-crud-service';

export const searchCall = <T>(service: IBaseCrudService<T>): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
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
          result.push(actions.SearchSuccess({items: response.data, request: payload}));
          // result.push(actions.Filters({filters: {}}));
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

export const searchCatchError = <T>(actions: Actions<T>): MonoTypeOperatorFunction<any> => { // TODO: tipizzare any
  return input$ => input$.pipe(
    catchError((error, caught) => {
        const response = [];
        response.push(actions.SearchFailure({error}));
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

export const searchRequest = <T>(actions: Actions<T>, service: IBaseCrudService<T>, optEffect?: OptEffect): MonoTypeOperatorFunction<Action> => {
  return input$ => input$.pipe(
    ofType(actions.SearchRequest),
    searchCall(service),
    searchResponse(actions, optEffect),
    searchCatchError(actions),
    repeat()
  );
};

/**
 * @deprecated use:
 *
 * actions$.pipe(
 *   searchRequest(actions, service, clazz, optEffect)
 * );
 *
 * or:
 *
 * actions$.pipe(
 *  ofType(actions.SearchRequest),
 *  searchCall(service),
 *  searchResponse(actions, optEffect),
 *  searchCatchError(actions),
 *  repeat()
 *  );
 *
 */

export const searchRequestEffect = <T>(actions$, actions: Actions<T>, service: IBaseCrudService<T>, optEffect?: OptEffect) => actions$.pipe(
  searchRequest(actions, service, optEffect)
);

export const deleteCall = <T>(service: IBaseCrudService<T>): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
    concatMap(payload => service.delete((payload as OptRequest<T>)).pipe(
      map((response: Response<string>) => ({response, payload}))
    )),
  );
};

export const deleteResponse = <T>(actions: Actions<T>, clazz: any, optEffect?: OptEffect): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
    concatMap(({response, payload}) => {
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
          const id = clazz.selectId(payload.mutationParams);
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

export const deleteCatchError = <T>(actions: Actions<T>): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
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

export const deleteRequest = <T>(actions: Actions<T>, service: IBaseCrudService<T>, clazz: any, optEffect?: OptEffect): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
    ofType(actions.DeleteRequest),
    deleteCall(service),
    deleteResponse(actions, clazz, optEffect),
    deleteCatchError(actions),
    repeat()
  );
};

/**
 * @deprecated use:
 *
 * actions$.pipe(
 *   deleteRequest(actions, service, clazz, optEffect)
 * );
 *
 * or:
 *
 * actions$.pipe(
 *  ofType(actions.DeleteRequest),
 *  deleteCall(service),
 *  deleteResponse(actions, clazz, optEffect),
 *  deleteCatchError(actions),
 *  repeat()
 *  );
 *
 */
export const deleteRequestEffect = <T>(actions$, actions: Actions<T>, service: IBaseCrudService<T>, clazz: any, optEffect?: OptEffect) => actions$.pipe(
  deleteRequest(actions, service, clazz, optEffect)
);


export const deleteManyCall = <T>(service: IBaseCrudService<T>): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
    concatMap(payload => service.deleteMany((payload)).pipe(
      map((response: Response<string>) => ({response, payload}))
    )),
  );
};

export const deleteManyResponse = <T>(actions: Actions<T>, clazz: any, optEffect?: OptEffect): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
    concatMap(({response, payload}) => {
        const result = [];
        if (response.hasError) {
          result.push(actions.DeleteManyFailure({error: response.message}));
          if (payload.onFault) {
            result.push(...payload.onFault);
          }
        } else {
          if (!clazz.selectId) {
            throw Error('the selectId method is not present in the managed entity.');
          }
          const ids = (payload as OptRequest<T[]>).mutationParams.map(id => clazz.selectId(id));
          result.push(actions.DeleteManySuccess({ids}));
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

export const deleteManyCatchError = <T>(actions: Actions<T>): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
    catchError((error, caught) => {
        const response = [];
        response.push(actions.DeleteManyFailure({error}));
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

export const deleteManyRequest = <T>(actions: Actions<T>, service: IBaseCrudService<T>, clazz: any, optEffect?: OptEffect): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
    ofType(actions.DeleteManyRequest),
    deleteManyCall(service),
    deleteManyResponse(actions, clazz, optEffect),
    deleteManyCatchError(actions),
    repeat()
  );
};

export const createCall = <T>(service: IBaseCrudService<T>): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
    concatMap(payload => service.create((payload as OptRequest<T>)).pipe(
      map((response: Response<T>) => ({response, payload}))
    ))
  );
};

export const createResponse = <T>(actions: Actions<T>, optEffect?: OptEffect): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
    concatMap(({response, payload}) => {
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
    )
  );
};

export const createCatchError = <T>(actions: Actions<T>): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
    catchError((error, caught) => {
        const response = [];
        response.push(actions.CreateFailure({error}));
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

export const createRequest = <T>(actions: Actions<T>, service: IBaseCrudService<T>, optEffect?: OptEffect): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
    ofType(actions.CreateRequest),
    createCall(service),
    createResponse(actions, optEffect),
    createCatchError(actions),
    repeat()
  );
};

/**
 * @deprecated use:
 *
 * actions$.pipe(
 *   createRequest(actions, service, optEffect)
 * );
 *
 * or:
 *
 * actions$.pipe(
 *  ofType(actions.DeleteRequest),
 *  createCall(service),
 *  createResponse(actions, optEffect),
 *  createCatchError(actions),
 *  repeat()
 *  );
 *
 */
export const createRequestEffect = <T>(actions$, actions: Actions<T>, service: IBaseCrudService<T>, optEffect?: OptEffect) => actions$.pipe(
  createRequest(actions, service, optEffect)
);

export const createManyCall = <T>(service: IBaseCrudService<T>): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
    concatMap(payload => service.createMany((payload as OptRequest<T[]>)).pipe(
      map((response: Response<T[]>) => ({response, payload}))
    ))
  );
};

export const createManyResponse = <T>(actions: Actions<T>, optEffect?: OptEffect): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
    concatMap(({response, payload}) => {
        const result = [];
        if (response.hasError) {
          result.push(actions.CreateManyFailure({error: response.message}));
          if (payload.onFault) {
            result.push(...payload.onFault);
          }
        } else {
          const items = response.data;
          result.push(actions.CreateManySuccess({items}));
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

export const createManyCatchError = <T>(actions: Actions<T>): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
    catchError((error, caught) => {
        const response = [];
        response.push(actions.EditManyFailure({error}));
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

export const createManyRequest = <T>(actions: Actions<T>, service: IBaseCrudService<T>, optEffect?: OptEffect): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
    ofType(actions.CreateManyRequest),
    createManyCall(service),
    createManyResponse(actions, optEffect),
    createManyCatchError(actions),
    repeat()
  );
};


export const editCall = <T>(service: IBaseCrudService<T>): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
    concatMap(payload => service.update((payload as OptRequest<T>)).pipe(
      map((response: Response<T>) => ({response, payload}))
    )),
  );
};

export const editResponse = <T>(actions: SingularActions<T>, optEffect?: OptEffect): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
    concatMap(({response, payload}) => {
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
    )
  );
};

export const editCatchError = <T>(actions: SingularActions<T>): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
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

export const editRequest = <T>(actions: Actions<T>, service: IBaseCrudService<T>, optEffect?: OptEffect): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
    ofType(actions.EditRequest),
    editCall(service),
    editResponse(actions, optEffect),
    editCatchError(actions),
    repeat()
  );
};

/**
 * @deprecated use:
 *
 * actions$.pipe(
 *   editRequest(actions, service, optEffect)
 * );
 *
 * or:
 *
 * actions$.pipe(
 *  ofType(actions.EditRequest),
 *  editCall(service),
 *  editResponse(actions, optEffect),
 *  editCatchError(actions),
 *  repeat()
 *  );
 *
 */
export const editRequestEffect = <T>(actions$, actions: Actions<T>, service: IBaseCrudService<T>, optEffect?: OptEffect) => actions$.pipe(
  editRequest(actions, service, optEffect)
);


export const editManyCall = <T>(service: IBaseCrudService<T>): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
    concatMap(payload => service.updateMany((payload as OptRequest<T[]>)).pipe(
      map((response: Response<T>) => ({response, payload}))
    )),
  );
};

export const editManyResponse = <T>(actions: Actions<T>, optEffect?: OptEffect): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
    concatMap(({response, payload}) => {
        const result = [];
        if (response.hasError) {
          result.push(actions.EditManyFailure({error: response.message}));
          if (payload.onFault) {
            result.push(...payload.onFault);
          }
        } else {
          const items = response.data;
          result.push(actions.EditManySuccess({items}));
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

export const editManyCatchError = <T>(actions: Actions<T>): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
    catchError((error, caught) => {
        const response = [];
        response.push(actions.EditManyFailure({error}));
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

export const editManyRequest = <T>(actions: Actions<T>, service: IBaseCrudService<T>, optEffect?: OptEffect): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
    ofType(actions.EditManyRequest),
    editManyCall(service),
    editManyResponse(actions, optEffect),
    editManyCatchError(actions),
    repeat()
  );
};


export const selectCall = <T>(service: IBaseCrudService<T>): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
    concatMap(payload => service.select((payload as ICriteria)).pipe(
      // @ts-ignore
      map((response: Response<T>) => ({response, payload}))
    ))
  );
};

export const selectResponse = <T>(actions: SingularActions<T>, optEffect?: OptEffect): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
    concatMap(({response, payload}) => {
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
    )
  );
};

export const selectCatchError = <T>(actions: SingularActions<T>): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
    catchError((error, caught) => {
        const response = [];
        response.push(actions.SelectFailure({error}));
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

export const selectRequest = <T>(actions: Actions<T>, service: IBaseCrudService<T>, optEffect?: OptEffect): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
    ofType(actions.SelectRequest),
    selectCall(service),
    selectResponse(actions, optEffect),
    selectCatchError(actions),
    repeat()
  );
};

/**
 * @deprecated use:
 *
 * actions$.pipe(
 *   selectRequest(actions, service, clazz, optEffect)
 * );
 *
 * or:
 *
 * actions$.pipe(
 *  ofType(actions.SelectRequest),
 *  selectCall(service),
 *  selectResponse(actions, optEffect),
 *  selectCatchError(actions),
 *  repeat()
 *  );
 *
 */
export const selectRequestEffect = <T>(actions$, actions: Actions<T>, service: IBaseCrudService<T>, optEffect?: OptEffect) => actions$.pipe(
  selectRequest(actions, service, optEffect)
);
