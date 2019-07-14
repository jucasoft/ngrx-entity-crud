import {Injectable} from '@angular/core';
import {Actions, Effect} from '@ngrx/effects';
import {Store} from '@ngrx/store';
import {filter, tap} from 'rxjs/operators';
import * as actions from './actions';
import {ofType, toPayload} from 'ts-action-operators';
import {ActivationEnd, Router} from '@angular/router';
import {Location} from '@angular/common';

@Injectable()
export class RouterEffects {
  @Effect({dispatch: false})
  navigate$ = this.actions$.pipe(
    ofType(actions.RouterGo),
    toPayload(),
    tap(({path, queryParams, extras}) => this.router.navigate(path, {queryParams, ...extras}))
  );
  @Effect({dispatch: false})
  navigateBack$ = this.actions$.pipe(
    ofType(actions.RouterBack),
    tap(() => this.location.back())
  );
  @Effect({dispatch: false})
  navigateForward$ = this.actions$.pipe(
    ofType(actions.RouterForward),
    tap(() => this.location.forward())
  );

  constructor(
    private actions$: Actions,
    private router: Router,
    private location: Location,
    private store: Store<any>
  ) {
    // this.listenToRouter();
  }

  private listenToRouter() {
    this.router.events.pipe(
      filter(event => event instanceof ActivationEnd)
    ).subscribe((event: ActivationEnd) =>
      this.store.dispatch(actions.RouteChange({
        params: {...event.snapshot.params},
        path: event.snapshot.routeConfig.path
      }))
    );
  }
}
