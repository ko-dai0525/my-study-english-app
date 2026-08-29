import { useEffect, useMemo, useState } from 'react'
import type { WordEntry } from './types'
import { loadWords, saveWords } from './storage'
import { WordListTab } from './components/WordListTab'
import { CardTab } from './components/CardTab'
import { QuizTab } from './components/QuizTab'

type Tab = 'list' | 'card' | 'quiz'

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'list', icon: '📝', label: '一覧' },
  { id: 'card', icon: '🃏', label: 'カード' },
  { id: 'quiz', icon: '✍️', label: 'クイズ' },
]

export default function App() {
  const [words, setWords] = useState<WordEntry[]>(loadWords)
  const [tab, setTab] = useState<Tab>('list')
  // アーカイブ済みはカード・クイズの学習対象から外す
  const activeWords = useMemo(() => words.filter((w) => !w.archived), [words])

  useEffect(() => {
    saveWords(words)
  }, [words])

  return (
    <div className="app">
      <header className="app-header">
        <h1>My English Study 📚</h1>
      </header>
      <main className="app-main">
        {tab === 'list' && <WordListTab words={words} setWords={setWords} />}
        {tab === 'card' && <CardTab words={activeWords} />}
        {tab === 'quiz' && <QuizTab words={activeWords} setWords={setWords} />}
      </main>
      <nav className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab-button${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="tab-icon">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
