Brevet Cue v0.8.7

Official Time = Display Only.
公式XLSX / CSVの「時間」列は原文を保存・表示するだけで、OPEN/CLOSE/参考時間などの意味を自動判定しません。
公式インポート由来の時刻では残時間計算・CLOSE超過警告を行いません。
既にv0.8.5/v0.8.6で統合済みの公式キューも起動時にdisplay-onlyへ移行します。
公式データ統合済みなら保存済みイベント名のDEMOも除去します。
RWGPS表示、XLSX/CSV/GPX、GPS補助、距離補正、手動キュー送り、3秒長押しリセットは継続。

更新: GitHub Pagesの既存4ファイル（index.html / manifest.json / sw.js / README.txt）を上書きしてください。
XLSX読込はSheetJS 0.20.3を公式CDNから読み込みます。通信可能な状態で一度アプリを起動してください。
