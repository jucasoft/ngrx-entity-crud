import {createFeatureSelector, createSelector, MemoizedSelector} from '@ngrx/store';
import {Names} from './names';
import {Auth, AuthUser} from '@models/vo/auth';
import {State} from './state';
import {HttpErrorResponse} from '@angular/common/http';

const getIsLoggedIn = (state: State): boolean => state.isLoggedIn;
const getAuth = (state: State): Auth => {
  return state.auth;
};

const getRoles = (data: Auth): string[] => {
  console.log('.getRoles()');
  return !!data ? data.roles : [];
};

const getUser = (data: Auth): AuthUser => !!data ? data.user : null;
const getToken = (data: Auth): string => !!data ? data.token : null;
const getHasError = (state: State): boolean => state.hasError;
const getErr = (state: State): HttpErrorResponse => state.err;

export const selectState: MemoizedSelector<object, State> = createFeatureSelector<State>(Names.NAME);

export const selectIsLoggedIn: MemoizedSelector<object, boolean> = createSelector(
  selectState,
  getIsLoggedIn
);

export const selectAuth: MemoizedSelector<object, Auth> = createSelector(
  selectState,
  getAuth
);

export const selectRoles: MemoizedSelector<Auth, string[]> = createSelector(
  selectAuth,
  getRoles
);

export const selectUser: MemoizedSelector<Auth, AuthUser> = createSelector(
  selectAuth,
  getUser
);

export const selectToken: MemoizedSelector<Auth, string> = createSelector(
  selectAuth,
  getToken
);

export const selectHasError: MemoizedSelector<object, boolean> = createSelector(
  selectState,
  getHasError
);

export const selectErr: MemoizedSelector<object, HttpErrorResponse> = createSelector(
  selectState,
  getErr
);

