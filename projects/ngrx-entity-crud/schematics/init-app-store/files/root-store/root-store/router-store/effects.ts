import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Store} from '@ngrx/store';
import {filter, switchMap, tap} from 'rxjs/operators';
import * as actions from './actions';
import {RouterGoPerformed} from './actions';
import {ActivationEnd, Router} from '@angular/router';
import {Location} from '@angular/common';

@Injectable()
export class RouterEffects {
    constructor(
        private actions$: Actions,
        private router: Router,
        private location: Location,
        private store: Store<any>
    ) {
        // this.listenToRouter();
    }

    @Effect()
    navigate$ = this.actions$.pipe(
        ofType(actions.RouterGo),
        switchMap(({path, queryParams, extras}) => {
            this.router.navigate(path, {queryParams, ...extras});
            return [RouterGoPerformed({path, queryParams, extras})];
        })
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
