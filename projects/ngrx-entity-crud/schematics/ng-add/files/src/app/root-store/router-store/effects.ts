import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {Store} from '@ngrx/store';
import {filter, map, tap} from 'rxjs/operators';
import * as actions from './actions';
import {ActivatedRoute, NavigationStart, Router} from '@angular/router';
import {Location} from '@angular/common';

@Injectable()
export class RouterEffects {

  navigate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.RouterGo),
      tap(({path, extras}) => this.router.navigate(path, extras)),
      map(({extras, data}) => {
        console.log('RouterEffects.()');
        return actions.RouterGoPerformed({primary: data, extras});
      })
    )
  );

  navigatePopUp$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.RouterGoPopUp),
      tap(({path, extras}) => this.router.navigate(path, extras)),
      map(({extras, data}) => {
          console.log('RouterEffects.()');
          return actions.RouterGoPopUpPerformed({popUp: data, extras});
        }
      )
    )
  );

  navigateBack$ = createEffect(() =>
      this.actions$.pipe(
        ofType(actions.RouterBack),
        tap(() => this.location.back())
      ),
    {dispatch: false}
  );

  constructor(
    private actions$: Actions,
    private router: Router,
    private location: Location,
    private route: ActivatedRoute,
    private store: Store<any>
  ) {
    this.listenToRouter();
  }

  private listenToRouter() {
    this.router.events.pipe(
      // navigationTrigger === 'popstate' corrisponde alle azioni per navigare nella history
      // non è possibile distinguere la pressione del tasto back da forward
      // nel reducer cancello eventuali stati futuri, impedendo la possibilità di premere su forward
      // in questo modonavigationTrigger === 'popstate' corrisponde alla pressione del tasto back.
      filter(event => (event as NavigationStart).navigationTrigger === 'popstate'),
      tap(event => {
        this.store.dispatch(actions.RouterPopState());
      })
    ).subscribe();
  }
}
