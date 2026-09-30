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
