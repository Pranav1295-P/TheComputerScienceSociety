import { RoundedBox } from '@react-three/drei'
import { forwardRef } from 'react'
import type { Group } from 'three'

export const PAINT = ['#e4572e', '#f3a712', '#2e9e83', '#f2efe6', '#c8553d', '#5b8def', '#d98cb3']
export const paintFor = (id: string) => PAINT[[...id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % PAINT.length]

const WHEEL = '#1b2333'

export const Wheels = forwardRef<Group, { xs: number[]; r?: number }>(function Wheels({ xs, r = 0.3 }, ref) {
  return (
    <group ref={ref}>
      {xs.flatMap((x) =>
        [-0.5, 0.5].map((z) => (
          <group key={`${x}${z}`} position={[x, r, z]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[r, r, 0.1, 18]} />
              <meshStandardMaterial color={WHEEL} metalness={0.5} roughness={0.5} />
            </mesh>
            <mesh position={[r * 0.5, 0, z > 0 ? 0.06 : -0.06]}>
              <boxGeometry args={[r * 0.9, 0.06, 0.02]} />
              <meshStandardMaterial color="#c9d3e6" />
            </mesh>
          </group>
        )),
      )}
    </group>
  )
})

export function WagonBody({
  color,
  emissive = '#000000',
  glow = 0,
  opacity = 1,
  dummy = false,
}: {
  color: string
  emissive?: string
  glow?: number
  opacity?: number
  dummy?: boolean
}) {
  const clear = opacity < 1
  return (
    <group>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[2.3, 0.14, 1.04]} />
        <meshStandardMaterial color="#232c40" transparent={clear} opacity={opacity} />
      </mesh>
      <RoundedBox args={[2.5, 0.92, 1.2]} radius={0.08} position={[0, 1.04, 0]} castShadow>
        <meshStandardMaterial color={dummy ? '#8d9ab3' : color} emissive={emissive} emissiveIntensity={glow} roughness={0.55} transparent={clear} opacity={opacity} />
      </RoundedBox>
      {[-0.72, 0, 0.72].map((x) => (
        <mesh key={x} position={[x, 1.14, 0.605]}>
          <boxGeometry args={[0.46, 0.36, 0.02]} />
          <meshStandardMaterial color="#fff3c4" emissive="#ffcf70" emissiveIntensity={0.55} transparent={clear} opacity={opacity} />
        </mesh>
      ))}
      <RoundedBox args={[2.62, 0.12, 1.32]} radius={0.05} position={[0, 1.57, 0]} castShadow>
        <meshStandardMaterial color="#f4efe1" roughness={0.7} transparent={clear} opacity={opacity} />
      </RoundedBox>
    </group>
  )
}

export function EngineBody() {
  return (
    <group>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[3.1, 0.16, 1.1]} />
        <meshStandardMaterial color="#1c2436" />
      </mesh>
      <mesh position={[0.45, 1.05, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.52, 0.52, 2, 24]} />
        <meshStandardMaterial color="#17624f" metalness={0.25} roughness={0.4} />
      </mesh>
      {[-0.2, 0.45, 1.1].map((x) => (
        <mesh key={x} position={[x, 1.05, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.54, 0.54, 0.07, 24]} />
          <meshStandardMaterial color="#ffd23f" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[1.1, 1.82, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.14, 0.62, 14]} />
        <meshStandardMaterial color="#1b2333" />
      </mesh>
      <mesh position={[1.47, 1.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.04, 16]} />
        <meshStandardMaterial color="#fff3c4" emissive="#ffe08a" emissiveIntensity={1.4} />
      </mesh>
      <RoundedBox args={[1, 1.35, 1.14]} radius={0.06} position={[-1, 1.22, 0]} castShadow>
        <meshStandardMaterial color="#0f4a3c" roughness={0.5} />
      </RoundedBox>
      <mesh position={[-1, 1.42, 0.575]}>
        <boxGeometry args={[0.5, 0.42, 0.02]} />
        <meshStandardMaterial color="#fff3c4" emissive="#ffcf70" emissiveIntensity={0.6} />
      </mesh>
      <RoundedBox args={[1.3, 0.11, 1.34]} radius={0.05} position={[-1, 1.94, 0]} castShadow>
        <meshStandardMaterial color="#ffd23f" />
      </RoundedBox>
      <Wheels xs={[-0.95, 0.15, 1.05]} r={0.33} />
    </group>
  )
}
