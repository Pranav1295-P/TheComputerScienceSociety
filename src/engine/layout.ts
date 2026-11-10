import type { Snap, View } from './rec'

export const SPACING = 4.4
export const LANE = 6.4
const BAY_X = 6.6
const BAY_Z = 6

export interface Pose {
  x: number
  z: number
  yaw: number
}

export interface Layout {
  poses: Record<string, Pose>
  engine: Pose
  /** Half extents and centre used to frame the camera. */
  fit: { halfW: number; halfD: number; cx: number; cz: number; elevation: number }
  mode: 'line' | 'ring' | 'yard'
  ringR: number
  lanes: number[]
  span: [number, number]
}

export const bayPos = (slot: number) => ({
  x: ((slot % 6) - 2.5) * BAY_X,
  z: (Math.floor(slot / 6) - 1.5) * BAY_Z,
})

export function computeLayout(snap: Snap, view: View): Layout {
  const ids = Object.keys(snap.nodes)
  const poses: Record<string, Pose> = {}

  if (view === 'memory') {
    for (const id of ids) poses[id] = { ...bayPos(snap.nodes[id].slot), yaw: 0 }
    return {
      poses,
      engine: { x: -3.5 * BAY_X, z: 0, yaw: 0 },
      fit: { halfW: 3.9 * BAY_X, halfD: 2.2 * BAY_Z, cx: -0.5 * BAY_X, cz: 0, elevation: 50 },
      mode: 'yard',
      ringR: 0,
      lanes: [],
      span: [0, 0],
    }
  }

  if (snap.kind === 'circular') {
    const main = ids.filter((id) => snap.place[id].lane === 0).map((id) => snap.place[id].i)
    const n = Math.max(1, main.length ? Math.max(...main) + 1 : 1)
    const ringR = Math.max(6.5, (n * SPACING * 1.08) / (2 * Math.PI))
    for (const id of ids) {
      const p = snap.place[id]
      const a = Math.PI / 2 - (p.i / n) * Math.PI * 2
      const r = p.lane === 0 ? ringR : ringR + LANE
      const t = { x: Math.sin(a), z: -Math.cos(a) }
      poses[id] = { x: r * Math.cos(a), z: r * Math.sin(a), yaw: Math.atan2(-t.z, t.x) }
    }
    const reach = ringR + LANE + 1
    return {
      poses,
      engine: { x: 0, z: 0, yaw: 0 },
      fit: { halfW: reach, halfD: reach, cx: 0, cz: 0, elevation: 42 },
      mode: 'ring',
      ringR,
      lanes: [],
      span: [0, 0],
    }
  }

  const is = ids.map((id) => snap.place[id].i)
  const lanesUsed = ids.map((id) => snap.place[id].lane)
  const minI = Math.min(0, ...is)
  const maxI = Math.max(0, ...is)
  const engineI = Math.floor(minI) - 1
  const c = (engineI + maxI + 1) / 2
  const xOf = (i: number) => (i - c) * SPACING
  for (const id of ids) {
    const p = snap.place[id]
    poses[id] = { x: xOf(p.i), z: p.lane * LANE, yaw: 0 }
  }
  const minLane = Math.min(0, ...lanesUsed)
  const maxLane = Math.max(1, ...lanesUsed)
  const halfW = ((maxI + 1 - engineI) / 2) * SPACING + 2.4
  const lanes: number[] = []
  for (let l = minLane; l <= maxLane; l++) lanes.push(l * LANE)
  return {
    poses,
    engine: { x: xOf(engineI), z: 0, yaw: 0 },
    fit: { halfW, halfD: ((maxLane - minLane) / 2) * LANE + 2.6, cx: 0, cz: ((minLane + maxLane) / 2) * LANE, elevation: 38 },
    mode: 'line',
    ringR: 0,
    lanes,
    span: [xOf(engineI) - 2.6, xOf(maxI + 1) + 1],
  }
}
