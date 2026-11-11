import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { printAlgo } from '../engine/code'
import { Stage } from '../stage/Scene'
import { useLab } from '../store'
import { usePlayerApi } from './player'

function usePlayer() {
  const api = usePlayerApi()
  const playing = api.useStore((s) => s.playing)
  const idx = api.useStore((s) => s.idx)
  const speed = api.useStore((s) => s.speed)
  useEffect(() => {
    if (!playing) return
    const t = setTimeout(() => api.getState().next(), 3000 / speed)
    return () => clearTimeout(t)
  }, [playing, idx, speed, api])
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el.closest('input, select, textarea, button')) return
      const p = api.getState()
      if (e.key === 'ArrowRight') p.next()
      else if (e.key === 'ArrowLeft') p.prev()
      else if (e.key === ' ') {
        e.preventDefault()
        p.toggle()
      }
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [api])
}

function Quiz() {
  const api = usePlayerApi()
  const quizFor = api.useStore((s) => s.quizFor)!
  const target = api.useStore((s) => s.steps[quizFor])
  const resolve = api.useStore((s) => s.resolveQuiz)
  const lang = useLab((s) => s.lang)
  const [wrong, setWrong] = useState<string[]>([])
  const options = useMemo(() => {
    const lines = printAlgo(api.algos[target.algo!], lang).filter((l) => l.tag)
    const at = lines.findIndex((l) => l.tag === target.line)
    const near = lines
      .filter((l) => l.tag !== target.line && l.text.includes('='))
      .sort((a, b) => Math.abs(lines.indexOf(a) - at) - Math.abs(lines.indexOf(b) - at))
      .slice(0, 2)
    const all = [lines[at], ...near]
    const shift = quizFor % all.length
    return [...all.slice(shift), ...all.slice(0, shift)]
  }, [target, lang, quizFor, api])

  return (
    <div className="quiz" role="group" aria-label="Predict the next line">
      <h3>Before anything moves: which line runs next?</h3>
      <div className="quiz-opts">
        {options.map((o) => (
          <button
            key={o.tag}
            className={wrong.includes(o.tag!) ? 'wrong' : ''}
            disabled={wrong.includes(o.tag!)}
            onClick={() => (o.tag === target.line ? resolve() : setWrong((w) => [...w, o.tag!]))}
          >
            <code>{o.text.trim()}</code>
          </button>
        ))}
      </div>
      <p className="quiz-note" aria-live="polite">{wrong.length ? 'Not this one. Ask which value is not ready yet, or what would be overwritten.' : 'Think about what must happen first.'}</p>
    </div>
  )
}

function Board() {
  const api = usePlayerApi()
  const step = api.useStore((s) => s.steps[s.idx])
  const idx = api.useStore((s) => s.idx)
  const total = api.useStore((s) => s.steps.length)
  const quizFor = api.useStore((s) => s.quizFor)
  return (
    <section className={`board tone-${step.tone}`} aria-live="polite">
      {quizFor !== null ? (
        <Quiz key={quizFor} />
      ) : (
        <div className="board-in" key={idx + step.title}>
          <header>
            <span className="tone-chip">{api.tones[step.tone]}</span>
            <span className="count">Step {idx + 1} of {total}</span>
          </header>
          <h2>{step.title}</h2>
          <div className="explain">
            <div>
              <h4>{api.worldLabel}</h4>
              <p>{step.train}</p>
            </div>
            <div>
              <h4>In memory</h4>
              <p>{step.code}</p>
            </div>
          </div>
          {step.ledger && (
            <dl className="ledger">
              {step.ledger.map((l) => (
                <div key={l.label}>
                  <dt>{l.label}</dt>
                  <dd>{l.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </section>
  )
}

function Transport() {
  const api = usePlayerApi()
  const idx = api.useStore((s) => s.idx)
  const playing = api.useStore((s) => s.playing)
  const speed = api.useStore((s) => s.speed)
  const total = api.useStore((s) => s.steps.length)
  const { goto, next, prev, toggle, setSpeed } = api.getState()
  const atEnd = idx >= total - 1
  return (
    <div className="transport">
      <button onClick={() => goto(0)} aria-label="First step" title="First step">⏮</button>
      <button onClick={prev} aria-label="Previous step" title="Previous step (left arrow)">◀</button>
      <button className="play" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'} title="Play or pause (space)">
        {playing ? 'Pause' : atEnd && total > 1 ? 'Replay' : 'Play'}
      </button>
      <button onClick={next} aria-label="Next step" title="Next step (right arrow)">▶</button>
      <button onClick={() => goto(total - 1)} aria-label="Last step" title="Last step">⏭</button>
      <input type="range" min={0} max={Math.max(0, total - 1)} value={idx} aria-label="Scrub through steps" onChange={(e) => goto(Number(e.target.value))} />
      <label>
        Speed
        <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
          {[0.5, 1, 1.5, 2, 3].map((s) => (
            <option key={s} value={s}>{s}×</option>
          ))}
        </select>
      </label>
    </div>
  )
}

/** Narration board and playback controls, shared by every lab. */
export function Console() {
  usePlayer()
  return (
    <>
      <Board />
      <Transport />
    </>
  )
}

export function CanvasFrame({ children, overlay }: { children: ReactNode; overlay?: ReactNode }) {
  return (
    <div className="canvas-wrap">
      {children}
      {overlay}
      <p className="drag-hint">Drag to orbit. Scroll to zoom.</p>
    </div>
  )
}

export function StageCard() {
  const view = useLab((s) => s.view)
  const forced = useLab((s) => s.steps[s.idx].view)
  const setView = useLab((s) => s.setView)
  const resetCam = useLab((s) => s.resetCam)
  const shown = forced ?? view
  return (
    <section className="stagecard">
      <CanvasFrame
        overlay={
          <>
            <ul className="legend" aria-label="Legend">
              <li><i style={{ background: '#6ff0c0' }} />head</li>
              <li><i style={{ background: '#ffd23f' }} />next</li>
              <li><i style={{ background: '#ff7a59' }} />prev</li>
              <li><i className="dash" />just cut</li>
            </ul>
            <div className="view-toggle">
              <button className={shown === 'track' ? 'on' : ''} onClick={() => setView('track')}>Track</button>
              <button className={shown === 'memory' ? 'on' : ''} onClick={() => setView('memory')}>Memory yard</button>
              <button onClick={resetCam} title="Reset camera">Recenter</button>
            </div>
          </>
        }
      >
        <Stage />
      </CanvasFrame>
      <Console />
    </section>
  )
}
