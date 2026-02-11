# NgRx × 同一コンポーネント・タイトル切り替えルーティング 調査まとめ

## 調査内容

1. 同じコンポーネントを使い回してタイトルだけ変えるルーティングの実装方法
2. そのパターン下で NgRx Store の値を取得する方法
3. 別ページで登録した NgRx の値を引き継ぐ方法
4. DI（依存性注入）の書き方の変遷

---

## サンプルコードの場所

| ファイル | 役割 |
|---|---|
| `src/app/pages/register.component.ts` | Store に値を dispatch する登録ページ |
| `src/app/pages/shared-list.component.ts` | 同一コンポーネントでタイトルを切り替え、Store の値を表示するページ |
| `src/app/app.routes.ts` | 同一コンポーネントに複数ルートを割り当てる設定 |
| `src/app/store/filter.actions.ts` | dispatch に使う Action 定義 |
| `src/app/store/filter.selectors.ts` | Store から値を取得する Selector 定義 |

### 検証の流れ

```
/register  →  値を入力して「Store に保存」ボタン押下
    ↓
/shared/sales  /shared/inventory  /shared/report  →  保存した値が表示される
```

---

## 1. 同一コンポーネントでタイトルだけ変えるルーティング

### ルート設定（`app.routes.ts`）

```ts
{ path: 'shared/sales',     component: SharedListComponent, data: { title: '売上一覧' } },
{ path: 'shared/inventory', component: SharedListComponent, data: { title: '在庫一覧' } },
{ path: 'shared/report',    component: SharedListComponent, data: { title: 'レポート一覧' } },
```

`data` プロパティにタイトルなど任意の値を持たせ、コンポーネント側から `ActivatedRoute.data` で受け取る。

### コンポーネント側の受け取り方

```ts
// ✅ 正しい書き方 — Observable で受け取る
routeData$ = this.route.data as Observable<{ title: string }>;
```

```html
<h1>{{ (routeData$ | async)?.title }}</h1>
```

### なぜ snapshot ではダメか

Angular は同じコンポーネントを**インスタンス再利用**するため、URL が変わっても `ngOnInit` は再実行されない。
`snapshot` は生成時の一回限りなので、URL 変化後のタイトルを反映できない。
`ActivatedRoute.data` は Observable なのでルート変化のたびに新しい値を emit する。

```ts
// ❌ NG — URL が変わっても更新されない
const title = this.route.snapshot.data['title'];

// ✅ OK — ルート変化を検知できる
routeData$ = this.route.data;
```

---

## 2. NgRx Store の値をどこからでも取得する

NgRx Store は**ルーティングと無関係なシングルトン**。
どのページで dispatch しても、どのページの select でも同じ値を参照できる。

```ts
// register.component.ts — 別ページで dispatch
this.store.dispatch(FilterActions.setCountries({ countries: ['Japan', 'USA'] }));

// shared-list.component.ts — 別ページ・別コンポーネントで select
countries$ = this.store.select(FilterSelectors.selectCountries);
```

`ActivatedRoute.data`（タイトル切り替え）と NgRx（値の共有）は完全に独立した仕組みなので、組み合わせてもお互いに影響しない。

---

## 3. ngOnInit に書く必要はない

`inject()` を使ったフィールド宣言はコンストラクタと同じタイミングで実行される。
Store の select は `@Input()` に依存しないため、フィールド宣言だけで完結する。

```ts
// ✅ これで十分
export class SharedListComponent {
  private store = inject(Store);
  private route = inject(ActivatedRoute);

  countries$ = this.store.select(FilterSelectors.selectCountries);
  routeData$ = this.route.data;
}
```

### ngOnInit が必要になるケース

- `@Input()` の値を使って selector を動的に組み立てる場合
  （`@Input` はコンストラクタ時点では未セット）

```ts
// @Input を使う場合は ngOnInit が必要
export class SomeComponent implements OnInit {
  @Input() category!: string;
  items$!: Observable<Item[]>;

  private store = inject(Store);

  ngOnInit() {
    // @Input の値が確定するのは ngOnInit 以降
    this.items$ = this.store.select(selectItemsByCategory(this.category));
  }
}
```

---

## 4. DIの書き方の変遷

DI（Dependency Injection / 依存性注入）は**概念**、コンストラクタ注入・`inject()` はその**実現手段**。

```
DI（依存性注入）
├── コンストラクタ注入  ← Angular 初期〜現在も使用可
│     constructor(private store: Store) {}
│
└── inject() 関数      ← Angular 14以降
      private store = inject(Store);
```

### コンストラクタ注入（古い書き方）

```ts
export class SharedListComponent {
  countries$: Observable<string[]>;

  constructor(private store: Store) {
    // DI されたインスタンスをコンストラクタ内で使う
    this.countries$ = this.store.select(FilterSelectors.selectCountries);
  }
}
```

### inject() 関数（現在の書き方）

```ts
export class SharedListComponent {
  private store = inject(Store);

  // フィールド宣言 = コンストラクタ相当のタイミング
  countries$ = this.store.select(FilterSelectors.selectCountries);
}
```

どちらも動作は同じ。`inject()` を使うと記述量が減り、コンストラクタを省略できる。
