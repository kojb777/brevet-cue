Brevet Cue v0.8.16.5

- ROLL選択中キューの道路・形状・信号・標識を拡大・太字化し、走行中の視認性を改善。
- v0.8.16.2の公式フィールド取込、FOCUS表示、GPS音声/音通知、余白修正を維持。

Brevet Cue v0.8.16.2
- FOCUSの備考・時間情報を左詰め表示
- 1行で見切れる項目は末尾「…」を確実に表示し、タップで全文表示
- 公式XLSX/CSVから「形状」「信号」「標識」列を自動検出して保持・FOCUS表示

Brevet Cue v0.8.16.2
- FOCUSの道路・路線名（R250 / K47 / 市道など）を拡大・太字化
- 見切れたFOCUS項目は末尾に「…」を表示し、タップで全文表示
- 公式キューのみ表示モードを維持
- 公式キューの形状・信号・標識フィールドが存在する場合はFOCUS表示対象に追加
- README / アプリ表示 / Service Worker のバージョンを同期

Brevet Cue v0.8.14
- ROLL下部の 前 / FOCUS / 次 を画面最下部に固定
- 前/次操作時にページ全体のスクロール位置を保持
- iOSのscroll anchoringによる画面ずれを抑制
- FOCUS/GPS/公式キュー処理は変更なし

Brevet Cue v0.8.10.6
- ROLL上部: 走行 / 編集 / データ / START の4ボタン
- ROLL下部: 前 / FOCUS / 次
- FOCUS下部: 前 / ROLL / 次
- ROLL専用ボタンを廃止

Brevet Cue v0.8.10.3

FOCUS画面の「次キュー」を大きくし、走行中に一目で確認しやすい専用ブロック表示へ変更しました。
距離と指示を約28〜30pxで強調し、その他のFOCUS情報は従来サイズを維持します。

Official Time = Display Only.
公式XLSX / CSVの「時間」列は原文を保存・表示するだけで、OPEN/CLOSE/参考時間などの意味を自動判定しません。
公式インポート由来の時刻では残時間計算・CLOSE超過警告を行いません。
既にv0.8.5/v0.8.6で統合済みの公式キューも起動時にdisplay-onlyへ移行します。
公式データ統合済みなら保存済みイベント名のDEMOも除去します。
RWGPS表示、XLSX/CSV/GPX、GPS補助、距離補正、手動キュー送り、3秒長押しリセットは継続。

更新: GitHub Pagesの既存4ファイル（index.html / manifest.json / sw.js / README.txt）を上書きしてください。
XLSX読込はSheetJS 0.20.3を公式CDNから読み込みます。通信可能な状態で一度アプリを起動してください。
v0.8.10.3
- FOCUS cockpit uses fixed grid slots.
- Official time/info slot remains reserved even when empty.
- Next-cue card uses 32/68 distance/text split.
- Bottom navigation safety spacing retained; short screens fall back to scrolling.


v0.8.10.3: Compact Fixed Focus
- FOCUSはスクロールなしを維持
- v0.8.9の次キュー/GPS/START TIMERを復元
- 各領域を圧縮し、固定位置を維持
- 前/次ボタンの固定領域を確保

v0.8.10.4
- ROLL画面: タイトル / テーマ / 詳細 / 走行・編集・データを上部へ戻しました。
- キュー一覧の下は「←前 / 次→」、そのさらに下は「ROLL / FOCUS / START」の3ボタンだけです。
- FOCUS画面: 下部「←前 / ROLL / 次→」は従来どおり維持します。
- v0.8.10.3のFOCUS上余白圧縮・GPS固定高は維持します。


v0.8.11: ROLLの「詳細」表示を削除。詳細確認はFOCUSに一本化。


v0.8.14: 公式XLSX/CSVプレビューに「新規イベントとして置換」と「現在のキューへ統合」を追加。置換時は旧キュー・GPX・走行タイマーを切り離し、読み込んだ公式キューを新イベントの基準データにする。


v0.8.14
- FOCUSでは公式備考の長文を直接表示しない（原文データは保持）
- 公式の道路列を短い補足として表示
- 備考中の「参考時間 HH:MM」を抽出し「参考 HH:MM」として表示
- 長文備考によるFOCUSレイアウト崩れを防止


v0.8.15: Added Official cues only display filter while preserving existing filters.


v0.8.16.0
- ROLL画面の文字サイズを走行中に読みやすい大きさへ調整。
- 通常キューは行高を維持したまま、距離・方向・指示を拡大。
- 選択中キューはさらに大きく表示し、現在位置を判別しやすくしました。
- コンパクト表示と固定レイアウトは維持しています。


v0.8.16.0
- FOCUSの道路項目を中央揃え、備考を左揃え＋省略記号＋タップ全文表示。
- 公式XLSX/CSVの形状・信号・標識を独立表示。再読込時に保存。
- GPS接近音を追加。通常キュー200m/100m、PC・PHOTO・ARRIVÉE・GOALは500m/100m。右折・左折・チェック系で音型を分離。
- 同一キュー・同一距離帯の重複発音を防止。ルートから150m超では接近音を抑制。


v0.8.16.2
- Fixed stale main-screen version label.
- App version is now sourced from one APP_VERSION constant for the title/header.
- Service Worker cache bumped to brevet-cue-v08161; old caches are deleted on activation.
- Navigation uses network-first caching and reloads once when a new Service Worker takes control.


v0.8.16.2
- BRM1010公式XLSX実ファイルで列位置を確認（形状=B列、信号=C列、ポイント=D列、標識=E列、方角=F列、道路=G列、合計=I列、備考=K列）。
- 公式キュープレビューに道路・形状・信号・標識の実値を表示し、取り込み前に確認可能。
- ROLL選択行に形状・信号・標識を表示。
- FOCUSは道路を中央、形状・信号・標識を中央、備考を左揃え＋省略表示。
- ROLL一覧下に残っていた白い余白を除去。
- GPS接近音（右/左/PC・PHOTO系の音分け、重複防止）を維持。


v0.8.16.4: FOCUSで公式キューの形状・信号・標識を常時表示。値が空でも「—」を表示し、旧データの備考内にラベル付き値が残っている場合は復元表示します。


v0.8.16.5: FOCUSの形状・信号・標識行を固定グリッド内の明示行へ配置。v0.8.16.4で要素が画面外の暗黙行に送られ、overflowで見えなかった問題を修正。
