import { Suspense, useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import rawData from '../public/clash-map-1779534012265.json'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface FinalPlacedItem {
  id: string; path: string; name: string
  position: [number, number, number]
  rotation: number; scale: number
  gridW: number; gridH: number
}
export interface FinalLightCfg {
  ambient:    { intensity: number; color: string }
  sun:        { intensity: number; color: string; azimuth: number; elevation: number }
  fill:       { intensity: number; color: string }
  hemisphere: { skyColor: string; groundColor: string; intensity: number }
  exposure:   number
}

// ── Constants ─────────────────────────────────────────────────────────────────
const GRID_W    = 90
const GRID_H    = 72
const OUTER     = 1200
const CAM: [number, number, number] = [42, 58, 42]
const SEA_START_Z  = GRID_H / 2
const SEA_DEPTH    = OUTER / 2 - SEA_START_Z
const SEA_CENTER_Z = SEA_START_Z + SEA_DEPTH / 2

// ── Lights ────────────────────────────────────────────────────────────────────
function sunPos(az: number, el: number): [number, number, number] {
  const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180, r = 100
  return [r * Math.cos(e) * Math.sin(a), r * Math.sin(e), r * Math.cos(e) * Math.cos(a)]
}
function SceneLights({ cfg }: { cfg: FinalLightCfg }) {
  const pos = sunPos(cfg.sun.azimuth, cfg.sun.elevation)
  return (
    <>
      <ambientLight intensity={cfg.ambient.intensity} color={cfg.ambient.color} />
      <hemisphereLight
        args={[cfg.hemisphere.skyColor as THREE.ColorRepresentation,
               cfg.hemisphere.groundColor as THREE.ColorRepresentation,
               cfg.hemisphere.intensity]}
      />
      <directionalLight
        position={pos} intensity={cfg.sun.intensity} color={cfg.sun.color} castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-160} shadow-camera-right={160}
        shadow-camera-top={160}  shadow-camera-bottom={-160}
        shadow-bias={-0.0003}    shadow-normalBias={0.04}
      />
      <directionalLight position={[-30, 50, -20]} intensity={cfg.fill.intensity} color={cfg.fill.color} />
      <directionalLight position={[0, 25, 60]} intensity={0.25} color="#ffe8b0" />
    </>
  )
}

// ── Terrain textures ──────────────────────────────────────────────────────────
function buildGrass(): THREE.CanvasTexture {
  const S = 1024, cv = document.createElement('canvas')
  cv.width = cv.height = S
  const ctx = cv.getContext('2d')!
  ctx.fillStyle = '#5cb83d'; ctx.fillRect(0, 0, S, S)
  for (let p = 0; p < 3; p++) {
    const count = [4000, 6000, 9000][p], rMin = [3, 1.5, 0.5][p], rMax = [10, 5, 2][p]
    const lBase = [22, 30, 38][p], lRange = [14, 16, 14][p]
    for (let i = 0; i < count; i++) {
      const rx = Math.random() * (rMax - rMin) + rMin, ry = rx * (Math.random() * 1.8 + 0.5)
      ctx.fillStyle = `hsl(${100 + Math.random() * 30},${40 + Math.random() * 30}%,${lBase + Math.random() * lRange}%)`
      ctx.beginPath(); ctx.ellipse(Math.random() * S, Math.random() * S, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2); ctx.fill()
    }
  }
  const t = new THREE.CanvasTexture(cv)
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6); return t
}

function buildWild(): THREE.CanvasTexture {
  const S = 1024, cv = document.createElement('canvas')
  cv.width = cv.height = S
  const ctx = cv.getContext('2d')!
  ctx.fillStyle = '#3d8520'; ctx.fillRect(0, 0, S, S)
  for (let i = 0; i < 900; i++) {
    const rx = Math.random() * 24 + 6, ry = rx * (Math.random() * 0.5 + 0.15)
    ctx.fillStyle = `hsl(${105 + Math.random() * 25},${30 + Math.random() * 20}%,${10 + Math.random() * 8}%)`
    ctx.beginPath(); ctx.ellipse(Math.random() * S, Math.random() * S, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2); ctx.fill()
  }
  const t = new THREE.CanvasTexture(cv)
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(20, 20); return t
}

function buildGrid(): THREE.CanvasTexture {
  const PX = 64, cv = document.createElement('canvas')
  cv.width = cv.height = PX
  const ctx = cv.getContext('2d')!
  ctx.clearRect(0, 0, PX, PX)
  ctx.fillStyle = 'rgba(0,24,0,0.07)'; ctx.fillRect(0, 0, PX, PX)
  ctx.strokeStyle = 'rgba(20,70,10,0.6)'; ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(PX - 0.7, 0); ctx.lineTo(PX - 0.7, PX)
  ctx.moveTo(0, PX - 0.7); ctx.lineTo(PX, PX - 0.7)
  ctx.stroke()
  const t = new THREE.CanvasTexture(cv)
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(GRID_W, GRID_H); return t
}

// ── Scene pieces ──────────────────────────────────────────────────────────────
function OuterTerrain() {
  const tex = useMemo(buildWild, [])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <planeGeometry args={[OUTER, OUTER]} />
      <meshStandardMaterial map={tex} roughness={0.92} metalness={0} />
    </mesh>
  )
}

function GroundPlane() {
  const grass = useMemo(buildGrass, [])
  const grid  = useMemo(buildGrid, [])
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[GRID_W, GRID_H]} />
        <meshStandardMaterial map={grass} roughness={0.9} metalness={0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <planeGeometry args={[GRID_W, GRID_H]} />
        <meshBasicMaterial map={grid} transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function OceanPlane() {
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.opacity = 0.84 + Math.sin(clock.getElapsedTime() * 0.7) * 0.06
  })
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, SEA_CENTER_Z]}>
      <planeGeometry args={[OUTER, SEA_DEPTH]} />
      <meshStandardMaterial ref={matRef} color="#2a8fcc" roughness={0.04} metalness={0.45} transparent opacity={0.88} />
    </mesh>
  )
}

// ── Model ─────────────────────────────────────────────────────────────────────
function Model({ item }: { item: FinalPlacedItem }) {
  const { scene } = useGLTF(item.path)
  const clone = useMemo(() => {
    const c = scene.clone(true)
    c.traverse(o => { if ((o as THREE.Mesh).isMesh) { o.castShadow = o.receiveShadow = true } })
    return c
  }, [scene])
  return (
    <primitive object={clone} position={item.position} rotation={[0, item.rotation, 0]} scale={item.scale} />
  )
}

// ── Shared canvas — used by both the /final page and the builder preview ──────
export function FinalMapCanvas({ items, cfg, onClose }: {
  items:    FinalPlacedItem[]
  cfg:      FinalLightCfg
  onClose?: () => void
}) {
  return (
    <div style={{ width: '100%', height: '100%', background: '#5ba8d4' }}>
      <Canvas
        camera={{ position: CAM, fov: 46, near: 0.5, far: 800 }}
        shadows
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: cfg.exposure }}
      >
        <color attach="background" args={['#7ec8e3']} />
        <fog attach="fog" args={['#b8dff0', 160, 500]} />

        <OrbitControls
          target={[0, 0, 0]}
          minPolarAngle={Math.PI / 5} maxPolarAngle={Math.PI / 2.5}
          minDistance={20} maxDistance={180}
          enablePan panSpeed={0.7} zoomSpeed={0.75} rotateSpeed={0.4}
        />

        <SceneLights cfg={cfg} />
        <OuterTerrain />
        <GroundPlane />
        <OceanPlane />

        {items.map(item => (
          <Suspense key={item.id} fallback={null}>
            <Model item={item} />
          </Suspense>
        ))}
      </Canvas>

      {/* HUD */}
      <div style={{
        position: 'fixed', top: 16, right: 16,
        background: 'rgba(8,4,0,0.88)', border: '1px solid #5a3810',
        borderRadius: 8, padding: '10px 16px',
        fontFamily: "'Segoe UI', sans-serif", userSelect: 'none',
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f0c040', letterSpacing: 1.2 }}>
          FINAL MAP
        </div>
        <div style={{ fontSize: 10, color: '#7a5030' }}>
          {items.length} assets · read-only
        </div>
        {onClose ? (
          <button
            onClick={onClose}
            style={{
              marginTop: 4, fontSize: 10, color: '#8a6040', cursor: 'pointer',
              border: '1px solid #3a2008', borderRadius: 4, padding: '3px 8px',
              textAlign: 'center', background: '#1e1206', fontFamily: 'inherit',
            }}
          >
            ← Back to Builder
          </button>
        ) : (
          <a href="/" style={{
            marginTop: 4, fontSize: 10, color: '#8a6040', textDecoration: 'none',
            border: '1px solid #3a2008', borderRadius: 4, padding: '3px 8px',
            textAlign: 'center', background: '#1e1206',
          }}>
            ← Builder
          </a>
        )}
      </div>
    </div>
  )
}

// Preload paths from the static save (for the /final route)
const staticItems = rawData.items as FinalPlacedItem[]
const staticCfg   = rawData.lights as FinalLightCfg
const uniquePaths = [...new Set(staticItems.map(i => i.path))]
uniquePaths.forEach(p => useGLTF.preload(p))

// ── /final page ───────────────────────────────────────────────────────────────
export default function FinalMap() {
  return <FinalMapCanvas items={staticItems} cfg={staticCfg} />
}
