Root Inc. サイト 第8回 v2（デザイン刷新 ＋ 動画の枠線除去 ＋ マーケティングページ白化の確実化）

■ v2 での修正
- TOP動画：元動画の外周1〜2pxに暗い縁が焼き込まれていたため、縁を切り落として再エンコード（白も純白に補正）。
  → 動画と背景の境目の枠線が消えます。ファイル名は同じ、HTML側の参照は ?v=4 に更新。
- マーケティング戦略パートナー（/service/ad）：白ベース化をページ内のCSSに直接組み込み（theme.css 未反映でも白になります）。
  ファーストビュー（動画の上）と最終CTA帯のみ黒を維持。本文・カードは黒文字／白背景に。

■ アップロードするファイル（zipの中身をそのままリポジトリ直下に上書き）17ファイル
assets/site/css/theme.css          ← 新規（前回未反映なら必ず）
assets/site/js/mtg.js
assets/site/video/intro_pc.mp4     ← 上書き（枠線なし版）
assets/site/video/intro_pc.webm
assets/site/video/intro_sp.mp4
assets/site/video/intro_sp.webm
index.html
service.html
service/ad.html
service/hr.html
mission.html
news.html
news/20261001-establishment.html
company.html
contact.html
mtg.html
sitemap.xml

■ 確認
- 反映後はシークレットウィンドウ、またはキャッシュ削除後に確認してください。
- 現在 https://www.root-biz.com/assets/site/css/theme.css が 404 のため、前回zipの theme.css が未反映の可能性があります。
  このzipに同梱していますので、一緒に上げてください（ボタンのホバー動作・「詳しく見る」ボタン化に必要）。
