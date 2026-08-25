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
