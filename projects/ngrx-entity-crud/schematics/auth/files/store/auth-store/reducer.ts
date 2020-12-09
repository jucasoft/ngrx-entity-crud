import {initialState, State} from './state';
import {createReducer, on} from '@ngrx/store';
import * as actions from './actions';

export const featureReducer = createReducer<State>(initialState,
  // on(actions.Open, (state, {open}) => ({...state, ...{open}})),
  // on(actions.Select, (state, {item}) => ({...state, ...{item}})),
  on(actions.LoginResult, (state, {isLoggedIn, auth}) => ({...state, ...{isLoggedIn, auth}})),
  on(actions.LoginError, (state, {err}) => {
      return ({...initialState, err, hasError: true});
    }
  ),
  on(actions.Reset, (state, item) => ({...initialState})),
  on(actions.LogoutResult, (state, item) => ({...initialState})),
  on(actions.LogoutError, (state, item) => ({...initialState})),
);
