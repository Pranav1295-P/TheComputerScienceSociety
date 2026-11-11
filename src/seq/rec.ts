// Recorder for slot-based structures: arrays, stacks and queues.
// Same idea as the linked list recorder: run the real algorithm, snapshot every moment.
import type { Tone } from '../engine/rec'
import type { BaseStep } from '../ui/player'

export type Loc =
  | { k: 'slot'; row: number; i: number }
  | { k: 'hand'; near: number; row: number }
  | { k: 'gone' }

export interface SItem {
  id: string
  value: string
  hue: number
  loc: Loc
  tier?: number
}

export interface PtrAt {
  row: number
  i: number
}

export interface SeqSnap {
  mode: string
  rows: (string | null)[][]
  items: Record<string, SItem>
  pointers: Record<string, PtrAt | null>
  reads: number
  writes: number
}

export interface SeqStep extends BaseStep {
  snap: SeqSnap
  hot: string[]
}

let idCounter = 0
const nextId = () => `s${++idCounter}`

export function makeSnap(mode: string, caps: number[], values: (string | null)[] = []): SeqSnap {
  const s: SeqSnap = { mode, rows: caps.map((c) => Array(c).fill(null)), items: {}, pointers: {}, reads: 0, writes: 0 }
  values.forEach((value, i) => {
    if (value === null) return
    const id = nextId()
    s.items[id] = { id, value, hue: idCounter, loc: { k: 'slot', row: 0, i } }
    s.rows[0][i] = id
  })
  return s
}

export interface SOpts {
  tone?: Tone
  hot?: (number | [number, number])[]
  ledger?: { label: string; value: string }[]
}

export class SeqRec {
  s: SeqSnap
  steps: SeqStep[] = []
  private algo?: string

  constructor(start: SeqSnap) {
    this.s = structuredClone(start)
    this.s.reads = 0
    this.s.writes = 0
    this.purge()
  }

  use(a: string | undefined) {
    this.algo = a
  }

  purge() {
    for (const it of Object.values(this.s.items)) if (it.loc.k === 'gone') delete this.s.items[it.id]
  }

  at(i: number, row = 0) {
    return this.s.rows[row][i]
  }

  v(i: number, row = 0) {
    const id = this.at(i, row)
    return id ? this.s.items[id].value : '—'
  }

  val(id: string) {
    return this.s.items[id].value
  }

  cap(row = 0) {
    return this.s.rows[row].length
  }

  /** Contiguous item count from slot 0. */
  size(row = 0) {
    return this.s.rows[row].filter(Boolean).length
  }

  read(i: number, row = 0) {
    this.s.reads++
    return this.at(i, row)
  }

  make(value: string, near: number, opts: { tier?: number; row?: number } = {}) {
    const id = nextId()
    this.s.items[id] = { id, value, hue: idCounter, tier: opts.tier, loc: { k: 'hand', near, row: opts.row ?? 0 } }
    return id
  }

  private clear(id: string) {
    const l = this.s.items[id].loc
    if (l.k === 'slot') this.s.rows[l.row][l.i] = null
  }

  place(id: string, i: number, row = 0) {
    this.clear(id)
    this.s.rows[row][i] = id
    this.s.items[id].loc = { k: 'slot', row, i }
    this.s.writes++
  }

  /** Take an item out of a slot and hold it near that slot. */
  lift(i: number, row = 0) {
    const id = this.s.rows[row][i]!
    this.clear(id)
    this.s.items[id].loc = { k: 'hand', near: i, row }
    return id
  }

  shift(from: number, to: number, row = 0) {
    this.place(this.s.rows[row][from]!, to, row)
  }

  retire(id: string) {
    this.clear(id)
    this.s.items[id].loc = { k: 'gone' }
  }

  addRow(cap: number) {
    this.s.rows.push(Array(cap).fill(null))
  }

  /** Throw away row 0 and let row 1 take its place. */
  promote() {
    this.s.rows.shift()
    for (const it of Object.values(this.s.items)) if (it.loc.k === 'slot') it.loc.row -= 1
  }

  ptr(name: string, i: number, row = 0) {
    this.s.pointers[name] = { i, row }
  }

  drop(...names: string[]) {
    for (const n of names) delete this.s.pointers[n]
  }

  step(line: string | undefined, title: string, world: string, code: string, opts: SOpts = {}) {
    this.steps.push({
      snap: structuredClone(this.s),
      algo: this.algo,
      line,
      title,
      train: world,
      code,
      tone: opts.tone ?? 'info',
      hot: (opts.hot ?? []).map((h) => (Array.isArray(h) ? `${h[0]}:${h[1]}` : `0:${h}`)),
      ledger: opts.ledger,
    })
    // A retired item shows its exit in exactly one snapshot, then it is gone.
    this.purge()
  }

  done(headline: string, world: string, drop: string[] = []) {
    const { reads, writes } = this.s
    this.drop(...drop)
    this.purge()
    this.step(undefined, headline, world, `Cost of this run: ${reads} ${reads === 1 ? 'read' : 'reads'}, ${writes} ${writes === 1 ? 'write' : 'writes'}.`, { tone: 'done' })
  }
}
