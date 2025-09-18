import { SlideMenuItem } from '../../model/slide-menu-item';
import { createAction, props } from '@ngrx/store';

export enum ActionTypes {
  SELECT = '[ThemeUiStore] Select',
  OPEN = '[ThemeUiStore] Open',
  MOUSEOVER = '[ThemeUiStore] Mouseover',
}

export const Open = createAction(ActionTypes.OPEN, props<{ open: boolean }>());
export const Mouseover = createAction(
  ActionTypes.MOUSEOVER,
  props<{ mouseover: boolean }>()
);
export const Select = createAction(
  ActionTypes.SELECT,
  props<{ item: SlideMenuItem }>()
);
