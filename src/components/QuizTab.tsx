import { useEffect, useMemo, useState } from 'react'
import type { Direction, WordEntry } from '../types'
import { loadQuizSession, reconcileQueue, saveQuizSession } from '../session'
import { normalizeAnswer } from '../utils'
import { speakEnglish } from '../speech'
import { DirectionToggle } from './DirectionToggle'

interface Props {
  words: WordEntry[]
  setWords: React.Dispatch<React.SetStateAction<WordEntry[]>>
}

export function QuizTab({ words, setWords }: Props) {
  const [quiz, setQuiz] = useState(loadQuizSession)
  // 入力中の回答は一時的なものなので永続化しない
  const [answer, setAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const byId = useMemo(() => new Map(words.map((w) => [w.id, w])), [words])
  // 保存された出題順を現在の単語に合わせた派生値を「正」とする。
  // state が古いままでも描画は常に整合が取れる
  const queueIds = useMemo(
    () => reconcileQueue(quiz.queueIds, words),
    [quiz.queueIds, words],
  )
  const index =
    queueIds.length === 0 ? 0 : Math.min(quiz.index, queueIds.length - 1)

  // App.tsx の saveWords と同じく、変更のたび localStorage へ保存
  useEffect(() => {
    saveQuizSession({ ...quiz, queueIds, index })
  }, [quiz, queueIds, index])

  if (words.length === 0) {
    return (
      <p className="empty">
        単語がまだありません。「一覧」タブから登録するとクイズに挑戦できます！
      </p>
    )
  }

  const current = byId.get(queueIds[index])
  if (!current) return null

  const direction = quiz.direction
  const question = direction === 'enToJa' ? current.term : current.meaning
  const expected = direction === 'enToJa' ? current.meaning : current.term
  const matched =
    submitted &&
    normalizeAnswer(answer) !== '' &&
    normalizeAnswer(answer) === normalizeAnswer(expected)

  const changeDirection = (next: Direction) => {
    setQuiz((prev) => ({ ...prev, direction: next }))
    setAnswer('')
    setSubmitted(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  const judge = (correct: boolean) => {
    setWords((prev) =>
      prev.map((w) =>
        w.id === current.id
          ? {
              ...w,
              quizCount: w.quizCount + 1,
              correctCount: w.correctCount + (correct ? 1 : 0),
            }
          : w,
      ),
    )
    // 一巡し終えたら再シャッフルして先頭に戻る
    const done = index + 1 >= queueIds.length
    setQuiz((prev) => ({
      ...prev,
      queueIds: done ? reconcileQueue([], words) : queueIds,
      index: done ? 0 : index + 1,
      asked: prev.asked + 1,
      correct: prev.correct + (correct ? 1 : 0),
    }))
    setAnswer('')
    setSubmitted(false)
  }

  return (
    <div className="stack">
      <DirectionToggle direction={direction} onChange={changeDirection} />
      {quiz.asked > 0 && (
        <div className="session-score">
          今回の成績: ⭕ {quiz.correct} / {quiz.asked}
        </div>
      )}
      <div className="card quiz-question">
        <div className="quiz-label">
          {direction === 'enToJa' ? 'この英語の意味は？' : 'これを英語で言うと？'}
        </div>
        <div className="quiz-term">
          {question}
          {direction === 'enToJa' && (
            <button
              type="button"
              className="icon-button"
              onClick={() => speakEnglish(current.term)}
              aria-label="発音を聞く"
            >
              🔊
            </button>
          )}
        </div>
      </div>

      {!submitted ? (
        <form className="stack" onSubmit={handleSubmit}>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="答えを自由に入力"
            rows={3}
          />
          <button type="submit" className="primary">
            回答する
          </button>
        </form>
      ) : (
        <div className="stack">
          <div className="card compare">
            <div className="compare-row">
              <div className="compare-label">期待していた答え</div>
              <div className="compare-value expected">
                {expected}
                {direction === 'jaToEn' && (
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => speakEnglish(current.term)}
                    aria-label="発音を聞く"
                  >
                    🔊
                  </button>
                )}
              </div>
            </div>
            <div className="compare-row">
              <div className="compare-label">あなたの回答</div>
              <div className="compare-value">
                {answer.trim() || '（未入力）'}
              </div>
            </div>
            {current.example && (
              <div className="compare-row">
                <div className="compare-label">例文</div>
                <div className="compare-value example">{current.example}</div>
              </div>
            )}
            {matched && <div className="match-badge">✨ 一致！</div>}
          </div>
          <p className="note">見比べて、自分で判定しましょう👇</p>
          <div className="judge-buttons">
            <button
              type="button"
              className="judge correct"
              onClick={() => judge(true)}
            >
              ⭕ 正解
            </button>
            <button
              type="button"
              className="judge wrong"
              onClick={() => judge(false)}
            >
              ❌ 不正解
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
