import {createAction, props} from '@ngrx/store';

export enum ActionTypes {
  LOGIN_REQUEST = '[Auth] Login Request',
  LOGIN_RESULT = '[Auth] Login Result',

  LOGOUT_REQUEST = '[Auth] Logout Request',
  LOGOUT_RESULT = '[Auth] Logout Result',

  GO_TO_LOGIN = '[Auth] Go to login',
  CHECK_AUTH = '[Auth] Check auth',
}

export const CheckAuth = createAction(ActionTypes.CHECK_AUTH);
export const LoginRequest = createAction(ActionTypes.LOGIN_REQUEST);
export const LoginResult = createAction(ActionTypes.LOGIN_RESULT, props<{ profile: any; isLoggedIn: boolean }>());

export const LogoutRequest = createAction(ActionTypes.LOGOUT_REQUEST);
export const LogoutResult = createAction(ActionTypes.LOGOUT_RESULT);

export const GoToLogin = createAction(ActionTypes.GO_TO_LOGIN);
