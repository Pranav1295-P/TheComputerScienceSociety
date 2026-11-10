// Step-by-step 3D walkthroughs for interview problems, on the same engine.
import { buildSnap } from './ops'
import { Rec, emptySnap, type Step } from './rec'

const list = (vals: string[]) => new Rec(buildSnap('singly', vals))
const val = (r: Rec, id: string | null | undefined) => (id ? r.n(id).value : 'NULL')

function t206(): Step[] {
  const r = list(['1', '2', '3', '4', '5'])
  let prev: string | null = null
  let curr: string | null = r.s.entry
  r.ptr('prev', null)
  r.ptr('curr', curr)
  r.step(undefined, 'Two hands: prev and curr', 'We turn every coupling around, one wagon at a time. prev is the part already reversed.', 'prev = NULL, curr = head.', { tone: 'walk', nodes: curr ? [curr] : [] })
  while (curr) {
    const nxt: string | null = r.n(curr).next
    r.ptr('nxt', nxt)
    r.step(undefined, `Save the way forward from ${val(r, curr)}`, `Before turning this coupling around, remember where the rest of the train is: wagon ${val(r, nxt)}.`, 'nxt = curr.next. Without it the rest of the list would be lost.', { tone: 'walk', nodes: nxt ? [nxt] : [] })
    r.setNext(curr, prev)
    r.step(undefined, `Flip wagon ${val(r, curr)}'s coupling`, prev ? `It now points backward at wagon ${val(r, prev)}.` : 'It was the first wagon, so it becomes the new end and points to NULL.', 'curr.next = prev.', { tone: 'link', nodes: [curr] })
    r.hop('prev', curr)
    r.hop('curr', nxt)
    prev = curr
    curr = nxt
    r.step(undefined, 'Both hands step forward', `The reversed part now ends at wagon ${val(r, prev)}.`, 'prev = curr; curr = nxt.', { tone: 'walk', nodes: prev ? [prev] : [] })
  }
  r.setEntry(prev)
  r.step(undefined, 'curr fell off the end, so prev is the new head', 'The engine re-couples to the old last wagon.', 'return prev.', { tone: 'link', nodes: prev ? [prev] : [] })
  r.drop('prev', 'curr', 'nxt')
  r.row(r.order())
  r.step(undefined, 'Reversed: O(n) time, O(1) space', 'Each coupling was turned exactly once.', `${r.s.writes - 1} pointer flips for ${r.s.writes - 1} nodes.`, { tone: 'done' })
  return r.steps
}

function t876(): Step[] {
  const r = list(['1', '2', '3', '4', '5'])
  let slow = r.s.entry!
  let fast: string | null = slow
  r.ptr('slow', slow)
  r.ptr('fast', fast)
  r.step(undefined, 'Two inspectors at the front', 'Slow walks one wagon per turn, and fast walks two. When fast reaches the end, slow has gone exactly half as far.', 'slow = fast = head.', { tone: 'walk', nodes: [slow] })
  while (fast && r.n(fast).next) {
    slow = r.n(slow).next!
    fast = r.n(r.n(fast).next!).next
    r.hop('slow', slow)
    r.hop('fast', fast)
    r.step(undefined, 'Slow +1, fast +2', `Slow is on wagon ${val(r, slow)}, fast is on ${val(r, fast)}.`, 'slow = slow.next; fast = fast.next.next.', { tone: 'walk', nodes: [slow] })
  }
  r.step(undefined, `Middle found: wagon ${val(r, slow)}`, 'Fast cannot take another double step, so slow is standing on the middle.', 'Loop condition: fast and fast.next. Even-length lists return the second middle.', { tone: 'done', nodes: [slow] })
  return r.steps
}

function cycleList() {
  const r = list(['3', '2', '0', '-4'])
  const ids = r.order()
  r.setNext(ids[3], ids[1])
  r.s.writes = 0
  r.step(undefined, 'A train that loops back on itself', 'Wagon -4 couples back to wagon 2. Anyone walking this train never reaches NULL.', 'A visited set would work but costs O(n) space. Two pointers cost O(1).', { tone: 'warn', nodes: [ids[3], ids[1]] })
  return { r, ids }
}

function chase(r: Rec, head: string) {
  let slow = head
  let fast = head
  r.ptr('slow', slow)
  r.ptr('fast', fast)
  r.step(undefined, 'Release a walker and a runner', 'On a looped track the runner must eventually come up behind the walker, like a faster runner lapping someone on a circuit.', 'slow = fast = head.', { tone: 'walk', nodes: [head] })
  for (;;) {
    slow = r.n(slow).next!
    fast = r.n(r.n(fast).next!).next!
    r.hop('slow', slow)
    r.hop('fast', fast)
    if (slow === fast) break
    r.step(undefined, 'Slow +1, fast +2', `Slow is on wagon ${val(r, slow)}, fast is on ${val(r, fast)}. Each turn the gap shrinks by one.`, 'The distance between them closes by exactly 1, so fast cannot jump over slow.', { tone: 'walk', nodes: [slow, fast] })
  }
  return slow
}

function t141(): Step[] {
  const { r, ids } = cycleList()
  const meet = chase(r, ids[0])
  r.step(undefined, `They meet on wagon ${val(r, meet)}: cycle confirmed`, 'Without a loop the runner would have reached empty track first.', 'slow == fast means a cycle exists. Time O(n), space O(1).', { tone: 'done', nodes: [meet] })
  return r.steps
}

function t142(): Step[] {
  const { r, ids } = cycleList()
  const meet = chase(r, ids[0])
  r.step(undefined, `They meet on wagon ${val(r, meet)}`, 'A cycle exists. The next question is where the loop begins.', 'Let a be the distance from head to the loop start. The maths shows a equals the distance from the meeting point onward to the loop start, modulo the loop length.', { tone: 'warn', nodes: [meet] })
  let a = ids[0]
  let b = meet
  r.ptr('slow', a)
  r.ptr('fast', b)
  r.step(undefined, 'Send one walker back to the front', 'Now both walk at the same speed, one wagon per turn.', 'slow = head; fast stays at the meeting point.', { tone: 'walk', nodes: [a, b] })
  while (a !== b) {
    a = r.n(a).next!
    b = r.n(b).next!
    r.hop('slow', a)
    r.hop('fast', b)
    r.step(undefined, 'Both +1', `Slow is on wagon ${val(r, a)}, fast is on ${val(r, b)}.`, 'slow = slow.next; fast = fast.next.', { tone: 'walk', nodes: [a, b] })
  }
  r.step(undefined, `The loop starts at wagon ${val(r, a)}`, 'They meet exactly where the loop begins.', 'return slow.', { tone: 'done', nodes: [a] })
  return r.steps
}

function t19(): Step[] {
  const r = list(['1', '2', '3', '4', '5'])
  const head = r.s.entry!
  const n = 2
  const dummy = r.make('D', { lane: 0, i: -1 }, { dummy: true })
  r.setNext(dummy, head)
  r.step(undefined, `Goal: remove the 2nd wagon from the end`, 'A dummy wagon goes in front, so even removing the first real wagon has a wagon before it.', 'dummy.next = head. A dummy removes the head special case.', { tone: 'make', nodes: [dummy] })
  let fast: string | null = dummy
  let slow = dummy
  r.ptr('slow', slow)
  r.ptr('fast', fast)
  r.step(undefined, 'Two inspectors, joined by a rope', `Fast walks ahead first until the gap is ${n + 1} wagons. Then the rope stays taut as both walk.`, `Gap = n + 1 = ${n + 1}, so slow stops one wagon before the target.`, { tone: 'walk', nodes: [dummy] })
  for (let i = 0; i <= n; i++) {
    fast = r.n(fast!).next
    r.hop('fast', fast)
    r.step(undefined, `Fast moves ahead (${i + 1} of ${n + 1})`, `Fast is on wagon ${val(r, fast)}.`, 'fast = fast.next.', { tone: 'walk', nodes: fast ? [fast] : [] })
  }
  while (fast) {
    fast = r.n(fast).next
    slow = r.n(slow).next!
    r.hop('fast', fast)
    r.hop('slow', slow)
    r.step(undefined, 'Both walk together', `Gap preserved. Slow is on wagon ${val(r, slow)}, fast is on ${val(r, fast)}.`, 'Move both until fast is NULL.', { tone: 'walk', nodes: [slow] })
  }
  const victim = r.n(slow).next!
  const idx = r.s.place[victim].i
  r.setNext(slow, r.n(victim).next)
  r.place(victim, 1, idx)
  r.step(undefined, `Bypass wagon ${val(r, victim)}`, `Slow is exactly one wagon before the target, so wagon ${val(r, slow)} reaches over it.`, 'slow.next = slow.next.next.', { tone: 'cut', nodes: [slow, victim] })
  r.free(victim)
  r.free(dummy)
  r.drop('fast', 'slow')
  r.purge()
  r.row(r.order())
  r.step(undefined, 'Done in one pass: O(L) time, O(1) space', 'The dummy is removed and the train re-forms.', 'return dummy.next.', { tone: 'done' })
  return r.steps
}

function t21(): Step[] {
  const r = new Rec(emptySnap('singly'))
  r.s.showEntry = false
  const mk = (vals: string[], lane: number) => {
    const ids = vals.map((v, i) => r.make(v, { lane, i: i + 1 }))
    ids.forEach((id, i) => (r.n(id).next = ids[i + 1] ?? null))
    return ids
  }
  const a = mk(['1', '2', '4'], -1)
  const b = mk(['1', '3', '4'], 1)
  const dummy = r.make('D', { lane: 0, i: 0 }, { dummy: true })
  let p1: string | null = a[0]
  let p2: string | null = b[0]
  let tail = dummy
  r.ptr('p1', p1)
  r.ptr('p2', p2)
  r.ptr('tail', tail)
  r.step(undefined, 'Two sorted trains and one dummy wagon', 'The new train forms on the middle track. Compare the two front wagons and take the smaller one.', 'dummy gives tail a place to start, so the first pick needs no special case.', { tone: 'make', nodes: [dummy] })
  let pos = 1
  while (p1 && p2) {
    const takeA: boolean = Number(r.n(p1).value) <= Number(r.n(p2).value)
    const pick: string = takeA ? p1 : p2
    const rest: string | null = r.n(pick).next
    r.setNext(tail, pick)
    r.place(pick, 0, pos++)
    if (takeA) { p1 = rest; r.hop('p1', p1) } else { p2 = rest; r.hop('p2', p2) }
    r.hop('tail', pick)
    tail = pick
    r.step(undefined, `Take wagon ${val(r, pick)} from the ${takeA ? 'top' : 'bottom'} train`, `It is the smaller front wagon (ties go to the top train), so it moves to the middle track.`, 'tail.next = smaller; advance that list and tail.', { tone: 'link', nodes: [pick] })
  }
  const left = p1 ?? p2
  r.setNext(tail, left)
  r.chain(left).forEach((id) => r.place(id, 0, pos++))
  r.step(undefined, 'One train ran out: attach the rest whole', 'The remaining wagons are already sorted, so a single coupling is enough.', 'tail.next = p1 or p2. No loop is needed.', { tone: 'link', nodes: left ? [left] : [] })
  r.s.showEntry = true
  r.setEntry(r.n(dummy).next)
  r.free(dummy)
  r.drop('p1', 'p2', 'tail')
  r.purge()
  r.row(r.order())
  r.step(undefined, 'Merged: O(m + n) time, O(1) extra space', 'No wagon was copied. Only couplings changed.', 'return dummy.next.', { tone: 'done' })
  return r.steps
}

function t83(): Step[] {
  const r = list(['1', '1', '2', '3', '3'])
  let cur = r.s.entry!
  r.ptr('cur', cur)
  r.step(undefined, 'The train is sorted, so duplicates are neighbours', 'The inspector only needs to compare a wagon with the one directly ahead.', 'cur = head.', { tone: 'walk', nodes: [cur] })
  while (r.n(cur).next) {
    const nx = r.n(cur).next!
    if (r.n(nx).value === r.n(cur).value) {
      const idx = r.s.place[nx].i
      r.setNext(cur, r.n(nx).next)
      r.place(nx, 1, idx)
      r.step(undefined, `Duplicate ${val(r, nx)}: bypass it`, 'The inspector stays put, because the new neighbour could be another duplicate.', 'cur.next = cur.next.next, and cur does not advance.', { tone: 'cut', nodes: [cur, nx] })
      r.free(nx)
    } else {
      cur = nx
      r.hop('cur', cur)
      r.step(undefined, `Different values: move to wagon ${val(r, cur)}`, 'Only advance once the next wagon is known to be different.', 'cur = cur.next.', { tone: 'walk', nodes: [cur] })
    }
  }
  r.drop('cur')
  r.purge()
  r.row(r.order())
  r.step(undefined, 'Duplicates removed: O(n) time, O(1) space', 'The train re-forms.', 'return head.', { tone: 'done' })
  return r.steps
}

function t24(): Step[] {
  const r = list(['1', '2', '3', '4'])
  const dummy = r.make('D', { lane: 0, i: -1 }, { dummy: true })
  r.setNext(dummy, r.s.entry)
  let prev = dummy
  r.ptr('prev', prev)
  r.step(undefined, 'Dummy wagon, then swap pairs', 'prev always stands just before the next pair.', 'dummy.next = head; prev = dummy.', { tone: 'make', nodes: [dummy] })
  while (r.n(prev).next && r.n(r.n(prev).next!).next) {
    const a: string = r.n(prev).next!
    const b: string = r.n(a).next!
    r.ptr('a', a)
    r.ptr('b', b)
    r.step(undefined, `Pair: wagons ${val(r, a)} and ${val(r, b)}`, 'Name both wagons before touching any coupling.', 'a = prev.next; b = a.next.', { tone: 'walk', nodes: [a, b] })
    r.setNext(a, r.n(b).next)
    r.step(undefined, 'a takes what comes after b', 'This saves the rest of the train first.', 'a.next = b.next.', { tone: 'link', nodes: [a] })
    r.setNext(b, a)
    r.step(undefined, 'b couples to a', 'The pair now faces the other way.', 'b.next = a.', { tone: 'link', nodes: [b] })
    r.setNext(prev, b)
    r.step(undefined, 'prev switches to b', 'The swapped pair joins the train.', 'prev.next = b.', { tone: 'link', nodes: [prev] })
    r.row(r.chain(dummy), 0, -1)
    r.hop('prev', a)
    prev = a
    r.drop('a', 'b')
    r.step(undefined, 'Move prev past the pair', `prev is on wagon ${val(r, prev)}, ready for the next pair.`, 'prev = a.', { tone: 'walk', nodes: [prev] })
  }
  r.setEntry(r.n(dummy).next)
  r.free(dummy)
  r.drop('prev')
  r.purge()
  r.row(r.order())
  r.step(undefined, 'Swapped: O(n) time, O(1) space', 'Couplings moved, while the cargo stayed in its wagons, which is what the problem demands.', 'return dummy.next.', { tone: 'done' })
  return r.steps
}

function t61(): Step[] {
  const r = list(['1', '2', '3', '4', '5'])
  const k = 2
  const head = r.s.entry!
  const ids = r.order()
  const n = ids.length
  let tail = head
  r.ptr('cur', tail)
  r.step(undefined, `Goal: rotate right by k = ${k}`, 'First walk the train to find its length and its last wagon.', 'tail = head; n = 1.', { tone: 'walk', nodes: [head] })
  for (let i = 1; i < n; i++) {
    tail = r.n(tail).next!
    r.hop('cur', tail)
  }
  r.step(undefined, `Length is ${n}`, `The inspector stops on wagon ${val(r, tail)}.`, `k %= n, so rotating ${n} times is a no-op. k stays ${k % n}.`, { tone: 'walk', nodes: [tail] })
  r.s.kind = 'circular'
  r.setNext(tail, head)
  r.step(undefined, 'Close the train into a ring', 'Now rotating is just choosing a different place to cut.', 'tail.next = head.', { tone: 'link', nodes: [tail, head] })
  let nt = head
  r.ptr('cur', nt)
  for (let i = 0; i < n - k - 1; i++) {
    nt = r.n(nt).next!
    r.hop('cur', nt)
    r.step(undefined, `Walk to the cut: ${i + 1} of ${n - k - 1}`, `The new last wagon is ${n - k - 1} hops from the front.`, 'new tail is at index n - k - 1.', { tone: 'walk', nodes: [nt] })
  }
  const nh = r.n(nt).next!
  r.setEntry(nh)
  r.step(undefined, `Engine moves to wagon ${val(r, nh)}`, 'The wagon after the cut is the new front.', 'newHead = newTail.next.', { tone: 'link', nodes: [nh] })
  r.setNext(nt, null)
  r.step(undefined, 'Cut the ring', 'One uncoupling opens the loop again.', 'newTail.next = NULL.', { tone: 'cut', nodes: [nt] })
  r.s.kind = 'singly'
  r.drop('cur')
  r.row(r.order())
  r.step(undefined, 'Rotated: O(n) time, O(1) space', 'The wagons kept their couplings except two.', 'return newHead.', { tone: 'done' })
  return r.steps
}

function t146(): Step[] {
  const r = new Rec(emptySnap('doubly'))
  r.s.showEntry = false
  r.drop('tail')
  const H = r.make('MRU', { lane: 0, i: 0 }, { dummy: true })
  const T = r.make('LRU', { lane: 0, i: 1 }, { dummy: true })
  r.n(H).next = T
  r.n(T).prev = H
  const cap = 2
  const map = new Map<string, string>()
  const ledger = () => [
    { label: 'capacity', value: String(cap) },
    { label: 'hash map', value: map.size ? [...map.keys()].map((k) => `${k} → ${r.a(map.get(k)!)}`).join(', ') : 'empty' },
  ]
  const reform = () => r.row(r.chain(H))
  const unlink = (x: string) => {
    const p = r.n(x).prev!
    const q = r.n(x).next!
    r.setNext(p, q)
    r.setPrev(q, p)
  }
  const front = (x: string) => {
    const f = r.n(H).next!
    r.setNext(x, f)
    r.setPrev(x, H)
    r.setPrev(f, x)
    r.setNext(H, x)
  }
  r.step(undefined, 'A depot with two guard wagons', 'Guards MRU and LRU never leave. Real wagons sit between them, most recently used at the left.', 'Hash map: key → node, for O(1) lookup. Doubly list: O(1) reordering. Sentinels remove edge cases.', { tone: 'make', ledger: ledger() })
  const put = (key: string, v: string) => {
    if (map.size === cap) {
      const lru = r.n(T).prev!
      r.step(undefined, 'Depot is full: find the eviction', `The wagon beside the LRU guard is ${r.w(lru)}, the least recently used. No search needed.`, 'victim = tail.prev.', { tone: 'warn', nodes: [lru], ledger: ledger() })
      unlink(lru)
      const k = [...map.entries()].find(([, id]) => id === lru)![0]
      map.delete(k)
      r.place(lru, 1, r.s.place[lru].i)
      r.step(undefined, `Evict key ${k}`, 'Neighbours bypass it, then the map entry goes too. The node stores its key so we can find that entry.', 'remove(victim); map.erase(victim.key).', { tone: 'cut', nodes: [lru], ledger: ledger() })
      r.free(lru)
      r.purge()
      reform()
    }
    const x = r.make(`${key}:${v}`, { lane: 1, i: 0.5 })
    r.step(undefined, `put(${key}, ${v})`, 'A new wagon is built on the siding.', 'Node stores key and value.', { tone: 'make', nodes: [x], ledger: ledger() })
    front(x)
    map.set(key, x)
    r.step(undefined, 'Couple it right after MRU', 'Four couplings, regardless of depot size.', 'addToFront(node); map[key] = node.', { tone: 'link', nodes: [x], ledger: ledger() })
    reform()
    r.step(undefined, 'Depot re-forms', 'Left means recently used.', 'Most recent is at the head side.', { ledger: ledger() })
  }
  const get = (key: string) => {
    const x = map.get(key)
    if (!x) {
      r.step(undefined, `get(${key}) returns -1`, 'The map has no record of this key.', 'Not in map, so return -1 without touching the list.', { tone: 'warn', ledger: ledger() })
      return
    }
    r.step(undefined, `get(${key}) finds it instantly`, 'The map goes straight to the wagon, with no walking.', 'node = map[key]. O(1).', { tone: 'walk', nodes: [x], ledger: ledger() })
    unlink(x)
    front(x)
    reform()
    r.step(undefined, 'Move it to the most-recent spot', 'Because it was just used, it moves next to MRU. This needs the backward coupling: a singly list could not unlink it in O(1).', 'remove(node); addToFront(node).', { tone: 'link', nodes: [x], ledger: ledger() })
  }
  put('1', 'A')
  put('2', 'B')
  get('1')
  put('3', 'C')
  get('2')
  r.step(undefined, 'Every operation was O(1)', 'The map finds wagons, and the double couplings reorder them.', 'Hash map + doubly linked list is the standard LRU design.', { tone: 'done', ledger: ledger() })
  return r.steps
}

export const TRACES: Partial<Record<number, () => Step[]>> = {
  206: t206,
  876: t876,
  141: t141,
  142: t142,
  19: t19,
  21: t21,
  83: t83,
  24: t24,
  61: t61,
  146: t146,
}
