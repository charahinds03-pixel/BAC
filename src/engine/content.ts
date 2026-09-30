// Content validation. The rules are written out in docs/CONTENT.md.
// Errors reject an item; warnings flag it for Chara's review. The app runs
// loadQuestionBank on start, and scripts/validate-content.ts runs the same
// checks from the command line.

import { equals, parseNumber, type ParsedNumber } from './numbers'
import { mathDelimitersBalanced, plainText } from './mathText'
import type {
  AnswerForm,
  Car,
  KnowledgeTree,
  MisconceptionCatalog,
  Question,
  QuestionStatus,
  SyllabusModule,
  Tier,
} from './types'

export type Severity = 'error' | 'warning'

export interface Issue {
  severity: Severity
  /** The item, node or file the issue belongs to, for example M1-NTC-0005. */
  where: string
  message: string
}

export interface ContentContext {
  tree: KnowledgeTree
  syllabi: SyllabusModule[]
  misconceptions: MisconceptionCatalog
}

export const NEEDS_DIAGNOSIS = 'NEEDS-DIAGNOSIS'
export const CAR_TARGET: Record<Car, number> = { C: 0.3, A: 0.4, R: 0.3 }
/** How far, in percentage points, the C-A-R mix may drift before the validator warns. */
export const CAR_DRIFT_ALLOWED = 10

const STATUSES: QuestionStatus[] = ['draft', 'in_review', 'approved', 'rejected']
const CARS: Car[] = ['C', 'A', 'R']
const COUNTRIES = ['BB', 'GD', 'any']
const PAPERS = ['P01', 'P02']
const FORMATS = ['mcq', 'numeric']
const ANSWER_FORMS: AnswerForm[] = ['equivalent', 'simplest', 'standard-form']
const SOURCES = ['original', 'adapted', 'cxc-past-paper', 'model-draft', 'phase-0-mvp', 'brief-example']
const TIERS: Tier[] = ['root', 'stem', 'branch', 'node']
const TIER_PREFIX: Record<Tier, string> = { root: 'R', stem: 'S', branch: 'B', node: 'N' }
const TIER_ORDER: Record<Tier, number> = { root: 0, stem: 1, branch: 2, node: 3 }

const QUESTION_KEYS = new Set([
  'id', 'status', 'module', 'topicId', 'treeId', 'car', 'difficulty', 'paper', 'country',
  'calculator', 'stem', 'format', 'choices', 'answer', 'commonErrors', 'answerForm',
  'workedSolution', 'hints', 'strategy', 'source', 'legacyId', 'version',
])
const CHOICE_KEYS = new Set(['id', 'text', 'correct', 'misconceptionId'])
const TREE_NODE_KEYS = new Set([
  'id', 'title', 'tier', 'prerequisites', 'description', 'syllabusRefs', 'masteryThreshold', 'legacyId',
])

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const isText = (v: unknown): v is string => typeof v === 'string' && v.trim() !== ''
const isTextList = (v: unknown): v is string[] => Array.isArray(v) && v.every(isText)

function collector(where: string) {
  const issues: Issue[] = []
  return {
    issues,
    error: (message: string) => issues.push({ severity: 'error', where, message }),
    warn: (message: string) => issues.push({ severity: 'warning', where, message }),
  }
}

// ---------------------------------------------------------------- questions

/** An equal-value distractor is fine only when the item demands a form it breaks. */
function allowedEquivalent(value: ParsedNumber, form: AnswerForm): boolean {
  if (form === 'simplest') return !value.lowestTerms
  if (form === 'standard-form') return !value.standardForm
  return false
}

function keyFormProblem(key: ParsedNumber, form: AnswerForm): string | null {
  if (form === 'simplest' && !key.lowestTerms) return 'is not in lowest terms, but answerForm is "simplest"'
  if (form === 'standard-form' && !key.standardForm) return 'is not in standard form, but answerForm is "standard-form"'
  return null
}

function checkText(
  label: string,
  text: string,
  country: unknown,
  error: (m: string) => void,
  warn: (m: string) => void,
): void {
  if (!mathDelimitersBalanced(text)) error(`${label} has unbalanced \\( and \\) math delimiters`)
  if (text.includes('—')) warn(`${label} contains an em dash`)
  for (const match of text.matchAll(/(BDS|BBD|EC|XCD)?\s?\$/gi)) {
    const prefix = match[1]?.toUpperCase()
    if (!prefix) warn(`${label} has a bare $ with no BDS or EC prefix`)
    else if (country === 'BB' && (prefix === 'EC' || prefix === 'XCD')) error(`${label} uses EC $ on a Barbados item`)
    else if (country === 'GD' && (prefix === 'BDS' || prefix === 'BBD')) error(`${label} uses BDS $ on a Grenada item`)
    else if (country === 'any') warn(`${label} mentions ${prefix} $ but country is "any"`)
  }
}

/** Checks one question against docs/CONTENT.md. Returns every problem found. */
export function validateQuestion(raw: unknown, ctx: ContentContext, fallbackWhere = 'question'): Issue[] {
  if (!isObj(raw)) return [{ severity: 'error', where: fallbackWhere, message: 'is not a JSON object' }]
  const where = typeof raw.id === 'string' ? raw.id : fallbackWhere
  const { issues, error, warn } = collector(where)
  const catalog = new Map(ctx.misconceptions.misconceptions.map((m) => [m.id, m]))

  for (const key of Object.keys(raw)) {
    if (!QUESTION_KEYS.has(key)) warn(`unknown field "${key}" (a typo?)`)
  }

  const idMatch = typeof raw.id === 'string' ? /^M([1-3])-([A-Z]{2,4})-(\d{4})$/.exec(raw.id) : null
  if (!idMatch) error('id must look like M1-NTC-0001')

  if (!STATUSES.includes(raw.status as QuestionStatus)) error(`status must be one of ${STATUSES.join(', ')}`)

  const module = raw.module
  if (module !== 1 && module !== 2 && module !== 3) error('module must be 1, 2 or 3')
  else if (idMatch && Number(idMatch[1]) !== module) error(`id says Module ${idMatch[1]} but module is ${module}`)

  if (!isText(raw.topicId)) error('topicId is missing')
  else {
    const syllabus = ctx.syllabi.find((s) => s.module === module)
    const section = syllabus?.sections.find((s) => s.id === raw.topicId)
    if (!syllabus) error(`there is no syllabus map for Module ${String(module)}`)
    else if (!section) error(`topicId ${raw.topicId} is not a section of the Module ${String(module)} syllabus map`)
    else if (idMatch && idMatch[2] !== section.code) {
      error(`id code ${idMatch[2]} does not match section ${section.id}, whose code is ${section.code}`)
    }
  }

  if (!isText(raw.treeId)) error('treeId is missing')
  else if (!ctx.tree.nodes.some((n) => n.id === raw.treeId)) error(`treeId ${raw.treeId} is not in the Knowledge Tree`)

  if (!CARS.includes(raw.car as Car)) error('car must be C, A or R')
  if (raw.difficulty !== -1 && raw.difficulty !== 0 && raw.difficulty !== 1) error('difficulty must be -1, 0 or 1')
  if (!PAPERS.includes(raw.paper as string)) error('paper must be P01 or P02')
  if (!COUNTRIES.includes(raw.country as string)) error('country must be BB, GD or any')
  if (typeof raw.calculator !== 'boolean') error('calculator must be true or false')
  if (raw.paper === 'P01' && raw.calculator === true) warn('Paper 01 items do not allow a calculator')
  if (!isText(raw.stem)) error('stem is missing')
  if (!FORMATS.includes(raw.format as string)) error('format must be mcq or numeric')
  if (raw.answerForm !== undefined && !ANSWER_FORMS.includes(raw.answerForm as AnswerForm)) {
    error(`answerForm must be one of ${ANSWER_FORMS.join(', ')}`)
  }
  const form: AnswerForm = ANSWER_FORMS.includes(raw.answerForm as AnswerForm) ? (raw.answerForm as AnswerForm) : 'equivalent'

  if (!isTextList(raw.workedSolution) || raw.workedSolution.length === 0) error('workedSolution needs at least one step')
  if (!isTextList(raw.hints) || raw.hints.length === 0) error('hints needs at least one rung')
  else if (raw.hints.length > 3) error('hints has more than three rungs; the fourth rung is the worked solution')
  else if (raw.hints.length < 3) warn(`has ${raw.hints.length} of 3 hint rungs (nudge, strategy, one worked step)`)
  if (raw.strategy !== undefined && !isText(raw.strategy)) error('strategy must be a short text tag')
  if (!isText(raw.source)) error('source is missing')
  else if (!SOURCES.includes(raw.source)) warn(`source "${raw.source}" is not one of ${SOURCES.join(', ')}`)
  if (raw.legacyId !== undefined && !isText(raw.legacyId)) error('legacyId must be text')
  if (!Number.isInteger(raw.version) || (raw.version as number) < 1) error('version must be a whole number from 1')

  const usedMisconceptions: string[] = []
  const checkMisconception = (value: unknown, label: string) => {
    if (!isText(value)) return error(`${label} needs a misconceptionId`)
    if (!catalog.has(value)) return error(`${label}: ${value} is not in content/misconceptions.json`)
    usedMisconceptions.push(value)
    if (value === NEEDS_DIAGNOSIS) warn(`${label} is tagged ${NEEDS_DIAGNOSIS}: name the error behind it or replace it`)
  }

  if (isText(raw.stem)) checkText('stem', raw.stem, raw.country, error, warn)
  if (isTextList(raw.hints)) raw.hints.forEach((h, i) => checkText(`hint ${i + 1}`, h, raw.country, error, warn))
  if (isTextList(raw.workedSolution)) {
    raw.workedSolution.forEach((s, i) => checkText(`solution step ${i + 1}`, s, raw.country, error, warn))
  }

  if (raw.format === 'mcq') {
    const choices = raw.choices
    if (!Array.isArray(choices) || choices.length < 2 || choices.length > 5) {
      error('choices must be a list of 2 to 5 options')
    } else {
      if (raw.paper === 'P01' && choices.length !== 4) warn(`Paper 01 items have 4 options; this one has ${choices.length}`)
      const ids = new Set<string>()
      const texts = new Map<string, string>()
      const correct: Obj[] = []
      const distractors: Obj[] = []
      choices.forEach((choice, index) => {
        const label = `choice ${isObj(choice) && typeof choice.id === 'string' ? choice.id : index + 1}`
        if (!isObj(choice)) return error(`${label} is not an object`)
        for (const key of Object.keys(choice)) if (!CHOICE_KEYS.has(key)) warn(`${label} has unknown field "${key}"`)
        if (typeof choice.id !== 'string' || !/^[a-e]$/.test(choice.id)) error(`${label}: id must be a letter a to e`)
        else if (ids.has(choice.id)) error(`${label}: duplicate choice id`)
        else ids.add(choice.id)
        if (!isText(choice.text)) error(`${label}: text is missing`)
        else {
          checkText(label, choice.text, raw.country, error, warn)
          const flat = plainText(choice.text).toLowerCase()
          const twin = texts.get(flat)
          if (twin !== undefined) error(`${label} has the same text as choice ${twin}`)
          else texts.set(flat, String(choice.id))
        }
        if (choice.correct === true) {
          correct.push(choice)
          if (choice.misconceptionId !== undefined) warn(`${label} is the correct choice but has a misconceptionId`)
        } else {
          if (choice.correct !== undefined) error(`${label}: correct must be true or left out`)
          distractors.push(choice)
          checkMisconception(choice.misconceptionId, label)
        }
      })

      if (correct.length !== 1) error(`needs exactly one correct choice, found ${correct.length}`)

      const byMisconception = new Map<string, string[]>()
      for (const d of distractors) {
        if (typeof d.misconceptionId !== 'string' || d.misconceptionId === NEEDS_DIAGNOSIS) continue
        byMisconception.set(d.misconceptionId, [...(byMisconception.get(d.misconceptionId) ?? []), String(d.id)])
      }
      for (const [id, choiceIds] of byMisconception) {
        if (choiceIds.length > 1) {
          warn(`choices ${choiceIds.join(' and ')} share ${id}; each wrong option should diagnose a different error`)
        }
      }

      const keyChoice = correct[0]
      const key = correct.length === 1 && keyChoice && isText(keyChoice.text) ? parseNumber(keyChoice.text) : null
      if (key && keyChoice) {
        const problem = keyFormProblem(key, form)
        if (problem) error(`the correct choice ${problem}`)
        for (const d of distractors) {
          if (!isText(d.text)) continue
          const value = parseNumber(d.text)
          if (value && equals(value.value, key.value) && !allowedEquivalent(value, form)) {
            error(
              `choice ${String(d.id)} (${plainText(d.text)}) has the same value as the key (${plainText(String(keyChoice.text))}) ` +
                `and this item accepts any equivalent answer, so a student who picks it is right. ` +
                `Either ask for lowest terms in the stem and set answerForm to "simplest", or replace the distractor.`,
            )
          }
        }
      } else if (correct.length === 1 && form !== 'equivalent') {
        error(`answerForm "${form}" needs a numeric correct choice`)
      }
    }
  }

  if (raw.format === 'numeric') {
    const answer = raw.answer
    let key: ParsedNumber | null = null
    if (!isObj(answer) || !isText(answer.value)) error('numeric items need answer.value')
    else {
      const unit = isText(answer.unit) ? answer.unit : undefined
      key = parseNumber(answer.value, unit)
      if (!key) error(`answer.value "${answer.value}" is not a number the checker can read`)
      else {
        const problem = keyFormProblem(key, form)
        if (problem) error(`answer.value ${problem}`)
      }
      if (answer.tolerance !== undefined && (typeof answer.tolerance !== 'number' || answer.tolerance < 0)) {
        error('answer.tolerance must be a number of 0 or more')
      }
      if (answer.unit !== undefined && !isText(answer.unit)) error('answer.unit must be text')
    }
    if (raw.commonErrors !== undefined) {
      if (!Array.isArray(raw.commonErrors)) error('commonErrors must be a list')
      else {
        raw.commonErrors.forEach((entry, index) => {
          const label = `common error ${index + 1}`
          if (!isObj(entry) || !isText(entry.value)) return error(`${label} needs a value`)
          const value = parseNumber(entry.value)
          if (!value) error(`${label}: "${entry.value}" is not a number the checker can read`)
          else if (key && equals(value.value, key.value) && !allowedEquivalent(value, form)) {
            error(`${label} (${entry.value}) has the same value as the answer`)
          }
          checkMisconception(entry.misconceptionId, label)
        })
      }
    }
  }

  if (raw.status === 'approved') {
    for (const id of new Set(usedMisconceptions)) {
      const entry = catalog.get(id)
      if (entry && entry.status !== 'approved') warn(`is approved but the feedback for ${id} is still ${entry.status}`)
    }
  }

  return issues
}

// ------------------------------------------------------------ support files

/** Checks the Knowledge Tree: ids, tiers, prerequisites and cycles. */
export function validateTree(raw: unknown, sectionIds: Set<string>): Issue[] {
  const { issues, error } = collector('knowledge-tree')
  if (!isObj(raw) || !Array.isArray(raw.nodes)) {
    error('must be an object with a nodes list')
    return issues
  }
  const nodes = raw.nodes.filter(isObj)
  if (nodes.length !== raw.nodes.length) error('every node must be an object')
  const byId = new Map<string, Obj>()
  for (const node of nodes) {
    const id = typeof node.id === 'string' ? node.id : '?'
    const tier = node.tier as Tier
    const nodeIssue = (severity: Severity, message: string) => issues.push({ severity, where: `tree ${id}`, message })
    for (const key of Object.keys(node)) if (!TREE_NODE_KEYS.has(key)) nodeIssue('warning', `unknown field "${key}"`)
    if (!/^[RSBN]\d+$/.test(id)) nodeIssue('error', 'id must be R, S, B or N followed by a number')
    if (byId.has(id)) nodeIssue('error', 'duplicate node id')
    byId.set(id, node)
    if (!TIERS.includes(tier)) nodeIssue('error', `tier must be one of ${TIERS.join(', ')}`)
    else if (!id.startsWith(TIER_PREFIX[tier])) nodeIssue('error', `a ${tier} id should start with ${TIER_PREFIX[tier]}`)
    if (!isText(node.title)) nodeIssue('error', 'title is missing')
    if (!isText(node.description)) nodeIssue('error', 'description is missing')
    if (!Array.isArray(node.prerequisites) || !node.prerequisites.every(isText)) {
      nodeIssue('error', 'prerequisites must be a list of node ids')
    } else if (tier === 'root' && node.prerequisites.length > 0) {
      nodeIssue('warning', 'is a root but has prerequisites')
    }
    if (!Array.isArray(node.syllabusRefs) || !node.syllabusRefs.every(isText)) {
      nodeIssue('error', 'syllabusRefs must be a list of section ids')
    } else {
      for (const ref of node.syllabusRefs) {
        if (!sectionIds.has(ref)) nodeIssue('error', `syllabusRefs has ${ref}, which is not in any syllabus map`)
      }
    }
    if (node.masteryThreshold !== undefined) {
      const t = node.masteryThreshold
      if (typeof t !== 'number' || t < 0.5 || t > 0.95) nodeIssue('error', 'masteryThreshold must be between 0.5 and 0.95')
    }
  }

  for (const node of nodes) {
    if (!Array.isArray(node.prerequisites)) continue
    for (const pre of node.prerequisites) {
      const target = byId.get(String(pre))
      if (pre === node.id) issues.push({ severity: 'error', where: `tree ${String(node.id)}`, message: 'lists itself as a prerequisite' })
      else if (!target) issues.push({ severity: 'error', where: `tree ${String(node.id)}`, message: `prerequisite ${String(pre)} does not exist` })
      else if (TIER_ORDER[target.tier as Tier] > TIER_ORDER[node.tier as Tier]) {
        issues.push({
          severity: 'warning',
          where: `tree ${String(node.id)}`,
          message: `prerequisite ${String(pre)} is a ${String(target.tier)}, higher up the tree than this ${String(node.tier)}`,
        })
      }
    }
  }

  // Depth-first search for cycles, which would make remediation loop forever.
  const state = new Map<string, 'visiting' | 'done'>()
  const visit = (id: string, path: string[]): void => {
    if (state.get(id) === 'done') return
    if (state.get(id) === 'visiting') {
      error(`prerequisites form a loop: ${[...path.slice(path.indexOf(id)), id].join(' -> ')}`)
      return
    }
    state.set(id, 'visiting')
    const pres = byId.get(id)?.prerequisites
    if (Array.isArray(pres)) for (const pre of pres) if (byId.has(String(pre))) visit(String(pre), [...path, id])
    state.set(id, 'done')
  }
  for (const id of byId.keys()) visit(id, [])

  return issues
}

/** Checks one module's syllabus map. */
export function validateSyllabus(raw: unknown, where: string): Issue[] {
  const { issues, error, warn } = collector(where)
  if (!isObj(raw)) {
    error('must be a JSON object')
    return issues
  }
  const module = raw.module
  if (module !== 1 && module !== 2 && module !== 3) error('module must be 1, 2 or 3')
  if (!isText(raw.title)) error('title is missing')
  if (raw.verified !== true) warn('is not verified against the syllabus yet (verified is false)')
  const weights = raw.profileWeights
  if (!isObj(weights) || CARS.some((c) => typeof weights[c] !== 'number')) error('profileWeights needs numbers for C, A and R')
  else if (Math.abs(CARS.reduce((sum, c) => sum + (weights[c] as number), 0) - 1) > 0.001) error('profileWeights must add up to 1')
  if (!Array.isArray(raw.sections) || raw.sections.length === 0) {
    error('sections must be a non-empty list')
    return issues
  }
  const ids = new Set<string>()
  const codes = new Set<string>()
  for (const section of raw.sections) {
    if (!isObj(section)) {
      error('every section must be an object')
      continue
    }
    const id = String(section.id)
    if (!new RegExp(`^${String(module)}\\.\\d+$`).test(id)) error(`section id ${id} should look like ${String(module)}.1`)
    if (ids.has(id)) error(`duplicate section id ${id}`)
    ids.add(id)
    if (typeof section.code !== 'string' || !/^[A-Z]{2,4}$/.test(section.code)) error(`section ${id}: code must be 2 to 4 capital letters`)
    else if (codes.has(section.code)) error(`section ${id}: duplicate code ${section.code}`)
    else codes.add(section.code)
    if (!isText(section.title)) error(`section ${id}: title is missing`)
  }
  return issues
}

/** Checks the misconception catalog. */
export function validateMisconceptions(raw: unknown): Issue[] {
  const { issues, error } = collector('misconceptions')
  if (!isObj(raw) || !Array.isArray(raw.misconceptions)) {
    error('must be an object with a misconceptions list')
    return issues
  }
  const seen = new Set<string>()
  for (const entry of raw.misconceptions) {
    if (!isObj(entry)) {
      error('every entry must be an object')
      continue
    }
    const id = String(entry.id)
    const entryIssue = (severity: Severity, message: string) => issues.push({ severity, where: id, message })
    if (!/^[A-Z]+(?:-[A-Z0-9]+)+$/.test(id)) entryIssue('error', 'id must be UPPER-KEBAB-CASE with an area prefix, like FRAC-ADD-ACROSS')
    if (seen.has(id)) entryIssue('error', 'duplicate misconception id')
    seen.add(id)
    if (!STATUSES.includes(entry.status as QuestionStatus)) entryIssue('error', `status must be one of ${STATUSES.join(', ')}`)
    for (const field of ['title', 'description', 'feedback']) {
      if (!isText(entry[field])) entryIssue('error', `${field} is missing`)
    }
    if (isText(entry.feedback)) {
      if (entry.feedback.includes('—')) entryIssue('warning', 'feedback contains an em dash')
      if (entry.feedback.includes('!')) entryIssue('warning', 'feedback uses an exclamation mark')
    }
  }
  return issues
}

// ---------------------------------------------------------------- the bank

export interface BankReport {
  issues: Issue[]
  total: number
  byStatus: Record<QuestionStatus, number>
  /** Items with at least one error. They never load. */
  rejectedIds: string[]
  car: { all: Record<Car, number>; approved: Record<Car, number> }
  sectionsWithoutQuestions: string[]
  nodesWithoutQuestions: string[]
}

const emptyCar = (): Record<Car, number> => ({ C: 0, A: 0, R: 0 })

function carDrift(counts: Record<Car, number>): string | null {
  const total = counts.C + counts.A + counts.R
  if (total === 0) return null
  const drifting = CARS.some((c) => Math.abs((counts[c] / total) * 100 - CAR_TARGET[c] * 100) > CAR_DRIFT_ALLOWED)
  if (!drifting) return null
  const share = (c: Car) => `${c} ${counts[c]} (${Math.round((counts[c] / total) * 100)}%)`
  return `${CARS.map(share).join(', ')} against a target of 30/40/30`
}

/** Validates every question plus the bank as a whole. */
export function validateBank(rawQuestions: unknown[], ctx: ContentContext): BankReport {
  const issues: Issue[] = []
  const byStatus: Record<QuestionStatus, number> = { draft: 0, in_review: 0, approved: 0, rejected: 0 }
  const car = { all: emptyCar(), approved: emptyCar() }
  const seen = new Map<string, number>()
  const errored = new Set<string>()
  const topicsUsed = new Set<string>()
  const nodesUsed = new Set<string>()

  rawQuestions.forEach((raw, index) => {
    const where = isObj(raw) && typeof raw.id === 'string' ? raw.id : `question #${index + 1}`
    const found = validateQuestion(raw, ctx, where)
    seen.set(where, (seen.get(where) ?? 0) + 1)
    if (seen.get(where) === 2) found.push({ severity: 'error', where, message: 'id is used by more than one question' })
    if (found.some((i) => i.severity === 'error')) errored.add(where)
    issues.push(...found)
    if (!isObj(raw)) return
    if (STATUSES.includes(raw.status as QuestionStatus)) byStatus[raw.status as QuestionStatus] += 1
    if (CARS.includes(raw.car as Car) && raw.status !== 'rejected') {
      car.all[raw.car as Car] += 1
      if (raw.status === 'approved') car.approved[raw.car as Car] += 1
    }
    if (typeof raw.module === 'number' && typeof raw.topicId === 'string') topicsUsed.add(`${raw.module}:${raw.topicId}`)
    if (typeof raw.treeId === 'string') nodesUsed.add(raw.treeId)
  })

  const driftAll = carDrift(car.all)
  if (driftAll) issues.push({ severity: 'warning', where: 'bank', message: `C-A-R mix across all items is ${driftAll}` })
  const driftApproved = carDrift(car.approved)
  if (driftApproved) issues.push({ severity: 'warning', where: 'bank', message: `C-A-R mix across approved items is ${driftApproved}` })
  if (byStatus.approved === 0) issues.push({ severity: 'warning', where: 'bank', message: 'no items are approved yet, so students would see nothing' })

  const sectionsWithoutQuestions = ctx.syllabi.flatMap((s) =>
    s.sections.filter((sec) => !topicsUsed.has(`${s.module}:${sec.id}`)).map((sec) => `${sec.id} ${sec.title}`),
  )
  if (sectionsWithoutQuestions.length > 0) {
    issues.push({ severity: 'warning', where: 'bank', message: `syllabus sections with no questions: ${sectionsWithoutQuestions.join('; ')}` })
  }
  const nodesWithoutQuestions = ctx.tree.nodes.filter((n) => !nodesUsed.has(n.id)).map((n) => `${n.id} ${n.title}`)
  if (nodesWithoutQuestions.length > 0) {
    issues.push({ severity: 'warning', where: 'bank', message: `tree nodes with no questions: ${nodesWithoutQuestions.join('; ')}` })
  }

  return {
    issues,
    total: rawQuestions.length,
    byStatus,
    rejectedIds: [...errored],
    car,
    sectionsWithoutQuestions,
    nodesWithoutQuestions,
  }
}

export interface LoadedBank {
  questions: Question[]
  rejected: { id: string; issues: Issue[] }[]
}

/**
 * Loads questions for use. Items with any error are rejected, and only the
 * listed statuses are kept. Students get approved items only; the style
 * guide and review tools may ask for in_review too.
 */
export function loadQuestionBank(
  rawQuestions: unknown[],
  ctx: ContentContext,
  statuses: QuestionStatus[] = ['approved'],
): LoadedBank {
  const questions: Question[] = []
  const rejected: LoadedBank['rejected'] = []
  const ids = new Set<string>()
  rawQuestions.forEach((raw, index) => {
    const where = isObj(raw) && typeof raw.id === 'string' ? raw.id : `question #${index + 1}`
    const errors = validateQuestion(raw, ctx, where).filter((i) => i.severity === 'error')
    if (ids.has(where)) errors.push({ severity: 'error', where, message: 'id is used by more than one question' })
    ids.add(where)
    if (errors.length > 0) rejected.push({ id: where, issues: errors })
    else if (statuses.includes((raw as Question).status)) questions.push(raw as Question)
  })
  return { questions, rejected }
}
