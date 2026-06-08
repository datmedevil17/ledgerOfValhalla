/**
 * MonkDrop — spawns 3 actual Monk.gltf characters at the cast point.
 * Each monk appears via a portal with a staggered delay, then runs an
 * attack cycle (punch + lunge) using useFrame procedural animation.
 * If the GLTF has embedded animation clips they are played automatically.
 */
import { useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'

// ── Per-monk animated character ───────────────────────────────────────────────
interface MonkCharProps {
  offset: [number, number, number]
  spawnDelay: number   // seconds before appearing
  attackPhase: number  // 0-1 offset so monks don't sync perfectly
}

function MonkChar({ offset, spawnDelay, attackPhase }: MonkCharProps) {
  const { scene, animations } = useGLTF('/glTF/Monk.gltf')
  const groupRef = useRef<THREE.Group>(null)
  const cloned = useRef(scene.clone(true)).current

  // Try to play built-in animations
  const { actions, names } = useAnimations(animations, groupRef)
  useEffect(() => {
    // Play first available clip (Attack, idle, etc.)
    const clip = names[0]
    if (clip && actions[clip]) {
      actions[clip]!.reset().setLoop(THREE.LoopRepeat, Infinity).play()
    }
  }, [actions, names])

  // Procedural attack cycle: lunge forward + punch bob
  const born = useRef(false)
  const spawnTime = useRef<number | null>(null)

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime

    // Track spawn time to drive reveal
    if (spawnTime.current === null) spawnTime.current = t + spawnDelay

    const age = t - spawnTime.current
    if (age < 0) {
      groupRef.current.scale.setScalar(0)
      return
    }

    // Scale up reveal pop
    if (!born.current) {
      const p = Math.min(age / 0.35, 1)
      const bounce = p < 0.7 ? p / 0.7 : 1 + Math.sin((p - 0.7) / 0.3 * Math.PI) * 0.15
      groupRef.current.scale.setScalar(bounce)
      if (p >= 1) born.current = true
      return
    }

    groupRef.current.scale.setScalar(1)

    // Attack cycle: lunge forward every ~1.8s, bob continuously
    const cycle = (t * 0.55 + attackPhase) % 1
    const lunge = cycle < 0.25 ? Math.sin(cycle / 0.25 * Math.PI) * 0.18 : 0
    groupRef.current.position.set(
      offset[0] + lunge,
      offset[1] + Math.sin(t * 2.2 + attackPhase * 6) * 0.04,
      offset[2],
    )

    // Slight punch lean
    groupRef.current.rotation.z = -lunge * 0.4
  })

  return (
    <group ref={groupRef} scale={0} position={offset}>
      <primitive object={cloned} />
    </group>
  )
}

// ── Portal ring that appears under each monk ──────────────────────────────────
function PortalRing({ color }: { color: string }) {
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '72%',
      width: 70, height: 18, borderRadius: '50%',
      background: `radial-gradient(ellipse, ${color}55 0%, transparent 70%)`,
      transform: 'translate(-50%,-50%)',
      boxShadow: `0 0 14px ${color}44`,
    }} />
  )
}

// ── Main exported component ───────────────────────────────────────────────────
interface MonkDropProps {
  x: number   // viewport x of click
  y: number   // viewport y of click
}

// Three monks side by side in their own 3D canvases
const MONKS: Array<{
  dxPx: number          // horizontal offset in px from click
  offset3d: [number, number, number]
  delay: number         // seconds
  phase: number         // attack phase offset
}> = [
  { dxPx: -80, offset3d: [0, -0.8, 0], delay: 0,   phase: 0    },
  { dxPx:   0, offset3d: [0, -0.8, 0], delay: 0.18, phase: 0.33 },
  { dxPx:  80, offset3d: [0, -0.8, 0], delay: 0.36, phase: 0.66 },
]

export function MonkDrop({ x, y }: MonkDropProps) {
  const size = 160   // canvas size per monk

  return (
    <>
      <style>{`
        @keyframes monk-spawn {
          0%   { opacity:0; transform:translate(-50%,-50%) scale(0) rotateX(55deg); }
          40%  { opacity:1; transform:translate(-50%,-50%) scale(1.08) rotateX(0deg); }
          100% { opacity:1; transform:translate(-50%,-50%) scale(1) rotateX(0deg); }
        }
        @keyframes monk-fade {
          0%,80% { opacity:1; }
          100%   { opacity:0; }
        }
      `}</style>

      {MONKS.map((m, i) => (
        <div
          key={i}
          style={{
            position: 'fixed',
            left: x + m.dxPx - size / 2,
            top:  y - size / 2,
            width:  size,
            height: size,
            pointerEvents: 'none',
            zIndex: 44,
            animation: `monk-spawn .5s ease-out ${m.delay}s forwards, monk-fade 20s linear ${m.delay + 1}s forwards`,
            opacity: 0,
          }}
        >
          {/* Ground portal glow */}
          <PortalRing color="#ff8844" />

          <Canvas
            camera={{ position: [0, 0.35, 2.6], fov: 42 }}
            style={{ width: '100%', height: '100%' }}
            gl={{ alpha: true, antialias: true }}
          >
            <ambientLight intensity={0.45} />
            <directionalLight position={[3, 5, 3]} intensity={1.3} color="#ffe8cc" />
            <pointLight position={[0, 1, 0.5]} intensity={1.5} color="#ff8844" distance={4} />
            <MonkChar
              offset={m.offset3d}
              spawnDelay={m.delay}
              attackPhase={m.phase}
            />
          </Canvas>
        </div>
      ))}

      {/* "3 MONKS DEPLOYED" label */}
      <div style={{
        position: 'fixed',
        left: x, top: y - size / 2 - 14,
        transform: 'translate(-50%,0)',
        pointerEvents: 'none', zIndex: 45,
        color: '#ffaa66', fontWeight: 900, fontSize: 16,
        textShadow: '0 0 12px #ff6600, 0 0 4px #fff',
        animation: 'fx-float 1.2s ease-out .4s forwards', opacity: 0,
      }}>3 MONKS DEPLOYED</div>
    </>
  )
}

useGLTF.preload('/glTF/Monk.gltf')
