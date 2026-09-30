# BAC design

This is the design contract for every screen. The /styleguide screen is its living version: if the two disagree, fix one of them before building anything new.

## The concept: the exercise book and the margin

Warm paper, ink-navy text, thin ruled lines instead of floating cards, and a teacher's marks in the margin. BAC should feel like a well-kept copybook and a good teacher, not a startup dashboard.

Language models reproduce the most common interface they have seen. BAC avoids that with exact tokens, a banned list, real content and an approved style guide screen, built before any feature exists.

## Colour tokens

The navy, teal and gold family stays, but with our own values. Stock teal-600 (#0D9488) and amber-600 (#D97706) are banned because they make every build look like every other Tailwind app.

| Token | Day | Night | Use |
| --- | --- | --- | --- |
| paper | #F7F2E8 | #13203A | Page background |
| paper-raised | #FFFCF6 | #1A2A48 | Inputs, answer sheets, the bottom action bar |
| ink | #1B2A4A | #F3EBDA | Text and primary buttons |
| ink-soft | #4A5670 | #BDB5A4 | Secondary text and the borders of controls |
| rule | #DCD2C0 | #34435F | Ruled lines and decorative borders |
| sea | #1F7A6D | #6CC2B2 | Correct answers and progress |
| mace | #B5432E | #EE8A70 | Corrections and errors, like a nutmeg-red pen |
| gold | #C8961E | #E2B24C | Mastery moments only |

The CSS lives in src/styles/tokens.css. Components use the variables (var(--ink)), never raw hex values. Tints are allowed only as mixes of these tokens, for example `color-mix(in srgb, var(--sea) 10%, var(--paper-raised))`.

Night study mode is deep navy paper with warm cream ink, never pure black. It follows the phone's dark mode setting, and the student can switch it by hand. The night values are a first proposal (see docs/DECISIONS.md) and need the same daylight and bedtime test on a real phone before they are locked.

### Contrast (WCAG 2.1, measured on paper)

| Pair | Day | Night | Verdict |
| --- | --- | --- | --- |
| ink on paper | 12.75 | 13.67 | Pass AAA |
| ink-soft on paper | 6.59 | 7.96 | Pass AA |
| sea on paper | 4.63 | 7.72 | Pass AA, day is close to the line |
| mace on paper | 4.94 | 6.57 | Pass AA |
| gold on paper | 2.40 | 8.26 | Fails by day, so gold is never text |
| paper on ink (primary button) | 12.75 | 13.67 | Pass AAA |
| rule on paper | 1.34 | 1.63 | Decorative only |

Rules for colour:

1. Gold is never text, in either mode. Use it for the mastery seal, the mastered marker on the Knowledge Tree, and nothing else.
2. rule is decorative. Any edge a student must see to use a control (an input, a choice row) uses ink-soft, which passes the 3:1 non-text contrast rule.
3. Right and wrong are never shown by colour alone. A correct answer also gets a drawn tick, and a wrong one gets a margin note in words.
4. sea is close to the AA line by day. Do not lighten it, and do not put sea text on a tinted background.

## Type

| Element | Choice | Rule |
| --- | --- | --- |
| Headings | Fraunces, Newsreader or Literata | Test all three on a cheap Android phone and keep one. The style guide has a switch for this. |
| Body | Atkinson Hyperlegible | 16px minimum. Designed for readers with low vision. |
| Math | KaTeX | CXC notation from the syllabus symbol list |

Fonts are self-hosted (the @fontsource packages), so they work offline and send nothing to a third party.

Type scale, in rem at a 16px root: 0.875 (captions only, never question text), 1 (body), 1.125 (question stems), 1.375 (screen titles), 1.75 (the one big heading per screen). Body line height is 1.5; headings 1.2. Numbers in tables and progress use tabular figures.

## Math notation

Write math in content between `\(` and `\)`, for example `\(\frac{18}{24}\)`. The `$` sign is kept free for money (BDS $45, EC $120). KaTeX renders the math; plain text stays plain.

Follow CXC print conventions: stacked fractions, × and ÷ rather than * and /, a space as the thousands separator (24 300), a decimal point, and units after a space (45 cm).

## Shape and space

- Corner radius 4px for controls and 6px for sheets. Nothing rounder.
- 1px rules and borders instead of shadows. No box shadows anywhere.
- 8px spacing grid: 4, 8, 16, 24, 32, 48. The 4 is for tight inline gaps only.
- Content is a single column, at most 40rem wide, centred on larger screens.

## Layout

- Design at 360px first, then check 320px and 414px.
- One question per screen. No scrolling lists of questions.
- The primary action sits in a bottom action bar in the thumb zone, clear of the phone's home indicator (use the safe-area inset).
- Every touch target is at least 44px by 44px, including choice rows and hint rungs.
- Every screen defines four states: loading, empty, error and offline.

## Core components

These are the components on /styleguide. Screens reuse them rather than inventing their own.

| Component | What it is | Rules |
| --- | --- | --- |
| Button | Primary (ink fill, paper text), secondary (ink-soft outline), quiet (text only) | 44px tall minimum. One primary per screen. Labels are verbs: "Check", "Next question". |
| Math | Renders `\( \)` segments with KaTeX inside plain text | Never render untrusted HTML. KaTeX errors fall back to the raw text. |
| Question sheet | The stem on paper-raised, with a thin rule above and below | Stem at 1.125rem. Country and paper labels in ink-soft. |
| Choice list | Paper 01 options as ruled rows labelled A to D | The whole row is the target. Selected rows get an ink border. After checking, the right row gets a sea tick and a chosen wrong row gets a mace strike. |
| Answer box | Free response on paper-raised with an ink-soft border | Numeric keyboard on phones (inputmode="decimal"). Accepts 1/2, 0.5, 24 300 and BDS $540. |
| Margin note | The teacher's mark beside the work | A mace or sea rule on the left edge, feedback in words. Written for the specific misconception. |
| Hint ladder | Four rungs: nudge, strategy, one worked step, full worked example | Rungs open one at a time. The full example stays locked until two attempts. |
| Worked solution | Numbered steps, ruled like an exercise book | One step per line. |
| Tutor note | The tutor's one question, set in the margin style | Under 60 words. Never a chat bubble, never a sparkle icon. |
| Sitting progress | "Question 3 of 12" and a thin sea line | No percentages, no timers unless it is a mock. |
| Tree row | One Knowledge Tree node: title, tier, status and a C-A-R profile | Status in words (Not started, Learning, Mastered). Gold marker only when mastered. |
| Readiness | An honest Module 1 readiness signal | Plain language and the reason: "Not ready yet: Sets and Measurement have no evidence." |
| Notice | Loading, empty, error and offline states | Says what happened and what to do next, in one or two sentences. |
| Bottom bar | The action area in the thumb zone | paper-raised with a rule on top. |

## Motion and sound

- Transitions last 150 to 250ms with an ease-out curve.
- A correct tick is drawn as a pen stroke. A mastery moment draws the gold seal.
- With reduced motion switched on, everything appears in its final state with no movement.
- Sound is one steel-pan note, only when a node is mastered, and off by default in class.

## Voice

Warm, direct and specific, like a good Caribbean teacher.

| Write | Not |
| --- | --- |
| "Right. You kept the negative sign through both steps." | "Great job!" |
| "Close. You divided by negative 3 but kept the inequality facing the same way." | "Oops! Try again." |
| "You have three sittings left this week." | "Don't break your streak!" |
| "No signal. Your answers are saved on this phone and will sync later." | "Network error." |

No em dashes in UI copy. No exclamation marks in feedback. Missed days never get shaming copy, because Crop Over, church and caring for siblings are real life.

## Never ship

- Purple, or blue-to-pink, gradients. Any gradient text.
- Glassmorphism, frosted panels, backdrop blur.
- Emoji as icons. Sparkle icons for AI.
- Rows of identical stat cards.
- Stock Tailwind or shadcn palettes (teal-600, amber-600, slate, zinc and friends).
- Inter as the only font.
- Big rounded cards with soft shadows.
- Slogans like "Unlock your potential".
- Public leaderboards, streak flames, confetti.

## If Tailwind is added

AI Studio often reaches for Tailwind. If it is added, it must wipe the stock palette and expose only BAC tokens, so a stray `bg-teal-600` does nothing:

```css
@import "tailwindcss";
@theme {
  --color-*: initial;
  --color-paper: var(--paper);
  --color-paper-raised: var(--paper-raised);
  --color-ink: var(--ink);
  --color-ink-soft: var(--ink-soft);
  --color-rule: var(--rule);
  --color-sea: var(--sea);
  --color-mace: var(--mace);
  --color-gold: var(--gold);
}
```

## Keeping agents on brand

Build and approve the style guide screen first, then require every screen to reuse its components. Feed real CSEC questions from /content, never placeholder text. Ask for two or three variations before choosing, fix visual details by drawing on AI Studio's preview, and judge everything on a real phone.
