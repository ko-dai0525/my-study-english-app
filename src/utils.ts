// crypto.randomUUID は HTTPS か localhost でしか使えないため、
// LAN 経由の HTTP アクセス（http://192.168.x.x など）ではフォールバックする
export function makeId(): string {
  return (
    crypto.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  )
}

export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// 空白・大文字小文字・よくある記号の違いを無視して比較するための正規化
export function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:'"()、。！？「」]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// 例文中の対象語（活用形を含む）を ____ に置き換える。
// 「意味 → 英語」の出題で例文をヒントに出すとき、答えの英語が丸見えにならないようにするためのもの。
// term のどれか1語でも例文中に見つからなければ null を返し、呼び出し側は例文自体を出さない
// （答えが半分だけ見えるくらいなら、出さないほうが安全）。
export function maskTerm(example: string, term: string): string | null {
  const targets = term
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w !== '')
  if (targets.length === 0) return null

  const hit = new Set<string>()
  const masked = example.replace(/[A-Za-z']+/g, (word) => {
    const found = targets.find((t) => isSameWord(word.toLowerCase(), t))
    if (found === undefined) return word
    hit.add(found)
    return '____'
  })
  // 1語でも伏せ損ねたら例文ごと諦める
  return hit.size === targets.length ? masked : null
}

// 活用形を語幹のゆるい前方一致で吸収する（look ↔ looking、improve ↔ improved）。
// 短い語は先頭一致だと誤爆する（to が tomorrow に当たる）ので完全一致だけにする。
function isSameWord(a: string, b: string): boolean {
  if (a === b) return true
  if (a.length <= 3 || b.length <= 3) return false
  return a.slice(0, 4) === b.slice(0, 4)
}
