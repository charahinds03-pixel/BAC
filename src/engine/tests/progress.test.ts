import { describe, expect, it } from 'vitest'
import { countsAsEvidence, recordAnswer, type AnswerEvent } from '../progress'
import { DAY_MS } from '../review'
import { node } from './fixtures'

const base: AnswerEvent = {
  node: node('S1'),
  state: undefined,
  itemDifficulty: 0,
  correct: true,
  attemptNumber: 1,
  hintsSeen: 0,
  now: 1_000,
}

describe('countsAsEvidence', () => {
  it('counts only first answers, and not a correct one after a hint', () => {
    expect(countsAsEvidence(1, 0, true)).toBe(true)
    expect(countsAsEvidence(1, 0, false)).toBe(true)
    expect(countsAsEvidence(2, 0, true)).toBe(false)
    expect(countsAsEvidence(1, 1, true)).toBe(false)
    expect(countsAsEvidence(1, 2, false)).toBe(true)
  })
})

describe('recordAnswer', () => {
  it('updates skill and the answer count on a counted answer', () => {
    const out = recordAnswer(base)
    expect(out.counted).toBe(true)
    expect(out.state.theta).toBeCloseTo(0.2)
    expect(out.state.attempts).toBe(1)
  })

  it('leaves skill alone on a retry', () => {
    const state = { theta: 0.3, attempts: 4 }
    const out = recordAnswer({ ...base, state, attemptNumber: 2 })
    expect(out.counted).toBe(false)
    expect(out.state).toEqual(state)
  })

  it('still lowers skill for a wrong answer after a hint', () => {
    const out = recordAnswer({ ...base, correct: false, hintsSeen: 1 })
    expect(out.counted).toBe(true)
    expect(out.state.theta).toBeLessThan(0)
  })

  it('schedules the first review 2 days after mastery', () => {
    const out = recordAnswer({ ...base, state: { theta: 0.6, attempts: 4 } })
    expect(out.becameMastered).toBe(true)
    expect(out.state.review).toEqual({ stage: 0, dueAt: base.now + 2 * DAY_MS })
  })

  it('moves a correct review to the next gap', () => {
    const state = { theta: 1.2, attempts: 12, review: { stage: 0, dueAt: 0 } }
    const out = recordAnswer({ ...base, state, isReview: true })
    expect(out.state.review).toEqual({ stage: 1, dueAt: base.now + 7 * DAY_MS })
  })

  it('sends a wrong review back to the 2-day gap if the node is still mastered', () => {
    const state = { theta: 2, attempts: 30, review: { stage: 2, dueAt: 0 } }
    const out = recordAnswer({ ...base, state, correct: false, isReview: true })
    expect(out.lostMastery).toBe(false)
    expect(out.state.review).toEqual({ stage: 0, dueAt: base.now + 2 * DAY_MS })
  })

  it('drops the review when a wrong answer costs mastery', () => {
    const state = { theta: 0.64, attempts: 12, review: { stage: 1, dueAt: 0 } }
    const out = recordAnswer({ ...base, state, correct: false, isReview: true })
    expect(out.lostMastery).toBe(true)
    expect(out.state.review).toBeUndefined()
  })
})
