import { useId } from 'react'
import type { CheckResult, McqQuestion } from '../engine'
import { Cross, Tick } from './Marks'
import { MathText } from './MathText'

const LETTERS = ['A', 'B', 'C', 'D', 'E']

interface ChoiceListProps {
  question: McqQuestion
  selectedId: string | null
  /** Leave out to show the list read-only. */
  onSelect?: (choiceId: string) => void
  /**
   * After checking, the chosen row is marked right or wrong. A wrong answer
   * never reveals the right row: the student tries again, with hints.
   */
  result?: CheckResult | null
}

/** Paper 01 options as ruled rows. The whole row is the touch target. */
export function ChoiceList({ question, selectedId, onSelect, result }: ChoiceListProps) {
  const name = useId()
  const locked = Boolean(result) || !onSelect
  return (
    <fieldset className="choices" disabled={locked}>
      <legend className="visually-hidden">Choose one answer</legend>
      {question.choices.map((choice, i) => {
        const chosen = choice.id === selectedId
        const state = chosen ? (result ? (result.correct ? 'correct' : 'wrong') : 'selected') : undefined
        return (
          <label key={choice.id} className="choice" data-state={state}>
            <input
              type="radio"
              name={name}
              value={choice.id}
              checked={chosen}
              onChange={() => onSelect?.(choice.id)}
            />
            <span className="choice__letter">({LETTERS[i]})</span>
            <span className="choice__text">
              <MathText text={choice.text} />
            </span>
            <span className="choice__mark">
              {state === 'correct' && <Tick />}
              {state === 'wrong' && <Cross />}
            </span>
          </label>
        )
      })}
    </fieldset>
  )
}
