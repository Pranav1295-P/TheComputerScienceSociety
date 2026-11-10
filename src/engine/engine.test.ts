import { describe, expect, it } from 'vitest'
import { ALGOS, buildSnap, listLength, run, type Op } from './ops'
import { printAlgo } from './code'
import { Rec, type Kind, type Snap } from './rec'
import { TOURS } from './tours'
import { TRACES } from './traces'

const values = (s: Snap) => new Rec(s).order().map((id) => s.nodes[id].value)

function expected(list: string[], op: Op, pos: number) {
  const a = [...list]
  if (op === 'insertBegin') a.unshift('X')
  if (op === 'insertEnd') a.push('X')
  if (op === 'insertAt') a.splice(pos, 0, 'X')
  if (op === 'deleteBegin') a.shift()
  if (op === 'deleteEnd') a.pop()
  if (op === 'deleteAt') a.splice(pos, 1)
  return a
}

function checkInvariants(s: Snap) {
  const ids = new Rec(s).order()
  expect(Object.keys(s.nodes).length).toBe(ids.length)
  if (s.kind === 'singly' && ids.length) expect(s.nodes[ids[ids.length - 1]].next).toBeNull()
  if (s.kind === 'doubly') {
    expect(s.pointers.tail ?? null).toBe(ids[ids.length - 1] ?? null)
    ids.forEach((id, i) => expect(s.nodes[id].prev).toBe(ids[i - 1] ?? null))
    if (ids.length) expect(s.nodes[ids[ids.length - 1]].next).toBeNull()
  }
  if (s.kind === 'circular' && ids.length) {
    expect(s.entry).toBe(ids[ids.length - 1])
    expect(s.nodes[s.entry!].next).toBe(ids[0])
  }
}

const KINDS: Kind[] = ['singly', 'doubly', 'circular']
const ALL: Op[] = ['traverse', 'insertBegin', 'insertEnd', 'insertAt', 'deleteBegin', 'deleteEnd', 'deleteAt']

describe('list operations end in the correct state', () => {
  for (const kind of KINDS) {
    for (let n = 0; n <= 5; n++) {
      const list = ['1', '2', '3', '4', '5'].slice(0, n)
      for (const op of ['traverse', 'insertBegin', 'insertEnd', 'deleteBegin', 'deleteEnd'] as Op[]) {
        it(`${kind} n=${n} ${op}`, () => {
          const steps = run(buildSnap(kind, list), op, 'X', 0)
          const end = steps[steps.length - 1].snap
          expect(values(end)).toEqual(expected(list, op, 0))
          checkInvariants(end)
        })
      }
      for (let pos = 0; pos <= n; pos++) {
        it(`${kind} n=${n} insertAt ${pos}`, () => {
          const steps = run(buildSnap(kind, list), 'insertAt', 'X', pos)
          const end = steps[steps.length - 1].snap
          expect(values(end)).toEqual(expected(list, 'insertAt', pos))
          checkInvariants(end)
        })
      }
      for (let pos = 0; pos < n; pos++) {
        it(`${kind} n=${n} deleteAt ${pos}`, () => {
          const steps = run(buildSnap(kind, list), 'deleteAt', 'X', pos)
          const end = steps[steps.length - 1].snap
          expect(values(end)).toEqual(expected(list, 'deleteAt', pos))
          checkInvariants(end)
        })
      }
    }
  }
})

describe('every highlighted step exists in the printed code', () => {
  for (const kind of KINDS) {
    for (const op of ALL) {
      it(`${kind} ${op}`, () => {
        for (let n = 0; n <= 4; n++) {
          if (op === 'deleteAt' && n === 0) continue
          const list = ['1', '2', '3', '4'].slice(0, n)
          const maxPos = op === 'insertAt' ? n : Math.max(n - 1, 0)
          for (let pos = 0; pos <= maxPos; pos++) {
            for (const s of run(buildSnap(kind, list), op, 'X', pos)) {
              if (!s.line) continue
              const tags = ALGOS[s.algo!].body.map((b) => b.tag)
              expect(tags, `${s.algo} missing @${s.line}`).toContain(s.line)
            }
          }
        }
      })
    }
  }
})

describe('code printing balances', () => {
  for (const [name, a] of Object.entries(ALGOS)) {
    it(name, () => {
      for (const lang of ['cpp', 'java'] as const) {
        const text = printAlgo(a, lang).map((l) => l.text).join('\n')
        expect((text.match(/{/g) ?? []).length).toBe((text.match(/}/g) ?? []).length)
      }
    })
  }
})

describe('content builds', () => {
  it('list length helper', () => expect(listLength(buildSnap('circular', ['a', 'b']))).toBe(2))
  for (const t of TOURS) it(`tour ${t.id}`, () => expect(t.build().length).toBeGreaterThan(2))
  for (const [id, b] of Object.entries(TRACES)) it(`trace ${id}`, () => expect(b!().length).toBeGreaterThan(2))
})

const finalValues = (id: number) => {
  const steps = TRACES[id]!()
  const s = steps[steps.length - 1].snap
  return new Rec(s).order().map((k) => s.nodes[k].value)
}

describe('problem traces reach the right answer', () => {
  it('206 reverses', () => expect(finalValues(206)).toEqual(['5', '4', '3', '2', '1']))
  it('21 merges', () => expect(finalValues(21)).toEqual(['1', '1', '2', '3', '4', '4']))
  it('83 dedupes', () => expect(finalValues(83)).toEqual(['1', '2', '3']))
  it('19 removes', () => expect(finalValues(19)).toEqual(['1', '2', '3', '5']))
  it('24 swaps', () => expect(finalValues(24)).toEqual(['2', '1', '4', '3']))
  it('61 rotates', () => expect(finalValues(61)).toEqual(['4', '5', '1', '2', '3']))
})
