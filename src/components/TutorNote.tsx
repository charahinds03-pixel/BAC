import { MathText } from './MathText'

/** The tutor's one question, set in the margin style. Never a chat bubble. */
export function TutorNote({ message }: { message: string }) {
  return (
    <aside className="tutor" aria-label="Tutor">
      <span className="tutor__who">Tutor</span>
      <p className="tutor__message">
        <MathText text={message} />
      </p>
    </aside>
  )
}
