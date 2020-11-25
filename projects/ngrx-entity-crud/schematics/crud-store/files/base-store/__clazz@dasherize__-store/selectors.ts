import {createFeatureSelector, createSelector, MemoizedSelector} from '@ngrx/store';
import {Names} from './names';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';

const getExample = (state: <%= clazz %>): any[] => state.example;

export const selectState: MemoizedSelector<object, <%= clazz %>> = createFeatureSelector<<%= clazz %>>(Names.NAME);

export const selectExample: MemoizedSelector<object, any[]> = createSelector(
  selectState,
  getExample
);
