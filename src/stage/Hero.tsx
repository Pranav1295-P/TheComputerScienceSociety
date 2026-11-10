import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { EngineBody, PAINT, WagonBody, Wheels } from './models'

const R = 9
const COUNT = 8

function Loop() {
  const g = useRef<Group>(null!)
  useFrame((_, dt) => {
    g.current.rotation.y += dt * 0.16
  })
  return (
    <group ref={g}>
      {Array.from({ length: COUNT + 1 }, (_, i) => {
        const a = (i / (COUNT + 1)) * Math.PI * 2
        return (
          <group key={i} position={[R * Math.cos(a), 0, R * Math.sin(a)]} rotation={[0, -a - Math.PI / 2, 0]}>
            {i === 0 ? (
              <EngineBody />
            ) : (
              <>
                <WagonBody color={PAINT[i % PAINT.length]} />
                <Wheels xs={[-0.8, 0.8]} />
              </>
            )}
          </group>
        )
      })}
    </group>
  )
}

export function Hero() {
  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ fov: 28, position: [0, 15, 34] }} gl={{ alpha: true }} aria-hidden>
      <hemisphereLight args={['#dfe9ff', '#203a6b', 1.3]} />
      <directionalLight position={[10, 24, 12]} intensity={2.2} castShadow />
      <group position={[0, -2, 0]}>
        {[-0.5, 0.5].map((o) => (
          <mesh key={o} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
            <torusGeometry args={[R + o, 0.05, 8, 128]} />
            <meshStandardMaterial color="#c9d3e6" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
        <Loop />
      </group>
    </Canvas>
  )
}
