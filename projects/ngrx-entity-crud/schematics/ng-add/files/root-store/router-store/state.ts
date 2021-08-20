import {RouterReducerState, SerializedRouterStateSnapshot} from '@ngrx/router-store';
import {NavigationExtras} from '@angular/router';
import {PopUpData} from '@root-store/router-store/pop-up-base.component';

export interface State extends RouterReducerState<SerializedRouterStateSnapshot> {
  extras: NavigationExtras;
  primary: any;
  popUp: PopUpData<any>;
}

export const initialState: State = {
  state: null,
  navigationId: null,
  extras: null,
  primary: null,
  popUp: null,
};

