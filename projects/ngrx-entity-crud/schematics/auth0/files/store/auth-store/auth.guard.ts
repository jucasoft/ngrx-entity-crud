import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, CanActivateChild, RouterStateSnapshot} from '@angular/router';
import {select, Store} from '@ngrx/store';
import * as AuthStoreSelectors from './selectors';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';
import * as AuthStoreActions from './actions';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {

  constructor(private readonly store$: Store) {

  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    console.log('AuthGuard.canActivate()');
    return this.store$.pipe(
      select(AuthStoreSelectors.selectIsLoggedIn),
      map(selectIsLoggedIn => {
        if (!selectIsLoggedIn) {
          this.store$.dispatch(AuthStoreActions.GoToLogin());
        }
        return selectIsLoggedIn;
      })
    );
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    console.log('AuthGuard.canActivateChild()');
    return this.store$.pipe(
      select(AuthStoreSelectors.selectIsLoggedIn),
      map(selectIsLoggedIn => {
        if (!selectIsLoggedIn) {
          this.store$.dispatch(AuthStoreActions.GoToLogin());
        }
        return selectIsLoggedIn;
      })
    );
  }

}
