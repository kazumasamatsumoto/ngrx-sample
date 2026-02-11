import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, switchMap } from 'rxjs';
import * as FilterSelectors from '../store/filter.selectors';

/**
 * 【検証】同一コンポーネント・タイトルだけ変えるルーティングパターン
 *
 * ルート設定例:
 *   { path: 'shared/sales',     component: SharedListComponent, data: { title: '売上一覧' } }
 *   { path: 'shared/inventory', component: SharedListComponent, data: { title: '在庫一覧' } }
 *
 * ポイント:
 *   - 同じコンポーネントインスタンスが再利用されるため、
 *     ngOnInit だけでは URL 変化を検知できない
 *   - ActivatedRoute.data$ (Observable) を subscribe することで
 *     ルート変化のたびに最新の data を受け取れる
 *   - NgRx の select も同様に Observable なので async pipe で問題なく使える
 */
@Component({
  selector: 'app-shared-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container">

      <!-- ① ルートの data.title をタイトルとして表示 -->
      <h1>{{ (routeData$ | async)?.title }}</h1>

      <div class="explanation">
        <h3>ルートdata取得方法</h3>
        <p>
          <code>ActivatedRoute.data</code> は Observable なので、<br>
          同じコンポーネントを使い回してもルート変化を検知できます。
        </p>
        <p>
          現在のパス: <strong>{{ (routeData$ | async)?.path }}</strong>
        </p>
      </div>

      <!-- ② NgRx Store から値を取得（ルートに関係なく常に最新値） -->
      <div class="store-values">
        <h3>NgRx Store から取得した値</h3>
        <p>
          <small>※ どのタイトルのルートでも同じストアを参照します</small>
        </p>
        <p><strong>国:</strong> {{ (countries$ | async)?.join(', ') || 'なし' }}</p>
        <p><strong>地域:</strong> {{ (regions$ | async)?.join(', ') || 'なし' }}</p>
        <p><strong>組織:</strong> {{ (organizations$ | async)?.join(', ') || 'なし' }}</p>
        <p><strong>シリアルナンバー:</strong> {{ (serialNumber$ | async) ?? '未設定' }}</p>
      </div>

      <nav class="pagination">
        <a routerLink="/shared/sales"     routerLinkActive="active">売上一覧</a>
        <a routerLink="/shared/inventory" routerLinkActive="active">在庫一覧</a>
        <a routerLink="/shared/report"    routerLinkActive="active">レポート</a>
        <hr>
        <a routerLink="/register">← Store に値を登録する</a>
        <a routerLink="/page1">← page1 へ戻る</a>
      </nav>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 {
      color: #333;
      border-bottom: 2px solid #FF9800;
      padding-bottom: 10px;
    }
    .explanation, .store-values {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      h3 { margin-top: 0; color: #FF9800; }
      small { color: #888; }
      code {
        background: #f5f5f5;
        padding: 2px 6px;
        border-radius: 3px;
        font-family: monospace;
      }
    }
    .pagination {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 20px;
      align-items: center;
      hr { width: 100%; border: none; }
      a {
        padding: 10px 20px;
        background: #FF9800;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        &:hover { background: #F57C00; }
        &.active { background: #4CAF50; }
      }
    }
  `]
})
export class SharedListComponent {
  private route = inject(ActivatedRoute);
  private store = inject(Store);

  // ─────────────────────────────────────────────────
  // ① ルートの data を Observable で受け取る
  //
  // 【なぜ switchMap が不要か】
  //   provideRouter のデフォルトでは同一コンポーネントを再利用するため
  //   this.route.data はルート変化のたびに新しい値を emit する。
  //   そのまま async pipe で使えばOK。
  //
  // 【注意】ActivatedRoute.snapshot.data では NG
  //   snapshot はコンポーネント生成時の一回限りのスナップショット。
  //   同じコンポーネントを使い回す場合、URL が変わっても snapshot は更新されない。
  // ─────────────────────────────────────────────────
  routeData$: Observable<{ title: string; path: string }> =
    this.route.data as Observable<{ title: string; path: string }>;

  // ─────────────────────────────────────────────────
  // ② NgRx Store から値を取得
  //   ルートが変わっても store の参照は変わらないため、通常通り select するだけ。
  // ─────────────────────────────────────────────────
  countries$     = this.store.select(FilterSelectors.selectCountries);
  regions$       = this.store.select(FilterSelectors.selectRegions);
  organizations$ = this.store.select(FilterSelectors.selectOrganizations);
  serialNumber$  = this.store.select(FilterSelectors.selectSerialNumber);
}
