import {Injectable} from '@angular/core';
import {Actions} from '@ngrx/effects';

@Injectable()
export class <%= clazz %>StoreEffects {
    constructor(private readonly actions$: Actions) {
    }
}
