import { describe, expect, it } from 'vitest'
import { checkTutorMessage } from '../tutorGuard'
import { realQuestion } from './fixtures'

const kemar = realQuestion('M1-NTC-0006') // 540 ÷ 45 = 12, option a
const divide = realQuestion('M1-NTC-0005') // 2/3 ÷ 4 = 1/6
const simplify = realQuestion('M1-NTC-0001') // 18/24 = 3/4
const order = realQuestion('M1-NTC-0004')

describe('checkTutorMessage', () => {
  it("passes the brief's example tutor message", () => {
    const message = 'You took 45 away from 540 once. What happens if you keep taking 45 away until nothing is left?'
    expect(checkTutorMessage(message, kemar)).toEqual({ ok: true, reasons: [] })
  })

  it('catches the answer in digits, words and units', () => {
    expect(checkTutorMessage('So the answer is 12.', kemar).reasons).toContain('states-answer')
    expect(checkTutorMessage('It takes him twelve weeks.', kemar).reasons).toContain('states-answer')
    expect(checkTutorMessage('That is 12 weeks of saving.', kemar).reasons).toContain('states-answer')
  })

  it('catches fractions in any equivalent form, including words and KaTeX', () => {
    expect(checkTutorMessage('Each share is one sixth.', divide).reasons).toContain('states-answer')
    expect(checkTutorMessage('You should get 2/12.', divide).reasons).toContain('states-answer')
    expect(checkTutorMessage('It comes to \\(\\frac{1}{6}\\).', divide).reasons).toContain('states-answer')
  })

  it('catches the correct option letter', () => {
    expect(checkTutorMessage('Have another look at option a.', kemar).reasons).toContain('names-correct-option')
    expect(checkTutorMessage('Is it (a)?', kemar).reasons).toContain('names-correct-option')
    expect(checkTutorMessage('Why did you pick option b?', kemar).ok).toBe(true)
  })

  it('catches numbers that are not in the question', () => {
    expect(checkTutorMessage('Start with 45 × 10 = 450.', kemar).reasons).toContain('new-number')
  })

  it('allows the parts of a fraction that is in the question', () => {
    expect(checkTutorMessage('What number divides both 18 and 24 exactly?', simplify).ok).toBe(true)
  })

  it('catches a written-out answer to a non-numeric item', () => {
    const message = 'Put them in order: \\(\\frac{5}{8} < \\frac{2}{3} < \\frac{3}{4}\\).'
    expect(checkTutorMessage(message, order).reasons).toContain('states-answer')
  })

  it('holds messages to 60 words', () => {
    const long = Array.from({ length: 61 }, () => 'word').join(' ')
    expect(checkTutorMessage(long, kemar).reasons).toContain('too-long')
  })
})
