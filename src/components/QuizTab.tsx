import { useState } from 'react'
import type { Direction, WordEntry } from '../types'
import { normalizeAnswer, shuffle } from '../utils'
import { speakEnglish } from '../speech'
import { DirectionToggle } from './DirectionToggle'

interface Props {
  words: WordEntry[]
  setWords: React.Dispatch<React.SetStateAction<WordEntry[]>>
}

export function QuizTab({ words, setWords }: Props) {
  const [direction, setDirection] = useState<Direction>('enToJa')
  const [queue, setQueue] = useState<WordEntry[]>(() => shuffle(words))
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [session, setSession] = useState({ asked: 0, correct: 0 })

  if (words.length === 0) {
    return (
      <p className="empty">
        単語がまだありません。「一覧」タブから登録するとクイズに挑戦できます！
      </p>
    )
  }

  const current = queue[index]
  const question = direction === 'enToJa' ? current.term : current.meaning
  const expected = direction === 'enToJa' ? current.meaning : current.term
  const matched =
    submitted &&
    normalizeAnswer(answer) !== '' &&
    normalizeAnswer(answer) === normalizeAnswer(expected)

  const changeDirection = (next: Direction) => {
    setDirection(next)
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
    setSession((s) => ({
      asked: s.asked + 1,
      correct: s.correct + (correct ? 1 : 0),
    }))
    setAnswer('')
    setSubmitted(false)
    if (index + 1 >= queue.length) {
      setQueue(shuffle(words))
      setIndex(0)
    } else {
      setIndex(index + 1)
    }
  }

  return (
    <div className="stack">
      <DirectionToggle direction={direction} onChange={changeDirection} />
      {session.asked > 0 && (
        <div className="session-score">
          今回の成績: ⭕ {session.correct} / {session.asked}
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
