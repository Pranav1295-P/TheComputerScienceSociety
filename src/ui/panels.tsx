import { LANGS, printAlgo, tokenize, type Lang } from '../engine/code'
import { ENGINE_ID } from '../engine/rec'
import { POINTER_COLORS } from '../stage/Scene'
import { useLab } from '../store'
import { usePlayerApi } from './player'

export function LangTabs({ options = LANGS }: { options?: { id: Lang; label: string }[] }) {
  const lang = useLab((s) => s.lang)
  const setLang = useLab((s) => s.setLang)
  const active = options.some((o) => o.id === lang) ? lang : options[0].id
  return (
    <div className="lang-tabs" role="tablist" aria-label="Code language">
      {options.map((l) => (
        <button key={l.id} role="tab" aria-selected={active === l.id} className={active === l.id ? 'on' : ''} onClick={() => setLang(l.id)}>
          {l.label}
        </button>
      ))}
    </div>
  )
}

function Tokens({ text, lang }: { text: string; lang: Lang }) {
  return (
    <>
      {tokenize(text, lang).map((t, k) => (
        <span key={k} className={t.c}>{t.t}</span>
      ))}
    </>
  )
}

export function CodeBlock({ source, lang }: { source: string; lang: Lang }) {
  return (
    <pre className="code">
      {source.split('\n').map((l, i) => (
        <div className="ln" key={i}><Tokens text={l || ' '} lang={lang} /></div>
      ))}
    </pre>
  )
}

export function CodePanel() {
  const api = usePlayerApi()
  const step = api.useStore((s) => s.steps[s.idx])
  const lang = useLab((s) => s.lang)
  const algo = step.algo ? api.algos[step.algo] : null
  return (
    <section className="panel">
      <header>
        <h3>Running code</h3>
        <LangTabs />
      </header>
      {algo ? (
        <pre className="code">
          {printAlgo(algo, lang).map((l, i) => (
            <div key={i} className={`ln ${l.tag && l.tag === step.line ? 'active' : ''}`}>
              <Tokens text={l.text} lang={lang} />
            </div>
          ))}
        </pre>
      ) : (
        <p className="muted">Run an operation and its code appears here, with the current line lit.</p>
      )}
      {algo && <p className="muted small">{api.codeNote}</p>}
    </section>
  )
}

export function WatchPanel() {
  const step = useLab((s) => s.steps[s.idx])
  const before = useLab((s) => s.steps[s.idx - 1])
  const { snap } = step
  const addr = (id: string | null | undefined) => (id ? snap.nodes[id]?.addr ?? 'freed' : 'NULL')
  const rows = Object.values(snap.nodes).filter((n) => !n.freed).sort((a, b) => a.slot - b.slot)
  const changed = (id: string, f: 'next' | 'prev') => {
    if (!before) return false
    const old = before.snap.nodes[id]
    return !old || old[f] !== snap.nodes[id][f]
  }
  const showPrev = snap.kind === 'doubly'
  const pointers = [
    ...(snap.showEntry ? ([[snap.entryLabel.toLowerCase(), snap.entry, '#6ff0c0', step.hotLinks.includes(`${ENGINE_ID}:entry`)]] as const) : []),
    ...Object.entries(snap.pointers).map(([k, v]) => [k, v, POINTER_COLORS[k] ?? '#c3d3ee', false] as const),
  ]
  return (
    <section className="panel">
      <header><h3>Pointers</h3></header>
      <ul className="pointers">
        {pointers.map(([name, target, color, hot]) => (
          <li key={name} className={hot ? 'hot' : ''}>
            <i style={{ background: color }} />
            <span>{name}</span>
            <code>{addr(target)}{target && snap.nodes[target] ? ` (${snap.nodes[target].value})` : ''}</code>
          </li>
        ))}
      </ul>
      <div className="counters">
        <div><b>{snap.hops}</b><span>pointer hops</span></div>
        <div><b>{snap.writes}</b><span>pointer writes</span></div>
      </div>
      <header><h3>Memory table</h3></header>
      <div className="mem-scroll">
        <table className="mem">
          <thead>
            <tr><th scope="col">Address</th><th scope="col">val</th><th scope="col">next</th>{showPrev && <th scope="col">prev</th>}</tr>
          </thead>
          <tbody>
            {rows.map((n) => (
              <tr key={n.id} className={[step.hotNodes.includes(n.id) ? 'hot' : '', n.lost ? 'lost' : ''].join(' ')}>
                <td>{n.addr}</td>
                <td>{n.value}</td>
                <td className={changed(n.id, 'next') ? 'chg' : ''}>{addr(n.next)}</td>
                {showPrev && <td className={changed(n.id, 'prev') ? 'chg' : ''}>{addr(n.prev)}</td>}
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} className="muted">No nodes allocated</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  )
}
