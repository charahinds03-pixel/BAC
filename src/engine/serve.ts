// Step 1 of the loop: pick the next item. The caller decides which node to
// serve from (planRemediation, or a due review); this picks the item.

import { CAR_TARGET } from './content'
import { probabilityCorrect, seedDifficulty } from './rating'
import { strategyOf } from './review'
import type { Car, Question } from './types'

/** Items are most useful when the student has about this chance of getting them right. */
export const TARGET_CHANCE = 0.7
/** How many recent items the C-A-R balance looks back over. */
export const CAR_WINDOW = 10

const CARS: Car[] = ['C', 'A', 'R']

/** How far each C-A-R tag is below its target share in the recent items. Positive means under-served. */
export function carShortfall(recent: readonly Car[]): Record<Car, number> {
  const window = recent.slice(-CAR_WINDOW)
  const total = window.length
  const share = (c: Car) => (total === 0 ? 0 : window.filter((x) => x === c).length / total)
  return { C: CAR_TARGET.C - share('C'), A: CAR_TARGET.A - share('A'), R: CAR_TARGET.R - share('R') }
}

export interface PickOptions {
  /** The student's skill on the node being served. */
  theta: number
  /** C-A-R tags of the student's recent items, oldest first. */
  recentCars: readonly Car[]
  /** Items already served in this sitting. */
  seenIds: ReadonlySet<string>
  /** The previous item's strategy, to avoid two in a row. */
  lastStrategy?: string
  /** Calibrated difficulty for an item, when known. Defaults to its content label. */
  difficultyOf?: (question: Question) => number
}

/**
 * Picks the next item from candidates (normally the approved items on one node).
 * 1. The C-A-R tag furthest below its share goes first.
 * 2. Within that tag, prefer a different strategy from the last item.
 * 3. Then the item whose predicted chance is closest to 70%.
 * Returns null when every candidate has been seen.
 */
export function pickNextItem(candidates: readonly Question[], options: PickOptions): Question | null {
  const fresh = candidates.filter((q) => !options.seenIds.has(q.id))
  if (fresh.length === 0) return null
  const shortfall = carShortfall(options.recentCars)
  const available = CARS.filter((c) => fresh.some((q) => q.car === c)).sort((a, b) => shortfall[b] - shortfall[a])
  const car = available[0]
  const difficultyOf = options.difficultyOf ?? ((q: Question) => seedDifficulty(q.difficulty))
  const score = (q: Question) => Math.abs(probabilityCorrect(options.theta, difficultyOf(q)) - TARGET_CHANCE)
  const pool = fresh
    .filter((q) => q.car === car)
    .sort(
      (a, b) =>
        Number(strategyOf(a) === options.lastStrategy) - Number(strategyOf(b) === options.lastStrategy) ||
        score(a) - score(b) ||
        a.id.localeCompare(b.id),
    )
  return pool[0] ?? null
}

/**
 * After a full worked example, the student gets a similar question with no
 * help: same node, preferably the same C-A-R tag, then the same strategy,
 * then the closest difficulty.
 */
export function pickFollowUp(
  item: Question,
  candidates: readonly Question[],
  seenIds: ReadonlySet<string>,
): Question | null {
  const pool = candidates
    .filter((q) => q.treeId === item.treeId && q.id !== item.id && !seenIds.has(q.id))
    .sort(
      (a, b) =>
        Number(b.car === item.car) - Number(a.car === item.car) ||
        Number(strategyOf(b) === strategyOf(item)) - Number(strategyOf(a) === strategyOf(item)) ||
        Math.abs(a.difficulty - item.difficulty) - Math.abs(b.difficulty - item.difficulty) ||
        a.id.localeCompare(b.id),
    )
  return pool[0] ?? null
}
