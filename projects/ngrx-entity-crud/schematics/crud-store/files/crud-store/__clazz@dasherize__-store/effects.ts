import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Observable, of} from 'rxjs';
import {Action} from '@ngrx/store';
import {catchError, switchMap} from 'rxjs/operators';
import * as actions from './actions';
import {Response} from 'ngrx-entity-crud';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';
import {<%= clazz %>Service} from '@services/<%= dasherize(clazz) %>.service';



@Injectable()
export class <%= clazz %>StoreEffects {
    constructor(private readonly actions$: Actions, private readonly service: <%= clazz %>Service) {
    }

    @Effect()
    searchRequestEffect$: Observable<Action> = this.actions$.pipe(
        ofType(actions.SearchRequest),
        switchMap(criteria => this.service.search(criteria)),
        switchMap((response: Response<<%= clazz %>[]>) => {
                const result: Action[] = [];
                if (response.hasError) {
                    result.push(actions.SearchFailure({error: response.message}));
                } else {
                    result.push(actions.SearchSuccess({items: response.data}));
                    result.push(actions.Filters({filters: {}}));
                }
                return result;
            }
        ),
        catchError(error => {
                return of(actions.SearchFailure({error}));
            }
        ),
    );

    @Effect()
    deleteRequestEffect$: Observable<Action> = this.actions$.pipe(
        ofType(actions.CreateRequest),
        switchMap(payload => this.service.delete(payload.item)),
        switchMap((response: Response<string>) => {
                const result = [];
                if (response.hasError) {
                    result.push(actions.DeleteFailure({error: response.message}));
                } else {
                    const item = response.data;
                    result.push(actions.DeleteSuccess({id:item}));
                }
                return result;
            }
        ),
        catchError(error =>
            of(actions.DeleteFailure({error}))
        )
    );

    @Effect()
    createRequestEffect$: Observable<Action> = this.actions$.pipe(
        ofType(actions.CreateRequest),
        switchMap(payload => this.service.create(payload.item)),
        switchMap((response: Response<<%= clazz %>>) => {
                const result = [];
                if (response.hasError) {
                    result.push(actions.CreateFailure({error: response.message}));
                } else {
                    const item = response.data;
                    result.push(actions.CreateSuccess({item}));
                }
                return result;
            }
        ),
        catchError(error =>
            of(actions.CreateFailure({error}))
        )
    );

    @Effect()
    editRequestEffect$: Observable<Action> = this.actions$.pipe(
        ofType(actions.EditRequest),
        switchMap(payload => this.service.update(payload.item)),
        switchMap((response: Response<<%= clazz %>>) => {
                const result = [];
                if (response.hasError) {
                    result.push(actions.EditFailure({error: response.message}));
                } else {
                    const item = response.data;
                    result.push(actions.EditSuccess({item}));
                }
                return result;
            }
        ),
        catchError(error => {
                return of(actions.EditFailure({error}));
            }
        ),
    );

}
