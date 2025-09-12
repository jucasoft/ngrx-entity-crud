import {createAction, props} from '@ngrx/store';

export enum ActionTypes {
  CHANGE_A = '[<%= clazz %>] Change A',
  CHANGE_B = '[<%= clazz %>] Change b',
}

export const ChangeA = createAction(ActionTypes.CHANGE_A, props<{ valueA: string }>());
export const ChangeB = createAction(ActionTypes.CHANGE_B, props<{ valueB: string }>());
