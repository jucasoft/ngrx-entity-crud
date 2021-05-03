import {Profile} from './profile';

export interface State {
  isLoggedIn: boolean;
  userProfile: Profile;
}

export const initialState: State = {
  isLoggedIn: false,
  userProfile: null
};
