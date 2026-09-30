# BAC in Gemini AI Studio: Research, Features, Design and Build Instructions

Sep 30, 2026 · @Chara

## Start here: how this all works

AI Studio's Build mode is a coding agent that writes a real app into real files, and you steer it through two channels. One is the Custom Instructions box it reads before every change. The other is the project's own files, which act as its long-term memory. Sections 8 and 9 fill those two channels; everything before them explains why.

**What Build mode is right now.** Google rebuilt it in March 2026 around the Antigravity agent, which keeps the whole project and its history in view, plus a Firebase integration that sets up sign-in and a database for you ([DEVOPSdigest](https://www.devopsdigest.com/google-ai-studio-adds-new-vibe-coding-experience)). At I/O in May it added drawing directly on the live preview, Nano Banana image generation for custom assets, export to Antigravity with your history, files and secrets, and free deployment for your first two apps ([Google, I/O 2026](https://blog.google/innovation-and-ai/technology/developers-tools/google-ai-studio-io-2026/)).

**Where the instructions go.** New App, then the gear icon, then System instructions, then Custom instructions ([Google codelab](https://codelabs.developers.google.com/codelabs/cloud-run/cloud-run-ai-challenge)). Whatever you paste there shapes every prompt, the same way a system prompt shapes a chatbot. Edit it whenever the product changes; it is a living document, like your research docs.

**Why the instructions are split in two.** The box gets only the stable rules (Section 8). The long reference material lives in markdown files inside the project (Section 9), and the rules point to them. A short brief gets followed more faithfully than a sprawling one, files can be updated as field research comes in, and files travel with the code to GitHub, Antigravity or Claude Code.

**Why AGENTS.md replaces CLAUDE.md.** Antigravity automatically loads an AGENTS.md at the project root on every turn, and can load extra rule files only when a task needs them, such as design rules only when UI files are touched ([Antigravity rules docs](https://antigravity.google/docs/rules.md)). Each rule file is capped at 24,000 bytes and always-on rules share a 20,000 token budget, so the files in Section 9 are sized to fit. Cursor and Codex read AGENTS.md too. Claude Code reads it only when a folder has no CLAUDE.md, so your CLAUDE.md becomes one line, @AGENTS.md, and you keep one source of truth.

**What happens to Phase 0.** The Express and SQLite scaffold does not carry over as the base. AI Studio publishes to Cloud Run, where a container's local disk does not survive restarts, so a SQLite file there would quietly lose student data; progress moves to Firestore instead. The valuable parts do carry over as data and code: the Knowledge Tree, the curriculum map, the dual-tag validator, the per-tier thresholds and every approved question. Claude Code can port them into a fresh GitHub repo that AI Studio then imports (Section 10).

**How a working session goes.** One feature per prompt, checked in the preview at phone width. Fix visual problems by drawing on the preview, logic problems in words, and push to GitHub each time something works, because that commit is your undo button. The instructions make the agent end every change with a plain-language note on what it built, how it works and how to test it, so you learn the codebase as it grows.

**How to read the rest.** Sections 2 to 4 are the research. Sections 5 to 7 are the product: features, the engine and the look. Sections 8 to 10 are what you paste, which files to add and the order of prompts.

## What fails in math and edtech apps

Math apps fail in seven predictable ways, and only one of them is about the content itself. Each failure below has a direct design answer, and every answer is written into the instructions in Section 8.

| What goes wrong | The evidence | What BAC does instead |
| --- | --- | --- |
| It hands over the answer | In a field experiment with nearly 1,000 high school students, GPT-4 lifted practice grades 48% as a plain chat and 127% as a tutor. The plain version became a crutch and students did worse on their own; the tutor version, which withheld final answers and was fed the correct answer, largely avoided that harm ([Bastani et al., PNAS 2025](https://www.pnas.org/doi/10.1073/pnas.2422633122)). | The tutor needs an attempt before it helps, climbs a hint ladder, and never states the final answer. Every call carries the stored answer and worked solution. |
| Nobody uses it enough | Colorado made Zearn free statewide. About 20,000 students used it in 2023-24, but only about 3,500 used it three days a week as intended ([Chalkbeat via KUNC](https://www.kunc.org/news/2025-02-13/did-zearn-boost-colorado-math-scores-a-study-says-yes-but-an-expert-says-questions-remain)). | A 10 to 15 minute sitting is a complete unit, sized to the 30 to 60 minute weekday windows in your student context research. Small weekly targets; teacher-set work builds the routine. |
| Students leave in week one | Education apps keep about 2% of users by day 30, one of the lowest rates of any app category ([Business of Apps](https://www.businessofapps.com/data/education-app-benchmarks/)). | The first session delivers a real win in minutes, before any sign-up wall: a short diagnostic, then a missed question fixed with a hint and answered right. |
| The game layer rewards the wrong thing | Public leaderboards motivate students at the top and discourage those at the bottom. In one classroom study the gamified course ended with lower motivation and lower final exam scores than the plain one ([leaderboard study](https://www.researchgate.net/publication/332995462_Gamification_through_leaderboards_An_empirical_study_in_engineering_education)). | No public rankings. Progress is measured against your own past, weekly goals forgive a missed day, and rewards attach to mastery and to fixing old mistakes, never to minutes logged. |
| The content is not CSEC and not home | Your student context research (flagged, unverified) found Khan Academy reads as too American or too slow, while CSEC past-paper questions carry trust. | Every item is dual-tagged to the amended syllabus and the Knowledge Tree, written in CXC notation and paper formats, with contexts built from Barbados and Grenada life. |
| The AI is confidently wrong | In a 2024 test by Eedi's co-founder, Gemini wrote a fractions question, named a wrong option as correct, then claimed 11/15 simplifies to 7/15 ([Eedi](https://eedi.substack.com/p/can-an-ai-chatbot-write-a-good-multiple)). Models are far better now, but the failure mode remains. | Code decides right and wrong, using a stored answer key and a math checker. The model only writes words, and every AI-drafted question waits in your approval queue. |
| It is built for students alone | Reviewing Colorado's results, a CU Boulder math professor credited in-person teaching and trained teachers: "Teachers matter." ([KUNC](https://www.kunc.org/news/2025-02-13/did-zearn-boost-colorado-math-scores-a-study-says-yes-but-an-expert-says-questions-remain)) | A teacher view that answers one question: who is stuck on what, and what to do about it on Monday. |

## What thrives, and what BAC should borrow

The products that work are built around how learning actually happens: retrieval, feedback on the specific mistake, and a weekly rhythm a teacher can hold students to. None of them relies on the AI being clever; they rely on good questions and good data. Sparx and Duolingo figures are self-reported, so treat them as direction, not proof.

| Pattern | Evidence | BAC's version |
| --- | --- | --- |
| Diagnostic multiple choice (Eedi) | Each wrong option maps to one misconception, and a good item cannot be answered correctly while holding the key misconception. New students take a 10-question adaptive quiz that places them ([Microsoft on Eedi](https://news.microsoft.com/source/features/ai/eedi-online-math-quiz/)). | Every Paper 01 style distractor carries a misconception ID. A short placement diagnostic per module, and misconception counts feed the teacher view. |
| A context-rich tutor that withholds answers (Eedi with Google DeepMind) | In a 2025 trial with 165 students aged 13 to 15, supervised LearnLM helped students solve new problems 66.2% of the time versus 60.7% with human tutors. Tutors approved about three in four drafts with few or no edits, and there were 5 factual errors in 3,617 messages. The key was rich context on each student's topics and struggles, with no personal data sent ([The 74](https://www.the74million.org/article/ai-tutors-with-a-little-human-help-offer-reliable-instruction-study-finds/)). | Tutor calls carry the question, answer key, worked solution, the student's Knowledge Tree state and recent errors, never their name. Frustrated or stuck conversations surface to the teacher. |
| Interleaved, spaced review (Rohrer RCT) | Across 54 seventh-grade classes over four months, students given interleaved assignments scored 61% on a surprise test a month later, against 38% for blocked practice ([ERIC](https://eric.ed.gov/?id=EJ1237752)). | Once a skill is learned, it returns in mixed sets where no two questions in a row use the same strategy, which is also how Paper 01 feels. |
| Written working, lightly enforced (Sparx) | Bookwork checks ask for the answer to a question the student recently got right, which only works if the working was written down. Sparx reports 92% of students completing 30 or more minutes of homework, and parent engagement with its weekly email for 95% of students ([Sparx](https://sparxmaths.com/impact/)). | Working checks that ask for an intermediate value from a recently solved problem. A weekly parent summary the student can send by WhatsApp. |
| A teacher-set routine with a clear target (Sparx) | Homework is set weekly, the target is 100% correct, and teachers may override the personalization but did so in under 1% of homeworks ([Sparx](https://sparxmaths.com/impact/)). | Teachers assign a weekly set by Knowledge Tree node and BAC personalizes inside it. Done means every item eventually answered correctly. |
| Forgiving habit mechanics (Duolingo) | Learners who reach a 7-day streak are 3.6 times more likely to finish their course, and allowing two streak freezes raised daily active learners by 0.38%. Duolingo cites research that some slack motivates more than rigid rules ([Duolingo](https://blog.duolingo.com/how-duolingo-streak-builds-habit)). | A weekly rhythm, such as three sittings a week, rather than a daily streak. Missed days carry no shame copy, because Crop Over, church and caring for siblings are real life. |

## The Caribbean context

CSEC Math is still the region's weakest core subject, and CXC has just started certifying modules on their own. So BAC should be built module by module, starting with Module 1. Findings from your June student context research stay flagged until Jaz and school visits confirm them.

| What we know | What it means for BAC |
| --- | --- |
| The 2026 regional CSEC Math pass rate was 42%, up 4 points on 2025 ([St Vincent Times](https://www.stvincenttimes.com/cxc-says-region-is-on-the-rise-following-2026-results/)). | Progress is real but slow. A pilot class that moves a few points is a credible story for Ministries and sponsors. |
| CXC launched the Caribbean Targeted Education Certificate (CEK), which certifies stackable modules. In the Math Module 1 pilot, 88% of 2,535 students passed, and about 35,000 regular CSEC Math candidates will also get the Module 1 credential ([St Vincent Times](https://www.stvincenttimes.com/cxc-says-region-is-on-the-rise-following-2026-results/)). | Build Module 1 end to end first. The amended syllabus already allows a one-module sitting: 20 multiple-choice items in 30 minutes, then three structured questions in 50 minutes. |
| More than 32,000 candidates were absent from CSEC exams, and CXC said many skip because they feel underprepared ([St Vincent Times](https://www.stvincenttimes.com/cxc-says-region-is-on-the-rise-following-2026-results/)). | An honest readiness signal per module keeps students practising and turning up for the exam. |
| CXC now counts AI misuse as an exam irregularity. It recorded 128 irregularities in 2026, against 80 the cycle before ([St Vincent Times](https://www.stvincenttimes.com/cxc-says-region-is-on-the-rise-following-2026-results/)). | "Learn, not answer" matches where CXC is heading. Say it plainly to principals and teachers. |
| Barbados is 80.0% online, leaving 20% offline ([DataReportal](https://datareportal.com/reports/digital-2026-barbados)). Grenada is 74.1% online with 25.9% offline, and 62.4% of people live in rural areas ([DataReportal](https://datareportal.com/reports/digital-2026-grenada)). | Phone-first, light on data, and able to run a downloaded sitting with no signal. |
| The syllabus (CXC 05/G/SYLL 16, amended October 2025) sets Paper 01 at 60 multiple-choice items in 1 hour 30 minutes and Paper 02 at nine structured questions in 2 hours 30 minutes. Profile weights are 30% Conceptual, 40% Algorithmic and 30% Reasoning, and calculators are encouraged in Paper 02. | Mocks mirror these formats and timings, and practice keeps the C-A-R balance. The assessment grid gives Paper 03 20% but one line of the text says 30%, so confirm with CXC. |
| Kerwin Springer's Student Hub gives free past papers and practice with instant feedback ([Student Hub](https://kerwinspringer.com/)). Caribbean AI, formerly Chat for CXC, marks past-paper answers against CXC rubrics and lists CSEC Math as almost ready ([Caribbean AI](https://caribbeans.ai/)). | Don't compete as another past-paper bank or AI marker. BAC's edge is diagnosis on the Knowledge Tree, misconception-coded items, a teacher view and structurally local contexts. |

## Feature map

The late-October demo is Module 1 for one student on one phone. The December MVP adds the teacher and the weekly rhythm, and everything else waits for 2027.

### Demo (late October, Module 1 only)

| Feature | For | What it does |
| --- | --- | --- |
| Placement check | Student | 10 to 12 adaptive items across Module 1 that seed the Knowledge Tree |
| Practice sitting | Student | A 10 to 15 minute set, one question per screen, code-checked answers, feedback tied to the misconception |
| Hint ladder | Student | Nudge, strategy, one worked step, then a full example after two attempts |
| Tutor | Student | Socratic help on the current question, grounded in the answer key |
| Knowledge Tree view | Student | Where you stand on each node, with a C-A-R profile |
| Module 1 readiness | Student | An honest signal of readiness for the Module 1 papers |
| Offline sitting | Student | Download a set, answer with no signal, sync later |
| Style guide screen | Chara | Every component in one place; the design contract for both agents |

### MVP (mid-December)

| Feature | For | What it does |
| --- | --- | --- |
| Class codes | Teacher | Create a class; students join with a short code |
| Class view | Teacher | Who is stuck on which node, the top misconceptions, and one suggested small-group focus |
| Weekly set | Teacher | Assign nodes for the week; BAC personalizes inside it, and done means every item answered correctly |
| Mixed review | Student | Interleaved review of mastered skills |
| Module 1 mock | Student | 20 items in 30 minutes under exam conditions, then a debrief |
| Working checks | Student | Occasionally asks for an intermediate value from a recently solved problem |
| Parent summary | Parent | A plain-language weekly note the student sends by WhatsApp |
| Review queue | Chara | AI-drafted questions wait as drafts until you approve them |

### Later (2027)

| Feature | For | What it does |
| --- | --- | --- |
| Modules 2 and 3 | Student | The same loop on the rest of the syllabus |
| Paper 02 practice | Student | Structured questions with method marks, plus feedback on a photo of written working |
| SBA support | Student, teacher | Planning and data tools for the Paper 03 project |
| Pathways | Student | Real careers that use each module's math, starting with actuarial science |

Photo-of-working needs camera permission declared in the app's metadata.json ([AI Studio docs](https://ai.google.dev/gemini-api/docs/aistudio-build-mode)).

## How the core engine works

Code owns every judgement about right, wrong and mastery, and Gemini only writes words. Every answer runs the same five-step loop.

1. **Serve.** Pick the next item from the target node, any review that is due and the weakest ancestor, keeping roughly 30% Conceptual, 40% Algorithmic and 30% Reasoning.
2. **Check.** Compare the answer with the stored key using a math-equivalence check, so 0.5, 1/2 and 2/4 all pass when the item allows it. A multiple-choice pick maps straight to its misconception ID.
3. **Update.** Adjust the student's skill on that node with the rating formula below.
4. **Decide.** If the node crosses its tier threshold, mark it mastered and schedule review. If not, walk the prerequisite chain: look back, shore up, bring forward.
5. **Respond.** Show feedback written for that misconception, with hints and the tutor available on demand.

The update is an Elo-style rating, the same idea chess uses. Skill on a node is θ (theta), item difficulty is b, and the predicted chance of a correct answer is:

```latex
p = \frac{1}{1 + e^{-(\theta - b)}}
```

After each answer, with y equal to 1 for correct and 0 for wrong:

```latex
\theta \leftarrow \theta + K\,(y - p)
```

A surprise moves the estimate a lot, and an expected result barely moves it. Start K near 0.4 and shrink it as a student answers more, so early estimates move fast and later ones settle. Seed b from each item's easy, medium or hard label as -1, 0 or +1, then recalibrate once an item has around 50 attempts.

A node counts as mastered when the predicted chance on a typical item reaches its tier threshold: roots 70%, stems 65%, branches 60%, nodes 55%. Your existing thresholds stay; they just get a model underneath.

Mastered skills come back in mixed review, for example after about 2 days, 1 week and 3 weeks, with no two review items in a row using the same strategy. Tune the gaps from real data.

Gemini does three jobs only: tutor turns, feedback wording and first drafts of new questions. Each tutor call carries the question, answer key, worked solution, recent attempts and node states under a pseudonymous ID. Before any tutor message reaches a student, code checks that it does not contain the answer.

## UI direction: made, not generated

Language models reproduce the most common interface they have seen, so BAC gets exact tokens, a banned list, real content and an approved style guide screen before any feature exists.

**The concept: the exercise book and the margin.** Warm paper, ink-navy text, thin ruled lines instead of floating cards, and a teacher's marks in the margin. It should feel like a well-kept copybook and a good teacher, not a startup dashboard.

**Why builds drift generic now.** bac-teal #0D9488 and bac-gold #D97706 are Tailwind's stock teal-600 and amber-600. Keep the navy, teal and gold family, but mix your own values.

| Token | Value | Use |
| --- | --- | --- |
| paper | #F7F2E8 | Page background |
| paper-raised | #FFFCF6 | Inputs and answer sheets |
| ink | #1B2A4A | Text and primary buttons (your bac-navy stays) |
| ink-soft | #4A5670 | Secondary text |
| rule | #DCD2C0 | Ruled lines and borders |
| sea | #1F7A6D | Correct answers and progress |
| mace | #B5432E | Corrections and errors, like a nutmeg-red pen |
| gold | #C8961E | Mastery moments only; never text, since it fails contrast on paper |

Night study mode flips to deep navy paper with warm cream ink, never pure black. Test every pair on a real phone in daylight before locking it.

| Element | Choice | Rule |
| --- | --- | --- |
| Headings | Fraunces, Newsreader or Literata | Test all three on a cheap Android phone and keep one |
| Body | Atkinson Hyperlegible | 16px minimum; designed for readers with low vision |
| Math | KaTeX | CXC notation from the syllabus symbol list |
| Shape | 4 to 6px radius, 1px rules | Borders over shadows, 8px spacing grid |
| Layout | One question per screen | Primary action in the bottom thumb zone, 44px touch targets |
| Motion | 150 to 250ms | Ticks drawn as a pen stroke; respect reduced motion |
| Sound | One steel-pan note | Only when a node is mastered, off by default in class |

**Voice.** Warm, direct and specific, like a good Caribbean teacher. Write "Right. You kept the negative sign through both steps," not a generic "Great job!" Write "Close. You divided by negative 3 but kept the inequality facing the same way," not "Oops! Try again."

**Never ship:** purple or blue-to-pink gradients, gradient text, glassmorphism, emoji as icons, rows of identical stat cards, stock Tailwind or shadcn palettes, Inter as the only font, big rounded cards with soft shadows, sparkle icons for AI, and slogans like "Unlock your potential".

**Keeping agents on brand.** Build and approve the style guide screen first, then require every screen to reuse its components. Feed real CSEC questions, never placeholder text. Ask for two or three variations before choosing, fix visual details by drawing on AI Studio's preview, and judge everything on a real phone.

## The AI Studio instructions

Paste this under the app's Settings (gear icon), System instructions, Custom instructions. It stays short on purpose: the full rules live in AGENTS.md (Section 9), and this box guarantees the essentials even if the agent skips a file. The longer version from our chat is now the AGENTS.md text.

```text
You are building Bridge Academy Caribbean (BAC), an adaptive CSEC Mathematics app for Form 4 and 5 students in Barbados and Grenada.

Before every change, read AGENTS.md at the project root and follow it. Before UI work, read docs/DESIGN.md. Before questions, hints, feedback or tutor work, read docs/PEDAGOGY.md and docs/CONTENT.md. If a request conflicts with those files, say so and ask.

Never break these, even if a file is missing:
1. Code decides right and wrong against the stored answer key. The model never grades.
2. The tutor never states a final answer or invents numbers. Every tutor call includes the question, answer key and worked solution, and never the student's name.
3. Gemini calls run server-side only, through a model alias with a fallback ladder.
4. /content, src/engine and /docs belong to Chara's Claude Code workflow. Change them only when asked, and keep their tests passing.
5. Mobile-first at 360px, one question per screen, tokens from docs/DESIGN.md only. No gradients, emoji icons, glassmorphism or stock Tailwind palettes.
6. Students are minors. Collect the minimum, and write Firestore rules that isolate each student and each class.

After every change, explain in plain language what you built, how it works, which files changed and how to test it on a phone. One feature per change. No em dashes anywhere.
```

Rule 4 is what makes the Claude Code handoff safe: each tool owns different folders, so GitHub syncs rarely collide.

## Context files for the repo

Claude Code creates these in the new repo from this doc, as Section 10 explains. AGENTS.md is the always-on rulebook, and the docs files hold the detail each rule points to.

| File | Built from | Holds |
| --- | --- | --- |
| AGENTS.md | The text below | Always-on rules for every agent, well under the 24,000 byte cap |
| CLAUDE.md | One line: @AGENTS.md | Makes Claude Code load AGENTS.md |
| docs/DESIGN.md | Section 7 | Tokens, type, components, motion, voice and the banned list |
| docs/PEDAGOGY.md | Sections 2, 3 and 6, plus the tutor contract below | C-A-R rules, hint ladder, remediation and tutor behaviour |
| docs/CONTENT.md | The question schema below | Question format, context rules and review statuses |
| docs/DECISIONS.md | Empty to start | Date, decision and reason for each call you make |
| .agents/rules/design.md | Points to docs/DESIGN.md | Loads only when UI files change, via a glob trigger on \*.tsx and \*.css |

### AGENTS.md

```markdown
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
```

### Question schema for docs/CONTENT.md

Every item is one JSON object. The tags below are illustrative; real values come from your curriculum map and Knowledge Tree.

```json
{
  "id": "M1-NTC-0007",
  "status": "approved",
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
  "source": "original",
  "version": 1
}
```

Status moves from draft to in review, then to approved or rejected. Only approved items ever reach students.

### Tutor contract for docs/PEDAGOGY.md

The server builds the request, so no personal data can slip in:

```json
{
  "studentRef": "anon-7f3c",
  "questionId": "M1-NTC-0007",
  "attempts": ["495", "585"],
  "hintLevel": 2,
  "nodeState": { "R2": 0.41 },
  "country": "BB"
}
```

The model must reply in this shape:

```json
{
  "move": "question",
  "message": "You took 45 away from 540 once. What happens if you keep taking 45 away until nothing is left?",
  "misconceptionId": "OP-SUB-FOR-DIV",
  "flag": "none"
}
```

The move is one of question, hint, encourage, redirect or handoff, and the flag is one of none, frustration, off\_topic or distress. If a message contains the correct answer, code discards it, retries once, then falls back to the next written hint.

## Build sequence

Claude Code builds the brain in a fresh GitHub repo, AI Studio imports it and builds the body, and the two take turns through GitHub. AI Studio now imports repos and syncs both ways, with a Resolve conflicts screen when edits clash ([AI Studio docs](https://ai.google.dev/gemini-api/docs/aistudio-build-mode)).

**Ground rules.** Claude Code owns content, engine and docs; AI Studio owns screens, Firebase and server routes. Work in one tool at a time: push before you switch, pull when you arrive.

### Phase A: Claude Code, this week

1. Create a new private GitHub repo called bac-app. Leave the Phase 0 repo alone, because the first AI Studio import ends with a force push.
2. Export this doc as Markdown, save it as docs/BRIEF.md in bac-app, and open Claude Code in a folder that holds both repos.
3. Prompt: "Read docs/BRIEF.md. Create AGENTS.md, CLAUDE.md and the docs files listed in Section 9. Explain each file to me as you go."
4. Prompt: "Port the Knowledge Tree, the Module 1 syllabus map and every approved question from the Phase 0 repo into /content as JSON matching docs/CONTENT.md. Add a validator script and show me anything that fails."
5. Prompt: "Build src/engine in TypeScript: answer checking, the rating update, mastery thresholds, remediation and review scheduling, with unit tests. Explain the math in plain language."
6. Prompt: "Create a minimal Vite, React and TypeScript app with the DESIGN.md tokens and a /styleguide screen that shows every core component with real Module 1 questions."
7. Push to GitHub.

### Phase B: AI Studio

1. In Build mode, open the + menu, choose Import from GitHub, and pick bac-app. When the Sync to GitHub banner appears, choose Force push, because AI Studio adapts the code to its runtime ([Google](https://aistudio.google.com/learn/sync-your-ai-studio-apps-with-github)).
2. Delete your local copy of bac-app and clone it fresh, so Claude Code starts from AI Studio's version.
3. Paste the Section 8 text into Custom instructions.
4. Prompt: "Set up Firebase Auth and Firestore with offline persistence. Students see only their own data, and teachers only their own classes."
5. Prompt: "Build the practice sitting screen from the /styleguide components, using /content and src/engine. One question per screen at 360px."
6. Prompt: "Add a server-side tutor endpoint that follows the tutor contract in docs/PEDAGOGY.md."
7. Prompt: "Build the placement check, the Knowledge Tree view and the Module 1 readiness signal."
8. Publish to Cloud Run and test on a cheap Android phone over mobile data, aiming to finish a week before the late-October event.

Share the Cloud Run link with students, never the AI Studio app link, because people you share an AI Studio app with can see and fork its code ([AI Studio docs](https://ai.google.dev/gemini-api/docs/aistudio-build-mode)). The December MVP runs the same loop: content and engine work in Claude Code, screens in AI Studio.

## Sources

Pages were opened unless marked otherwise. Syllabus facts come from your project copy of CXC 05/G/SYLL 16, amended October 2025.

- [DEVOPSdigest: AI Studio's new vibe coding experience](https://www.devopsdigest.com/google-ai-studio-adds-new-vibe-coding-experience)
- [Google: AI Studio at I/O 2026](https://blog.google/innovation-and-ai/technology/developers-tools/google-ai-studio-io-2026/)
- [Google codelab: Custom Instructions and Cloud Run](https://codelabs.developers.google.com/codelabs/cloud-run/cloud-run-ai-challenge)
- [Google: Build apps in AI Studio](https://ai.google.dev/gemini-api/docs/aistudio-build-mode)
- [Google: Sync AI Studio apps with GitHub](https://aistudio.google.com/learn/sync-your-ai-studio-apps-with-github) (search result; the page would not load)
- [Antigravity rules docs](https://antigravity.google/docs/rules.md)
- [Claude Code memory docs](https://code.claude.com/docs/en/memory) (search result)
- [Bastani et al., PNAS 2025](https://www.pnas.org/doi/10.1073/pnas.2422633122) (search result; the site blocked opening)
- [Chalkbeat via KUNC: Zearn in Colorado](https://www.kunc.org/news/2025-02-13/did-zearn-boost-colorado-math-scores-a-study-says-yes-but-an-expert-says-questions-remain)
- [Business of Apps: education app benchmarks](https://www.businessofapps.com/data/education-app-benchmarks/)
- [Leaderboard study in engineering education](https://www.researchgate.net/publication/332995462_Gamification_through_leaderboards_An_empirical_study_in_engineering_education) (search result)
- [Eedi: can AI chatbots write a diagnostic question](https://eedi.substack.com/p/can-an-ai-chatbot-write-a-good-multiple)
- [Microsoft: Eedi and diagnostic questions](https://news.microsoft.com/source/features/ai/eedi-online-math-quiz/)
- [The 74: the Eedi and Google DeepMind tutoring trial](https://www.the74million.org/article/ai-tutors-with-a-little-human-help-offer-reliable-instruction-study-finds/)
- [Rohrer et al. 2020 on ERIC: interleaved practice RCT](https://eric.ed.gov/?id=EJ1237752)
- [Sparx Maths impact page](https://sparxmaths.com/impact/)
- [Duolingo: the research behind streaks](https://blog.duolingo.com/how-duolingo-streak-builds-habit)
- [St Vincent Times: CXC 2026 results](https://www.stvincenttimes.com/cxc-says-region-is-on-the-rise-following-2026-results/)
- [DataReportal: Digital 2026 Barbados](https://datareportal.com/reports/digital-2026-barbados)
- [DataReportal: Digital 2026 Grenada](https://datareportal.com/reports/digital-2026-grenada)
- [Kerwin Springer's Student Hub](https://kerwinspringer.com/) (search result)
- [Caribbean AI](https://caribbeans.ai/) (search result)
