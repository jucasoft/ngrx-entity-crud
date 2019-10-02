import {Injectable} from '@angular/core';
import {Actions, Effect} from '@ngrx/effects';
import {Observable} from 'rxjs';
import {Action} from '@ngrx/store';
import * as actions from './actions';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';
import {<%= clazz %>Service} from '@services/<%= dasherize(clazz) %>.service';
import {createRequestEffect, deleteRequestEffect, editRequestEffect, searchRequestEffect} from 'ngrx-entity-crud';


@Injectable()
export class <%= clazz %>StoreEffects {
    constructor(private readonly actions$: Actions, private readonly service: <%= clazz %>Service) {
    }

    @Effect()
    searchRequestEffect$: Observable<Action> = searchRequestEffect<<%= clazz %>>(this.actions$, actions, this.service);

    @Effect()
    deleteRequestEffect$: Observable<Action> = deleteRequestEffect<<%= clazz %>>(this.actions$, actions, this.service, <%= clazz %>);

    @Effect()
    createRequestEffect$: Observable<Action> = createRequestEffect<<%= clazz %>>(this.actions$, actions, this.service);

    @Effect()
    editRequestEffect$: Observable<Action> = editRequestEffect<<%= clazz %>>(this.actions$, actions, this.service);

    @Effect()
    selectRequestEffect$: Observable<Action> = editRequestEffect<<%= clazz %>>(this.actions$, actions, this.service);

}
