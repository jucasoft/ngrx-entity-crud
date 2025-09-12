import {HttpErrorResponse} from '@angular/common/http';
import {Auth} from '@models/vo/auth';

export interface State {
  isLoggedIn: boolean;
  auth: Auth;
  hasError: boolean;
  err: HttpErrorResponse;
}

export const initialState: State = {
  isLoggedIn: false,
  auth: new Auth(),
  hasError: false,
  err: null
};
