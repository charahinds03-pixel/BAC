import { describe, expect, it } from 'vitest'
import { hintLadder, nextHint } from '../hints'
import { realQuestion } from './fixtures'

const q = realQuestion('M1-NTC-0006')

describe('hint ladder', () => {
  it('runs nudge, strategy, one worked step, then the full worked example', () => {
    const ladder = hintLadder(q, 0)
    expect(ladder.map((r) => r.kind)).toEqual(['nudge', 'strategy', 'worked-step', 'worked-example'])
    expect(ladder[3]?.lines).toEqual(q.workedSolution)
  })

  it('locks the full worked example until two attempts', () => {
    expect(hintLadder(q, 1)[3]?.locked).toBe(true)
    expect(hintLadder(q, 2)[3]?.locked).toBe(false)
  })

  it('opens one rung at a time', () => {
    expect(nextHint(q, 0, 0)?.kind).toBe('nudge')
    expect(nextHint(q, 2, 0)?.kind).toBe('worked-step')
    expect(nextHint(q, 3, 1)).toBeNull()
    expect(nextHint(q, 3, 2)?.kind).toBe('worked-example')
    expect(nextHint(q, 4, 5)).toBeNull()
  })
})
