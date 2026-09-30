import { hintLadder, nextHint, WORKED_EXAMPLE_AFTER_ATTEMPTS, type HintKind, type Question } from '../engine'
import { Button } from './Button'
import { MathText } from './MathText'

export const HINT_NAMES: Record<HintKind, string> = {
  nudge: 'Nudge',
  strategy: 'Strategy',
  'worked-step': 'One worked step',
  'worked-example': 'Worked example',
}

interface HintLadderProps {
  question: Pick<Question, 'hints' | 'workedSolution'>
  /** Attempts so far. The worked example opens after two. */
  attempts: number
  /** How many rungs are open. */
  opened: number
  /** Leave out to show the ladder read-only. */
  onOpenNext?: () => void
}

/** Nudge, strategy, one worked step, full worked example. One rung at a time. */
export function HintLadder({ question, attempts, opened, onOpenNext }: HintLadderProps) {
  const rungs = hintLadder(question, attempts)
  const next = nextHint(question, opened, attempts)
  const allOpen = opened >= rungs.length
  return (
    <div>
      <ol className="ladder">
        {rungs.map((rung, i) => {
          const state = rung.locked ? 'locked' : i < opened ? 'open' : 'closed'
          return (
            <li key={rung.rung} className="rung" data-state={state}>
              <span className="rung__number">{rung.rung}</span>
              <div>
                <span className="rung__name">{HINT_NAMES[rung.kind]}</span>
                {state === 'locked' && (
                  <span className="caption"> opens after {WORKED_EXAMPLE_AFTER_ATTEMPTS} attempts</span>
                )}
                {state === 'open' && (
                  <ul className="rung__lines">
                    {rung.lines.map((line, j) => (
                      <li key={j}>
                        <MathText text={line} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          )
        })}
      </ol>
      {onOpenNext && !allOpen && (
        <Button variant="quiet" onClick={onOpenNext} disabled={!next}>
          {next ? `Open hint ${next.rung}: ${HINT_NAMES[next.kind].toLowerCase()}` : 'The worked example opens after two attempts'}
        </Button>
      )}
    </div>
  )
}
