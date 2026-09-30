import { describe, expect, it } from 'vitest'
import { equals, parseNumber, rational } from '../numbers'

const value = (text: string, unit?: string) => {
  const parsed = parseNumber(text, unit)
  if (!parsed) throw new Error(`could not parse ${text}`)
  return parsed.value
}

describe('parseNumber', () => {
  it('holds decimals exactly, so 0.1 is exactly one tenth', () => {
    expect(value('0.1')).toEqual(rational(1n, 10n))
    expect(value('.5')).toEqual(rational(1n, 2n))
    expect(value('0.125')).toEqual(rational(1n, 8n))
  })

  it('reduces fractions, so 2/4 equals 1/2 equals 0.5', () => {
    expect(equals(value('2/4'), value('1/2'))).toBe(true)
    expect(equals(value('0.5'), value('1/2'))).toBe(true)
  })

  it('reads mixed numbers and negatives, including the typographic minus sign', () => {
    expect(value('1 1/2')).toEqual(rational(3n, 2n))
    expect(value('-1 1/2')).toEqual(rational(-3n, 2n))
    expect(value('−3')).toEqual(rational(-3n))
    expect(value('-3/4')).toEqual(rational(-3n, 4n))
  })

  it('reads CXC thousands separators with a space or a comma', () => {
    expect(value('24 300')).toEqual(rational(24300n))
    expect(value('24,300')).toEqual(rational(24300n))
    expect(value('1 000 000.5')).toEqual(rational(2000001n, 2n))
  })

  it('strips BDS and EC currency', () => {
    expect(value('BDS $540')).toEqual(rational(540n))
    expect(value('EC$1,200')).toEqual(rational(1200n))
    expect(value('$45')).toEqual(rational(45n))
  })

  it('reads percentages as fractions of 100', () => {
    expect(value('50%')).toEqual(rational(1n, 2n))
    expect(value('12.5 %')).toEqual(rational(1n, 8n))
    expect(parseNumber('50%')?.form).toBe('percent')
  })

  it('reads standard form and knows when it is written properly', () => {
    expect(value('3.2 × 10^4')).toEqual(rational(32000n))
    expect(value('3.2 x 10^-2')).toEqual(rational(4n, 125n))
    expect(value('3.2 \\times 10^{4}')).toEqual(rational(32000n))
    expect(parseNumber('3.2 × 10^4')?.standardForm).toBe(true)
    expect(parseNumber('32 × 10^3')?.standardForm).toBe(false)
  })

  it('reads KaTeX fractions and mixed numbers from content', () => {
    expect(value('\\(\\frac{18}{24}\\)')).toEqual(rational(3n, 4n))
    expect(value('\\(1\\frac{1}{2}\\)')).toEqual(rational(3n, 2n))
    expect(value('\\(-\\frac{1}{2}\\)')).toEqual(rational(-1n, 2n))
  })

  it('strips a unit when the item names one', () => {
    expect(value('12 weeks', 'weeks')).toEqual(rational(12n))
    expect(value('1 week', 'weeks')).toEqual(rational(1n))
    expect(value('45 cm', 'cm')).toEqual(rational(45n))
  })

  it('flags fractions that are not in lowest terms', () => {
    expect(parseNumber('6/8')?.lowestTerms).toBe(false)
    expect(parseNumber('3/4')?.lowestTerms).toBe(true)
    expect(parseNumber('1 2/4')?.lowestTerms).toBe(false)
    expect(parseNumber('0.75')?.lowestTerms).toBe(true)
  })

  it('returns null for anything that is not a single number', () => {
    for (const text of ['', 'abc', '1/0', '1,5', '3 4', '12 weeks', '5/8 < 2/3']) {
      expect(parseNumber(text), text).toBeNull()
    }
  })
})
