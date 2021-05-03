import {initialState} from './state';
import {createReducer, on} from '@ngrx/store';
import * as actions from './actions';

export const featureReducer = createReducer(
  initialState,

  on(actions.LoginResult, (state, {profile, isLoggedIn}) => {
    return {
      ...state,
      userProfile: profile,
      isLoggedIn,
    };
  }),

  on(actions.LogoutResult, (state, {}) => {
    return {
      ...state,
      userProfile: null,
      isLoggedIn: false,
    };
  })
);
