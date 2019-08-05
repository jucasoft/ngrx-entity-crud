import {RouterReducerState, SerializedRouterStateSnapshot} from '@ngrx/router-store';
import {NavigationExtras} from '@angular/router';

export interface State extends RouterReducerState<SerializedRouterStateSnapshot> {
    extra: NavigationExtras;
}

export const initialState: State = {
    state: null,
    navigationId: null,
    extra: null,
};
