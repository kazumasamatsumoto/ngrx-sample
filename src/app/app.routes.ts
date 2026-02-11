import { Routes } from '@angular/router';
import { Page1Component } from './pages/page1.component';
import { Page2Component } from './pages/page2.component';
import { Page3Component } from './pages/page3.component';
import { Page4Component } from './pages/page4.component';
import { Page5Component } from './pages/page5.component';
import { SharedListComponent } from './pages/shared-list.component';
import { RegisterComponent } from './pages/register.component';

export const routes: Routes = [
  { path: '', redirectTo: '/page1', pathMatch: 'full' },
  { path: 'page1', component: Page1Component },
  { path: 'page2', component: Page2Component },
  { path: 'page3', component: Page3Component },
  { path: 'page4', component: Page4Component },
  { path: 'page5', component: Page5Component },

  // ─────────────────────────────────────────────────────────────────
  // 【検証】同一コンポーネントを使い回してタイトルだけ変えるパターン
  //
  // data プロパティに title を持たせることで、
  // コンポーネント側から ActivatedRoute.data として取得できる。
  //
  // ポイント: 同じ component を指定しているため Angular はインスタンスを
  // 再利用する。ActivatedRoute.data は Observable で変化を流してくれるので
  // async pipe / subscribe で常に最新タイトルを受け取れる。
  // ─────────────────────────────────────────────────────────────────
  { path: 'register',         component: RegisterComponent },
  { path: 'shared/sales',     component: SharedListComponent, data: { title: '売上一覧',   path: 'shared/sales' } },
  { path: 'shared/inventory', component: SharedListComponent, data: { title: '在庫一覧',   path: 'shared/inventory' } },
  { path: 'shared/report',    component: SharedListComponent, data: { title: 'レポート一覧', path: 'shared/report' } },
];
