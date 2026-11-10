import { useEffect, useState } from 'react'
import { Home } from './ui/Home'
import { LAB_SLUG, LAB_TABS, Learn, Practice, ProblemDetail, Reference, Simulator } from './ui/Pages'

const SOCIETY = 'TheComputerScienceSociety'
const TAGLINE = 'A Community Of Relativity'

function useRoute() {
  const read = () => window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const on = () => {
      setRoute(read())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

export function App() {
  const route = useRoute()
  const inLab = route[0] === LAB_SLUG
  const tab = route[1] ?? 'learn'

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#/">
          <span className="brand-mark" aria-hidden />
          <span>
            <b>{SOCIETY}</b>
            <small>{TAGLINE}</small>
          </span>
        </a>
        {inLab && (
          <>
            <span className="lab-tag">CSE-Linked-List-Express</span>
            <nav aria-label="Lab sections">
              {LAB_TABS.map((t) => (
                <a key={t.id} href={`#/${LAB_SLUG}/${t.id}`} className={tab === t.id ? 'on' : ''} aria-current={tab === t.id ? 'page' : undefined}>
                  {t.label}
                </a>
              ))}
            </nav>
          </>
        )}
      </header>
      <main>
        {!inLab && <Home />}
        {inLab && tab === 'learn' && <Learn />}
        {inLab && tab === 'simulator' && <Simulator />}
        {inLab && tab === 'practice' && !route[2] && <Practice />}
        {inLab && tab === 'practice' && route[2] && <ProblemDetail key={route[2]} n={Number(route[2])} />}
        {inLab && tab === 'reference' && <Reference />}
      </main>
    </div>
  )
}
