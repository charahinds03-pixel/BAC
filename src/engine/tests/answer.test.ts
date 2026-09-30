import { describe, expect, it } from 'vitest'
import { checkAnswer } from '../answer'
import { mcq, numeric, realQuestion } from './fixtures'

const typed = (text: string) => ({ kind: 'typed' as const, text })
const chose = (choiceId: string) => ({ kind: 'choice' as const, choiceId })

describe('checkAnswer: tapped choices', () => {
  const q = realQuestion('M1-NTC-0006')

  it('marks the correct choice right', () => {
    expect(checkAnswer(q, chose('a'))).toEqual({ correct: true, reason: 'correct', choiceId: 'a' })
  })

  it('maps a distractor straight to its misconception', () => {
    expect(checkAnswer(q, chose('b'))).toEqual({
      correct: false,
      reason: 'distractor',
      misconceptionId: 'OP-SUB-FOR-DIV',
      choiceId: 'b',
    })
  })

  it('treats an unknown choice id as unreadable', () => {
    expect(checkAnswer(q, chose('z')).reason).toBe('unreadable')
  })
})

describe('checkAnswer: typed answers on multiple-choice items', () => {
  it('accepts any equivalent value by default', () => {
    const q = realQuestion('M1-NTC-0002') // 1/2 + 1/3 = 5/6
    expect(checkAnswer(q, typed('5/6')).correct).toBe(true)
    expect(checkAnswer(q, typed('10/12')).correct).toBe(true)
    expect(checkAnswer(q, typed('0.8333')).reason).toBe('wrong')
  })

  it('names the misconception when the typed value equals a distractor', () => {
    const q = realQuestion('M1-NTC-0002')
    expect(checkAnswer(q, typed('2/5'))).toMatchObject({ reason: 'distractor', misconceptionId: 'FRAC-ADD-ACROSS' })
    expect(checkAnswer(q, typed('4/10'))).toMatchObject({ reason: 'distractor', misconceptionId: 'FRAC-ADD-ACROSS' })
  })

  it('reads CXC number writing on real items', () => {
    const q = realQuestion('M1-NTC-0006')
    expect(checkAnswer(q, typed('12')).correct).toBe(true)
    expect(checkAnswer(q, typed('24,300'))).toMatchObject({ misconceptionId: 'OP-MUL-FOR-DIV' })
    expect(checkAnswer(q, typed('24 300'))).toMatchObject({ misconceptionId: 'OP-MUL-FOR-DIV' })
    expect(checkAnswer(q, typed('about twelve')).reason).toBe('unreadable')
  })

  it('holds a "simplest" item to lowest terms', () => {
    const q = realQuestion('M1-NTC-0001') // simplify 18/24
    expect(checkAnswer(q, typed('3/4')).correct).toBe(true)
    expect(checkAnswer(q, typed('6/8'))).toMatchObject({ correct: false, misconceptionId: 'FRAC-NOT-LOWEST', choiceId: 'c' })
    expect(checkAnswer(q, typed('12/16'))).toEqual({ correct: false, reason: 'wrong-form' })
  })

  it('compares written text when the choices are not numbers', () => {
    const q = realQuestion('M1-NTC-0004') // ordering
    expect(checkAnswer(q, typed('5/8 < 2/3 < 3/4')).correct).toBe(true)
    expect(checkAnswer(q, typed('3/4<2/3<5/8'))).toMatchObject({ misconceptionId: 'ORD-REVERSED' })
    expect(checkAnswer(q, typed('2/3 < 3/4 < 5/8')).reason).toBe('wrong')
  })

  it('works on a made-up item too', () => {
    expect(checkAnswer(mcq(), typed('0.5')).correct).toBe(true)
  })
})

describe('checkAnswer: numeric items', () => {
  it('accepts 0.5, 1/2, 2/4 and 50% for a key of 1/2', () => {
    const q = numeric()
    for (const text of ['0.5', '1/2', '2/4', '50%']) expect(checkAnswer(q, typed(text)).correct, text).toBe(true)
  })

  it('maps common errors to their misconception', () => {
    expect(checkAnswer(numeric(), typed('2/8'))).toMatchObject({ reason: 'distractor', misconceptionId: 'FRAC-ADD-ACROSS' })
  })

  it('uses the tolerance for rounded answers', () => {
    const q = numeric({ answer: { value: '3.14', tolerance: 0.01 }, commonErrors: [] })
    expect(checkAnswer(q, typed('3.141')).correct).toBe(true)
    expect(checkAnswer(q, typed('3.2')).correct).toBe(false)
  })

  it('accepts the unit written after the number', () => {
    const q = numeric({ answer: { value: '12', unit: 'weeks' }, commonErrors: [] })
    expect(checkAnswer(q, typed('12 weeks')).correct).toBe(true)
  })

  it('accepts a percentage key typed with or without the % sign', () => {
    const q = numeric({ answer: { value: '15%' }, commonErrors: [] })
    expect(checkAnswer(q, typed('15')).correct).toBe(true)
    expect(checkAnswer(q, typed('15%')).correct).toBe(true)
    expect(checkAnswer(q, typed('0.15')).correct).toBe(true)
  })

  it('insists on standard form when the item asks for it', () => {
    const q = numeric({ answer: { value: '3.2 × 10^4' }, answerForm: 'standard-form', commonErrors: [] })
    expect(checkAnswer(q, typed('3.2 x 10^4')).correct).toBe(true)
    expect(checkAnswer(q, typed('32000')).reason).toBe('wrong-form')
    expect(checkAnswer(q, typed('32 × 10^3')).reason).toBe('wrong-form')
  })

  it('cannot take a tapped choice', () => {
    expect(checkAnswer(numeric(), chose('a')).reason).toBe('unreadable')
  })
})
