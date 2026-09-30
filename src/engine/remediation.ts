// Remediation: look back, shore up, bring forward. See docs/PEDAGOGY.md.

import { isMastered, thresholdFor, typicalChance } from './mastery'
import type { KnowledgeTree, StudentStates, TreeNode } from './types'

/** Below this predicted chance on a typical item, a student is struggling. */
export const STRUGGLE_CHANCE = 0.4
/** Struggling (and weakness) needs at least this many counted answers. */
export const MIN_ATTEMPTS_FOR_STRUGGLE = 3

export type RemediationStage =
  /** The target is mastered. */
  | 'mastered'
  /** Not mastered yet, but not struggling. Keep practising the target. */
  | 'on-track'
  /** Practise a weak node with worked examples until it is solid. */
  | 'shore-up'
  /** Probe a prerequisite we know too little about. */
  | 'look-back'
  /** Every prerequisite is solid. Return to the target, starting with a worked example. */
  | 'bring-forward'

export interface RemediationPlan {
  stage: RemediationStage
  /** The node to serve items from next. */
  nodeId: string
  /** A plain-language reason, for the teacher view and for debugging. */
  reason: string
}

export function isStruggling(state: StudentStates[string]): boolean {
  if (!state || state.attempts < MIN_ATTEMPTS_FOR_STRUGGLE) return false
  return typicalChance(state) < STRUGGLE_CHANCE
}

function nodeById(tree: KnowledgeTree, id: string): TreeNode {
  const node = tree.nodes.find((n) => n.id === id)
  if (!node) throw new Error(`Unknown Knowledge Tree node: ${id}`)
  return node
}

/** Every prerequisite below a node, nearest first, with how many steps down it sits. */
export function ancestors(tree: KnowledgeTree, nodeId: string): { id: string; distance: number }[] {
  const found = new Map<string, number>()
  let frontier = [...nodeById(tree, nodeId).prerequisites]
  let distance = 1
  while (frontier.length > 0) {
    const next: string[] = []
    for (const id of frontier) {
      if (found.has(id) || id === nodeId) continue
      found.set(id, distance)
      next.push(...nodeById(tree, id).prerequisites)
    }
    frontier = next
    distance += 1
  }
  return [...found].map(([id, d]) => ({ id, distance: d }))
}

/**
 * Decides where a student working on a target node should practise next.
 *
 * 1. Mastered, or not struggling: stay on the target.
 * 2. Struggling: shore up the weakest prerequisite that has enough evidence
 *    and is below its threshold (the deeper one first on a tie).
 * 3. Otherwise look back at the nearest prerequisite we know too little about.
 * 4. If every prerequisite is mastered, bring the student forward to the target.
 */
export function planRemediation(tree: KnowledgeTree, states: StudentStates, targetId: string): RemediationPlan {
  const target = nodeById(tree, targetId)
  const state = states[targetId]
  if (isMastered(state, target)) {
    return { stage: 'mastered', nodeId: targetId, reason: `${target.title} is mastered and now returns in spaced review.` }
  }
  if (!isStruggling(state)) {
    return { stage: 'on-track', nodeId: targetId, reason: `Keep practising ${target.title}.` }
  }

  const below = ancestors(tree, targetId).map((a) => {
    const node = nodeById(tree, a.id)
    const s = states[a.id]
    return { ...a, node, state: s, chance: typicalChance(s), mastered: isMastered(s, node) }
  })
  if (below.length === 0) {
    return {
      stage: 'shore-up',
      nodeId: targetId,
      reason: `${target.title} is a foundation with nothing beneath it, so practise it directly with worked examples.`,
    }
  }

  const weak = below
    .filter((a) => !a.mastered && (a.state?.attempts ?? 0) >= MIN_ATTEMPTS_FOR_STRUGGLE && a.chance < thresholdFor(a.node))
    .sort((x, y) => x.chance - y.chance || y.distance - x.distance || x.id.localeCompare(y.id))
  const weakest = weak[0]
  if (weakest) {
    return {
      stage: 'shore-up',
      nodeId: weakest.id,
      reason: `${target.title} rests on ${weakest.node.title}, which is not solid yet (${Math.round(weakest.chance * 100)}% predicted).`,
    }
  }

  const unsure = below.filter((a) => !a.mastered).sort((x, y) => x.distance - y.distance || x.id.localeCompare(y.id))
  const nearest = unsure[0]
  if (nearest) {
    return {
      stage: 'look-back',
      nodeId: nearest.id,
      reason: `Check ${nearest.node.title}, a prerequisite of ${target.title} with too little evidence so far.`,
    }
  }

  return {
    stage: 'bring-forward',
    nodeId: targetId,
    reason: `Every prerequisite of ${target.title} is mastered, so return to it, starting with a worked example.`,
  }
}
