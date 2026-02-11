import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  Observable,
  Subject,
  of,
  from,
  timer,
  EMPTY,
  forkJoin,
} from 'rxjs';
import {
  switchMap,
  concatMap,
  mergeMap,
  tap,
  delay,
  map,
  filter,
  takeUntil,
  catchError,
  finalize,
} from 'rxjs/operators';

// ─────────────────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────────────────

/** 擬似APIから返ってくるiframe情報 */
interface IframeInfo {
  id: string;
  title: string;
  src: string; // 擬似URL
  targetWidth: number;
  targetHeight: number;
}

/** パイプラインの各ステップのログ */
interface PipelineLog {
  step: number;
  label: string;
  message: string;
  status: 'running' | 'done' | 'error';
  timestamp: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 擬似APIデータ
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_IFRAME_LIST: IframeInfo[] = [
  { id: 'chart-sales',     title: '売上グラフ',     src: 'https://superset.example.com/chart/1', targetWidth: 800, targetHeight: 400 },
  { id: 'chart-inventory', title: '在庫グラフ',     src: 'https://superset.example.com/chart/2', targetWidth: 600, targetHeight: 300 },
  { id: 'chart-users',     title: 'ユーザー推移',   src: 'https://superset.example.com/chart/3', targetWidth: 700, targetHeight: 350 },
];

// ─────────────────────────────────────────────────────────────────────────────
// コンポーネント
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-iframe-pipeline',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container">
      <h1>RxJS 非同期パイプライン</h1>

      <div class="description">
        <h3>検証シナリオ</h3>
        <p>
          Superset などから iframe を取得する想定で、以下のパイプラインを順番に処理する。<br>
          <strong>処理が完了してから次へ進む</strong>というストリーム制御が核心。
        </p>
        <ol>
          <li>擬似 API から iframe リストを取得</li>
          <li>取得した iframe ごとに DOM 要素の存在を確認（擬似 MutationObserver）</li>
          <li>要素が確認できたら CSS を加工（width / height / border を変更）</li>
        </ol>
      </div>

      <!-- オペレーター切り替え -->
      <div class="operator-selector">
        <h3>使用するオペレーターを選択</h3>
        <div class="buttons">
          <button
            [class.active]="selectedOperator === 'concatMap'"
            (click)="selectedOperator = 'concatMap'">
            concatMap<br><small>1つずつ順番に処理</small>
          </button>
          <button
            [class.active]="selectedOperator === 'mergeMap'"
            (click)="selectedOperator = 'mergeMap'">
            mergeMap<br><small>並列で同時処理</small>
          </button>
          <button
            [class.active]="selectedOperator === 'switchMap'"
            (click)="selectedOperator = 'switchMap'">
            switchMap<br><small>最新のみ・前をキャンセル</small>
          </button>
        </div>
        <div class="operator-desc">
          <ng-container [ngSwitch]="selectedOperator">
            <p *ngSwitchCase="'concatMap'">
              <strong>concatMap</strong>: 前の処理が完了してから次を開始。
              順序が保証される。iframe のサイズ変更など<strong>順番に適用したい場合</strong>に最適。
            </p>
            <p *ngSwitchCase="'mergeMap'">
              <strong>mergeMap</strong>: すべてを同時並列で処理。
              速いが順序は保証されない。独立した処理を<strong>一気に並列実行</strong>したい場合に使う。
            </p>
            <p *ngSwitchCase="'switchMap'">
              <strong>switchMap</strong>: 新しい値が来たら前の処理をキャンセル。
              <strong>検索ボックスの入力</strong>など「最新の結果だけ欲しい」場面向け。
              今回のケースでは途中のiframeがキャンセルされる。
            </p>
          </ng-container>
        </div>
      </div>

      <!-- 実行ボタン -->
      <div class="action-area">
        <button class="btn-run" (click)="runPipeline()" [disabled]="isRunning">
          {{ isRunning ? '処理中...' : 'パイプライン実行' }}
        </button>
        <button class="btn-reset" (click)="reset()" [disabled]="isRunning">
          リセット
        </button>
      </div>

      <!-- パイプラインのログ表示 -->
      <div class="pipeline-log" *ngIf="logs.length > 0">
        <h3>実行ログ</h3>
        <div
          class="log-entry"
          *ngFor="let log of logs"
          [class.running]="log.status === 'running'"
          [class.done]="log.status === 'done'"
          [class.error]="log.status === 'error'">
          <span class="step">Step {{ log.step }}</span>
          <span class="label">{{ log.label }}</span>
          <span class="message">{{ log.message }}</span>
          <span class="time">{{ log.timestamp }}</span>
        </div>
      </div>

      <!-- 擬似iframe表示エリア -->
      <div class="iframe-area" *ngIf="iframeList.length > 0">
        <h3>擬似 iframe 要素（CSS 加工対象）</h3>
        <div
          *ngFor="let info of iframeList"
          class="mock-iframe"
          [id]="info.id"
          [attr.data-title]="info.title">
          <div class="iframe-header">{{ info.title }}</div>
          <div class="iframe-body">
            <p>src: {{ info.src }}</p>
            <p>現在のサイズ: <strong>{{ getElementSize(info.id) }}</strong></p>
          </div>
        </div>
      </div>

      <nav class="nav">
        <a routerLink="/register">← 登録ページ</a>
        <a routerLink="/page1">← page1</a>
      </nav>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 20px;
      max-width: 900px;
      margin: 0 auto;
    }
    h1 {
      color: #333;
      border-bottom: 2px solid #00BCD4;
      padding-bottom: 10px;
    }
    .description {
      background: #e0f7fa;
      padding: 16px 20px;
      border-radius: 8px;
      border-left: 4px solid #00BCD4;
      margin-bottom: 20px;
      ol { margin: 8px 0 0 20px; padding: 0; li { margin: 4px 0; } }
    }
    .operator-selector {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
      h3 { margin-top: 0; color: #00BCD4; }
      .buttons {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 12px;
        button {
          padding: 10px 16px;
          border: 2px solid #ddd;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          text-align: center;
          line-height: 1.6;
          small { color: #888; font-size: 11px; }
          &:hover { border-color: #00BCD4; }
          &.active { border-color: #00BCD4; background: #e0f7fa; font-weight: bold; }
        }
      }
      .operator-desc p { margin: 0; font-size: 14px; color: #444; }
    }
    .action-area {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }
    .btn-run {
      padding: 12px 28px;
      background: #00BCD4;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 15px;
      &:hover:not(:disabled) { background: #0097A7; }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .btn-reset {
      padding: 12px 20px;
      background: #607D8B;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      &:hover:not(:disabled) { background: #455A64; }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .pipeline-log {
      background: #1e1e1e;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
      h3 { color: #aaa; margin-top: 0; font-size: 14px; }
      .log-entry {
        display: grid;
        grid-template-columns: 60px 140px 1fr 80px;
        gap: 8px;
        padding: 6px 8px;
        border-radius: 4px;
        font-size: 13px;
        font-family: monospace;
        margin-bottom: 4px;
        &.running { background: #1a3a4a; color: #80DEEA; }
        &.done    { background: #1a3a1a; color: #A5D6A7; }
        &.error   { background: #3a1a1a; color: #EF9A9A; }
        .step  { color: #888; }
        .label { font-weight: bold; }
        .time  { color: #666; font-size: 11px; text-align: right; }
      }
    }
    .iframe-area {
      h3 { color: #333; }
      .mock-iframe {
        border: 2px solid #ddd;
        border-radius: 6px;
        margin-bottom: 12px;
        overflow: hidden;
        transition: width 0.4s ease, height 0.4s ease, border-color 0.4s ease;
        width: 400px;
        height: 120px;
        .iframe-header {
          background: #f5f5f5;
          padding: 6px 12px;
          font-weight: bold;
          font-size: 13px;
          color: #555;
          border-bottom: 1px solid #ddd;
        }
        .iframe-body {
          padding: 8px 12px;
          p { margin: 4px 0; font-size: 12px; color: #666; }
          strong { color: #333; }
        }
      }
    }
    .nav {
      display: flex;
      gap: 10px;
      margin-top: 30px;
      a {
        padding: 10px 20px;
        background: #607D8B;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        &:hover { background: #455A64; }
      }
    }
  `]
})
export class IframePipelineComponent implements OnInit, OnDestroy {

  private el = inject(ElementRef);

  // ─── 状態管理 ───────────────────────────────────────────────
  selectedOperator: 'concatMap' | 'mergeMap' | 'switchMap' = 'concatMap';
  isRunning = false;
  logs: PipelineLog[] = [];
  iframeList: IframeInfo[] = [];

  /** コンポーネント破棄時にストリームを停止するためのSubject */
  private destroy$ = new Subject<void>();

  ngOnInit(): void {}

  ngOnDestroy(): void {
    // takeUntil(this.destroy$) と組み合わせて購読を全て解除
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── メイン処理 ─────────────────────────────────────────────

  runPipeline(): void {
    this.reset();
    this.isRunning = true;

    // ─────────────────────────────────────────────────────────
    // Step 1: 擬似APIでiframeリストを取得
    //   of(MOCK_IFRAME_LIST) → 即値を流すObservable
    //   delay(800)           → API遅延を模擬
    // ─────────────────────────────────────────────────────────
    this.fetchIframeList$()
      .pipe(

        // Step 1 完了後: リストをDOMに反映し、各要素を個別のストリームとして処理
        tap(list => {
          this.iframeList = list;
          this.addLog(1, 'API取得', `${list.length}件のiframe情報を取得`, 'done');
        }),

        // ─────────────────────────────────────────────────────
        // Step 2: リスト(配列) → 各要素を個別に処理するストリームへ変換
        //
        // switchMap / concatMap / mergeMap の違いがここに現れる
        //   concatMap : 1件ずつ完了を待って次へ（順序保証）
        //   mergeMap  : 全件並列で同時処理（順序不定）
        //   switchMap : 新しい値が来たら前をキャンセル（今回は配列1件なので差異なし）
        //               ※ switchMap はボタン連打などで真価が出る
        // ─────────────────────────────────────────────────────
        switchMap(list => {
          // from(配列) で配列の各要素を1つずつ emit する Observable に変換
          const source$ = from(list).pipe(
            this.applyFlatMapOperator()
          );
          return source$;
        }),

        takeUntil(this.destroy$),

        finalize(() => {
          this.isRunning = false;
          this.addLog(99, '完了', 'パイプライン処理が終了しました', 'done');
        })
      )
      .subscribe();
  }

  // ─── 各ステップのObservable定義 ──────────────────────────────

  /**
   * Step 1: 擬似API — iframeリストを返す
   * 実際のSupersetであれば HttpClient.get<IframeInfo[]>('/api/iframes') に相当
   */
  private fetchIframeList$(): Observable<IframeInfo[]> {
    this.addLog(1, 'API取得', 'iframeリストを取得中...', 'running');
    return of(MOCK_IFRAME_LIST).pipe(
      delay(800) // APIレイテンシの擬似
    );
  }

  /**
   * Step 2: DOM要素の存在確認
   * 実際のSupersetではiframeのload完了をMutationObserverで待つ処理に相当
   *
   * ここでは Angular の変更検知サイクル後に要素が存在するか確認し、
   * 存在しなければ timer でリトライする処理を Observable として表現する
   */
  private waitForElement$(info: IframeInfo): Observable<{ info: IframeInfo; el: HTMLElement }> {
    this.addLog(2, 'DOM確認', `[${info.title}] 要素の存在を確認中...`, 'running');

    // timer(0, 100) : 0ms後に開始し100msごとにリトライするObservable
    return timer(0, 100).pipe(
      map(() => this.el.nativeElement.querySelector(`#${info.id}`) as HTMLElement | null),
      filter((element): element is HTMLElement => element !== null),
      tap(element => {
        this.addLog(2, 'DOM確認', `[${info.title}] 要素を確認 ✓`, 'done');
      }),
      // 最初に見つかった1件だけ流して完了（take(1)相当をfilter後に自動で止める）
      map(element => ({ info, el: element })),
      // 最初の1件のみ取得したら完了
      switchMap(result => of(result)),
    );
  }

  /**
   * Step 3: CSS加工
   * 取得した要素にwidthとheightとborderを適用する
   * delayで加工タイミングをずらしてアニメーションが見えるようにしている
   */
  private applyStyles$(payload: { info: IframeInfo; el: HTMLElement }): Observable<IframeInfo> {
    const { info, el } = payload;
    this.addLog(3, 'CSS加工', `[${info.title}] width:${info.targetWidth}px height:${info.targetHeight}px を適用中...`, 'running');

    return of(null).pipe(
      delay(600), // 加工アニメーションが見えるように意図的に遅らせる
      tap(() => {
        // ─── 実際のCSS加工 ─────────────────────────────
        el.style.width        = `${info.targetWidth}px`;
        el.style.height       = `${info.targetHeight}px`;
        el.style.borderColor  = '#00BCD4';
        el.style.borderWidth  = '3px';
        el.style.transition   = 'all 0.4s ease';
        // ──────────────────────────────────────────────
        this.addLog(3, 'CSS加工', `[${info.title}] 適用完了 ✓`, 'done');
      }),
      map(() => info)
    );
  }

  // ─── オペレーター選択ロジック ────────────────────────────────

  /**
   * 選択されたオペレーターを返す高階関数
   *
   * concatMap / mergeMap / switchMap の違いをここで切り替える。
   * 各オペレーターは「Observable を返す関数」を受け取り、
   * 内側のObservableの購読戦略が異なる。
   */
  private applyFlatMapOperator() {
    // Step 2 + Step 3 を1つのパイプラインとして表現
    const processOne$ = (info: IframeInfo) =>
      this.waitForElement$(info).pipe(
        // take(1)で最初の確認結果だけ取り、次のステップへ
        switchMap(payload => this.applyStyles$(payload)),
        catchError(err => {
          this.addLog(99, 'エラー', `[${info.title}] ${err}`, 'error');
          return EMPTY; // エラーが起きても全体ストリームを止めない
        })
      );

    switch (this.selectedOperator) {
      case 'concatMap':
        // 前の処理が完了してから次へ → ログが1件ずつ順番に進む
        return concatMap((info: IframeInfo) => processOne$(info));

      case 'mergeMap':
        // 全件同時並列 → ログが入り乱れる
        return mergeMap((info: IframeInfo) => processOne$(info));

      case 'switchMap':
        // 新しい値が来たら前をキャンセル → 最後のiframeしか処理されない
        return switchMap((info: IframeInfo) => processOne$(info));
    }
  }

  // ─── ユーティリティ ──────────────────────────────────────────

  private addLog(step: number, label: string, message: string, status: PipelineLog['status']): void {
    const now = new Date();
    const timestamp = `${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}.${now.getMilliseconds().toString().padStart(3,'0')}`;
    this.logs.push({ step, label, message, status, timestamp });
  }

  getElementSize(id: string): string {
    const el = this.el.nativeElement.querySelector(`#${id}`) as HTMLElement | null;
    if (!el) return '未取得';
    const w = el.style.width || '400px(初期値)';
    const h = el.style.height || '120px(初期値)';
    return `${w} × ${h}`;
  }

  reset(): void {
    this.logs = [];
    this.iframeList = [];
  }
}
