import { useEffect, useState, type FC } from 'react'
import type { Problem } from '../data/problems'
import type { Lang } from '../engine/code'
import { useLab } from '../store'
import { CodeBlock, LangTabs } from './panels'

export interface PracticeConfig {
  slug: string
  storageKey: string
  problems: Problem[]
  hasTrace: (n: number) => boolean
  loadTrace: (n: number) => void
  Stage: FC
  intro: string
}

const read = (key: string): number[] => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]')
  } catch {
    return []
  }
}

function useSolved(key: string) {
  const [solved, set] = useState<number[]>(() => read(key))
  const toggle = (n: number) =>
    set((s) => {
      const next = s.includes(n) ? s.filter((x) => x !== n) : [...s, n]
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch {
        /* progress simply is not remembered */
      }
      return next
    })
  return { solved, toggle }
}

function ProblemTable({ cfg, tier, solved, toggle }: { cfg: PracticeConfig; tier: Problem['tier']; solved: number[]; toggle: (n: number) => void }) {
  return (
    <ul className="plist">
      {cfg.problems.filter((p) => p.tier === tier).map((p, i) => (
        <li key={p.n} className={solved.includes(p.n) ? 'done' : ''}>
          <span className="rank">{String(i + 1).padStart(2, '0')}</span>
          <a href={`#/${cfg.slug}/practice/${p.n}`}>
            <b>{p.n}. {p.title}</b>
            <small>{p.pattern}</small>
          </a>
          {cfg.hasTrace(p.n) && <span className="chip trace">3D walkthrough</span>}
          <span className={`chip diff ${p.diff}`}>{p.diff}</span>
          <label className="check">
            <input type="checkbox" checked={solved.includes(p.n)} onChange={() => toggle(p.n)} aria-label={`Mark ${p.title} solved`} />
          </label>
        </li>
      ))}
    </ul>
  )
}

export function Practice({ cfg }: { cfg: PracticeConfig }) {
  const { solved, toggle } = useSolved(cfg.storageKey)
  const total = cfg.problems.length
  return (
    <div className="page">
      <header className="page-head">
        <h1>Practice</h1>
        <p>{cfg.intro} Your progress stays in this browser.</p>
        <div className="progress" role="img" aria-label={`${solved.length} of ${total} solved`}>
          <i style={{ width: `${(solved.length / total) * 100}%` }} />
          <span>{solved.length} of {total} solved</span>
        </div>
      </header>
      <section>
        <h2>Standard questions</h2>
        <ProblemTable cfg={cfg} tier="standard" solved={solved} toggle={toggle} />
      </section>
      <section>
        <h2>MAANG questions</h2>
        <p className="muted">Harder, layered problems of the kind commonly reported in big-tech interviews. This selection is the lab's own curation, not official company data.</p>
        <ProblemTable cfg={cfg} tier="maang" solved={solved} toggle={toggle} />
      </section>
    </div>
  )
}

const SOLUTION_LANGS: { id: Lang; label: string }[] = [
  { id: 'cpp', label: 'C++' },
  { id: 'python', label: 'Python' },
]

export function ProblemDetail({ cfg, n }: { cfg: PracticeConfig; n: number }) {
  const p = cfg.problems.find((x) => x.n === n)
  const lang = useLab((s) => s.lang)
  const [hints, setHints] = useState(0)
  const [showCode, setShowCode] = useState(false)
  const trace = cfg.hasTrace(n)

  useEffect(() => {
    if (trace) cfg.loadTrace(n)
  }, [trace, n, cfg])

  if (!p) return <div className="page"><h1>Problem not found</h1><a href={`#/${cfg.slug}/practice`}>Back to practice</a></div>
  const codeLang: Lang = lang === 'python' ? 'python' : 'cpp'
  const Stage = cfg.Stage

  return (
    <div className={`detail ${trace ? '' : 'no-trace'}`}>
      <article>
        <a className="back" href={`#/${cfg.slug}/practice`}>← Practice</a>
        <h1>{p.n}. {p.title}</h1>
        <p className="meta">
          <span className={`chip diff ${p.diff}`}>{p.diff}</span>
          <span className="chip">{p.pattern}</span>
          <span className="chip">Time {p.time}</span>
          <span className="chip">Space {p.space}</span>
          <a href={`https://leetcode.com/problems/${p.slug}/`} target="_blank" rel="noreferrer">Open on LeetCode ↗</a>
        </p>
        <h2>The picture</h2>
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
      {trace && <div className="detail-stage"><Stage /></div>}
    </div>
  )
}
