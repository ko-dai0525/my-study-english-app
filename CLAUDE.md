# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

単語・熟語を登録して「カードめくり」と「クイズ」で学習する、スマホ向け英語学習 PWA。サーバーなし・完全ローカル動作（データは localStorage のみ、発音は Web Speech API）。UI・ドキュメントは日本語。

## コマンド

```bash
npm run dev             # 開発サーバー（Vite）
npm run build           # 型チェック（tsc -b）+ 本番ビルド → dist/
npm run preview         # ビルド結果を localhost:4173 で配信
npm run generate-icons  # public/icons/icon.svg から PNG アイコンを再生成
```

テストはスモークテストのみ（ユニットテスト・lint は未導入）。要 Google Chrome、事前に build と preview 起動が必要:

```bash
npm run build
npm run preview &
node scripts/smoke.mjs   # Playwright で3タブの主要フローを検証、/tmp/smoke-shots にスクショ保存
```

## ドキュメント同期（重要）

- **docs/SPEC.md が正式な仕様書**。機能を変更・追加したら SPEC.md も必ず同時に更新する（SPEC.md 自体にもその旨が明記されている）。
- PLAN.md は当初の計画・意思決定の記録。README.md はユーザー向け概要。

## アーキテクチャ

- React 19 + TypeScript + Vite。PWA 化は vite-plugin-pwa（`registerType: 'autoUpdate'`、manifest は vite.config.ts 内に定義）。
- 状態管理はライブラリなし。`src/App.tsx` が単語配列 `WordEntry[]` を useState で持ち、変更のたび useEffect で localStorage に保存。3タブ（一覧/カード/クイズ）を条件レンダリングで切替え、各タブコンポーネント（`src/components/`）に words / setWords を props で渡す。
- データモデルは `src/types.ts` の `WordEntry` のみ。学習記録（quizCount / correctCount）も同じオブジェクトに持つ。
- `src/storage.ts`: localStorage キーは `my-study-english-app/words/v1`。読み込み時に `isWordEntry` で各要素をランタイム検証し、不正データは黙って除外する。JSON インポート機能もこの型ガードを共用。スキーマを変えるときはキーのバージョンと SPEC.md のデータモデル節に注意。
- `src/speech.ts`: `speechSynthesis` で英語読み上げ。iOS Safari はユーザー操作起点でしか再生できないため、必ずボタンのタップハンドラから呼ぶこと。
- クイズは自動採点しない設計（自由記述 → 期待答と並べて表示 → ユーザーが⭕❌を自己判定）。`src/utils.ts` の `normalizeAnswer` は「一致！」バッジ表示の補助のみに使う。

## 変更時の注意

- smoke.mjs はプレースホルダー文字列・ボタンのラベル・表示テキスト（例:「登録済み（2件）」「⭕ 正解」）に依存したセレクタを使っている。UI 文言を変えたら scripts/smoke.mjs も追従させる。
