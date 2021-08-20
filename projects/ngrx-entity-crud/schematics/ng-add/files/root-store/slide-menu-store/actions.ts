import {SlideMenuItem} from '@models/vo/slide-menu-item';
import {createAction, props} from '@ngrx/store';


export enum ActionTypes {
  SELECT = '[SlideMenu] Select',
  OPEN = '[SlideMenu] Open',
}

export const Open = createAction(ActionTypes.OPEN, props<{ open: boolean }>());
export const Select = createAction(ActionTypes.SELECT, props<{ item: SlideMenuItem }>());
