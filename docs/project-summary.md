# プロジェクトサマリ

## このプロジェクトで何を学んでいるか

Angular + NgRx の学習プロジェクト。
「フィルター値をページ遷移をまたいで維持する」という実用的なユースケースを題材に、
NgRx の基本から応用・Angular ルーティングの応用パターンまでを段階的に検証している。

---

## ディレクトリ構成

```
src/app/
├── app.ts                        # ルートコンポーネント（RouterOutlet のみのシェル）
├── app.config.ts                 # DI 設定（NgRx Store / Effects / DevTools の登録）
├── app.routes.ts                 # ルーティング定義
│
├── pages/
│   ├── page1.component.ts        # [学習] フィルターUI + NgRx select の基本
│   ├── page2.component.ts        # [学習] UI なしでもストア値が維持されることの確認
│   ├── page3.component.ts        # [学習] ページ遷移してもストアが保持されることの確認
│   ├── page4.component.ts        # [学習] リロード・別タブでストアがリセットされることの確認
│   ├── page5.component.ts        # [学習] 総合動作確認の手順書ページ
│   ├── filter-page.component.ts  # [学習] Effects を使った非同期 API + キャッシュパターン
│   ├── register.component.ts     # [学習] フォームから Store に dispatch する操作
│   └── shared-list.component.ts  # [学習] 同一コンポーネントでタイトルだけ変えるルーティング
│
├── components/
│   └── filter.component.ts       # フィルター選択 UI（再利用可能コンポーネント）
│
├── services/
│   └── filter-api.service.ts     # API 呼び出しの抽象化レイヤー（Effects から使用）
│
└── store/
    ├── filter.state.ts           # [同期用] ユーザーが選択したフィルター値の State 定義
    ├── filter.actions.ts         # [同期用] set / reset アクション
    ├── filter.reducer.ts         # [同期用] Reducer
    ├── filter.selectors.ts       # [同期用] Selector（countries / regions / organizations / serialNumber）
    │
    └── filter/                   # [非同期用] API からフィルター設定を取得するストア
        ├── filter.state.ts       # config / loading / error の3状態
        ├── filter.actions.ts     # load / success / fromCache / failure アクション
        ├── filter.reducer.ts     # 非同期フローの状態遷移
        ├── filter.selectors.ts   # config / loading / error / hasConfig のセレクター
        └── filter.effects.ts     # API 呼び出し + キャッシュ判定ロジック
```

---

## ストアの2層構造

`store/` 直下と `store/filter/` は**別の関心事**を扱う別のストア。

| | `store/` 直下 | `store/filter/` |
|---|---|---|
| 役割 | ユーザーが選択したフィルター値の保持 | API から取得するフィルター設定マスターの保持 |
| 状態 | `countries`, `regions`, `organizations`, `serialNumber` | `config`, `loading`, `error` |
| 非同期処理 | なし（同期的な set / reset のみ） | あり（Effects で API 呼び出し + キャッシュ制御） |
| 使用コンポーネント | page1〜5, register, shared-list, filter.component | filter-page.component |

> **注意**: `app.config.ts` に登録されている `filterReducer` は `store/filter/` 側のもの。
> `store/` 直下の Reducer は現在 `provideStore` に登録されておらず、page1〜5 のセレクターは動作していない状態。
> 学習過程での試行錯誤の痕跡として残っている。

---

## 各ページで何を検証しているか

### page1〜5（`/page1` 〜 `/page5`）
NgRx の最も基本的な特性を体験的に理解するための5ページ構成。

| ページ | 検証内容 |
|---|---|
| page1 | フィルター UI でストアに書き込み、同ページで値を表示する基本フロー |
| page2 | フィルター UI を持たないページでもストアの値を `select` で読み出せることの確認 |
| page3 | ページ遷移（ルーティング）してもストアの値が保持されることの確認 |
| page4 | ブラウザリロード・別タブ起動でストアがリセットされる（メモリ揮発性）の確認 |
| page5 | 手順書ページ。1〜4の操作手順をまとめた総合確認用 |

### register（`/register`）
- フォームに入力した値を NgRx Store に `dispatch` する操作を学ぶ
- `FormsModule` + `ngModel` + `dispatch` の組み合わせ

### shared-list（`/shared/sales`, `/shared/inventory`, `/shared/report`）
- **同一コンポーネントを3つのパスで使い回しタイトルだけ変えるルーティングパターン**
- `ActivatedRoute.data`（Observable）で `data.title` を受け取る方法
- `snapshot.data` ではなく Observable を使う理由の検証
- register で登録した NgRx の値がルートをまたいで引き継がれることの確認

### filter-page（ルート未登録）
- NgRx Effects を使ったキャッシュ付き非同期 API 呼び出しパターン
- `loading` / `error` の3状態管理
- `withLatestFrom` でキャッシュ有無を判定して API を呼び分ける制御

---

## 学習テーマの段階

```
Layer 1 — NgRx 基本
  ├── createAction / createReducer / createSelector の書き方
  ├── dispatch と select の使い方
  ├── async pipe でストアを購読する
  └── ストアの揮発性（リロードでリセット）の理解

Layer 2 — NgRx 応用
  ├── createEffect による非同期処理
  ├── switchMap + catchError によるエラーハンドリング
  ├── withLatestFrom でストアの現在値を参照した分岐処理
  └── キャッシュ戦略（既にデータがあれば API を呼ばない）

Layer 3 — Angular ルーティング応用
  ├── ルート data プロパティで静的データを渡す
  ├── 同一コンポーネントを複数パスに割り当てる
  └── ActivatedRoute.data を Observable で受け取る（snapshot NG の理由）

Layer 4 — 設計・命名規則
  └── NGRX_NAMING_CONVENTIONS.md 参照
```

---

## 既存のドキュメント

| ファイル | 内容 |
|---|---|
| `README.md` | プロジェクトの出発点となった要求仕様（5ページ構成・フィルター値の維持・リロードで揮発の確認） |
| `NGRX_NAMING_CONVENTIONS.md` | Actions・Selectors・Reducers の命名規則ガイド。アンチパターンと改善例を掲載 |
| `filter-test.md` | `store/filter/` の実装コード全量 + Effects のテストコード（jest + provideMockStore） |
| `docs/ngrx-shared-component-routing.md` | 同一コンポーネントでタイトルを切り替えるルーティングパターンと NgRx の取得方法の調査まとめ |
