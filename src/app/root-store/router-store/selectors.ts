import {createFeatureSelector, createSelector, MemoizedSelector} from '@ngrx/store';
import {RouterReducerState} from '@ngrx/router-store';

export const selectRouterState: MemoizedSelector<object, RouterReducerState> = createFeatureSelector<RouterReducerState>('router');
export const getOptions = (state: RouterReducerState): any => state.state.root.firstChild.params.options;
// export const isMain = (state: RouterReducerState): any => evalData(() => state.state.root.firstChild.url[0].path === 'main', false);

export const selectOptions: MemoizedSelector<object, any> = createSelector(
  selectRouterState,
  getOptions
);

// export const selectIsMain: MemoizedSelector<object, boolean> = createSelector(
// 	selectRouterState,
// 	isMain
// );

