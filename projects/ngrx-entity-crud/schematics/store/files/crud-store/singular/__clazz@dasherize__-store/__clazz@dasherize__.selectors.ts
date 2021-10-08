import {createFeatureSelector, MemoizedSelector} from '@ngrx/store';

import {State} from './<%= dasherize(clazz) %>.state';
import {Names} from './<%= dasherize(clazz) %>.names';

import {getSingeCrudSelectors} from 'ngrx-entity-crud';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';

export const selectState: MemoizedSelector<object, State> = createFeatureSelector<State>(Names.NAME);
export const {
  selectItem,
  selectLastCriteria,
  selectError,
  selectIsLoading,
  selectIsLoaded,
  selectResponses,
} = getSingeCrudSelectors<<%= clazz %>, object>(selectState)

