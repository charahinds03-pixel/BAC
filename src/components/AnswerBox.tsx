import { useId } from 'react'

interface AnswerBoxProps {
  label: string
  value: string
  onChange?: (value: string) => void
  onSubmit?: () => void
  state?: 'correct' | 'wrong'
  help?: string
  /**
   * The phone keyboard. decimal is a number pad, but it has no / key, so use
   * text whenever the answer may be a fraction. MathLive replaces this later.
   */
  keyboard?: 'decimal' | 'text'
  disabled?: boolean
}

/** Free-response answer on paper-raised, with an ink-soft border. */
export function AnswerBox({ label, value, onChange, onSubmit, state, help, keyboard = 'text', disabled }: AnswerBoxProps) {
  const id = useId()
  return (
    <div className="answer" data-state={state}>
      <label className="answer__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="answer__input"
        inputMode={keyboard}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="done"
        value={value}
        disabled={disabled}
        readOnly={!onChange}
        aria-describedby={help ? `${id}-help` : undefined}
        aria-invalid={state === 'wrong' || undefined}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit?.()
        }}
      />
      {help && (
        <p className="answer__help" id={`${id}-help`}>
          {help}
        </p>
      )}
    </div>
  )
}
