import {ofType} from '@ngrx/effects';
import {Actions, OptEffect, OptRequest, Response, SingularActions} from './models';
import {from, MonoTypeOperatorFunction, pipe} from 'rxjs';
import {Action} from '@ngrx/store';
import {catchError, concatMap, map, repeat} from 'rxjs/operators';
import {IBaseCrudService} from './ibase-crud-service';

export const editCall = <T>(service: IBaseCrudService<T>): MonoTypeOperatorFunction<any> => pipe(
  concatMap(payload => service.update((payload as OptRequest<T>)).pipe(
    map((response: Response<T>) => ({response, payload}))
  )),
);

export const editResponse = <T>(actions: SingularActions<T>, optEffect?: OptEffect): MonoTypeOperatorFunction<any> => pipe(
  concatMap(({response, payload}) => {
      const result = [];
      if (response.hasError) {
        result.push(actions.EditFailure({error: response.message}));
        if (payload.onFault) {
          result.push(...payload.onFault);
        }
      } else {
        const item = response.data;
        result.push(actions.EditSuccess({item, request: payload}));
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


export const editCatchError = <T>(actions: SingularActions<T>): MonoTypeOperatorFunction<any> => pipe(
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


export const editRequest = <T>(actions: Actions<T>, service: IBaseCrudService<T>, optEffect?: OptEffect): MonoTypeOperatorFunction<any> => {// TODO: tipizzare any
  return input$ => input$.pipe(
    ofType(actions.EditRequest),
    editCall(service),
    editResponse(actions, optEffect),
    editCatchError(actions),
    repeat()
  );
};

