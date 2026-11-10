// The recorder: list algorithms run against a real pointer model, and every
// meaningful moment is captured as a full snapshot. The 3D stage only ever
// renders snapshots, which is what makes step-back and scrubbing exact.

export type Kind = 'singly' | 'doubly' | 'circular'
export type LinkKind = 'next' | 'prev' | 'entry'
export type Tone = 'info' | 'make' | 'link' | 'cut' | 'walk' | 'warn' | 'done'
export type View = 'track' | 'memory'

export interface NodeS {
  id: string
  value: string
  addr: string
  slot: number
  next: string | null
  prev: string | null
  lost?: boolean
  freed?: boolean
  dummy?: boolean
}

export interface Place {
  lane: number
  i: number
}

export interface Snap {
  kind: Kind
  nodes: Record<string, NodeS>
  place: Record<string, Place>
  entry: string | null
  entryLabel: string
  showEntry: boolean
  pointers: Record<string, string | null>
  hops: number
  writes: number
}

export interface Ghost {
  from: string
  to: string
  kind: LinkKind
}

export interface Step {
  snap: Snap
  algo?: string
  line?: string
  title: string
  train: string
  code: string
  tone: Tone
  hotNodes: string[]
  hotLinks: string[]
  ghosts: Ghost[]
  ledger?: { label: string; value: string }[]
  view?: View
}

export interface StepOpts {
  tone?: Tone
  nodes?: string[]
  ledger?: { label: string; value: string }[]
  view?: View
}

// A fixed shuffle of memory cells, so wagons land "anywhere" in the yard.
const CELLS = [17, 3, 22, 9, 14, 1, 20, 6, 11, 23, 4, 16, 8, 19, 0, 13, 21, 5, 10, 2, 18, 7, 15, 12]
let idCounter = 0

export const ENGINE_ID = '__engine'

export const emptySnap = (kind: Kind, entryLabel = kind === 'circular' ? 'TAIL' : 'HEAD'): Snap => ({
  kind,
  nodes: {},
  place: {},
  entry: null,
  entryLabel,
  showEntry: true,
  pointers: kind === 'doubly' ? { tail: null } : {},
  hops: 0,
  writes: 0,
})

export class Rec {
  s: Snap
  steps: Step[] = []
  private algo?: string
  private hot = new Set<string>()
  private ghosts: Ghost[] = []

  constructor(start: Snap) {
    this.s = structuredClone(start)
    this.s.hops = 0
    this.s.writes = 0
  }

  use(algo: string | undefined) {
    this.algo = algo
  }

  n(id: string) {
    return this.s.nodes[id]
  }

  /** Address as shown to the learner. */
  a(id: string | null | undefined) {
    return id ? this.s.nodes[id].addr : 'NULL'
  }

  /** Friendly wagon name for narration. */
  w(id: string | null | undefined) {
    return id ? `wagon ${this.s.nodes[id].value}` : 'NULL'
  }

  private freeSlot() {
    const used = new Set(Object.values(this.s.nodes).map((n) => n.slot))
    return CELLS.find((c) => !used.has(c)) ?? 0
  }

  make(value: string, place: Place, opts: { dummy?: boolean } = {}) {
    const id = `n${++idCounter}`
    const slot = this.freeSlot()
    this.s.nodes[id] = {
      id,
      value,
      slot,
      addr: '0x' + (0xa000 + slot * 0x20).toString(16).toUpperCase(),
      next: null,
      prev: null,
      dummy: opts.dummy,
    }
    this.s.place[id] = place
    return id
  }

  private write(from: string, kind: LinkKind, old: string | null, to: string | null) {
    if (old && old !== to) this.ghosts.push({ from, to: old, kind })
    this.hot.add(`${from}:${kind}`)
    this.s.writes++
  }

  setNext(a: string, b: string | null) {
    this.write(a, 'next', this.n(a).next, b)
    this.n(a).next = b
  }

  setPrev(a: string, b: string | null) {
    this.write(a, 'prev', this.n(a).prev, b)
    this.n(a).prev = b
  }

  setEntry(b: string | null) {
    this.write(ENGINE_ID, 'entry', this.s.entry, b)
    this.s.entry = b
  }

  ptr(name: string, id: string | null) {
    this.s.pointers[name] = id
  }

  /** Move a walking pointer and count the hop. */
  hop(name: string, id: string | null) {
    this.s.pointers[name] = id
    this.s.hops++
  }

  drop(...names: string[]) {
    for (const n of names) delete this.s.pointers[n]
  }

  place(id: string, lane: number, i: number) {
    this.s.place[id] = { lane, i }
  }

  row(ids: string[], lane = 0, start = 0) {
    ids.forEach((id, k) => (this.s.place[id] = { lane, i: start + k }))
  }

  free(id: string) {
    this.n(id).freed = true
  }

  /** Actually remove freed wagons so the next snapshot no longer holds them. */
  purge() {
    for (const n of Object.values(this.s.nodes)) {
      if (n.freed) {
        delete this.s.nodes[n.id]
        delete this.s.place[n.id]
      }
    }
  }

  /** Follow real pointers from any wagon until the end or back to the start. */
  chain(first: string | null): string[] {
    const out: string[] = []
    let c = first
    const limit = Object.keys(this.s.nodes).length
    while (c && out.length <= limit) {
      out.push(c)
      c = this.s.nodes[c].next
      if (c === first) break
    }
    return out
  }

  /** Logical order by following real pointers, from the front of the train. */
  order(): string[] {
    const { entry, kind, nodes, entryLabel } = this.s
    if (!entry) return []
    return this.chain(kind === 'circular' && entryLabel === 'TAIL' ? nodes[entry].next : entry)
  }

  step(line: string | undefined, title: string, train: string, code: string, opts: StepOpts = {}) {
    if (this.s.kind === 'circular' && this.s.entryLabel === 'TAIL') {
      this.s.pointers['tail.next'] = this.s.entry ? this.n(this.s.entry).next : null
    }
    this.steps.push({
      snap: structuredClone(this.s),
      algo: this.algo,
      line,
      title,
      train,
      code,
      tone: opts.tone ?? 'info',
      hotNodes: opts.nodes ?? [],
      hotLinks: [...this.hot],
      ghosts: this.ghosts,
      ledger: opts.ledger,
      view: opts.view,
    })
    this.hot = new Set()
    this.ghosts = []
  }
}
