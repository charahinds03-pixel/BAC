import { describe, expect, it } from 'vitest'
import { calibrateDifficulty, kFactor, probabilityCorrect, updateTheta } from '../rating'

describe('probabilityCorrect', () => {
  it('is 50% when skill matches difficulty', () => {
    expect(probabilityCorrect(0, 0)).toBe(0.5)
    expect(probabilityCorrect(1.3, 1.3)).toBe(0.5)
  })

  it('rises with skill and falls with difficulty', () => {
    expect(probabilityCorrect(1, 0)).toBeCloseTo(0.731, 3)
    expect(probabilityCorrect(0, 1)).toBeCloseTo(0.269, 3)
  })
})

describe('kFactor', () => {
  it('starts at 0.4, halves by 10 answers, and never drops below 0.1', () => {
    expect(kFactor(0)).toBe(0.4)
    expect(kFactor(10)).toBe(0.2)
    expect(kFactor(30)).toBe(0.1)
    expect(kFactor(1000)).toBe(0.1)
  })
})

describe('updateTheta', () => {
  it('moves a fresh estimate by 0.2 either way on a medium item', () => {
    expect(updateTheta(0, 0, 0, true)).toBeCloseTo(0.2)
    expect(updateTheta(0, 0, 0, false)).toBeCloseTo(-0.2)
  })

  it('moves more for a surprise than for an expected result', () => {
    const hardRight = updateTheta(0, 0, 1, true) - 0
    const easyRight = updateTheta(0, 0, -1, true) - 0
    expect(hardRight).toBeGreaterThan(easyRight)
    const easyWrong = 0 - updateTheta(0, 0, -1, false)
    const hardWrong = 0 - updateTheta(0, 0, 1, false)
    expect(easyWrong).toBeGreaterThan(hardWrong)
  })

  it('settles as answers build up', () => {
    const early = updateTheta(0, 0, 0, true)
    const late = updateTheta(0, 40, 0, true)
    expect(late).toBeLessThan(early)
  })
})

describe('calibrateDifficulty', () => {
  it('waits for 50 answers', () => {
    expect(calibrateDifficulty(Array.from({ length: 49 }, () => ({ theta: 0, correct: true })))).toBeNull()
  })

  it('recovers the true difficulty from students of known skill', () => {
    const trueB = 1
    const responses: { theta: number; correct: boolean }[] = []
    for (let theta = -2; theta <= 2; theta += 0.5) {
      const right = Math.round(probabilityCorrect(theta, trueB) * 200)
      for (let i = 0; i < 200; i++) responses.push({ theta, correct: i < right })
    }
    expect(calibrateDifficulty(responses)).toBeCloseTo(trueB, 1)
  })

  it('stays between -4 and 4 when everyone gets it right or wrong', () => {
    const all = (correct: boolean) => Array.from({ length: 60 }, () => ({ theta: 0, correct }))
    expect(calibrateDifficulty(all(true))).toBe(-4)
    expect(calibrateDifficulty(all(false))).toBe(4)
  })
})
