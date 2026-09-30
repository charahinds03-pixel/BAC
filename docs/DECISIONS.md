# Decisions

One entry per call: the date, what was decided, and why. Newest at the bottom. If a decision is reversed, add a new entry rather than editing the old one.

## 2026-09-30: Phase A setup (Claude Code)

**AGENTS.md gets a Commands section.**
The text is the brief's, plus five lines listing npm install, test, validate, typecheck and dev. Both agents need to know how to run the checks that "done means" depends on.

**Math is written between `\(` and `\)`, not `$`.**
The brief's own example uses BDS $45, so `$` has to stay free for money. `\(` `\)` is KaTeX's standard alternative.

**The question schema gains a few fields beyond the brief's example.**
format "numeric" with answer and commonErrors, so free-response items can carry misconceptions like distractors do; answerForm (equivalent, simplest, standard-form), because "Simplify 18/24" must not accept 6/8; optional strategy for interleaving; optional legacyId for tracing ported items; country "any" for items with no local context. The status "in review" is spelled in_review in JSON.

**Night study mode values are a first proposal.**
paper #13203A, paper-raised #1A2A48, ink #F3EBDA, ink-soft #BDB5A4, rule #34435F, sea #6CC2B2, mace #EE8A70, gold #E2B24C. All pass AA on the night paper. Not yet tested on a phone at night.

**Controls use ink-soft for their edges, not rule.**
rule is only 1.34:1 on paper, below the 3:1 WCAG needs for the edge of an input or choice row. rule stays for decorative lines.

**Only independent answers move the skill rating.**
Only a student's first answer to an item counts, and a correct first answer given after opening a hint does not raise the rating. Otherwise students could reach mastery by retrying or reading hints. This is a new rule and needs Chara's approval.

**Mastery needs at least 5 answers on the node.**
With K at 0.4, one correct answer lifts a new student to 55%, which would "master" a node-tier topic after a single question. Five answers is the smallest number that stops lucky streaks without slowing strong students much.

**Struggling means 3 or more answers and under 40% predicted on a typical item.**
That is roughly three wrong in a row from a fresh start. It is when remediation starts walking the prerequisite chain.

**Review repeats every 3 weeks after the third gap, and a wrong review resets to 2 days.**
The brief gives 2 days, 1 week and 3 weeks and says to tune from data. These are the simplest rules that keep going after the third review.

**The tutor answer guard lives in src/engine.**
It is pure logic (does this message contain the key, a number not in the question, or the correct option letter?), so it belongs with the tests. AI Studio's tutor route calls it.

## 2026-09-30: Content port (Claude Code)

**Phase 0 content comes from the MVP repo.**
The brief's Phase 0 (Express and SQLite, a dual-tag validator, per-tier thresholds and approved questions) is not in any GitHub repo connected to this session. charahinds03-pixel/MVP (React, 10 topics, 5 fraction questions, one 60% threshold) is the only BAC predecessor found, so the port uses it. If the Express and SQLite repo exists somewhere else, port it next and reconcile.

**MVP tiers 0 to 3 become root, stem, branch and node.**
Ids are the tier letter plus a number in MVP order: R1, R2, S1 to S3, B1 to B3, N1 to N3. This matches the brief's own example, where a division item sits on R2. Each node keeps its MVP id as legacyId. Titles use "and" instead of "&". The MVP's totalQuestions field is dropped because it was a planning number, not content.

**The Module 1 syllabus map is built from web summaries and marked unverified.**
cxc.org was blocked from this environment, so section titles, scopes and Paper 01 item counts come from search summaries of the amended syllabus. Section codes are NTC (from the brief), CON, SET, MEA, ALG and GRA. The 1.1 to 1.6 numbering follows syllabus order. Check it against the syllabus copy and set verified to true.

**Tree nodes are linked to Module 1 sections by judgement.**
R1, R2, S1 and S3 serve 1.1. S2 serves 1.1 and 1.2, because percentage increase and decrease feed Consumer Arithmetic. B1 and B2 serve 1.5. B3, N1, N2 and N3 have no Module 1 section and look like Module 2 or 3 topics.

**Ported questions are in_review, not approved.**
The MVP questions had no status, C-A-R tag, misconception IDs, worked solutions or hint ladder. Claude drafted those tags, the misconception catalog with its feedback, and the missing hint rungs. The MVP's single hint is kept as rung 2 (strategy). Math is now KaTeX and the wording is otherwise unchanged. All of it needs Chara's review before approval.

**Unexplained distractors are tagged NEEDS-DIAGNOSIS instead of guessed.**
M1-NTC-0002 choice d (3/5) and M1-NTC-0003 choices b and c (20 and 25) have no clear misconception behind them. Name the error or replace the option.

**The brief's Kemar example is in the bank as M1-NTC-0006.**
It is in_review with source brief-example, so the bank has one real Barbados-context item for the style guide.

**M1-NTC-0005 is left failing on purpose.**
Its distractor 2/12 equals the key 1/6, and the stem does not ask for lowest terms, so a student who picks it is right. Chara decides: add "Give your answer in its lowest terms" and answerForm "simplest", or replace the distractor.

**Validation logic lives in src/engine/content.ts.**
The app's loader and the command-line validator share it, so a rule can never differ between the two. The script adds a KaTeX render check on top. /scripts belongs to Claude Code.
