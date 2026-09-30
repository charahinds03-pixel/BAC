import { MathText } from './MathText'

/** Numbered steps, ruled like an exercise book. One step per line. */
export function WorkedSolution({ steps }: { steps: string[] }) {
  return (
    <ol className="solution">
      {steps.map((step, i) => (
        <li key={i}>
          <span>
            <MathText text={step} />
          </span>
        </li>
      ))}
    </ol>
  )
}
