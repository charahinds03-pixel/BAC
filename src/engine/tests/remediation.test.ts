import { describe, expect, it } from 'vitest'
import { ancestors, isStruggling, planRemediation } from '../remediation'
import type { StudentStates } from '../types'
import { tree } from './fixtures'

const struggling = { theta: -1, attempts: 4 }
const solid = { theta: 2, attempts: 10 }

describe('isStruggling', () => {
  it('needs 3 answers and under 40% on a typical item', () => {
    expect(isStruggling(undefined)).toBe(false)
    expect(isStruggling({ theta: -3, attempts: 2 })).toBe(false)
    expect(isStruggling({ theta: -0.5, attempts: 3 })).toBe(true)
    expect(isStruggling({ theta: 0, attempts: 3 })).toBe(false)
  })
})

describe('ancestors', () => {
  it('walks every prerequisite, nearest first', () => {
    expect(ancestors(tree, 'B1')).toEqual([
      { id: 'S3', distance: 1 },
      { id: 'S1', distance: 1 },
      { id: 'R2', distance: 2 },
      { id: 'R1', distance: 2 },
    ])
    expect(ancestors(tree, 'R1')).toEqual([])
  })

  it('rejects an unknown node', () => {
    expect(() => ancestors(tree, 'X9')).toThrow('Unknown Knowledge Tree node: X9')
  })
})

describe('planRemediation', () => {
  it('stays on target while the student is not struggling', () => {
    expect(planRemediation(tree, { B2: { theta: 0, attempts: 3 } }, 'B2').stage).toBe('on-track')
  })

  it('reports a mastered target', () => {
    expect(planRemediation(tree, { B2: solid }, 'B2').stage).toBe('mastered')
  })

  it('shores up a weak prerequisite first', () => {
    const states: StudentStates = { B2: struggling, B1: { theta: -0.8, attempts: 5 }, S1: solid, S3: solid, R1: solid, R2: solid }
    expect(planRemediation(tree, states, 'B2')).toMatchObject({ stage: 'shore-up', nodeId: 'B1' })
  })

  it('picks the weakest prerequisite, and the deeper one on a tie', () => {
    const weaker = { B2: struggling, B1: { theta: -0.2, attempts: 5 }, S1: { theta: -1.5, attempts: 5 } }
    expect(planRemediation(tree, weaker, 'B2').nodeId).toBe('S1')
    const tie = { B2: struggling, B1: { theta: -1, attempts: 5 }, S1: { theta: -1, attempts: 5 } }
    expect(planRemediation(tree, tie, 'B2').nodeId).toBe('S1')
  })

  it('looks back at the nearest prerequisite with too little evidence', () => {
    expect(planRemediation(tree, { B2: struggling }, 'B2')).toMatchObject({ stage: 'look-back', nodeId: 'B1' })
  })

  it('looks back, rather than shoring up, when a prerequisite is strong but not yet confirmed', () => {
    const states = { S1: struggling, R1: { theta: 1.2, attempts: 3 }, R2: solid }
    expect(planRemediation(tree, states, 'S1')).toMatchObject({ stage: 'look-back', nodeId: 'R1' })
  })

  it('brings the student forward once every prerequisite is mastered', () => {
    const states = { B2: struggling, B1: solid, S1: solid, S3: solid, R1: solid, R2: solid }
    expect(planRemediation(tree, states, 'B2')).toMatchObject({ stage: 'bring-forward', nodeId: 'B2' })
  })

  it('shores up a struggling root directly', () => {
    expect(planRemediation(tree, { R2: struggling }, 'R2')).toMatchObject({ stage: 'shore-up', nodeId: 'R2' })
  })
})
