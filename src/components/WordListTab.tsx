import { useMemo, useRef, useState } from 'react'
import type { QuizResult, WordEntry } from '../types'
import { isQuizResult, isWordEntry } from '../storage'
import { speakEnglish } from '../speech'
import { makeId } from '../utils'

interface Props {
  words: WordEntry[]
  setWords: React.Dispatch<React.SetStateAction<WordEntry[]>>
  results: QuizResult[]
  setResults: React.Dispatch<React.SetStateAction<QuizResult[]>>
}

const PAGE_SIZE = 10
// 単語カードに並べる直近の判定数
const HISTORY_SIZE = 5

const EXPORT_VERSION = 2

function historyTitle(result: QuizResult): string {
  const d = new Date(result.answeredAt)
  const when = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  const dir = result.direction === 'enToJa' ? '英語→意味' : '意味→英語'
  return `${when} ${dir} ${result.correct ? '正解' : '不正解'}`
}

export function WordListTab({ words, setWords, results, setResults }: Props) {
  const [term, setTerm] = useState('')
  const [meaning, setMeaning] = useState('')
  const [example, setExample] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'active' | 'archived'>('active')
  const [page, setPage] = useState(1)
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
    // 孤児レコードを残さない（アーカイブでは履歴を保持する）
    setResults((prev) => prev.filter((r) => r.wordId !== word.id))
  }

  const toggleArchive = (word: WordEntry) => {
    if (editingId === word.id) resetForm()
    setWords((prev) =>
      prev.map((w) =>
        // 解除時は undefined にしてキー自体を JSON から消す
        w.id === word.id ? { ...w, archived: !w.archived || undefined } : w,
      ),
    )
  }

  const exportJson = () => {
    const payload = {
      version: EXPORT_VERSION,
      exportedAt: Date.now(),
      words,
      history: results,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
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
      // 配列なら v1（単語のみ）、オブジェクトなら v2（単語＋履歴）
      const rawWords: unknown = Array.isArray(data)
        ? data
        : (data as Record<string, unknown> | null)?.words
      const rawHistory: unknown = Array.isArray(data)
        ? []
        : (data as Record<string, unknown> | null)?.history
      if (!Array.isArray(rawWords)) throw new Error('no words')
      const entries = rawWords.filter(isWordEntry)
      if (entries.length === 0) throw new Error('no entries')
      const history = Array.isArray(rawHistory)
        ? rawHistory.filter(isQuizResult)
        : []
      setWords((prev) => {
        const map = new Map(prev.map((w) => [w.id, w]))
        for (const entry of entries) map.set(entry.id, entry)
        return [...map.values()].sort((a, b) => b.createdAt - a.createdAt)
      })
      if (history.length > 0) {
        setResults((prev) => {
          const map = new Map(prev.map((r) => [r.id, r]))
          for (const result of history) map.set(result.id, result)
          return [...map.values()].sort((a, b) => a.answeredAt - b.answeredAt)
        })
      }
      window.alert(
        history.length > 0
          ? `${entries.length}件の単語と${history.length}件の履歴を読み込みました✨`
          : `${entries.length}件の単語を読み込みました✨`,
      )
    } catch {
      window.alert(
        'ファイルを読み込めませんでした。エクスポートしたJSONファイルを選択してください。',
      )
    }
  }

  // 単語ごとの判定履歴（古い順）
  const historyByWord = useMemo(() => {
    const map = new Map<string, QuizResult[]>()
    for (const r of [...results].sort((a, b) => a.answeredAt - b.answeredAt)) {
      const list = map.get(r.wordId)
      if (list) list.push(r)
      else map.set(r.wordId, [r])
    }
    return map
  }, [results])

  const activeCount = words.filter((w) => !w.archived).length
  const archivedCount = words.length - activeCount
  const inView = words.filter((w) =>
    view === 'archived' ? w.archived : !w.archived,
  )
  const q = query.trim().toLowerCase()
  const filtered = q
    ? inView.filter(
        (w) =>
          w.term.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q),
      )
    : inView
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  // 削除・アーカイブで件数が減っても空ページに取り残されないようクランプ
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

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
          onChange={(e) => {
            setQuery(e.target.value)
            setPage(1)
          }}
          placeholder="🔍 検索（英語・意味）"
        />
      </div>

      <div className="direction-toggle">
        <button
          type="button"
          className={view === 'active' ? 'active' : ''}
          onClick={() => {
            setView('active')
            setPage(1)
          }}
        >
          学習中（{activeCount}）
        </button>
        <button
          type="button"
          className={view === 'archived' ? 'active' : ''}
          onClick={() => {
            setView('archived')
            setPage(1)
          }}
        >
          アーカイブ済み（{archivedCount}）
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="empty">
          {words.length === 0
            ? 'まだ単語がありません。上のフォームから登録してみましょう！'
            : inView.length === 0
              ? view === 'archived'
                ? 'アーカイブ済みの単語はありません。'
                : '学習中の単語はありません。'
              : '検索に一致する単語がありません。'}
        </p>
      ) : (
        <ul className="word-list">
          {pageItems.map((word) => (
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
                {(() => {
                  const history = historyByWord.get(word.id)
                  if (!history || history.length === 0) return null
                  return (
                    <div className="word-history">
                      履歴:{' '}
                      {history.slice(-HISTORY_SIZE).map((r) => (
                        <span
                          key={r.id}
                          className="history-mark"
                          title={historyTitle(r)}
                        >
                          {r.correct ? '⭕' : '❌'}
                        </span>
                      ))}
                    </div>
                  )
                })()}
              </div>
              <div className="word-actions">
                <button type="button" onClick={() => startEdit(word)}>
                  編集
                </button>
                <button type="button" onClick={() => toggleArchive(word)}>
                  {word.archived ? '↩️ 戻す' : '📦 アーカイブ'}
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

      {totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
            disabled={safePage === 1}
            onClick={() => setPage(safePage - 1)}
          >
            ← 前へ
          </button>
          <span className="pagination-info">
            {safePage} / {totalPages} ページ
          </span>
          <button
            type="button"
            disabled={safePage === totalPages}
            onClick={() => setPage(safePage + 1)}
          >
            次へ →
          </button>
        </div>
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
