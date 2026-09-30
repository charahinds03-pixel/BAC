// Answer checking. Code decides right and wrong against the stored key;
// the model never grades. See docs/PEDAGOGY.md, step 2 of the loop.

import { equals, normaliseNumberText, parseNumber, rational, toNumber, type ParsedNumber } from './numbers'
import { plainText } from './mathText'
import type { AnswerForm, Question } from './types'

/** What the student did: tapped a choice, or typed an answer. */
export type StudentResponse = { kind: 'choice'; choiceId: string } | { kind: 'typed'; text: string }

export type CheckReason =
  /** Right answer, in an acceptable form. */
  | 'correct'
  /** Matched a distractor or a known common error, so we know the misconception. */
  | 'distractor'
  /** Right value, but the item asks for a form the student did not use (for example lowest terms). */
  | 'wrong-form'
  /** A readable answer that matches no known error. */
  | 'wrong'
  /** Could not be read as a number or a choice. Ask the student to try again; do not count it. */
  | 'unreadable'

export interface CheckResult {
  correct: boolean
  reason: CheckReason
  misconceptionId?: string
  /** The choice the response matched, when there is one. */
  choiceId?: string
}

interface KnownAnswer {
  text: string
  value: ParsedNumber
  misconceptionId?: string
  choiceId?: string
}

function formAccepted(value: ParsedNumber, form: AnswerForm): boolean {
  if (form === 'simplest') return value.lowestTerms
  if (form === 'standard-form') return value.standardForm
  return true
}

function sameValue(student: ParsedNumber, key: ParsedNumber, tolerance = 0): boolean {
  const close = (a: ParsedNumber) =>
    tolerance > 0 ? Math.abs(toNumber(a.value) - toNumber(key.value)) <= tolerance + 1e-12 : equals(a.value, key.value)
  if (close(student)) return true
  // A key of 50% also accepts a bare 50 typed without the % sign.
  if (key.form === 'percent' && student.form !== 'percent') {
    const asPercent = rational(student.value.n, student.value.d * 100n)
    return close({ ...student, value: asPercent })
  }
  return false
}

function compare(
  studentText: string,
  student: ParsedNumber,
  key: ParsedNumber,
  form: AnswerForm,
  known: KnownAnswer[],
  keyChoiceId: string | undefined,
  tolerance = 0,
  unit?: string,
): CheckResult {
  if (sameValue(student, key, tolerance)) {
    if (formAccepted(student, form)) return { correct: true, reason: 'correct', choiceId: keyChoiceId }
    // Right value, wrong form. If it is written exactly like a distractor (6/8), use that misconception.
    const typed = normaliseNumberText(studentText, unit)
    const twin = known.find((k) => normaliseNumberText(k.text, unit) === typed)
    if (twin) return { correct: false, reason: 'distractor', misconceptionId: twin.misconceptionId, choiceId: twin.choiceId }
    return { correct: false, reason: 'wrong-form' }
  }
  const match = known.find((k) => equals(k.value.value, student.value))
  if (match) return { correct: false, reason: 'distractor', misconceptionId: match.misconceptionId, choiceId: match.choiceId }
  return { correct: false, reason: 'wrong' }
}

const flatten = (text: string) => plainText(text).toLowerCase().replace(/\s+/g, '')

/**
 * Checks a response against a question's stored key.
 *
 * - A tapped choice maps straight to correct or to its misconception.
 * - A typed answer on a multiple-choice item is compared by value with the
 *   correct choice, and with every distractor, so typing 2/5 for 1/2 + 1/3
 *   still names the misconception.
 * - A typed answer on a numeric item is compared with answer.value, within
 *   answer.tolerance, and with commonErrors.
 */
export function checkAnswer(question: Question, response: StudentResponse): CheckResult {
  const form: AnswerForm = question.answerForm ?? 'equivalent'

  if (question.format === 'mcq') {
    const keyChoice = question.choices.find((c) => c.correct === true)
    if (response.kind === 'choice') {
      const choice = question.choices.find((c) => c.id === response.choiceId)
      if (!choice) return { correct: false, reason: 'unreadable' }
      if (choice.correct === true) return { correct: true, reason: 'correct', choiceId: choice.id }
      return { correct: false, reason: 'distractor', misconceptionId: choice.misconceptionId, choiceId: choice.id }
    }
    if (!keyChoice) return { correct: false, reason: 'unreadable' }
    const key = parseNumber(keyChoice.text)
    if (!key) {
      // Non-numeric choices, such as an ordering. Compare the written text.
      const typed = flatten(response.text)
      if (typed === '') return { correct: false, reason: 'unreadable' }
      const choice = question.choices.find((c) => flatten(c.text) === typed)
      if (!choice) return { correct: false, reason: 'wrong' }
      if (choice.correct === true) return { correct: true, reason: 'correct', choiceId: choice.id }
      return { correct: false, reason: 'distractor', misconceptionId: choice.misconceptionId, choiceId: choice.id }
    }
    const student = parseNumber(response.text)
    if (!student) return { correct: false, reason: 'unreadable' }
    const known: KnownAnswer[] = []
    for (const c of question.choices) {
      if (c.correct === true) continue
      const value = parseNumber(c.text)
      if (value) known.push({ text: c.text, value, misconceptionId: c.misconceptionId, choiceId: c.id })
    }
    return compare(response.text, student, key, form, known, keyChoice.id)
  }

  if (response.kind !== 'typed') return { correct: false, reason: 'unreadable' }
  const unit = question.answer.unit
  const key = parseNumber(question.answer.value, unit)
  const student = parseNumber(response.text, unit)
  if (!key || !student) return { correct: false, reason: 'unreadable' }
  const known: KnownAnswer[] = []
  for (const e of question.commonErrors ?? []) {
    const value = parseNumber(e.value, unit)
    if (value) known.push({ text: e.value, value, misconceptionId: e.misconceptionId })
  }
  return compare(response.text, student, key, form, known, undefined, question.answer.tolerance ?? 0, unit)
}
