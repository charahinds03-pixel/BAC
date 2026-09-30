import { useState } from 'react'
import {
  AnswerBox,
  BottomBar,
  Button,
  ChoiceList,
  HintLadder,
  MarginNote,
  MasterySeal,
  MathText,
  QuestionSheet,
  SittingProgress,
} from '../components'
import { findMisconception, findNode, reviewBank } from '../data/content'
import {
  checkAnswer,
  recordAnswer,
  typicalChance,
  type CheckResult,
  type Question,
  type StudentResponse,
  type StudentStates,
} from '../engine'

interface EngineReadout {
  nodeTitle: string
  before: number
  after: number
  counted: boolean
  chance: number
  becameMastered: boolean
}

function Feedback({ question, result }: { question: Question; result: CheckResult }) {
  if (result.correct) {
    const last = question.workedSolution[question.workedSolution.length - 1] ?? ''
    return (
      <MarginNote tone="correct">
        Right. <MathText text={last} />
      </MarginNote>
    )
  }
  if (result.reason === 'distractor') {
    const m = findMisconception(result.misconceptionId)
    return (
      <MarginNote tone="correction" label={`Misconception ${result.misconceptionId ?? 'not tagged'}`}>
        {m?.feedback ?? 'Not quite. Open a hint and try again.'}
      </MarginNote>
    )
  }
  if (result.reason === 'wrong-form') {
    const want = question.answerForm === 'standard-form' ? 'in standard form' : 'in its lowest terms'
    return <MarginNote tone="correction">Right value, but the question wants it {want}.</MarginNote>
  }
  return <MarginNote tone="correction">Not quite. Open a hint and try again.</MarginNote>
}

/**
 * A practice sitting in miniature, running the real engine on every loadable
 * Module 1 item. Style guide only: the real sitting screen is AI Studio's.
 */
export function PracticeDemo() {
  const items = reviewBank.questions
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<'tap' | 'type'>('tap')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [typed, setTyped] = useState('')
  const [result, setResult] = useState<CheckResult | null>(null)
  const [unreadable, setUnreadable] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [hintsOpened, setHintsOpened] = useState(0)
  const [showHints, setShowHints] = useState(false)
  const [states, setStates] = useState<StudentStates>({})
  const [readout, setReadout] = useState<EngineReadout | null>(null)

  const question = items[index]
  if (!question) return <p>No loadable questions in /content yet.</p>

  const canCheck = !result && (mode === 'tap' ? selectedId !== null : typed.trim() !== '')

  function check() {
    if (!question || !canCheck) return
    const response: StudentResponse =
      mode === 'tap' ? { kind: 'choice', choiceId: selectedId ?? '' } : { kind: 'typed', text: typed }
    const checked = checkAnswer(question, response)
    if (checked.reason === 'unreadable') {
      setUnreadable(true)
      return
    }
    setUnreadable(false)
    const node = findNode(question.treeId)
    const attemptNumber = attempts + 1
    if (node) {
      const before = states[node.id]
      const outcome = recordAnswer({
        node,
        state: before,
        itemDifficulty: question.difficulty,
        correct: checked.correct,
        attemptNumber,
        hintsSeen: hintsOpened,
        now: Date.now(),
      })
      setStates({ ...states, [node.id]: outcome.state })
      setReadout({
        nodeTitle: node.title,
        before: before?.theta ?? 0,
        after: outcome.state.theta,
        counted: outcome.counted,
        chance: typicalChance(outcome.state),
        becameMastered: outcome.becameMastered,
      })
    }
    setAttempts(attemptNumber)
    setResult(checked)
  }

  function tryAgain() {
    setResult(null)
    setSelectedId(null)
    setTyped('')
  }

  function next() {
    setIndex((index + 1) % items.length)
    setResult(null)
    setUnreadable(false)
    setSelectedId(null)
    setTyped('')
    setAttempts(0)
    setHintsOpened(0)
    setShowHints(false)
    setReadout(null)
  }

  return (
    <div className="sg-stack">
      <SittingProgress current={index + 1} total={items.length} />
      <QuestionSheet question={question} number={index + 1}>
        {mode === 'tap' && question.format === 'mcq' ? (
          <ChoiceList question={question} selectedId={selectedId} onSelect={setSelectedId} result={result} />
        ) : (
          <AnswerBox
            label="Your answer"
            value={typed}
            onChange={result ? undefined : setTyped}
            onSubmit={check}
            state={result ? (result.correct ? 'correct' : 'wrong') : undefined}
            help="Write 3/4 for a fraction, 1 1/2 for a mixed number, and 24 300 or 24,300 for thousands."
          />
        )}
        {unreadable && !result && (
          <MarginNote tone="neutral">That does not read as a number yet. Try digits, like 12 or 3/4.</MarginNote>
        )}
        {result && <Feedback question={question} result={result} />}
        {readout?.becameMastered && <MasterySeal>{`${readout.nodeTitle} mastered`}</MasterySeal>}
      </QuestionSheet>

      {showHints && (
        <HintLadder question={question} attempts={attempts} opened={hintsOpened} onOpenNext={() => setHintsOpened(hintsOpened + 1)} />
      )}

      <BottomBar inline>
        {!result?.correct && (
          <Button variant="quiet" onClick={() => setShowHints(!showHints)}>
            {showHints ? 'Hide hints' : 'Open a hint'}
          </Button>
        )}
        {!result && (
          <Button onClick={check} disabled={!canCheck}>
            Check
          </Button>
        )}
        {result && !result.correct && <Button onClick={tryAgain}>Try again</Button>}
        {result?.correct && <Button onClick={next}>Next question</Button>}
      </BottomBar>

      <div className="sg-row">
        {question.format === 'mcq' && !result && (
          <Button variant="secondary" onClick={() => setMode(mode === 'tap' ? 'type' : 'tap')}>
            {mode === 'tap' ? 'Type the answer instead' : 'Tap a choice instead'}
          </Button>
        )}
        <Button variant="quiet" onClick={next}>
          Skip to the next item
        </Button>
      </div>

      <p className="sg-engine">
        {question.id} · tree {question.treeId} · syllabus {question.topicId} · {question.car} · attempts {attempts} · hints{' '}
        {hintsOpened}
        {readout &&
          ` · ${readout.nodeTitle}: skill ${readout.before.toFixed(2)} to ${readout.after.toFixed(2)}` +
            ` (${readout.counted ? 'counted' : 'not counted'}), typical-item chance ${Math.round(readout.chance * 100)}%`}
      </p>
    </div>
  )
}
