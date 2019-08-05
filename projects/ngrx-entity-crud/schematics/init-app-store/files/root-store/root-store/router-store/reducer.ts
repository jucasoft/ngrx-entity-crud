import {initialState, State} from './state';
import {RouterGoPerformed} from './actions';
import {routerReducer} from '@ngrx/router-store';
import {createReducer, on} from '@ngrx/store';

const featureReducer_ = createReducer<State>(initialState,
    on(RouterGoPerformed, (state, {extras}) => {
        return ({...state, ...{extra:extras}})
    })
);

export const featureReducer = (state: State = initialState, action: any): State => {
    const resultA = (routerReducer(state, action) as State);
    const resultB = featureReducer_(state, action);
    return {...resultB, ...{state:resultA.state, navigationId:resultA.navigationId}};
};
