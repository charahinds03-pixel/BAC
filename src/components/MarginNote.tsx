import type { ReactNode } from 'react'
import { Cross, Tick } from './Marks'

interface MarginNoteProps {
  /** correct: sea. correction: mace. neutral: ink-soft. */
  tone: 'correct' | 'correction' | 'neutral'
  children: ReactNode
  /** Small print under the note, such as the misconception ID in review tools. */
  label?: string
}

/** The teacher's mark beside the work: feedback in words, never colour alone. */
export function MarginNote({ tone, children, label }: MarginNoteProps) {
  return (
    <div className={`note note--${tone}`} role="status">
      {tone !== 'neutral' && (
        <span className="note__mark">{tone === 'correct' ? <Tick /> : <Cross label="Correction" />}</span>
      )}
      <div>
        <p>{children}</p>
        {label && <span className="note__label">{label}</span>}
      </div>
    </div>
  )
}
