import { useRef, useState } from 'react'
import type { WordEntry } from '../types'
import { isWordEntry } from '../storage'
import { speakEnglish } from '../speech'
import { makeId } from '../utils'

interface Props {
  words: WordEntry[]
  setWords: React.Dispatch<React.SetStateAction<WordEntry[]>>
}

export function WordListTab({ words, setWords }: Props) {
  const [term, setTerm] = useState('')
  const [meaning, setMeaning] = useState('')
  const [example, setExample] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setTerm('')
    setMeaning('')
    setExample('')
    setEditingId(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const t = term.trim()
    const m = meaning.trim()
    const ex = example.trim()
    if (!t || !m) return
    if (editingId) {
      setWords((prev) =>
        prev.map((w) =>
          w.id === editingId
            ? { ...w, term: t, meaning: m, example: ex || undefined }
            : w,
        ),
      )
    } else {
      const entry: WordEntry = {
        id: makeId(),
        term: t,
        meaning: m,
        example: ex || undefined,
        createdAt: Date.now(),
        quizCount: 0,
        correctCount: 0,
      }
      setWords((prev) => [entry, ...prev])
    }
    resetForm()
  }

  const startEdit = (word: WordEntry) => {
    setEditingId(word.id)
    setTerm(word.term)
    setMeaning(word.meaning)
    setExample(word.example ?? '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const remove = (word: WordEntry) => {
    if (!window.confirm(`「${word.term}」を削除しますか？`)) return
    if (editingId === word.id) resetForm()
    setWords((prev) => prev.filter((w) => w.id !== word.id))
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(words, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `english-words-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importJson = async (file: File) => {
    try {
      const data: unknown = JSON.parse(await file.text())
      if (!Array.isArray(data)) throw new Error('not an array')
      const entries = data.filter(isWordEntry)
      if (entries.length === 0) throw new Error('no entries')
      setWords((prev) => {
        const map = new Map(prev.map((w) => [w.id, w]))
        for (const entry of entries) map.set(entry.id, entry)
        return [...map.values()].sort((a, b) => b.createdAt - a.createdAt)
      })
      window.alert(`${entries.length}件の単語を読み込みました✨`)
    } catch {
      window.alert(
        'ファイルを読み込めませんでした。エクスポートしたJSONファイルを選択してください。',
      )
    }
  }

  const q = query.trim().toLowerCase()
  const filtered = q
    ? words.filter(
        (w) =>
          w.term.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q),
      )
    : words

  return (
    <div className="stack">
      <form className="card form" onSubmit={handleSubmit}>
        <h2>{editingId ? '✏️ 単語を編集' : '➕ 単語・熟語を登録'}</h2>
        <label>
          英語（単語・熟語）
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="例: look forward to"
            required
          />
        </label>
        <label>
          意味
          <input
            type="text"
            value={meaning}
            onChange={(e) => setMeaning(e.target.value)}
            placeholder="例: 〜を楽しみにする"
            required
          />
        </label>
        <label>
          例文（任意）
          <input
            type="text"
            value={example}
            onChange={(e) => setExample(e.target.value)}
            placeholder="例: I'm looking forward to seeing you."
          />
        </label>
        <div className="form-actions">
          <button type="submit" className="primary">
            {editingId ? '更新する' : '登録する'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm}>
              キャンセル
            </button>
          )}
        </div>
      </form>

      <div className="list-header">
        <h2>📚 登録済み（{words.length}件）</h2>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 検索（英語・意味）"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="empty">
          {words.length === 0
            ? 'まだ単語がありません。上のフォームから登録してみましょう！'
            : '検索に一致する単語がありません。'}
        </p>
      ) : (
        <ul className="word-list">
          {filtered.map((word) => (
            <li key={word.id} className="card word-item">
              <div className="word-main">
                <div className="word-term-row">
                  <span className="word-term">{word.term}</span>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => speakEnglish(word.term)}
                    aria-label={`${word.term} を発音`}
                  >
                    🔊
                  </button>
                </div>
                <div className="word-meaning">{word.meaning}</div>
                {word.example && (
                  <div className="word-example">{word.example}</div>
                )}
                {word.quizCount > 0 && (
                  <div className="word-stats">
                    クイズ成績: {word.correctCount} / {word.quizCount}（
                    {Math.round((word.correctCount / word.quizCount) * 100)}%）
                  </div>
                )}
              </div>
              <div className="word-actions">
                <button type="button" onClick={() => startEdit(word)}>
                  編集
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => remove(word)}
                >
                  削除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="card data-section">
        <h2>💾 データ管理</h2>
        <p className="note">
          データはこの端末内にのみ保存されます。バックアップとして定期的なエクスポートがおすすめです。
        </p>
        <div className="form-actions">
          <button type="button" onClick={exportJson} disabled={words.length === 0}>
            エクスポート
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()}>
            インポート
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void importJson(file)
              e.target.value = ''
            }}
          />
        </div>
      </div>
    </div>
  )
}
