type Props = {
  value: number | null
  onChange?: (v: number | null) => void
}

export default function Stars({ value, onChange }: Props) {
  const v = value ?? 0
  if (!onChange) {
    if (!value) return null
    return (
      <span className="stars" aria-label={`評価 ${value}`}>
        {'★'.repeat(v)}
        <span className="stars-off">{'★'.repeat(5 - v)}</span>
      </span>
    )
  }
  return (
    <span className="stars input" role="radiogroup" aria-label="評価">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={v === n}
          className={n <= v ? 'on' : ''}
          onClick={() => onChange(v === n ? null : n)}
        >
          ★
        </button>
      ))}
    </span>
  )
}
