// Shared test data: the real /content files plus small builders for made-up items.

import treeJson from '../../../content/knowledge-tree.json'
import syllabusJson from '../../../content/syllabus/module-1.json'
import misconceptionsJson from '../../../content/misconceptions.json'
import questionsJson from '../../../content/questions/m1-ntc.json'
import type { ContentContext } from '../content'
import type {
  KnowledgeTree,
  McqQuestion,
  MisconceptionCatalog,
  NumericQuestion,
  Question,
  SyllabusModule,
} from '../types'

export const tree = treeJson as KnowledgeTree
export const syllabus = syllabusJson as SyllabusModule
export const misconceptions = misconceptionsJson as MisconceptionCatalog
export const rawQuestions = questionsJson as unknown[]
export const ctx: ContentContext = { tree, syllabi: [syllabus], misconceptions }

export function realQuestion(id: string): Question {
  const found = (questionsJson as Question[]).find((q) => q.id === id)
  if (!found) throw new Error(`No question ${id} in content`)
  return found
}

export function node(id: string) {
  const found = tree.nodes.find((n) => n.id === id)
  if (!found) throw new Error(`No node ${id}`)
  return found
}

export function mcq(overrides: Partial<McqQuestion> = {}): McqQuestion {
  return {
    id: 'M1-NTC-9001',
    status: 'approved',
    module: 1,
    topicId: '1.1',
    treeId: 'S1',
    car: 'A',
    difficulty: 0,
    paper: 'P01',
    country: 'any',
    calculator: false,
    stem: 'Calculate \\(\\frac{1}{4} + \\frac{1}{4}\\).',
    format: 'mcq',
    choices: [
      { id: 'a', text: '\\(\\frac{1}{2}\\)', correct: true },
      { id: 'b', text: '\\(\\frac{2}{8}\\)', misconceptionId: 'FRAC-ADD-ACROSS' },
      { id: 'c', text: '\\(\\frac{1}{8}\\)', misconceptionId: 'FRAC-DIV-AS-MULT' },
      { id: 'd', text: '\\(\\frac{1}{16}\\)', misconceptionId: 'FRAC-SIMPLIFY-UNEQUAL' },
    ],
    workedSolution: ['Quarters add like any other things: 1 quarter + 1 quarter = 2 quarters.', '\\(\\frac{2}{4} = \\frac{1}{2}\\)'],
    hints: ['Are the pieces the same size?', 'Add the tops and keep the bottom.', 'One quarter plus one quarter is how many quarters?'],
    source: 'original',
    version: 1,
    ...overrides,
  }
}

export function numeric(overrides: Partial<NumericQuestion> = {}): NumericQuestion {
  return {
    id: 'M1-NTC-9002',
    status: 'approved',
    module: 1,
    topicId: '1.1',
    treeId: 'S1',
    car: 'A',
    difficulty: 0,
    paper: 'P02',
    country: 'any',
    calculator: false,
    stem: 'Calculate \\(\\frac{1}{4} + \\frac{1}{4}\\).',
    format: 'numeric',
    answer: { value: '1/2' },
    commonErrors: [{ value: '2/8', misconceptionId: 'FRAC-ADD-ACROSS' }],
    workedSolution: ['\\(\\frac{2}{4} = \\frac{1}{2}\\)'],
    hints: ['Are the pieces the same size?', 'Add the tops and keep the bottom.', 'One quarter plus one quarter is how many quarters?'],
    source: 'original',
    version: 1,
    ...overrides,
  }
}
