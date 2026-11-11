import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { addr } from '../seq/array'
import type { LabDef } from '../seq/defs'
import { TIERS } from '../seq/queue'
import { SIGN_COLORS, SeqStage } from '../seq/SeqStage'
import type { SeqStep } from '../seq/rec'
import { useSeq } from '../seq/store'
import { CodePanel } from './panels'
import { PlayerCtx, type PlayerApi, type PlayerState } from './player'
import { Practice, ProblemDetail, type PracticeConfig } from './practice'
import { CanvasFrame, Console } from './StageCard'

function SeqCard({ def }: { def: LabDef }) {
  const resetCam = useSeq((s) => s.resetCam)
  return (
    <section className="stagecard">
      <CanvasFrame
        overlay={
          <>
            <ul className="legend" aria-label="Legend">
              {def.legend.map((l) => <li key={l.label}><i style={{ background: l.color }} />{l.label}</li>)}
            </ul>
            <div className="view-toggle"><button onClick={resetCam} title="Reset camera">Recenter</button></div>
          </>
        }
      >
        <SeqStage theme={def.theme} />
      </CanvasFrame>
      <Console />
    </section>
  )
}

function Watch() {
  const step = useSeq((s) => s.steps[s.idx])
  const before = useSeq((s) => s.steps[s.idx - 1])
  const { snap } = step
  const pointers = Object.entries(snap.pointers).filter(([, p]) => p)
  const value = (s: typeof snap, row: number, i: number) => {
    const id = s.rows[row]?.[i]
    return id ? s.items[id].value : ''
  }
  return (
    <section className="panel">
      <header><h3>Indexes</h3></header>
      <ul className="pointers">
        {pointers.map(([name, at]) => (
          <li key={name}>
            <i style={{ background: SIGN_COLORS[name] ?? '#c3d3ee' }} />
            <span>{name}</span>
            <code>{at!.i}</code>
          </li>
        ))}
        {pointers.length === 0 && <li className="muted">None in use</li>}
      </ul>
      <div className="counters">
        <div><b>{snap.reads}</b><span>reads</span></div>
        <div><b>{snap.writes}</b><span>writes</span></div>
      </div>
      <header><h3>Memory</h3></header>
      <div className="mem-scroll">
        <table className="mem">
          <thead><tr><th scope="col">Index</th><th scope="col">Address</th><th scope="col">Value</th></tr></thead>
          <tbody>
            {snap.rows.flatMap((r, row) =>
              r.map((_, i) => {
                const v = value(snap, row, i)
                const hot = step.hot.includes(`${row}:${i}`)
                const changed = !!before && before.snap.rows.length === snap.rows.length && value(before.snap, row, i) !== v
                return (
                  <tr key={`${row}:${i}`} className={hot ? 'hot' : ''}>
                    <td>{snap.rows.length > 1 ? `${row ? 'new' : 'old'}[${i}]` : i}</td>
                    <td>{addr(i, row)}</td>
                    <td className={changed ? 'chg' : v ? '' : 'muted'}>{v || 'free'}</td>
                  </tr>
                )
              }),
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function LearnPage({ def }: { def: LabDef }) {
  const [active, setActive] = useState(0)
  const load = useSeq((s) => s.load)
  const tour = def.tours[active]
  useEffect(() => load(tour.build()), [tour, load])
  return (
    <div className="lab-grid">
      <aside className="rail">
        <h2>Lessons</h2>
        <ol className="tour-list">
          {def.tours.map((t, i) => (
            <li key={t.id}>
              <button className={i === active ? 'on' : ''} aria-current={i === active ? 'step' : undefined} onClick={() => setActive(i)}>
                <span>{i + 1}</span>
                {t.title}
              </button>
            </li>
          ))}
        </ol>
      </aside>
      <SeqCard def={def} />
      <aside className="side">
        <section className="panel">
          <header><h3>The big idea</h3></header>
          <p className="idea">{tour.idea}</p>
          <h4 className="sub">Watch for</h4>
          <ul className="notice">{tour.notice.map((n) => <li key={n}>{n}</li>)}</ul>
        </section>
        <Watch />
      </aside>
    </div>
  )
}

function SimulatorPage({ def }: { def: LabDef }) {
  const mode = useSeq((s) => s.mode)
  const quiz = useSeq((s) => s.quiz)
  const { setMode, setQuiz, runOp, resetList, base, showSim } = useSeq.getState()
  const [value, setValue] = useState(() => def.nextValue(mode))
  const [pos, setPos] = useState(String(def.defaultPos))
  const [tier, setTier] = useState(3)
  const [error, setError] = useState('')
  useEffect(() => showSim(), [showSim])
  const note = def.modes.find((m) => m.id === mode)?.note

  const fire = (op: string) => {
    const args = { value: value.trim(), pos: Number(pos), tier }
    const problem = def.validate(base(), mode, op, args)
    setError(problem)
    if (problem) return
    runOp(op, args)
    if (['insertBegin', 'insertEnd', 'insertAt', 'update', 'push', 'enqueue', 'pushBack', 'pushFront'].includes(op)) setValue(def.nextValue(mode))
  }

  return (
    <div className="lab-grid">
      <aside className="rail">
        {def.modes.length > 0 && (
          <>
            <h2>Queue type</h2>
            <div className="kinds two" role="radiogroup" aria-label="Queue type">
              {def.modes.map((m) => (
                <button key={m.id} role="radio" aria-checked={mode === m.id} className={mode === m.id ? 'on' : ''} onClick={() => { setError(''); setMode(m.id) }}>
                  {m.label}
                </button>
              ))}
            </div>
            <p className="muted small">{note}</p>
          </>
        )}
        <div className="fields">
          {def.fields(mode).map((f) => (
            <label key={f.id} className={f.id === 'tier' ? 'span' : ''}>
              {f.label}
              {f.id === 'tier' ? (
                <select value={tier} onChange={(e) => setTier(Number(e.target.value))}>
                  {[1, 2, 3].map((t) => <option key={t} value={t}>{TIERS[t]}</option>)}
                </select>
              ) : f.id === 'value' ? (
                <input value={value} maxLength={8} onChange={(e) => setValue(e.target.value)} />
              ) : (
                <input value={pos} inputMode="numeric" onChange={(e) => setPos(e.target.value)} />
              )}
            </label>
          ))}
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        {def.groups(mode).map((g) => (
          <div key={g.title}>
            <h3>{g.title}</h3>
            <div className="ops">
              {g.ops.map((o) => (
                <button key={o.op} className="op" onClick={() => fire(o.op)}>
                  {o.label}
                  <small>{o.cost}</small>
                </button>
              ))}
            </div>
          </div>
        ))}
        <label className="toggle">
          <input type="checkbox" checked={quiz} onChange={(e) => setQuiz(e.target.checked)} />
          <span><b>Predict mode</b> Answer which line runs next before each change.</span>
        </label>
        <div className="row-btns">
          {def.extras?.map((x) => (
            <button key={x.label} className="ghost" onClick={() => { setError(''); resetList(x.values) }}>{x.label}</button>
          ))}
        </div>
      </aside>
      <SeqCard def={def} />
      <aside className="side">
        <CodePanel />
        <Watch />
      </aside>
    </div>
  )
}

function ReferencePage({ def }: { def: LabDef }) {
  const r = def.reference
  return (
    <div className="page">
      <header className="page-head">
        <h1>Reference</h1>
        <p>Everything worth remembering about {def.name}, on one page.</p>
      </header>
      <section>
        <h2>Time complexity</h2>
        <div className="table-scroll">
          <table className="cmp">
            <thead><tr>{r.columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead>
            <tbody>
              {r.rows.map((row) => (
                <tr key={row[0]}>
                  <th scope="row">{row[0]}</th>
                  {row.slice(1).map((c, i) => <td key={i} className={c.startsWith('O(1') || c === 'Yes' ? 'good' : ''}>{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted small">{r.note}</p>
      </section>
      <div className="ref-cols">
        <section>
          <h2>Picture to code</h2>
          <dl className="dict">{r.dictionary.map(([a, b]) => <div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}</dl>
        </section>
        <section>
          <h2>Patterns</h2>
          <dl className="dict stacked">{r.patterns.map(([a, b]) => <div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}</dl>
        </section>
        <section>
          <h2>Before you say "done"</h2>
          <ul className="checks">{r.checklist.map((c) => <li key={c}>{c}</li>)}</ul>
        </section>
      </div>
    </div>
  )
}

export function SeqLabPage({ def, tab, sub }: { def: LabDef; tab: string; sub?: string }) {
  // The engine has to be in place before any child reads the store.
  const [ready, setReady] = useState(false)
  useLayoutEffect(() => {
    useSeq.getState().setEngine(def.engine)
    setReady(true)
  }, [def])

  const api = useMemo<PlayerApi>(
    () => ({
      useStore: useSeq as unknown as PlayerApi['useStore'],
      getState: () => useSeq.getState() as unknown as PlayerState,
      algos: def.algos,
      worldLabel: def.worldLabel,
      codeNote: def.codeNote,
      tones: def.tones,
    }),
    [def],
  )

  const practice = useMemo<PracticeConfig>(
    () => ({
      slug: def.slug,
      storageKey: `tcss.${def.engine.id}.solved`,
      problems: def.problems,
      hasTrace: (n) => !!def.traces[n],
      loadTrace: (n) => useSeq.getState().load(def.traces[n]!() as SeqStep[]),
      Stage: () => <SeqCard def={def} />,
      intro: def.practiceIntro,
    }),
    [def],
  )

  if (!ready) return null
  return (
    <PlayerCtx.Provider value={api}>
      {tab === 'learn' && <LearnPage def={def} />}
      {tab === 'simulator' && <SimulatorPage def={def} />}
      {tab === 'practice' && !sub && <Practice cfg={practice} />}
      {tab === 'practice' && sub && <ProblemDetail key={sub} cfg={practice} n={Number(sub)} />}
      {tab === 'reference' && <ReferencePage def={def} />}
    </PlayerCtx.Provider>
  )
}
