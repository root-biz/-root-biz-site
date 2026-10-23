Root Inc. サイト 第9回（問い合わせ送信先の変更／メニュー遷移の不具合修正）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. GAS（日程調整・お問い合わせのスクリプト）の変更 … 1行だけ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
script.google.com で現在のプロジェクト（コード.gs）を開き、
「const CONTACT = {」の中の TO の行を、次のように書き換えて保存してください。

  変更前：  TO: 'info@root-biz.com',           // 問い合わせの送り先
  変更後：  TO: 'rikuya.harada@root-biz.com,kazutaka.kobori@root-biz.com,hirokazu.niimoto@root-biz.com',   // 問い合わせの送り先（3名）

※ カンマ区切りで3名に同時送信されます。返信は「お問い合わせした方」宛てになります（従来どおり）。
※ 保存後、「デプロイ」→「デプロイを管理」→ 鉛筆アイコン →「バージョン：新バージョン」→「デプロイ」。
   ウェブアプリのURLは変わりません（サイト側の変更は不要）。
※ 確認：関数「testContact」を実行すると、3名宛てにテストメールが届きます。
※ 予約（/mtg）の通知先は今回変更していません（小堀さん・原田さんのまま）。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. サイト（GitHub）へのアップロード … site フォルダの中身 21ファイル
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【重要】前回までの一部ファイルが、リポジトリの「一番上の階層」に上がっていました
（theme.css・intro_pc.mp4 など）。そのため本番では theme.css が読み込めず（404）、
動画も枠線ありの旧版のままでした。今回は必ず「フォルダごと」アップロードしてください。

  手順：GitHub のリポジトリ最上部で「Add file」→「Upload files」を開き、
        zip を展開した site フォルダの「中身」（assets・news・service フォルダと .html ファイル）を
        まとめてドラッグ＆ドロップ → Commit。
        ※ フォルダをドラッグすると、assets/site/css/… のような階層が保たれます。

  site/assets/site/css/site.css           SP ヘッダーを画面上部に固定（スクロールしてもメニューを押せる）
  site/assets/site/css/theme.css          新規（白ベース・オレンジボタン・ホバー動作。本番で未反映だったもの）
  site/assets/site/js/site.js             メニューの不具合修正（下記）
  site/assets/site/js/contact.js          コメントの送信先表記のみ
  site/assets/site/video/intro_pc.mp4     枠線なし版（本番は旧版のまま）
  site/assets/site/video/intro_pc.webm
  site/assets/site/video/intro_sp.mp4
  site/assets/site/video/intro_sp.webm
  site/index.html / service.html / service/ad.html / service/hr.html / mission.html / news.html /
  site/news/20261001-establishment.html / recruit.html / company.html / contact.html / mtg.html /
  site/privacy.html / koukoku.html        site.js・site.css の読み込みを更新版に切り替え（?v=9）

  あわせて：
  - プライバシーポリシー・設立のお知らせ記事に掲載していた info@root-biz.com を削除し、
    「お問い合わせフォーム」（/contact）へのリンクに置き換えました。
  - 予約完了画面のひな形に入っていた仮の Meet URL（abc-defg-hij）を消しました（実際の予約では本物のURLが表示されます）。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. リポジトリ最上部から削除してほしいファイル（誤アップロード分・どこからも使われていません）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  20261001-establishment.html  ad.html  hr.html   ← 公開URLとして見えてしまう重複ページ（info@ 記載あり）
  site.js  site.css  theme.css  mtg.js
  intro_pc.mp4  intro_pc.webm  intro_sp.mp4  intro_sp.webm
  README_round8.txt  README_round8_v2.txt  root-biz-site-gtm-updated.zip
  画像：advertising.jpeg app-01.png app-02.png app-03.png app-es.jpeg doc-preview.png flow-01〜07.png
        flow-ad-01〜05.png glyph-r-white.png glyph-t-white.png hr-tech.jpeg issue-case-01.png issue-case-02.png
        issue-case-03.jpeg logo-ch-google.png logo-ch-line.png logo-ch-meta.png logo-ch-tiktok.png logo-ch-x.png
        logo-ch-yahoo.png logo-dark.png logo.png net-apply.png net-referrer.png persona-company.png
        persona-referrer.png persona-seeker.png scope-band.png structure-pull.png structure-push.png
        value-execution.png value-translation.jpeg value-transparency.png
  （GitHub でファイルを開き、右上「…」→「Delete file」。サイトの表示には影響しません）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. メニュー不具合の原因と修正内容
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- SP：マーケティング戦略パートナー／HR TECH のページだけ、メニューの「＋」を押しても開かず、
  他ページへ移動できませんでした（画面下の追従バーにもメニューボタンがあり、開閉処理が二重に登録されて
  打ち消し合っていたため）。→ 1回だけ登録するよう修正。
- SP：ヘッダーがスクロールで画面外に流れ、ページ途中ではメニューを押せませんでした。→ 上部に固定。
- PC：タブレット等のタッチ操作で、メニュー項目を1回タップしても遷移せず、2回目で遷移する挙動を修正
  （マウス以外ではホバー時の展開パネルを出さない）。ブラウザの「戻る」で戻った際に開いたままの
  パネル・メニューも閉じるようにしました。
- 検証：全13ページ × 各メニュー項目の遷移を自動テスト。SP 91/91、PC 全項目で遷移を確認。
