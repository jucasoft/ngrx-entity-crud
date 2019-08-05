import {createFeatureSelector, createSelector, MemoizedSelector} from '@ngrx/store';
import {RouterReducerState} from '@ngrx/router-store';
import {NavigationExtras} from '@angular/router';
import {State} from './state';
import {evalData} from '@core/utils/j-utils';

export const selectRouterState: MemoizedSelector<object, RouterReducerState> = createFeatureSelector<RouterReducerState>('router');
const getOptions = (state: State): any => state.state.root.firstChild.params.options;

const getHasPopUp = (state: State): any => evalData<string>(() => state.state.url, '').indexOf('//popUp') !== -1;

const getExtra = (state: State): NavigationExtras => state.extra;

export const selectOptions: MemoizedSelector<object, any> = createSelector(
    selectRouterState,
    getOptions
);

export const selectExtra: MemoizedSelector<object, NavigationExtras> = createSelector(
    selectRouterState,
    getExtra
);

export const hasPopUp: MemoizedSelector<object, NavigationExtras> = createSelector(
    selectRouterState,
    getHasPopUp
);
