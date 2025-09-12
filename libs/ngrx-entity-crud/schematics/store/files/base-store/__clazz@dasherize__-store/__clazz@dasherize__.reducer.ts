import {initialState} from './<%= dasherize(clazz) %>.state';
import {createReducer, on} from '@ngrx/store';
import * as actions from './<%= dasherize(clazz) %>.actions';

export const featureReducer = createReducer(initialState,
  on(actions.ChangeA, (state, {valueA}) => ({...state, ...{valueA}})),
  on(actions.ChangeB, (state, {valueB}) => ({...state, ...{valueB}})),
);
