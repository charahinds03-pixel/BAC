import { useId, type ReactNode } from 'react'
import type { Question } from '../engine'
import { MathText } from './MathText'

const PAPER: Record<Question['paper'], string> = { P01: 'Paper 01', P02: 'Paper 02' }
const COUNTRY: Record<Question['country'], string | null> = { BB: 'Barbados', GD: 'Grenada', any: null }

/** "Paper 01 · Barbados · No calculator" */
export function questionMeta(question: Question): string {
  return [PAPER[question.paper], COUNTRY[question.country], question.calculator ? 'Calculator allowed' : 'No calculator']
    .filter(Boolean)
    .join(' · ')
}

interface QuestionSheetProps {
  question: Question
  /** Shown in the margin, like a numbered exercise. */
  number?: number
  /** The answer area: a ChoiceList or an AnswerBox, then any margin notes. */
  children?: ReactNode
}

/** One question on an exercise-book page, with a ruled margin down the left. */
export function QuestionSheet({ question, number, children }: QuestionSheetProps) {
  const stemId = useId()
  return (
    <section className="sheet" aria-labelledby={stemId}>
      {number !== undefined && (
        <span className="sheet__number" aria-hidden="true">
          {number}
        </span>
      )}
      <p className="sheet__meta">{questionMeta(question)}</p>
      <div className="sheet__body">
        <p className="sheet__stem" id={stemId}>
          <MathText text={question.stem} />
        </p>
        {children}
      </div>
    </section>
  )
}
