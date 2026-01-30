import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import * as FilterSelectors from '../store/filter.selectors';

@Component({
  selector: 'app-page5',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container">
      <h1>ページ5</h1>
      <div class="current-filters">
        <h3>現在のフィルター値（NgRxストアから取得）</h3>
        <p><strong>国:</strong> {{ (countries$ | async)?.join(', ') || 'なし' }}</p>
        <p><strong>地域:</strong> {{ (regions$ | async)?.join(', ') || 'なし' }}</p>
        <p><strong>組織:</strong> {{ (organizations$ | async)?.join(', ') || 'なし' }}</p>
        <p><strong>シリアルナンバー:</strong> {{ (serialNumber$ | async) ?? '未設定' }}</p>
      </div>
      <div class="test-instructions">
        <h3>動作確認手順</h3>
        <ol>
          <li>ページ1に戻ってフィルター値を設定</li>
          <li>各ページを遷移して値が維持されることを確認</li>
          <li>ブラウザをリロード（F5）して値がクリアされることを確認</li>
          <li>新しいタブで同じURLを開いて値がクリアされることを確認</li>
        </ol>
      </div>
      <nav class="pagination">
        <a routerLink="/page1">ページ1</a>
        <a routerLink="/page2">ページ2</a>
        <a routerLink="/page3">ページ3</a>
        <a routerLink="/page4">ページ4</a>
        <a routerLink="/page5" routerLinkActive="active">ページ5</a>
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
      border-bottom: 2px solid #4CAF50;
      padding-bottom: 10px;
    }
    .current-filters {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      h3 {
        margin-top: 0;
        color: #4CAF50;
      }
      p {
        margin: 10px 0;
        strong {
          color: #555;
        }
      }
    }
    .test-instructions {
      background: #f0f4ff;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #6366f1;
      h3 {
        margin-top: 0;
        color: #6366f1;
      }
      ol {
        margin: 10px 0 0 0;
        padding-left: 20px;
        li {
          margin: 8px 0;
        }
      }
    }
    .pagination {
      display: flex;
      gap: 10px;
      margin-top: 20px;
      a {
        padding: 10px 20px;
        background: #2196F3;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        &:hover {
          background: #1976D2;
        }
        &.active {
          background: #4CAF50;
        }
      }
    }
  `]
})
export class Page5Component {
  private store = inject(Store);

  countries$ = this.store.select(FilterSelectors.selectCountries);
  regions$ = this.store.select(FilterSelectors.selectRegions);
  organizations$ = this.store.select(FilterSelectors.selectOrganizations);
  serialNumber$ = this.store.select(FilterSelectors.selectSerialNumber);
}
