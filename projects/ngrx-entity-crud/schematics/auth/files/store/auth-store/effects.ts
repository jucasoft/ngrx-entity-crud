import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import * as actions from './actions';
import {catchError, switchMap} from 'rxjs/operators';
import {RouterGo} from '@root-store/router-store/actions';
import {AuthService} from './auth.service';
import {afterLoginUri, afterLogoutUri} from './conf';

@Injectable()
export class AuthStoreEffects {
  constructor(private readonly actions$: Actions, private readonly authService: AuthService) {
  }

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.LoginRequest),
      switchMap((payload) => this.authService.login(payload.username, payload.password).pipe(
        switchMap(auth => [
            RouterGo({path: [afterLoginUri]}),
            actions.LoginResult({auth, isLoggedIn: true})
          ]
        ),
        catchError(err => {
          return [actions.LoginError({err})];
        }),
      )),
    )
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.LogoutRequest),
      switchMap((payload) => this.authService.logout().pipe(
        switchMap(user => [
            RouterGo({path: [afterLogoutUri]}),
            actions.LogoutResult()
          ]
        ),
        catchError(err => {
          return [actions.LogoutError()];
        }),
      )),
    )
  );

}
