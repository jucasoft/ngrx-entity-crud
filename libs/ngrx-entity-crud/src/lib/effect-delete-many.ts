import {ofType} from '@ngrx/effects';
import {Actions, OptEffect, OptRequest, Response} from './models';
import {from, MonoTypeOperatorFunction, pipe} from 'rxjs';
import {Action} from '@ngrx/store';
import {catchError, concatMap, map, repeat} from 'rxjs/operators';
import {IBaseCrudService} from './ibase-crud-service';

export const deleteManyCall = <T>(service: IBaseCrudService<T>): MonoTypeOperatorFunction<any> => pipe(
  concatMap(payload => service.deleteMany((payload)).pipe(
    map((response: Response<string>) => ({response, payload}))
  )),
);


export const deleteManyResponse = <T>(actions: Actions<T>, clazz: any, optEffect?: OptEffect): MonoTypeOperatorFunction<any> => pipe(
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
        result.push(actions.DeleteManySuccess({ids, request: payload}));
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


export const deleteManyCatchError = <T>(actions: Actions<T>): MonoTypeOperatorFunction<any> => pipe(
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


export const deleteManyRequest = <T>(actions: Actions<T>, service: IBaseCrudService<T>, clazz: any, optEffect?: OptEffect): MonoTypeOperatorFunction<any> => pipe(
  ofType(actions.DeleteManyRequest),
  deleteManyCall(service),
  deleteManyResponse(actions, clazz, optEffect),
  deleteManyCatchError(actions),
  repeat()
);
