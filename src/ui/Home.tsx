import { motion } from 'framer-motion'
import { lazy, Suspense } from 'react'
import { PROBLEMS } from '../data/problems'
import { TOURS } from '../engine/tours'
import { SEQ_LABS } from '../seq/defs'
import { LAB_SLUG } from './Pages'

const Hero = lazy(() => import('../stage/Hero').then((m) => ({ default: m.Hero })))

const CARDS = [
  {
    slug: LAB_SLUG,
    name: 'CSE-Linked-List-Express',
    blurb: 'Singly, doubly and circular linked lists, taught as a 3D train you can couple, uncouple and walk through.',
    accent: '#ffd23f',
    lessons: TOURS.length,
    problems: PROBLEMS.length,
  },
  ...SEQ_LABS.map((l) => ({
    slug: l.slug,
    name: l.name,
    blurb: l.blurb,
    accent: { array: '#f2a65a', stack: '#5ce0c6', queue: '#ff9933' }[l.engine.id] as string,
    lessons: l.tours.length,
    problems: l.problems.length,
  })),
]

export function Home() {
  return (
    <div className="home">
      <div className="home-top">
        <div className="home-scene">
          <Suspense fallback={null}>
            <Hero />
          </Suspense>
        </div>
        <motion.section className="home-copy" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="eyebrow">A Community Of Relativity</p>
          <h1>TheComputerScience&shy;Society</h1>
          <p className="lede">Data structures become obvious when you can stand next to them. Our labs turn algorithms into machines you can step through, rewind and break.</p>
        </motion.section>
      </div>
      <div className="lab-cards">
        {CARDS.map((c, i) => (
          <motion.a key={c.slug} className="lab-card" style={{ borderLeftColor: c.accent }} href={`#/${c.slug}/learn`} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 + i * 0.07 }}>
            <span className="platform">Platform {i + 1}</span>
            <h2>{c.name}</h2>
            <p>{c.blurb}</p>
            <span className="card-meta">{c.lessons} lessons · {c.problems} interview problems</span>
            <span className="board-cta">Enter the lab →</span>
          </motion.a>
        ))}
      </div>
    </div>
  )
}
