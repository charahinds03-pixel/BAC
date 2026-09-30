import { StyleGuide } from './styleguide/StyleGuide'

// Two routes for now. AI Studio adds the real screens and, if needed, a router.
export function App() {
  const path = window.location.pathname.replace(/\/+$/, '')
  if (path.endsWith('/styleguide')) return <StyleGuide />
  return <Home />
}

function Home() {
  return (
    <main className="page">
      <p className="caption">Bridge Academy Caribbean</p>
      <h1>Learn, not answer.</h1>
      <p className="page__lede">
        Adaptive CSEC Mathematics for Form 4 and 5 in Barbados and Grenada. Module 1 is being built.
      </p>
      <p>
        <a href="/styleguide">Open the style guide</a>, the design contract for every screen.
      </p>
    </main>
  )
}
