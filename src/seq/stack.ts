import { algo, type Algo } from '../engine/code'
import { SeqRec, makeSnap, type SeqSnap, type SeqStep } from './rec'

export const STACK_ALGOS: Record<string, Algo> = {
  push: algo('push', ['v'], `
if top == cap - 1: throw "overflow" @guard
top++ @top
a[top] = v @write`),
  pop: algo('pop', [], `
if top == -1: throw "underflow" @guard
int v = a[top] @read
top-- @top
return v @ret`, 'int'),
  peek: algo('peek', [], `
if top == -1: throw "underflow" @guard
return a[top] @read`, 'int'),
  isEmpty: algo('isEmpty', [], `
return top == -1 @check`, 'bool'),
  dig: algo('valueAtDepth', ['k'], `
up i from 0 to k: @loop
  tmp.push(pop()) @out
int v = peek() @read
up i from 0 to k: @loopBack
  push(tmp.pop()) @back
return v @ret`, 'int'),
}

export const STACK_CAP = 6
export const STACK_START = ['Rice', 'Dal', 'Curry']

export const stackStart = (_mode: string, values = STACK_START) => {
  const s = makeSnap('stack', [STACK_CAP], [...values, ...Array(STACK_CAP - values.length).fill(null)])
  s.pointers.top = { row: 0, i: values.length - 1 }
  return s
}

export const topOf = (s: SeqSnap, row = 0) => (s.pointers.top?.row === row ? s.pointers.top.i : s.rows[row].filter(Boolean).length - 1)

export function runStack(snap: SeqSnap, op: string, a: { value: string; pos: number }): SeqStep[] {
  const r = new SeqRec(snap)
  let top = snap.pointers.top!.i
  const v = a.value
  r.use(op)
  if (op === 'push') {
    if (top === STACK_CAP - 1) {
      r.step('guard', 'Overflow: the carrier is full', `All ${STACK_CAP} tins are on and the clamp cannot close over another.`, `top == cap - 1. Writing a[${STACK_CAP}] would go past the end of the array.`, { tone: 'warn', hot: [top] })
      r.done('Push refused: stack overflow', 'Pop a tin first, or use a bigger carrier.')
      return r.steps
    }
    const w = r.make(v, top + 1)
    r.step(undefined, `A tin of ${v} is ready`, 'It can only go on top. There is no way to slip it between two other tins.', `push(${v}) has exactly one place to write: just above top.`, { tone: 'make' })
    top++
    r.ptr('top', top)
    r.step('top', 'Raise the top marker', 'The marker moves up to the empty position.', `top++ makes top = ${top}.`, { tone: 'link', hot: [top] })
    r.place(w, top)
    r.step('write', `Lower the ${v} tin into place`, 'It settles on the tin below.', `a[${top}] = ${v}.`, { tone: 'make', hot: [top] })
    r.done('Pushed: O(1)', 'Nothing else moved, however tall the carrier is.')
  } else if (op === 'pop') {
    if (top === -1) {
      r.step('guard', 'Underflow: the carrier is empty', 'There is no tin to lift off.', 'top == -1. Reading a[-1] would be invalid.', { tone: 'warn' })
      r.done('Pop refused: stack underflow', 'Always check isEmpty before popping.')
      return r.steps
    }
    r.read(top)
    const val = r.v(top)
    r.step('read', `Look at the top tin: ${val}`, 'It is the last tin that went on, so it is the first to come off.', `v = a[${top}] = ${val}. We save the value before top changes.`, { tone: 'walk', hot: [top] })
    const id = r.lift(top)
    top--
    r.ptr('top', top)
    r.step('top', `Lift the ${val} tin off`, 'The marker drops to the tin beneath.', `top-- makes top = ${top}. The old value is still in memory, but it is no longer part of the stack.`, { tone: 'cut' })
    r.retire(id)
    r.step('ret', `Serve the ${val}`, 'The tin leaves the carrier.', `return ${val}.`, { tone: 'cut' })
    r.done('Popped: O(1)', 'Last in, first out.')
  } else if (op === 'peek') {
    if (top === -1) {
      r.step('guard', 'Underflow: the carrier is empty', 'Nothing to peek at.', 'top == -1.', { tone: 'warn' })
      r.done('Peek refused', 'An empty stack has no top.')
      return r.steps
    }
    r.read(top)
    r.step('read', `The top tin holds ${r.v(top)}`, 'Open the lid, look, and close it again.', `return a[${top}]. top does not change.`, { tone: 'walk', hot: [top] })
    r.done('Peeked: O(1)', 'Peek reads without removing.')
  } else if (op === 'isEmpty') {
    r.step('check', top === -1 ? 'Yes, it is empty' : `No, it holds ${top + 1} ${top === 0 ? 'tin' : 'tins'}`, 'A single glance at the marker is enough.', `top == -1 is ${top === -1}.`, { tone: 'walk' })
    r.done('Checked: O(1)', 'Run this before every pop.')
  } else if (op === 'dig') {
    const k = a.pos
    r.addRow(STACK_CAP)
    r.step(undefined, `Goal: the tin ${k} below the top`, 'The rules allow touching only the top, so we need a second carrier to set tins aside.', 'A stack has no a[i] in its interface. Reaching deeper costs pops.', { tone: 'warn' })
    let t2 = -1
    for (let i = 0; i < k; i++) {
      const id = r.at(top)!
      r.place(id, ++t2, 1)
      top--
      r.ptr('top', top)
      r.ptr('tmp', t2, 1)
      r.step('out', `Move ${r.val(id)} to the spare carrier`, 'One tin set aside, and the order is now reversed.', `tmp.push(pop()). top = ${top}.`, { tone: 'link', hot: [[1, t2]] })
    }
    r.read(top)
    r.step('read', `Reached it: ${r.v(top)}`, 'It is finally the top tin.', `peek() = ${r.v(top)}. That took ${k} pops.`, { tone: 'done', hot: [top] })
    for (let i = 0; i < k; i++) {
      const id = r.at(t2, 1)!
      top++
      r.place(id, top)
      t2--
      r.ptr('top', top)
      r.ptr('tmp', t2, 1)
      r.step('back', `Return ${r.val(id)} to the carrier`, 'Everything goes back in the original order.', `push(tmp.pop()). top = ${top}.`, { tone: 'link', hot: [top] })
    }
    r.drop('tmp')
    r.s.rows.pop()
    r.done(`Reached depth ${k}: O(k)`, 'If you often need the middle, a stack is the wrong structure.')
  }
  return r.steps
}
