了解です！アプローチ1（Effectsで判定）の完全版を書きますね。

## ファイル構成

```
src/app/store/filter/
├── filter.actions.ts
├── filter.state.ts
├── filter.reducer.ts
├── filter.selectors.ts
└── filter.effects.ts

src/app/services/
└── filter-api.service.ts

src/app/pages/
└── filter-page.component.ts
```

---

## 1. Actions（filter.actions.ts）

```typescript
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
```

---

## 2. State（filter.state.ts）

```typescript
export interface FilterConfig {
  id: string;
  alias: string;  // 例: "DateRange"
  type: 'dateRange' | 'select' | 'text';
  label: string;
  options?: any[];
}

export interface FilterState {
  config: FilterConfig[] | null;
  loading: boolean;
  error: any | null;
}

export const initialFilterState: FilterState = {
  config: null,
  loading: false,
  error: null
};
```

---

## 3. Reducer（filter.reducer.ts）

```typescript
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
```

---

## 4. Selectors（filter.selectors.ts）

```typescript
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
```

---

## 5. Effects（filter.effects.ts）

```typescript
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
```

---

## 6. Service（filter-api.service.ts）

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FilterConfig } from '../store/filter/filter.state';

@Injectable({
  providedIn: 'root'
})
export class FilterApiService {
  private readonly apiUrl = '/api/filter-config';  // 実際のエンドポイントに変更

  constructor(private http: HttpClient) {}

  /**
   * フィルター設定を取得
   */
  getFilterConfig(): Observable<FilterConfig[]> {
    return this.http.get<FilterConfig[]>(this.apiUrl);
  }
}
```

---

## 7. Component（filter-page.component.ts）

```typescript
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { loadFilterConfig } from '../../store/filter/filter.actions';
import { 
  selectFilterConfig, 
  selectFilterLoading, 
  selectFilterError 
} from '../../store/filter/filter.selectors';
import { FilterConfig } from '../../store/filter/filter.state';

@Component({
  selector: 'app-filter-page',
  template: `
    <div class="filter-page">
      <!-- Loading -->
      <div *ngIf="loading$ | async" class="loading">
        読み込み中...
      </div>

      <!-- Error -->
      <div *ngIf="error$ | async as error" class="error">
        エラー: {{ error.message }}
      </div>

      <!-- Filter Config -->
      <div *ngIf="filterConfig$ | async as config" class="filter-container">
        <app-filter-search-template
          [filterConfig]="config"
          (onSearch)="handleSearch($event)">
        </app-filter-search-template>
      </div>
    </div>
  `
})
export class FilterPageComponent implements OnInit {
  filterConfig$: Observable<FilterConfig[] | null>;
  loading$: Observable<boolean>;
  error$: Observable<any | null>;

  constructor(private store: Store) {
    this.filterConfig$ = this.store.select(selectFilterConfig);
    this.loading$ = this.store.select(selectFilterLoading);
    this.error$ = this.store.select(selectFilterError);
  }

  ngOnInit(): void {
    // フィルター設定を読み込み
    // Effectsがキャッシュの有無を判定してくれる
    this.store.dispatch(loadFilterConfig());
  }

  handleSearch(filters: Record<string, any>): void {
    console.log('Search filters:', filters);
    // ここで検索処理を実行
  }
}
```

---

## 8. Module設定（app.module.ts または filter.module.ts）

```typescript
import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { filterReducer } from './store/filter/filter.reducer';
import { FilterEffects } from './store/filter/filter.effects';

@NgModule({
  imports: [
    // Reducerの登録
    StoreModule.forFeature('filter', filterReducer),
    
    // Effectsの登録
    EffectsModule.forFeature([FilterEffects])
  ]
})
export class FilterModule {}
```

---

## 動作フロー

```typescript
// ページ遷移
Component.ngOnInit()
  ↓
store.dispatch(loadFilterConfig())
  ↓
Effects.loadFilterConfig$ が反応
  ↓
withLatestFrom() で現在のStateを取得
  ↓
┌─────────────────────┐
│ hasConfig?          │
└─────────────────────┘
        ↓          ↓
      Yes         No
        ↓          ↓
loadFilterConfig   API呼び出し
FromCache           ↓
        ↓          loadFilterConfig
        ↓          Success
        ↓          ↓
    Reducer実行 ← ─┘
        ↓
    画面更新
```

---

## テスト例（filter.effects.spec.ts）

```typescript
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { Observable, of, throwError } from 'rxjs';
import { FilterEffects } from './filter.effects';
import { FilterApiService } from '../../services/filter-api.service';
import { 
  loadFilterConfig, 
  loadFilterConfigSuccess, 
  loadFilterConfigFromCache 
} from './filter.actions';

describe('FilterEffects', () => {
  let actions$: Observable<any>;
  let effects: FilterEffects;
  let filterApiService: jest.Mocked<FilterApiService>;

  beforeEach(() => {
    const mockApiService = {
      getFilterConfig: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        FilterEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          initialState: {
            filter: { config: null, loading: false, error: null }
          }
        }),
        { provide: FilterApiService, useValue: mockApiService }
      ]
    });

    effects = TestBed.inject(FilterEffects);
    filterApiService = TestBed.inject(FilterApiService) as jest.Mocked<FilterApiService>;
  });

  it('キャッシュがない場合はAPI呼び出し', (done) => {
    const mockConfig = [{ id: '1', alias: 'DateRange', type: 'dateRange', label: '期間' }];
    filterApiService.getFilterConfig.mockReturnValue(of(mockConfig));

    actions$ = of(loadFilterConfig());

    effects.loadFilterConfig$.subscribe(action => {
      expect(action).toEqual(loadFilterConfigSuccess({ config: mockConfig }));
      done();
    });
  });
});
```

---

これで完全版です！何か追加で必要な部分や、疑問点があれば教えてください。