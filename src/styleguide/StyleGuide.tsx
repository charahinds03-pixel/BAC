import { useEffect, useState, type ReactNode } from 'react'
import {
  AnswerBox,
  BottomBar,
  Button,
  ChoiceList,
  Cross,
  HintLadder,
  MarginNote,
  MasterySeal,
  MathText,
  Notice,
  QuestionSheet,
  Readiness,
  Tick,
  TreeRow,
  TutorNote,
  WorkedSolution,
} from '../components'
import { content, findMisconception, findQuestion, rawQuestions, reviewBank, studentBank } from '../data/content'
import { checkTutorMessage, nextHint, planRemediation, type GuardReason, type McqQuestion, type Question } from '../engine'
import {
  applyHeadingFont,
  applyTheme,
  loadHeadingFont,
  loadTheme,
  type HeadingFont,
  type ThemeChoice,
} from '../lib/preferences'
import { exampleCar, exampleStates, goodTutorMessage, leakyTutorMessage } from './examples'
import { PracticeDemo } from './PracticeDemo'
import './styleguide.css'

const TOKENS: { name: string; use: string }[] = [
  { name: 'paper', use: 'Page background' },
  { name: 'paper-raised', use: 'Inputs, answer sheets, the bottom bar' },
  { name: 'ink', use: 'Text and primary buttons' },
  { name: 'ink-soft', use: 'Secondary text and the edges of controls' },
  { name: 'rule', use: 'Ruled lines and decorative borders' },
  { name: 'sea', use: 'Correct answers and progress' },
  { name: 'mace', use: 'Corrections and errors' },
  { name: 'gold', use: 'Mastery moments only. Never text.' },
]

const SPACING = [4, 8, 16, 24, 32, 48]

const SECTIONS = [
  ['colour', 'Colour'],
  ['type', 'Type and space'],
  ['buttons', 'Buttons'],
  ['practice', 'A question, start to finish'],
  ['states', 'Choice states'],
  ['answer', 'Answer box'],
  ['notes', 'Margin notes'],
  ['hints', 'Hint ladder'],
  ['solution', 'Worked solution'],
  ['tutor', 'Tutor'],
  ['tree', 'Knowledge Tree'],
  ['readiness', 'Readiness'],
  ['notices', 'Loading, empty, error, offline'],
  ['marks', 'Marks and motion'],
] as const

const GUARD_WORDS: Record<GuardReason, string> = {
  'states-answer': 'it states the answer',
  'names-correct-option': 'it names the correct option',
  'new-number': 'it uses a number that is not in the question',
  'too-long': 'it is over 60 words',
}

function Section({ id, title, intro, children }: { id: string; title: string; intro?: string; children: ReactNode }) {
  return (
    <section className="sg-section" id={id} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{title}</h2>
      {intro && <p className="caption">{intro}</p>}
      {children}
    </section>
  )
}

function Segmented<T extends string>(props: {
  legend: string
  name: string
  value: T
  options: [T, string][]
  onChange: (value: T) => void
}) {
  return (
    <fieldset className="segmented">
      <legend>{props.legend}</legend>
      <div className="segmented__options">
        {props.options.map(([value, label]) => (
          <label key={value}>
            <input
              type="radio"
              name={props.name}
              value={value}
              checked={props.value === value}
              onChange={() => props.onChange(value)}
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function questionById<T extends Question = Question>(id: string): T | undefined {
  return findQuestion(id) as T | undefined
}

function ColourRows({ theme }: { theme: ThemeChoice }) {
  const [values, setValues] = useState<Record<string, string>>({})
  useEffect(() => {
    const style = getComputedStyle(document.documentElement)
    setValues(Object.fromEntries(TOKENS.map((t) => [t.name, style.getPropertyValue(`--${t.name}`).trim()])))
  }, [theme])
  return (
    <ul className="swatches">
      {TOKENS.map((t) => (
        <li key={t.name} className="swatch">
          <span className="swatch__chip" style={{ background: `var(--${t.name})` }} aria-hidden="true" />
          <span>
            <span className="swatch__name">{t.name}</span> <span className="swatch__value">{values[t.name]}</span>
            <br />
            <span className="caption">{t.use}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

function ContentStatus() {
  const rejected = reviewBank.rejected
  return (
    <Notice
      kind={rejected.length > 0 ? 'error' : 'empty'}
      title={`${reviewBank.questions.length} of ${rawQuestions.length} Module 1 items load. ${studentBank.questions.length} are approved for students.`}
    >
      <p>
        Everything below uses real questions from /content. Items in review appear here so you can judge them, but students only
        ever see approved items.
      </p>
      {rejected.map((r) => (
        <p key={r.id}>
          Rejected by the validator: <strong>{r.id}</strong>. {r.issues[0]?.message}
        </p>
      ))}
    </Notice>
  )
}

function TutorSection() {
  const kemar = questionById('M1-NTC-0006')
  if (!kemar) return null
  const guard = checkTutorMessage(leakyTutorMessage, kemar)
  const fallback = nextHint(kemar, 1, 1)
  return (
    <>
      <QuestionSheet question={kemar}>
        <TutorNote message={goodTutorMessage} />
      </QuestionSheet>
      <p className="caption">That message is the brief's own example. It passes the answer guard.</p>
      <MarginNote tone="neutral" label="The answer guard runs in code before any tutor message is shown.">
        Blocked: "{leakyTutorMessage}", because {guard.reasons.map((r) => GUARD_WORDS[r]).join(' and ')}. The student sees hint{' '}
        {fallback?.rung} instead: "<MathText text={fallback?.lines[0] ?? ''} />"
      </MarginNote>
    </>
  )
}

function TreeSection() {
  const plan = planRemediation(content.tree, exampleStates, 'S1')
  return (
    <>
      <ul className="tree-list">
        {content.tree.nodes.map((node) => (
          <TreeRow key={node.id} node={node} state={exampleStates[node.id]} car={exampleCar[node.id]} />
        ))}
      </ul>
      <MarginNote tone="neutral" label={`Engine plan for Fractions: ${plan.stage}`}>
        {plan.reason}
      </MarginNote>
    </>
  )
}

function ReadinessSection() {
  const syllabus = content.syllabi[0]
  if (!syllabus) return null
  const withEvidence = (sectionId: string) =>
    content.tree.nodes.some((n) => n.syllabusRefs.includes(sectionId) && (exampleStates[n.id]?.attempts ?? 0) > 0)
  const missing = syllabus.sections.filter((s) => !withEvidence(s.id))
  const covered = syllabus.sections.length - missing.length
  return (
    <Readiness
      level="not-ready"
      summary={`Practice so far covers ${covered} of ${syllabus.sections.length} Module 1 sections.`}
      reasons={missing.map((s) => `${s.title}: no practice yet`)}
    />
  )
}

export function StyleGuide() {
  const [theme, setTheme] = useState<ThemeChoice>(loadTheme)
  const [heading, setHeading] = useState<HeadingFont>(loadHeadingFont)
  const [replay, setReplay] = useState(0)

  const simplify = questionById<McqQuestion>('M1-NTC-0001')
  const add = questionById<McqQuestion>('M1-NTC-0002')
  const fractionOf = questionById<McqQuestion>('M1-NTC-0003')
  const order = questionById<McqQuestion>('M1-NTC-0004')
  const kemar = questionById<McqQuestion>('M1-NTC-0006')
  const syllabus = content.syllabi[0]

  return (
    <main className="page">
      <header className="sg-header">
        <p className="caption">BAC design contract</p>
        <h1>Style guide</h1>
        <p className="page__lede">
          Every core component, with real Module 1 questions. Screens reuse these; anything new is added here first. Judge it at 360px
          on a real phone.
        </p>
        <div className="sg-controls">
          <Segmented
            legend="Study mode"
            name="theme"
            value={theme}
            options={[
              ['device', 'Match phone'],
              ['day', 'Day'],
              ['night', 'Night'],
            ]}
            onChange={(value) => {
              applyTheme(value)
              setTheme(value)
            }}
          />
          <Segmented
            legend="Heading font (test all three, keep one)"
            name="heading"
            value={heading}
            options={[
              ['fraunces', 'Fraunces'],
              ['newsreader', 'Newsreader'],
              ['literata', 'Literata'],
            ]}
            onChange={(value) => {
              applyHeadingFont(value)
              setHeading(value)
            }}
          />
        </div>
        <nav aria-label="Style guide sections">
          <ul className="sg-toc">
            {SECTIONS.map(([id, title]) => (
              <li key={id}>
                <a href={`#${id}`}>{title}</a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <ContentStatus />

      <Section id="colour" title="Colour" intro="Values shown are the live ones for the current study mode.">
        <ColourRows theme={theme} />
      </Section>

      <Section id="type" title="Type and space" intro="Headings in the chosen heading font. Body in Atkinson Hyperlegible, never under 16px.">
        <div className="sg-type">
          <h1>{syllabus ? `Module ${syllabus.module}: ${syllabus.title}` : 'Module 1'}</h1>
          <h2>{syllabus?.sections[0]?.title ?? 'Number Theory and Computation'}</h2>
          <h3>{content.tree.nodes.find((n) => n.id === 'S1')?.title}</h3>
          {kemar && (
            <p className="sheet__stem">
              <MathText text={kemar.stem} />
            </p>
          )}
          <p>{content.tree.nodes.find((n) => n.id === 'S1')?.description}</p>
          <p className="caption">Caption text: 0.875rem, for labels only, never for question text.</p>
        </div>
        <h3 className="sg-sub">Spacing, on an 8px grid</h3>
        <ul className="sg-spacing">
          {SPACING.map((px) => (
            <li key={px}>
              <span className="caption tabular">{px}px</span>
              <span style={{ width: `${px}px` }} />
            </li>
          ))}
        </ul>
      </Section>

      <Section id="buttons" title="Buttons" intro="One primary per screen. Labels are verbs. At least 44px tall.">
        <div className="sg-row">
          <Button>Check</Button>
          <Button variant="secondary">Skip for now</Button>
          <Button variant="quiet">Open a hint</Button>
          <Button disabled>Check</Button>
        </div>
      </Section>

      <Section
        id="practice"
        title="A question, start to finish"
        intro="Runs the real engine: answer checking, the skill rating and the hint ladder. Try a wrong answer, open hints, or type the answer instead."
      >
        <PracticeDemo />
      </Section>

      <Section id="states" title="Choice states" intro="Selected, right and wrong. A wrong answer never reveals the right row.">
        {fractionOf && (
          <QuestionSheet question={fractionOf} number={3}>
            <ChoiceList question={fractionOf} selectedId="d" />
          </QuestionSheet>
        )}
        {simplify && (
          <QuestionSheet question={simplify} number={1}>
            <ChoiceList question={simplify} selectedId="b" result={{ correct: true, reason: 'correct', choiceId: 'b' }} />
            <MarginNote tone="correct">
              Right. <MathText text={simplify.workedSolution[simplify.workedSolution.length - 1] ?? ''} />
            </MarginNote>
          </QuestionSheet>
        )}
        {add && (
          <QuestionSheet question={add} number={2}>
            <ChoiceList
              question={add}
              selectedId="a"
              result={{ correct: false, reason: 'distractor', misconceptionId: 'FRAC-ADD-ACROSS', choiceId: 'a' }}
            />
            <MarginNote tone="correction" label="Misconception FRAC-ADD-ACROSS">
              {findMisconception('FRAC-ADD-ACROSS')?.feedback}
            </MarginNote>
          </QuestionSheet>
        )}
      </Section>

      <Section id="answer" title="Answer box" intro="Free response. The keyboard is text until MathLive arrives, because a number pad has no / key.">
        <AnswerBox label="Your answer" value="" help="Write 3/4 for a fraction and 24 300 for thousands." />
        <AnswerBox label="Your answer" value="30" state="correct" />
        <AnswerBox label="Your answer" value="10" state="wrong" />
        <MarginNote tone="correction" label="Misconception FRAC-OF-UNIT-ONLY">
          {findMisconception('FRAC-OF-UNIT-ONLY')?.feedback}
        </MarginNote>
      </Section>

      <Section id="notes" title="Margin notes" intro="The teacher's mark beside the work. Always words, never colour alone.">
        <MarginNote tone="correct">Right. You kept the negative sign through both steps.</MarginNote>
        <MarginNote tone="correction">{findMisconception('FRAC-BIGGER-DEN-SMALLER')?.feedback}</MarginNote>
        <MarginNote tone="neutral">No signal. Your answers are saved on this phone and will sync later.</MarginNote>
      </Section>

      <Section id="hints" title="Hint ladder" intro="Nudge, strategy, one worked step, then the worked example after two attempts.">
        {simplify && (
          <>
            <p className="caption">After one attempt, two rungs open:</p>
            <HintLadder question={simplify} attempts={1} opened={2} />
            <p className="caption">After two attempts, every rung open:</p>
            <HintLadder question={simplify} attempts={2} opened={4} />
          </>
        )}
      </Section>

      <Section id="solution" title="Worked solution" intro="Numbered steps, one per line.">
        {order && (
          <>
            <p className="sheet__stem">
              <MathText text={order.stem} />
            </p>
            <WorkedSolution steps={order.workedSolution} />
          </>
        )}
      </Section>

      <Section id="tutor" title="Tutor" intro="One question, under 60 words, in the margin style. Never a chat bubble, never a sparkle.">
        <TutorSection />
      </Section>

      <Section id="tree" title="Knowledge Tree" intro="An example student. Status in words; gold only when mastered; C-A-R profile underneath.">
        <TreeSection />
      </Section>

      <Section id="readiness" title="Readiness" intro="Example data. The real readiness rules are still to be written in the engine.">
        <ReadinessSection />
      </Section>

      <Section id="notices" title="Loading, empty, error, offline" intro="Every screen defines all four. Say what happened and what to do next.">
        <Notice kind="loading" title="Getting your questions ready" />
        <Notice kind="empty" title="Nothing set for this week yet">
          Your teacher has not set this week's work. You can still do a practice sitting.
        </Notice>
        <Notice kind="error" title="This sitting did not load" action={<Button variant="secondary">Try again</Button>}>
          Your answers so far are saved.
        </Notice>
        <Notice kind="offline" title="No signal">
          Your answers are saved on this phone and will sync when you are back online.
        </Notice>
      </Section>

      <Section id="marks" title="Marks and motion" intro="Drawn like a pen stroke in 150 to 250ms. With reduced motion on, they appear already drawn.">
        <div className="sg-row" key={replay}>
          <Tick />
          <Cross />
          <MasterySeal>Fractions mastered</MasterySeal>
        </div>
        <Button variant="secondary" onClick={() => setReplay(replay + 1)}>
          Draw them again
        </Button>
        <p className="caption">Sound: one steel-pan note on mastery, off by default in class. Not built yet.</p>
        <BottomBar inline>
          <Button variant="quiet">Open a hint</Button>
          <Button>Check</Button>
        </BottomBar>
        <p className="caption">The bottom bar, shown in place here. On a real screen it sticks to the thumb zone.</p>
      </Section>
    </main>
  )
}
