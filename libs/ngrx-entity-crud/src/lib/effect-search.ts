import {ofType} from '@ngrx/effects';
import {Actions, ICriteria, OptEffect, OptRequest, Response, SingularActions} from './models';
import {from, MonoTypeOperatorFunction, pipe} from 'rxjs';
import {Action} from '@ngrx/store';
import {catchError, concatMap, map, repeat, switchMap} from 'rxjs/operators';
import {IBaseCrudService} from './ibase-crud-service';

export const searchCall = <T>(service: IBaseCrudService<T>): MonoTypeOperatorFunction<any> => pipe(
  switchMap(payload => service.search(payload).pipe(
    map((response: Response<T[]>) => ({response, payload}))
  ))
);


export const searchResponse = <T>(actions: Actions<T>, optEffect?: OptEffect): MonoTypeOperatorFunction<any> => pipe(
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

export const searchCatchError = <T>(actions: Actions<T>): MonoTypeOperatorFunction<any> => pipe(
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

export const searchRequest = <T>(actions: Actions<T>, service: IBaseCrudService<T>, optEffect?: OptEffect): MonoTypeOperatorFunction<Action> => pipe(
  ofType(actions.SearchRequest),
  searchCall(service),
  searchResponse(actions, optEffect),
  searchCatchError(actions),
  repeat()
);
