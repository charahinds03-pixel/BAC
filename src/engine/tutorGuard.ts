// The answer guard. Before any tutor message reaches a student, code checks
// that it does not give the answer away. If it fails, the server discards
// it, retries once, then falls back to the next written hint (nextHint).

import { plainText } from './mathText'
import { equals, parseNumber, rational, type Rational } from './numbers'
import type { Question } from './types'

export const TUTOR_WORD_LIMIT = 60

export type GuardReason =
  /** The message contains the answer's value, in any equivalent form. */
  | 'states-answer'
  /** The message names the correct option letter. */
  | 'names-correct-option'
  /** The message uses a number that is not in the question. */
  | 'new-number'
  /** Over the word limit. */
  | 'too-long'

export interface GuardResult {
  ok: boolean
  reasons: GuardReason[]
}

// The first group stops a match starting in the middle of another number.
// (No lookbehind, so older phone browsers can still parse this file.)
const NUMBER_TOKEN = /(^|[^\d.])(-?(?:\d+ \d+\/\d+|\d+\/\d+|\d{1,3}(?:[ ,]\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)(?: ?%)?)/g

const UNITS = new Map(
  ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
    'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'].map((w, i) => [w, i]),
)
const TENS = new Map(
  ['twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'].map((w, i) => [w, (i + 2) * 10]),
)
const DENOMINATORS = new Map<string, number>([
  ['half', 2], ['halves', 2], ['third', 3], ['thirds', 3], ['quarter', 4], ['quarters', 4], ['fourth', 4],
  ['fourths', 4], ['fifth', 5], ['fifths', 5], ['sixth', 6], ['sixths', 6], ['seventh', 7], ['sevenths', 7],
  ['eighth', 8], ['eighths', 8], ['ninth', 9], ['ninths', 9], ['tenth', 10], ['tenths', 10],
  ['twelfth', 12], ['twelfths', 12],
])

/** Numbers written with digits, as exact values. */
function digitNumbers(text: string): Rational[] {
  const values: Rational[] = []
  for (const match of plainText(text).matchAll(NUMBER_TOKEN)) {
    const parsed = parseNumber(match[2] ?? '')
    if (parsed) values.push(parsed.value)
  }
  return values
}

/** Numbers written in words: "twelve", "five hundred and forty", "one sixth", "a half". */
function wordNumbers(text: string): Rational[] {
  const tokens = text.toLowerCase().split(/[^a-z]+/).filter(Boolean)
  const values: Rational[] = []
  let i = 0
  while (i < tokens.length) {
    let total = 0
    let current = 0
    let found = false
    while (i < tokens.length) {
      const t = tokens[i] ?? ''
      const next = tokens[i + 1] ?? ''
      const unit = UNITS.get(t)
      const ten = TENS.get(t)
      if (unit !== undefined) current += unit
      else if (ten !== undefined) current += ten
      else if (t === 'hundred' && found) current *= 100
      else if (t === 'thousand' && found) {
        total += current * 1000
        current = 0
      } else if (t === 'and' && found && (UNITS.has(next) || TENS.has(next))) {
        // "five hundred and forty"
      } else break
      found = true
      i += 1
    }
    const word = tokens[i] ?? ''
    const denominator = DENOMINATORS.get(word)
    const following = DENOMINATORS.get(tokens[i + 1] ?? '')
    if (found) {
      const whole = BigInt(total + current)
      if (denominator !== undefined) {
        values.push(rational(whole, BigInt(denominator)))
        i += 1
      } else values.push(rational(whole))
    } else if ((word === 'a' || word === 'an') && following !== undefined) {
      values.push(rational(1n, BigInt(following)))
      i += 2
    } else if (word === 'half') {
      values.push(rational(1n, 2n))
      i += 1
    } else i += 1
  }
  return values
}

/** Every value the question itself shows, including the parts of each fraction. */
function questionNumbers(question: Question): Rational[] {
  const texts = [question.stem]
  if (question.format === 'mcq') texts.push(...question.choices.map((c) => c.text))
  const values: Rational[] = []
  for (const text of texts) {
    const flat = plainText(text)
    values.push(...digitNumbers(flat))
    for (const match of flat.matchAll(/\d+(?:\.\d+)?/g)) {
      const parsed = parseNumber(match[0])
      if (parsed) values.push(parsed.value)
    }
  }
  return values
}

function answerValues(question: Question): { values: Rational[]; text: string | null; optionId: string | null } {
  const raw =
    question.format === 'mcq' ? (question.choices.find((c) => c.correct === true)?.text ?? null) : question.answer.value
  const optionId = question.format === 'mcq' ? (question.choices.find((c) => c.correct === true)?.id ?? null) : null
  if (raw === null) return { values: [], text: null, optionId }
  const unit = question.format === 'numeric' ? question.answer.unit : undefined
  const parsed = parseNumber(raw, unit)
  if (!parsed) return { values: [], text: plainText(raw), optionId }
  const values = [parsed.value]
  // A key of 50% is also given away by a bare "50".
  if (parsed.form === 'percent') values.push(rational(parsed.value.n * 100n, parsed.value.d))
  return { values, text: null, optionId }
}

const squash = (text: string) => plainText(text).toLowerCase().replace(/\s+/g, '')

/** Checks a tutor message before it is shown. ok is false if any rule is broken. */
export function checkTutorMessage(message: string, question: Question): GuardResult {
  const reasons: GuardReason[] = []
  const answer = answerValues(question)
  const said = [...digitNumbers(message), ...wordNumbers(message)]

  if (answer.values.some((a) => said.some((s) => equals(a, s)))) reasons.push('states-answer')
  else if (answer.text && squash(message).includes(squash(answer.text))) reasons.push('states-answer')

  if (answer.optionId) {
    const letter = answer.optionId.toLowerCase()
    const named = [...message.matchAll(/\b(?:option|choice|answer|letter)\s*\(?([a-e])\)?(?![a-z])|\(([a-e])\)/gi)]
    if (named.some((m) => (m[1] ?? m[2] ?? '').toLowerCase() === letter)) reasons.push('names-correct-option')
  }

  const allowed = questionNumbers(question)
  if (digitNumbers(message).some((n) => !allowed.some((a) => equals(a, n)))) reasons.push('new-number')

  const words = message.trim().split(/\s+/).filter(Boolean).length
  if (words > TUTOR_WORD_LIMIT) reasons.push('too-long')

  return { ok: reasons.length === 0, reasons }
}
