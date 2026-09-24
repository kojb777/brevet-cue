Brevet Cue v0.8.12
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


v0.8.12: 公式XLSX/CSVプレビューに「新規イベントとして置換」と「現在のキューへ統合」を追加。置換時は旧キュー・GPX・走行タイマーを切り離し、読み込んだ公式キューを新イベントの基準データにする。
