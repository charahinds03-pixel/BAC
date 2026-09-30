// Mastery thresholds per Knowledge Tree tier. See docs/PEDAGOGY.md.

import { probabilityCorrect } from './rating'
import type { NodeState, Tier, TreeNode } from './types'

/** Predicted chance on a typical item needed to count a node as mastered. */
export const TIER_THRESHOLDS: Record<Tier, number> = {
  root: 0.7,
  stem: 0.65,
  branch: 0.6,
  node: 0.55,
}

/** A "typical" item is a medium one. */
export const TYPICAL_DIFFICULTY = 0

/** Mastery needs at least this many counted answers, so one lucky answer is not enough. */
export const MIN_ATTEMPTS_FOR_MASTERY = 5

export type NodeStatus = 'not-started' | 'learning' | 'mastered'

type NodeRule = Pick<TreeNode, 'tier' | 'masteryThreshold'>

/** The node's own override if it has one, otherwise its tier's threshold. */
export function thresholdFor(node: NodeRule): number {
  return node.masteryThreshold ?? TIER_THRESHOLDS[node.tier]
}

/** The skill (theta) at which the chance on a typical item equals the threshold: ln(t / (1 - t)). */
export function thetaForThreshold(threshold: number): number {
  return Math.log(threshold / (1 - threshold))
}

/** Predicted chance of getting a typical item on this node right. A node with no answers sits at 50%. */
export function typicalChance(state: NodeState | undefined): number {
  return probabilityCorrect(state?.theta ?? 0, TYPICAL_DIFFICULTY)
}

export function isMastered(state: NodeState | undefined, node: NodeRule): boolean {
  if (!state || state.attempts < MIN_ATTEMPTS_FOR_MASTERY) return false
  return typicalChance(state) >= thresholdFor(node)
}

export function nodeStatus(state: NodeState | undefined, node: NodeRule): NodeStatus {
  if (!state || state.attempts === 0) return 'not-started'
  return isMastered(state, node) ? 'mastered' : 'learning'
}
