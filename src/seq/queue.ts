import { algo, type Algo } from '../engine/code'
import { SeqRec, makeSnap, type SeqSnap, type SeqStep } from './rec'

export const QUEUE_ALGOS: Record<string, Algo> = {
  'linear.enqueue': algo('enqueue', ['v'], `
if rear == cap: throw "full" @guard
a[rear] = v @write
rear++ @rear`),
  'linear.dequeue': algo('dequeue', [], `
if front == rear: throw "empty" @guard
int v = a[front] @read
front++ @front
return v @ret`, 'int'),
  'linear.peek': algo('peek', [], `
if front == rear: throw "empty" @guard
return a[front] @read`, 'int'),
  'linear.compact': algo('compact', [], `
int n = rear - front @n
up i from 0 to n: @loop
  a[i] = a[front + i] @shift
front = 0 @front
rear = n @rear`),
  'circular.enqueue': algo('enqueue', ['v'], `
if count == cap: throw "full" @guard
a[rear] = v @write
rear = (rear + 1) % cap @rear
count++ @count`),
  'circular.dequeue': algo('dequeue', [], `
if count == 0: throw "empty" @guard
int v = a[front] @read
front = (front + 1) % cap @front
count-- @count
return v @ret`, 'int'),
  'circular.peek': algo('peek', [], `
if count == 0: throw "empty" @guard
return a[front] @read`, 'int'),
  'deque.pushFront': algo('pushFront', ['v'], `
if count == cap: throw "full" @guard
front = (front - 1 + cap) % cap @front
a[front] = v @write
count++ @count`),
  'deque.pushBack': algo('pushBack', ['v'], `
if count == cap: throw "full" @guard
a[rear] = v @write
rear = (rear + 1) % cap @rear
count++ @count`),
  'deque.popFront': algo('popFront', [], `
if count == 0: throw "empty" @guard
int v = a[front] @read
front = (front + 1) % cap @front
count-- @count
return v @ret`, 'int'),
  'deque.popBack': algo('popBack', [], `
if count == 0: throw "empty" @guard
rear = (rear - 1 + cap) % cap @rear
int v = a[rear] @read
count-- @count
return v @ret`, 'int'),
  'priority.enqueue': algo('enqueue', ['v', 'p'], `
if n == cap: throw "full" @guard
int i = n @init
while i > 0 and rank[i - 1] > p: @loop
  a[i] = a[i - 1] @shift
  i-- @step
a[i] = v @write
n++ @n`),
  'priority.dequeue': algo('dequeue', [], `
if n == 0: throw "empty" @guard
int v = a[0] @read
up i from 0 to n - 1: @loop
  a[i] = a[i + 1] @shift
n-- @n
return v @ret`, 'int'),
  'priority.peek': algo('peek', [], `
if n == 0: throw "empty" @guard
return a[0] @read`, 'int'),
}

export const QUEUE_CAP = 8
export const TIERS = ['', 'Senior citizen', 'Special entry', 'Sarva darshan']

const queuedFrom = (start: number, values: string[]) => {
  const out: (string | null)[] = Array(QUEUE_CAP).fill(null)
  values.forEach((v, k) => (out[(start + k) % QUEUE_CAP] = v))
  return out
}

export function queueStart(mode: string): SeqSnap {
  const s = makeSnap(mode, [QUEUE_CAP], queuedFrom(0, ['T101', 'T102', 'T103', 'T104']))
  if (mode === 'priority') {
    ;[1, 2, 3, 3].forEach((tier, i) => (s.items[s.rows[0][i]!].tier = tier))
    s.pointers.front = { row: 0, i: 0 }
  } else {
    s.pointers.front = { row: 0, i: 0 }
    s.pointers.rear = { row: 0, i: 4 }
  }
  return s
}

export const waiting = (s: SeqSnap) => s.rows[0].filter(Boolean).length

const count = (r: SeqRec) => [{ label: 'waiting', value: String(r.size()) }]

function refuse(r: SeqRec, full: boolean, extra?: string) {
  r.step(
    'guard',
    full ? 'The hall is full' : 'The hall is empty',
    full ? extra ?? `All ${QUEUE_CAP} places are taken. The next devotee must wait outside until someone moves on.` : 'No one is waiting, so nobody can go for darshan.',
    full ? 'Overflow: the write is refused.' : 'Underflow: reading now would return stale data.',
    { tone: 'warn' },
  )
  r.done(full ? 'Enqueue refused' : 'Dequeue refused', full ? 'Bounded queues must handle being full.' : 'Check for empty before dequeuing.')
}

function ringStep(i: number, by: number) {
  return (i + by + QUEUE_CAP) % QUEUE_CAP
}

function ringEnqueueBack(r: SeqRec, v: string) {
  const rear = r.s.pointers.rear!.i
  const n = r.size()
  if (n === QUEUE_CAP) return refuse(r, true)
  const w = r.make(v, rear)
  r.step(undefined, `Devotee ${v} arrives`, `They join behind everyone else, at compartment ${rear}.`, `enqueue(${v}) writes at index rear = ${rear}.`, { tone: 'make' })
  r.place(w, rear)
  r.step('write', `${v} takes compartment ${rear}`, 'Nobody else moved.', `a[${rear}] = ${v}.`, { tone: 'make', hot: [rear] })
  const nr = ringStep(rear, 1)
  r.ptr('rear', nr)
  r.step('rear', 'Move the rear marker', nr < rear ? `Compartment ${QUEUE_CAP - 1} is the last, so the marker wraps round to compartment 0.` : 'The marker moves to the next free compartment.', `rear = (${rear} + 1) % ${QUEUE_CAP} = ${nr}.${nr < rear ? ' The modulo is what makes the buffer circular.' : ''}`, { tone: 'link', ledger: count(r) })
  r.step('count', `${n + 1} now waiting`, 'The counter at the hall door goes up.', `count = ${n + 1}. When front == rear, count tells full and empty apart.`, { ledger: count(r) })
  r.done('Enqueued: O(1)', 'Joining the queue costs the same however long it is.')
}

function ringDequeueFront(r: SeqRec) {
  const front = r.s.pointers.front!.i
  const n = r.size()
  if (n === 0) return refuse(r, false)
  r.read(front)
  const val = r.v(front)
  r.step('read', `${val} is next for darshan`, 'First to arrive, first to go in.', `v = a[${front}] = ${val}.`, { tone: 'walk', hot: [front] })
  const id = r.lift(front)
  r.retire(id)
  const nf = ringStep(front, 1)
  r.ptr('front', nf)
  r.step('front', `${val} goes through the gate`, nf < front ? 'The "next" marker wraps round to compartment 0.' : 'The other devotees stay in their compartments. Only the "next" marker moves.', `front = (${front} + 1) % ${QUEUE_CAP} = ${nf}. No element was shifted.`, { tone: 'cut', ledger: count(r) })
  r.step('count', `${n - 1} now waiting`, 'The counter at the hall door goes down.', `count = ${n - 1}.`, { ledger: count(r) })
  r.done('Dequeued: O(1)', 'Compartment freed, and it can be reused right away.')
}

export function runQueue(snap: SeqSnap, op: string, a: { value: string; tier: number }): SeqStep[] {
  const r = new SeqRec(snap)
  const mode = snap.mode
  const v = a.value
  r.use(`${mode}.${op}`)

  if (mode === 'linear') {
    let front = r.s.pointers.front!.i
    let rear = r.s.pointers.rear!.i
    if (op === 'enqueue') {
      if (rear === QUEUE_CAP) {
        const free = front
        refuse(r, true, free ? `The last place is taken, yet ${free} ${free === 1 ? 'place' : 'places'} at the front stand empty. This is the false-full problem of a plain array queue.` : undefined)
        return r.steps
      }
      const w = r.make(v, rear)
      r.step(undefined, `Devotee ${v} joins at the back`, 'New arrivals always go behind everyone else.', `enqueue(${v}) writes at index rear = ${rear}.`, { tone: 'make' })
      r.place(w, rear)
      r.step('write', `${v} stands at position ${rear}`, 'Nobody else had to move.', `a[${rear}] = ${v}.`, { tone: 'make', hot: [rear] })
      rear++
      r.ptr('rear', rear)
      r.step('rear', 'Move the rear marker', 'It now shows where the next arrival will stand.', `rear = ${rear}. It always points one past the last person.`, { tone: 'link', ledger: count(r) })
      r.done('Enqueued: O(1)', 'First in line stays first in line.')
    } else if (op === 'dequeue') {
      if (front === rear) {
        refuse(r, false)
        return r.steps
      }
      r.read(front)
      const val = r.v(front)
      r.step('read', `${val} is first in line`, 'The devotee who waited longest goes first.', `v = a[${front}] = ${val}.`, { tone: 'walk', hot: [front] })
      r.retire(r.lift(front))
      front++
      r.ptr('front', front)
      r.step('front', `${val} goes through the gate`, 'In a real queue everyone would step forward. Asking thousands of people to move each time is slow, so the program moves one marker instead.', `front = ${front}. O(1) rather than shifting n elements.`, { tone: 'cut', ledger: count(r) })
      r.done('Dequeued: O(1)', `Position ${front - 1} is now wasted until the hall is compacted. Circular mode fixes this.`)
    } else if (op === 'peek') {
      if (front === rear) {
        refuse(r, false)
        return r.steps
      }
      r.read(front)
      r.step('read', `Next up: ${r.v(front)}`, 'The volunteer checks the token and nobody moves.', `return a[${front}].`, { tone: 'walk', hot: [front] })
      r.done('Peeked: O(1)', 'Peek reads without removing.')
    } else if (op === 'compact') {
      const n = rear - front
      r.step('n', `Move all ${n} devotees forward`, 'Reclaim the empty front positions by asking everyone to step up.', `n = rear - front = ${n}.`, { tone: 'warn' })
      for (let i = 0; i < n; i++) {
        if (front === 0) break
        r.shift(front + i, i)
        r.step('shift', `${r.v(i)} steps up to position ${i}`, 'Each devotee moves, one at a time.', `a[${i}] = a[${front + i}].`, { tone: 'link', hot: [i] })
      }
      front = 0
      rear = n
      r.ptr('front', 0)
      r.ptr('rear', n)
      r.step('rear', 'Markers reset', 'The back half of the hall is free again.', `front = 0, rear = ${n}.`, { tone: 'link', ledger: count(r) })
      r.done('Compacted: O(n)', 'This is the expense a circular queue avoids.')
    }
  } else if (mode === 'circular') {
    if (op === 'enqueue') ringEnqueueBack(r, v)
    else if (op === 'dequeue') ringDequeueFront(r)
    else if (op === 'peek') {
      const front = r.s.pointers.front!.i
      if (r.size() === 0) {
        refuse(r, false)
        return r.steps
      }
      r.read(front)
      r.step('read', `Next up: ${r.v(front)}`, 'The volunteer checks the token and nobody moves.', `return a[${front}].`, { tone: 'walk', hot: [front] })
      r.done('Peeked: O(1)', 'Peek reads without removing.')
    }
  } else if (mode === 'deque') {
    if (op === 'pushBack') ringEnqueueBack(r, v)
    else if (op === 'popFront') ringDequeueFront(r)
    else if (op === 'pushFront') {
      const n = r.size()
      if (n === QUEUE_CAP) {
        refuse(r, true)
        return r.steps
      }
      const front = r.s.pointers.front!.i
      const nf = ringStep(front, -1)
      const w = r.make(v, nf)
      r.step(undefined, `${v} is escorted to the front`, 'A deque also lets a volunteer bring someone in at the head of the line.', `pushFront(${v}).`, { tone: 'make' })
      r.ptr('front', nf)
      r.step('front', 'Move the front marker back one', 'It steps backward, wrapping round if needed.', `front = (${front} - 1 + ${QUEUE_CAP}) % ${QUEUE_CAP} = ${nf}. Adding cap keeps the result non-negative.`, { tone: 'link', hot: [nf] })
      r.place(w, nf)
      r.step('write', `${v} takes compartment ${nf}`, 'Nobody else moved.', `a[${nf}] = ${v}.`, { tone: 'make', hot: [nf], ledger: count(r) })
      r.step('count', `${n + 1} now waiting`, 'The counter goes up.', `count = ${n + 1}.`, { ledger: count(r) })
      r.done('Pushed at the front: O(1)', 'Both ends cost the same.')
    } else if (op === 'popBack') {
      const n = r.size()
      if (n === 0) {
        refuse(r, false)
        return r.steps
      }
      const rear = r.s.pointers.rear!.i
      const nr = ringStep(rear, -1)
      r.ptr('rear', nr)
      r.step('rear', 'Move the rear marker back one', 'It lands on the last person in line.', `rear = (${rear} - 1 + ${QUEUE_CAP}) % ${QUEUE_CAP} = ${nr}.`, { tone: 'link', hot: [nr] })
      r.read(nr)
      const val = r.v(nr)
      r.step('read', `${val} leaves from the back`, 'A devotee at the end of the line decides to come back later.', `v = a[${nr}] = ${val}.`, { tone: 'walk', hot: [nr] })
      r.retire(r.lift(nr))
      r.step('count', `${n - 1} now waiting`, 'The counter goes down.', `count = ${n - 1}.`, { tone: 'cut', ledger: count(r) })
      r.done('Popped from the back: O(1)', 'A deque can act as a queue or a stack.')
    }
  } else if (mode === 'priority') {
    const n = r.size()
    if (op === 'enqueue') {
      if (n === QUEUE_CAP) {
        refuse(r, true)
        return r.steps
      }
      const w = r.make(v, n, { tier: a.tier })
      r.step(undefined, `${v} arrives: ${TIERS[a.tier]}`, 'This hall serves by priority: senior citizens first, then special entry, then sarva darshan. Within a group, whoever came first goes first.', `Lower rank is served first. Here rank = ${a.tier}.`, { tone: 'make' })
      let i = n
      while (i > 0 && r.s.items[r.at(i - 1)!].tier! > a.tier) {
        r.read(i - 1)
        r.shift(i - 1, i)
        r.step('shift', `${r.v(i)} makes way`, 'Their group is served later, so they step back one place.', `rank[${i}] > ${a.tier}, so a[${i}] = a[${i - 1}].`, { tone: 'link', hot: [i] })
        i--
      }
      r.place(w, i)
      r.step('write', `${v} stands at position ${i}`, 'Everyone ahead has equal or higher priority.', `a[${i}] = ${v}.`, { tone: 'make', hot: [i], ledger: count(r) })
      r.done(`Enqueued after ${n - i} ${n - i === 1 ? 'shift' : 'shifts'}: O(n)`, 'A binary heap brings this down to O(log n). See the Reference page.')
    } else if (op === 'dequeue') {
      if (n === 0) {
        refuse(r, false)
        return r.steps
      }
      r.read(0)
      const val = r.v(0)
      r.step('read', `${val} is highest priority`, 'The front of this line is always the next to be served.', `v = a[0] = ${val}.`, { tone: 'walk', hot: [0] })
      r.retire(r.lift(0))
      for (let i = 0; i < n - 1; i++) {
        r.shift(i + 1, i)
        r.step('shift', `${r.v(i)} steps forward`, 'The ordered line closes the gap.', `a[${i}] = a[${i + 1}].`, { tone: 'link', hot: [i] })
      }
      r.done('Dequeued: O(n) in this sorted-array version', 'Order is what makes the front instantly known.')
    } else if (op === 'peek') {
      if (n === 0) {
        refuse(r, false)
        return r.steps
      }
      r.read(0)
      r.step('read', `Next up: ${r.v(0)}`, 'The volunteer checks the token and nobody moves.', 'return a[0].', { tone: 'walk', hot: [0] })
      r.done('Peeked: O(1)', 'Peek reads without removing.')
    }
  }
  return r.steps
}
