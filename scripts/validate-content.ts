// Checks everything in /content against docs/CONTENT.md.
// Run it with: npm run validate
// It prints every error (the item is rejected and never loads) and every
// warning (the item loads but needs a look), then exits with code 1 if
// anything was rejected.

import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import katex from 'katex'
import {
  validateBank,
  validateMisconceptions,
  validateSyllabus,
  validateTree,
  type ContentContext,
  type Issue,
} from '../src/engine/content'
import { splitMath } from '../src/engine/mathText'
import type { KnowledgeTree, MisconceptionCatalog, SyllabusModule } from '../src/engine/types'

const contentDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'content')
const issues: Issue[] = []
const fileLines: string[] = []

function readJson(path: string): unknown {
  const name = relative(contentDir, path)
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (e) {
    issues.push({ severity: 'error', where: name, message: `is not valid JSON: ${(e as Error).message}` })
    return undefined
  }
}

const listJson = (dir: string) =>
  readdirSync(join(contentDir, dir))
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => join(contentDir, dir, f))

// 1. Syllabus maps
const syllabi: SyllabusModule[] = []
for (const path of listJson('syllabus')) {
  const raw = readJson(path)
  const name = relative(contentDir, path)
  if (raw === undefined) continue
  issues.push(...validateSyllabus(raw, name))
  const sections = (raw as SyllabusModule).sections ?? []
  fileLines.push(`${name.padEnd(28)}${sections.length} sections`)
  syllabi.push(raw as SyllabusModule)
}
const sectionIds = new Set(syllabi.flatMap((s) => (s.sections ?? []).map((sec) => sec.id)))

// 2. Knowledge Tree
const treeRaw = readJson(join(contentDir, 'knowledge-tree.json'))
issues.push(...validateTree(treeRaw, sectionIds))
const tree = (treeRaw ?? { version: 0, source: '', nodes: [] }) as KnowledgeTree
fileLines.push(`${'knowledge-tree.json'.padEnd(28)}${tree.nodes?.length ?? 0} nodes`)

// 3. Misconceptions
const catalogRaw = readJson(join(contentDir, 'misconceptions.json'))
issues.push(...validateMisconceptions(catalogRaw))
const misconceptions = (catalogRaw ?? { version: 0, misconceptions: [] }) as MisconceptionCatalog
fileLines.push(`${'misconceptions.json'.padEnd(28)}${misconceptions.misconceptions?.length ?? 0} misconceptions`)

// 4. Questions
const questions: unknown[] = []
for (const path of listJson('questions')) {
  const raw = readJson(path)
  const name = relative(contentDir, path)
  if (raw === undefined) continue
  if (!Array.isArray(raw)) {
    issues.push({ severity: 'error', where: name, message: 'must be a list of questions' })
    continue
  }
  fileLines.push(`${name.padEnd(28)}${raw.length} questions`)
  questions.push(...raw)
}

const ctx: ContentContext = { tree, syllabi, misconceptions }
const report = validateBank(questions, ctx)
issues.push(...report.issues)

// 5. Math: every \( ... \) segment must render in KaTeX.
const rejected = new Set(report.rejectedIds)
for (const q of questions) {
  if (typeof q !== 'object' || q === null) continue
  const item = q as Record<string, unknown>
  const where = String(item.id)
  const texts: [string, unknown][] = [['stem', item.stem]]
  if (Array.isArray(item.choices)) item.choices.forEach((c, i) => texts.push([`choice ${(c as { id?: string }).id ?? i + 1}`, (c as { text?: unknown }).text]))
  if (Array.isArray(item.hints)) item.hints.forEach((h, i) => texts.push([`hint ${i + 1}`, h]))
  if (Array.isArray(item.workedSolution)) item.workedSolution.forEach((s, i) => texts.push([`solution step ${i + 1}`, s]))
  for (const [label, text] of texts) {
    if (typeof text !== 'string') continue
    for (const part of splitMath(text)) {
      if (part.kind !== 'math') continue
      try {
        katex.renderToString(part.value, { throwOnError: true, strict: 'ignore' })
      } catch (e) {
        issues.push({ severity: 'error', where, message: `${label}: KaTeX cannot render "${part.value}" (${(e as Error).message})` })
        rejected.add(where)
      }
    }
  }
}

// ---------------------------------------------------------------- report

function printGroup(title: string, list: Issue[], mark: string) {
  if (list.length === 0) return
  console.log(`\n${title}`)
  const byWhere = new Map<string, Issue[]>()
  for (const issue of list) byWhere.set(issue.where, [...(byWhere.get(issue.where) ?? []), issue])
  for (const [where, group] of byWhere) {
    console.log(`  ${where}`)
    for (const issue of group) console.log(`    ${mark} ${issue.message}`)
  }
}

const errors = issues.filter((i) => i.severity === 'error')
const warnings = issues.filter((i) => i.severity === 'warning')

console.log('BAC content check\n')
for (const line of fileLines) console.log(`  ${line}`)

printGroup(`ERRORS (${errors.length}): these items are rejected and will not load`, errors, 'x')
printGroup(`WARNINGS (${warnings.length}): these load, but need a look`, warnings, '!')

const { byStatus, car } = report
const loadable = questions.length - rejected.size
console.log('\nSUMMARY')
console.log(
  `  ${report.total} questions: ${byStatus.approved} approved, ${byStatus.in_review} in review, ` +
    `${byStatus.draft} draft, ${byStatus.rejected} rejected by Chara`,
)
console.log(`  ${loadable} pass validation, ${rejected.size} rejected by the validator`)
console.log(`  C-A-R, all items: C ${car.all.C}, A ${car.all.A}, R ${car.all.R} (target 30/40/30)`)
console.log(`  C-A-R, approved:  C ${car.approved.C}, A ${car.approved.A}, R ${car.approved.R}`)

if (errors.length > 0) {
  const plural = errors.length !== 1
  console.log(`\nFAIL: ${errors.length} error${plural ? 's' : ''}. Fix ${plural ? 'them' : 'it'}, then run npm run validate again.`)
  process.exitCode = 1
} else {
  console.log('\nPASS: no errors.')
}
