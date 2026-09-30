// Steps 3 and 4 of the loop: update the skill estimate, then decide whether
// the node is mastered and when it is next reviewed.

import { isMastered } from './mastery'
import { updateTheta } from './rating'
import { advanceReview, startReview } from './review'
import type { NodeState, TreeNode } from './types'

export const NEW_NODE_STATE: NodeState = { theta: 0, attempts: 0 }

export interface AnswerEvent {
  node: TreeNode
  state: NodeState | undefined
  /** The item's difficulty b: its content label, or its calibrated value once it has one. */
  itemDifficulty: number
  correct: boolean
  /** 1 for the first answer to this item, 2 for the second try, and so on. */
  attemptNumber: number
  /** Hint rungs the student opened before giving this answer. */
  hintsSeen: number
  /** True when the item was served as a spaced review. */
  isReview?: boolean
  /** Epoch milliseconds. */
  now: number
}

export interface AnswerOutcome {
  state: NodeState
  /** Whether this answer moved the skill estimate. */
  counted: boolean
  becameMastered: boolean
  lostMastery: boolean
}

/**
 * Only independent answers count as evidence: the first answer to an item,
 * and not a correct one given after opening a hint. Retries are for
 * learning, not measuring.
 */
export function countsAsEvidence(attemptNumber: number, hintsSeen: number, correct: boolean): boolean {
  if (attemptNumber !== 1) return false
  return !(correct && hintsSeen > 0)
}

export function recordAnswer(event: AnswerEvent): AnswerOutcome {
  const before = event.state ?? NEW_NODE_STATE
  const counted = countsAsEvidence(event.attemptNumber, event.hintsSeen, event.correct)
  const wasMastered = isMastered(before, event.node)

  let after: NodeState = counted
    ? {
        ...before,
        theta: updateTheta(before.theta, before.attempts, event.itemDifficulty, event.correct),
        attempts: before.attempts + 1,
      }
    : { ...before }

  const nowMastered = isMastered(after, event.node)
  if (!wasMastered && nowMastered) {
    after = { ...after, review: startReview(event.now) }
  } else if (wasMastered && !nowMastered) {
    after = { theta: after.theta, attempts: after.attempts }
  } else if (nowMastered && event.isReview && counted && before.review) {
    after = { ...after, review: advanceReview(before.review, event.correct, event.now) }
  }

  return {
    state: after,
    counted,
    becameMastered: !wasMastered && nowMastered,
    lostMastery: wasMastered && !nowMastered,
  }
}
