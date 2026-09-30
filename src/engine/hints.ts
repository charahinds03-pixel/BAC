// The hint ladder: nudge, strategy, one worked step, full worked example.
// The full example unlocks after two attempts. See docs/PEDAGOGY.md.

import type { Question } from './types'

export type HintKind = 'nudge' | 'strategy' | 'worked-step' | 'worked-example'

export const WORKED_EXAMPLE_AFTER_ATTEMPTS = 2

const HINT_KINDS: HintKind[] = ['nudge', 'strategy', 'worked-step']

export interface HintRung {
  /** 1-based position on the ladder. */
  rung: number
  kind: HintKind
  lines: string[]
  locked: boolean
}

/** The whole ladder for an item, with the worked example locked until two attempts. */
export function hintLadder(question: Pick<Question, 'hints' | 'workedSolution'>, attempts: number): HintRung[] {
  const rungs: HintRung[] = question.hints.map((text, i) => ({
    rung: i + 1,
    kind: HINT_KINDS[i] ?? 'worked-step',
    lines: [text],
    locked: false,
  }))
  rungs.push({
    rung: rungs.length + 1,
    kind: 'worked-example',
    lines: question.workedSolution,
    locked: attempts < WORKED_EXAMPLE_AFTER_ATTEMPTS,
  })
  return rungs
}

/** The next rung the student may open, after `opened` rungs, or null if none is available yet. */
export function nextHint(
  question: Pick<Question, 'hints' | 'workedSolution'>,
  opened: number,
  attempts: number,
): HintRung | null {
  const rung = hintLadder(question, attempts)[opened]
  return rung && !rung.locked ? rung : null
}
