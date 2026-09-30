import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'
import '@fontsource/fraunces/600.css'
import '@fontsource/fraunces/400-italic.css'
import '@fontsource/newsreader/600.css'
import '@fontsource/newsreader/400-italic.css'
import '@fontsource/literata/600.css'
import '@fontsource/literata/400-italic.css'
import 'katex/dist/katex.min.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import { App } from './App'
import { applyHeadingFont, applyTheme, loadHeadingFont, loadTheme } from './lib/preferences'

// Apply saved preferences before the first paint, so night mode never flashes white.
applyTheme(loadTheme())
applyHeadingFont(loadHeadingFont())

const root = document.getElementById('root')
if (!root) throw new Error('index.html is missing <div id="root">')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
