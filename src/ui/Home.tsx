import { motion } from 'framer-motion'
import { lazy, Suspense } from 'react'
import { PROBLEMS } from '../data/problems'
import { TOURS } from '../engine/tours'
import { LAB_SLUG } from './Pages'

const Hero = lazy(() => import('../stage/Hero').then((m) => ({ default: m.Hero })))

export function Home() {
  const stops = [
    { n: TOURS.length, label: 'guided lessons', href: 'learn' },
    { n: 21, label: 'simulated operations', href: 'simulator' },
    { n: PROBLEMS.length, label: 'interview problems', href: 'practice' },
  ]
  return (
    <div className="home">
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
      <motion.a className="lab-card" href={`#/${LAB_SLUG}/learn`} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
        <span className="platform">Platform 1</span>
        <h2>CSE-Linked-List-Express</h2>
        <p>Singly, doubly and circular linked lists, taught as a 3D train you can couple, uncouple and walk through.</p>
        <span className="board-cta">Board the Express →</span>
      </motion.a>
      <ul className="stops">
        {stops.map((s) => (
          <li key={s.href}>
            <a href={`#/${LAB_SLUG}/${s.href}`}>
              <b>{s.n}</b>
              <span>{s.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
