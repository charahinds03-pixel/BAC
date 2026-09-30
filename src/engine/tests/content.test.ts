import { describe, expect, it } from 'vitest'
import { checkAnswer } from '../answer'
import { loadQuestionBank, validateBank, validateMisconceptions, validateQuestion, validateSyllabus, validateTree } from '../content'
import { ctx, mcq, misconceptions, numeric, rawQuestions, syllabus, tree } from './fixtures'

const errors = (raw: unknown) => validateQuestion(raw, ctx).filter((i) => i.severity === 'error').map((i) => i.message)
const warnings = (raw: unknown) => validateQuestion(raw, ctx).filter((i) => i.severity === 'warning').map((i) => i.message)

describe('support files in /content', () => {
  it('have no errors', () => {
    const sectionIds = new Set(syllabus.sections.map((s) => s.id))
    const all = [...validateTree(tree, sectionIds), ...validateSyllabus(syllabus, 'module-1'), ...validateMisconceptions(misconceptions)]
    expect(all.filter((i) => i.severity === 'error')).toEqual([])
  })
})

describe('every loadable question in /content', () => {
  it('marks its own correct choice right', () => {
    const { questions } = loadQuestionBank(rawQuestions, ctx, ['draft', 'in_review', 'approved'])
    for (const q of questions) {
      if (q.format !== 'mcq') continue
      const key = q.choices.find((c) => c.correct)
      expect(key, q.id).toBeDefined()
      expect(checkAnswer(q, { kind: 'choice', choiceId: key?.id ?? '' }).correct, q.id).toBe(true)
    }
  })
})

describe('validateQuestion', () => {
  it('passes a well-formed item', () => {
    expect(errors(mcq())).toEqual([])
    expect(errors(numeric())).toEqual([])
  })

  it('rejects a wrong dual tag', () => {
    expect(errors(mcq({ treeId: 'Z9' }))).toContain('treeId Z9 is not in the Knowledge Tree')
    expect(errors(mcq({ topicId: '1.9' }))[0]).toMatch(/topicId 1.9 is not a section/)
    expect(errors(mcq({ id: 'M1-SET-0001' }))[0]).toMatch(/id code SET does not match section 1.1/)
  })

  it('rejects a distractor with no known misconception', () => {
    const q = mcq()
    q.choices[1] = { id: 'b', text: '2/8' }
    expect(errors(q)).toContain('choice b needs a misconceptionId')
    q.choices[1] = { id: 'b', text: '2/8', misconceptionId: 'MADE-UP' }
    expect(errors(q)[0]).toMatch(/MADE-UP is not in content\/misconceptions.json/)
  })

  it('rejects anything but exactly one correct choice', () => {
    const q = mcq()
    q.choices[1] = { id: 'b', text: '2/8', correct: true }
    expect(errors(q)).toContain('needs exactly one correct choice, found 2')
  })

  it('rejects a distractor equal to the key unless the item asks for lowest terms', () => {
    const q = mcq()
    q.choices[1] = { id: 'b', text: '\\(\\frac{2}{4}\\)', misconceptionId: 'FRAC-NOT-LOWEST' }
    expect(errors(q)[0]).toMatch(/choice b \(2\/4\) has the same value as the key/)
    expect(errors({ ...q, answerForm: 'simplest' })).toEqual([])
  })

  it('rejects a key that breaks its own answer form', () => {
    const q = mcq({ answerForm: 'simplest' })
    q.choices[0] = { id: 'a', text: '2/4', correct: true }
    expect(errors(q)).toContain('the correct choice is not in lowest terms, but answerForm is "simplest"')
  })

  it('checks money against the country', () => {
    expect(errors(mcq({ country: 'BB', stem: 'A roti costs EC $12. How much?' }))).toContain('stem uses EC $ on a Barbados item')
    expect(warnings(mcq({ stem: 'A roti costs $12. How much?' }))).toContain('stem has a bare $ with no BDS or EC prefix')
  })

  it('rejects unbalanced math delimiters', () => {
    expect(errors(mcq({ stem: 'Calculate \\(\\frac{1}{4} + \\frac{1}{4}.' }))).toContain(
      'stem has unbalanced \\( and \\) math delimiters',
    )
  })

  it('warns about NEEDS-DIAGNOSIS, shared misconceptions and missing hint rungs', () => {
    const q = mcq({ hints: ['Are the pieces the same size?'] })
    q.choices[2] = { id: 'c', text: '1/8', misconceptionId: 'NEEDS-DIAGNOSIS' }
    q.choices[3] = { id: 'd', text: '1/16', misconceptionId: 'FRAC-ADD-ACROSS' }
    const found = warnings(q)
    expect(found).toContain('choice c is tagged NEEDS-DIAGNOSIS: name the error behind it or replace it')
    expect(found).toContain('choices b and d share FRAC-ADD-ACROSS; each wrong option should diagnose a different error')
    expect(found).toContain('has 1 of 3 hint rungs (nudge, strategy, one worked step)')
  })

  it('warns about unknown fields, which are usually typos', () => {
    expect(warnings({ ...mcq(), misconceptionID: 'X' })).toContain('unknown field "misconceptionID" (a typo?)')
  })
})

describe('validateTree', () => {
  it('catches a prerequisite loop', () => {
    const looped = {
      nodes: [
        { id: 'S1', title: 'A', tier: 'stem', prerequisites: ['S2'], description: 'a', syllabusRefs: [] },
        { id: 'S2', title: 'B', tier: 'stem', prerequisites: ['S1'], description: 'b', syllabusRefs: [] },
      ],
    }
    expect(validateTree(looped, new Set()).some((i) => i.message.startsWith('prerequisites form a loop'))).toBe(true)
  })

  it('catches an id that does not match its tier', () => {
    const wrong = { nodes: [{ id: 'S1', title: 'A', tier: 'root', prerequisites: [], description: 'a', syllabusRefs: [] }] }
    expect(validateTree(wrong, new Set()).map((i) => i.message)).toContain('a root id should start with R')
  })
})

describe('validateBank and loadQuestionBank', () => {
  it('rejects duplicate ids', () => {
    const report = validateBank([mcq(), mcq()], ctx)
    expect(report.rejectedIds).toEqual(['M1-NTC-9001'])
  })

  it('gives students approved items only, and never an item with errors', () => {
    const broken = mcq({ id: 'M1-NTC-9003', treeId: 'Z9' })
    const draft = mcq({ id: 'M1-NTC-9004', status: 'draft' })
    const bank = loadQuestionBank([mcq(), broken, draft], ctx)
    expect(bank.questions.map((q) => q.id)).toEqual(['M1-NTC-9001'])
    expect(bank.rejected.map((r) => r.id)).toEqual(['M1-NTC-9003'])
  })

  it('reports the C-A-R mix', () => {
    const report = validateBank([mcq({ id: 'M1-NTC-9005', car: 'C' }), mcq({ id: 'M1-NTC-9006', car: 'C' })], ctx)
    expect(report.car.all).toEqual({ C: 2, A: 0, R: 0 })
    expect(report.issues.some((i) => i.message.startsWith('C-A-R mix across all items'))).toBe(true)
  })
})
