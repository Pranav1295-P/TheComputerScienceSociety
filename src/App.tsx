import { useEffect, useState } from 'react'
import { SEQ_LABS } from './seq/defs'
import { Home } from './ui/Home'
import { LAB_SLUG, LAB_TABS, Learn, LinkedListPractice, Reference, Simulator } from './ui/Pages'
import { SeqLabPage } from './ui/SeqLab'

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
  const slug = route[0]
  const seq = SEQ_LABS.find((l) => l.slug === slug)
  const isList = slug === LAB_SLUG
  const inLab = isList || !!seq
  const tab = route[1] ?? 'learn'
  const labName = seq ? seq.name : 'CSE-Linked-List-Express'

  return (
    <div className="app" data-lab={seq?.engine.id ?? (isList ? 'list' : 'home')}>
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
            <span className="lab-tag">{labName}</span>
            <nav aria-label="Lab sections">
              {LAB_TABS.map((t) => (
                <a key={t.id} href={`#/${slug}/${t.id}`} className={tab === t.id ? 'on' : ''} aria-current={tab === t.id ? 'page' : undefined}>
                  {t.label}
                </a>
              ))}
            </nav>
          </>
        )}
      </header>
      <main>
        {!inLab && <Home />}
        {isList && tab === 'learn' && <Learn />}
        {isList && tab === 'simulator' && <Simulator />}
        {isList && tab === 'practice' && <LinkedListPractice sub={route[2]} />}
        {isList && tab === 'reference' && <Reference />}
        {seq && <SeqLabPage key={seq.slug} def={seq} tab={tab} sub={route[2]} />}
      </main>
    </div>
  )
}
