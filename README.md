# BAC: Bridge Academy Caribbean

Adaptive CSEC Mathematics for Form 4 and 5 students in Barbados and Grenada, built module-first on CXC 05/G/SYLL 16 (amended October 2025). Learn, not answer.

## Start here

- **AGENTS.md** is the rulebook every coding agent reads first. CLAUDE.md points Claude Code at it.
- **docs/BRIEF.md** is the full research and build brief.
- **docs/DESIGN.md**, **docs/PEDAGOGY.md** and **docs/CONTENT.md** hold the detail the rules point to.
- **docs/DECISIONS.md** records every call made and why.
- **src/engine/README.md** explains the engine's math in plain language.

## Run it

```bash
npm install
npm run dev        # the app on port 3000; the style guide is at /styleguide
npm test           # engine unit tests
npm run validate   # checks everything in /content
npm run typecheck
npm run build
```

## What lives where

| Path | What | Owner |
| --- | --- | --- |
| content/ | Syllabus map, Knowledge Tree, misconceptions and questions as JSON | Claude Code |
| src/engine/ | Pure TypeScript: answer checking, rating, mastery, remediation, review, tutor guard | Claude Code |
| docs/ | The brief, design, pedagogy, content rules and decisions | Claude Code |
| scripts/ | The content validator | Claude Code |
| src/styles/, src/components/ | Design tokens and the core components | AI Studio, after changes land on /styleguide first |
| src/styleguide/ | The /styleguide screen, the design contract for both agents | Shared, Chara approves |
| src/data/ | Loads /content into the app through the validator | AI Studio |

Push before you switch tools, pull when you arrive.
