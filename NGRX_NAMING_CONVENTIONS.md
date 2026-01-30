# NgRx 命名規則ガイド

このドキュメントは、NgRxの公式ドキュメント、コミュニティのスタイルガイド、およびReduxのベストプラクティスに基づいて作成されています。

## 基本原則

### Actionsは「イベント」として扱う

**重要**: Actionsは**何が起きたか（イベント）**を表現し、**何をすべきか（コマンド）**ではありません。

```typescript
// ❌ 悪い例: コマンド的
export const selectCountries = createAction('[Filter] Select Countries');

// ✅ 良い例: イベント的
export const setCountries = createAction(
  '[Filter] Set Countries',
  props<{ countries: string[] }>()
);
```

---

## 1. Actions の命名規則

### 基本フォーマット

```
'[Domain/Source] Verb + Noun'
```

- **[Domain/Source]**: アクションの発生源（コンポーネント名、API、ページ名など）
- **Verb**: 動詞（何をするか）
- **Noun**: 名詞（何に対して）

### 推奨される動詞

#### 状態変更系
- `set` - 値を設定する
- `update` - 既存の値を更新する
- `add` - 新しい項目を追加する
- `remove` / `delete` - 項目を削除する
- `clear` - 全てをクリアする
- `reset` - 初期状態に戻す
- `toggle` - ON/OFFを切り替える

#### 非同期処理系
- `load` - データを読み込む（開始）
- `loadSuccess` - 読み込み成功
- `loadFailure` / `loadError` - 読み込み失敗
- `create` - 作成する
- `createSuccess` - 作成成功
- `createFailure` - 作成失敗

### 具体例

```typescript
// ✅ 状態変更
export const setCountries = createAction(
  '[Filter] Set Countries',
  props<{ countries: string[] }>()
);

export const updateUser = createAction(
  '[User Profile] Update User',
  props<{ user: User }>()
);

export const addTodo = createAction(
  '[Todo List] Add Todo',
  props<{ text: string }>()
);

export const removeTodo = createAction(
  '[Todo List] Remove Todo',
  props<{ id: string }>()
);

export const resetFilters = createAction('[Filter] Reset Filters');

// ✅ 非同期処理
export const loadUsers = createAction('[User API] Load Users');

export const loadUsersSuccess = createAction(
  '[User API] Load Users Success',
  props<{ users: User[] }>()
);

export const loadUsersFailure = createAction(
  '[User API] Load Users Failure',
  props<{ error: string }>()
);
```

### ❌ 避けるべきパターン

```typescript
// ❌ Selectorと同じ接頭辞を使用
export const selectCountries = createAction('[Filter] Select Countries');

// ❌ 曖昧な命名
export const doSomething = createAction('[App] Do Something');

// ❌ 汎用的すぎる
export const update = createAction('[App] Update');

// ❌ 過去形（イベントは現在形で表現）
export const userLoaded = createAction('[API] User Loaded');
```

---

## 2. State の命名規則

### フォーマット

- **camelCase**を使用
- 複数形・単数形を適切に使い分ける
- プレフィックスは状況に応じて使用（`selected*`, `current*`, `is*`, `has*`など）

```typescript
export interface FilterState {
  countries: string[];              // 複数形
  regions: string[];                // 複数形
  organizations: string[];          // 複数形
  serialNumber: number | null;      // 単数形
  selectedUserId: string | null;    // selectedプレフィックス
  isLoading: boolean;               // isプレフィックス
  hasError: boolean;                // hasプレフィックス
}
```

---

## 3. Selectors の命名規則

### フォーマット

```
select + State Property Name
```

### 基本ルール

- **常に`select`で始める**
- State内のプロパティ名と対応させる
- Feature Selectorは`select + FeatureName + State`

```typescript
// Feature Selector
export const selectFilterState = createFeatureSelector<FilterState>('filter');

// 個別のSelector
export const selectCountries = createSelector(
  selectFilterState,
  (state) => state.countries
);

export const selectRegions = createSelector(
  selectFilterState,
  (state) => state.regions
);

export const selectSerialNumber = createSelector(
  selectFilterState,
  (state) => state.serialNumber
);

// 派生データのSelector
export const selectCountryCount = createSelector(
  selectCountries,
  (countries) => countries.length
);

export const selectHasCountries = createSelector(
  selectCountries,
  (countries) => countries.length > 0
);

// 複数のselectorを組み合わせる場合
export const selectFilterSummary = createSelector(
  selectCountries,
  selectRegions,
  (countries, regions) => ({
    countryCount: countries.length,
    regionCount: regions.length
  })
);
```

### 特殊なケース

```typescript
// State内のプロパティが `selectedOrganisation` の場合
export interface FilterState {
  selectedOrganisation: string | null;
}

// Selectorは以下のどちらでもOK
export const selectSelectedOrganisation = createSelector(...); // 冗長だが正確
export const selectOrganisation = createSelector(...);          // シンプル（推奨）
```

---

## 4. Reducers の命名規則

### フォーマット

```
featureName + Reducer
```

```typescript
export const filterReducer = createReducer(
  initialFilterState,
  on(FilterActions.setCountries, (state, { countries }) => ({
    ...state,
    countries
  })),
  on(FilterActions.setRegions, (state, { regions }) => ({
    ...state,
    regions
  }))
);
```

---

## 5. ファイル命名規則

### 推奨される構造

```
src/app/store/
  ├── feature-name.state.ts       # State定義
  ├── feature-name.actions.ts     # Actions
  ├── feature-name.reducer.ts     # Reducer
  ├── feature-name.selectors.ts   # Selectors
  └── feature-name.effects.ts     # Effects（必要な場合）
```

### 具体例

```
src/app/store/
  ├── filter.state.ts
  ├── filter.actions.ts
  ├── filter.reducer.ts
  └── filter.selectors.ts
```

または、フィーチャーごとにディレクトリを作成する場合：

```
src/app/store/filter/
  ├── filter.state.ts
  ├── filter.actions.ts
  ├── filter.reducer.ts
  ├── filter.selectors.ts
  └── index.ts              # Barrel export
```

---

## 6. よくあるアンチパターンと改善例

### アンチパターン 1: Actionに`select`を使用

```typescript
// ❌ 悪い例
export const selectCountries = createAction(
  '[Filter] Select Countries',
  props<{ countries: string[] }>()
);

export const selectCountries = createSelector(...); // 名前が衝突！

// ✅ 良い例
export const setCountries = createAction(
  '[Filter] Set Countries',
  props<{ countries: string[] }>()
);

export const selectCountries = createSelector(...);
```

### アンチパターン 2: 過度に複雑な命名

```typescript
// ❌ 悪い例（Geminiの提案）
Action: selectOrganisation
Reducer: selectedOrganisation
Selector: selectSelectedOrganisation  // 「選択された選択を選択する」

// ✅ 良い例
State: { selectedOrganisation: string | null }
Action: setOrganisation
Selector: selectOrganisation  // または selectSelectedOrganisation
```

### アンチパターン 3: 単数形・複数形の混乱

```typescript
// ❌ 悪い例
export const selectCountries = createAction(...);  // Action
export const selectCountry = createSelector(...);  // Selector（名前が微妙に違う）

// ✅ 良い例
export const setCountries = createAction(...);     // Action: 複数形
export const selectCountries = createSelector(...); // Selector: 複数形（一致）
```

---

## 7. チートシート

### Actions

| 用途 | 動詞 | 例 |
|------|------|-----|
| 値を設定 | `set` | `setCountries`, `setUser` |
| 値を更新 | `update` | `updateProfile`, `updateSettings` |
| 追加 | `add` | `addTodo`, `addItem` |
| 削除 | `remove`, `delete` | `removeTodo`, `deleteUser` |
| クリア | `clear` | `clearFilters`, `clearCache` |
| リセット | `reset` | `resetForm`, `resetFilters` |
| 読み込み開始 | `load` | `loadUsers`, `loadProducts` |
| 読み込み成功 | `loadSuccess` | `loadUsersSuccess` |
| 読み込み失敗 | `loadFailure` | `loadUsersFailure` |

### Selectors

| 用途 | パターン | 例 |
|------|----------|-----|
| Feature全体 | `select + Feature + State` | `selectFilterState` |
| 個別プロパティ | `select + PropertyName` | `selectCountries` |
| 派生データ | `select + Description` | `selectCountryCount` |
| 真偽値 | `select + Has/Is + Description` | `selectHasCountries` |

---

## 8. 参考資料

- [NgRx Style Guide (orizens)](https://github.com/orizens/ngrx-styleguide)
- [Redux Style Guide](https://redux.js.org/style-guide/)
- [NgRx Official Documentation](https://ngrx.io/)
- [Angular.love - NgRx Best Practices](https://angular.love/ngrx-best-practices/)

---

## まとめ

1. **Actionsは動詞で始める**（`set`, `update`, `load`など）
2. **Selectorsは常に`select`で始める**
3. **命名は一貫性を保つ**（単数形・複数形の統一）
4. **イベント駆動で考える**（何が起きたかを表現）
5. **衝突を避ける**（ActionとSelectorで異なる接頭辞）
