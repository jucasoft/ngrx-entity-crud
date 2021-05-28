import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {Observable} from 'rxjs';
import {Action} from '@ngrx/store';
import * as actions from './actions';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';
import {<%= clazz %>Service} from '@services/<%= dasherize(clazz) %>.service';
import {
  createCall, createCatchError, createResponse,
  createManyCall, createManyCatchError, createManyResponse,
  deleteCall, deleteCatchError, deleteResponse,
  deleteManyCall, deleteManyCatchError, deleteManyResponse,
  editCall, editCatchError, editResponse,
  editManyCall, editManyCatchError, editManyResponse,
  searchCall, searchCatchError, searchResponse,
  selectCall, selectCatchError, selectResponse
} from 'ngrx-entity-crud';
import {repeat} from 'rxjs/operators';

@Injectable()
export class <%= clazz %>StoreEffects {

  searchRequestEffect$: Observable<Action> = createEffect(() => this.actions$.pipe(
    ofType(actions.SearchRequest),
    searchCall<<%= clazz %>>(this.service),
    searchResponse<<%= clazz %>>(actions, {dispatchResponse: false}),
    searchCatchError<<%= clazz %>>(actions),
    repeat()
  ));


  deleteRequestEffect$: Observable<Action>  = createEffect(() => this.actions$.pipe(
    ofType(actions.DeleteRequest),
    deleteCall<<%= clazz %>>(this.service),
    deleteResponse<<%= clazz %>>(actions, <%= clazz %>, {dispatchResponse: false}),
    deleteCatchError<<%= clazz %>>(actions),
    repeat()
  ));

  deleteManyRequestEffect$: Observable<Action>  = createEffect(() => this.actions$.pipe(
    ofType(actions.DeleteManyRequest),
    deleteManyCall<<%= clazz %>>(this.service),
    deleteManyResponse<<%= clazz %>>(actions, <%= clazz %>, {dispatchResponse: false}),
    deleteManyCatchError<<%= clazz %>>(actions),
    repeat()
  ));
  createRequestEffect$: Observable<Action>  = createEffect(() => this.actions$.pipe(
    ofType(actions.CreateRequest),
    createCall<<%= clazz %>>(this.service),
    createResponse<<%= clazz %>>(actions, {dispatchResponse: false}),
    createCatchError<<%= clazz %>>(actions),
    repeat()
  ));

  createManyRequestEffect$: Observable<Action>  = createEffect(() => this.actions$.pipe(
    ofType(actions.CreateManyRequest),
    createManyCall<<%= clazz %>>(this.service),
    createManyResponse<<%= clazz %>>(actions, {dispatchResponse: false}),
    createManyCatchError<<%= clazz %>>(actions),
    repeat()
  ));

  editRequestEffect$: Observable<Action>  = createEffect(() => this.actions$.pipe(
    ofType(actions.EditRequest),
    editCall<<%= clazz %>>(this.service),
    editResponse<<%= clazz %>>(actions, {dispatchResponse: false}),
    editCatchError<<%= clazz %>>(actions),
    repeat()
  ));

  editManyRequestEffect$: Observable<Action>  = createEffect(() => this.actions$.pipe(
    ofType(actions.EditManyRequest),
    editManyCall<<%= clazz %>>(this.service),
    editManyResponse<<%= clazz %>>(actions, {dispatchResponse: false}),
    editManyCatchError<<%= clazz %>>(actions),
    repeat()
  ));

  selectRequestEffect$: Observable<Action>  = createEffect(() => this.actions$.pipe(
    ofType(actions.SelectRequest),
    selectCall<<%= clazz %>>(this.service),
    selectResponse<<%= clazz %>>(actions, {dispatchResponse: false}),
    selectCatchError<<%= clazz %>>(actions),
    repeat()
  ));

  constructor(private readonly actions$: Actions, private readonly service: <%= clazz %>Service) {
  }
  
}
