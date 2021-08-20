import {initialState, State} from './state';
import {createReducer, on} from '@ngrx/store';
import * as actions from './actions';
import {routerCancelAction, routerErrorAction, routerNavigationAction, routerReducer} from '@ngrx/router-store';

export const past: State[] = [];

export const featureReducer = createReducer<State>(initialState,
  on(actions.RouterGoPerformed, (state, {primary, extras}) => {
    past.push(state);
    return {...state, ...{primary, extras}};
  }),
  on(actions.RouterGoPopUpPerformed, (state, {popUp, extras}) => {
    past.push(state);
    return {...state, ...{popUp, extras}};
  }),
  on(routerNavigationAction, routerErrorAction, routerCancelAction, (state, action) => {
    return {...state, ...routerReducer(state, action) as State};
  }),
  on(actions.RouterPopState, (state, values) => {
    // rimuovo la possibilità di premere il tasto forward.
    // prendere in considerazione la possibilità di gestire la storicizzazione in entrambi le direzioni.
    setTimeout(() => {
      history.pushState(null, null, null);
    }, 10);
    const result = past.pop();
    return (result);
  }),
  )
;

