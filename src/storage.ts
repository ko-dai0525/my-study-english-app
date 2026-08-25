import type { WordEntry } from './types'

const STORAGE_KEY = 'my-study-english-app/words/v1'

export function isWordEntry(value: unknown): value is WordEntry {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === 'string' &&
    typeof v.term === 'string' &&
    typeof v.meaning === 'string' &&
    (v.example === undefined || typeof v.example === 'string') &&
    typeof v.createdAt === 'number' &&
    typeof v.quizCount === 'number' &&
    typeof v.correctCount === 'number'
  )
}

export function loadWords(): WordEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data: unknown = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    return data.filter(isWordEntry)
  } catch {
    return []
  }
}

export function saveWords(words: WordEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(words))
}
