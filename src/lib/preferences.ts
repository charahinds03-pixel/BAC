// Per-phone display preferences, kept in localStorage. Every read and write
// is wrapped, because storage can be blocked (private browsing, some school
// phones) and the app must still work without it.

export type ThemeChoice = 'device' | 'day' | 'night'
export type HeadingFont = 'fraunces' | 'newsreader' | 'literata'

const THEME_KEY = 'bac.theme'
const HEADING_KEY = 'bac.headingFont'

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Storage is blocked. The choice still applies until the page closes.
  }
}

export function loadTheme(): ThemeChoice {
  const saved = read(THEME_KEY)
  return saved === 'day' || saved === 'night' ? saved : 'device'
}

/** Day or night study mode, or follow the phone's own setting. */
export function applyTheme(choice: ThemeChoice): void {
  const root = document.documentElement
  if (choice === 'device') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', choice)
  write(THEME_KEY, choice)
}

export function loadHeadingFont(): HeadingFont {
  const saved = read(HEADING_KEY)
  return saved === 'newsreader' || saved === 'literata' ? saved : 'fraunces'
}

/** Switches the heading font while Chara tests the three candidates. */
export function applyHeadingFont(font: HeadingFont): void {
  const root = document.documentElement
  if (font === 'fraunces') root.removeAttribute('data-heading')
  else root.setAttribute('data-heading', font)
  write(HEADING_KEY, font)
}
