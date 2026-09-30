// The skill rating: an Elo-style model, the same idea chess ratings use.
// src/engine/README.md explains the math in plain language.

import type { Difficulty } from './types'

/** How far one answer can move a brand new estimate. */
export const K_START = 0.4
/** The smallest step, so a skill estimate never freezes. */
export const K_MIN = 0.1
/** After this many answers on a node, K has halved. */
export const K_SETTLE = 10
/** Items are recalibrated once this many students have answered them. */
export const CALIBRATION_MIN_ATTEMPTS = 50

/** The content label (easy -1, medium 0, hard +1) is the starting difficulty. */
export function seedDifficulty(label: Difficulty): number {
  return label
}

/** Predicted chance of a correct answer: p = 1 / (1 + e^-(theta - b)). */
export function probabilityCorrect(theta: number, difficulty: number): number {
  return 1 / (1 + Math.exp(-(theta - difficulty)))
}

/** K shrinks as evidence builds: 0.4 at the start, 0.2 after 10 answers, never below 0.1. */
export function kFactor(attempts: number): number {
  return Math.max(K_MIN, (K_START * K_SETTLE) / (K_SETTLE + Math.max(0, attempts)))
}

/** theta <- theta + K (y - p), with y = 1 for correct and 0 for wrong. */
export function updateTheta(theta: number, attempts: number, difficulty: number, correct: boolean): number {
  const p = probabilityCorrect(theta, difficulty)
  const y = correct ? 1 : 0
  return theta + kFactor(attempts) * (y - p)
}

/**
 * Estimates an item's real difficulty from how students of known skill did
 * on it (a maximum-likelihood fit using Newton's method). Returns null until
 * the item has enough answers to trust. The result is kept between -4 and 4.
 */
export function calibrateDifficulty(
  responses: readonly { theta: number; correct: boolean }[],
  minAttempts = CALIBRATION_MIN_ATTEMPTS,
): number | null {
  if (responses.length < minAttempts || responses.length === 0) return null
  let b = 0
  for (let i = 0; i < 100; i++) {
    let gradient = 0
    let curvature = 0
    for (const r of responses) {
      const p = probabilityCorrect(r.theta, b)
      gradient += p - (r.correct ? 1 : 0)
      curvature += p * (1 - p)
    }
    if (curvature < 1e-9) break
    const step = Math.max(-1, Math.min(1, gradient / curvature))
    b = Math.max(-4, Math.min(4, b + step))
    if (Math.abs(step) < 1e-7) break
  }
  return b
}
