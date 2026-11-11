import { Text } from '@react-three/drei'
import fontUrl from '@fontsource/barlow-condensed/files/barlow-condensed-latin-700-normal.woff?url'
import { memo, type FC } from 'react'
import { addr } from './array'
import type { PtrAt, SItem, SeqSnap } from './rec'

export { fontUrl }

export interface Pose {
  x: number
  y: number
  z: number
}

export interface Fit {
  halfW: number
  halfV: number
  cx: number
  cy: number
  cz: number
  elevation: number
}

export interface WorldProps {
  caps: string
  mode: string
}

export interface Theme {
  bg: string
  ground: string
  grid: [string, string]
  slot: (s: SeqSnap, row: number, i: number) => Pose
  hand: (s: SeqSnap, near: number, row: number) => Pose
  gone: (s: SeqSnap, item: SItem) => Pose
  sign: (s: SeqSnap, p: PtrAt, stack: number) => Pose
  fit: (s: SeqSnap) => Fit
  plate: [number, number, number]
  World: FC<WorldProps>
  Item: FC<{ item: SItem; hot: boolean; accent: string }>
}

const glow = (hot: boolean, accent: string) => ({ emissive: hot ? accent : '#000000', emissiveIntensity: hot ? 0.5 : 0 })

// ---------------- Bookshelf ----------------

const B = 2.1
const shelfY = (row: number) => 5 + row * 8.5
const BOOKS = ['#b23a48', '#2f6f8f', '#c98a2b', '#3f7d58', '#6c4f9c', '#c75d3a', '#2b8a8a']

const Shelf = memo(function Shelf({ caps }: WorldProps) {
  return (
    <>
      {caps.split(',').map(Number).map((cap, row) => {
        const y = shelfY(row)
        const w = cap * B + 0.4
        return (
          <group key={row} position={[0, y, 0]}>
            <mesh position={[0, -0.2, 0]} castShadow receiveShadow>
              <boxGeometry args={[w, 0.4, 2.8]} />
              <meshStandardMaterial color="#6b4226" roughness={0.7} />
            </mesh>
            <mesh position={[0, 1.9, -1.45]} receiveShadow>
              <boxGeometry args={[w, 4.4, 0.12]} />
              <meshStandardMaterial color="#4a2d1a" roughness={0.85} />
            </mesh>
            {Array.from({ length: cap + 1 }, (_, k) => (
              <mesh key={k} position={[(k - cap / 2) * B, 0.08, 1.2]}>
                <boxGeometry args={[0.05, 0.16, 0.3]} />
                <meshStandardMaterial color="#e8c88f" />
              </mesh>
            ))}
            {Array.from({ length: cap }, (_, i) => (
              <group key={i} position={[(i - (cap - 1) / 2) * B, -0.2, 1.42]}>
                <Text font={fontUrl} fontSize={0.52} color="#ffe2ae" anchorY="middle" position={[0, 0.02, 0.02]}>{String(i)}</Text>
                <Text font={fontUrl} fontSize={0.3} color="#d9b98a" anchorY="middle" position={[0, -0.62, 0.02]}>{addr(i, row)}</Text>
              </group>
            ))}
          </group>
        )
      })}
    </>
  )
})

function Book({ item, hot, accent }: { item: SItem; hot: boolean; accent: string }) {
  const c = BOOKS[item.hue % BOOKS.length]
  const height = 2.3 + (item.hue % 3) * 0.2
  return (
    <group>
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[1.5, height, 2]} />
        <meshStandardMaterial color={c} roughness={0.6} {...glow(hot, accent)} />
      </mesh>
      {[0.32, 0.78].map((f) => (
        <mesh key={f} position={[0, height * f, 1.01]}>
          <boxGeometry args={[1.5, 0.1, 0.02]} />
          <meshStandardMaterial color="#f0d38f" metalness={0.2} roughness={0.45} />
        </mesh>
      ))}
    </group>
  )
}

export const shelfTheme: Theme = {
  bg: '#2a1b12',
  ground: '#3a2719',
  grid: ['#4b3423', '#664830'],
  slot: (s, row, i) => ({ x: (i - (s.rows[row].length - 1) / 2) * B, y: shelfY(row), z: 0 }),
  hand: (s, near, row) => ({ x: (near - (s.rows[row].length - 1) / 2) * B, y: -0.55, z: 2.8 }),
  gone: (_s, item) => ({ x: (item.hue % 5) - 2, y: -3, z: 9 }),
  sign: (s, p, stack) => ({ x: (p.i - (s.rows[p.row].length - 1) / 2) * B, y: shelfY(p.row) + 4.85 + stack * 0.9, z: 0 }),
  fit: (s) => {
    const cap = Math.max(...s.rows.map((r) => r.length))
    const top = shelfY(s.rows.length - 1) + 6.2
    return { halfW: (cap * B) / 2 + 1.5, halfV: (top + 1) / 2 + 1, cx: 0, cy: (top - 1) / 2, cz: 0, elevation: 9 }
  },
  plate: [0, 3.6, 0.4],
  World: Shelf,
  Item: Book,
}

// ---------------- Tiffin carrier ----------------

const H = 1.32
const COLX = 9
const tiffinTop = (s: SeqSnap) => Math.max(...s.rows.map((r) => r.length)) * H

const Carrier = memo(function Carrier({ caps }: WorldProps) {
  return (
    <>
      {caps.split(',').map(Number).map((cap, row) => {
        const top = cap * H + 0.5
        return (
          <group key={row} position={[row * COLX, 0, 0]}>
            <mesh position={[0, 0.08, 0]} receiveShadow castShadow>
              <cylinderGeometry args={[1.75, 1.85, 0.3, 40]} />
              <meshStandardMaterial color="#8796a3" metalness={0.2} roughness={0.45} />
            </mesh>
            {[-1.62, 1.62].map((x) => (
              <mesh key={x} position={[x, top / 2, 0]} castShadow>
                <cylinderGeometry args={[0.07, 0.07, top, 12]} />
                <meshStandardMaterial color="#d5dee5" metalness={0.3} roughness={0.35} />
              </mesh>
            ))}
            <mesh position={[0, top, 0]}>
              <boxGeometry args={[3.4, 0.14, 0.34]} />
              <meshStandardMaterial color="#d5dee5" metalness={0.3} roughness={0.35} />
            </mesh>
            {Array.from({ length: cap }, (_, i) => (
              <Text key={i} font={fontUrl} fontSize={0.5} color="#a9d8cc" anchorX="right" anchorY="middle" position={[-1.95, 0.95 + i * H, 0]}>{`[${i}]`}</Text>
            ))}
            <Text font={fontUrl} fontSize={0.48} color="#a9d8cc" anchorY="middle" position={[0, 0.05, 2.5]} rotation={[-Math.PI / 2, 0, 0]}>
              {row === 0 ? 'stack' : 'tmp'}
            </Text>
          </group>
        )
      })}
    </>
  )
})

const BANDS = ['#e8813a', '#3aa6a0', '#d9485f', '#e7b93c', '#6a8fe0', '#8fbf4d']

function Tin({ item, hot, accent }: { item: SItem; hot: boolean; accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.58, 0]} castShadow>
        <cylinderGeometry args={[1.3, 1.22, 1.14, 40]} />
        <meshStandardMaterial color="#dfe7ec" metalness={0.25} roughness={0.35} {...glow(hot, accent)} />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[1.32, 1.27, 0.26, 40]} />
        <meshStandardMaterial color={BANDS[item.hue % BANDS.length]} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.17, 0]}>
        <cylinderGeometry args={[1.36, 1.36, 0.08, 40]} />
        <meshStandardMaterial color="#f4f7f9" metalness={0.2} roughness={0.3} />
      </mesh>
    </group>
  )
}

export const tiffinTheme: Theme = {
  bg: '#10303a',
  ground: '#163e49',
  grid: ['#1c4c58', '#27626f'],
  slot: (_s, row, i) => ({ x: row * COLX, y: 0.25 + i * H, z: 0 }),
  hand: (s, _near, row) => ({ x: row * COLX, y: tiffinTop(s) + 1.6, z: 0 }),
  gone: (s) => ({ x: 5, y: tiffinTop(s) + 2.2, z: 6 }),
  sign: (_s, p, stack) => ({ x: p.row * COLX - 3.7 - stack * 1.7, y: 0.85 + p.i * H, z: 0 }),
  fit: (s) => {
    const cols = s.rows.length
    const top = tiffinTop(s) + 5
    return { halfW: 8 + (cols - 1) * (COLX / 2), halfV: top / 2 + 1.2, cx: ((cols - 1) * COLX) / 2, cy: top / 2 - 0.6, cz: 0, elevation: 12 }
  },
  plate: [3.05, 0.62, 0],
  World: Carrier,
  Item: Tin,
}

// ---------------- Tirumala queue ----------------

const Q = 2.75
const R = 7.6
const ringMode = (m: string) => m === 'circular' || m === 'deque'
const ringPos = (i: number, cap: number, r: number) => {
  const a = Math.PI / 2 - (i / cap) * Math.PI * 2
  return { x: r * Math.cos(a), z: r * Math.sin(a) }
}
const qx = (i: number, cap: number) => (i - (cap - 1) / 2 + 1.1) * Q
const rowZ = (row: number) => -row * 6.5

function Gopuram({ position }: { position: [number, number, number] }) {
  const tiers = [5.2, 4.5, 3.9, 3.3, 2.7, 2.1, 1.5]
  return (
    <group position={position}>
      <mesh position={[0, 1.3, 0]} castShadow>
        <boxGeometry args={[5.8, 2.6, 3.6]} />
        <meshStandardMaterial color="#e9dcc0" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.95, 1.82]}>
        <boxGeometry args={[1.5, 1.9, 0.08]} />
        <meshStandardMaterial color="#402312" />
      </mesh>
      {tiers.map((w, k) => (
        <group key={w} position={[0, 2.95 + k * 0.72, 0]}>
          <mesh castShadow>
            <boxGeometry args={[w, 0.7, w * 0.58]} />
            <meshStandardMaterial color={k % 2 ? '#d8b25a' : '#efe3c7'} roughness={0.7} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 8.4, 0]}>
        <boxGeometry args={[1.5, 0.28, 0.75]} />
        <meshStandardMaterial color="#d4a437" metalness={0.3} roughness={0.4} />
      </mesh>
      {[-0.5, 0, 0.5].map((x) => (
        <mesh key={x} position={[x, 8.82, 0]}>
          <coneGeometry args={[0.13, 0.62, 12]} />
          <meshStandardMaterial color="#f0c24b" metalness={0.3} roughness={0.35} />
        </mesh>
      ))}
    </group>
  )
}

function Pad({ i, x, z }: { i: number; x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.3, 2.3]} />
        <meshStandardMaterial color="#8f7a5f" roughness={0.9} />
      </mesh>
      <Text font={fontUrl} fontSize={0.62} color="#fff0cf" position={[0, 0.06, 1.55]} rotation={[-Math.PI / 2, 0, 0]}>{String(i)}</Text>
    </group>
  )
}

const Temple = memo(function Temple({ caps, mode }: WorldProps) {
  const list = caps.split(',').map(Number)
  if (ringMode(mode)) {
    const cap = list[0]
    return (
      <>
        <Gopuram position={[0, 0, -0.6]} />
        <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <ringGeometry args={[R - 1.6, R + 1.6, 96]} />
          <meshStandardMaterial color="#6f5d48" roughness={0.95} />
        </mesh>
        {Array.from({ length: cap }, (_, i) => <Pad key={i} i={i} {...ringPos(i, cap, R)} />)}
      </>
    )
  }
  const cap = list[0]
  const left = qx(-1, cap) - 1
  const right = qx(cap - 1, cap) + 1.8
  return (
    <>
      <Gopuram position={[qx(-1.6, cap), 0, 0]} />
      {list.map((c, row) => (
        <group key={row}>
          {row === 0 && [-1.5, 1.5].map((z) => (
            <mesh key={z} position={[(left + right) / 2, 1.1, z]}>
              <boxGeometry args={[right - left, 0.07, 0.07]} />
              <meshStandardMaterial color="#d3d7dc" metalness={0.25} roughness={0.4} />
            </mesh>
          ))}
          {row === 0 && [-1.5, 1.5].flatMap((z) =>
            Array.from({ length: c + 1 }, (_, k) => (
              <mesh key={`${z}${k}`} position={[qx(k - 0.5, cap), 0.55, z]}>
                <cylinderGeometry args={[0.05, 0.05, 1.1, 8]} />
                <meshStandardMaterial color="#d3d7dc" metalness={0.25} roughness={0.4} />
              </mesh>
            )),
          )}
          {Array.from({ length: c }, (_, i) => <Pad key={i} i={i} x={qx(i, cap)} z={rowZ(row)} />)}
        </group>
      ))}
    </>
  )
})

const CLOTHES = ['#d9485f', '#e7b93c', '#3aa6a0', '#f2efe6', '#7d5cc4', '#e8813a']
const TIER_COLOR = ['', '#f0c24b', '#3aa6a0', '#e8813a']

function Devotee({ item, hot, accent }: { item: SItem; hot: boolean; accent: string }) {
  const c = item.tier ? TIER_COLOR[item.tier] : CLOTHES[item.hue % CLOTHES.length]
  return (
    <group>
      <mesh position={[0, 0.62, 0]} castShadow>
        <cylinderGeometry args={[0.36, 0.56, 1.24, 18]} />
        <meshStandardMaterial color={c} roughness={0.75} {...glow(hot, accent)} />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow>
        <capsuleGeometry args={[0.32, 0.36, 6, 14]} />
        <meshStandardMaterial color={c} roughness={0.75} {...glow(hot, accent)} />
      </mesh>
      <mesh position={[0, 2.2, 0]} castShadow>
        <sphereGeometry args={[0.28, 18, 18]} />
        <meshStandardMaterial color="#a87850" roughness={0.6} />
      </mesh>
    </group>
  )
}

export const templeTheme: Theme = {
  bg: '#3b2030',
  ground: '#57433a',
  grid: ['#604a3f', '#725a4c'],
  slot: (s, row, i) => (ringMode(s.mode) ? { ...ringPos(i, s.rows[row].length, R), y: 0 } : { x: qx(i, s.rows[0].length), y: 0, z: rowZ(row) }),
  hand: (s, near, row) => (ringMode(s.mode) ? { ...ringPos(near, s.rows[row].length, R + 4), y: 0 } : { x: qx(near, s.rows[0].length), y: 0, z: 4.6 }),
  gone: (s) => (ringMode(s.mode) ? { x: 0, y: 0, z: 1 } : { x: qx(-1.6, s.rows[0].length), y: 0, z: 1.8 }),
  sign: (s, p, stack) => {
    const b = templeTheme.slot(s, p.row, p.i)
    return { ...b, y: 4.55 + stack * 0.9 }
  },
  fit: (s) => {
    if (ringMode(s.mode)) return { halfW: R + 5, halfV: R + 3.5, cx: 0, cy: 2, cz: 0.5, elevation: 46 }
    const cap = s.rows[0].length
    const twoRows = s.rows.length > 1
    return { halfW: qx(cap, cap) / 2 - qx(-3.2, cap) / 2 + 1.5, halfV: twoRows ? 9 : 7, cx: (qx(cap, cap) + qx(-3.2, cap)) / 2, cy: 2.8, cz: twoRows ? -2 : 0.8, elevation: twoRows ? 34 : 24 }
  },
  plate: [0, 3.15, 0],
  World: Temple,
  Item: Devotee,
}
