import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, catchError, switchMap, withLatestFrom } from 'rxjs/operators';
import {
  loadFilterConfig,
  loadFilterConfigSuccess,
  loadFilterConfigFromCache,
  loadFilterConfigFailure
} from './filter.actions';
import { selectFilterConfig, selectHasFilterConfig } from './filter.selectors';
import { FilterApiService } from '../../services/filter-api.service';

@Injectable()
export class FilterEffects {

  /**
   * フィルター設定の読み込み
   * キャッシュがあればそれを使用、なければAPI呼び出し
   */
  loadFilterConfig$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadFilterConfig),

      // 現在のStateを取得
      withLatestFrom(
        this.store.select(selectFilterConfig),
        this.store.select(selectHasFilterConfig)
      ),

      // キャッシュチェック
      switchMap(([action, config, hasConfig]) => {

        // キャッシュがある場合
        if (hasConfig) {
          console.log('[FilterEffects] Using cached filter config');
          return of(loadFilterConfigFromCache());
        }

        // キャッシュがない場合はAPI呼び出し
        console.log('[FilterEffects] Fetching filter config from API');
        return this.filterApiService.getFilterConfig().pipe(
          map(config => {
            console.log('[FilterEffects] Filter config loaded successfully');
            return loadFilterConfigSuccess({ config });
          }),
          catchError(error => {
            console.error('[FilterEffects] Failed to load filter config', error);
            return of(loadFilterConfigFailure({ error }));
          })
        );
      })
    )
  );

  constructor(
    private actions$: Actions,
    private store: Store,
    private filterApiService: FilterApiService
  ) {}
}
