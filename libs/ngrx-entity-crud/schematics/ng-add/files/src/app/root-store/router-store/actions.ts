import {Action, createAction, props} from '@ngrx/store';
import {NavigationExtras} from '@angular/router';

export const RouterGo = createAction(`[Router] Go`, props<{
  path: any[];
  extras?: NavigationExtras;
  data?: any;
}>());

export const RouterGoPerformed = createAction(`[Router] Go performed`, props<{
  extras?: NavigationExtras;
  primary?: any;
}>());

export const RouterGoPopUp = createAction(`[Router] Go popUP`, props<{
  path: any[];
  extras?: NavigationExtras;
  data?: any;
}>());

export const RouterGoPopUpPerformed = createAction(`[Router] Go popUP performed`, props<{
  extras?: NavigationExtras;
  popUp?: any;
}>());

export const RouterPopState = createAction(`[Router] Pop`);
export const RouterBack = createAction(`[Router] Back`);
