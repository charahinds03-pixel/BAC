// Loads /content into the app, validated on load. Items with errors are
// rejected and never shown. Students only ever get approved items.

import treeJson from '../../content/knowledge-tree.json'
import module1Json from '../../content/syllabus/module-1.json'
import misconceptionsJson from '../../content/misconceptions.json'
import {
  loadQuestionBank,
  type ContentContext,
  type KnowledgeTree,
  type Misconception,
  type MisconceptionCatalog,
  type Question,
  type SyllabusModule,
  type TreeNode,
} from '../engine'

const questionFiles = import.meta.glob<unknown[]>('../../content/questions/*.json', { eager: true, import: 'default' })

export const rawQuestions: unknown[] = Object.values(questionFiles).flat()

export const content: ContentContext = {
  tree: treeJson as KnowledgeTree,
  syllabi: [module1Json as SyllabusModule],
  misconceptions: misconceptionsJson as MisconceptionCatalog,
}

/** What students see: approved items that pass validation. */
export const studentBank = loadQuestionBank(rawQuestions, content, ['approved'])

/** What Chara's review tools and the style guide see: approved and in-review items that pass validation. */
export const reviewBank = loadQuestionBank(rawQuestions, content, ['approved', 'in_review'])

export function findQuestion(id: string): Question | undefined {
  return reviewBank.questions.find((q) => q.id === id)
}

export function findNode(id: string): TreeNode | undefined {
  return content.tree.nodes.find((n) => n.id === id)
}

export function findMisconception(id: string | undefined): Misconception | undefined {
  return id ? content.misconceptions.misconceptions.find((m) => m.id === id) : undefined
}
