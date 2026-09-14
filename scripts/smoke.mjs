import { chromium } from 'playwright-core'

const shots = '/tmp/smoke-shots'
const errors = []

function assert(condition, label) {
  if (condition) {
    console.log(`OK: ${label}`)
  } else {
    console.log(`NG: ${label}`)
    errors.push(`assertion failed: ${label}`)
  }
}

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text())
})
page.on('pageerror', (err) => errors.push(String(err)))

await page.goto('http://localhost:4173/my-study-english-app/')

// 一覧タブ: 単語を2件登録
for (const [term, meaning, example] of [
  ['look forward to', '〜を楽しみにする', "I'm looking forward to seeing you."],
  ['improve', '改善する', ''],
]) {
  await page.fill('input[placeholder*="look forward"]', term)
  await page.fill('input[placeholder*="楽しみにする"]', meaning)
  if (example) await page.fill('input[placeholder*="seeing you"]', example)
  await page.click('button:has-text("登録する")')
}
await page.waitForSelector('text=登録済み（2件）')
await page.screenshot({ path: `${shots}/1-list.png` })
console.log('OK: 一覧タブで2件登録・表示')

// カードタブ: 表示してフリップ
await page.click('.tab-button:has-text("カード")')
await page.waitForSelector('.flip-card')
await page.screenshot({ path: `${shots}/2-card-front.png` })
await page.click('.flip-card')
await page.waitForTimeout(600)
await page.screenshot({ path: `${shots}/3-card-back.png` })
console.log('OK: カードタブ表示＋フリップ')

// クイズタブ: 回答して比較表示 → 自己判定
await page.click('.tab-button:has-text("クイズ")')
await page.waitForSelector('textarea')
const firstQuestion = await page.textContent('.quiz-term')
await page.fill('textarea', 'てきとうな回答')
await page.click('button:has-text("回答する")')
await page.waitForSelector('text=期待していた答え')
await page.screenshot({ path: `${shots}/4-quiz-compare.png` })
await page.click('button:has-text("⭕ 正解")')
await page.waitForSelector('text=今回の成績: ⭕ 1 / 1')
console.log('OK: クイズ回答→比較表示→自己判定→成績反映')

// 2問目に進んでいること（1問目と別の問題）
const secondQuestion = await page.textContent('.quiz-term')
assert(secondQuestion !== firstQuestion, 'クイズが2問目に進んでいる')

// 一覧タブに戻って成績と履歴が保存されているか
await page.click('.tab-button:has-text("一覧")')
await page.waitForSelector('text=クイズ成績: 1 / 1（100%）')
await page.waitForSelector('.word-history:has-text("⭕")')
await page.screenshot({ path: `${shots}/5-list-stats.png` })
console.log('OK: 学習記録と判定履歴が一覧に反映')

// クイズタブに戻っても再シャッフルされず、続きから（Issue #3 の本丸）
await page.click('.tab-button:has-text("クイズ")')
await page.waitForSelector('.quiz-term')
assert(
  (await page.textContent('.quiz-term')) === secondQuestion,
  'タブ移動後もクイズが続きから（再シャッフルされない）',
)
assert(
  (await page.textContent('.session-score'))?.includes('⭕ 1 / 1'),
  'タブ移動後もセッション成績が残っている',
)

// カードタブでも進捗が維持されること
await page.click('.tab-button:has-text("カード")')
await page.waitForSelector('.flip-card')
await page.click('button:has-text("次へ")')
const cardProgress = await page.textContent('.card-progress')
await page.click('.tab-button:has-text("一覧")')
await page.waitForSelector('.word-list')
await page.click('.tab-button:has-text("カード")')
await page.waitForSelector('.flip-card')
assert(
  (await page.textContent('.card-progress')) === cardProgress,
  `タブ移動後もカードの進捗が維持（${cardProgress}）`,
)

// リロードしても復元されること
await page.reload()
await page.click('.tab-button:has-text("クイズ")')
await page.waitForSelector('.quiz-term')
assert(
  (await page.textContent('.quiz-term')) === secondQuestion,
  'リロード後もクイズが続きから',
)
assert(
  (await page.textContent('.session-score'))?.includes('⭕ 1 / 1'),
  'リロード後もセッション成績が残っている',
)
await page.screenshot({ path: `${shots}/6-quiz-resumed.png` })

// 一覧タブに戻す（以降のシナリオのため）
await page.click('.tab-button:has-text("一覧")')
await page.waitForSelector('.word-list')

// アーカイブ → アーカイブ済みビューで確認 → 戻す
await page.click('.word-item:has-text("improve") button:has-text("📦 アーカイブ")')
await page.waitForSelector('button:has-text("学習中（1）")')
await page.click('button:has-text("アーカイブ済み（1）")')
await page.waitForSelector('.word-item:has-text("improve")')
await page.screenshot({ path: `${shots}/7-archived.png` })
await page.click('button:has-text("↩️ 戻す")')
await page.waitForSelector('button:has-text("学習中（2）")')
console.log('OK: アーカイブ→アーカイブ済み表示→戻す')

// 出題時の例文ヒント（Issue #5）
// 出題順はシャッフルなので、出題対象を1件に絞って決定的に検証する
// （直前のシナリオがアーカイブ済みビューのままなので学習中に戻す）
await page.click('button:has-text("学習中（2）")')
await page.click('.word-item:has-text("improve") button:has-text("📦 アーカイブ")')
await page.waitForSelector('button:has-text("学習中（1）")')

// 英語 → 意味: 回答前に例文がそのまま出る
await page.click('.tab-button:has-text("クイズ")')
await page.waitForSelector('.quiz-example')
assert(
  (await page.textContent('.quiz-example'))?.includes('seeing you'),
  '英語 → 意味では回答前に例文がそのまま出る',
)

// 意味 → 英語: 対象語が伏せ字になり、答えの英語が画面に出ない
await page.click('button:has-text("意味 → 英語")')
await page.waitForSelector('.quiz-example')
const maskedHint = (await page.textContent('.quiz-example')) ?? ''
assert(
  maskedHint.includes('____') && !/look|forward/i.test(maskedHint),
  `意味 → 英語では例文の対象語が伏せ字（${maskedHint.trim()}）`,
)
await page.screenshot({ path: `${shots}/8-quiz-example-masked.png` })
await page.click('button:has-text("英語 → 意味")')

// カードの表面にも例文が出る
await page.click('.tab-button:has-text("カード")')
await page.waitForSelector('.flip-card')
assert(
  (await page.textContent('.flip-face.front .flip-example'))?.includes('seeing you'),
  'カードの表面に例文が出る',
)
await page.screenshot({ path: `${shots}/9-card-front-example.png` })

// 例文のない単語（improve）だけにすると例文の行は出ない
await page.click('.tab-button:has-text("一覧")')
await page.waitForSelector('.word-list')
await page.click('button:has-text("アーカイブ済み（1）")')
await page.click('.word-item:has-text("improve") button:has-text("↩️ 戻す")')
await page.waitForSelector('button:has-text("学習中（2）")')
await page.click('button:has-text("学習中（2）")')
await page.click('.word-item:has-text("look forward to") button:has-text("📦 アーカイブ")')
await page.waitForSelector('button:has-text("学習中（1）")')
await page.click('.tab-button:has-text("クイズ")')
await page.waitForSelector('.quiz-term')
assert(
  (await page.locator('.quiz-example').count()) === 0,
  '例文のない単語では例文を出さない',
)
console.log('OK: 出題時の例文ヒント（そのまま表示・伏せ字・例文なし・カード表面）')

// PWA: Service Worker 登録確認
const swCount = await page.evaluate(async () => {
  const regs = await navigator.serviceWorker.getRegistrations()
  return regs.length
})
console.log(swCount > 0 ? 'OK: Service Worker 登録済み' : 'NG: Service Worker 未登録')

if (errors.length > 0) {
  console.log('CONSOLE ERRORS:', errors)
  process.exitCode = 1
} else {
  console.log('OK: コンソールエラーなし')
}
await browser.close()
