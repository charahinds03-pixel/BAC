// Spaced, interleaved review of mastered nodes. See docs/PEDAGOGY.md.

import type { Question, ReviewState, StudentStates } from './types'

export const DAY_MS = 24 * 60 * 60 * 1000

/** Gaps between reviews, in days. After the last one, it repeats. */
export const REVIEW_GAPS_DAYS = [2, 7, 21] as const

function gapMs(stage: number): number {
  const index = Math.min(Math.max(stage, 0), REVIEW_GAPS_DAYS.length - 1)
  return (REVIEW_GAPS_DAYS[index] ?? 2) * DAY_MS
}

/** Called when a node is first mastered: the first review is due in 2 days. */
export function startReview(now: number): ReviewState {
  return { stage: 0, dueAt: now + gapMs(0) }
}

/** A correct review moves to the next, longer gap; a wrong one goes back to 2 days. */
export function advanceReview(review: ReviewState, correct: boolean, now: number): ReviewState {
  if (!correct) return startReview(now)
  const stage = Math.min(review.stage + 1, REVIEW_GAPS_DAYS.length - 1)
  return { stage, dueAt: now + gapMs(stage) }
}

export function isDue(review: ReviewState | undefined, now: number): boolean {
  return review !== undefined && review.dueAt <= now
}

/** Node ids with a review due, most overdue first. */
export function dueForReview(states: StudentStates, now: number): string[] {
  return Object.entries(states)
    .filter(([, s]) => isDue(s?.review, now))
    .sort(([a, x], [b, y]) => (x?.review?.dueAt ?? 0) - (y?.review?.dueAt ?? 0) || a.localeCompare(b))
    .map(([id]) => id)
}

/** The strategy used for interleaving: the item's own tag, or its node. */
export function strategyOf(question: Pick<Question, 'strategy' | 'treeId'>): string {
  return question.strategy ?? question.treeId
}

/**
 * Reorders items so no two in a row share a key (a strategy), whenever that
 * is possible. At each step it takes from the key with the most items left
 * that differs from the previous one. Order within a key is kept.
 */
export function interleave<T>(items: readonly T[], keyOf: (item: T) => string): T[] {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const key = keyOf(item)
    const group = groups.get(key)
    if (group) group.push(item)
    else groups.set(key, [item])
  }
  const order = [...groups.keys()]
  const result: T[] = []
  let previous: string | undefined
  while (result.length < items.length) {
    let best: string | undefined
    for (const key of order) {
      const left = groups.get(key)?.length ?? 0
      if (left === 0 || key === previous) continue
      if (best === undefined || left > (groups.get(best)?.length ?? 0)) best = key
    }
    // Only the previous key has items left, so a repeat cannot be avoided.
    const chosen = best ?? previous
    if (chosen === undefined) break
    const next = groups.get(chosen)?.shift()
    if (next === undefined) break
    result.push(next)
    previous = chosen
  }
  return result
}
