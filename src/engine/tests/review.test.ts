import { describe, expect, it } from 'vitest'
import { advanceReview, DAY_MS, dueForReview, interleave, startReview, strategyOf } from '../review'

describe('review schedule', () => {
  it('runs 2 days, 1 week, 3 weeks, then every 3 weeks', () => {
    let r = startReview(0)
    expect(r).toEqual({ stage: 0, dueAt: 2 * DAY_MS })
    r = advanceReview(r, true, 0)
    expect(r).toEqual({ stage: 1, dueAt: 7 * DAY_MS })
    r = advanceReview(r, true, 0)
    expect(r).toEqual({ stage: 2, dueAt: 21 * DAY_MS })
    r = advanceReview(r, true, 0)
    expect(r).toEqual({ stage: 2, dueAt: 21 * DAY_MS })
  })

  it('goes back to 2 days after a wrong review', () => {
    expect(advanceReview({ stage: 2, dueAt: 0 }, false, 100)).toEqual({ stage: 0, dueAt: 100 + 2 * DAY_MS })
  })

  it('lists due nodes, most overdue first', () => {
    const states = {
      S1: { theta: 1, attempts: 9, review: { stage: 0, dueAt: 50 } },
      R2: { theta: 1, attempts: 9, review: { stage: 1, dueAt: 10 } },
      R1: { theta: 1, attempts: 9, review: { stage: 1, dueAt: 500 } },
      S3: { theta: 0, attempts: 2 },
    }
    expect(dueForReview(states, 100)).toEqual(['R2', 'S1'])
  })
})

describe('interleave', () => {
  const key = (s: string) => s[0] ?? ''
  const repeats = (list: string[]) => list.filter((s, i) => i > 0 && key(s) === key(list[i - 1] ?? '')).length

  it('never puts two items with the same strategy side by side when it can avoid it', () => {
    const out = interleave(['a1', 'a2', 'a3', 'b1', 'b2', 'c1'], key)
    expect(out).toHaveLength(6)
    expect(repeats(out)).toBe(0)
  })

  it('keeps the order within each strategy', () => {
    const out = interleave(['a1', 'a2', 'b1', 'a3', 'b2'], key)
    expect(out.filter((s) => s.startsWith('a'))).toEqual(['a1', 'a2', 'a3'])
  })

  it('keeps unavoidable repeats to a minimum', () => {
    expect(repeats(interleave(['a1', 'a2', 'a3', 'a4', 'b1'], key))).toBe(2)
  })

  it('uses the strategy tag, or the node when there is none', () => {
    expect(strategyOf({ strategy: 'common-denominator', treeId: 'S1' })).toBe('common-denominator')
    expect(strategyOf({ treeId: 'S1' })).toBe('S1')
  })
})
