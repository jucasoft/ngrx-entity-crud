import {initialState} from './state';
import {createReducer, on} from '@ngrx/store';
import * as actions from './actions';

export const featureReducer = createReducer(initialState,
  on(actions.ChangeA, (state, {valueA}) => ({...state, ...{valueA}})),
  on(actions.ChangeB, (state, {valueB}) => ({...state, ...{valueB}})),
);
