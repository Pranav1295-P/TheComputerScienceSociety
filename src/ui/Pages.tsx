import { useEffect, useState } from 'react'
import { PROBLEMS, type Problem } from '../data/problems'
import type { Lang } from '../engine/code'
import { COMPLEXITY, OP_LABEL, type Op } from '../engine/ops'
import type { Kind } from '../engine/rec'
import { TOURS } from '../engine/tours'
import { TRACES } from '../engine/traces'
import { MAX_WAGONS, currentSize, useLab } from '../store'
import { CodeBlock, CodePanel, LangTabs, WatchPanel } from './panels'
import { StageCard } from './StageCard'

export const LAB_SLUG = 'cse-linked-list-express'
export const LAB_TABS = [
  { id: 'learn', label: 'Learn' },
  { id: 'simulator', label: 'Simulator' },
  { id: 'practice', label: 'Practice' },
  { id: 'reference', label: 'Reference' },
]

// ---------------- Learn ----------------

export function Learn() {
  const [active, setActive] = useState(0)
  const load = useLab((s) => s.load)
  const setView = useLab((s) => s.setView)
  const tour = TOURS[active]
  useEffect(() => {
    setView('track')
    load(tour.build())
  }, [tour, load, setView])
  return (
    <div className="lab-grid">
      <aside className="rail">
        <h2>The route</h2>
        <ol className="tour-list">
          {TOURS.map((t, i) => (
            <li key={t.id}>
              <button className={i === active ? 'on' : ''} aria-current={i === active ? 'step' : undefined} onClick={() => setActive(i)}>
                <span>{i + 1}</span>
                {t.title}
              </button>
            </li>
          ))}
        </ol>
      </aside>
      <StageCard />
      <aside className="side">
        <section className="panel">
          <header><h3>The big idea</h3></header>
          <p className="idea">{tour.idea}</p>
          <h4 className="sub">Watch for</h4>
          <ul className="notice">
            {tour.notice.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </section>
        <WatchPanel />
      </aside>
    </div>
  )
}

// ---------------- Simulator ----------------

const KINDS: { id: Kind; label: string; note: string }[] = [
  { id: 'singly', label: 'Singly', note: 'One coupling per wagon, keeps head only.' },
  { id: 'doubly', label: 'Doubly', note: 'Forward and backward couplings, keeps head and tail.' },
  { id: 'circular', label: 'Circular', note: 'A closed loop that keeps only tail. First wagon is tail.next.' },
]

const randomValue = () => String(10 + Math.floor(Math.random() * 90))

export function Simulator() {
  const { kind, setKind, runOp, resetList, showSim, quiz, setQuiz, setView } = useLab()
  const [value, setValue] = useState(randomValue)
  const [pos, setPos] = useState('2')
  const [error, setError] = useState('')

  useEffect(() => {
    setView('track')
    showSim()
  }, [showSim, setView])

  const fire = (op: Op) => {
    const n = currentSize()
    const p = Number(pos)
    const v = value.trim()
    const inserting = op.startsWith('insert')
    if (inserting && !v) return setError('Enter a value for the new wagon.')
    if (inserting && n >= MAX_WAGONS) return setError(`The yard holds ${MAX_WAGONS} wagons. Delete one first.`)
    if (op === 'insertAt' && (!Number.isInteger(p) || p < 0 || p > n)) return setError(`Insert position must be a whole number from 0 to ${n}.`)
    if (op === 'deleteAt' && n === 0) return setError('The train is empty, so there is nothing to delete.')
    if (op === 'deleteAt' && (!Number.isInteger(p) || p < 0 || p >= n)) return setError(`Delete position must be a whole number from 0 to ${n - 1}.`)
    setError('')
    runOp(op, v, p)
    if (inserting) setValue(randomValue())
  }

  const btn = (op: Op, label: string) => (
    <button className="op" onClick={() => fire(op)}>
      {label}
      <small>{COMPLEXITY[kind][op]}</small>
    </button>
  )

  return (
    <div className="lab-grid">
      <aside className="rail">
        <h2>Train type</h2>
        <div className="kinds" role="radiogroup" aria-label="Linked list type">
          {KINDS.map((k) => (
            <button key={k.id} role="radio" aria-checked={kind === k.id} className={kind === k.id ? 'on' : ''} onClick={() => setKind(k.id)}>
              {k.label}
            </button>
          ))}
        </div>
        <p className="muted small">{KINDS.find((k) => k.id === kind)!.note}</p>

        <div className="fields">
          <label>Wagon value
            <input value={value} maxLength={4} onChange={(e) => setValue(e.target.value)} />
          </label>
          <label>Position (0 = first)
            <input value={pos} inputMode="numeric" onChange={(e) => setPos(e.target.value)} />
          </label>
        </div>
        {error && <p className="error" role="alert">{error}</p>}

        <h3>Insert</h3>
        <div className="ops">
          {btn('insertBegin', 'At beginning')}
          {btn('insertEnd', 'At end')}
          {btn('insertAt', 'At position')}
        </div>
        <h3>Delete</h3>
        <div className="ops">
          {btn('deleteBegin', 'At beginning')}
          {btn('deleteEnd', 'At end')}
          {btn('deleteAt', 'At position')}
        </div>
        <h3>Walk</h3>
        <div className="ops">{btn('traverse', 'Traverse')}</div>

        <label className="toggle">
          <input type="checkbox" checked={quiz} onChange={(e) => setQuiz(e.target.checked)} />
          <span><b>Predict mode</b> Answer which line runs next before each coupling changes.</span>
        </label>
        <div className="row-btns">
          <button className="ghost" onClick={() => resetList()}>Reset train</button>
          <button className="ghost" onClick={() => resetList([])}>Empty train</button>
        </div>
      </aside>
      <StageCard />
      <aside className="side">
        <CodePanel />
        <WatchPanel />
      </aside>
    </div>
  )
}

// ---------------- Practice ----------------

const SOLVED_KEY = 'tcss.linkedlist.solved'
const readSolved = (): number[] => {
  try {
    return JSON.parse(localStorage.getItem(SOLVED_KEY) ?? '[]')
  } catch {
    return []
  }
}
function useSolved() {
  const [solved, set] = useState<number[]>(readSolved)
  const toggle = (n: number) =>
    set((s) => {
      const next = s.includes(n) ? s.filter((x) => x !== n) : [...s, n]
      try {
        localStorage.setItem(SOLVED_KEY, JSON.stringify(next))
      } catch {
        /* progress simply is not remembered */
      }
      return next
    })
  return { solved, toggle }
}

function ProblemTable({ tier, solved, toggle }: { tier: Problem['tier']; solved: number[]; toggle: (n: number) => void }) {
  return (
    <ul className="plist">
      {PROBLEMS.filter((p) => p.tier === tier).map((p, i) => (
        <li key={p.n} className={solved.includes(p.n) ? 'done' : ''}>
          <span className="rank">{String(i + 1).padStart(2, '0')}</span>
          <a href={`#/${LAB_SLUG}/practice/${p.n}`}>
            <b>{p.n}. {p.title}</b>
            <small>{p.pattern}</small>
          </a>
          {TRACES[p.n] && <span className="chip trace">3D walkthrough</span>}
          <span className={`chip diff ${p.diff}`}>{p.diff}</span>
          <label className="check">
            <input type="checkbox" checked={solved.includes(p.n)} onChange={() => toggle(p.n)} aria-label={`Mark ${p.title} solved`} />
          </label>
        </li>
      ))}
    </ul>
  )
}

export function Practice() {
  const { solved, toggle } = useSolved()
  return (
    <div className="page">
      <header className="page-head">
        <h1>Practice yard</h1>
        <p>Work through Standard first: it installs the five patterns the MAANG set combines. Your progress stays in this browser.</p>
        <div className="progress" role="img" aria-label={`${solved.length} of ${PROBLEMS.length} solved`}>
          <i style={{ width: `${(solved.length / PROBLEMS.length) * 100}%` }} />
          <span>{solved.length} of {PROBLEMS.length} solved</span>
        </div>
      </header>
      <section>
        <h2>Standard questions</h2>
        <ProblemTable tier="standard" solved={solved} toggle={toggle} />
      </section>
      <section>
        <h2>MAANG questions</h2>
        <p className="muted">Harder, layered problems of the kind commonly reported in big-tech interviews. This selection is the lab's own curation, not official company data.</p>
        <ProblemTable tier="maang" solved={solved} toggle={toggle} />
      </section>
    </div>
  )
}

const SOLUTION_LANGS: { id: Lang; label: string }[] = [
  { id: 'cpp', label: 'C++' },
  { id: 'python', label: 'Python' },
]

export function ProblemDetail({ n }: { n: number }) {
  const p = PROBLEMS.find((x) => x.n === n)
  const load = useLab((s) => s.load)
  const setView = useLab((s) => s.setView)
  const lang = useLab((s) => s.lang)
  const [hints, setHints] = useState(0)
  const [showCode, setShowCode] = useState(false)
  const trace = TRACES[n]

  useEffect(() => {
    if (trace) {
      setView('track')
      load(trace())
    }
  }, [trace, load, setView])

  if (!p) return <div className="page"><h1>Problem not found</h1><a href={`#/${LAB_SLUG}/practice`}>Back to practice</a></div>
  const codeLang: Lang = lang === 'python' ? 'python' : 'cpp'

  return (
    <div className={`detail ${trace ? '' : 'no-trace'}`}>
      <article>
        <a className="back" href={`#/${LAB_SLUG}/practice`}>← Practice yard</a>
        <h1>{p.n}. {p.title}</h1>
        <p className="meta">
          <span className={`chip diff ${p.diff}`}>{p.diff}</span>
          <span className="chip">{p.pattern}</span>
          <span className="chip">Time {p.time}</span>
          <span className="chip">Space {p.space}</span>
          <a href={`https://leetcode.com/problems/${p.slug}/`} target="_blank" rel="noreferrer">Open on LeetCode ↗</a>
        </p>
        <h2>On the track</h2>
        <p className="train-line">{p.train}</p>
        <h2>Key insight</h2>
        <p>{p.insight}</p>
        <h2>Hints</h2>
        <ol className="hints">
          {p.hints.slice(0, hints).map((h) => <li key={h}>{h}</li>)}
        </ol>
        {hints < p.hints.length && <button className="ghost" onClick={() => setHints(hints + 1)}>Reveal hint {hints + 1} of {p.hints.length}</button>}
        <h2>The plan</h2>
        <ol className="plan">{p.walk.map((w) => <li key={w}>{w}</li>)}</ol>
        <h2>Edge cases to say out loud</h2>
        <ul className="edges">{p.edges.map((e) => <li key={e}>{e}</li>)}</ul>
        <h2>What the interviewer is testing</h2>
        <p>{p.probe}</p>
        <h2>Solution</h2>
        {showCode ? (
          <section className="panel flat">
            <header><LangTabs options={SOLUTION_LANGS} /></header>
            <CodeBlock source={codeLang === 'cpp' ? p.cpp : p.py} lang={codeLang} />
          </section>
        ) : (
          <button className="ghost" onClick={() => setShowCode(true)}>I tried it. Show the solution</button>
        )}
      </article>
      {trace && <div className="detail-stage"><StageCard /></div>}
    </div>
  )
}

// ---------------- Reference ----------------

const ROWS: Op[] = ['traverse', 'insertBegin', 'insertEnd', 'insertAt', 'deleteBegin', 'deleteEnd', 'deleteAt']
const ARRAY: Record<Op, string> = { traverse: 'O(n)', insertBegin: 'O(n)', insertEnd: 'O(1)*', insertAt: 'O(n)', deleteBegin: 'O(n)', deleteEnd: 'O(1)', deleteAt: 'O(n)' }

const DICTIONARY = [
  ['Wagon', 'Node'],
  ['Cargo plate', 'val'],
  ['Yellow coupling', 'next pointer'],
  ['Coral coupling', 'prev pointer'],
  ['Engine and green coupling', 'head pointer'],
  ['Tail lamp', 'tail pointer'],
  ['Inspector', 'temporary pointer (cur)'],
  ['NULL stub', 'nullptr / null / None'],
  ['Siding', 'a node allocated but not linked yet'],
  ['Red wagon', 'unreachable node (memory leak)'],
  ['Memory yard bay', 'heap address'],
]

const PATTERNS = [
  ['Dummy node', 'The head might change, or deletion needs a predecessor.'],
  ['Fast and slow', 'Middle of list, cycle detection, k-from-end variations.'],
  ['Prev, curr, next', 'Reversal of a whole list or of a segment.'],
  ['Gap of k', 'Anything counted from the end, in one pass.'],
  ['Hash map plus list', 'Need O(1) lookup and O(1) reordering together.'],
]

const CHECKLIST = [
  'Empty list: is head NULL?',
  'Single node: does head or tail have to change?',
  'First and last positions: did you update head or tail?',
  'Is every pointer saved before it is overwritten?',
  'Does the loop stop at the right node, cur or cur.next?',
  'Doubly linked: did both directions get updated?',
  'Circular: does the loop stop without relying on NULL?',
  'C++: is every removed node deleted?',
]

export function Reference() {
  return (
    <div className="page">
      <header className="page-head">
        <h1>Reference</h1>
        <p>Everything worth remembering, on one page.</p>
      </header>
      <section>
        <h2>Time complexity</h2>
        <div className="table-scroll">
          <table className="cmp">
            <thead>
              <tr><th scope="col">Operation</th><th scope="col">Array</th><th scope="col">Singly</th><th scope="col">Doubly</th><th scope="col">Circular</th></tr>
            </thead>
            <tbody>
              <tr><th scope="row">Access by index</th><td className="good">O(1)</td><td>O(n)</td><td>O(n)</td><td>O(n)</td></tr>
              {ROWS.map((op) => (
                <tr key={op}>
                  <th scope="row">{OP_LABEL[op]}</th>
                  {[ARRAY[op], COMPLEXITY.singly[op], COMPLEXITY.doubly[op], COMPLEXITY.circular[op]].map((c, i) => (
                    <td key={i} className={c.startsWith('O(1') ? 'good' : ''}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted small">This lab's singly list keeps head only, doubly keeps head and tail, and circular keeps tail only. Adding a tail pointer makes singly insert-at-end O(1), but delete-at-end stays O(n). * Dynamic arrays are amortized O(1).</p>
      </section>
      <div className="ref-cols">
        <section>
          <h2>Train to code</h2>
          <dl className="dict">
            {DICTIONARY.map(([a, b]) => (
              <div key={a}><dt>{a}</dt><dd>{b}</dd></div>
            ))}
          </dl>
        </section>
        <section>
          <h2>Five patterns</h2>
          <dl className="dict stacked">
            {PATTERNS.map(([a, b]) => (
              <div key={a}><dt>{a}</dt><dd>{b}</dd></div>
            ))}
          </dl>
        </section>
        <section>
          <h2>Before you say "done"</h2>
          <ul className="checks">{CHECKLIST.map((c) => <li key={c}>{c}</li>)}</ul>
        </section>
      </div>
    </div>
  )
}
