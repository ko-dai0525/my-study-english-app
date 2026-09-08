import type { Direction, WordEntry } from './types'
import { isDirection } from './storage'
import { shuffle } from './utils'

const SESSION_KEY = 'my-study-english-app/session/v1'

export interface QuizSession {
  direction: Direction
  queueIds: string[]
  index: number
  asked: number
  correct: number
}

export interface CardSession {
  direction: Direction
  deckIds: string[]
  index: number
}

interface SessionState {
  quiz: QuizSession
  card: CardSession
}

const EMPTY_QUIZ: QuizSession = {
  direction: 'enToJa',
  queueIds: [],
  index: 0,
  asked: 0,
  correct: 0,
}

const EMPTY_CARD: CardSession = { direction: 'enToJa', deckIds: [], index: 0 }

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

function readQuiz(value: unknown): QuizSession {
  if (typeof value !== 'object' || value === null) return EMPTY_QUIZ
  const v = value as Record<string, unknown>
  if (
    !isDirection(v.direction) ||
    !isStringArray(v.queueIds) ||
    typeof v.index !== 'number' ||
    typeof v.asked !== 'number' ||
    typeof v.correct !== 'number'
  ) {
    return EMPTY_QUIZ
  }
  return {
    direction: v.direction,
    queueIds: v.queueIds,
    index: v.index,
    asked: v.asked,
    correct: v.correct,
  }
}

function readCard(value: unknown): CardSession {
  if (typeof value !== 'object' || value === null) return EMPTY_CARD
  const v = value as Record<string, unknown>
  if (
    !isDirection(v.direction) ||
    !isStringArray(v.deckIds) ||
    typeof v.index !== 'number'
  ) {
    return EMPTY_CARD
  }
  return { direction: v.direction, deckIds: v.deckIds, index: v.index }
}

function loadSession(): SessionState {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return { quiz: EMPTY_QUIZ, card: EMPTY_CARD }
    const data: unknown = JSON.parse(raw)
    if (typeof data !== 'object' || data === null) {
      return { quiz: EMPTY_QUIZ, card: EMPTY_CARD }
    }
    const v = data as Record<string, unknown>
    return { quiz: readQuiz(v.quiz), card: readCard(v.card) }
  } catch {
    return { quiz: EMPTY_QUIZ, card: EMPTY_CARD }
  }
}

function saveSession(next: SessionState): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(next))
}

export function loadQuizSession(): QuizSession {
  return loadSession().quiz
}

export function loadCardSession(): CardSession {
  return loadSession().card
}

// クイズとカードは1つのキーに同居するため、片方を書くときは
// もう片方を読み直して保持する
export function saveQuizSession(quiz: QuizSession): void {
  saveSession({ quiz, card: loadSession().card })
}

export function saveCardSession(card: CardSession): void {
  saveSession({ quiz: loadSession().quiz, card })
}

// 保存済みの出題順を現在の単語リストに合わせる。
// 消えた単語（削除・アーカイブ）は除外し、増えた単語はシャッフルして末尾に足す。
// savedIds が空なら shuffle(words) と同じ結果になるので、初回もこれで済む。
export function reconcileQueue(
  savedIds: readonly string[],
  words: readonly WordEntry[],
): string[] {
  const available = new Set(words.map((w) => w.id))
  const kept = savedIds.filter((id) => available.has(id))
  const seen = new Set(kept)
  const added = shuffle(words.filter((w) => !seen.has(w.id))).map((w) => w.id)
  return [...kept, ...added]
}
