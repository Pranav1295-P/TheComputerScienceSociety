import { createContext, useContext } from 'react'
import type { Algo } from '../engine/code'
import { ALGOS } from '../engine/ops'
import type { Tone } from '../engine/rec'
import { useLab } from '../store'

/** What every lab's steps have in common, whatever its 3D world looks like. */
export interface BaseStep {
  algo?: string
  line?: string
  title: string
  train: string
  code: string
  tone: Tone
  ledger?: { label: string; value: string }[]
}

export interface PlayerState {
  steps: BaseStep[]
  idx: number
  playing: boolean
  speed: number
  quizFor: number | null
  next: () => void
  prev: () => void
  goto: (i: number) => void
  toggle: () => void
  setSpeed: (s: number) => void
  resolveQuiz: () => void
}

export interface PlayerApi {
  useStore: <T>(sel: (s: PlayerState) => T) => T
  getState: () => PlayerState
  algos: Record<string, Algo>
  worldLabel: string
  codeNote: string
  tones: Record<Tone, string>
}

export const linkedListApi: PlayerApi = {
  useStore: useLab as unknown as PlayerApi['useStore'],
  getState: () => useLab.getState() as unknown as PlayerState,
  algos: ALGOS,
  worldLabel: 'On the track',
  codeNote: 'head and tail are fields of the list, shown bare for readability.',
  tones: { info: 'Station note', make: 'New wagon', link: 'Coupling', cut: 'Uncoupling', walk: 'Inspector', warn: 'Caution', done: 'Arrived' },
}

export const PlayerCtx = createContext<PlayerApi>(linkedListApi)
export const usePlayerApi = () => useContext(PlayerCtx)
