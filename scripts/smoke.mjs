import { chromium } from 'playwright-core'

const shots = '/tmp/smoke-shots'
const errors = []

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text())
})
page.on('pageerror', (err) => errors.push(String(err)))

await page.goto('http://localhost:4173')

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
await page.fill('textarea', 'てきとうな回答')
await page.click('button:has-text("回答する")')
await page.waitForSelector('text=期待していた答え')
await page.screenshot({ path: `${shots}/4-quiz-compare.png` })
await page.click('button:has-text("⭕ 正解")')
await page.waitForSelector('text=今回の成績: ⭕ 1 / 1')
console.log('OK: クイズ回答→比較表示→自己判定→成績反映')

// 一覧タブに戻って成績が保存されているか
await page.click('.tab-button:has-text("一覧")')
await page.waitForSelector('text=クイズ成績: 1 / 1（100%）')
await page.screenshot({ path: `${shots}/5-list-stats.png` })
console.log('OK: 学習記録が一覧に反映')

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
