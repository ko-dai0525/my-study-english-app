# My English Study 📚

単語・熟語を登録して「カードめくり」と「クイズ」で学習できる、スマホ向け英語学習 PWA。

- 計画: [PLAN.md](PLAN.md)
- 仕様書: [docs/SPEC.md](docs/SPEC.md)

## 機能

- 📝 単語・熟語の登録（英語＋意味＋例文）、検索、編集、削除
- 🃏 カード学習: シャッフル順にタップでめくる。英語面は発音🔊つき
- ✍️ クイズ: 自由記述 → 期待した答えと自分の回答を見比べて自己採点（⭕❌）
- 📊 学習記録: 自己採点の結果を単語ごとに保存し、正答率を表示
- 💾 JSON エクスポート／インポートでバックアップ
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

## スマホで使うには

1. `dist/` を HTTPS の静的ホスティングに置く（GitHub Pages / Cloudflare Pages / Netlify など、無料枠でOK）
2. スマホのブラウザで開く
3. 「ホーム画面に追加」する（iOS: 共有 → ホーム画面に追加 / Android: メニュー → アプリをインストール）
4. 以降はオフラインでも起動・学習できる

※ 学習データは端末内（localStorage）にのみ保存される。定期的にエクスポートしてバックアップ推奨。
