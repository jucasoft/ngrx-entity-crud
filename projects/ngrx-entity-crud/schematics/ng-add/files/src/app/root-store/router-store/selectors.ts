import {createFeatureSelector, createSelector, MemoizedSelector} from '@ngrx/store';
import {Data, NavigationExtras, Params} from '@angular/router';
import {State} from './state';
import {evalData} from 'ngrx-entity-crud';
import {getRouterSelectors} from "@ngrx/router-store";

export const selectRouterState: MemoizedSelector<object, State> = createFeatureSelector<State>('router');
const getOptions = (state: State): any => state?.state?.root?.firstChild?.params["options"];
const getHasPopUp = (state: State): any => evalData<string>(() => state.state.url, '').indexOf('//popUp') !== -1;
const getPrimary = (state: State): any => evalData(() => state.primary, null);
const getPopUp = (state: State): any => evalData(() => state.popUp, null);

export const selectOptions: MemoizedSelector<object, any> = createSelector(
  selectRouterState,
  getOptions
);

export const selectPrimary: MemoizedSelector<object, any> = createSelector(
  selectRouterState,
  getPrimary
);

export const selectPopUp: MemoizedSelector<object, any> = createSelector(
  selectRouterState,
  getPopUp
);

export const hasPopUp: MemoizedSelector<object, NavigationExtras> = createSelector(
  selectRouterState,
  getHasPopUp
);

export const {
  selectCurrentRoute, // select the current route
  selectFragment, // select the current route fragment
  selectQueryParams, // select the current route query params
  selectQueryParam, // factory function to select a query param
  selectRouteParams, // select the current route params
  selectRouteParam, // factory function to select a route param
  selectRouteData, // select the current route data
  selectRouteDataParam, // factory function to select a route data param
  selectUrl, // select the current url
  selectTitle, // select the title if available
} = getRouterSelectors(selectRouterState);

export const all: MemoizedSelector<object, RuoteData> = createSelector(
  selectQueryParams,
  selectRouteParams,
  selectRouteData,
  selectUrl,
  (selectQueryParamsA, selectRouteParamsA, selectRouteDataA, selectUrlA) => {
    return {
      selectQueryParams: selectQueryParamsA,
      selectRouteParams: selectRouteParamsA,
      selectRouteData: selectRouteDataA,
      selectUrl: selectUrlA
    };
  }
);

export interface RuoteData {
  selectQueryParams: Params;
  selectRouteParams: Params;
  selectRouteData: Data;
  selectUrl: string;
}

export const selectId = createSelector(
  selectRouteParams,
  (params:Params) => params['id']
)
