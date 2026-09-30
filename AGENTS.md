# BAC: rules for every agent

## Working with Chara
Chara owns the product and is learning the codebase as it grows. End every change with a plain-language note: what you built, how it works, which files changed, how to test it on a phone, and any assumptions. One feature per change. Ask before adding dependencies, changing the data model, or touching files outside the task. Log decisions in docs/DECISIONS.md. No em dashes in UI copy, comments or docs.

## Who owns what
Two agents share this repo through GitHub and take turns. Claude Code owns /content, src/engine and /docs. AI Studio owns screens, Firebase wiring and server routes. Change the other side's files only when asked, and never leave tests failing.

## Read first
Before UI work read docs/DESIGN.md. Before questions, hints, feedback or tutor work read docs/PEDAGOGY.md and docs/CONTENT.md. If a request conflicts with these files, say so instead of guessing.

## Product
Bridge Academy Caribbean: adaptive CSEC Mathematics for Form 4 and 5 students (ages 15 to 17) in Barbados and Grenada, built on CXC 05/G/SYLL 16 (amended October 2025). Three modules that can be sat separately. Build module-first, Module 1 first. Philosophy: learn, not answer.

## Stack
React with TypeScript. Firebase Auth and Firestore with offline persistence. Gemini calls run server-side only, through a model alias with a fallback ladder. KaTeX renders math, MathLive handles input, and a math-equivalence library checks answers. Curriculum data is versioned JSON in /content. Engine logic is pure TypeScript in src/engine, with unit tests.

## Pedagogy rules (never break)
1. Code decides right and wrong against the stored answer key. The model never grades.
2. Every question has topicId, treeId, a C-A-R tag, difficulty, and a misconception ID on every distractor. Validate on load and reject bad items.
3. Keep practice near 30% Conceptual, 40% Algorithmic, 30% Reasoning.
4. Hint ladder: nudge, strategy, one worked step, full worked example. The full example unlocks after two attempts and is followed by a similar question done without help.
5. Remediation: look back, shore up, bring forward. Mastery thresholds: roots 70%, stems 65%, branches 60%, nodes 55%, overridable per topic.
6. Mastered skills return in interleaved review; no two review items in a row use the same strategy.
7. No public leaderboards. Weekly goals, not daily streaks, and no shaming copy for missed days.

## AI tutor
Current question only. Every call carries the question, answer key, worked solution, recent attempts and node states under a pseudonymous ID, never a name. One question at a time, under 60 words, in warm, plain Caribbean Standard English. Name the specific slip. Never state the final answer or a value that gives it away, and never introduce numbers that are not in the question. Return JSON per the tutor contract in docs/PEDAGOGY.md; code blocks any message that contains the answer. Flag repeated frustration or distress for the teacher. Model-drafted questions are saved as "draft" until Chara approves them.

## Content
CXC notation and paper formats. Context is structural, not decoration: Barbados items use BDS$, Grenada items use EC$, with real places and island life. No US defaults.

## Design
docs/DESIGN.md tokens only. Mobile-first at 360px, one question per screen, 44px targets, primary actions in the bottom thumb zone. Every screen defines loading, empty, error and offline states. WCAG AA contrast; respect reduced motion. The banned patterns are listed in docs/DESIGN.md.

## Privacy
Students are minors; collect the minimum. Firestore rules isolate each student and each class, with no insecure defaults. Keep tutor transcripts only for teacher review, and ask Chara before storing anything else.

## Done means
Works at 360px and offline for downloaded sets, no console errors, engine tests pass, and the explain-back note is written.

## Commands
- `npm install` once after cloning or pulling.
- `npm test` runs the engine unit tests. They must pass before every push.
- `npm run validate` checks every file in /content and lists any item it rejects.
- `npm run typecheck` checks TypeScript across the app, engine and scripts.
- `npm run dev` starts the app. The design contract lives at /styleguide.
