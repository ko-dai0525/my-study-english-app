import { useEffect, useMemo, useState } from 'react'
import type { Direction, WordEntry } from '../types'
import { loadCardSession, reconcileQueue, saveCardSession } from '../session'
import { speakEnglish } from '../speech'
import { DirectionToggle } from './DirectionToggle'

export function CardTab({ words }: { words: WordEntry[] }) {
  const [card, setCard] = useState(loadCardSession)
  // めくった状態は一時的な見た目なので永続化しない（戻ったら表から）
  const [flipped, setFlipped] = useState(false)

  const byId = useMemo(() => new Map(words.map((w) => [w.id, w])), [words])
  // 保存された並びを現在の単語に合わせた派生値を「正」とする。
  // state が古いままでも描画は常に整合が取れる
  const deckIds = useMemo(
    () => reconcileQueue(card.deckIds, words),
    [card.deckIds, words],
  )
  const index = deckIds.length === 0 ? 0 : Math.min(card.index, deckIds.length - 1)

  // App.tsx の saveWords と同じく、変更のたび localStorage へ保存
  useEffect(() => {
    saveCardSession({ ...card, deckIds, index })
  }, [card, deckIds, index])

  if (words.length === 0) {
    return (
      <p className="empty">
        単語がまだありません。「一覧」タブから登録するとカード学習ができます！
      </p>
    )
  }

  const current = byId.get(deckIds[index])
  if (!current) return null

  const direction = card.direction
  const front = direction === 'enToJa' ? current.term : current.meaning
  const back = direction === 'enToJa' ? current.meaning : current.term

  const move = (delta: number) => {
    setFlipped(false)
    setCard((prev) => ({
      ...prev,
      index: (index + delta + deckIds.length) % deckIds.length,
    }))
  }

  const reshuffle = () => {
    setFlipped(false)
    setCard((prev) => ({ ...prev, deckIds: reconcileQueue([], words), index: 0 }))
  }

  const speakButton = (text: string) => (
    <button
      type="button"
      className="icon-button speak-button"
      onClick={(e) => {
        e.stopPropagation()
        speakEnglish(text)
      }}
      aria-label="発音を聞く"
    >
      🔊
    </button>
  )

  return (
    <div className="stack">
      <DirectionToggle
        direction={direction}
        onChange={(next: Direction) =>
          setCard((prev) => ({ ...prev, direction: next }))
        }
      />
      <div className="card-progress">
        {index + 1} / {deckIds.length}
      </div>
      <button
        type="button"
        className={`flip-card${flipped ? ' flipped' : ''}`}
        onClick={() => setFlipped((f) => !f)}
        aria-label="カードをめくる"
      >
        <div className="flip-card-inner">
          <div className="flip-face front">
            <span className="flip-text">{front}</span>
            {direction === 'enToJa' && speakButton(current.term)}
            <span className="flip-hint">タップでめくる</span>
          </div>
          <div className="flip-face back">
            <span className="flip-text">{back}</span>
            {direction === 'jaToEn' && speakButton(current.term)}
            {current.example && (
              <span className="flip-example">{current.example}</span>
            )}
          </div>
        </div>
      </button>
      <div className="card-controls">
        <button type="button" onClick={() => move(-1)}>
          ← 前へ
        </button>
        <button type="button" onClick={reshuffle}>
          🔀 シャッフル
        </button>
        <button type="button" onClick={() => move(1)}>
          次へ →
        </button>
      </div>
    </div>
  )
}
