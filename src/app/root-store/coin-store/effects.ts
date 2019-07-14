import {Injectable} from '@angular/core';
import {Actions, Effect} from '@ngrx/effects';
import * as actions from './actions';
import {catchError, switchMap, tap} from 'rxjs/operators';
import {CoinService} from '@services/coin.service';
import {of} from 'rxjs';
import {Action} from '@ngrx/store';
import {Coin} from '@models/vo/coin';
import {Response} from 'ngrx-entity-crud';
import {ofType} from 'ts-action-operators/ofType';
import {toPayload} from 'ts-action-operators/toPayload';

@Injectable()
export class CoinStoreEffects {
  @Effect()
  searchRequestEffect$ = this.actions$.pipe(
    ofType(actions.SearchRequest),
    toPayload(),
    switchMap(payload => this.service.search(payload)),
    switchMap((resp: Response<Coin[]>) => {
      const result: Action[] = [];
      result.push(actions.SearchSuccess({items: resp.data}));
      return result;
    }),
    catchError(error => {
        return of(actions.SearchFailure({error}));
      }
    ),
  );

  @Effect()
  editEffect$ = this.actions$.pipe(
    tap(value => console.log('value', value)),
    ofType(actions.Edit),
    tap(value => console.log('value', value)),
    toPayload(),
    switchMap(payload => {
      const result: Action[] = [];

      return result;
    }),
    tap(value => console.log('value', value)),
  );

  constructor(
    private service: CoinService,
    private readonly actions$: Actions) {
  }

}
