import {createAction, props} from '@ngrx/store';
import {HttpErrorResponse} from '@angular/common/http';
import {Auth} from '@models/vo/auth';

export enum ActionTypes {
  LOGIN_REQUEST = '[Auth] Login Request',
  LOGIN_RESULT = '[Auth] Login Result',
  LOGIN_ERROR = '[Auth] Login Error',

  RESET = '[Auth] Reset',

  LOGOUT_REQUEST = '[Auth] Logout Request',
  LOGOUT_RESULT = '[Auth] Logout Result',
  LOGOUT_ERROR = '[Auth] Logout Error',

  GO_TO_LOGIN = '[Auth] Go to login',
}

export const LoginRequest = createAction(ActionTypes.LOGIN_REQUEST, props<{ username: string, password: string }>());
export const LoginResult = createAction(ActionTypes.LOGIN_RESULT, props<{ isLoggedIn: boolean, auth: Auth }>());
export const LoginError = createAction(ActionTypes.LOGIN_ERROR, props<{ err: HttpErrorResponse }>());

export const Reset = createAction(ActionTypes.RESET);

export const LogoutRequest = createAction(ActionTypes.LOGOUT_REQUEST);
export const LogoutResult = createAction(ActionTypes.LOGOUT_RESULT);
export const LogoutError = createAction(ActionTypes.LOGOUT_ERROR);

export const GoToLogin = createAction(ActionTypes.GO_TO_LOGIN);

