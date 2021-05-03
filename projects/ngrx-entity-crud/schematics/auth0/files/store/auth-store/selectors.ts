import {createFeatureSelector, createSelector} from '@ngrx/store';
import {Names} from './names';
import {State} from './state';

// get the `auth` property from the state object
export const getAuthFeatureState = createFeatureSelector<State>(Names.NAME);

// get the userProfile from the auth state
export const selectCurrentUserProfile = createSelector(
  getAuthFeatureState,
  (state: State) => state.userProfile
);

// get the isLoggedIn from the auth state
export const selectIsLoggedIn = createSelector(
  getAuthFeatureState,
  (state: State) => state.isLoggedIn
);

export const selectRoles = createSelector(
  selectIsLoggedIn,
  (isLoggedIn: boolean) => isLoggedIn ? ['roleA'] : []
  )
;
