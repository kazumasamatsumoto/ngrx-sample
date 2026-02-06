import { createAction, props } from '@ngrx/store';
import { FilterConfig } from './filter.state';

// フィルター設定の読み込み
export const loadFilterConfig = createAction(
  '[Filter] Load Config'
);

// API呼び出し成功
export const loadFilterConfigSuccess = createAction(
  '[Filter] Load Config Success',
  props<{ config: FilterConfig[] }>()
);

// キャッシュから取得
export const loadFilterConfigFromCache = createAction(
  '[Filter] Load Config From Cache'
);

// API呼び出し失敗
export const loadFilterConfigFailure = createAction(
  '[Filter] Load Config Failure',
  props<{ error: any }>()
);
