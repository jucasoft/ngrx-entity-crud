import {createFeatureSelector, createSelector, MemoizedSelector} from '@ngrx/store';

import {ThemeUiStoreState} from './theme-ui-store.state';
import {ThemeUiStoreNames} from './theme-ui-store.names';
import {SlideMenuItem} from '../../model/slide-menu-item';
import {MenuItem} from 'primeng/api';

const getOpen = (state: ThemeUiStoreState): boolean => state.open;
const getMouseover = (state: ThemeUiStoreState): boolean => state.mouseover;
const getItem = (state: ThemeUiStoreState): SlideMenuItem => state.item;
const getItems = (state: ThemeUiStoreState): MenuItem[] => state.items;
const getBreadcrumb = (value: SlideMenuItem): string[] => value.breadcrumb;

export const selectState: MemoizedSelector<object, ThemeUiStoreState> = createFeatureSelector<ThemeUiStoreState>(ThemeUiStoreNames.NAME);

export const selectItems: MemoizedSelector<object, MenuItem[]> = createSelector(
  selectState,
  getItems
);

export const selectItem: MemoizedSelector<object, SlideMenuItem> = createSelector(
  selectState,
  getItem
);

export const selectOpen: MemoizedSelector<object, boolean> = createSelector(
  selectState,
  getOpen
);

export const selectMouseover: MemoizedSelector<object, boolean> = createSelector(
  selectState,
  getMouseover
);

export const selectMouseoverOrOpen: MemoizedSelector<object, boolean> = createSelector(
  selectOpen,
  selectMouseover,
  (open, mouseover)=> open || mouseover
);

export const selectBreadcrumb: MemoizedSelector<object, string[]> = createSelector(
  selectItem,
  getBreadcrumb
);

export const selectBreadcrumbRenderized: MemoizedSelector<object, string> = createSelector(
  selectBreadcrumb,
  (values: string[]): string => {
    return values.join(' > ');
  }
);
