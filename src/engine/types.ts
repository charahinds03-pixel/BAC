// Shared types for content (/content) and the engine. The JSON shapes are
// documented in docs/CONTENT.md; keep the two in step.

export type Car = 'C' | 'A' | 'R'
export type Tier = 'root' | 'stem' | 'branch' | 'node'
export type QuestionStatus = 'draft' | 'in_review' | 'approved' | 'rejected'
export type Country = 'BB' | 'GD' | 'any'
export type Paper = 'P01' | 'P02'
export type Difficulty = -1 | 0 | 1
export type AnswerForm = 'equivalent' | 'simplest' | 'standard-form'

export interface Choice {
  id: string
  text: string
  correct?: boolean
  misconceptionId?: string
}

export interface NumericAnswer {
  value: string
  tolerance?: number
  unit?: string
}

export interface CommonError {
  value: string
  misconceptionId: string
}

interface QuestionBase {
  id: string
  status: QuestionStatus
  module: 1 | 2 | 3
  topicId: string
  treeId: string
  car: Car
  difficulty: Difficulty
  paper: Paper
  country: Country
  calculator: boolean
  stem: string
  answerForm?: AnswerForm
  workedSolution: string[]
  hints: string[]
  strategy?: string
  source: string
  legacyId?: string
  version: number
}

export interface McqQuestion extends QuestionBase {
  format: 'mcq'
  choices: Choice[]
}

export interface NumericQuestion extends QuestionBase {
  format: 'numeric'
  answer: NumericAnswer
  commonErrors?: CommonError[]
}

export type Question = McqQuestion | NumericQuestion

export interface TreeNode {
  id: string
  title: string
  tier: Tier
  prerequisites: string[]
  description: string
  syllabusRefs: string[]
  masteryThreshold?: number
  legacyId?: string
}

export interface KnowledgeTree {
  version: number
  source: string
  nodes: TreeNode[]
}

export interface SyllabusSection {
  id: string
  code: string
  title: string
  paper01Items?: number
  scope?: string
}

export interface SyllabusModule {
  syllabus: string
  module: 1 | 2 | 3
  title: string
  verified: boolean
  verificationNote?: string
  exam?: unknown
  profileWeights: Record<Car, number>
  sections: SyllabusSection[]
}

export interface Misconception {
  id: string
  status: QuestionStatus
  title: string
  description: string
  feedback: string
}

export interface MisconceptionCatalog {
  version: number
  misconceptions: Misconception[]
}

// ---- Student state (stored per student in Firestore by AI Studio's code) ----

/** Where a mastered node sits in its spaced review. Times are epoch milliseconds. */
export interface ReviewState {
  stage: number
  dueAt: number
}

/** The engine's picture of one student on one Knowledge Tree node. */
export interface NodeState {
  /** Skill estimate on the logit scale. 0 means a 50% chance on a medium item. */
  theta: number
  /** Answers that counted as evidence on this node. */
  attempts: number
  review?: ReviewState
}

export type StudentStates = Record<string, NodeState | undefined>
