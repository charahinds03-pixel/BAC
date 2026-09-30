// Content text mixes plain words with math written between \( and \).
// These helpers split, check and flatten that text. Rendering with KaTeX
// happens in the app; the engine only needs to read the text.

export interface TextPart {
  kind: 'text' | 'math'
  value: string
}

/** Splits "What is \(\frac{3}{4}\) of 40?" into text and math parts. */
export function splitMath(text: string): TextPart[] {
  const parts: TextPart[] = []
  let last = 0
  for (const match of text.matchAll(/\\\((.*?)\\\)/gs)) {
    const start = match.index ?? 0
    if (start > last) parts.push({ kind: 'text', value: text.slice(last, start) })
    parts.push({ kind: 'math', value: match[1] ?? '' })
    last = start + match[0].length
  }
  if (last < text.length) parts.push({ kind: 'text', value: text.slice(last) })
  return parts
}

/** True when every \( has a matching \) and none are nested. */
export function mathDelimitersBalanced(text: string): boolean {
  let open = false
  for (const match of text.matchAll(/\\\(|\\\)/g)) {
    if (match[0] === '\\(') {
      if (open) return false
      open = true
    } else {
      if (!open) return false
      open = false
    }
  }
  return !open
}

/** Flattens math to readable plain text: \(\frac{3}{4} \times 40\) becomes 3/4 × 40. */
export function plainText(text: string): string {
  return text
    .replace(/\\\(|\\\)/g, '')
    .replace(/\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '$1/$2')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\cdot/g, '·')
    .replace(/\\le(?:q)?\b/g, '≤')
    .replace(/\\ge(?:q)?\b/g, '≥')
    .replace(/\\[,;: ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
