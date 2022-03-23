import {ofType} from '@ngrx/effects';
import {Actions, ICriteria, OptEffect, OptRequest, Response, SingularActions} from './models';
import {from, MonoTypeOperatorFunction, pipe} from 'rxjs';
import {Action} from '@ngrx/store';
import {catchError, concatMap, map, repeat, switchMap} from 'rxjs/operators';
import {IBaseCrudService} from './ibase-crud-service';

export const deleteCall = <T>(service: IBaseCrudService<T>): MonoTypeOperatorFunction<any> => pipe(
  concatMap(payload => service.delete((payload as OptRequest<T>)).pipe(
    map((response: Response<string>) => ({response, payload}))
  )),
);


export const deleteResponse = <T>(actions: Actions<T>, clazz: any, optEffect?: OptEffect): MonoTypeOperatorFunction<any> => pipe(
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


export const deleteCatchError = <T>(actions: Actions<T>): MonoTypeOperatorFunction<any> => pipe(
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


export const deleteRequest = <T>(actions: Actions<T>, service: IBaseCrudService<T>, clazz: any, optEffect?: OptEffect): MonoTypeOperatorFunction<any> => pipe(
  ofType(actions.DeleteRequest),
  deleteCall(service),
  deleteResponse(actions, clazz, optEffect),
  deleteCatchError(actions),
  repeat()
);
