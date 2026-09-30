# BAC content

Everything a student sees as maths lives in /content as versioned JSON. Code reads it, validates it on load, and rejects any item that breaks these rules. Run `npm run validate` after every content change.

## Files

| File | Holds |
| --- | --- |
| content/syllabus/module-1.json | The Module 1 syllabus map: sections, exam format and C-A-R weights |
| content/knowledge-tree.json | The Knowledge Tree: every node, its tier and its prerequisites |
| content/misconceptions.json | Every misconception ID with the feedback written for it |
| content/questions/*.json | Questions, one file per syllabus section (m1-ntc.json holds Module 1, Number Theory and Computation) |

## Dual tags

Every question carries two tags that answer different questions:

- **topicId** says where it sits in the CXC syllabus (for example 1.1, Number Theory and Computation). Teachers, mocks and readiness use it.
- **treeId** says which Knowledge Tree node it measures (for example S1, Fractions). The engine uses it for skill, mastery and remediation.

Both must exist, or the item is rejected.

## Question schema

Every item is one JSON object.

```json
{
  "id": "M1-NTC-0006",
  "status": "in_review",
  "module": 1,
  "topicId": "1.1",
  "treeId": "R2",
  "car": "A",
  "difficulty": 0,
  "paper": "P01",
  "country": "BB",
  "calculator": false,
  "stem": "Kemar saves BDS $45 a week from his weekend job at the Oistins fish fry. How many weeks will it take him to save BDS $540?",
  "format": "mcq",
  "choices": [
    { "id": "a", "text": "12", "correct": true },
    { "id": "b", "text": "495", "misconceptionId": "OP-SUB-FOR-DIV" },
    { "id": "c", "text": "585", "misconceptionId": "OP-ADD-FOR-DIV" },
    { "id": "d", "text": "24 300", "misconceptionId": "OP-MUL-FOR-DIV" }
  ],
  "workedSolution": ["Weeks = total saved ÷ amount per week", "540 ÷ 45 = 12"],
  "hints": ["What does each week add to his savings?", "How many groups of 45 fit into 540?", "Start with 45 × 10 = 450. How much is left?"],
  "source": "brief-example",
  "version": 1
}
```

| Field | Required | Values and rules |
| --- | --- | --- |
| id | Yes | `M<module>-<section code>-<4 digits>`, for example M1-NTC-0006. The section code must match the topicId's code in the syllabus map. Never reuse an id. |
| status | Yes | draft, in_review, approved or rejected. Only approved items reach students. |
| module | Yes | 1, 2 or 3, matching the id |
| topicId | Yes | A section id from the syllabus map, for example 1.1 |
| treeId | Yes | A node id from the Knowledge Tree, for example S1 |
| car | Yes | C (Conceptual), A (Algorithmic) or R (Reasoning). See docs/PEDAGOGY.md. |
| difficulty | Yes | -1 easy, 0 medium, 1 hard. Seeds the engine's difficulty estimate. |
| paper | Yes | P01 (multiple choice) or P02 (structured) |
| country | Yes | BB (Barbados), GD (Grenada) or any (no local context) |
| calculator | Yes | true if a calculator is allowed. Paper 01 items are false. |
| stem | Yes | The question. Math between `\(` and `\)`. |
| format | Yes | mcq or numeric |
| choices | mcq only | 2 to 5 choices, ids a to e. Exactly one has "correct": true. Every other choice has a misconceptionId from the catalog. Paper 01 items have 4. |
| answer | numeric only | `{ "value": "12", "tolerance": 0.01, "unit": "weeks" }`. value is required; tolerance and unit are optional. |
| commonErrors | numeric, optional | `[{ "value": "495", "misconceptionId": "OP-SUB-FOR-DIV" }]`, the free-response version of distractors |
| answerForm | Optional | equivalent (default), simplest or standard-form. See below. |
| workedSolution | Yes | One or more steps. This is rung 4 of the hint ladder. |
| hints | Yes | Up to three rungs: nudge, strategy, one worked step. Three is expected. |
| strategy | Optional | A short tag such as common-denominator, used to interleave review so no two items in a row share a strategy. Defaults to the treeId. |
| source | Yes | original, adapted, cxc-past-paper, model-draft, phase-0-mvp or brief-example |
| legacyId | Optional | The item's id in an older system, kept for tracing |
| version | Yes | Starts at 1. Add 1 whenever the stem, choices or answer change. |

### Answer forms

| answerForm | Accepts | Example |
| --- | --- | --- |
| equivalent | Any equal value: 0.5, 1/2, 2/4 and 50% all match a key of 1/2 | "Calculate 1/2 + 1/3" |
| simplest | Equal values only in lowest terms, so 6/8 does not match 3/4 | "Simplify 18/24" |
| standard-form | Equal values written as A × 10ⁿ with 1 ≤ A < 10 | "Write 32 000 in standard form" |

If a distractor has the same value as the key, the item is broken unless answerForm is simplest and the distractor is not in lowest terms. The validator rejects it.

### Typed answers

The answer checker accepts what a student would write on a phone: integers, decimals, fractions (3/4), mixed numbers (1 1/2), percentages (50%), negatives (-3 or −3), a space or comma as the thousands separator (24 300 or 24,300), currency (BDS $540, EC$120) and standard form (3.2 × 10^4). A typed answer on a multiple-choice item is checked against the correct choice, and if it equals a distractor it gets that distractor's misconception.

## Math notation

- Put math between `\(` and `\)`: `"Simplify \\(\\frac{18}{24}\\)."` (JSON doubles every backslash).
- `$` is for money only. Write BDS $45 or EC $120, never a bare $.
- Follow CXC print conventions: stacked fractions, × and ÷, a space as the thousands separator, a decimal point, and a space before units.
- The validator renders every math segment with KaTeX and rejects any that fail.

## Context rules

Context is structural, not decoration.

- Barbados items (country BB) use BDS $ and real Barbadian places and life: Oistins, Bridgetown, the ZR vans, Crop Over, Kensington Oval.
- Grenada items (country GD) use EC $ and real Grenadian places and life: St George's, Grand Anse, nutmeg and cocoa, Spicemas, Carriacou.
- No US defaults: no dollars without a country, no miles, no Fahrenheit, no Thanksgiving.
- Names reflect the region. Avoid stereotypes and avoid naming real, identifiable people.
- An item with no local context uses country "any".

## Misconception catalog

content/misconceptions.json holds one entry per misconception:

```json
{
  "id": "FRAC-ADD-ACROSS",
  "status": "in_review",
  "title": "Adds tops and adds bottoms",
  "description": "Adds numerators together and denominators together, so 1/2 + 1/3 becomes 2/5.",
  "feedback": "Close. You added the tops and added the bottoms. Halves and thirds are different sized pieces, so change them to the same denominator first."
}
```

- Ids are UPPER-KEBAB-CASE with an area prefix: NUM (number sense), OP (operations), FRAC (fractions), ORD (ordering), DIV (division).
- feedback is shown to the student after that mistake, in the voice in docs/DESIGN.md.
- NEEDS-DIAGNOSIS is a placeholder for a distractor nobody has explained yet. It passes validation with a warning, so the item stays visible in the review queue until someone names the error or replaces the distractor.
- Each wrong option should diagnose a different misconception. Two distractors sharing an id get a warning.

## Knowledge Tree

content/knowledge-tree.json lists every node:

| Field | Rules |
| --- | --- |
| id | Tier letter and number: R (root), S (stem), B (branch), N (node). R2, S1. |
| tier | root, stem, branch or node. Sets the default mastery threshold (70, 65, 60, 55%). |
| title, description | Shown to students on the Knowledge Tree view |
| prerequisites | Node ids that must be solid first. No cycles. Roots have none. |
| syllabusRefs | Syllabus section ids this node serves. Empty means it is outside the mapped modules for now. |
| masteryThreshold | Optional override of the tier threshold, between 0.5 and 0.95 |
| legacyId | The node's id in the Phase 0 MVP |

## Review statuses

draft → in_review → approved or rejected.

- **draft**: written by a person or a model and not yet checked. Model drafts always start here.
- **in_review**: ready for Chara to read. Items ported from Phase 0 with new tags sit here.
- **approved**: Chara has read it, checked the key and the distractors, and it is live.
- **rejected**: kept for the record, never shown.

Only approved items ever reach students. Changing an approved item's stem, choices or answer bumps its version and sends it back to in_review.

## What the validator checks

`npm run validate` prints every problem it finds. Errors reject the item; warnings are for review.

Errors:

- A missing or wrong-typed field, or a value outside its list
- A duplicate id, an id that does not match its module or section code
- A topicId not in the syllabus map, a treeId not in the tree
- A multiple-choice item without exactly one correct choice, a distractor without a known misconceptionId, or duplicate choice text
- A distractor with the same value as the key (unless answerForm is simplest and the distractor is not in lowest terms)
- A key that breaks its own answerForm, or a numeric answer that cannot be read
- Math that KaTeX cannot render, or unbalanced `\(` `\)`
- Money that does not match the item's country (EC $ on a Barbados item)
- In the tree: unknown prerequisites, cycles, or an id that does not match its tier

Warnings:

- Fewer than three hints
- A distractor tagged NEEDS-DIAGNOSIS, or two distractors sharing a misconception
- A bare $ with no country prefix, or an em dash in student-facing text
- An approved item using a misconception whose feedback is not approved
- Bank-level: the C-A-R mix drifting from 30/40/30, syllabus sections with no questions, tree nodes with no questions, and how many items are approved
