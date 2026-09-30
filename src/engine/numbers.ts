// Exact numbers for answer checking. Every value is held as a fraction of two
// whole numbers (BigInt), so 0.1 + 0.2 is exactly 3/10 and 2/4 equals 1/2
// with no rounding surprises.

export interface Rational {
  readonly n: bigint
  readonly d: bigint
}

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a
  let y = b < 0n ? -b : b
  while (y !== 0n) [x, y] = [y, x % y]
  return x
}

/** Builds a fraction in lowest terms with a positive denominator. */
export function rational(n: bigint, d: bigint = 1n): Rational {
  if (d === 0n) throw new RangeError('Denominator cannot be zero')
  const sign = d < 0n ? -1n : 1n
  const g = gcd(n, d) || 1n
  return { n: (sign * n) / g, d: (sign * d) / g }
}

export function equals(a: Rational, b: Rational): boolean {
  return a.n === b.n && a.d === b.d
}

export function toNumber(r: Rational): number {
  return Number(r.n) / Number(r.d)
}

export type NumberForm = 'integer' | 'decimal' | 'fraction' | 'mixed' | 'percent' | 'standard-form'

export interface ParsedNumber {
  value: Rational
  form: NumberForm
  /** False for a fraction such as 6/8 that could still be simplified. */
  lowestTerms: boolean
  /** True for A × 10^n written with 1 ≤ |A| < 10. */
  standardForm: boolean
}

/** Turns what a student types, or what content stores, into plain text the patterns below can read. */
export function normaliseNumberText(raw: string, unit?: string): string {
  let s = raw.trim()
  s = s.replace(/\\\(|\\\)/g, '')
  s = s.replace(/\\left|\\right/g, '')
  s = s.replace(/\\[dt]?frac\s*\{\s*([^{}]*?)\s*\}\s*\{\s*([^{}]*?)\s*\}/g, ' $1/$2')
  s = s.replace(/\\times|\\cdot/g, '×')
  s = s.replace(/\\[,;: ]|~/g, ' ')
  s = s.replace(/[−‒–﹣－]/g, '-')
  s = s.replace(/[   ]/g, ' ')
  s = s.replace(/^(?:BDS|BBD|EC|XCD)?\s*\$\s*/i, '')
  if (unit) {
    const u = unit.trim().replace(/s$/i, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    s = s.replace(new RegExp(`\\s*${u}s?\\.?$`, 'i'), '')
  }
  s = s.replace(/\s*\/\s*/g, '/')
  s = s.replace(/\s+/g, ' ').trim()
  s = s.replace(/^-\s+/, '-')
  return s
}

function decimalToRational(text: string): Rational {
  const negative = text.startsWith('-')
  const body = negative ? text.slice(1) : text
  const [whole = '', frac = ''] = body.split('.')
  const digits = BigInt((whole || '0') + frac)
  const scale = 10n ** BigInt(frac.length)
  return rational(negative ? -digits : digits, scale)
}

const INTEGER_OR_DECIMAL = /^-?(?:\d+\.?\d*|\.\d+)$/
const SPACE_THOUSANDS = /^-?\d{1,3}(?: \d{3})+(?:\.\d+)?$/
const COMMA_THOUSANDS = /^-?\d{1,3}(?:,\d{3})+(?:\.\d+)?$/
const FRACTION = /^(-?)(\d+)\/(\d+)$/
const MIXED = /^(-?)(\d+) (\d+)\/(\d+)$/
const STANDARD_FORM = /^(-?\d+(?:\.\d+)?) ?[×xX*] ?10 ?\^ ?\{? ?(-?\d+) ?\}?$/
const PERCENT = /^(.+?) ?%$/

function parsePlain(s: string): ParsedNumber | null {
  let text = s
  if (SPACE_THOUSANDS.test(text)) text = text.replace(/ /g, '')
  else if (COMMA_THOUSANDS.test(text)) text = text.replace(/,/g, '')

  if (INTEGER_OR_DECIMAL.test(text)) {
    return {
      value: decimalToRational(text),
      form: text.includes('.') ? 'decimal' : 'integer',
      lowestTerms: true,
      standardForm: false,
    }
  }

  const mixed = MIXED.exec(text)
  if (mixed) {
    const [, sign = '', w = '0', n = '0', d = '1'] = mixed
    const whole = BigInt(w)
    const num = BigInt(n)
    const den = BigInt(d)
    if (den === 0n) return null
    const magnitude = rational(whole * den + num, den)
    return {
      value: sign ? rational(-magnitude.n, magnitude.d) : magnitude,
      form: 'mixed',
      lowestTerms: gcd(num, den) === 1n && num < den,
      standardForm: false,
    }
  }

  const fraction = FRACTION.exec(text)
  if (fraction) {
    const [, sign = '', n = '0', d = '1'] = fraction
    const num = BigInt(n)
    const den = BigInt(d)
    if (den === 0n) return null
    return {
      value: rational(sign ? -num : num, den),
      form: 'fraction',
      lowestTerms: gcd(num, den) === 1n,
      standardForm: false,
    }
  }

  return null
}

/**
 * Reads a number the way a CSEC student writes it: 12, -3, 0.5, 1/2, 1 1/2,
 * 24 300, 24,300, 50%, BDS $540, 3.2 × 10^4, or KaTeX such as \(\frac{3}{4}\).
 * Returns null when the text is not a single number.
 */
export function parseNumber(raw: string, unit?: string): ParsedNumber | null {
  const s = normaliseNumberText(raw, unit)
  if (s === '') return null

  const percent = PERCENT.exec(s)
  if (percent) {
    const inner = parsePlain(percent[1] ?? '')
    if (!inner) return null
    return {
      value: rational(inner.value.n, inner.value.d * 100n),
      form: 'percent',
      lowestTerms: inner.lowestTerms,
      standardForm: false,
    }
  }

  const standard = STANDARD_FORM.exec(s)
  if (standard) {
    const a = decimalToRational(standard[1] ?? '0')
    const power = Number(standard[2])
    const scale = 10n ** BigInt(Math.abs(power))
    const value = power >= 0 ? rational(a.n * scale, a.d) : rational(a.n, a.d * scale)
    const size = Math.abs(toNumber(a))
    return { value, form: 'standard-form', lowestTerms: true, standardForm: size >= 1 && size < 10 }
  }

  return parsePlain(s)
}
