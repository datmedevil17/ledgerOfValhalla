/**
 * LightningWizardDrop — spawns the actual Wizard.gltf at 2× size
 * with electric arc rings and a "2× STATS · 30s" label.
 * Uses React Three Fiber + @react-three/drei (already installed).
 */
import { useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Float } from '@react-three/drei'
import * as THREE from 'three'

// ── Animated wizard model ─────────────────────────────────────────────────────
function WizardModel() {
  const { scene } = useGLTF('/glTF/Wizard.gltf')
  const ref = useRef<THREE.Group>(null)

  // Clone so multiple instances don't share materials
  const cloned = useRef(scene.clone(true)).current

  // Apply electric blue emissive tint to all meshes
  useEffect(() => {
    cloned.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach(m => {
          const mat = m as THREE.MeshStandardMaterial
          mat.emissive    = new THREE.Color('#3399ff')
          mat.emissiveIntensity = 0.55
          mat.needsUpdate = true
        })
      }
    })
  }, [cloned])

  // Idle hover + slow rotate
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.elapsedTime * 0.6
    ref.current.position.y = Math.sin(clock.elapsedTime * 1.4) * 0.08
  })

  return (
    <Float speed={1.2} rotationIntensity={0} floatIntensity={0.3}>
      <group ref={ref} scale={[2, 2, 2]} position={[0, -0.9, 0]}>
        <primitive object={cloned} />
      </group>
    </Float>
  )
}

// ── Electric arc ring (CSS, no extra deps) ─────────────────────────────────────
function ArcRing({ radius, delay }: { radius: number; delay: number }) {
  return (
    <div style={{
      position: 'absolute',
      width:  radius * 2,
      height: radius * 2,
      borderRadius: '50%',
      border: '2px solid #66ccff',
      left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      boxShadow: '0 0 12px #3399ff88, inset 0 0 8px #3399ff44',
      animation: `lw-ring ${0.9 + delay * 0.3}s ease-out ${delay}s infinite`,
      opacity: 0,
    }} />
  )
}

// ── Main component ────────────────────────────────────────────────────────────
interface LightningWizardDropProps {
  x: number   // viewport x of click
  y: number   // viewport y of click
}

export function LightningWizardDrop({ x, y }: LightningWizardDropProps) {
  const size = 220   // canvas size in px

  return (
    <>
      {/* Keyframes injected inline once */}
      <style>{`
        @keyframes lw-ring {
          0%   { opacity: 0; transform: translate(-50%,-50%) scale(0.6); }
          30%  { opacity: 0.85; }
          100% { opacity: 0; transform: translate(-50%,-50%) scale(1.4); }
        }
        @keyframes lw-spawn {
          0%   { opacity: 0; transform: translate(-50%,-50%) scale(0) rotateX(60deg); }
          35%  { opacity: 1; transform: translate(-50%,-50%) scale(1.1) rotateX(0deg); }
          100% { opacity: 1; transform: translate(-50%,-50%) scale(1) rotateX(0deg); }
        }
        @keyframes lw-fade {
          0%,75% { opacity: 1; }
          100%   { opacity: 0; }
        }
      `}</style>

      {/* 3D canvas */}
      <div style={{
        position: 'fixed',
        left: x - size / 2,
        top:  y - size / 2,
        width:  size,
        height: size,
        pointerEvents: 'none',
        zIndex: 44,
        animation: 'lw-spawn .6s ease-out forwards, lw-fade 30s linear .6s forwards',
      }}>
        {/* Electric arc rings around the wizard */}
        <ArcRing radius={55}  delay={0}   />
        <ArcRing radius={75}  delay={0.3} />
        <ArcRing radius={95}  delay={0.6} />

        {/* Ground portal glow */}
        <div style={{
          position: 'absolute', left: '50%', top: '70%',
          width: 110, height: 28, borderRadius: '50%',
          background: 'radial-gradient(ellipse, #3399ff55 0%, transparent 70%)',
          transform: 'translate(-50%,-50%)',
          boxShadow: '0 0 20px #3399ff44',
        }} />

        {/* R3F canvas */}
        <Canvas
          camera={{ position: [0, 0.5, 2.8], fov: 45 }}
          style={{ width: '100%', height: '100%' }}
          gl={{ alpha: true, antialias: true }}
        >
          <ambientLight intensity={0.4} />
          <directionalLight position={[2, 4, 3]} intensity={1.2} color="#ffffff" />
          <pointLight position={[0, 1, 0]} intensity={2} color="#3399ff" distance={4} />
          <WizardModel />
        </Canvas>
      </div>

      {/* 2× STATS label floats up */}
      <div style={{
        position: 'fixed',
        left: x, top: y - size / 2 - 14,
        transform: 'translate(-50%,0)',
        pointerEvents: 'none', zIndex: 45,
        color: '#66ccff', fontWeight: 900, fontSize: 18,
        textShadow: '0 0 14px #3399ff, 0 0 4px #fff',
        animation: 'fx-float 1.2s ease-out .5s forwards', opacity: 0,
      }}>2× STATS · 30s</div>
    </>
  )
}

// Preload so there's no hitch on first cast
useGLTF.preload('/glTF/Wizard.gltf')
