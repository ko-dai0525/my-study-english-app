# My English Study 📚

単語・熟語を登録して「カードめくり」と「クイズ」で学習できる、スマホ向け英語学習 PWA。

**公開URL: https://ko-dai0525.github.io/my-study-english-app/**

- 計画: [PLAN.md](PLAN.md)
- 仕様書: [docs/SPEC.md](docs/SPEC.md)

## 機能

- 📝 単語・熟語の登録（英語＋意味＋例文）、検索、編集、削除。一覧は10件ずつページング
- 📦 覚えた単語のアーカイブ: カード・クイズの出題対象から除外（いつでも戻せる・アーカイブ済み一覧も確認可）
- 🃏 カード学習: シャッフル順にタップでめくる。英語面は発音🔊つき
- ✍️ クイズ: 自由記述 → 期待した答えと自分の回答を見比べて自己採点（⭕❌）
- 💡 例文ヒント: 回答前にも例文を表示。文脈から意味を類推できる（「意味 → 英語」では答えの語を `____` に伏せる）
- 🔖 続きから再開: カード・クイズの出題順と現在位置を保存。タブを移動しても再起動しても解きかけの続きから（一巡するまで同じ問題は出ない）
- 📊 学習記録: 自己採点の結果を単語ごとに保存し、正答率と直近5回の履歴（⭕❌⭕⭕❌）を表示
- 💾 JSON エクスポート／インポートでバックアップ（単語＋判定履歴。旧形式のファイルも読み込める）
- 📴 PWA: ホーム画面に追加すればオフラインでも利用可能

## 開発

```bash
npm install
npm run dev        # 開発サーバー
npm run build      # 型チェック + 本番ビルド（dist/）
npm run preview    # ビルド結果をローカル配信
npm run generate-icons  # public/icons/icon.svg から PNG アイコンを再生成
```

動作確認用のスモークテスト（要 Google Chrome）:

```bash
npm run preview &
node scripts/smoke.mjs
```

## デプロイ（CD）

`main` ブランチに push すると GitHub Actions（[.github/workflows/deploy.yml](.github/workflows/deploy.yml)）が自動でビルドして GitHub Pages に公開する。手動実行は Actions タブの workflow_dispatch から。

## スマホで使うには

1. スマホのブラウザで https://ko-dai0525.github.io/my-study-english-app/ を開く
2. 「ホーム画面に追加」する（iOS: 共有 → ホーム画面に追加 / Android: メニュー → アプリをインストール）
3. 以降はオフラインでも起動・学習できる

※ 学習データは端末内（localStorage）にのみ保存される。定期的にエクスポートしてバックアップ推奨。
