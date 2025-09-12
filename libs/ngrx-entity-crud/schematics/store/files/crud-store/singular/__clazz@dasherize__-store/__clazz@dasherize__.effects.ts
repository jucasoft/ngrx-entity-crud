import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {Observable} from 'rxjs';
import {Action} from '@ngrx/store';
import * as actions from './<%= dasherize(clazz) %>.actions';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';
import {<%= clazz %>Service} from '@services/<%= dasherize(clazz) %>.service';
import {createCall, createCatchError, createResponse, editCall, editCatchError, editResponse, selectCall, selectCatchError, selectResponse} from 'ngrx-entity-crud';
import {repeat} from 'rxjs/operators';

@Injectable()
export class <%= clazz %>StoreEffects {

  selectRequestEffect$: Observable<Action>  = createEffect(() => this.actions$.pipe(
    ofType(actions.SelectRequest),
    selectCall<<%= clazz %>>(this.service),
    selectResponse<<%= clazz %>>(actions, {dispatchResponse: false}),
    selectCatchError<<%= clazz %>>(actions),
    repeat()
  ));

  editRequestEffect$: Observable<Action>  = createEffect(() => this.actions$.pipe(
    ofType(actions.EditRequest),
    editCall<<%= clazz %>>(this.service),
    editResponse<<%= clazz %>>(actions, {dispatchResponse: false}),
    editCatchError<<%= clazz %>>(actions),
    repeat()
  ));

  constructor(private readonly actions$: Actions, private readonly service: <%= clazz %>Service) {
  }

}
