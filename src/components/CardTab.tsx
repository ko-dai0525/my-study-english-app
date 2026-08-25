import { useState } from 'react'
import type { Direction, WordEntry } from '../types'
import { shuffle } from '../utils'
import { speakEnglish } from '../speech'
import { DirectionToggle } from './DirectionToggle'

export function CardTab({ words }: { words: WordEntry[] }) {
  const [direction, setDirection] = useState<Direction>('enToJa')
  const [deck, setDeck] = useState<WordEntry[]>(() => shuffle(words))
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  if (words.length === 0) {
    return (
      <p className="empty">
        単語がまだありません。「一覧」タブから登録するとカード学習ができます！
      </p>
    )
  }

  const card = deck[index]
  const front = direction === 'enToJa' ? card.term : card.meaning
  const back = direction === 'enToJa' ? card.meaning : card.term

  const move = (delta: number) => {
    setFlipped(false)
    setIndex((prev) => (prev + delta + deck.length) % deck.length)
  }

  const reshuffle = () => {
    setDeck(shuffle(words))
    setIndex(0)
    setFlipped(false)
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
      <DirectionToggle direction={direction} onChange={setDirection} />
      <div className="card-progress">
        {index + 1} / {deck.length}
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
            {direction === 'enToJa' && speakButton(card.term)}
            <span className="flip-hint">タップでめくる</span>
          </div>
          <div className="flip-face back">
            <span className="flip-text">{back}</span>
            {direction === 'jaToEn' && speakButton(card.term)}
            {card.example && <span className="flip-example">{card.example}</span>}
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
