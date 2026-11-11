// Guided lessons and problem walkthroughs for the array, stack and queue labs.
import { SeqRec, makeSnap, type SeqSnap, type SeqStep } from './rec'
import { addr, arrayStart, runArray } from './array'
import { STACK_CAP, runStack, stackStart } from './stack'
import { QUEUE_CAP, queueStart, runQueue } from './queue'

export interface SeqTour {
  id: string
  title: string
  idea: string
  notice: string[]
  build: () => SeqStep[]
}

type Run = (s: SeqSnap, op: string) => SeqStep[]

/** Run several operations one after another, each starting where the last ended. */
function chain(start: SeqSnap, run: Run, ops: string[]) {
  let s = start
  const out: SeqStep[] = []
  for (const op of ops) {
    const steps = run(s, op)
    out.push(...steps)
    s = steps[steps.length - 1].snap
  }
  return out
}

const say = (snap: SeqSnap, title: string, world: string, code: string, hot: string[] = [], tone: SeqStep['tone'] = 'info'): SeqStep => ({ snap, hot, title, train: world, code, tone })
const lastOf = (s: SeqStep[]) => s[s.length - 1].snap

// ---------------- arrays ----------------

function aSlots() {
  const s = arrayStart('')
  return [
    say(s, 'A shelf of numbered slots', 'Every slot is the same width, and they stand side by side with no gaps. That is the whole idea of an array.', 'int a[6]: six integers in one continuous block of memory.'),
    say(s, 'Counting starts at 0', 'The number on the shelf edge says how many slots you must skip from the start. The first slot skips none.', 'An index is an offset from the start. That is why it begins at 0.', ['0:0']),
    say(s, 'Each slot has a real address', `Under each number is its address: ${addr(0)}, ${addr(1)}, ${addr(2)}, going up by 4.`, 'An int takes 4 bytes here, so addresses go up by 4.', ['0:0', '0:1', '0:2'], 'walk'),
    say(s, 'So any slot can be calculated', 'To find slot 4 you need no search. You measure 4 widths from the start.', `address = base + index × size = 0x1000 + 4 × 4 = ${addr(4)}.`, ['0:4'], 'walk'),
    say(s, 'Capacity and size are different', 'The shelf has 6 slots, but only 5 hold books. The empty slot is reserved, ready for later.', 'cap = 6 is how much is allocated. n = 5 is how much is used.', ['0:5'], 'done'),
  ]
}

const aRun = (s: SeqSnap, op: string, value = '9', pos = 0) => runArray(s, op, { value, pos })

const aInsert = () => [say(arrayStart(''), 'Add a book at the very front', 'There is no gap at slot 0, and books cannot share a slot. Watch what it costs.', 'Elements must stay contiguous, so all of them have to move.', [], 'warn'), ...aRun(arrayStart(''), 'insertBegin')]
const aDelete = () => [say(arrayStart(''), 'Remove a book from the middle', 'A hole in the middle is not allowed. Index arithmetic only works when slots are filled continuously.', 'Later elements shift left to close the gap.', ['0:1'], 'warn'), ...aRun(arrayStart(''), 'deleteAt', '', 1)]
const aGrow = () => {
  const s = arrayStart('', ['14', '27', '35', '42', '58', '61'])
  return [say(s, 'Every slot is taken', 'The wall behind the shelf belongs to someone else, so this shelf cannot simply get longer.', 'Memory just after the block may be in use by other data.', [], 'warn'), ...aRun(s, 'insertEnd', '70', 6)]
}
const aBinary = () => {
  const s = arrayStart('', ['11', '19', '27', '35', '42', '58'])
  return [say(s, 'A sorted shelf is a superpower', 'Open the middle. One comparison tells you which half can be ignored.', 'Binary search needs both sorted data and O(1) access by index, and arrays give the second one for free.'), ...aRun(s, 'binary', '42')]
}

export const ARRAY_TOURS: SeqTour[] = [
  { id: 'slots', title: 'Slots, indexes and addresses', idea: 'An array is equal-sized slots side by side. That layout is what makes jumping to any slot possible.', notice: ['The addresses on the shelf edge rise by a fixed amount.', 'The memory strip on the right matches the shelf.'], build: aSlots },
  { id: 'insert', title: 'Why inserting is expensive', idea: 'No gaps are allowed, so inserting near the front moves almost everything.', notice: ['Books move starting from the far end.', 'Count the writes on the right.'], build: aInsert },
  { id: 'delete', title: 'Closing the hole', idea: 'Deleting creates a gap, and every later element shifts left to close it.', notice: ['Shifts run in the opposite direction from insert.', 'Watch n fall by one.'], build: aDelete },
  { id: 'grow', title: 'When the shelf is full', idea: 'Dynamic arrays copy everything to a block twice as large, which makes the average append O(1).', notice: ['A second shelf appears above the first.', 'Every book is copied once.'], build: aGrow },
  { id: 'binary', title: 'Halving a sorted shelf', idea: 'Sorted data plus random access gives O(log n) search.', notice: ['lo and hi close in from both ends.', 'Half the range disappears each step.'], build: aBinary },
]

// ---------------- stacks ----------------

const sRun = (s: SeqSnap, op: string, value = '', pos = 0) => runStack(s, op, { value, pos })

const stackFull = () => stackStart('', ['Rice', 'Dal', 'Curry', 'Roti', 'Salad', 'Sweet'])

function sOnlyTop() {
  const s = stackStart('')
  return [
    say(s, 'A tiffin carrier', 'Tins are stacked on a frame, held together by a clamp. You only ever reach the tin at the top.', 'A stack allows access to one end only, called the top.', ['0:2']),
    say(s, 'Last in, first out', 'Rice went on first and sits at the bottom. Curry went on last, so it comes off first.', 'LIFO: the most recently added element is the first removed.', ['0:2', '0:0'], 'walk'),
    say(s, 'The top marker is all the stack needs', 'A single marker remembers which tin is highest.', 'One integer, top, stores the index of the newest element.', ['0:2'], 'walk'),
    ...sRun(s, 'dig', '', 2),
  ]
}

const pushes = (values: string[], pops: number) => {
  let s = stackStart('', [])
  const out: SeqStep[] = []
  for (const v of values) {
    const st = sRun(s, 'push', v)
    out.push(...st)
    s = lastOf(st)
  }
  for (let i = 0; i < pops; i++) {
    const st = sRun(s, 'pop')
    out.push(...st)
    s = lastOf(st)
  }
  return out
}

function sEdges() {
  const full = stackFull()
  const empty = stackStart('', [])
  return [
    say(full, 'What if the carrier is full?', `The array has room for ${STACK_CAP} tins, and all of them are used.`, 'top == cap - 1.', [], 'warn'),
    ...sRun(full, 'push', 'Pickle'),
    say(empty, 'What if it is empty?', 'No tins are on the frame.', 'top == -1 means an empty stack, because the first push will make it 0.', [], 'warn'),
    ...sRun(empty, 'pop'),
  ]
}

function sCalls() {
  const r = new SeqRec(stackStart('', ['main()']))
  r.step(undefined, 'Your program runs on a stack', 'Each function call is a tin. Inside it are that call\'s local variables and where to go back to.', 'The call stack holds one frame per active function.', { hot: [0] })
  let top = 0
  for (const f of ['fact(3)', 'fact(2)', 'fact(1)']) {
    const id = r.make(f, top + 1)
    r.step(undefined, `${f} is called`, 'A new frame is prepared.', 'Calling a function pushes a frame.', { tone: 'make' })
    r.place(id, ++top)
    r.ptr('top', top)
    r.step(undefined, `${f} is now running`, 'Only the top frame is active. Everyone beneath is paused, waiting.', `Frames waiting: ${top}.`, { tone: 'make', hot: [top] })
  }
  const answers = ['fact(1) returns 1', 'fact(2) returns 2', 'fact(3) returns 6']
  for (const msg of answers) {
    r.retire(r.lift(top--))
    r.ptr('top', top)
    r.step(undefined, msg, 'The finished frame is lifted away and the one below continues.', 'Returning pops a frame.', { tone: 'cut', hot: [top] })
  }
  r.step(undefined, 'Now you know what "stack overflow" means', 'Recursion with no base case keeps adding tins until the carrier runs out of room.', 'The call stack has a limit. Exceeding it is a stack overflow.', { tone: 'done' })
  return r.steps
}

function sReverse() {
  const word = 'CODE'
  const r = new SeqRec(stackStart('', []))
  let top = -1
  r.step(undefined, `Reverse the word ${word}`, 'One letter per tin. The order they come off is the opposite of the order they went on.', 'Pushing then popping reverses any sequence.', { ledger: [{ label: 'input', value: word }] })
  for (const ch of word) {
    const id = r.make(ch, top + 1)
    r.place(id, ++top)
    r.ptr('top', top)
    r.step(undefined, `Push ${ch}`, 'Another tin on top.', `top = ${top}.`, { tone: 'make', hot: [top], ledger: [{ label: 'input', value: word }] })
  }
  let out = ''
  while (top >= 0) {
    out += r.v(top)
    r.retire(r.lift(top--))
    r.ptr('top', top)
    r.step(undefined, `Pop ${out[out.length - 1]}`, 'Add it to the answer.', `result = "${out}".`, { tone: 'cut', ledger: [{ label: 'result', value: out }] })
  }
  r.step(undefined, `Reversed: ${out}`, 'Undo buttons and browser back work the same way: the newest action comes off first.', 'O(n) time and O(n) space.', { tone: 'done', ledger: [{ label: 'result', value: out }] })
  return r.steps
}

export const STACK_TOURS: SeqTour[] = [
  { id: 'top', title: 'Only the top is reachable', idea: 'A stack deliberately gives up access to the middle in exchange for a very simple, very fast top.', notice: ['See what it takes to reach the bottom tin.', 'A spare carrier appears to hold tins.'], build: sOnlyTop },
  { id: 'pushpop', title: 'Push and pop', idea: 'Both operations change one marker and touch one slot.', notice: ['Follow the top marker on the left.', 'Pop reads the value before moving top.'], build: () => pushes(['Rice', 'Dal', 'Curry'], 2) },
  { id: 'edges', title: 'Overflow and underflow', idea: 'A careful stack checks both limits before touching memory.', notice: ['Full means top is cap - 1.', 'Empty means top is -1.'], build: sEdges },
  { id: 'calls', title: 'The call stack', idea: 'Every function call in every program you run lives on a stack.', notice: ['Only the top frame is running.', 'Returning removes exactly one tin.'], build: sCalls },
  { id: 'reverse', title: 'Reversing and undo', idea: 'A stack hands things back in the opposite order.', notice: ['Compare the input with the result below the board.'], build: sReverse },
]

// ---------------- queues ----------------

const qRun = (s: SeqSnap, op: string, value = 'T201') => runQueue(s, op, { value, tier: 3 })

function qWith(mode: string, placed: Record<number, string>, front: number, rear: number) {
  const vals: (string | null)[] = Array(QUEUE_CAP).fill(null)
  for (const [i, v] of Object.entries(placed)) vals[Number(i)] = v
  const s = makeSnap(mode, [QUEUE_CAP], vals)
  s.pointers.front = { row: 0, i: front }
  s.pointers.rear = { row: 0, i: rear }
  return s
}

function qFifo() {
  const s = queueStart('linear')
  const a = qRun(s, 'enqueue')
  return [
    say(s, 'The queue at Tirumala', 'Devotees wait in line for darshan. Whoever arrived first goes in first. No one overtakes.', 'FIFO: first in, first out.', ['0:0'], 'info'),
    say(s, 'Two ends, two jobs', 'People join only at the back, and enter the temple only from the front.', 'enqueue adds at rear. dequeue removes at front.', ['0:0', '0:3'], 'walk'),
    ...a,
    ...qRun(lastOf(a), 'dequeue'),
  ]
}

function qMarker() {
  const s = queueStart('linear')
  return [
    say(s, 'Should everybody step forward?', 'In real life, when one person goes in, everyone shuffles forward. With a million people, that would be a million moves for every single darshan.', 'Shifting n elements on each dequeue would make it O(n).', [], 'warn'),
    say(s, 'The trick: move the marker instead', 'Devotees stay where they are. The sign showing who is next moves along the line.', 'front is just an integer. front++ is O(1).', ['0:0'], 'walk'),
    ...chain(s, qRun, ['dequeue', 'dequeue']),
  ]
}

function qFalseFull() {
  const s = qWith('linear', { 4: 'T105', 5: 'T106', 6: 'T107', 7: 'T108' }, 4, 8)
  const r = qRun(s, 'enqueue', 'T109')
  return [
    say(s, 'The back has reached the wall', 'Four people have gone in, so the first four positions are empty. But rear is past the last position.', 'rear == cap, while front = 4.', [], 'warn'),
    ...r,
    say(lastOf(r), 'Space exists, but the array cannot use it', 'Compacting moves everyone forward. It works, but it is the O(n) cost we were trying to avoid.', 'Next lesson: reuse the front of the array.', [], 'info'),
    ...runQueue(lastOf(r), 'compact', { value: '', tier: 3 }),
  ]
}

function qCircular() {
  const s = qWith('circular', { 5: 'T106', 6: 'T107', 7: 'T108' }, 5, 0)
  return [
    say(s, 'Bend the hall into a ring', 'Compartments now form a circle. After the last compartment comes compartment 0 again.', 'Still a plain array. The ring exists only in the arithmetic.', [], 'info'),
    say(s, 'The modulo operator does the wrapping', 'Going one past compartment 7 lands on compartment 0.', 'next = (i + 1) % cap, so (7 + 1) % 8 = 0.', ['0:7', '0:0'], 'walk'),
    ...chain(s, (x, op) => qRun(x, op, op === 'enqueue' ? `T${200 + Object.keys(x.items).length}` : ''), ['enqueue', 'enqueue', 'dequeue', 'dequeue']),
  ]
}

function qPriority() {
  const s = queueStart('priority')
  const run = (x: SeqSnap, value: string, tier: number) => runQueue(x, 'enqueue', { value, tier })
  const a = run(s, 'T301', 1)
  const b = run(lastOf(a), 'T302', 2)
  return [
    say(s, 'Not everyone waits equally', 'Senior citizens and other priority groups are served ahead of the general line. Inside a group it is still first come, first served.', 'A priority queue removes the highest-priority element first.', ['0:0'], 'info'),
    ...a,
    ...b,
    ...runQueue(lastOf(b), 'dequeue', { value: '', tier: 3 }),
  ]
}

function qDeque() {
  const s = qWith('deque', { 0: 'T101', 1: 'T102', 2: 'T103' }, 0, 3)
  return [
    say(s, 'A line that opens at both ends', 'A volunteer can bring someone to the front, and someone at the back can step out.', 'A deque supports add and remove at both ends, each O(1).', [], 'info'),
    ...chain(s, (x, op) => qRun(x, op, 'T401'), ['pushFront', 'popBack', 'pushBack', 'popFront']),
  ]
}

export const QUEUE_TOURS: SeqTour[] = [
  { id: 'fifo', title: 'First come, first served', idea: 'A queue keeps arrival order. Join at the rear, leave from the front.', notice: ['New devotees stand behind everyone else.', 'The gopuram is the front of the queue.'], build: qFifo },
  { id: 'marker', title: 'Move the marker, not the people', idea: 'A front index makes dequeue O(1), with no shifting.', notice: ['The devotees stay where they are.', 'Only the front sign moves.'], build: qMarker },
  { id: 'false', title: 'The false-full problem', idea: 'A plain array queue runs out of room while the front is empty.', notice: ['Compare the empty positions with the rear sign.'], build: qFalseFull },
  { id: 'circular', title: 'The Vaikuntam compartments', idea: 'Treating the array as a ring reuses freed space, and every operation stays O(1).', notice: ['The rear sign wraps from 7 to 0.', 'Freed compartments are reused.'], build: qCircular },
  { id: 'deque', title: 'Deque: both ends open', idea: 'A double-ended queue generalises both the queue and the stack.', notice: ['Front and rear each move both ways.'], build: qDeque },
  { id: 'priority', title: 'Priority darshan', idea: 'A priority queue serves by rank rather than by arrival.', notice: ['Gold is senior citizen, teal is special entry, orange is sarva darshan.', 'Lower-priority devotees make way.'], build: qPriority },
]

// ---------------- walkthroughs ----------------

function t283() {
  const r = new SeqRec(arrayStart('', ['0', '1', '0', '3', '12']))
  const n = 5
  let w = 0
  r.ptr('write', 0)
  r.step(undefined, 'Two bookmarks', 'write marks where the next real book belongs. i scans the shelf.', 'write = 0.', { tone: 'walk' })
  for (let i = 0; i < n; i++) {
    r.ptr('i', i)
    r.read(i)
    if (r.v(i) === '0') {
      r.step(undefined, `Slot ${i} is a zero`, 'Skip it. write stays put, marking the first zero.', 'nums[i] == 0, so only i advances.', { tone: 'walk', hot: [i] })
      continue
    }
    if (i !== w) {
      const a = r.lift(i)
      const b = r.lift(w)
      r.step(undefined, `Swap slots ${w} and ${i}`, `${r.val(a)} is real data, so it belongs at the write bookmark.`, `swap(nums[${w}], nums[${i}]).`, { tone: 'make' })
      r.place(a, w)
      r.place(b, i)
    }
    w++
    r.ptr('write', w)
    r.step(undefined, 'Advance write', `Everything before slot ${w} is now correct.`, `write = ${w}.`, { tone: 'link', hot: [w - 1] })
  }
  r.done('Zeros moved: O(n) time, O(1) space', 'The relative order of the non-zero books never changed.', ['i', 'write'])
  return r.steps
}

const t704 = () => runArray(arrayStart('', ['-1', '0', '3', '5', '9', '12']), 'binary', { value: '9', pos: 0 })

function t20() {
  const text = '{[()]}'
  const r = new SeqRec(stackStart('', []))
  let top = -1
  const led = (i: number) => [{ label: 'input', value: text }, { label: 'reading', value: i < text.length ? `index ${i}: ${text[i]}` : 'end' }]
  const pair: Record<string, string> = { ')': '(', ']': '[', '}': '{' }
  r.step(undefined, 'Openers wait, closers match', 'The most recent opener must close first, which is exactly what a stack gives you.', 'Push openers. On a closer, the top must be its partner.', { ledger: led(0) })
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (!pair[c]) {
      const id = r.make(c, top + 1)
      r.place(id, ++top)
      r.ptr('top', top)
      r.step(undefined, `Opener ${c}: push it`, 'It waits for its partner.', `stack depth ${top + 1}.`, { tone: 'make', hot: [top], ledger: led(i) })
    } else {
      r.read(top)
      r.step(undefined, `Closer ${c}: check the top`, `The top is ${r.v(top)}, and ${c} needs ${pair[c]}.`, `top == '${pair[c]}', so it matches.`, { tone: 'walk', hot: [top], ledger: led(i) })
      r.retire(r.lift(top--))
      r.ptr('top', top)
      r.step(undefined, 'Matched: pop it', 'This pair is complete.', `stack depth ${top + 1}.`, { tone: 'cut', ledger: led(i) })
    }
  }
  r.done('Stack is empty, so the string is valid', 'A non-empty stack at the end would mean an unclosed bracket.', [])
  return r.steps
}

export function t739Answer() {
  return runT739().answer
}

function runT739() {
  const temps = [73, 74, 75, 71, 69, 72, 76, 73]
  const r = new SeqRec(makeSnap('stack', [STACK_CAP]))
  r.ptr('top', -1)
  const ans = temps.map(() => 0)
  const led = (i: number) => [{ label: 'temps', value: temps.join(' ') }, { label: 'day', value: String(i) }, { label: 'answer', value: ans.join(' ') }]
  const stack: number[] = []
  r.step(undefined, 'A stack of days still waiting', 'Each tin is a day that has not yet seen a warmer one. Temperatures go down as you climb the carrier.', 'A monotonic decreasing stack of indices.', { ledger: led(0) })
  temps.forEach((t, i) => {
    while (stack.length && temps[stack[stack.length - 1]] < t) {
      const d = stack.pop()!
      ans[d] = i - d
      r.read(stack.length)
      r.retire(r.lift(stack.length))
      r.ptr('top', stack.length - 1)
      r.step(undefined, `${t} is warmer than day ${d}`, `Day ${d} waited ${i - d} ${i - d === 1 ? 'day' : 'days'}, so its tin comes off.`, `ans[${d}] = ${i} - ${d} = ${i - d}.`, { tone: 'cut', ledger: led(i) })
    }
    const id = r.make(`${i}:${t}`, stack.length)
    r.place(id, stack.length)
    stack.push(i)
    r.ptr('top', stack.length - 1)
    r.step(undefined, `Day ${i} (${t}) starts waiting`, 'It goes on top.', 'Each index is pushed once and popped at most once, which makes the whole thing O(n).', { tone: 'make', hot: [stack.length - 1], ledger: led(i) })
  })
  r.done('Done: O(n) time', 'Days still on the carrier never get warmer, so their answer stays 0.', [])
  return { steps: r.steps, answer: ans }
}

function t933() {
  const pings = [1, 100, 3001, 3002]
  const r = new SeqRec(makeSnap('linear', [6]))
  let front = 0, rear = 0
  r.ptr('front', 0)
  r.ptr('rear', 0)
  const led = (t: number, c: number) => [{ label: 'ping', value: String(t) }, { label: 'window', value: `[${t - 3000}, ${t}]` }, { label: 'count', value: String(c) }]
  r.step(undefined, 'A rolling 3000 ms window', 'Tokens are stamped with arrival time. Anyone older than the window has to leave the line.', 'Timestamps arrive in order, so old ones are always at the front.')
  for (const t of pings) {
    const id = r.make(String(t), rear)
    r.place(id, rear++)
    r.ptr('rear', rear)
    r.step(undefined, `ping(${t})`, 'A new arrival joins the back.', `enqueue(${t}).`, { tone: 'make', hot: [rear - 1], ledger: led(t, rear - front) })
    while (Number(r.v(front)) < t - 3000) {
      const v = r.v(front)
      r.retire(r.lift(front++))
      r.ptr('front', front)
      r.step(undefined, `${v} is too old`, `It is before ${t - 3000}, so it leaves from the front.`, 'dequeue() while front < t - 3000.', { tone: 'cut', ledger: led(t, rear - front) })
    }
    r.step(undefined, `Return ${rear - front}`, 'Everyone still in line is inside the window.', 'return size of queue.', { tone: 'walk', ledger: led(t, rear - front) })
  }
  r.done('Each ping is added and removed at most once', 'That gives amortized O(1) per call.', [])
  return r.steps
}

function run239() {
  const nums = [1, 3, -1, -3, 5, 3, 6, 7]
  const k = 3
  const cap = nums.length
  const r = new SeqRec(makeSnap('linear', [cap]))
  let front = 0, rear = 0
  r.ptr('front', 0)
  r.ptr('rear', 0)
  const result: number[] = []
  const led = (i: number) => [{ label: 'nums', value: nums.join(' ') }, { label: 'i', value: String(i) }, { label: 'maxes', value: result.join(' ') || '—' }]
  const idx = (p: number) => Number(r.v(p).split(':')[0])
  r.step(undefined, 'A line that keeps only useful people', 'Each entry stores index:value. Values fall from front to back, so the largest is always at the front.', 'A monotonic decreasing deque of indices.', { ledger: led(0) })
  nums.forEach((x, i) => {
    if (rear > front && idx(front) <= i - k) {
      r.retire(r.lift(front++))
      r.ptr('front', front)
      r.step(undefined, 'Front has left the window', `It is older than index ${i - k + 1}.`, 'popFront() while out of range.', { tone: 'cut', ledger: led(i) })
    }
    while (rear > front && nums[idx(rear - 1)] < x) {
      const v = r.v(rear - 1)
      r.retire(r.lift(--rear))
      r.ptr('rear', rear)
      r.step(undefined, `${v} can never be the maximum`, `${x} is bigger and will outlast it.`, 'popBack() while smaller than x.', { tone: 'cut', ledger: led(i) })
    }
    const id = r.make(`${i}:${x}`, rear)
    r.place(id, rear++)
    r.ptr('rear', rear)
    if (i >= k - 1) result.push(nums[idx(front)])
    r.step(undefined, `Add ${x}`, i >= k - 1 ? `The window's maximum is at the front: ${nums[idx(front)]}.` : 'The window is not full yet.', 'pushBack(i).', { tone: 'make', hot: [rear - 1, front], ledger: led(i) })
  })
  r.done('Sliding maximum: O(n)', 'Each index enters and leaves the line at most once.', [])
  return { steps: r.steps, result }
}

export const t239Result = () => run239().result

export const ARRAY_TRACES: Partial<Record<number, () => SeqStep[]>> = { 283: t283, 704: t704 }
export const STACK_TRACES: Partial<Record<number, () => SeqStep[]>> = { 20: t20, 739: () => runT739().steps }
export const QUEUE_TRACES: Partial<Record<number, () => SeqStep[]>> = { 933: t933, 239: () => run239().steps }
