import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {Observable} from 'rxjs';
import {Action} from '@ngrx/store';
import * as actions from './actions';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';
import {<%= clazz %>Service} from '@services/<%= dasherize(clazz) %>.service';
import {
  createCall, createError, createResponse,
  deleteCall, deleteError, deleteResponse,
  editCall, editError, editResponse,
  searchCall, searchError, searchResponse,
  selectCall, selectError, selectResponse
} from 'ngrx-entity-crud';

@Injectable()
export class <%= clazz %>StoreEffects {
    constructor(private readonly actions$: Actions, private readonly service: <%= clazz %>Service) {
    }

  searchRequestEffect$: Observable<Action> = createEffect(() => this.actions$.pipe(
    ofType(actions.SearchRequest),
    searchCall<<%= clazz %>>(this.service),
    searchResponse<<%= clazz %>>(actions, {dispatchResponse: false}),
    searchError<<%= clazz %>>(actions)
  ));

  deleteRequestEffect$: Observable<Action>  = createEffect(() => this.actions$.pipe(
    ofType(actions.DeleteRequest),
    deleteCall<<%= clazz %>>(this.service),
    deleteResponse<<%= clazz %>>(actions, <%= clazz %>, {dispatchResponse: false}),
    deleteError<<%= clazz %>>(actions)
  ));

  createRequestEffect$: Observable<Action>  = createEffect(() => this.actions$.pipe(
    ofType(actions.CreateRequest),
    createCall<<%= clazz %>>(this.service),
    createResponse<<%= clazz %>>(actions, {dispatchResponse: false}),
    createError<<%= clazz %>>(actions)
  ));

  editRequestEffect$: Observable<Action>  = createEffect(() => this.actions$.pipe(
    ofType(actions.EditRequest),
    editCall<<%= clazz %>>(this.service),
    editResponse<<%= clazz %>>(actions, {dispatchResponse: false}),
    editError<<%= clazz %>>(actions)
  ));

  selectRequestEffect$: Observable<Action>  = createEffect(() => this.actions$.pipe(
    ofType(actions.SelectRequest),
    selectCall<<%= clazz %>>(this.service),
    selectResponse<<%= clazz %>>(actions, {dispatchResponse: false}),
    selectError<<%= clazz %>>(actions)
  ));

}
