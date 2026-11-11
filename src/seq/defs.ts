import type { Problem } from '../data/problems'
import type { Algo } from '../engine/code'
import type { Tone } from '../engine/rec'
import { ARRAY_ALGOS, arrayStart, runArray } from './array'
import { ARRAY_TOURS, ARRAY_TRACES, QUEUE_TOURS, QUEUE_TRACES, STACK_TOURS, STACK_TRACES, type SeqTour } from './lessons'
import { ARRAY_PROBLEMS, QUEUE_PROBLEMS, STACK_PROBLEMS } from './problems'
import { QUEUE_ALGOS, QUEUE_CAP, queueStart, runQueue } from './queue'
import type { SeqSnap, SeqStep } from './rec'
import { STACK_ALGOS, STACK_CAP, runStack, stackStart } from './stack'
import type { OpArgs, SeqEngine } from './store'
import { shelfTheme, templeTheme, tiffinTheme, type Theme } from './themes'

export interface OpBtn {
  op: string
  label: string
  cost: string
}

export interface Reference {
  columns: string[]
  rows: string[][]
  note: string
  dictionary: string[][]
  patterns: string[][]
  checklist: string[]
}

export interface Field {
  id: 'value' | 'pos' | 'tier'
  label: string
}

export interface LabDef {
  engine: SeqEngine
  slug: string
  name: string
  blurb: string
  worldLabel: string
  tones: Record<Tone, string>
  theme: Theme
  modes: { id: string; label: string; note: string }[]
  fields: (mode: string) => Field[]
  groups: (mode: string) => { title: string; ops: OpBtn[] }[]
  validate: (s: SeqSnap, mode: string, op: string, a: OpArgs) => string
  nextValue: (mode: string) => string
  defaultPos: number
  extras?: { label: string; values?: string[] }[]
  algos: Record<string, Algo>
  tours: SeqTour[]
  problems: Problem[]
  traces: Partial<Record<number, () => SeqStep[]>>
  practiceIntro: string
  codeNote: string
  legend: { color: string; label: string }[]
  reference: Reference
}

const count = (s: SeqSnap) => s.rows[0].filter(Boolean).length
const inRange = (p: number, lo: number, hi: number, what: string) => (Number.isInteger(p) && p >= lo && p <= hi ? '' : `${what} must be a whole number from ${lo} to ${hi}.`)

const arrayValidate = (s: SeqSnap, _m: string, op: string, a: OpArgs) => {
  const n = count(s)
  const usesValue = op.startsWith('insert') || op === 'update' || op === 'linear' || op === 'binary'
  if (usesValue && !/^-?\d+$/.test(a.value.trim())) return 'Enter a whole number for the book.'
  if (op.startsWith('insert') && n >= 12) return 'The largest shelf holds 12 books. Delete one first.'
  if (op === 'insertAt') return inRange(a.pos, 0, n, 'Insert position')
  if (['access', 'update', 'deleteAt'].includes(op)) return n ? inRange(a.pos, 0, n - 1, 'Index') : 'The shelf is empty.'
  return ''
}

const DISHES = ['Sambar', 'Rasam', 'Poriyal', 'Curd', 'Papad', 'Halwa', 'Idli', 'Upma', 'Kheer']
let dish = 0
let token = 200
let book = 0

export const ARRAY_LAB: LabDef = {
  slug: 'cse-array-bookshelf',
  name: 'CSE-Array-Bookshelf',
  blurb: 'Arrays as a library shelf: numbered slots, instant lookup, costly shifting, and doubling when the shelf fills up.',
  worldLabel: 'On the shelf',
  tones: { info: 'Librarian note', make: 'Placing a book', link: 'Moving', cut: 'Removing', walk: 'Looking up', warn: 'Caution', done: 'Finished' },
  theme: shelfTheme,
  engine: {
    id: 'array',
    defaultMode: 'array',
    start: arrayStart,
    run: (s, op, a) => runArray(s, op, a),
    idle: { title: 'The shelf is ready', world: 'Choose an operation on the left and watch which books have to move.', code: 'Every step shows the running line and the slots it reads or writes.' },
  },
  modes: [],
  fields: () => [{ id: 'value', label: 'Book number' }, { id: 'pos', label: 'Index (0 = first)' }],
  groups: () => [
    { title: 'Read', ops: [{ op: 'access', label: 'Access by index', cost: 'O(1)' }, { op: 'update', label: 'Update by index', cost: 'O(1)' }, { op: 'traverse', label: 'Traverse', cost: 'O(n)' }] },
    { title: 'Insert', ops: [{ op: 'insertBegin', label: 'At beginning', cost: 'O(n)' }, { op: 'insertEnd', label: 'At end', cost: 'O(1)*' }, { op: 'insertAt', label: 'At index', cost: 'O(n)' }] },
    { title: 'Delete', ops: [{ op: 'deleteBegin', label: 'At beginning', cost: 'O(n)' }, { op: 'deleteEnd', label: 'At end', cost: 'O(1)' }, { op: 'deleteAt', label: 'At index', cost: 'O(n)' }] },
    { title: 'Search', ops: [{ op: 'linear', label: 'Linear search', cost: 'O(n)' }, { op: 'binary', label: 'Binary search', cost: 'O(log n)' }] },
  ],
  validate: arrayValidate,
  nextValue: () => String(11 + ((book += 37) % 88)),
  defaultPos: 2,
  extras: [{ label: 'Sort the shelf', values: ['11', '19', '27', '35', '42', '58'] }, { label: 'Reset' }, { label: 'Empty', values: [] }],
  algos: ARRAY_ALGOS,
  tours: ARRAY_TOURS,
  problems: ARRAY_PROBLEMS,
  traces: ARRAY_TRACES,
  practiceIntro: 'Start with Standard: hashing, running values and two pointers underlie the MAANG set.',
  codeNote: 'a, n and cap are fields of the array, shown bare for readability.',
  legend: [{ color: '#4fd1ff', label: 'i' }, { color: '#7cfc9a', label: 'lo' }, { color: '#ff9de2', label: 'hi' }, { color: '#ffd23f', label: 'mid' }],
  reference: {
    columns: ['Operation', 'Array', 'Why'],
    rows: [
      ['Access by index', 'O(1)', 'Address is calculated'],
      ['Update by index', 'O(1)', 'One write'],
      ['Traverse', 'O(n)', 'Every element once'],
      ['Insert at end', 'O(1)*', 'Amortized, with doubling'],
      ['Insert at beginning', 'O(n)', 'Everything shifts right'],
      ['Insert at index', 'O(n)', 'Later elements shift'],
      ['Delete at end', 'O(1)', 'Only n changes'],
      ['Delete at beginning', 'O(n)', 'Everything shifts left'],
      ['Linear search', 'O(n)', 'Works on any order'],
      ['Binary search', 'O(log n)', 'Needs sorted data'],
    ],
    note: '* A single append can cost O(n) when the array grows. Averaged over many appends, doubling makes it O(1).',
    dictionary: [['Shelf', 'Contiguous memory block'], ['Numbered slot', 'Index'], ['Slot edge label', 'Memory address'], ['Book', 'Element'], ['Shelf length', 'Capacity (cap)'], ['Books on the shelf', 'Size (n)'], ['Sliding a book', 'Shifting an element'], ['New longer shelf', 'Reallocation']],
    patterns: [['Two pointers', 'Sorted arrays, pairs, in-place partitioning.'], ['Sliding window', 'Best subarray or substring under a constraint.'], ['Prefix sums', 'Fast repeated range queries.'], ['Hash lookup', 'Trade O(n) space to skip a nested loop.'], ['Binary search', 'Sorted data, or a monotonic answer.']],
    checklist: ['Empty array and single element?', 'Off by one on the last index?', 'Is the shift direction overwriting data?', 'Could integer sums overflow?', 'Is the input sorted, or may you sort it?', 'Duplicates and negative values?', 'In place, or is extra space allowed?'],
  },
}

export const STACK_LAB: LabDef = {
  slug: 'cse-stack-tiffin',
  name: 'CSE-Stack-Tiffin',
  blurb: 'Stacks as a tiffin carrier: tins go on and come off at the top only. Last in, first out.',
  worldLabel: 'At the tiffin',
  tones: { info: 'Kitchen note', make: 'Adding a tin', link: 'Moving', cut: 'Lifting off', walk: 'Checking', warn: 'Caution', done: 'Finished' },
  theme: tiffinTheme,
  engine: {
    id: 'stack',
    defaultMode: 'stack',
    start: stackStart,
    run: (s, op, a) => runStack(s, op, a),
    idle: { title: 'The carrier is ready', world: 'Choose an operation on the left. Remember that only the top tin can be touched.', code: 'A stack here is an array plus one index, top.' },
  },
  modes: [],
  fields: () => [{ id: 'value', label: 'Food in the tin' }, { id: 'pos', label: 'Depth k (0 = top)' }],
  groups: () => [
    { title: 'Change', ops: [{ op: 'push', label: 'Push', cost: 'O(1)' }, { op: 'pop', label: 'Pop', cost: 'O(1)' }] },
    { title: 'Inspect', ops: [{ op: 'peek', label: 'Peek', cost: 'O(1)' }, { op: 'isEmpty', label: 'Is empty?', cost: 'O(1)' }] },
    { title: 'Against the rules', ops: [{ op: 'dig', label: 'Reach depth k', cost: 'O(k)' }] },
  ],
  validate: (s, _m, op, a) => {
    const n = count(s)
    if (op === 'push' && !a.value.trim()) return 'Enter what goes in the tin.'
    if (op === 'dig') return n ? inRange(a.pos, 0, n - 1, 'Depth') : 'The carrier is empty.'
    return ''
  },
  nextValue: () => DISHES[dish++ % DISHES.length],
  defaultPos: 1,
  extras: [{ label: 'Reset' }, { label: 'Empty', values: [] }],
  algos: STACK_ALGOS,
  tours: STACK_TOURS,
  problems: STACK_PROBLEMS,
  traces: STACK_TRACES,
  practiceIntro: 'Start with Standard: matching and auxiliary state lead into the monotonic stacks of the MAANG set.',
  codeNote: `a, top and cap are fields of the stack, shown bare. Capacity is ${STACK_CAP} here.`,
  legend: [{ color: '#5ce0c6', label: 'top' }, { color: '#c3a6ff', label: 'tmp' }],
  reference: {
    columns: ['Operation', 'Stack', 'Why'],
    rows: [['Push', 'O(1)', 'Write above top'], ['Pop', 'O(1)', 'Move top down'], ['Peek', 'O(1)', 'Read at top'], ['Is empty', 'O(1)', 'Compare top with -1'], ['Reach depth k', 'O(k)', 'Must remove k items first']],
    note: 'A linked list also works: head is the top. An array is more cache friendly, and a list never overflows until memory runs out.',
    dictionary: [['Tiffin carrier', 'Stack'], ['Tin', 'Element'], ['Top tin', 'Top of stack'], ['Marker', 'top index'], ['Adding a tin', 'Push'], ['Lifting a tin', 'Pop'], ['Opening the lid', 'Peek'], ['Clamp cannot close', 'Overflow'], ['No tins left', 'Underflow']],
    patterns: [['Matching', 'Brackets, tags, undoing the latest open item.'], ['Monotonic stack', 'Next greater or smaller element.'], ['Expression evaluation', 'Postfix, calculators.'], ['Explicit DFS', 'Replace recursion with your own stack.'], ['Two stacks', 'Minimum tracking, queue from stacks.']],
    checklist: ['Check empty before pop or peek.', 'Does the stack store values or indexes?', 'What should be left at the end?', 'Is popping order giving the right operand order?', 'Can recursion depth overflow?', 'Is amortized O(n) what the loop really costs?'],
  },
}

const queueOps = (mode: string) => {
  if (mode === 'deque') return [
    { title: 'Front', ops: [{ op: 'pushFront', label: 'Push front', cost: 'O(1)' }, { op: 'popFront', label: 'Pop front', cost: 'O(1)' }] },
    { title: 'Back', ops: [{ op: 'pushBack', label: 'Push back', cost: 'O(1)' }, { op: 'popBack', label: 'Pop back', cost: 'O(1)' }] },
  ]
  const priority = mode === 'priority'
  const base = [
    { title: 'Line', ops: [{ op: 'enqueue', label: 'Enqueue', cost: priority ? 'O(n)' : 'O(1)' }, { op: 'dequeue', label: 'Dequeue', cost: priority ? 'O(n)' : 'O(1)' }, { op: 'peek', label: 'Peek', cost: 'O(1)' }] },
  ]
  return mode === 'linear' ? [...base, { title: 'Repair', ops: [{ op: 'compact', label: 'Compact the hall', cost: 'O(n)' }] }] : base
}

export const QUEUE_LAB: LabDef = {
  slug: 'cse-queue-tirumala-darshan',
  name: 'CSE-Queue-Tirumala-Darshan',
  blurb: 'Queues as the darshan line at Tirumala: join at the back, enter from the front, with circular compartments and priority lines.',
  worldLabel: 'In the darshan line',
  tones: { info: 'Volunteer note', make: 'Joining', link: 'Moving', cut: 'Going in', walk: 'Checking', warn: 'Caution', done: 'Finished' },
  theme: templeTheme,
  engine: {
    id: 'queue',
    defaultMode: 'linear',
    start: (mode) => queueStart(mode),
    run: (s, op, a) => runQueue(s, op, a),
    idle: { title: 'The line is ready', world: 'Choose an operation on the left and watch who moves, and who does not.', code: 'Every step shows the running line and the indexes it changes.' },
  },
  modes: [
    { id: 'linear', label: 'Linear', note: 'A plain array with front and rear.' },
    { id: 'circular', label: 'Circular', note: 'Compartments in a ring, reused forever.' },
    { id: 'deque', label: 'Deque', note: 'Add or remove at both ends.' },
    { id: 'priority', label: 'Priority', note: 'Served by rank, then by arrival.' },
  ],
  fields: (mode) => [{ id: 'value', label: 'Token' }, ...(mode === 'priority' ? [{ id: 'tier', label: 'Darshan group' } as Field] : [])],
  groups: queueOps,
  validate: (_s, _m, op, a) => (['enqueue', 'pushBack', 'pushFront'].includes(op) && !a.value.trim() ? 'Enter a token for the devotee.' : ''),
  nextValue: () => `T${++token}`,
  defaultPos: 0,
  extras: [{ label: 'Reset' }],
  algos: QUEUE_ALGOS,
  tours: QUEUE_TOURS,
  problems: QUEUE_PROBLEMS,
  traces: QUEUE_TRACES,
  practiceIntro: 'Start with Standard: ring buffers and windows prepare you for BFS and the monotonic deque.',
  codeNote: `a, front, rear and count are fields of the queue, shown bare. Capacity is ${QUEUE_CAP} here.`,
  legend: [{ color: '#7cfc9a', label: 'front' }, { color: '#ff9f43', label: 'rear' }],
  reference: {
    columns: ['Operation', 'Linear', 'Circular', 'Deque', 'Priority (sorted)', 'Priority (heap)'],
    rows: [
      ['Add', 'O(1)', 'O(1)', 'O(1)', 'O(n)', 'O(log n)'],
      ['Remove', 'O(1)', 'O(1)', 'O(1)', 'O(n)', 'O(log n)'],
      ['Peek', 'O(1)', 'O(1)', 'O(1)', 'O(1)', 'O(1)'],
      ['Reuses freed space', 'No', 'Yes', 'Yes', 'Yes', 'Yes'],
    ],
    note: 'The simulator uses a sorted array so the priority order stays visible. Production priority queues use a binary heap.',
    dictionary: [['Darshan line', 'Queue'], ['Devotee', 'Element'], ['Token', 'Value'], ['Temple gate', 'Front'], ['End of the line', 'Rear'], ['Joining the line', 'Enqueue'], ['Going for darshan', 'Dequeue'], ['Compartment ring', 'Circular buffer'], ['Priority group', 'Priority or rank']],
    patterns: [['BFS', 'Shortest path in unweighted graphs, level order.'], ['Sliding window', 'Monotonic deque for window maximum.'], ['Ring buffer', 'Fixed memory, streaming data.'], ['Priority queue', 'Top-k, scheduling, k-way merge.'], ['Multi-source BFS', 'Spreading from several starts.']],
    checklist: ['How do you tell full from empty?', 'Does the index wrap with modulo?', 'Is negative modulo handled?', 'Does the BFS mark nodes when enqueued?', 'Do you process a whole level per round?', 'Is the deque storing indexes?'],
  },
}

export const SEQ_LABS = [ARRAY_LAB, STACK_LAB, QUEUE_LAB]
