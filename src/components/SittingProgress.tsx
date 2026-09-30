/** "Question 3 of 12" and a thin sea line. No percentages, no timer. */
export function SittingProgress({ current, total }: { current: number; total: number }) {
  const width = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0
  return (
    <div className="progress">
      <span className="progress__label">
        Question {current} of {total}
      </span>
      <div
        className="progress__track"
        role="progressbar"
        aria-label="Sitting progress"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
      >
        <div className="progress__fill" style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}
