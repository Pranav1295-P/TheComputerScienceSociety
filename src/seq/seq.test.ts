import { describe, expect, it } from 'vitest'
import { printAlgo } from '../engine/code'
import { ARRAY_ALGOS, arrayStart, runArray } from './array'
import { ARRAY_TOURS, ARRAY_TRACES, QUEUE_TOURS, QUEUE_TRACES, STACK_TOURS, STACK_TRACES, t239Result, t739Answer } from './lessons'
import { QUEUE_ALGOS, QUEUE_CAP, queueStart, runQueue } from './queue'
import type { SeqSnap, SeqStep } from './rec'
import { STACK_ALGOS, STACK_CAP, runStack, stackStart } from './stack'

const row = (s: SeqSnap) => s.rows[0].map((id) => (id ? s.items[id].value : null))
const list = (s: SeqSnap) => row(s).filter((v) => v !== null)
const end = (st: SeqStep[]) => st[st.length - 1].snap
const noGone = (s: SeqSnap) => expect(Object.values(s.items).every((i) => i.loc.k !== 'gone')).toBe(true)
const consistent = (s: SeqSnap) => {
  s.rows.forEach((r, ri) => r.forEach((id, i) => id && expect(s.items[id].loc).toEqual({ k: 'slot', row: ri, i })))
  expect(Object.keys(s.items).length).toBe(s.rows.flat().filter(Boolean).length)
}
const tagsOk = (steps: SeqStep[], algos: Record<string, ReturnType<typeof Object>>) => {
  for (const s of steps) if (s.line) expect(algos[s.algo!].body.map((b: { tag?: string }) => b.tag), `${s.algo} @${s.line}`).toContain(s.line)
}

describe('array', () => {
  const vals = ['1', '2', '3', '4', '5', '6', '7']
  for (let n = 0; n <= 7; n++) {
    const base = vals.slice(0, n)
    const go = (op: string, pos: number, v = 'X') => {
      const st = runArray(arrayStart('', base), op, { value: v, pos })
      tagsOk(st, ARRAY_ALGOS)
      noGone(end(st))
      consistent(end(st))
      return list(end(st))
    }
    it(`n=${n} begin and end`, () => {
      expect(go('insertBegin', 0)).toEqual(['X', ...base])
      expect(go('insertEnd', 0)).toEqual([...base, 'X'])
      expect(go('deleteBegin', 0)).toEqual(base.slice(1))
      expect(go('deleteEnd', n - 1)).toEqual(base.slice(0, Math.max(n - 1, 0)))
    })
    it(`n=${n} positions`, () => {
      for (let p = 0; p <= n; p++) expect(go('insertAt', p)).toEqual([...base.slice(0, p), 'X', ...base.slice(p)])
      for (let p = 0; p < n; p++) {
        expect(go('deleteAt', p)).toEqual([...base.slice(0, p), ...base.slice(p + 1)])
        expect(go('update', p)).toEqual(base.map((v, i) => (i === p ? 'X' : v)))
        expect(go('access', p)).toEqual(base)
      }
    })
    it(`n=${n} search`, () => {
      expect(go('traverse', 0)).toEqual(base)
      for (const x of [...base, '99']) {
        expect(go('linear', 0, x)).toEqual(base)
        const st = runArray(arrayStart('', base), 'binary', { value: x, pos: 0 })
        tagsOk(st, ARRAY_ALGOS)
        const hit = st.some((s) => s.line === 'hit')
        expect(hit).toBe(base.includes(x))
      }
    })
  }
  it('grows when full', () => {
    const st = runArray(arrayStart('', ['1', '2', '3', '4', '5', '6']), 'insertEnd', { value: 'X', pos: 6 })
    expect(end(st).rows[0].length).toBe(12)
    expect(end(st).rows.length).toBe(1)
    expect(list(end(st))).toEqual(['1', '2', '3', '4', '5', '6', 'X'])
  })
})

describe('stack', () => {
  it('matches a model across random operations', () => {
    let s = stackStart('', [])
    const model: string[] = []
    for (let k = 0; k < 400; k++) {
      const op = ['push', 'pop', 'peek', 'isEmpty', 'dig'][k * 7 % 5]
      const pos = model.length ? k % model.length : 0
      if (op === 'dig' && !model.length) continue
      const st = runStack(s, op, { value: `v${k}`, pos })
      tagsOk(st, STACK_ALGOS)
      s = end(st)
      if (op === 'push' && model.length < STACK_CAP) model.push(`v${k}`)
      if (op === 'pop') model.pop()
      expect(list(s)).toEqual(model)
      expect(s.pointers.top!.i).toBe(model.length - 1)
      expect(s.rows.length).toBe(1)
      consistent(s)
    }
  })
})

describe('queue', () => {
  const order = (s: SeqSnap) => {
    const out: string[] = []
    const c = s.rows[0].filter(Boolean).length
    if (!c) return out
    for (let k = 0; k < c; k++) out.push(s.items[s.rows[0][(s.pointers.front!.i + k) % QUEUE_CAP]!].value)
    return out
  }
  for (const mode of ['circular', 'deque']) {
    it(`${mode} matches a model`, () => {
      let s = queueStart(mode)
      const model = ['T101', 'T102', 'T103', 'T104']
      const ops = mode === 'circular' ? ['enqueue', 'dequeue', 'enqueue', 'enqueue', 'peek', 'dequeue'] : ['pushBack', 'popFront', 'pushFront', 'popBack', 'pushFront', 'pushBack', 'popBack']
      for (let k = 0; k < 400; k++) {
        const op = ops[(k * k + k) % ops.length]
        const st = runQueue(s, op, { value: `t${k}`, tier: 3 })
        tagsOk(st, QUEUE_ALGOS)
        s = end(st)
        const full = model.length === QUEUE_CAP
        if ((op === 'enqueue' || op === 'pushBack') && !full) model.push(`t${k}`)
        if (op === 'pushFront' && !full) model.unshift(`t${k}`)
        if (op === 'dequeue' || op === 'popFront') model.shift()
        if (op === 'popBack') model.pop()
        expect(order(s)).toEqual(model)
        consistent(s)
      }
    })
  }
  it('linear front and rear, false full and compact', () => {
    let s = queueStart('linear')
    for (let k = 0; k < 3; k++) s = end(runQueue(s, 'dequeue', { value: '', tier: 3 }))
    for (let k = 0; k < 4; k++) s = end(runQueue(s, 'enqueue', { value: `x${k}`, tier: 3 }))
    expect(s.pointers.front!.i).toBe(3)
    expect(s.pointers.rear!.i).toBe(8)
    const refused = runQueue(s, 'enqueue', { value: 'no', tier: 3 })
    expect(list(end(refused)).length).toBe(5)
    const c = end(runQueue(s, 'compact', { value: '', tier: 3 }))
    expect(row(c).slice(0, 5)).toEqual(['T104', 'x0', 'x1', 'x2', 'x3'])
    expect(c.pointers.front!.i).toBe(0)
    expect(c.pointers.rear!.i).toBe(5)
    consistent(c)
  })
  it('priority keeps rank order and FIFO inside a rank', () => {
    let s = queueStart('priority')
    s = end(runQueue(s, 'enqueue', { value: 'A', tier: 1 }))
    s = end(runQueue(s, 'enqueue', { value: 'B', tier: 2 }))
    s = end(runQueue(s, 'enqueue', { value: 'C', tier: 3 }))
    expect(list(s)).toEqual(['T101', 'A', 'T102', 'B', 'T103', 'T104', 'C'])
    s = end(runQueue(s, 'dequeue', { value: '', tier: 3 }))
    expect(list(s)[0]).toBe('A')
    consistent(s)
  })
})

describe('content', () => {
  for (const t of [...ARRAY_TOURS, ...STACK_TOURS, ...QUEUE_TOURS]) it(`tour ${t.id}`, () => expect(t.build().length).toBeGreaterThan(3))
  for (const m of [ARRAY_TRACES, STACK_TRACES, QUEUE_TRACES]) for (const [n, b] of Object.entries(m)) it(`trace ${n}`, () => expect(b!().length).toBeGreaterThan(3))
  it('283 moves zeroes', () => {
    const st = ARRAY_TRACES[283]!()
    expect(list(end(st))).toEqual(['1', '3', '12', '0', '0'])
  })
  it('739 answer', () => expect(t739Answer()).toEqual([1, 1, 4, 2, 1, 1, 0, 0]))
  it('239 answer', () => expect(t239Result()).toEqual([3, 3, 5, 5, 6, 7]))
  it('code prints balanced', () => {
    for (const a of Object.values({ ...ARRAY_ALGOS, ...STACK_ALGOS, ...QUEUE_ALGOS })) {
      for (const lang of ['cpp', 'java'] as const) {
        const text = printAlgo(a, lang).map((l) => l.text).join('\n')
        expect((text.match(/{/g) ?? []).length).toBe((text.match(/}/g) ?? []).length)
      }
    }
  })
})
