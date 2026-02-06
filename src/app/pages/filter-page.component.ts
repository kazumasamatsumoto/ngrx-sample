import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { loadFilterConfig } from '../store/filter/filter.actions';
import {
  selectFilterConfig,
  selectFilterLoading,
  selectFilterError
} from '../store/filter/filter.selectors';
import { FilterConfig } from '../store/filter/filter.state';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-filter-page',
  standalone: true,
  imports: [CommonModule],
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
        <h2>Filter Configuration</h2>
        <div *ngFor="let filter of config" class="filter-item">
          <label>{{ filter.label }}</label>
          <span>Type: {{ filter.type }}</span>
          <span>Alias: {{ filter.alias }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filter-page {
      padding: 20px;
    }
    .loading, .error {
      padding: 10px;
      margin: 10px 0;
    }
    .error {
      color: red;
      background-color: #ffe6e6;
    }
    .filter-item {
      padding: 10px;
      margin: 10px 0;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    .filter-item label {
      font-weight: bold;
      display: block;
    }
    .filter-item span {
      display: inline-block;
      margin-right: 10px;
      color: #666;
    }
  `]
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
