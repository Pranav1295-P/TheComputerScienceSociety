import { create } from 'zustand'
import type { Lang } from './engine/code'
import { buildSnap, listLength, run, type Op } from './engine/ops'
import type { Kind, Snap, Step, View } from './engine/rec'

const START = ['12', '7', '25', '40', '9']
export const MAX_WAGONS = 9

const idle = (snap: Snap): Step => ({
  snap,
  title: 'Train is in the yard',
  train: 'Choose an operation on the left and watch how the couplings change.',
  code: 'Every step shows the exact line running and the pointers it touches.',
  tone: 'info',
  hotNodes: [],
  hotLinks: [],
  ghosts: [],
})

const freshBases = (): Record<Kind, Snap> => ({
  singly: buildSnap('singly', START),
  doubly: buildSnap('doubly', START),
  circular: buildSnap('circular', START),
})

interface LabState {
  steps: Step[]
  idx: number
  playing: boolean
  speed: number
  view: View
  lang: Lang
  quiz: boolean
  quizFor: number | null
  answered: number[]
  camNonce: number
  kind: Kind
  bases: Record<Kind, Snap>
  load: (steps: Step[], autoplay?: boolean) => void
  goto: (i: number) => void
  next: () => void
  prev: () => void
  toggle: () => void
  setSpeed: (s: number) => void
  setView: (v: View) => void
  setLang: (l: Lang) => void
  setQuiz: (q: boolean) => void
  resolveQuiz: () => void
  resetCam: () => void
  setKind: (k: Kind) => void
  runOp: (op: Op, value: string, pos: number) => void
  resetList: (values?: string[]) => void
  showSim: () => void
}

const needsQuiz = (s: LabState, target: number) => {
  const st = s.steps[target]
  return (
    s.quiz && !!st?.line && !!st.algo &&
    (st.tone === 'link' || st.tone === 'cut' || st.tone === 'make') &&
    !s.answered.includes(target)
  )
}

export const useLab = create<LabState>((set, get) => {
  const bases = freshBases()
  return {
    steps: [idle(bases.singly)],
    idx: 0,
    playing: false,
    speed: 1,
    view: 'track',
    lang: 'cpp',
    quiz: false,
    quizFor: null,
    answered: [],
    camNonce: 0,
    kind: 'singly',
    bases,
    load: (steps, autoplay = false) => set({ steps, idx: 0, playing: autoplay, quizFor: null, answered: [] }),
    goto: (i) => set((s) => ({ idx: Math.max(0, Math.min(s.steps.length - 1, i)), quizFor: null })),
    next: () => {
      const s = get()
      if (s.idx >= s.steps.length - 1) return set({ playing: false })
      if (needsQuiz(s, s.idx + 1)) return set({ quizFor: s.idx + 1, playing: false })
      set({ idx: s.idx + 1, quizFor: null, playing: s.playing && s.idx + 2 < s.steps.length })
    },
    prev: () => set((s) => ({ idx: Math.max(0, s.idx - 1), quizFor: null, playing: false })),
    toggle: () => {
      const s = get()
      if (s.idx >= s.steps.length - 1 && !s.playing) return set({ idx: 0, playing: true, answered: [] })
      set({ playing: !s.playing })
    },
    setSpeed: (speed) => set({ speed }),
    setView: (view) => set({ view }),
    setLang: (lang) => set({ lang }),
    setQuiz: (quiz) => set({ quiz, quizFor: null }),
    resolveQuiz: () =>
      set((s) => (s.quizFor === null ? s : { idx: s.quizFor, quizFor: null, answered: [...s.answered, s.quizFor] })),
    resetCam: () => set((s) => ({ camNonce: s.camNonce + 1 })),
    setKind: (kind) => {
      set({ kind })
      get().showSim()
    },
    showSim: () => {
      const { bases, kind } = get()
      set({ steps: [idle(bases[kind])], idx: 0, playing: false, quizFor: null, answered: [] })
    },
    runOp: (op, value, pos) => {
      const { bases, kind, load } = get()
      const steps = run(bases[kind], op, value, pos)
      const end = steps[steps.length - 1].snap
      set({ bases: { ...bases, [kind]: { ...end, hops: 0, writes: 0 } } })
      load(steps, !get().quiz)
      if (get().quiz) set({ playing: false })
    },
    resetList: (values = START) => {
      const { bases, kind } = get()
      set({ bases: { ...bases, [kind]: buildSnap(kind, values) } })
      get().showSim()
    },
  }
})

export const currentSize = () => {
  const { bases, kind } = useLab.getState()
  return listLength(bases[kind])
}
