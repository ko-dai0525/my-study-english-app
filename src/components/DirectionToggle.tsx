import type { Direction } from '../types'

interface Props {
  direction: Direction
  onChange: (direction: Direction) => void
}

export function DirectionToggle({ direction, onChange }: Props) {
  return (
    <div className="direction-toggle" role="group" aria-label="出題方向">
      <button
        type="button"
        className={direction === 'enToJa' ? 'active' : ''}
        onClick={() => onChange('enToJa')}
      >
        英語 → 意味
      </button>
      <button
        type="button"
        className={direction === 'jaToEn' ? 'active' : ''}
        onClick={() => onChange('jaToEn')}
      >
        意味 → 英語
      </button>
    </div>
  )
}
