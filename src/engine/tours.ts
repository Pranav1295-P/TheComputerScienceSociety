import { buildSnap } from './ops'
import { Rec, emptySnap, type Step } from './rec'

export interface Tour {
  id: string
  title: string
  idea: string
  notice: string[]
  build: () => Step[]
}

function anatomy() {
  const r = new Rec(emptySnap('singly'))
  r.step(undefined, 'An empty track and one engine', 'This engine is our only way into the train. Right now it is coupled to nothing.', 'head = NULL. An empty linked list is just one pointer holding nothing.')
  const a = r.make('7', { lane: 0, i: 0 })
  r.step(undefined, 'A wagon is a node', 'Every wagon carries two things: cargo (the number on its plate) and a coupling that can hold on to another wagon.', `struct Node { int val; Node* next; }. This node lives at address ${r.a(a)}, holds val = 7, and next = NULL.`, { tone: 'make', nodes: [a] })
  r.setEntry(a)
  r.step(undefined, 'The engine couples to it', 'The green coupling joins the engine to the first wagon.', `head = ${r.a(a)}. A pointer is just a variable that stores an address.`, { tone: 'link', nodes: [a] })
  const b = r.make('12', { lane: 0, i: 1 })
  r.step(undefined, 'A second wagon appears', 'It is standing on the track, but nothing connects it to the train. Being nearby means nothing.', `A node at ${r.a(b)} exists, yet no pointer leads to it, so the list still has one element.`, { tone: 'make', nodes: [b] })
  r.setNext(a, b)
  r.step(undefined, 'A coupling makes it part of the train', 'Wagon 7 grabs wagon 12. The yellow pipe carries pulses in the only direction that coupling can be followed.', `a.next = ${r.a(b)}. That stored address is the entire "link" in linked list.`, { tone: 'link', nodes: [a, b] })
  r.step(undefined, 'NULL marks the end', 'Wagon 12 has an open coupling, the NULL stub at the end of the train.', 'next == NULL is how code knows it has reached the end.', { tone: 'done', nodes: [b] })
  return r.steps
}

function memory() {
  const r = new Rec(buildSnap('singly', ['10', '20', '30', '40']))
  r.step(undefined, 'The tidy picture is a convenience', 'On the track, the wagons stand neatly in order.', 'Diagrams draw lists in a row, but that is not how they sit in memory.', { view: 'track' })
  r.step(undefined, 'The truth: wagons are parked anywhere', 'Here is the real rail yard. Each numbered bay is a memory address, and the wagons are parked wherever a bay was free.', 'Each new Node goes wherever the allocator found space. Neighbours in the list are rarely neighbours in memory.', { view: 'memory' })
  const ids = r.order()
  r.step(undefined, 'Couplings are long-distance', 'Follow the yellow cables. They are the only thing that gives the wagons an order.', `Order comes only from stored addresses: ${ids.map((i) => r.a(i)).join(' → ')}.`, { view: 'memory', tone: 'link', nodes: ids })
  r.step(undefined, 'Why there is no train[3]', 'An array is like seats numbered in one long carriage: seat 3 is at a known distance. Wagons have no such guarantee, so you cannot calculate where the fourth wagon is.', 'Array: address = base + i × size, which is O(1). Linked list: follow i pointers, which is O(n).', { view: 'memory', tone: 'warn' })
  r.step(undefined, 'What you get in return', 'Adding a wagon never disturbs the others. An array would have to shuffle every seat after the insertion point.', 'Once you are at the spot, insert and delete are O(1). Arrays need O(n) shifts. There is also no resizing.', { view: 'track', tone: 'done' })
  return r.steps
}

function headDoor() {
  const r = new Rec(buildSnap('singly', ['4', '8', '15', '16']))
  const ids = r.order()
  r.step(undefined, 'The engine holds the whole train', 'The program does not store four wagons. It stores one thing: the engine\'s coupling to the first wagon.', `A list variable is just head = ${r.a(ids[0])}. Everything else is reached from there.`, { nodes: [ids[0]] })
  r.setEntry(null)
  ids.forEach((id) => (r.n(id).lost = true))
  r.step(undefined, 'Now drop that one coupling', 'The wagons are still physically there, but no one can ever find them again. They turn red: lost.', 'head = NULL with no other reference leaves all four nodes unreachable. In C++ that is a memory leak.', { tone: 'cut' })
  r.setEntry(ids[0])
  ids.forEach((id) => delete r.n(id).lost)
  r.step(undefined, 'Time rewound: the train is safe again', 'Lesson: before changing a coupling, ask who else can still reach the wagons behind it.', 'Rule: never overwrite a pointer until the nodes it leads to are reachable some other way.', { tone: 'done' })
  return r.steps
}

function traversal() {
  const r = new Rec(buildSnap('singly', ['3', '6', '9', '12']))
  const ids = r.order()
  r.ptr('cur', ids[0])
  r.step(undefined, 'Meet the inspector', 'The inspector is a temporary pointer. Sending them walking leaves the engine\'s coupling alone.', 'Node* cur = head. Walk with a copy. If you walk with head itself you lose the front of the list.', { tone: 'walk', nodes: [ids[0]] })
  ids.forEach((id, k) => {
    const nx = ids[k + 1] ?? null
    r.hop('cur', nx)
    r.step(undefined, nx ? `Follow the coupling to wagon ${r.n(nx).value}` : 'Step off onto empty track', nx ? `Standing on ${r.w(id)}, the only thing the inspector can see is the coupling to the next wagon.` : 'The coupling was open, so the walk is over.', `cur = cur->next. Hop ${k + 1}: cur = ${r.a(nx)}.`, { tone: 'walk', nodes: nx ? [nx] : [] })
  })
  r.step(undefined, 'Why this costs O(n)', 'To reach the last wagon the inspector had to pass through all of them. No shortcut exists.', 'n nodes means up to n hops. while (cur != NULL) is the pattern behind almost every list algorithm.', { tone: 'done' })
  r.drop('cur')
  return r.steps
}

function orderTrap() {
  const r = new Rec(buildSnap('singly', ['10', '20', '30', '40']))
  const [, b, c, d] = r.order()
  r.ptr('cur', b)
  const w = r.make('99', { lane: 1, i: 1.5 })
  r.ptr('w', w)
  r.step(undefined, 'The task: put 99 between 20 and 30', 'The inspector stands on wagon 20 and wagon 99 waits on the siding. Two couplings must be set. Does the order matter?', 'Need: w->next = cur->next and cur->next = w.', { tone: 'make', nodes: [b, w] })
  r.setNext(b, w)
  r.n(c).lost = true
  r.n(d).lost = true
  r.step(undefined, 'Wrong order: cur->next = w first', 'Wagon 20 let go of wagon 30 to grab 99. Wagons 30 and 40 now have nobody holding them.', 'cur->next was the only stored address of node 30, and it has just been overwritten.', { tone: 'cut', nodes: [c, d] })
  r.step(undefined, 'Too late to finish the job', 'Wagon 99 should now couple to wagon 30, but where is it? The only record of its location is gone.', 'w->next = cur->next would now set w->next = w, a cycle to itself, and the tail is lost.', { tone: 'warn', nodes: [w] })
  r.setNext(b, c)
  delete r.n(c).lost
  delete r.n(d).lost
  r.step(undefined, 'Rewind. This time, in the right order', 'Same wagons, same two couplings, opposite order.', 'The rule: connect the new node first, then break the old link.', { nodes: [b, w] })
  r.setNext(w, c)
  r.step(undefined, 'Right order, step 1: the new wagon grabs 30', 'Wagon 99 takes hold of 30. For a moment both 20 and 99 are holding it, and that is perfectly safe.', 'w->next = cur->next.', { tone: 'link', nodes: [w, c] })
  r.setNext(b, w)
  r.step(undefined, 'Right order, step 2: wagon 20 switches to 99', 'Now wagon 20 can let go, because 30 is safe.', 'cur->next = w.', { tone: 'link', nodes: [b, w] })
  r.drop('cur', 'w')
  r.row(r.order())
  r.step(undefined, 'Remember this forever', 'Grab the new wagon\'s far side first. Let go last.', 'New node\'s pointers first, existing nodes\' pointers after. It prevents most linked list bugs.', { tone: 'done' })
  return r.steps
}

function family() {
  const r = new Rec(buildSnap('singly', ['A', 'B', 'C', 'D']))
  const ids = r.order()
  r.step(undefined, 'Singly linked: one-way couplings', 'Each wagon can only reach the wagon ahead. An inspector on C can never get back to B.', 'Node { val, next }. It uses the least memory, but only moves forward.', { nodes: ids })
  r.s.kind = 'doubly'
  ids.forEach((id, k) => { if (k) r.setPrev(id, ids[k - 1]) })
  r.ptr('tail', ids[3])
  r.step(undefined, 'Doubly linked: add a backward coupling', 'Every wagon gains a coral coupling to the wagon behind it. A tail lamp marks the last wagon, so both ends are instantly reachable.', 'Node { val, next, prev }. One extra pointer per node buys O(1) work at both ends and O(1) deletion given a node.', { tone: 'link', nodes: ids })
  ids.forEach((id, k) => { if (k) r.setPrev(id, null) })
  r.drop('tail')
  r.s.kind = 'circular'
  r.setNext(ids[3], ids[0])
  r.step(undefined, 'Circular linked: close the loop', 'The last wagon couples back to the first, and the track becomes a ring. There is no end, so there is no NULL.', 'tail->next = head. Good for round-robin scheduling and looping playlists. Loops must stop by comparing nodes, not by testing for NULL.', { tone: 'link', nodes: [ids[3], ids[0]] })
  r.step(undefined, 'Same wagons, three contracts', 'The cargo never changed. Only the couplings did, and those decide what is cheap and what is expensive.', 'Choose by the operations you need most. The Simulator lets you run all seven operations on each kind.', { tone: 'done' })
  return r.steps
}

export const TOURS: Tour[] = [
  { id: 'anatomy', title: 'Anatomy of a wagon', idea: 'A node is cargo plus a coupling. A list is nodes joined by couplings, entered through a single head pointer.', notice: ['Each wagon shows its value and memory address.', 'Green is head, yellow is next, and a NULL stub is an open coupling.'], build: anatomy },
  { id: 'memory', title: 'Where wagons really live', idea: 'Nodes are scattered around memory. That one fact explains why indexing is slow and why insertion is cheap.', notice: ['Watch the view switch into the memory yard.', 'The addresses match the numbered bays on the ground.'], build: memory },
  { id: 'head', title: 'Head is the only door', idea: 'A list is only as safe as the pointer that leads into it.', notice: ['Red wagons exist in memory but cannot be reached.', 'Open the Pointers panel on the right and watch head.'], build: headDoor },
  { id: 'traversal', title: 'Traversal: no teleporting', idea: 'Walk with a temporary pointer, one coupling at a time, until you reach NULL.', notice: ['The inspector is the variable cur.', 'Count the hops in the panel on the right.'], build: traversal },
  { id: 'trap', title: 'The order trap', idea: 'The most common linked list bug, shown happening. Connect the new node first and break the old link last.', notice: ['Dashed red shows the coupling that was just destroyed.', 'Compare both orders side by side in your head.'], build: orderTrap },
  { id: 'family', title: 'Singly, doubly, circular', idea: 'One train becomes all three list types, so you can see exactly what each one adds.', notice: ['Coral couplings appear for prev.', 'The track bends into a ring when the loop closes.'], build: family },
]
