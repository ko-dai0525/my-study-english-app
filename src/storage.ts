import type { Direction, QuizResult, WordEntry } from './types'

const STORAGE_KEY = 'my-study-english-app/words/v1'
const RESULTS_KEY = 'my-study-english-app/results/v1'

// 履歴が際限なく増えないよう、古いものから捨てる上限
const MAX_RESULTS = 1000

export function isDirection(value: unknown): value is Direction {
  return value === 'enToJa' || value === 'jaToEn'
}

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
    typeof v.correctCount === 'number' &&
    (v.archived === undefined || typeof v.archived === 'boolean')
  )
}

export function isQuizResult(value: unknown): value is QuizResult {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === 'string' &&
    typeof v.wordId === 'string' &&
    isDirection(v.direction) &&
    typeof v.correct === 'boolean' &&
    typeof v.answeredAt === 'number'
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

export function loadResults(): QuizResult[] {
  try {
    const raw = localStorage.getItem(RESULTS_KEY)
    if (!raw) return []
    const data: unknown = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    return data.filter(isQuizResult)
  } catch {
    return []
  }
}

export function saveResults(results: QuizResult[]): void {
  localStorage.setItem(RESULTS_KEY, JSON.stringify(results.slice(-MAX_RESULTS)))
}
