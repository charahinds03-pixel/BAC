export type ReadinessLevel = 'not-ready' | 'getting-there' | 'ready'

const LEVEL_TEXT: Record<ReadinessLevel, string> = {
  'not-ready': 'Not ready yet',
  'getting-there': 'Getting there',
  ready: 'Ready to sit Module 1',
}
const LEVEL_STEP: Record<ReadinessLevel, number> = { 'not-ready': 1, 'getting-there': 2, ready: 3 }

interface ReadinessProps {
  level: ReadinessLevel
  /** One plain sentence: why this level. */
  summary: string
  /** The specific gaps, in words. */
  reasons: string[]
}

/** An honest Module 1 readiness signal, always with the reason. */
export function Readiness({ level, summary, reasons }: ReadinessProps) {
  return (
    <section className="readiness" aria-label="Module 1 readiness">
      <p className="caption">Module 1 readiness</p>
      <p className="readiness__level">{LEVEL_TEXT[level]}</p>
      <div className="readiness__scale" aria-hidden="true">
        {[1, 2, 3].map((step) => (
          <span key={step} className="readiness__step" data-on={step <= LEVEL_STEP[level]} />
        ))}
      </div>
      <p>{summary}</p>
      {reasons.length > 0 && (
        <ul className="readiness__reasons">
          {reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
