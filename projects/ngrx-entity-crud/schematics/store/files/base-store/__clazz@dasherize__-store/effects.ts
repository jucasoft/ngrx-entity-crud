import {Injectable} from '@angular/core';
import {Actions} from '@ngrx/effects';
import {Action} from '@ngrx/store';
import * as actions from './actions';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';

@Injectable()
export class <%= clazz %>StoreEffects {
    constructor(private readonly actions$: Actions) {
    }
}
