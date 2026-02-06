import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FilterState } from './filter.state';

// Feature State取得
export const selectFilterState = createFeatureSelector<FilterState>('filter');

// フィルター設定
export const selectFilterConfig = createSelector(
  selectFilterState,
  (state) => state.config
);

// Loading状態
export const selectFilterLoading = createSelector(
  selectFilterState,
  (state) => state.loading
);

// Error状態
export const selectFilterError = createSelector(
  selectFilterState,
  (state) => state.error
);

// キャッシュ有無の判定
export const selectHasFilterConfig = createSelector(
  selectFilterConfig,
  (config) => config !== null && config.length > 0
);
