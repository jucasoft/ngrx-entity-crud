import {createFeatureSelector, createSelector, MemoizedSelector} from '@ngrx/store';
import {Names} from './names';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';

const getValueA = (state: <%= clazz %>): string => state.valueA;
const getValueB = (state: <%= clazz %>): string => state.valueB;

export const selectState: MemoizedSelector<object, <%= clazz %>> = createFeatureSelector<<%= clazz %>>(Names.NAME);

export const selectValueA: MemoizedSelector<object, string> = createSelector(
  selectState,
  getValueA
);

export const selectValueB: MemoizedSelector<object, string> = createSelector(
  selectState,
  getValueB
);
