---
trigger: glob
globs: "**/*.tsx, **/*.css"
description: "BAC design rules. Loads whenever a screen, component or stylesheet changes."
---

# Design rules for BAC screens

Before changing any .tsx or .css file, read docs/DESIGN.md and follow it. The short version:

1. Use only the tokens defined in src/styles/tokens.css, which mirror docs/DESIGN.md. Never write a raw hex colour in a component.
2. Reuse the components shown on the /styleguide screen. If a screen needs something new, add it to the style guide first and ask Chara to approve it.
3. Mobile-first at 360px, one question per screen, 44px touch targets, primary action in the bottom thumb zone.
4. Every screen defines loading, empty, error and offline states.
5. Never ship the banned patterns in docs/DESIGN.md: no gradients, gradient text, glassmorphism, emoji icons, sparkle icons for AI, stock Tailwind or shadcn palettes, or rows of identical stat cards.
6. Use real Module 1 questions from /content, never placeholder text.
