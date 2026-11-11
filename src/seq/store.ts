import { create } from 'zustand'
import type { PlayerState } from '../ui/player'
import type { SeqSnap, SeqStep } from './rec'

export interface OpArgs {
  value: string
  pos: number
  tier: number
}

/** The parts of a lab definition the store needs to run simulations. */
export interface SeqEngine {
  id: string
  defaultMode: string
  start: (mode: string, values?: string[]) => SeqSnap
  run: (snap: SeqSnap, op: string, args: OpArgs) => SeqStep[]
  idle: { title: string; world: string; code: string }
}

interface SeqState extends PlayerState {
  steps: SeqStep[]
  quiz: boolean
  answered: number[]
  camNonce: number
  engine: SeqEngine | null
  mode: string
  bases: Record<string, SeqSnap>
  setEngine: (e: SeqEngine) => void
  load: (steps: SeqStep[], autoplay?: boolean) => void
  setMode: (m: string) => void
  setQuiz: (q: boolean) => void
  resetCam: () => void
  showSim: () => void
  runOp: (op: string, args: OpArgs) => void
  resetList: (values?: string[]) => void
  base: () => SeqSnap
}

const emptySnap: SeqSnap = { mode: '', rows: [[]], items: {}, pointers: {}, reads: 0, writes: 0 }
const blank = (snap: SeqSnap, e?: SeqEngine | null): SeqStep => ({
  snap,
  hot: [],
  title: e?.idle.title ?? '',
  train: e?.idle.world ?? '',
  code: e?.idle.code ?? '',
  tone: 'info',
})

export const useSeq = create<SeqState>((set, get) => ({
  steps: [blank(emptySnap)],
  idx: 0,
  playing: false,
  speed: 1,
  quizFor: null,
  quiz: false,
  answered: [],
  camNonce: 0,
  engine: null,
  mode: '',
  bases: {},
  setEngine: (engine) => {
    set({ engine, mode: engine.defaultMode, bases: {}, quiz: false })
    get().showSim()
  },
  base: () => {
    const { bases, mode, engine } = get()
    const key = `${engine!.id}:${mode}`
    if (!bases[key]) {
      const snap = engine!.start(mode)
      set({ bases: { ...bases, [key]: snap } })
      return snap
    }
    return bases[key]
  },
  load: (steps, autoplay = false) => set({ steps, idx: 0, playing: autoplay, quizFor: null, answered: [] }),
  goto: (i) => set((s) => ({ idx: Math.max(0, Math.min(s.steps.length - 1, i)), quizFor: null })),
  next: () => {
    const s = get()
    if (s.idx >= s.steps.length - 1) return set({ playing: false })
    const t = s.steps[s.idx + 1]
    if (s.quiz && t.line && t.algo && (t.tone === 'link' || t.tone === 'cut' || t.tone === 'make') && !s.answered.includes(s.idx + 1)) {
      return set({ quizFor: s.idx + 1, playing: false })
    }
    set({ idx: s.idx + 1, quizFor: null, playing: s.playing && s.idx + 2 < s.steps.length })
  },
  prev: () => set((s) => ({ idx: Math.max(0, s.idx - 1), quizFor: null, playing: false })),
  toggle: () => {
    const s = get()
    if (s.idx >= s.steps.length - 1 && !s.playing) return set({ idx: 0, playing: s.steps.length > 1, answered: [] })
    set({ playing: !s.playing })
  },
  setSpeed: (speed) => set({ speed }),
  setQuiz: (quiz) => set({ quiz, quizFor: null }),
  resolveQuiz: () => set((s) => (s.quizFor === null ? s : { idx: s.quizFor, quizFor: null, answered: [...s.answered, s.quizFor] })),
  resetCam: () => set((s) => ({ camNonce: s.camNonce + 1 })),
  setMode: (mode) => {
    set({ mode })
    get().showSim()
  },
  showSim: () => {
    const { engine, base, load } = get()
    if (engine) load([blank(base(), engine)])
  },
  runOp: (op, args) => {
    const { engine, mode, bases, base, load, quiz } = get()
    const steps = engine!.run(base(), op, args)
    const end = steps[steps.length - 1].snap
    set({ bases: { ...get().bases, ...bases, [`${engine!.id}:${mode}`]: { ...end, reads: 0, writes: 0 } } })
    load(steps, !quiz)
  },
  resetList: (values) => {
    const { engine, mode, bases } = get()
    set({ bases: { ...bases, [`${engine!.id}:${mode}`]: engine!.start(mode, values) } })
    get().showSim()
  },
}))
