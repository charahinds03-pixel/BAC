import { describe, expect, it } from 'vitest'
import { carShortfall, pickFollowUp, pickNextItem } from '../serve'
import { mcq } from './fixtures'

const items = [
  mcq({ id: 'M1-NTC-9101', car: 'A', difficulty: -1, strategy: 'x' }),
  mcq({ id: 'M1-NTC-9102', car: 'A', difficulty: 0, strategy: 'y' }),
  mcq({ id: 'M1-NTC-9103', car: 'C', difficulty: 0, strategy: 'x' }),
  mcq({ id: 'M1-NTC-9104', car: 'R', difficulty: 1, strategy: 'z' }),
  mcq({ id: 'M1-NTC-9105', car: 'R', difficulty: 0, treeId: 'S2', strategy: 'z' }),
]

describe('carShortfall', () => {
  it('starts at the 30/40/30 targets', () => {
    expect(carShortfall([])).toEqual({ C: 0.3, A: 0.4, R: 0.3 })
  })

  it('goes negative for a tag that has had more than its share', () => {
    const s = carShortfall(['A', 'A', 'A', 'A'])
    expect(s.A).toBeCloseTo(-0.6)
    expect(s.C).toBeCloseTo(0.3)
  })
})

describe('pickNextItem', () => {
  it('serves the most under-served C-A-R tag first', () => {
    const next = pickNextItem(items, { theta: 0, recentCars: ['A', 'A', 'R'], seenIds: new Set() })
    expect(next?.car).toBe('C')
  })

  it('prefers the item nearest a 70% chance of success', () => {
    const next = pickNextItem(items, { theta: 0, recentCars: [], seenIds: new Set() })
    expect(next?.id).toBe('M1-NTC-9101')
  })

  it('avoids repeating the last strategy when it can', () => {
    const next = pickNextItem(items, { theta: 0, recentCars: [], seenIds: new Set(), lastStrategy: 'x' })
    expect(next?.id).toBe('M1-NTC-9102')
  })

  it('uses calibrated difficulty when given one', () => {
    const next = pickNextItem(items, {
      theta: 0,
      recentCars: [],
      seenIds: new Set(),
      difficultyOf: (q) => (q.id === 'M1-NTC-9102' ? -0.85 : q.difficulty),
    })
    expect(next?.id).toBe('M1-NTC-9102')
  })

  it('skips items already seen, and returns null when none are left', () => {
    const seen = new Set(items.map((q) => q.id))
    expect(pickNextItem(items, { theta: 0, recentCars: [], seenIds: seen })).toBeNull()
  })
})

describe('pickFollowUp', () => {
  it('picks a similar item on the same node, same C-A-R tag first', () => {
    const [first, ...rest] = items
    if (!first) throw new Error('no items')
    expect(pickFollowUp(first, rest, new Set())?.id).toBe('M1-NTC-9102')
  })

  it('never picks from another node', () => {
    const r = items[3]
    if (!r) throw new Error('no items')
    expect(pickFollowUp(r, items, new Set())?.treeId).toBe('S1')
  })
})
