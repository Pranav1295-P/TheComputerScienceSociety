import { algo, type Algo } from './code'
import { Rec, emptySnap, type Kind, type Snap, type Step } from './rec'

export type Op =
  | 'traverse'
  | 'insertBegin'
  | 'insertEnd'
  | 'insertAt'
  | 'deleteBegin'
  | 'deleteEnd'
  | 'deleteAt'

export const OP_LABEL: Record<Op, string> = {
  traverse: 'Traverse',
  insertBegin: 'Insert at beginning',
  insertEnd: 'Insert at end',
  insertAt: 'Insert at position',
  deleteBegin: 'Delete at beginning',
  deleteEnd: 'Delete at end',
  deleteAt: 'Delete at position',
}

export const COMPLEXITY: Record<Kind, Record<Op, string>> = {
  singly: { traverse: 'O(n)', insertBegin: 'O(1)', insertEnd: 'O(n)', insertAt: 'O(n)', deleteBegin: 'O(1)', deleteEnd: 'O(n)', deleteAt: 'O(n)' },
  doubly: { traverse: 'O(n)', insertBegin: 'O(1)', insertEnd: 'O(1)', insertAt: 'O(n)', deleteBegin: 'O(1)', deleteEnd: 'O(1)', deleteAt: 'O(n)' },
  circular: { traverse: 'O(n)', insertBegin: 'O(1)', insertEnd: 'O(1)', insertAt: 'O(n)', deleteBegin: 'O(1)', deleteEnd: 'O(n)', deleteAt: 'O(n)' },
}

export const ALGOS: Record<string, Algo> = {
  // ---- singly ----
  's.traverse': algo('traverse', [], `
let cur = head @cur
while cur != null: @loop
  visit(cur.val) @visit
  cur = cur.next @adv`),
  's.insertBegin': algo('insertAtBeginning', ['v'], `
let w = new(v) @make
w.next = head @link
head = w @head`),
  's.insertEnd': algo('insertAtEnd', ['v'], `
let w = new(v) @make
if head == null: @empty
  head = w @emptyHead
  return
let cur = head @cur
while cur.next != null: @loop
  cur = cur.next @adv
cur.next = w @link`),
  's.insertAt': algo('insertAtPosition', ['v', 'pos'], `
let cur = head @cur
for i in 0..pos - 1: @loop
  cur = cur.next @adv
let w = new(v) @make
w.next = cur.next @link1
cur.next = w @link2`),
  's.deleteBegin': algo('deleteAtBeginning', [], `
if head == null: return @guard
let victim = head @victim
head = head.next @head
free(victim) @free`),
  's.deleteEnd': algo('deleteAtEnd', [], `
if head == null: return @guard
if head.next == null: @one
  free(head) @oneFree
  head = null @oneHead
  return
let cur = head @cur
while cur.next.next != null: @loop
  cur = cur.next @adv
let victim = cur.next @victim
cur.next = null @link
free(victim) @free`),
  's.deleteAt': algo('deleteAtPosition', ['pos'], `
let cur = head @cur
for i in 0..pos - 1: @loop
  cur = cur.next @adv
let victim = cur.next @victim
cur.next = victim.next @link
free(victim) @free`),

  // ---- doubly ----
  'd.traverse': algo('traverseBothWays', [], `
let cur = head @cur
while cur != null: @loop
  visit(cur.val) @visit
  cur = cur.next @adv
cur = tail @curBack
while cur != null: @loopBack
  visit(cur.val) @visitBack
  cur = cur.prev @advBack`),
  'd.insertBegin': algo('insertAtBeginning', ['v'], `
let w = new(v) @make
w.next = head @link
if head != null: @check
  head.prev = w @linkBack
else:
  tail = w @tail
head = w @head`),
  'd.insertEnd': algo('insertAtEnd', ['v'], `
let w = new(v) @make
w.prev = tail @link
if tail != null: @check
  tail.next = w @linkBack
else:
  head = w @head
tail = w @tail`),
  'd.insertAt': algo('insertAtPosition', ['v', 'pos'], `
let cur = head @cur
for i in 0..pos: @loop
  cur = cur.next @adv
let w = new(v) @make
w.prev = cur.prev @w1
w.next = cur @w2
cur.prev.next = w @w3
cur.prev = w @w4`),
  'd.deleteBegin': algo('deleteAtBeginning', [], `
if head == null: return @guard
let victim = head @victim
head = head.next @head
if head != null: @check
  head.prev = null @link
else:
  tail = null @tail
free(victim) @free`),
  'd.deleteEnd': algo('deleteAtEnd', [], `
if tail == null: return @guard
let victim = tail @victim
tail = tail.prev @tail
if tail != null: @check
  tail.next = null @link
else:
  head = null @head
free(victim) @free`),
  'd.deleteAt': algo('deleteAtPosition', ['pos'], `
let cur = head @cur
for i in 0..pos: @loop
  cur = cur.next @adv
cur.prev.next = cur.next @w1
cur.next.prev = cur.prev @w2
free(cur) @free`),

  // ---- circular (only a tail reference; first wagon is tail.next) ----
  'c.traverse': algo('traverse', [], `
if tail == null: return @guard
let cur = tail.next @cur
while true: @loop
  visit(cur.val) @visit
  if cur == tail: break @stop
  cur = cur.next @adv`),
  'c.insertBegin': algo('insertAtBeginning', ['v'], `
let w = new(v) @make
if tail == null: @empty
  w.next = w @self
  tail = w @tailEmpty
  return
w.next = tail.next @link
tail.next = w @close`),
  'c.insertEnd': algo('insertAtEnd', ['v'], `
let w = new(v) @make
if tail == null: @empty
  w.next = w @self
  tail = w @tailEmpty
  return
w.next = tail.next @link
tail.next = w @close
tail = w @tail`),
  'c.insertAt': algo('insertAtPosition', ['v', 'pos'], `
let cur = tail.next @cur
for i in 0..pos - 1: @loop
  cur = cur.next @adv
let w = new(v) @make
w.next = cur.next @link1
cur.next = w @link2`),
  'c.deleteBegin': algo('deleteAtBeginning', [], `
if tail == null: return @guard
let first = tail.next @victim
if first == tail: @one
  tail = null @oneTail
else:
  tail.next = first.next @link
free(first) @free`),
  'c.deleteEnd': algo('deleteAtEnd', [], `
if tail == null: return @guard
let last = tail @victim
if last.next == last: @one
  tail = null @oneTail
else:
  let cur = tail.next @cur
  while cur.next != tail: @loop
    cur = cur.next @adv
  cur.next = tail.next @link
  tail = cur @tail
free(last) @free`),
  'c.deleteAt': algo('deleteAtPosition', ['pos'], `
let cur = tail.next @cur
for i in 0..pos - 1: @loop
  cur = cur.next @adv
let victim = cur.next @victim
cur.next = victim.next @link
free(victim) @free`),
}

const REAL_MEMORY =
  'We slide wagons only so the new order reads cleanly. In real memory nothing moved. Only the couplings changed.'

function finish(r: Rec, headline: string) {
  const { s } = r
  r.purge()
  r.drop('cur', 'w', 'victim')
  r.row(r.order())
  r.step(
    undefined,
    headline,
    `Finished with ${s.hops} inspector ${s.hops === 1 ? 'hop' : 'hops'} and ${s.writes} coupling ${s.writes === 1 ? 'change' : 'changes'}. ${REAL_MEMORY}`,
    `Cost of this run: ${s.hops} pointer ${s.hops === 1 ? 'hop' : 'hops'}, ${s.writes} pointer ${s.writes === 1 ? 'write' : 'writes'}.`,
    { tone: 'done' },
  )
}

/** Walk the "cur" inspector forward a known number of hops, narrating each one. */
function walk(r: Rec, start: string, hops: number, goal: string) {
  r.ptr('cur', start)
  r.step(
    'cur',
    'Send the inspector in',
    `The inspector climbs aboard ${r.w(start)}. There is no way to jump along a train, so walking wagon by wagon is the only option.`,
    `cur now holds ${r.a(start)}. Goal: ${goal}.`,
    { tone: 'walk', nodes: [start] },
  )
  let c = start
  for (let i = 0; i < hops; i++) {
    const nx = r.n(c).next!
    r.hop('cur', nx)
    r.step(
      'adv',
      `Hop ${i + 1} of ${hops}`,
      `The inspector reads the coupling on ${r.w(c)} and steps across to ${r.w(nx)}.`,
      `cur = cur.next reads ${r.a(nx)} out of the node at ${r.a(c)}.`,
      { tone: 'walk', nodes: [nx] },
    )
    c = nx
  }
  return c
}

function guardEmpty(r: Rec) {
  r.step(
    'guard',
    'Stop: the train is empty',
    'There are no wagons here. A careful yard master checks before reaching for a coupling.',
    'Without this guard the next line would dereference NULL and crash. Always handle the empty list first.',
    { tone: 'warn' },
  )
  r.step(undefined, 'Nothing changed', 'The track stays empty.', 'The function returned early.', { tone: 'done' })
}

// ---------------- singly ----------------

function sTraverse(r: Rec) {
  r.use('s.traverse')
  const head = r.s.entry
  r.ptr('cur', head)
  r.step('cur', 'Inspector starts at the engine', head ? `The engine is coupled to ${r.w(head)}, so that is where the inspector starts.` : 'The engine is coupled to nothing, so there is nowhere to go.', `cur = head copies the address ${r.a(head)}. head itself is never touched.`, { tone: 'walk', nodes: head ? [head] : [] })
  const seen: string[] = []
  let c = head
  while (c) {
    seen.push(r.n(c).value)
    r.step('visit', `Visit wagon ${r.n(c).value}`, `The inspector checks the cargo: ${r.n(c).value}. Seen so far: ${seen.join(' → ')}.`, `cur is not NULL, so the loop body runs and reads cur.val = ${r.n(c).value}.`, { tone: 'walk', nodes: [c] })
    const nx: string | null = r.n(c).next
    r.hop('cur', nx)
    r.step('adv', nx ? `Cross to wagon ${r.n(nx).value}` : 'Step off the end', nx ? `The inspector follows the coupling to ${r.w(nx)}.` : `${r.w(c)} has nothing coupled ahead of it. The inspector steps onto empty track.`, `cur = cur.next, which is ${r.a(nx)}.`, { tone: 'walk', nodes: nx ? [nx] : [] })
    c = nx
  }
  r.step('loop', 'Loop ends at NULL', 'Empty track means the end of the train.', 'cur == NULL makes the while condition false.')
  finish(r, `Visited ${seen.length} ${seen.length === 1 ? 'wagon' : 'wagons'}: O(n)`)
}

function sInsertBegin(r: Rec, v: string) {
  r.use('s.insertBegin')
  const head = r.s.entry
  const w = r.make(v, { lane: 1, i: -0.5 })
  r.ptr('w', w)
  r.step('make', `Build wagon ${v} on the siding`, 'A new wagon rolls out on the side track. It is not part of the train yet, so nothing can break.', `new Node(${v}) reserves memory at ${r.a(w)}. The list itself is unchanged.`, { tone: 'make', nodes: [w] })
  r.setNext(w, head)
  r.step('link', head ? `Couple the new wagon to ${r.w(head)}` : 'New wagon has nothing to couple to', head ? `The new wagon grabs ${r.w(head)} first, while the engine still holds the train. No wagon can be lost.` : 'The track is empty, so its coupling stays open and points to NULL.', `w.next = head stores ${r.a(head)} inside the new node.`, { tone: 'link', nodes: [w] })
  r.setEntry(w)
  r.step('head', 'Re-couple the engine to the new wagon', head ? `The engine lets go of ${r.w(head)} and takes the new wagon. The old train is safe because the new wagon is holding it.` : 'The engine takes its first wagon.', `head = w overwrites head with ${r.a(w)}. This is why w.next had to be set first.`, { tone: 'link', nodes: [w] })
  finish(r, 'Inserted at the front: O(1)')
}

function sInsertEnd(r: Rec, v: string) {
  r.use('s.insertEnd')
  const head = r.s.entry
  const n = r.order().length
  const w = r.make(v, { lane: 1, i: n })
  r.ptr('w', w)
  r.step('make', `Build wagon ${v} on the siding`, 'The new wagon waits on the side track.', `new Node(${v}) at ${r.a(w)}, with next = NULL because it will be the last wagon.`, { tone: 'make', nodes: [w] })
  if (!head) {
    r.step('empty', 'The track is empty', 'No train exists, so the new wagon becomes the whole train.', 'head == NULL is true.')
    r.setEntry(w)
    r.step('emptyHead', 'Engine takes the new wagon', 'The engine couples straight to it.', `head = w = ${r.a(w)}.`, { tone: 'link', nodes: [w] })
    finish(r, 'First wagon placed: O(1)')
    return
  }
  const last = walk(r, head, n - 1, 'stop on the last wagon, where next is NULL')
  r.step('loop', 'Found the last wagon', `${r.w(last)} has an open coupling. Stop here, before stepping onto empty track.`, 'cur.next == NULL, so the loop ends with cur on the last node. A singly list has no shortcut to here.', { tone: 'walk', nodes: [last] })
  r.setNext(last, w)
  r.step('link', `Couple ${r.w(last)} to the new wagon`, 'One coupling joins the new wagon to the end.', `cur.next = w stores ${r.a(w)} in the last node.`, { tone: 'link', nodes: [w, last] })
  finish(r, `Inserted at the end: O(n), ${n - 1} ${n - 1 === 1 ? 'hop' : 'hops'} of walking`)
}

function sInsertAt(r: Rec, v: string, pos: number) {
  r.use('s.insertAt')
  const head = r.s.entry!
  const before = walk(r, head, pos - 1, `reach index ${pos - 1}, the wagon just before the new spot`)
  r.step('loop', `Stop one wagon early, at index ${pos - 1}`, `To splice after ${r.w(before)} the inspector must stand on it. A wagon's coupling can only be changed from that wagon.`, 'In a singly list you cannot reach backward, so you always stop at the node before the target.', { tone: 'walk', nodes: [before] })
  const after = r.n(before).next
  const w = r.make(v, { lane: 1, i: pos - 0.5 })
  r.ptr('w', w)
  r.step('make', `Build wagon ${v} on the siding`, 'The new wagon waits beside the gap it is going to fill.', `new Node(${v}) at ${r.a(w)}.`, { tone: 'make', nodes: [w] })
  r.setNext(w, after)
  r.step('link1', `First grab ${r.w(after)}`, `The new wagon couples to ${r.w(after)}. For a moment two wagons point at it, which is harmless.`, `w.next = cur.next copies ${r.a(after)}. Do this first: it saves the only path to the rest of the train.`, { tone: 'link', nodes: [w] })
  r.setNext(before, w)
  r.step('link2', `Then ${r.w(before)} takes the new wagon`, `${r.w(before)} lets go of ${r.w(after)} and couples to the new wagon. The splice is complete.`, 'cur.next = w. Two pointer writes, no matter how long the list is.', { tone: 'link', nodes: [w, before] })
  finish(r, `Inserted at index ${pos}: O(n) to walk, O(1) to splice`)
}

function sDeleteBegin(r: Rec) {
  r.use('s.deleteBegin')
  const head = r.s.entry
  if (!head) return guardEmpty(r)
  r.ptr('victim', head)
  r.step('victim', `Tag ${r.w(head)} for removal`, 'Tag the first wagon before touching anything, or we lose track of it and can never scrap it.', `victim = head keeps ${r.a(head)} so we can free it later.`, { tone: 'cut', nodes: [head] })
  const nx = r.n(head).next
  r.setEntry(nx)
  r.place(head, 1, 0)
  r.step('head', nx ? `Engine moves on to ${r.w(nx)}` : 'Engine now holds nothing', nx ? `The engine releases the first wagon and takes ${r.w(nx)}. The tagged wagon rolls to the siding.` : 'That was the only wagon, so the engine is now coupled to nothing.', `head = head.next, so head = ${r.a(nx)}.`, { tone: 'cut', nodes: [head] })
  r.free(head)
  r.step('free', 'Scrap the wagon', 'The wagon is dismantled and its track space is free.', 'delete returns that memory. Skip it in C++ and you have a leak. Java and Python collect it automatically once nothing points to it.', { tone: 'cut' })
  finish(r, 'Deleted the front wagon: O(1)')
}

function sDeleteEnd(r: Rec) {
  r.use('s.deleteEnd')
  const head = r.s.entry
  if (!head) return guardEmpty(r)
  if (!r.n(head).next) {
    r.step('one', 'Only one wagon', 'The first wagon is also the last. There is no wagon before it to update.', 'head.next == NULL, so this special case must change head.', { tone: 'warn', nodes: [head] })
    r.free(head)
    r.step('oneFree', 'Scrap it', 'The only wagon is dismantled.', 'delete head.', { tone: 'cut' })
    r.setEntry(null)
    r.step('oneHead', 'Engine stands alone', 'The engine is coupled to nothing.', 'head = NULL, otherwise head would be a dangling pointer.', { tone: 'link' })
    finish(r, 'The list is now empty')
    return
  }
  const n = r.order().length
  const before = walk(r, head, n - 2, 'stop on the second-to-last wagon')
  r.step('loop', 'Stop at the second-to-last wagon', `We must change the coupling on ${r.w(before)}, so standing on the last wagon would be too late. Looking two wagons ahead tells us when to stop.`, 'cur.next.next == NULL ends the loop one node early.', { tone: 'walk', nodes: [before] })
  const victim = r.n(before).next!
  r.ptr('victim', victim)
  r.step('victim', `Tag ${r.w(victim)}`, 'The last wagon is tagged for removal.', `victim = cur.next = ${r.a(victim)}.`, { tone: 'cut', nodes: [victim] })
  r.setNext(before, null)
  r.place(victim, 1, n - 1)
  r.step('link', 'Uncouple the last wagon', `${r.w(before)} lets go. It is the new last wagon and its coupling is open.`, 'cur.next = NULL marks the new end of the list.', { tone: 'cut', nodes: [before] })
  r.free(victim)
  r.step('free', 'Scrap the wagon', 'The tagged wagon is dismantled.', 'delete victim frees its memory.', { tone: 'cut' })
  finish(r, `Deleted the last wagon: O(n), ${n - 2} ${n - 2 === 1 ? 'hop' : 'hops'} of walking`)
}

function sDeleteAt(r: Rec, pos: number) {
  r.use('s.deleteAt')
  const head = r.s.entry!
  const before = walk(r, head, pos - 1, `stop at index ${pos - 1}, just before the wagon to remove`)
  r.step('loop', 'Stop one wagon early', `${r.w(before)} holds the coupling that must change, so the inspector stands there.`, 'Again, a singly list cannot look backward.', { tone: 'walk', nodes: [before] })
  const victim = r.n(before).next!
  r.ptr('victim', victim)
  r.step('victim', `Tag ${r.w(victim)}`, 'Tag the wagon first. We still need its coupling.', `victim = cur.next = ${r.a(victim)}.`, { tone: 'cut', nodes: [victim] })
  const after = r.n(victim).next
  r.setNext(before, after)
  r.place(victim, 1, pos)
  r.step('link', `Bypass ${r.w(victim)}`, `${r.w(before)} reaches over and couples to ${r.w(after)}. The tagged wagon is out of the train.`, `cur.next = victim.next = ${r.a(after)}. One pointer write removes a node.`, { tone: 'cut', nodes: [before, victim] })
  r.free(victim)
  r.step('free', 'Scrap the wagon', 'The bypassed wagon is dismantled.', 'delete victim. It had to be saved, because after the bypass nothing else points to it.', { tone: 'cut' })
  finish(r, `Deleted index ${pos}: O(n) to walk, O(1) to unlink`)
}

// ---------------- doubly ----------------

function dTraverse(r: Rec) {
  r.use('d.traverse')
  const head = r.s.entry
  const tail = r.s.pointers.tail
  r.ptr('cur', head)
  r.step('cur', 'Walk forward from the engine', 'The inspector starts at the first wagon and uses the yellow forward couplings.', `cur = head = ${r.a(head)}.`, { tone: 'walk', nodes: head ? [head] : [] })
  let c = head
  while (c) {
    const nx: string | null = r.n(c).next
    r.hop('cur', nx)
    r.step('adv', `Forward past wagon ${r.n(c).value}`, `Cargo ${r.n(c).value} checked. On to ${r.w(nx)}.`, `visit(${r.n(c).value}), then cur = cur.next = ${r.a(nx)}.`, { tone: 'walk', nodes: nx ? [nx] : [] })
    c = nx
  }
  r.ptr('cur', tail)
  r.step('curBack', 'Now walk backward from the tail', 'This is the doubly linked superpower: a second coupling on every wagon leads backward.', `cur = tail = ${r.a(tail)}.`, { tone: 'walk', nodes: tail ? [tail] : [] })
  c = tail
  while (c) {
    const pv: string | null = r.n(c).prev
    r.hop('cur', pv)
    r.step('advBack', `Backward past wagon ${r.n(c).value}`, `Cargo ${r.n(c).value} checked. Back to ${r.w(pv)}.`, `visit(${r.n(c).value}), then cur = cur.prev = ${r.a(pv)}.`, { tone: 'walk', nodes: pv ? [pv] : [] })
    c = pv
  }
  finish(r, 'Walked both directions: O(n)')
}

function dInsertBegin(r: Rec, v: string) {
  r.use('d.insertBegin')
  const head = r.s.entry
  const w = r.make(v, { lane: 1, i: -0.5 })
  r.ptr('w', w)
  r.step('make', `Build wagon ${v} on the siding`, 'This wagon has two couplings: forward in yellow, backward in coral. Both start open.', `new Node(${v}) at ${r.a(w)}, with next = prev = NULL.`, { tone: 'make', nodes: [w] })
  r.setNext(w, head)
  r.step('link', 'Forward coupling first', head ? `The new wagon grabs ${r.w(head)}.` : 'Nothing to grab yet.', `w.next = head = ${r.a(head)}.`, { tone: 'link', nodes: [w] })
  if (head) {
    r.setPrev(head, w)
    r.step('linkBack', 'Backward coupling second', `${r.w(head)} now points back at the new wagon. Each link in a doubly list needs both directions.`, 'head.prev = w. Forget this and backward walks skip the new node.', { tone: 'link', nodes: [head] })
  } else {
    r.ptr('tail', w)
    r.step('tail', 'The tail lamp goes on it too', 'The only wagon is both first and last.', 'head was NULL, so tail = w.', { tone: 'link', nodes: [w] })
  }
  r.setEntry(w)
  r.step('head', 'Engine takes the new wagon', 'The engine couples to the new front.', `head = w = ${r.a(w)}.`, { tone: 'link', nodes: [w] })
  finish(r, 'Inserted at the front: O(1)')
}

function dInsertEnd(r: Rec, v: string) {
  r.use('d.insertEnd')
  const tail = r.s.pointers.tail
  const n = r.order().length
  const w = r.make(v, { lane: 1, i: n })
  r.ptr('w', w)
  r.step('make', `Build wagon ${v} on the siding`, 'The new wagon waits near the tail lamp. No walking needed: we already know where the tail is.', `new Node(${v}) at ${r.a(w)}.`, { tone: 'make', nodes: [w] })
  r.setPrev(w, tail)
  r.step('link', 'Point back at the current tail', tail ? `The new wagon couples backward to ${r.w(tail)}.` : 'No tail exists yet.', `w.prev = tail = ${r.a(tail)}.`, { tone: 'link', nodes: [w] })
  if (tail) {
    r.setNext(tail, w)
    r.step('linkBack', 'Old tail couples forward', `${r.w(tail)} couples forward to the new wagon.`, 'tail.next = w.', { tone: 'link', nodes: [tail] })
  } else {
    r.setEntry(w)
    r.step('head', 'Engine takes it', 'The empty train gets its first wagon.', 'head = w.', { tone: 'link', nodes: [w] })
  }
  r.ptr('tail', w)
  r.step('tail', 'Move the tail lamp', 'The lamp moves to the new last wagon.', `tail = w = ${r.a(w)}.`, { tone: 'link', nodes: [w] })
  finish(r, 'Inserted at the end: O(1), with zero walking')
}

function dInsertAt(r: Rec, v: string, pos: number) {
  r.use('d.insertAt')
  const head = r.s.entry!
  const at = walk(r, head, pos, `stand on the wagon now at index ${pos}`)
  const before = r.n(at).prev!
  const w = r.make(v, { lane: 1, i: pos - 0.5 })
  r.ptr('w', w)
  r.step('make', `Build wagon ${v} on the siding`, `It will go between ${r.w(before)} and ${r.w(at)}.`, `new Node(${v}) at ${r.a(w)}. A doubly splice takes exactly four writes.`, { tone: 'make', nodes: [w] })
  r.setPrev(w, before)
  r.step('w1', 'Write 1 of 4: new wagon points back', `The new wagon couples back to ${r.w(before)}.`, `w.prev = cur.prev = ${r.a(before)}.`, { tone: 'link', nodes: [w] })
  r.setNext(w, at)
  r.step('w2', 'Write 2 of 4: new wagon points forward', `The new wagon couples forward to ${r.w(at)}. It is fully wired, and the train is still intact.`, `w.next = cur = ${r.a(at)}. The two writes that only touch w are always safe.`, { tone: 'link', nodes: [w] })
  r.setNext(before, w)
  r.step('w3', 'Write 3 of 4: left neighbour lets it in', `${r.w(before)} now couples forward to the new wagon.`, 'cur.prev.next = w. It must run before write 4, which overwrites cur.prev.', { tone: 'link', nodes: [before] })
  r.setPrev(at, w)
  r.step('w4', 'Write 4 of 4: right neighbour lets it in', `${r.w(at)} now couples backward to the new wagon. Spliced.`, 'cur.prev = w.', { tone: 'link', nodes: [at] })
  finish(r, `Inserted at index ${pos}: O(n) to walk, four writes to splice`)
}

function dDeleteBegin(r: Rec) {
  r.use('d.deleteBegin')
  const head = r.s.entry
  if (!head) return guardEmpty(r)
  r.ptr('victim', head)
  r.step('victim', `Tag ${r.w(head)}`, 'Tag the first wagon.', `victim = head = ${r.a(head)}.`, { tone: 'cut', nodes: [head] })
  const nx = r.n(head).next
  r.setEntry(nx)
  r.step('head', 'Engine moves on', nx ? `The engine couples to ${r.w(nx)}.` : 'The engine holds nothing.', `head = head.next = ${r.a(nx)}.`, { tone: 'cut', nodes: nx ? [nx] : [] })
  if (nx) {
    r.setPrev(nx, null)
    r.place(head, 1, 0)
    r.step('link', 'New first wagon drops its backward coupling', `${r.w(nx)} stops pointing at the tagged wagon. The first wagon must have prev = NULL.`, 'head.prev = NULL. Forget it and prev dangles at freed memory.', { tone: 'cut', nodes: [nx] })
  } else {
    r.ptr('tail', null)
    r.place(head, 1, 0)
    r.step('tail', 'Tail lamp goes off', 'The train is empty, so no last wagon exists.', 'tail = NULL.', { tone: 'cut' })
  }
  r.free(head)
  r.step('free', 'Scrap the wagon', 'The tagged wagon is dismantled.', 'delete victim.', { tone: 'cut' })
  finish(r, 'Deleted the front wagon: O(1)')
}

function dDeleteEnd(r: Rec) {
  r.use('d.deleteEnd')
  const tail = r.s.pointers.tail
  if (!tail) return guardEmpty(r)
  const n = r.order().length
  r.ptr('victim', tail)
  r.step('victim', `Tag ${r.w(tail)}`, 'The tail lamp tells us exactly where the last wagon is. No walking.', `victim = tail = ${r.a(tail)}.`, { tone: 'cut', nodes: [tail] })
  const pv = r.n(tail).prev
  r.ptr('tail', pv)
  r.step('tail', 'Move the lamp backward', pv ? `The backward coupling leads straight to ${r.w(pv)}. A singly list would have to walk from the engine to find it.` : 'No wagon before it.', `tail = tail.prev = ${r.a(pv)}. This line is why doubly delete-at-end is O(1).`, { tone: 'cut', nodes: pv ? [pv] : [] })
  if (pv) {
    r.setNext(pv, null)
    r.place(tail, 1, n - 1)
    r.step('link', 'Uncouple', `${r.w(pv)} lets go and becomes the last wagon.`, 'tail.next = NULL.', { tone: 'cut', nodes: [pv] })
  } else {
    r.setEntry(null)
    r.place(tail, 1, n - 1)
    r.step('head', 'Engine stands alone', 'The train is empty.', 'head = NULL.', { tone: 'cut' })
  }
  r.free(tail)
  r.step('free', 'Scrap the wagon', 'The tagged wagon is dismantled.', 'delete victim.', { tone: 'cut' })
  finish(r, 'Deleted the last wagon: O(1), with zero walking')
}

function dDeleteAt(r: Rec, pos: number) {
  r.use('d.deleteAt')
  const head = r.s.entry!
  const at = walk(r, head, pos, `stand directly on the wagon at index ${pos}`)
  r.step('loop', 'Stand on the wagon itself', `Unlike a singly list, we can stand on ${r.w(at)}: its two couplings reach both neighbours.`, 'A doubly linked node knows both neighbours, so no "stop one early" is needed.', { tone: 'walk', nodes: [at] })
  const before = r.n(at).prev!
  const after = r.n(at).next!
  r.setNext(before, after)
  r.step('w1', 'Left neighbour bypasses it', `${r.w(before)} couples forward to ${r.w(after)}.`, `cur.prev.next = cur.next = ${r.a(after)}.`, { tone: 'cut', nodes: [before] })
  r.setPrev(after, before)
  r.place(at, 1, pos)
  r.step('w2', 'Right neighbour bypasses it', `${r.w(after)} couples backward to ${r.w(before)}. The wagon is out of the train.`, `cur.next.prev = cur.prev = ${r.a(before)}.`, { tone: 'cut', nodes: [after] })
  r.free(at)
  r.step('free', 'Scrap the wagon', 'The wagon is dismantled.', 'delete cur.', { tone: 'cut' })
  finish(r, `Deleted index ${pos}: O(n) to walk, two writes to unlink`)
}

// ---------------- circular ----------------

function cTraverse(r: Rec) {
  r.use('c.traverse')
  const tail = r.s.entry
  if (!tail) return guardEmpty(r)
  const first = r.n(tail).next!
  r.ptr('cur', first)
  r.step('cur', 'Inspector boards the first wagon', 'On a loop there is no end of track. The signal cabin knows the tail, and the tail couples to the first wagon.', `cur = tail.next = ${r.a(first)}.`, { tone: 'walk', nodes: [first] })
  let c = first
  for (;;) {
    r.step('visit', `Visit wagon ${r.n(c).value}`, `Cargo ${r.n(c).value} checked.`, `visit(cur.val = ${r.n(c).value}).`, { tone: 'walk', nodes: [c] })
    if (c === tail) break
    const nx: string = r.n(c).next!
    r.hop('cur', nx)
    r.step('adv', `Cross to wagon ${r.n(nx).value}`, `The inspector moves round the loop to ${r.w(nx)}.`, `cur = cur.next = ${r.a(nx)}.`, { tone: 'walk', nodes: [nx] })
    c = nx
  }
  r.step('stop', 'Stop at the tail', 'If the inspector kept walking they would circle forever. There is no NULL to stop them.', 'cur == tail breaks the loop. Testing cur == NULL here would be an infinite loop.', { tone: 'warn', nodes: [c] })
  finish(r, 'Completed one lap: O(n)')
}

function cMakeOnEmpty(r: Rec, w: string) {
  r.step('empty', 'The loop is empty', 'This will be the only wagon.', 'tail == NULL is true.')
  r.setNext(w, w)
  r.step('self', 'It couples to itself', 'A loop of one: the wagon holds its own tail.', 'w.next = w. In a circular list next is never NULL.', { tone: 'link', nodes: [w] })
  r.setEntry(w)
  r.step('tailEmpty', 'Signal cabin records it', 'The cabin now tracks this wagon.', `tail = w = ${r.a(w)}.`, { tone: 'link', nodes: [w] })
  finish(r, 'First wagon placed: O(1)')
}

function cInsertBegin(r: Rec, v: string) {
  r.use('c.insertBegin')
  const tail = r.s.entry
  const w = r.make(v, { lane: 1, i: -0.5 })
  r.ptr('w', w)
  r.step('make', `Build wagon ${v} outside the loop`, 'The new wagon waits between the last and first wagons.', `new Node(${v}) at ${r.a(w)}.`, { tone: 'make', nodes: [w] })
  if (!tail) return cMakeOnEmpty(r, w)
  const first = r.n(tail).next!
  r.setNext(w, first)
  r.step('link', `New wagon grabs ${r.w(first)}`, 'It couples to the current first wagon, keeping the path safe.', `w.next = tail.next = ${r.a(first)}.`, { tone: 'link', nodes: [w] })
  r.setNext(tail, w)
  r.step('close', 'Tail closes the loop through it', `${r.w(tail)} now couples to the new wagon, which makes it the first wagon. The tail reference did not move.`, 'tail.next = w. Knowing the tail gives O(1) at the front too.', { tone: 'link', nodes: [w, tail] })
  finish(r, 'Inserted at the front: O(1)')
}

function cInsertEnd(r: Rec, v: string) {
  r.use('c.insertEnd')
  const tail = r.s.entry
  const n = r.order().length
  const w = r.make(v, { lane: 1, i: n - 0.5 })
  r.ptr('w', w)
  r.step('make', `Build wagon ${v} outside the loop`, 'The same spot as inserting at the front. On a loop the front and the end are neighbours.', `new Node(${v}) at ${r.a(w)}.`, { tone: 'make', nodes: [w] })
  if (!tail) return cMakeOnEmpty(r, w)
  const first = r.n(tail).next!
  r.setNext(w, first)
  r.step('link', `New wagon grabs ${r.w(first)}`, 'It couples to the first wagon.', `w.next = tail.next = ${r.a(first)}.`, { tone: 'link', nodes: [w] })
  r.setNext(tail, w)
  r.step('close', 'Old tail couples to it', `${r.w(tail)} couples to the new wagon.`, 'tail.next = w.', { tone: 'link', nodes: [w, tail] })
  r.setEntry(w)
  r.step('tail', 'Signal cabin moves to the new wagon', 'That one extra line is the entire difference from inserting at the front.', `tail = w = ${r.a(w)}.`, { tone: 'link', nodes: [w] })
  finish(r, 'Inserted at the end: O(1)')
}

function cInsertAt(r: Rec, v: string, pos: number) {
  r.use('c.insertAt')
  const first = r.n(r.s.entry!).next!
  const before = walk(r, first, pos - 1, `stop at index ${pos - 1}`)
  const after = r.n(before).next!
  const w = r.make(v, { lane: 1, i: pos - 0.5 })
  r.ptr('w', w)
  r.step('make', `Build wagon ${v} outside the loop`, `It waits beside the gap after ${r.w(before)}.`, `new Node(${v}) at ${r.a(w)}.`, { tone: 'make', nodes: [w] })
  r.setNext(w, after)
  r.step('link1', `First grab ${r.w(after)}`, 'The new wagon secures the rest of the loop.', `w.next = cur.next = ${r.a(after)}.`, { tone: 'link', nodes: [w] })
  r.setNext(before, w)
  r.step('link2', `${r.w(before)} takes the new wagon`, 'The splice is complete.', 'cur.next = w.', { tone: 'link', nodes: [w, before] })
  finish(r, `Inserted at index ${pos}: O(n) to walk, O(1) to splice`)
}

function cDeleteBegin(r: Rec) {
  r.use('c.deleteBegin')
  const tail = r.s.entry
  if (!tail) return guardEmpty(r)
  const first = r.n(tail).next!
  r.ptr('victim', first)
  r.step('victim', `Tag ${r.w(first)}`, 'The first wagon sits right after the tail.', `first = tail.next = ${r.a(first)}.`, { tone: 'cut', nodes: [first] })
  if (first === tail) {
    r.step('one', 'Only one wagon', 'It is coupled to itself.', 'first == tail, so the special case applies.', { tone: 'warn', nodes: [first] })
    r.setEntry(null)
    r.step('oneTail', 'Signal cabin clears', 'The loop is empty.', 'tail = NULL.', { tone: 'cut' })
  } else {
    const second = r.n(first).next
    r.setNext(tail, second)
    r.place(first, 1, 0)
    r.step('link', `Tail skips to ${r.w(second)}`, 'The tail bypasses the tagged wagon and closes the loop again.', `tail.next = first.next = ${r.a(second)}.`, { tone: 'cut', nodes: [tail] })
  }
  r.free(first)
  r.step('free', 'Scrap the wagon', 'The tagged wagon is dismantled.', 'delete first.', { tone: 'cut' })
  finish(r, 'Deleted the front wagon: O(1)')
}

function cDeleteEnd(r: Rec) {
  r.use('c.deleteEnd')
  const tail = r.s.entry
  if (!tail) return guardEmpty(r)
  const n = r.order().length
  r.ptr('victim', tail)
  r.step('victim', `Tag ${r.w(tail)}`, 'We know where the last wagon is, but we still need the wagon before it.', `last = tail = ${r.a(tail)}.`, { tone: 'cut', nodes: [tail] })
  if (r.n(tail).next === tail) {
    r.step('one', 'Only one wagon', 'It is coupled to itself.', 'last.next == last.', { tone: 'warn', nodes: [tail] })
    r.setEntry(null)
    r.step('oneTail', 'Signal cabin clears', 'The loop is empty.', 'tail = NULL.', { tone: 'cut' })
  } else {
    const before = walk(r, r.n(tail).next!, n - 2, 'stop on the wagon just before the tail')
    r.step('loop', 'Found the wagon before the tail', 'One-way couplings mean a full walk around the loop. This is the one O(n) end operation here.', 'cur.next == tail ends the loop.', { tone: 'walk', nodes: [before] })
    const first = r.n(tail).next
    r.setNext(before, first)
    r.place(tail, 1, n - 1)
    r.step('link', 'Close the loop around it', `${r.w(before)} couples to ${r.w(first)}.`, `cur.next = tail.next = ${r.a(first)}.`, { tone: 'cut', nodes: [before] })
    r.setEntry(before)
    r.step('tail', 'Signal cabin moves back', `${r.w(before)} is the new tail.`, 'tail = cur.', { tone: 'link', nodes: [before] })
  }
  r.free(tail)
  r.step('free', 'Scrap the wagon', 'The tagged wagon is dismantled.', 'delete last.', { tone: 'cut' })
  finish(r, 'Deleted the last wagon: O(n)')
}

function cDeleteAt(r: Rec, pos: number) {
  r.use('c.deleteAt')
  const first = r.n(r.s.entry!).next!
  const before = walk(r, first, pos - 1, `stop at index ${pos - 1}`)
  const victim = r.n(before).next!
  r.ptr('victim', victim)
  r.step('victim', `Tag ${r.w(victim)}`, 'Tag it before cutting.', `victim = cur.next = ${r.a(victim)}.`, { tone: 'cut', nodes: [victim] })
  const after = r.n(victim).next
  r.setNext(before, after)
  r.place(victim, 1, pos)
  r.step('link', `Bypass ${r.w(victim)}`, `${r.w(before)} couples to ${r.w(after)}.`, `cur.next = victim.next = ${r.a(after)}.`, { tone: 'cut', nodes: [before] })
  r.free(victim)
  r.step('free', 'Scrap the wagon', 'The wagon is dismantled.', 'delete victim.', { tone: 'cut' })
  finish(r, `Deleted index ${pos}: O(n) to walk, O(1) to unlink`)
}

// ---------------- dispatch ----------------

/** Positions at the edges are the begin/end routines, and the lab says so. */
function normalise(op: Op, pos: number, n: number): { op: Op; note?: string } {
  if (op === 'insertAt') {
    if (pos === 0) return { op: 'insertBegin', note: 'Position 0 is the front, so this runs insert-at-beginning.' }
    if (pos === n) return { op: 'insertEnd', note: `Position ${n} is just past the last wagon, so this runs insert-at-end.` }
  }
  if (op === 'deleteAt') {
    if (pos === 0) return { op: 'deleteBegin', note: 'Position 0 is the front, so this runs delete-at-beginning.' }
    if (pos === n - 1) return { op: 'deleteEnd', note: `Position ${pos} is the last wagon, so this runs delete-at-end.` }
  }
  return { op }
}

export function listLength(snap: Snap) {
  return new Rec(snap).order().length
}

export function run(snap: Snap, op: Op, value: string, pos: number): Step[] {
  const r = new Rec(snap)
  const n = r.order().length
  const norm = normalise(op, pos, n)
  if (norm.note) {
    r.step(undefined, 'This position is a special case', norm.note, 'Handling edge positions separately avoids dereferencing a missing previous node.')
  }
  const f = {
    singly: { traverse: sTraverse, insertBegin: sInsertBegin, insertEnd: sInsertEnd, insertAt: sInsertAt, deleteBegin: sDeleteBegin, deleteEnd: sDeleteEnd, deleteAt: sDeleteAt },
    doubly: { traverse: dTraverse, insertBegin: dInsertBegin, insertEnd: dInsertEnd, insertAt: dInsertAt, deleteBegin: dDeleteBegin, deleteEnd: dDeleteEnd, deleteAt: dDeleteAt },
    circular: { traverse: cTraverse, insertBegin: cInsertBegin, insertEnd: cInsertEnd, insertAt: cInsertAt, deleteBegin: cDeleteBegin, deleteEnd: cDeleteEnd, deleteAt: cDeleteAt },
  }[snap.kind][norm.op] as (r: Rec, a?: string | number, b?: number) => void
  if (norm.op === 'insertAt') f(r, value, pos)
  else if (norm.op === 'deleteAt') f(r, pos)
  else if (norm.op.startsWith('insert')) f(r, value)
  else f(r)
  return r.steps
}

/** Build a ready-made list directly from values. */
export function buildSnap(kind: Kind, values: string[]): Snap {
  const r = new Rec(emptySnap(kind))
  const ids = values.map((v, i) => r.make(v, { lane: 0, i }))
  ids.forEach((id, i) => {
    r.n(id).next = ids[i + 1] ?? (kind === 'circular' ? ids[0] : null)
    if (kind === 'doubly') r.n(id).prev = ids[i - 1] ?? null
  })
  if (ids.length) r.s.entry = kind === 'circular' ? ids[ids.length - 1] : ids[0]
  if (kind === 'doubly') r.s.pointers.tail = ids[ids.length - 1] ?? null
  if (kind === 'circular') r.s.pointers['tail.next'] = ids[0] ?? null
  return r.s
}
