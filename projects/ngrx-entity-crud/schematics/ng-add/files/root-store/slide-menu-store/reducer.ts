import {initialState, State} from './state';
import * as actions from './actions';
import {createReducer, on} from '@ngrx/store';

export const featureReducer = createReducer<State>(initialState,
  on(actions.Open, (state, {open}) => ({...state, ...{open}})),
  on(actions.Select, (state, {item}) => ({...state, ...{item}})),
);
