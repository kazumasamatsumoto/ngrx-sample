import { createReducer, on } from '@ngrx/store';
import {
  loadFilterConfig,
  loadFilterConfigSuccess,
  loadFilterConfigFromCache,
  loadFilterConfigFailure
} from './filter.actions';
import { FilterState, initialFilterState } from './filter.state';

export const filterReducer = createReducer(
  initialFilterState,

  // 読み込み開始
  on(loadFilterConfig, (state) => ({
    ...state,
    loading: state.config === null,  // キャッシュがなければloading
    error: null
  })),

  // API成功
  on(loadFilterConfigSuccess, (state, { config }) => ({
    ...state,
    config,
    loading: false,
    error: null
  })),

  // キャッシュ使用
  on(loadFilterConfigFromCache, (state) => ({
    ...state,
    loading: false,
    error: null
  })),

  // API失敗
  on(loadFilterConfigFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
);
