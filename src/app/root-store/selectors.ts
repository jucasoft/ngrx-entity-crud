import {createSelector, MemoizedSelector} from '@ngrx/store';
import {CoinStoreSelectors} from './coin-store';

export const selectError: MemoizedSelector<object, string> = createSelector(
  CoinStoreSelectors.selectError,
  (coin: string) => {
    return coin;
  }
);

export const selectIsLoading: MemoizedSelector<object,
  boolean> = createSelector(
  CoinStoreSelectors.selectIsLoading,
  (coin: boolean) => {
    return coin;
  }
);
