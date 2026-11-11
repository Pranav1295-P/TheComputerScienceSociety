import { algo, type Algo } from '../engine/code'
import { SeqRec, makeSnap, type SeqSnap, type SeqStep } from './rec'

export const ARRAY_ALGOS: Record<string, Algo> = {
  access: algo('get', ['i'], `
int v = a[i] @read
return v @ret`, 'int'),
  update: algo('set', ['i', 'v'], `
a[i] = v @write`),
  traverse: algo('traverse', [], `
up i from 0 to n: @loop
  visit(a[i]) @visit`),
  insertBegin: algo('insertAtBeginning', ['v'], `
if n == cap: grow() @full
down i from n to 0: @loop
  a[i] = a[i - 1] @shift
a[0] = v @write
n++ @size`),
  insertEnd: algo('insertAtEnd', ['v'], `
if n == cap: grow() @full
a[n] = v @write
n++ @size`),
  insertAt: algo('insertAtPosition', ['pos', 'v'], `
if n == cap: grow() @full
down i from n to pos: @loop
  a[i] = a[i - 1] @shift
a[pos] = v @write
n++ @size`),
  deleteBegin: algo('deleteAtBeginning', [], `
if n == 0: throw "empty" @guard
up i from 0 to n - 1: @loop
  a[i] = a[i + 1] @shift
n-- @size`),
  deleteEnd: algo('deleteAtEnd', [], `
if n == 0: throw "empty" @guard
n-- @size`),
  deleteAt: algo('deleteAtPosition', ['pos'], `
up i from pos to n - 1: @loop
  a[i] = a[i + 1] @shift
n-- @size`),
  linear: algo('linearSearch', ['x'], `
up i from 0 to n: @loop
  if a[i] == x: return i @check
return -1 @miss`, 'int'),
  binary: algo('binarySearch', ['x'], `
int lo = 0 @init
int hi = n - 1 @initHi
while lo <= hi: @loop
  int mid = (lo + hi) / 2 @mid
  if a[mid] == x: return mid @hit
  if a[mid] < x: lo = mid + 1 @right
  if a[mid] > x: hi = mid - 1 @left
return -1 @miss`, 'int'),
  grow: algo('grow', [], `
array b = 2 * cap @alloc
up i from 0 to n: @loop
  b[i] = a[i] @copy
a = b @swap
cap = 2 * cap @cap`),
}

export const addr = (i: number, row = 0) => '0x' + ((row === 0 ? 0x1000 : 0x2000) + i * 4).toString(16).toUpperCase()

const ARR_DROP = ['i', 'lo', 'hi', 'mid']

function grow(r: SeqRec, resume: string) {
  const n = r.size()
  r.use('grow')
  r.addRow(r.cap() * 2)
  r.step('alloc', 'Shelf is full: bring a bigger one', `All ${n} slots are taken. A shelf cannot stretch, because the next slot along might belong to someone else. A new shelf twice as long arrives.`, `new int[${2 * n}]. Arrays are one contiguous block, so growing means a new block somewhere else.`, { tone: 'warn' })
  for (let i = 0; i < n; i++) {
    r.ptr('i', i)
    r.place(r.at(i)!, i, 1)
    r.step('copy', `Copy book ${r.v(i, 1)} to the new shelf`, `The book at slot ${i} moves to the same slot on the new shelf.`, `b[${i}] = a[${i}]. Every element is copied once.`, { tone: 'make', hot: [[1, i]] })
  }
  r.drop('i')
  r.promote()
  r.step('swap', 'Old shelf goes away', `The new shelf has ${r.cap()} slots. Doubling means this is rare: most inserts never pay for it.`, `a now refers to the new block. Averaged over many inserts, the cost is amortized O(1).`, { tone: 'done' })
  r.use(resume)
}

function shiftRight(r: SeqRec, from: number, to: number) {
  for (let i = from; i > to; i--) {
    r.ptr('i', i)
    r.shift(i - 1, i)
    r.step('shift', `Slide book ${r.v(i)} to slot ${i}`, 'Start from the far end, so each book moves into a slot that is already free.', `a[${i}] = a[${i - 1}]. Going left to right here would overwrite the next book.`, { tone: 'link', hot: [i] })
  }
  r.drop('i')
}

function insertInto(r: SeqRec, algoId: string, pos: number, v: string) {
  r.use(algoId)
  if (r.size() === r.cap()) grow(r, algoId)
  const n = r.size()
  const w = r.make(v, pos)
  const count = n - pos
  r.step(undefined, `Book ${v} arrives for slot ${pos}`, count ? `Slot ${pos} is taken, so ${count} ${count === 1 ? 'book has' : 'books have'} to move one place right.` : 'That slot is already free, so nothing else has to move.', count ? `An array has no gaps, so making room costs ${count} ${count === 1 ? 'write' : 'writes'}.` : 'No shifting needed.', { tone: 'make' })
  shiftRight(r, n, pos)
  r.place(w, pos)
  r.step('write', `Put book ${v} in slot ${pos}`, 'The gap is ready and the book slides in.', `a[${pos}] = ${v}.`, { tone: 'make', hot: [pos] })
  r.step('size', `The shelf now holds ${n + 1} books`, 'The librarian updates the count on the shelf label.', `n = ${n + 1}. n is what marks where valid data ends.`)
  r.done(count ? `Inserted after ${count} ${count === 1 ? 'shift' : 'shifts'}: O(n)` : 'Inserted with no shifts: O(1)', 'The further from the end you insert, the more books have to move.', ARR_DROP)
}

function deleteFrom(r: SeqRec, algoId: string, pos: number) {
  r.use(algoId)
  const n = r.size()
  if (n === 0) {
    r.step('guard', 'Stop: the shelf is empty', 'There is no book to remove.', 'n == 0, so we refuse before touching memory.', { tone: 'warn' })
    r.step(undefined, 'Nothing changed', 'The shelf stays empty.', 'The operation stopped at the guard.', { tone: 'done' })
    return
  }
  const id = r.lift(pos)
  const v = r.val(id)
  r.step(undefined, `Take book ${v} off the shelf`, `Slot ${pos} is now a hole, and arrays cannot have holes in the middle.`, `Elements after index ${pos} must move left to stay contiguous.`, { tone: 'cut', hot: [pos] })
  r.retire(id)
  const count = n - 1 - pos
  for (let i = pos; i < n - 1; i++) {
    r.ptr('i', i)
    r.shift(i + 1, i)
    r.step('shift', `Slide book ${r.v(i)} to slot ${i}`, 'Each book moves one place left, starting closest to the hole.', `a[${i}] = a[${i + 1}].`, { tone: 'link', hot: [i] })
  }
  r.drop('i')
  r.step('size', `The shelf now holds ${n - 1} books`, 'The count on the label drops by one.', `n = ${n - 1}. The last slot is simply no longer counted.`)
  r.done(count ? `Deleted after ${count} ${count === 1 ? 'shift' : 'shifts'}: O(n)` : 'Deleted with no shifts: O(1)', 'Removing from the end is cheap. Removing from the front moves everything.', ARR_DROP)
}

export const ARRAY_START = ['14', '27', '35', '42', '58']
export const arrayStart = (_mode: string, values = ARRAY_START) => {
  const cap = Math.max(6, values.length)
  return makeSnap('array', [cap], [...values, ...Array(cap - values.length).fill(null)])
}

export function runArray(snap: SeqSnap, op: string, a: { value: string; pos: number }): SeqStep[] {
  const r = new SeqRec(snap)
  const n = r.size()
  const { value: v, pos } = a
  if (op === 'access') {
    r.use('access')
    r.ptr('i', pos)
    r.step(undefined, `Find slot ${pos} by arithmetic`, `Slots are equal width, so the librarian measures ${pos} slot-widths from the start and walks straight there.`, `address = base + i × size = 0x1000 + ${pos} × 4 = ${addr(pos)}. One calculation, whatever the length.`, { tone: 'walk', hot: [pos] })
    r.read(pos)
    r.step('read', `Slot ${pos} holds book ${r.v(pos)}`, 'No other book was touched on the way.', `a[${pos}] = ${r.v(pos)}. This is O(1) random access, the reason arrays exist.`, { tone: 'walk', hot: [pos] })
    r.done('Read one slot: O(1)', 'Slot 0 and slot 5 cost exactly the same.', ARR_DROP)
  } else if (op === 'update') {
    r.use('update')
    r.ptr('i', pos)
    const old = r.lift(pos)
    r.step(undefined, `Take out book ${r.val(old)}`, `The librarian goes straight to slot ${pos}.`, `Index ${pos} is computed, not searched for.`, { tone: 'walk', hot: [pos] })
    r.retire(old)
    r.place(r.make(v, pos), pos)
    r.step('write', `Put book ${v} in slot ${pos}`, 'Neighbouring books do not move.', `a[${pos}] = ${v}. One write.`, { tone: 'make', hot: [pos] })
    r.done('Updated one slot: O(1)', 'Replacing is cheap. Only inserting and deleting cause shifting.', ARR_DROP)
  } else if (op === 'traverse') {
    r.use('traverse')
    const seen: string[] = []
    for (let i = 0; i < n; i++) {
      r.ptr('i', i)
      r.read(i)
      seen.push(r.v(i))
      r.step('visit', `Check slot ${i}`, `Book ${r.v(i)}. Seen so far: ${seen.join(', ')}.`, `visit(a[${i}]). Neighbouring slots sit next to each other in memory, so the CPU cache makes this fast.`, { tone: 'walk', hot: [i] })
    }
    if (!n) r.step('loop', 'The shelf is empty', 'Nothing to check.', 'n == 0, so the loop never runs.', { tone: 'warn' })
    r.done(`Visited ${n} ${n === 1 ? 'book' : 'books'}: O(n)`, 'Every book was looked at exactly once.', ARR_DROP)
  } else if (op === 'insertBegin') insertInto(r, 'insertBegin', 0, v)
  else if (op === 'insertEnd') insertInto(r, 'insertEnd', n, v)
  else if (op === 'insertAt') insertInto(r, 'insertAt', pos, v)
  else if (op === 'deleteBegin') deleteFrom(r, 'deleteBegin', 0)
  else if (op === 'deleteEnd') deleteFrom(r, 'deleteEnd', n - 1)
  else if (op === 'deleteAt') deleteFrom(r, 'deleteAt', pos)
  else if (op === 'linear') {
    r.use('linear')
    let found = -1
    for (let i = 0; i < n; i++) {
      r.ptr('i', i)
      r.read(i)
      const hit = r.v(i) === v
      r.step('check', hit ? `Found ${v} at slot ${i}` : `Slot ${i} holds ${r.v(i)}`, hit ? 'The librarian stops here.' : 'Not it. Move to the next slot.', `a[${i}] ${hit ? '==' : '!='} ${v}.`, { tone: hit ? 'done' : 'walk', hot: [i] })
      if (hit) {
        found = i
        break
      }
    }
    if (found < 0) r.step('miss', `${v} is not on this shelf`, 'Every book had to be checked to be sure.', 'return -1. The worst case looks at all n.', { tone: 'warn' })
    r.done(`Linear search made ${r.s.reads} checks: O(n)`, 'This works on any shelf, sorted or not.', ARR_DROP)
  } else if (op === 'binary') {
    r.use('binary')
    const nums = r.s.rows[0].slice(0, n).map((id) => Number(r.s.items[id!].value))
    if (nums.some((x, i) => i && nums[i - 1] > x)) {
      r.step(undefined, 'Stop: this shelf is not sorted', 'Binary search throws away half the shelf based on order. Without order, that half might hold the book.', 'Precondition: the array must be sorted. Use "Sort the shelf" first.', { tone: 'warn' })
      r.done('Search did not run', 'Sort first, then search.')
      return r.steps
    }
    let lo = 0, hi = n - 1, ans = -1
    r.ptr('lo', lo)
    r.ptr('hi', hi)
    r.step('init', 'Mark both ends of the search range', 'Two bookmarks hold the part of the shelf that could still contain the book.', `lo = 0, hi = ${hi}.`, { tone: 'walk' })
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2)
      r.ptr('mid', mid)
      r.read(mid)
      r.step('mid', `Open the middle: slot ${mid}`, `Book ${nums[mid]} is in the middle of the range.`, `mid = (${lo} + ${hi}) / 2 = ${mid}.`, { tone: 'walk', hot: [mid] })
      if (nums[mid] === Number(v)) {
        ans = mid
        r.step('hit', `Found ${v} at slot ${mid}`, 'Done.', `a[${mid}] == ${v}.`, { tone: 'done', hot: [mid] })
        break
      }
      if (nums[mid] < Number(v)) {
        lo = mid + 1
        r.ptr('lo', lo)
        r.step('right', 'Discard the left half', `${nums[mid]} is smaller than ${v}, so everything to its left is smaller too.`, `lo = ${lo}.`, { tone: 'link' })
      } else {
        hi = mid - 1
        r.ptr('hi', hi)
        r.step('left', 'Discard the right half', `${nums[mid]} is larger than ${v}, so everything to its right is larger too.`, `hi = ${hi}.`, { tone: 'link' })
      }
    }
    if (ans < 0) r.step('miss', `${v} is not on this shelf`, 'The bookmarks crossed, so the range is empty.', 'lo > hi, so return -1.', { tone: 'warn' })
    r.done(`Binary search made ${r.s.reads} checks: O(log n)`, 'Halving means 1,000,000 books need only about 20 checks.', ARR_DROP)
  }
  return r.steps
}
