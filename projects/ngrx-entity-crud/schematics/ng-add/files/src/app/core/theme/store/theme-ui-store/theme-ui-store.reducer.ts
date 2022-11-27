import {initialState, ThemeUiStoreState} from './theme-ui-store.state';
import * as actions from './theme-ui-store.actions';
import {createReducer, on} from '@ngrx/store';

export const featureReducer = createReducer<ThemeUiStoreState>(initialState,
  on(actions.Open, (state, {open}) => ({...state, ...{open}})),
  on(actions.Mouseover, (state, {mouseover}) => ({...state, ...{mouseover}})),
  on(actions.Select, (state, {item}) => ({...state, ...{item}})),
);
