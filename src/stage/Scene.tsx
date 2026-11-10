import { Billboard, Grid, OrbitControls, Text } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import fontUrl from '@fontsource/barlow-condensed/files/barlow-condensed-latin-700-normal.woff?url'
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { bayPos, computeLayout, type Layout } from '../engine/layout'
import { ENGINE_ID, type LinkKind, type NodeS, type Snap, type Step, type Tone } from '../engine/rec'
import { useLab } from '../store'
import { EngineBody, WagonBody, Wheels, paintFor } from './models'

export const POINTER_COLORS: Record<string, string> = {
  cur: '#4fd1ff', curr: '#4fd1ff', slow: '#4fd1ff', fast: '#ff9de2', prev: '#ffb26b', nxt: '#c3a6ff',
  w: '#7CFC9A', victim: '#ff5a6a', tail: '#ff8a5c', 'tail.next': '#6ff0c0', p1: '#4fd1ff', p2: '#ff9de2', a: '#7CFC9A', b: '#c3a6ff',
}
const WALKERS = new Set(['cur', 'curr', 'slow', 'fast', 'p1', 'p2'])
const TONE_COLOR: Record<Tone, string> = {
  info: '#ffd23f', make: '#7CFC9A', link: '#ffd23f', cut: '#ff5a6a', walk: '#4fd1ff', warn: '#ff9f43', done: '#6ff0c0',
}

interface Live { x: number; y: number; z: number; yaw: number }
const live = new Map<string, Live>()

const dampAngle = (c: number, t: number, l: number, d: number) => {
  const delta = ((t - c + Math.PI * 3) % (Math.PI * 2)) - Math.PI
  return c + delta * (1 - Math.exp(-l * d))
}

function Driver({ layout, snap }: { layout: Layout; snap: Snap }) {
  useFrame((_, dt) => {
    const d = Math.min(dt, 0.1)
    const speed = useLab.getState().speed
    const l = 3.4 * (0.6 + speed * 0.4)
    const seen = new Set<string>()
    const update = (id: string, x: number, z: number, yaw: number, spawn: number) => {
      seen.add(id)
      let s = live.get(id)
      if (!s) {
        s = { x, y: spawn, z, yaw }
        live.set(id, s)
      }
      s.x = THREE.MathUtils.damp(s.x, x, l, d)
      s.z = THREE.MathUtils.damp(s.z, z, l, d)
      s.y = THREE.MathUtils.damp(s.y, 0, l * 1.3, d)
      s.yaw = dampAngle(s.yaw, yaw, l, d)
    }
    for (const [id, p] of Object.entries(layout.poses)) {
      const n = snap.nodes[id]
      update(id, p.x, p.z - (n.lost ? 1.8 : 0), p.yaw, 7)
    }
    update(ENGINE_ID, layout.engine.x, layout.engine.z, layout.engine.yaw, 0)
    for (const id of [...live.keys()]) if (!seen.has(id)) live.delete(id)
  })
  return null
}

function Label({ text, y = 0, size, color, anchorX = 'center' as const }: { text: string; y?: number; size: number; color: string; anchorX?: 'center' }) {
  return (
    <Text font={fontUrl} fontSize={size} color={color} anchorX={anchorX} anchorY="middle" position={[0, y, 0.01]}>
      {text}
    </Text>
  )
}

function Wagon({ node, hot, tone }: { node: NodeS; hot: boolean; tone: Tone }) {
  const root = useRef<THREE.Group>(null!)
  const wheels = useRef<THREE.Group>(null!)
  const ring = useRef<THREE.Mesh>(null!)
  const lastX = useRef<number | null>(null)
  const scale = useRef(1)
  const color = useMemo(() => paintFor(node.id), [node.id])
  const accent = TONE_COLOR[tone]

  useFrame((state, dt) => {
    const l = live.get(node.id)
    if (!l) return
    root.current.position.set(l.x, l.y, l.z)
    root.current.rotation.y = l.yaw
    scale.current = THREE.MathUtils.damp(scale.current, node.freed ? 0.001 : 1, 7, Math.min(dt, 0.1))
    root.current.scale.setScalar(scale.current)
    if (lastX.current !== null) {
      const dist = Math.hypot(l.x - lastX.current, 0)
      wheels.current.children.forEach((w) => (w.rotation.z -= dist / 0.3))
    }
    lastX.current = l.x
    if (ring.current) ring.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 5) * 0.06)
  })

  return (
    <group ref={root}>
      <WagonBody color={node.lost ? '#6e3b44' : color} emissive={hot ? accent : '#000000'} glow={hot ? 0.45 : 0} opacity={node.lost ? 0.55 : 1} dummy={node.dummy} />
      <Wheels ref={wheels} xs={[-0.8, 0.8]} />
      {hot && (
        <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
          <ringGeometry args={[1.75, 1.95, 48]} />
          <meshBasicMaterial color={accent} toneMapped={false} transparent opacity={0.9} />
        </mesh>
      )}
      <Billboard position={[0, 2.5, 0]}>
        <mesh>
          <planeGeometry args={[1.75, 1.2]} />
          <meshBasicMaterial color={node.lost ? '#3a1f28' : hot ? '#fff6d6' : '#f4efe1'} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.61, 0.002]}>
          <planeGeometry args={[1.75, 0.06]} />
          <meshBasicMaterial color={hot ? accent : '#0b1730'} toneMapped={false} />
        </mesh>
        <Label text={node.value} y={0.14} size={node.value.length > 3 ? 0.56 : 0.8} color={node.lost ? '#ff9aa6' : '#0b1730'} />
        <Label text={node.addr} y={-0.41} size={0.27} color={node.lost ? '#ff9aa6' : '#40547a'} />
      </Billboard>
    </group>
  )
}

function Engine({ label, hot }: { label: string; hot: boolean }) {
  const root = useRef<THREE.Group>(null!)
  useFrame(() => {
    const l = live.get(ENGINE_ID)
    if (!l) return
    root.current.position.set(l.x, l.y, l.z)
    root.current.rotation.y = l.yaw
  })
  return (
    <group ref={root}>
      <EngineBody />
      <Billboard position={[0, 3.05, 0]}>
        <mesh>
          <planeGeometry args={[2, 0.92]} />
          <meshBasicMaterial color={hot ? '#baffe6' : '#6ff0c0'} toneMapped={false} />
        </mesh>
        <Label text={label} size={0.68} color="#06281f" />
      </Billboard>
    </group>
  )
}

const N = 20
const UP = new THREE.Vector3(0, 1, 0)
const BASE: Record<LinkKind, string> = { next: '#ffd23f', prev: '#ff7a59', entry: '#6ff0c0' }
const v0 = new THREE.Vector3(), v1 = new THREE.Vector3(), mid = new THREE.Vector3(), dir = new THREE.Vector3(), scaleV = new THREE.Vector3()
const P0 = new THREE.Vector3(), P1 = new THREE.Vector3(), P2 = new THREE.Vector3()
const quat = new THREE.Quaternion(), mat = new THREE.Matrix4(), col = new THREE.Color(), white = new THREE.Color('#ffffff')

const bez = (t: number, out: THREE.Vector3) => {
  const u = 1 - t
  return out.set(
    u * u * P0.x + 2 * u * t * P1.x + t * t * P2.x,
    u * u * P0.y + 2 * u * t * P1.y + t * t * P2.y,
    u * u * P0.z + 2 * u * t * P1.z + t * t * P2.z,
  )
}

function placeCurve(from: string, a: Live, b: Live | null, to: string | null, kind: LinkKind) {
  const half = from === ENGINE_ID ? 1.72 : 1.28
  const fx = Math.cos(a.yaw), fz = -Math.sin(a.yaw)
  const y = kind === 'prev' ? 0.72 : 1.04
  const side = kind === 'prev' ? -0.22 : kind === 'next' ? 0.22 : 0
  const sideOf = (l: Live) => ({ x: Math.sin(l.yaw) * side, z: Math.cos(l.yaw) * side })
  const sa = sideOf(a)
  if (!b) {
    const s = kind === 'prev' ? -1 : 1
    P0.set(a.x + fx * half * s + sa.x, a.y + y, a.z + fz * half * s + sa.z)
    P2.set(P0.x + fx * 1.0 * s, P0.y, P0.z + fz * 1.0 * s)
    P1.copy(P0).lerp(P2, 0.5)
    return
  }
  if (from === to) {
    P0.set(a.x + fx * half + sa.x, a.y + y, a.z + fz * half + sa.z)
    P2.set(a.x - fx * half + sa.x, a.y + y, a.z - fz * half + sa.z)
    P1.set(a.x, a.y + 5.4, a.z)
    return
  }
  const dx = b.x - a.x, dz = b.z - a.z
  const s = dx * fx + dz * fz >= 0 ? 1 : -1
  const bf = { x: Math.cos(b.yaw), z: -Math.sin(b.yaw) }
  const s2 = -dx * bf.x + -dz * bf.z >= 0 ? 1 : -1
  const sb = sideOf(b)
  P0.set(a.x + fx * half * s + sa.x, a.y + y, a.z + fz * half * s + sa.z)
  P2.set(b.x + bf.x * 1.28 * s2 + sb.x, b.y + y, b.z + bf.z * 1.28 * s2 + sb.z)
  const dist = Math.hypot(P2.x - P0.x, P2.z - P0.z)
  const arc = kind === 'prev' ? -0.12 + (dist > 3 ? dist * 0.12 : 0) : 0.35 + dist * 0.17
  P1.copy(P0).lerp(P2, 0.5)
  P1.y += arc * 2
}

function Link({ from, to, kind, hot = false, ghost = false, lost = false }: { from: string; to: string | null; kind: LinkKind; hot?: boolean; ghost?: boolean; lost?: boolean }) {
  const inst = useRef<THREE.InstancedMesh>(null!)
  const cone = useRef<THREE.Mesh>(null!)
  const nul = useRef<THREE.Group>(null!)
  const grow = useRef(ghost ? 1 : 0)
  const base = useMemo(() => new THREE.Color(ghost ? '#ff3b4e' : lost ? '#8a5a5a' : BASE[kind]), [ghost, lost, kind])

  useEffect(() => {
    if (!ghost) grow.current = 0
  }, [to, ghost])

  useLayoutEffect(() => {
    for (let i = 0; i < N; i++) inst.current.setColorAt(i, base)
    if (inst.current.instanceColor) inst.current.instanceColor.needsUpdate = true
  }, [base])

  useFrame((state, dt) => {
    const a = live.get(from)
    const b = to ? live.get(to) : null
    const ok = !!a && (!to || !!b)
    inst.current.visible = ok
    cone.current.visible = ok && !!to
    nul.current.visible = ok && !to
    if (!a || (to && !b)) return
    grow.current = Math.min(1, grow.current + dt * 2.4)
    placeCurve(from, a, b ?? null, to, kind)
    const g = grow.current
    const r = ghost ? 0.05 : hot ? 0.14 : 0.075
    const time = state.clock.elapsedTime * (hot ? 1.6 : 0.7)
    for (let i = 0; i < N; i++) {
      bez((i / N) * g, v0)
      bez(((i + 1) / N) * g, v1)
      mid.copy(v0).add(v1).multiplyScalar(0.5)
      dir.copy(v1).sub(v0)
      const len = dir.length()
      if (len > 1e-5) dir.divideScalar(len)
      quat.setFromUnitVectors(UP, dir)
      const hide = ghost && i % 2 === 1
      scaleV.set(hide ? 0 : r, hide ? 0 : len * 1.04, hide ? 0 : r)
      mat.compose(mid, quat, scaleV)
      inst.current.setMatrixAt(i, mat)
      const phase = (i / N - time) % 1
      const pulse = ghost ? 0 : Math.pow(Math.max(0, Math.cos(((phase + 1) % 1) * Math.PI * 2)), 18)
      inst.current.setColorAt(i, col.copy(base).lerp(white, pulse * 0.85))
    }
    inst.current.instanceMatrix.needsUpdate = true
    inst.current.instanceColor!.needsUpdate = true
    if (to) {
      bez(g, v1)
      bez(Math.max(0, g - 0.04), v0)
      dir.copy(v1).sub(v0).normalize()
      cone.current.position.copy(v1)
      cone.current.quaternion.setFromUnitVectors(UP, dir)
      const c = hot ? 1.45 : 1
      cone.current.scale.set(c, c, c)
    } else {
      nul.current.position.copy(P2)
    }
  })

  return (
    <>
      <instancedMesh ref={inst} args={[undefined, undefined, N]} frustumCulled={false}>
        <cylinderGeometry args={[1, 1, 1, 8]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <mesh ref={cone} frustumCulled={false}>
        <coneGeometry args={[0.24, 0.55, 14]} />
        <meshBasicMaterial color={base} toneMapped={false} />
      </mesh>
      <group ref={nul}>
        <Billboard>
          <mesh>
            <planeGeometry args={[0.92, 0.42]} />
            <meshBasicMaterial color="#0b1730" toneMapped={false} />
          </mesh>
          <Label text="NULL" size={0.31} color="#ff8fa0" />
        </Billboard>
      </group>
    </>
  )
}

function Pointer({ name, target, stack, park }: { name: string; target: string | null; stack: number; park: { x: number; z: number } }) {
  const sign = useRef<THREE.Group>(null!)
  const fig = useRef<THREE.Group>(null!)
  const cur = useRef<Live | null>(null)
  const color = POINTER_COLORS[name] ?? '#c3d3ee'
  const label = target ? name : `${name} = NULL`
  const walker = WALKERS.has(name)

  useFrame((_, dt) => {
    const t = target ? live.get(target) : null
    const tx = t ? t.x : park.x
    const tz = t ? t.z : park.z
    if (!cur.current) cur.current = { x: tx, y: 0, z: tz, yaw: 0 }
    const c = cur.current
    const d = Math.min(dt, 0.1)
    const l = 5 * (0.6 + useLab.getState().speed * 0.4)
    c.x = THREE.MathUtils.damp(c.x, tx, l, d)
    c.z = THREE.MathUtils.damp(c.z, tz, l, d)
    sign.current.position.set(c.x, (target ? 4.25 : 1.1) + stack * 1.02, c.z)
    if (fig.current) {
      const gap = Math.hypot(tx - c.x, tz - c.z)
      fig.current.visible = !!target
      fig.current.position.set(c.x, 1.63 + Math.min(1.4, gap * 0.55), c.z)
    }
  })

  return (
    <>
      <group ref={sign}>
        <Billboard>
          <mesh>
            <planeGeometry args={[Math.max(0.9, label.length * 0.25 + 0.3), 0.66]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
          <Label text={label} size={0.46} color="#0b1730" />
          {target && stack === 0 && (
            <mesh position={[0, -0.44, 0]} rotation={[0, 0, Math.PI]}>
              <coneGeometry args={[0.16, 0.24, 3]} />
              <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
          )}
        </Billboard>
      </group>
      {walker && (
        <group ref={fig}>
          <mesh position={[0, 0.36, 0]} castShadow>
            <capsuleGeometry args={[0.15, 0.36, 6, 12]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0, 0.84, 0]} castShadow>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color="#f7d9b5" />
          </mesh>
          <mesh position={[0, 0.96, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.05, 16]} />
            <meshStandardMaterial color="#0b1730" />
          </mesh>
        </group>
      )}
    </>
  )
}

const RAIL = '#c9d3e6'
const SLEEPER = '#2a4678'

function Sleepers({ transforms }: { transforms: { x: number; z: number; yaw: number }[] }) {
  const ref = useRef<THREE.InstancedMesh>(null!)
  useLayoutEffect(() => {
    const o = new THREE.Object3D()
    transforms.forEach((t, i) => {
      o.position.set(t.x, 0.03, t.z)
      o.rotation.set(0, t.yaw, 0)
      o.updateMatrix()
      ref.current.setMatrixAt(i, o.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [transforms])
  return (
    <instancedMesh key={transforms.length} ref={ref} args={[undefined, undefined, transforms.length]} receiveShadow>
      <boxGeometry args={[0.3, 0.06, 1.6]} />
      <meshStandardMaterial color={SLEEPER} />
    </instancedMesh>
  )
}

function Track({ layout }: { layout: Layout }) {
  const sleepers = useMemo(() => {
    const out: { x: number; z: number; yaw: number }[] = []
    if (layout.mode === 'line') {
      const [a, b] = layout.span
      for (const z of layout.lanes) for (let x = a; x <= b; x += 0.85) out.push({ x, z, yaw: 0 })
    } else if (layout.mode === 'ring') {
      const R = layout.ringR
      const n = Math.round((Math.PI * 2 * R) / 0.85)
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2
        out.push({ x: R * Math.cos(a), z: R * Math.sin(a), yaw: -a })
      }
    }
    return out
  }, [layout.mode, layout.ringR, layout.span[0], layout.span[1], layout.lanes.join()])

  if (layout.mode === 'yard') {
    return (
      <>
        {Array.from({ length: 24 }, (_, s) => {
          const p = bayPos(s)
          return (
            <group key={s} position={[p.x, 0.02, p.z]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[5.4, 4.5]} />
                <meshStandardMaterial color="#17396f" />
              </mesh>
              <Text font={fontUrl} rotation={[-Math.PI / 2, 0, 0]} position={[-1.4, 0.02, 1.8]} fontSize={0.62} color="#9db8e2">
                {'0x' + (0xa000 + s * 0x20).toString(16).toUpperCase()}
              </Text>
            </group>
          )
        })}
      </>
    )
  }
  if (layout.mode === 'ring') {
    return (
      <>
        <Sleepers transforms={sleepers} />
        {[-0.5, 0.5].map((o) => (
          <mesh key={o} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.09, 0]}>
            <torusGeometry args={[layout.ringR + o, 0.05, 8, 128]} />
            <meshStandardMaterial color={RAIL} metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
      </>
    )
  }
  const [a, b] = layout.span
  return (
    <>
      <Sleepers transforms={sleepers} />
      {layout.lanes.flatMap((z) =>
        [-0.5, 0.5].map((o) => (
          <mesh key={`${z}${o}`} position={[(a + b) / 2, 0.09, z + o]}>
            <boxGeometry args={[b - a, 0.09, 0.09]} />
            <meshStandardMaterial color={RAIL} metalness={0.7} roughness={0.3} />
          </mesh>
        )),
      )}
    </>
  )
}

function CameraRig({ layout }: { layout: Layout }) {
  const { camera, size, controls } = useThree()
  const nonce = useLab((s) => s.camNonce)
  const flying = useRef(true)
  const { halfW, halfD, cx, cz, elevation } = layout.fit
  const goal = useMemo(() => {
    const persp = camera as THREE.PerspectiveCamera
    const el = THREE.MathUtils.degToRad(elevation)
    const tan = Math.tan(THREE.MathUtils.degToRad(persp.fov / 2))
    const aspect = size.width / Math.max(size.height, 1)
    const halfV = halfD * Math.sin(el) + 5.4 * Math.cos(el) + 1
    const dist = Math.max(halfW / (tan * aspect), halfV / tan, 14) + halfD * Math.cos(el)
    const target = new THREE.Vector3(cx, 1.7, cz)
    return { target, pos: new THREE.Vector3(cx, 1.7 + dist * Math.sin(el), cz + dist * Math.cos(el)) }
  }, [halfW, halfD, cx, cz, elevation, size.width, size.height, camera])

  useEffect(() => {
    flying.current = true
  }, [goal, nonce])

  // Hand the camera to the learner the moment they start dragging.
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
      c.target.lerp(goal.target, k)
      c.update()
    }
    if (camera.position.distanceTo(goal.pos) < 0.05) flying.current = false
  })
  return null
}

function World({ step }: { step: Step }) {
  const baseView = useLab((s) => s.view)
  const view = step.view ?? baseView
  const { snap } = step
  const layout = useMemo(() => computeLayout(snap, view), [snap, view])
  const hotL = new Set(step.hotLinks)
  const hotN = new Set(step.hotNodes)
  const nodes = Object.values(snap.nodes)

  const stacks: Record<string, number> = {}
  const pointers = Object.entries(snap.pointers).map(([name, target]) => {
    const k = target ?? '__null'
    const stack = stacks[k] ?? 0
    stacks[k] = stack + 1
    return { name, target, stack }
  })
  const park = layout.mode === 'line' ? { x: layout.span[1] + 0.2, z: -2.2 } : { x: 0, z: -2.6 }

  return (
    <>
      <Driver layout={layout} snap={snap} />
      <CameraRig layout={layout} />
      <Track layout={layout} />
      {snap.showEntry && <Engine label={snap.entryLabel} hot={hotL.has(`${ENGINE_ID}:entry`)} />}
      {snap.showEntry && <Link from={ENGINE_ID} to={snap.entry} kind="entry" hot={hotL.has(`${ENGINE_ID}:entry`)} />}
      {nodes.map((n) => (
        <Wagon key={n.id} node={n} hot={hotN.has(n.id)} tone={step.tone} />
      ))}
      {nodes.filter((n) => !n.freed).flatMap((n) => {
        const showPrev = snap.kind === 'doubly' && (n.prev !== null || !n.dummy)
        return [
          (n.next !== null || !n.dummy) && <Link key={`${n.id}:next`} from={n.id} to={n.next} kind="next" hot={hotL.has(`${n.id}:next`)} lost={n.lost} />,
          showPrev && <Link key={`${n.id}:prev`} from={n.id} to={n.prev} kind="prev" hot={hotL.has(`${n.id}:prev`)} lost={n.lost} />,
        ]
      })}
      {step.ghosts.map((g) => (
        <Link key={`g${g.from}:${g.kind}:${g.to}`} from={g.from} to={g.to} kind={g.kind} ghost />
      ))}
      {pointers.map((p) => (
        <Pointer key={p.name} name={p.name} target={p.target} stack={p.stack} park={park} />
      ))}
    </>
  )
}

export function Stage() {
  const step = useLab((s) => s.steps[s.idx])
  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ fov: 30, position: [0, 18, 46], near: 0.5, far: 400 }} aria-label="3D train simulation of the linked list">
      <color attach="background" args={['#0f2c5c']} />
      <fog attach="fog" args={['#0f2c5c', 80, 190]} />
      <hemisphereLight args={['#dfe9ff', '#203a6b', 1.2]} />
      <directionalLight position={[14, 30, 18]} intensity={2.3} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-45} shadow-camera-right={45} shadow-camera-top={45} shadow-camera-bottom={-45} shadow-camera-far={110} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#123468" />
      </mesh>
      <Grid position={[0, 0.005, 0]} args={[300, 300]} cellSize={1} cellThickness={0.5} cellColor="#23508f" sectionSize={5} sectionThickness={1} sectionColor="#3a70b8" fadeDistance={150} fadeStrength={1.2} infiniteGrid />
      <OrbitControls makeDefault enableDamping maxPolarAngle={Math.PI / 2.05} minDistance={8} maxDistance={140} />
      <Suspense fallback={null}>
        <World step={step} />
      </Suspense>
    </Canvas>
  )
}
