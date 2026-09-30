# The BAC engine

Pure TypeScript with no screens, no network and no storage. It makes every judgement about right, wrong and mastery, so the model never has to. Screens and server routes import from `src/engine` (the index file). Run `npm test` to check it.

## Files

| File | Job |
| --- | --- |
| types.ts | The shapes of questions, the Knowledge Tree and a student's state |
| numbers.ts | Reads numbers the way students write them, and holds them as exact fractions |
| mathText.ts | Splits content text into words and `\( \)` math |
| content.ts | Validates /content and loads the question bank |
| answer.ts | Checks an answer against the stored key (loop step 2) |
| rating.ts | The skill rating and item calibration (step 3) |
| mastery.ts | Tier thresholds and "is this node mastered?" (step 4) |
| progress.ts | Records one answer: rating, mastery and review in one call (steps 3 and 4) |
| remediation.ts | Look back, shore up, bring forward (step 4) |
| review.ts | The spaced review schedule and interleaving |
| serve.ts | Picks the next item and the follow-up after a worked example (step 1) |
| hints.ts | The four-rung hint ladder |
| tutorGuard.ts | Blocks a tutor message that gives the answer away |
| tests/ | One test file per module, using the real /content files |

## Using it from a screen

```ts
import { checkAnswer, recordAnswer, planRemediation } from '../engine'

const result = checkAnswer(question, { kind: 'choice', choiceId: 'b' })
// result: { correct: false, reason: 'distractor', misconceptionId: 'OP-SUB-FOR-DIV', choiceId: 'b' }

const outcome = recordAnswer({
  node, state, itemDifficulty: question.difficulty,
  correct: result.correct, attemptNumber: 1, hintsSeen: 0, now: Date.now(),
})
// outcome.state goes back to Firestore; outcome.becameMastered can trigger the gold seal.

const plan = planRemediation(tree, allStates, targetNodeId)
// plan: { stage: 'shore-up', nodeId: 'S1', reason: 'Linear Equations rests on Fractions, ...' }
```

## The math in plain language

### Skill and difficulty sit on one ruler

Every student has a skill number on each Knowledge Tree node, called theta (θ). Every question has a difficulty number, called b. They sit on the same ruler, and only the gap between them matters. When skill equals difficulty, the student has an even chance. Each step of 1 on the ruler moves the chance a long way:

| Skill minus difficulty | Chance of getting it right |
| --- | --- |
| -2 | 12% |
| -1 | 27% |
| 0 | 50% |
| +1 | 73% |
| +2 | 88% |

The formula behind that table is p = 1 / (1 + e^-(θ - b)). You never need to work it out by hand; it is just a smooth S-shaped curve that turns a gap into a chance between 0% and 100%.

A brand new student starts at 0 on every node. Easy questions start at -1, medium at 0 and hard at +1, straight from the difficulty label in /content.

### After each answer, move by the surprise

After an answer, the engine compares what happened with what it expected:

> new skill = old skill + K × (what happened - what we expected)

"What happened" is 1 for right and 0 for wrong. "What we expected" is the chance from the table. So the bracket is the surprise.

- A new student (0) gets a medium question (0) right. Expected 50%, happened 100%, surprise +0.5. With K at 0.4, skill rises by 0.2.
- A strong student (2) gets an easy question (-1) right. Expected 95%, so the surprise is tiny and skill barely moves. That answer taught us almost nothing new.
- The same strong student gets that easy question wrong. Surprise -0.95, a big drop. Something is off, and the engine reacts.

This is the same idea chess ratings use: beating a stronger player moves your rating more than beating a weaker one.

### K shrinks as evidence builds

K is how far one answer can move the estimate. Early on we know little, so answers should count a lot. Later, one bad day should not wipe out weeks of work. K starts at 0.4, halves to 0.2 after 10 answers on a node, and never drops below 0.1:

> K = 0.4 × 10 / (10 + answers so far), but at least 0.1

### Only independent answers count

The first answer to a question counts. Second and later tries are for learning, not measuring, so they do not move skill. If a student opened a hint before answering, a right answer does not raise skill, but a wrong one still lowers it.

### Mastery: a good chance on a typical question

A node is mastered when the student's chance on a typical (medium) question reaches the node's tier threshold, and they have answered at least 5 questions there:

| Tier | Threshold | Skill needed | Straight right answers from a fresh start |
| --- | --- | --- | --- |
| Roots | 70% | 0.85 | 7 |
| Stems | 65% | 0.62 | 5 |
| Branches | 60% | 0.41 | 5 |
| Nodes | 55% | 0.20 | 5 |

Foundations ask for the most certainty because everything above them rests on them. Real students make mistakes, so it usually takes more answers than the last column. Mastery can also be lost: if review answers pull skill back under the line, the node goes back to learning.

### When a student is stuck: look back, shore up, bring forward

A student is struggling on a node after 3 or more answers there with under a 40% chance on a typical question, which is roughly three wrong in a row from a fresh start. Then the engine looks down the tree at the node's prerequisites:

1. **Shore up.** If a prerequisite has enough answers and is below its threshold, practise that one first. The weakest goes first; on a tie, the one closer to the roots.
2. **Look back.** If a prerequisite has too few answers to judge, ask a few questions on it, nearest first, to find out whether it is the gap.
3. **Bring forward.** If every prerequisite is mastered, the gap is in the node itself. Go back to it, starting with a worked example.

### Review: spaced and mixed

Once a node is mastered it comes back after 2 days, then 1 week, then 3 weeks, then every 3 weeks. A right review answer moves to the next gap. A wrong one sends it back to 2 days. Review sets are shuffled so no two questions in a row use the same strategy, which is harder in the moment and makes learning stick.

### Serving the next question

Within the node being practised, the engine first serves the C-A-R tag that is furthest below its 30/40/30 share in the student's last 10 questions. Then it avoids repeating the last strategy. Then it picks the question the student has about a 70% chance on: hard enough to learn from, easy enough to keep going.

### Fixing a question's difficulty with real data

The easy, medium and hard labels are a first guess. Once a question has 50 answers, calibrateDifficulty finds the difficulty that best explains who got it right and who got it wrong. If strong students keep missing a "medium" question, it moves up the ruler. That run happens on the server with real data; the engine only does the math.

### Checking answers exactly

Computers store most decimals slightly wrong (0.1 + 0.2 is 0.30000000000000004 on a computer). The engine avoids that by holding every number as an exact fraction of two whole numbers. So 0.5, 1/2, 2/4 and 50% are all exactly one half. It reads what students type on a phone: 24 300, 24,300, 1 1/2, -3, BDS $540, 3.2 × 10^4.

When an item says answerForm "simplest", the value must also be in lowest terms, so 6/8 is not accepted for 3/4. If a typed answer equals a distractor's value, the student gets that distractor's misconception feedback, just as if they had tapped it.

### The tutor guard

Before a tutor message reaches a student, checkTutorMessage looks for the answer in any form (12, twelve, 12 weeks, one sixth, 2/12 for 1/6, the KaTeX version, or "option a"), any number that is not in the question, and anything over 60 words. If it finds one, the server throws the message away, tries once more, then shows the next written hint instead.
