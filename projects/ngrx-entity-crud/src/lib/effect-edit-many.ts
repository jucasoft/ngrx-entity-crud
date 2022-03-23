import {ofType} from '@ngrx/effects';
import {Actions, ICriteria, OptEffect, OptRequest, Response, SingularActions} from './models';
import {from, MonoTypeOperatorFunction, pipe} from 'rxjs';
import {Action} from '@ngrx/store';
import {catchError, concatMap, map, repeat, switchMap} from 'rxjs/operators';
import {IBaseCrudService} from './ibase-crud-service';

export const editManyCall = <T>(service: IBaseCrudService<T>): MonoTypeOperatorFunction<any> => pipe(
  concatMap(payload => service.updateMany((payload as OptRequest<T[]>)).pipe(
    map((response: Response<T>) => ({response, payload}))
  )),
);

export const editManyResponse = <T>(actions: Actions<T>, optEffect?: OptEffect): MonoTypeOperatorFunction<any> => pipe(
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

export const editManyCatchError = <T>(actions: Actions<T>): MonoTypeOperatorFunction<any> => pipe(
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


export const editManyRequest = <T>(actions: Actions<T>, service: IBaseCrudService<T>, optEffect?: OptEffect): MonoTypeOperatorFunction<any> => pipe(
  ofType(actions.EditManyRequest),
  editManyCall(service),
  editManyResponse(actions, optEffect),
  editManyCatchError(actions),
  repeat()
);
