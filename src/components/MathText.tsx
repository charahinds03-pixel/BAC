import katex from 'katex'
import { Fragment, useMemo } from 'react'
import { splitMath } from '../engine'

type Part = { kind: 'text'; value: string } | { kind: 'html'; value: string } | { kind: 'error'; value: string }

interface MathTextProps {
  /** Content text, with math between \( and \). */
  text: string
  className?: string
}

/**
 * Renders content text. Words stay plain React text; each \( \) segment is
 * set by KaTeX. KaTeX only ever receives our own content, and a segment it
 * cannot render falls back to the raw text instead of breaking the screen.
 */
export function MathText({ text, className }: MathTextProps) {
  const parts = useMemo<Part[]>(
    () =>
      splitMath(text).map((part): Part => {
        if (part.kind === 'text') return { kind: 'text', value: part.value }
        try {
          // Fractions are set full size, like a printed CXC paper, so they stay readable on a phone.
          const tex = part.value.replace(/\\frac(?=\s*\{)/g, '\\dfrac')
          return { kind: 'html', value: katex.renderToString(tex, { throwOnError: true, strict: 'ignore' }) }
        } catch {
          return { kind: 'error', value: part.value }
        }
      }),
    [text],
  )
  return (
    <span className={['math', className ?? ''].filter(Boolean).join(' ')}>
      {parts.map((part, i) =>
        part.kind === 'html' ? (
          <span key={i} dangerouslySetInnerHTML={{ __html: part.value }} />
        ) : part.kind === 'error' ? (
          <code key={i} className="math-error">
            {part.value}
          </code>
        ) : (
          <Fragment key={i}>{part.value}</Fragment>
        ),
      )}
    </span>
  )
}
