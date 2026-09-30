import { describe, expect, it } from 'vitest'
import { isMastered, MIN_ATTEMPTS_FOR_MASTERY, nodeStatus, thetaForThreshold, thresholdFor, TIER_THRESHOLDS } from '../mastery'
import { recordAnswer } from '../progress'
import type { NodeState, TreeNode } from '../types'
import { node } from './fixtures'

function answersToMaster(target: TreeNode): number {
  let state: NodeState | undefined
  for (let n = 1; n <= 50; n++) {
    const outcome = recordAnswer({ node: target, state, itemDifficulty: 0, correct: true, attemptNumber: 1, hintsSeen: 0, now: 0 })
    state = outcome.state
    if (outcome.becameMastered) return n
  }
  return Infinity
}

describe('tier thresholds', () => {
  it('match the brief: roots 70, stems 65, branches 60, nodes 55', () => {
    expect(TIER_THRESHOLDS).toEqual({ root: 0.7, stem: 0.65, branch: 0.6, node: 0.55 })
  })

  it('can be overridden per node', () => {
    expect(thresholdFor({ tier: 'root' })).toBe(0.7)
    expect(thresholdFor({ tier: 'root', masteryThreshold: 0.8 })).toBe(0.8)
  })

  it('translate into the skill needed on a typical item', () => {
    expect(thetaForThreshold(0.7)).toBeCloseTo(0.847, 3)
    expect(thetaForThreshold(0.55)).toBeCloseTo(0.201, 3)
    expect(thetaForThreshold(0.5)).toBe(0)
  })
})

describe('isMastered', () => {
  it('needs the minimum number of answers, however high the estimate', () => {
    const root = node('R1')
    expect(isMastered({ theta: 3, attempts: MIN_ATTEMPTS_FOR_MASTERY - 1 }, root)).toBe(false)
    expect(isMastered({ theta: 3, attempts: MIN_ATTEMPTS_FOR_MASTERY }, root)).toBe(true)
  })

  it('compares the typical-item chance with the tier threshold', () => {
    const root = node('R1')
    expect(isMastered({ theta: 0.84, attempts: 10 }, root)).toBe(false)
    expect(isMastered({ theta: 0.85, attempts: 10 }, root)).toBe(true)
  })
})

describe('nodeStatus', () => {
  it('reads not started, learning or mastered', () => {
    const stem = node('S1')
    expect(nodeStatus(undefined, stem)).toBe('not-started')
    expect(nodeStatus({ theta: 0.2, attempts: 2 }, stem)).toBe('learning')
    expect(nodeStatus({ theta: 1, attempts: 8 }, stem)).toBe('mastered')
  })
})

describe('pace of mastery for a new student answering medium items correctly', () => {
  it('asks more of foundations than of higher nodes', () => {
    expect(answersToMaster(node('R1'))).toBe(7)
    expect(answersToMaster(node('S1'))).toBe(5)
    expect(answersToMaster(node('B1'))).toBe(5)
    expect(answersToMaster(node('N1'))).toBe(5)
  })
})
