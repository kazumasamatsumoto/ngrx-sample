import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import * as FilterActions from '../store/filter.actions';
import * as FilterSelectors from '../store/filter.selectors';

/**
 * 【検証用】NgRx Store に値を登録するページ
 *
 * フォームに入力 → dispatch → Store に保存
 * → shared/sales などに遷移して値が引き継がれていることを確認する
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-container">
      <h1>Store 登録ページ</h1>
      <p class="description">
        ここで入力した値が NgRx Store に保存されます。<br>
        保存後に <strong>売上一覧 / 在庫一覧 / レポート一覧</strong>（同一コンポーネント）へ遷移して、
        値が引き継がれていることを確認してください。
      </p>

      <!-- 登録フォーム -->
      <div class="form-section">
        <h3>値を登録する</h3>

        <div class="field">
          <label>国（カンマ区切りで複数入力可）</label>
          <input type="text" [(ngModel)]="countriesInput" placeholder="例: Japan, USA, France">
        </div>

        <div class="field">
          <label>地域（カンマ区切りで複数入力可）</label>
          <input type="text" [(ngModel)]="regionsInput" placeholder="例: 関東, 関西">
        </div>

        <div class="field">
          <label>組織（カンマ区切りで複数入力可）</label>
          <input type="text" [(ngModel)]="organizationsInput" placeholder="例: 営業部, 開発部">
        </div>

        <div class="field">
          <label>シリアルナンバー（数値）</label>
          <input type="number" [(ngModel)]="serialNumberInput" placeholder="例: 12345">
        </div>

        <div class="buttons">
          <button class="btn-save" (click)="save()">Store に保存</button>
          <button class="btn-reset" (click)="reset()">リセット</button>
        </div>
      </div>

      <!-- 現在の Store の値（保存後に反映される） -->
      <div class="current-values">
        <h3>現在の Store の値</h3>
        <p><strong>国:</strong> {{ (countries$ | async)?.join(', ') || 'なし' }}</p>
        <p><strong>地域:</strong> {{ (regions$ | async)?.join(', ') || 'なし' }}</p>
        <p><strong>組織:</strong> {{ (organizations$ | async)?.join(', ') || 'なし' }}</p>
        <p><strong>シリアルナンバー:</strong> {{ (serialNumber$ | async) ?? '未設定' }}</p>
      </div>

      <!-- ナビゲーション -->
      <nav class="nav">
        <strong>保存後にここへ遷移 →</strong>
        <a routerLink="/shared/sales">売上一覧</a>
        <a routerLink="/shared/inventory">在庫一覧</a>
        <a routerLink="/shared/report">レポート一覧</a>
        <hr>
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
      border-bottom: 2px solid #9C27B0;
      padding-bottom: 10px;
    }
    .description {
      background: #f3e5f5;
      padding: 15px;
      border-radius: 4px;
      border-left: 4px solid #9C27B0;
      margin-bottom: 20px;
    }
    .form-section, .current-values {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      h3 { margin-top: 0; color: #9C27B0; }
    }
    .field {
      margin-bottom: 16px;
      label {
        display: block;
        font-size: 13px;
        color: #555;
        margin-bottom: 6px;
        font-weight: bold;
      }
      input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        box-sizing: border-box;
        &:focus { outline: none; border-color: #9C27B0; }
      }
    }
    .buttons {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }
    .btn-save {
      padding: 10px 24px;
      background: #9C27B0;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      &:hover { background: #7B1FA2; }
    }
    .btn-reset {
      padding: 10px 24px;
      background: #e53935;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      &:hover { background: #c62828; }
    }
    .current-values {
      p { margin: 8px 0; }
      strong { color: #555; }
    }
    .nav {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 20px;
      align-items: center;
      strong { color: #555; }
      hr { width: 100%; border: none; }
      a {
        padding: 10px 20px;
        background: #9C27B0;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        &:hover { background: #7B1FA2; }
      }
    }
  `]
})
export class RegisterComponent {
  private store = inject(Store);

  // フォームのバインディング用
  countriesInput     = '';
  regionsInput       = '';
  organizationsInput = '';
  serialNumberInput: number | null = null;

  // 現在の Store の値（保存後すぐ反映される）
  countries$     = this.store.select(FilterSelectors.selectCountries);
  regions$       = this.store.select(FilterSelectors.selectRegions);
  organizations$ = this.store.select(FilterSelectors.selectOrganizations);
  serialNumber$  = this.store.select(FilterSelectors.selectSerialNumber);

  save(): void {
    // カンマ区切り文字列 → 配列に変換してから dispatch
    const toArray = (s: string) =>
      s.split(',').map(v => v.trim()).filter(v => v.length > 0);

    this.store.dispatch(FilterActions.setCountries({
      countries: toArray(this.countriesInput)
    }));
    this.store.dispatch(FilterActions.setRegions({
      regions: toArray(this.regionsInput)
    }));
    this.store.dispatch(FilterActions.setOrganizations({
      organizations: toArray(this.organizationsInput)
    }));
    this.store.dispatch(FilterActions.setSerialNumber({
      serialNumber: this.serialNumberInput
    }));
  }

  reset(): void {
    this.store.dispatch(FilterActions.resetFilters());
    this.countriesInput     = '';
    this.regionsInput       = '';
    this.organizationsInput = '';
    this.serialNumberInput  = null;
  }
}
