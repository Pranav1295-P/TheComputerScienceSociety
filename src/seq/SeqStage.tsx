import { Billboard, Grid, OrbitControls, Text } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { Tone } from '../engine/rec'
import type { SItem, SeqSnap, SeqStep } from './rec'
import { useSeq } from './store'
import { fontUrl, type Pose, type Theme } from './themes'

export const SIGN_COLORS: Record<string, string> = {
  i: '#4fd1ff', j: '#ff9de2', lo: '#7cfc9a', hi: '#ff9de2', mid: '#ffd23f', top: '#5ce0c6', tmp: '#c3a6ff',
  front: '#7cfc9a', rear: '#ff9f43', w: '#7cfc9a', write: '#ffd23f', L: '#4fd1ff', R: '#ff9de2',
}

const TONE: Record<Tone, string> = {
  info: '#ffd23f', make: '#7cfc9a', link: '#ffd23f', cut: '#ff5a6a', walk: '#4fd1ff', warn: '#ff9f43', done: '#6ff0c0',
}

const live = new Map<string, Pose & { s: number }>()

function target(theme: Theme, snap: SeqSnap, it: SItem): Pose {
  if (it.loc.k === 'slot') return theme.slot(snap, it.loc.row, it.loc.i)
  if (it.loc.k === 'hand') return theme.hand(snap, it.loc.near, it.loc.row)
  return theme.gone(snap, it)
}

function ItemView({ item, snap, theme, hot, accent }: { item: SItem; snap: SeqSnap; theme: Theme; hot: boolean; accent: string }) {
  const root = useRef<THREE.Group>(null!)
  const goal = target(theme, snap, item)
  const gone = item.loc.k === 'gone'
  const ItemMesh = theme.Item
  useFrame((_, dt) => {
    const d = Math.min(dt, 0.1)
    const l0 = 3.6 * (0.6 + useSeq.getState().speed * 0.4)
    let s = live.get(item.id)
    if (!s) {
      s = { x: goal.x, y: goal.y + 5, z: goal.z, s: 1 }
      live.set(item.id, s)
    }
    s.x = THREE.MathUtils.damp(s.x, goal.x, l0, d)
    s.y = THREE.MathUtils.damp(s.y, goal.y, l0, d)
    s.z = THREE.MathUtils.damp(s.z, goal.z, l0, d)
    s.s = THREE.MathUtils.damp(s.s, gone ? 0.001 : 1, 5, d)
    root.current.position.set(s.x, s.y, s.z)
    root.current.scale.setScalar(s.s)
  })
  useEffect(() => () => void live.delete(item.id), [item.id])
  return (
    <group ref={root}>
      <ItemMesh item={item} hot={hot} accent={accent} />
      <Billboard position={theme.plate}>
        <mesh>
          <planeGeometry args={[Math.max(1.5, item.value.length * 0.42 + 0.4), 0.92]} />
          <meshBasicMaterial color={hot ? '#fff6d6' : '#f4efe1'} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.47, 0.002]}>
          <planeGeometry args={[Math.max(1.5, item.value.length * 0.42 + 0.4), 0.06]} />
          <meshBasicMaterial color={hot ? accent : '#0b1730'} toneMapped={false} />
        </mesh>
        <Text font={fontUrl} fontSize={0.68} color="#0b1730" anchorY="middle" position={[0, 0.02, 0.01]}>{item.value}</Text>
      </Billboard>
    </group>
  )
}

function Sign({ name, goal }: { name: string; goal: Pose }) {
  const root = useRef<THREE.Group>(null!)
  const cur = useRef<Pose | null>(null)
  const color = SIGN_COLORS[name] ?? '#c3d3ee'
  useFrame((_, dt) => {
    if (!cur.current) cur.current = { ...goal }
    const c = cur.current
    const d = Math.min(dt, 0.1)
    const l = 5 * (0.6 + useSeq.getState().speed * 0.4)
    c.x = THREE.MathUtils.damp(c.x, goal.x, l, d)
    c.y = THREE.MathUtils.damp(c.y, goal.y, l, d)
    c.z = THREE.MathUtils.damp(c.z, goal.z, l, d)
    root.current.position.set(c.x, c.y, c.z)
  })
  return (
    <group ref={root}>
      <Billboard>
        <mesh>
          <planeGeometry args={[Math.max(1, name.length * 0.34 + 0.5), 0.72]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
        <Text font={fontUrl} fontSize={0.52} color="#0b1730" anchorY="middle" position={[0, 0.02, 0.01]}>{name}</Text>
      </Billboard>
    </group>
  )
}

function Rig({ theme, snap }: { theme: Theme; snap: SeqSnap }) {
  const { camera, size, controls } = useThree()
  const nonce = useSeq((s) => s.camNonce)
  const flying = useRef(true)
  const f = theme.fit(snap)
  const goal = useMemo(() => {
    const persp = camera as THREE.PerspectiveCamera
    const el = THREE.MathUtils.degToRad(f.elevation)
    const tan = Math.tan(THREE.MathUtils.degToRad(persp.fov / 2))
    const aspect = size.width / Math.max(size.height, 1)
    const dist = Math.max(f.halfW / (tan * aspect), f.halfV / tan, 12)
    const t = new THREE.Vector3(f.cx, f.cy, f.cz)
    return { t, pos: new THREE.Vector3(f.cx, f.cy + dist * Math.sin(el), f.cz + dist * Math.cos(el)) }
  }, [f.halfW, f.halfV, f.cx, f.cy, f.cz, f.elevation, size.width, size.height, camera])

  useEffect(() => {
    flying.current = true
  }, [goal, nonce])

  useEffect(() => {
    const c = controls as unknown as THREE.EventDispatcher<{ start: object }> | null
    if (!c) return
    const stop = () => {
      flying.current = false
    }
    c.addEventListener('start', stop)
    return () => c.removeEventListener('start', stop)
  }, [controls])

  useFrame((_, dt) => {
    if (!flying.current) return
    const k = 1 - Math.exp(-5 * Math.min(dt, 0.1))
    camera.position.lerp(goal.pos, k)
    const c = controls as unknown as { target: THREE.Vector3; update: () => void } | null
    if (c) {
      c.target.lerp(goal.t, k)
      c.update()
    }
    if (camera.position.distanceTo(goal.pos) < 0.05) flying.current = false
  })
  return null
}

function WorldView({ theme, step }: { theme: Theme; step: SeqStep }) {
  const { snap, hot } = step
  const accent = TONE[step.tone]
  const World = theme.World
  const caps = snap.rows.map((r) => r.length).join(',')
  const stacks: Record<string, number> = {}
  const signs = Object.entries(snap.pointers).flatMap(([name, at]) => {
    if (!at) return []
    const k = `${at.row}:${at.i}`
    const stack = stacks[k] ?? 0
    stacks[k] = stack + 1
    return [{ name, goal: theme.sign(snap, at, stack) }]
  })
  return (
    <>
      <World caps={caps} mode={snap.mode} />
      <Rig theme={theme} snap={snap} />
      {Object.values(snap.items).map((it) => (
        <ItemView
          key={it.id}
          item={it}
          snap={snap}
          theme={theme}
          accent={accent}
          hot={it.loc.k === 'slot' && hot.includes(`${it.loc.row}:${it.loc.i}`)}
        />
      ))}
      {signs.map((s) => <Sign key={s.name} {...s} />)}
    </>
  )
}

export function SeqStage({ theme }: { theme: Theme }) {
  const step = useSeq((s) => s.steps[s.idx])
  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ fov: 30, position: [0, 10, 44], near: 0.5, far: 400 }} aria-label="3D simulation">
      <color attach="background" args={[theme.bg]} />
      <fog attach="fog" args={[theme.bg, 90, 200]} />
      <hemisphereLight args={['#fff4e0', '#3a3040', 1.25]} />
      <directionalLight position={[12, 26, 20]} intensity={2.3} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={40} shadow-camera-bottom={-40} shadow-camera-far={110} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.61, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color={theme.ground} />
      </mesh>
      <Grid position={[0, -0.6, 0]} args={[300, 300]} cellSize={1} cellThickness={0.5} cellColor={theme.grid[0]} sectionSize={5} sectionThickness={1} sectionColor={theme.grid[1]} fadeDistance={130} fadeStrength={1.2} infiniteGrid />
      <OrbitControls makeDefault enableDamping maxPolarAngle={Math.PI / 2.02} minDistance={8} maxDistance={140} />
      <Suspense fallback={null}>
        <WorldView theme={theme} step={step} />
      </Suspense>
    </Canvas>
  )
}
