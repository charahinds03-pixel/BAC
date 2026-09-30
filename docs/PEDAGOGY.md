# BAC pedagogy

How BAC teaches, and the rules code and the tutor must follow. The engine in src/engine implements the numbered parts; its README explains the math in plain language.

## Learn, not answer

In a field experiment with nearly 1,000 high school students, a plain GPT-4 chat lifted practice grades but became a crutch, and students did worse on their own afterwards. A tutor version that withheld final answers, and was given the correct answer, largely avoided that harm (Bastani et al., PNAS 2025). So in BAC:

- Code decides right and wrong against the stored answer key. The model never grades.
- The tutor needs an attempt before it helps, climbs a hint ladder, and never states the final answer.
- Every tutor call carries the stored answer and worked solution, so the model is never guessing.

CXC now counts AI misuse as an exam irregularity. "Learn, not answer" is the same direction, and we say it plainly to principals and teachers.

## The shape of a week

- A sitting is 10 to 15 minutes and is a complete unit on its own, sized to the 30 to 60 minute weekday windows students actually have.
- The rhythm is weekly, for example three sittings a week, not a daily streak. Missed days carry no shaming copy.
- The first session delivers a real win in minutes, before any sign-up wall: a short placement check, then a missed question fixed with a hint and answered right.
- No public rankings. Progress is measured against the student's own past. Rewards attach to mastery and to fixing old mistakes, never to minutes logged.
- Teachers assign a weekly set by Knowledge Tree node and BAC personalises inside it. Done means every item was eventually answered correctly.

## C-A-R balance

CXC scores three profile dimensions. Every item carries exactly one tag.

| Tag | Profile | What the item asks | Target share |
| --- | --- | --- | --- |
| C | Conceptual | Understand what an idea means: compare, explain, recognise, choose a representation | 30% |
| A | Algorithmic | Carry out a procedure accurately | 40% |
| R | Reasoning | Apply, model, interpret or justify, usually in context | 30% |

Practice sittings stay near 30/40/30. The engine's item picker favours whichever tag is furthest below its share in the student's recent items.

## The loop: every answer runs five steps

1. **Serve.** Pick the next item from the target node, any review that is due and the weakest ancestor, keeping the C-A-R balance and preferring items the student has a good but not certain chance of getting right.
2. **Check.** Compare the answer with the stored key using an exact math-equivalence check, so 0.5, 1/2 and 2/4 all pass when the item allows it. A multiple-choice pick maps straight to its misconception ID, and so does a typed answer that equals a distractor.
3. **Update.** Adjust the student's skill on that node with the rating formula below.
4. **Decide.** If the node crosses its tier threshold, mark it mastered and schedule review. If the student is struggling, walk the prerequisite chain: look back, shore up, bring forward.
5. **Respond.** Show feedback written for that misconception, with hints and the tutor available on demand.

## Skill rating

Skill on a node is θ (theta). Item difficulty is b. The predicted chance of a correct answer is

```latex
p = \frac{1}{1 + e^{-(\theta - b)}}
```

After each answer, with y equal to 1 for correct and 0 for wrong:

```latex
\theta \leftarrow \theta + K\,(y - p)
```

A surprise moves the estimate a lot, and an expected result barely moves it. K starts at 0.4 and shrinks as the student answers more on that node (0.2 after 10 answers, never below 0.1), so early estimates move fast and later ones settle. Item difficulty is seeded from the content label (easy -1, medium 0, hard +1) and recalibrated once an item has about 50 attempts.

Only independent answers count as evidence:

- Only the first answer to an item moves θ. Second and later tries are for learning, not measuring.
- If the student opened a hint before that first answer, a wrong answer still lowers θ but a correct one does not raise it.

## Mastery thresholds

A node counts as mastered when the predicted chance on a typical (medium) item reaches its tier threshold, and the student has answered at least 5 items on it.

| Tier | Threshold | θ needed |
| --- | --- | --- |
| Roots | 70% | 0.85 |
| Stems | 65% | 0.62 |
| Branches | 60% | 0.41 |
| Nodes | 55% | 0.20 |

Foundations need the most certainty because everything above them depends on them. A tree node may override its tier threshold with masteryThreshold in content/knowledge-tree.json.

Mastery can be lost. If review answers pull θ back under the threshold, the node returns to learning.

## Remediation: look back, shore up, bring forward

A student is struggling on a node when they have answered at least 3 items there and their predicted chance on a typical item has fallen below 40%. Then the engine walks the prerequisite chain:

1. **Shore up** a weak prerequisite first: one with enough evidence (3 or more answers) that is not mastered. The weakest goes first; on a tie, the one closer to the roots.
2. **Look back** at prerequisites with too little evidence: probe the nearest one with a few items to find out whether it is the gap.
3. **Bring forward** once every prerequisite is mastered: return to the target node, starting with a worked example.

A root node has no prerequisites, so a struggling root is shored up directly with worked examples.

## Hint ladder

| Rung | Name | Example (18/24 in lowest terms) |
| --- | --- | --- |
| 1 | Nudge | "Is there a number that divides both 18 and 24 exactly?" |
| 2 | Strategy | "Find the HCF of 18 and 24, then divide both." |
| 3 | One worked step | "The HCF is 6. What is 18 ÷ 6?" |
| 4 | Full worked example | The item's workedSolution, step by step |

Rungs 1 to 3 are the item's hints array; rung 4 is its workedSolution. Rungs open one at a time on request. The full worked example unlocks only after two attempts, and it is always followed by a similar question (same node, same C-A-R tag where possible) done without help.

## Feedback

Feedback names the specific slip. Every distractor carries a misconception ID, and content/misconceptions.json holds the feedback written for each one. A good distractor cannot be chosen by a student who understands the idea, and cannot be avoided by a student who holds the misconception (the Eedi principle). Misconception counts feed the teacher view.

Write "Close. You added the tops and added the bottoms." Never "Oops! Try again."

## Review and interleaving

Once a node is mastered it comes back in mixed review after about 2 days, then 1 week, then 3 weeks, then every 3 weeks. A correct review answer moves it to the next gap; a wrong one sends it back to the 2-day gap. Tune the gaps from real data.

In a review set, no two items in a row use the same strategy. Across 54 classes over four months, interleaved practice scored 61% on a surprise test a month later against 38% for blocked practice (Rohrer and colleagues, 2020). It is also how Paper 01 feels.

## Placement, working checks and the teacher

- **Placement check.** 10 to 12 adaptive items across Module 1 that seed each node's θ before the first sitting.
- **Working checks.** Occasionally ask for an intermediate value from a recently solved problem. This only works if the working was written down, which is the point.
- **Teacher view.** Answers one question: who is stuck on what, and what to do about it on Monday. Top misconceptions, stuck nodes and one suggested small-group focus. Frustrated or stuck tutor conversations surface here.
- **Parent summary.** A plain-language weekly note the student can send by WhatsApp.

## What Gemini does

Three jobs only: tutor turns, feedback wording, and first drafts of new questions. Model-drafted questions are saved with status "draft" and reach no student until Chara approves them.

## The tutor

### Behaviour

- Current question only. Politely redirect anything else.
- Needs an attempt before it helps.
- One question at a time, under 60 words, in warm, plain Caribbean Standard English.
- Names the specific slip, using the misconception behind the student's attempts.
- Never states the final answer or a value that gives it away, and never introduces numbers that are not in the question.
- Flags repeated frustration, off-topic drift or distress for the teacher.

### Contract

The server builds the request, so no personal data can slip in. The student is a pseudonymous reference, never a name, email or school.

```json
{
  "studentRef": "anon-7f3c",
  "questionId": "M1-NTC-0006",
  "attempts": ["495", "585"],
  "hintLevel": 2,
  "nodeState": { "R2": 0.41 },
  "country": "BB"
}
```

The server adds the question stem, the answer key, the worked solution and the misconception for each attempt before calling the model. The model must reply in this shape:

```json
{
  "move": "question",
  "message": "You took 45 away from 540 once. What happens if you keep taking 45 away until nothing is left?",
  "misconceptionId": "OP-SUB-FOR-DIV",
  "flag": "none"
}
```

- move is one of: question, hint, encourage, redirect, handoff.
- flag is one of: none, frustration, off_topic, distress.
- A distress flag always goes to the teacher, whatever else happens.

### Answer guard

Before any tutor message reaches a student, code checks it. If the message contains the correct answer, in any equivalent form, or a number that is not in the question, code discards it, retries once, then falls back to the next written hint on the ladder. The check uses the same equivalence rules as answer checking, so "12", "12 weeks" and "twelve" are all caught, and so is naming the correct option letter.
