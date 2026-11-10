# TheComputerScienceSociety - A Community Of Relativity

Interactive 3D labs for data structures and algorithms.

## Lab: CSE-Linked-List-Express

Singly, doubly and circular linked lists, taught as a train you can couple, uncouple and walk through.

- **Learn**: six guided lessons, including the classic pointer-order bug shown happening.
- **Simulator**: traverse, plus insert and delete at the beginning, end and any position, on all three list types. Step forward, step back and scrub. Code is shown in C++, Java and Python with the running line lit.
- **Practice**: 10 standard and 10 MAANG-style LeetCode problems with hints, plans, edge cases and solutions. Ten have 3D walkthroughs.
- **Reference**: complexity table, train-to-code dictionary, patterns and a pre-submit checklist.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5273.

```bash
npm test
```

## Stack

React, TypeScript, Three.js, React Three Fiber, Drei, Zustand, Framer Motion and Vite.

## How it works

Algorithms run against a real pointer model in `src/engine`. A recorder captures a full snapshot at every meaningful moment, and the 3D stage in `src/stage` only renders snapshots. That is what makes stepping backward exact.

To add a lab, build its step generators on `Rec` and register its pages in `src/App.tsx`.
