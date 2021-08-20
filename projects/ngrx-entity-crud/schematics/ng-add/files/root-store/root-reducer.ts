import {ActionReducerMap, MetaReducer} from '@ngrx/store';
import {State} from '@root-store/state';
import {environment} from '../../environments/environment';


export interface AppState {
}

export const reducers: ActionReducerMap<AppState> = {};

export const metaReducers: MetaReducer<State>[] = !environment.production ? [] : [];
