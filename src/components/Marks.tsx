// The teacher's marks, drawn as pen strokes. With reduced motion switched on,
// they appear already drawn.

export function Tick({ label = 'Correct' }: { label?: string }) {
  return (
    <svg className="mark mark--tick" viewBox="0 0 24 24" role="img" aria-label={label}>
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  )
}

export function Cross({ label = 'Not correct' }: { label?: string }) {
  return (
    <svg className="mark mark--cross" viewBox="0 0 24 24" role="img" aria-label={label}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  )
}

/** The only use of gold: the moment a node is mastered. */
export function MasterySeal({ children = 'Mastered' }: { children?: string }) {
  return (
    <span className="seal">
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="18" />
        <path d="M16 24.5l5.5 5.5L32 19" />
      </svg>
      {children}
    </span>
  )
}
