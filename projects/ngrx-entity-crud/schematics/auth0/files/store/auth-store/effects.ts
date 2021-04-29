import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import * as actions from './actions';
import {switchMap, tap} from 'rxjs/operators';
import {AuthenticationService} from './authentication.service';
import {combineLatest, of} from 'rxjs';
import {RouterGo} from '@root-store/router-store/actions';
import {afterLogoutUri} from './conf';

@Injectable()
export class AuthStoreEffects {
  constructor(private actions$: Actions,
              private authService: AuthenticationService) {
  }

  login$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(actions.LoginRequest),
        tap(() => this.authService.login())
      ),
    {dispatch: false}
  );

  checkAuth$ = createEffect(() =>
    this.actions$.pipe(
      // If an action with the type 'checkAuth' occurs in the actions$ stream...
      ofType(actions.CheckAuth),
      // return an observable including the latest info from 'isLoggedIn' and 'userProfile'
      switchMap(() =>
        combineLatest([this.authService.isLoggedIn$, this.authService.user$])
      ),
      // Take it out and return the appropriate action based on if logged in or not
      switchMap(([isLoggedIn, profile]) => {
        if (isLoggedIn) {
          return of(actions.LoginResult({profile, isLoggedIn}));
        }

        return of(actions.LogoutResult());
      })
    )
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.LogoutRequest),
      tap(() => this.authService.logout()),
      switchMap(() => of(actions.LogoutResult()))
    )
  );

  goToLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.GoToLogin),
      switchMap(() => [RouterGo({path: [afterLogoutUri]})])
    )
  );

}
