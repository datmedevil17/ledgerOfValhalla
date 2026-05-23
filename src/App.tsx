import React, { Suspense, useMemo, useRef, useState, useEffect } from 'react'
import type { CSSProperties } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { OrbitControls, useGLTF, useAnimations } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'
import { CATALOG, defFor, healthOf, type Age, type Level } from './config'
import { TROOP_DEFS, TROOP_IDS, TROOP_START_COUNT, BAT_SWARM_SIZE, type TroopId, type TroopDef } from './troops'
import { DEFENSE_DEFS, TEMPLE_REINFORCE_RADIUS, TEMPLE_REINFORCE_COUNT, TEMPLE_REINFORCE_TYPES } from './defenses'

// ── Constants ─────────────────────────────────────────────────────────────────
const GRID_W       = 90
const GRID_H       = 72
const OUTER_SIZE   = 1200
const PLACE_RADIUS = 400

// ── Light config ──────────────────────────────────────────────────────────────
interface LightConfig {
  ambient:    { intensity: number; color: string }
  sun:        { intensity: number; color: string; azimuth: number; elevation: number }
  fill:       { intensity: number; color: string }
  hemisphere: { skyColor: string; groundColor: string; intensity: number }
  exposure:   number
}

const DEFAULT_LIGHT: LightConfig = {
  ambient:    { intensity: 0.70, color: '#fff6e0' },
  sun:        { intensity: 1.60, color: '#fffbe8', azimuth: 210, elevation: 65 },
  fill:       { intensity: 0.45, color: '#c0e0ff' },
  hemisphere: { skyColor: '#87ceeb', groundColor: '#5a9e30', intensity: 0.50 },
  exposure:   1.2,
}

function sunPos(azimuth: number, elevation: number): [number, number, number] {
  const az = (azimuth * Math.PI) / 180
  const el = (elevation * Math.PI) / 180
  const r  = 100
  return [r * Math.cos(el) * Math.sin(az), r * Math.sin(el), r * Math.cos(el) * Math.cos(az)]
}

// ── Catalog ───────────────────────────────────────────────────────────────────
interface CatalogEntry {
  id:           string
  name:         string
  category:     string
  defaultScale: number
  path:         string
  gridW:        number
  gridH:        number
  defId?:       string
}

const ENV_ASSETS: CatalogEntry[] = [
  // Mountains
  { id: 'mountain-group-a', name: 'Mountain Group A', category: 'Mountains', defaultScale: 9,  path: '/models/Mountain_Group_1.gltf',            gridW: 4, gridH: 4 },
  { id: 'mountain-group-b', name: 'Mountain Group B', category: 'Mountains', defaultScale: 9,  path: '/models/Mountain_Group_2.gltf',            gridW: 4, gridH: 4 },
  { id: 'mountain-single',  name: 'Mountain',         category: 'Mountains', defaultScale: 8,  path: '/models/Mountain_Single.gltf',             gridW: 3, gridH: 3 },
  { id: 'mountain-large',   name: 'Mountain Large',   category: 'Mountains', defaultScale: 8,  path: '/models/MountainLarge_Single.gltf',        gridW: 4, gridH: 4 },
  // Trees
  { id: 'pine-tree',        name: 'Pine Tree',        category: 'Trees',     defaultScale: 8,  path: '/models/Resource_PineTree.gltf',           gridW: 1, gridH: 1 },
  { id: 'pine-group',       name: 'Pine Group',       category: 'Trees',     defaultScale: 7,  path: '/models/Resource_PineTree_Group.gltf',     gridW: 2, gridH: 2 },
  { id: 'pine-group-cut',   name: 'Pine Group (Cut)', category: 'Trees',     defaultScale: 9,  path: '/models/Resource_PineTree_Group_Cut.gltf', gridW: 2, gridH: 2 },
  { id: 'tree-group',       name: 'Tree Group',       category: 'Trees',     defaultScale: 7,  path: '/models/Resource_Tree_Group.gltf',         gridW: 2, gridH: 2 },
  { id: 'tree-group-cut',   name: 'Tree Group (Cut)', category: 'Trees',     defaultScale: 9,  path: '/models/Resource_Tree_Group_Cut.gltf',     gridW: 2, gridH: 2 },
  { id: 'tree-a',           name: 'Tree A',           category: 'Trees',     defaultScale: 10, path: '/models/Resource_Tree1.gltf',              gridW: 1, gridH: 1 },
  { id: 'tree-b',           name: 'Tree B',           category: 'Trees',     defaultScale: 10, path: '/models/Resource_Tree2.gltf',              gridW: 1, gridH: 1 },
  // Rocks
  { id: 'rock-a',           name: 'Rock A',           category: 'Rocks',     defaultScale: 7,  path: '/models/Resource_Rock_1.gltf',             gridW: 1, gridH: 1 },
  { id: 'rock-b',           name: 'Rock B',           category: 'Rocks',     defaultScale: 7,  path: '/models/Resource_Rock_2.gltf',             gridW: 1, gridH: 1 },
  { id: 'rock-c',           name: 'Rock C',           category: 'Rocks',     defaultScale: 7,  path: '/models/Resource_Rock_3.gltf',             gridW: 1, gridH: 1 },
  { id: 'rock-d',           name: 'Rock',             category: 'Rocks',     defaultScale: 5,  path: '/models/Rock.gltf',                        gridW: 1, gridH: 1 },
  { id: 'rock-group',       name: 'Rock Group',       category: 'Rocks',     defaultScale: 5,  path: '/models/Rock_Group.gltf',                  gridW: 2, gridH: 2 },
  // Resources
  { id: 'mine',             name: 'Mine',             category: 'Resources', defaultScale: 4,  path: '/models/Mine.gltf',                        gridW: 2, gridH: 2 },
  { id: 'gold-1',           name: 'Gold Pile S',      category: 'Resources', defaultScale: 4,  path: '/models/Resource_Gold_1.gltf',             gridW: 1, gridH: 1 },
  { id: 'gold-2',           name: 'Gold Pile M',      category: 'Resources', defaultScale: 4,  path: '/models/Resource_Gold_2.gltf',             gridW: 1, gridH: 1 },
  { id: 'gold-3',           name: 'Gold Pile L',      category: 'Resources', defaultScale: 4,  path: '/models/Resource_Gold_3.gltf',             gridW: 2, gridH: 2 },
  // Props
  { id: 'barrel',           name: 'Barrel',           category: 'Props',     defaultScale: 3,  path: '/models/Barrel.gltf',                      gridW: 1, gridH: 1 },
  { id: 'crate',            name: 'Crate',            category: 'Props',     defaultScale: 3,  path: '/models/Crate.gltf',                       gridW: 1, gridH: 1 },
  { id: 'crate-stack-1',    name: 'Crate Stack',      category: 'Props',     defaultScale: 3,  path: '/models/Crate_Stack1.gltf',                gridW: 1, gridH: 1 },
  { id: 'crate-stack-2',    name: 'Crate Stack 2',    category: 'Props',     defaultScale: 3,  path: '/models/Crate_Stack2.gltf',                gridW: 1, gridH: 1 },
  { id: 'crate-big-stack',  name: 'Crate Stack Big',  category: 'Props',     defaultScale: 3,  path: '/models/Crate_Big_Stack2.gltf',            gridW: 1, gridH: 1 },
  { id: 'logs',             name: 'Logs',             category: 'Props',     defaultScale: 3,  path: '/models/Logs.gltf',                        gridW: 1, gridH: 1 },
  // Structures
  { id: 'port-s1',          name: 'Port',             category: 'Structures',defaultScale: 5,  path: '/models/Port_SecondAge_Level1.gltf',       gridW: 4, gridH: 3 },
  { id: 'wonder-walls',     name: 'Wonder Walls',     category: 'Structures',defaultScale: 5,  path: '/models/WonderWalls_SecondAge.gltf',       gridW: 3, gridH: 3 },
]

const BUILDING_ENTRIES: CatalogEntry[] = CATALOG.map(b => ({
  id:           b.id,
  name:         b.name,
  category:     b.category,
  defaultScale: b.scale,
  path:         b.pathFor('SecondAge', 1),
  gridW:        b.grid.w,
  gridH:        b.grid.h,
  defId:        b.id,
}))

const FULL_CATALOG: CatalogEntry[] = [...BUILDING_ENTRIES, ...ENV_ASSETS]
const CATALOG_MAP_FULL = Object.fromEntries(FULL_CATALOG.map(e => [e.id, e]))

const ALL_CATEGORIES = ['Town', 'Military', 'Walls', 'Special', 'Mountains', 'Trees', 'Rocks', 'Resources', 'Props', 'Structures']

// ── Placed item ───────────────────────────────────────────────────────────────
interface PlacedItem {
  id:        string
  catalogId: string
  path:      string
  name:      string
  category:  string
  position:  [number, number, number]
  rotation:  number
  scale:     number
  gridW:     number
  gridH:     number
  defId?:    string
  age?:      Age
  level?:    Level
}

// ── Save / Load ───────────────────────────────────────────────────────────────
interface SaveSlot {
  id:      string
  name:    string
  savedAt: number
  items:   PlacedItem[]
  lights?: LightConfig
}

const STORAGE_KEY = 'clash-map-v1'

function readSaves(): SaveSlot[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}
function writeSaves(slots: SaveSlot[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slots))
}

// ── Troop runtime ─────────────────────────────────────────────────────────────
interface SpawnedTroop {
  uid:     string
  type:    TroopId
  initPos: [number, number, number]
  side:    'attacker' | 'defender'
}

type TroopInventory = Record<TroopId, number>

interface ProjectileState {
  id:       string
  from:     [number, number, number]
  to:       [number, number, number]
  color:    string
  progress: number   // 0 → 1
  duration: number   // flight time in seconds
  visual?:  'sphere' | 'arrow' | 'fireball'
}

// Mutable ref — zero React re-renders for movement / damage
interface GameStateRef {
  buildings:          PlacedItem[]
  buildingHp:         Record<string, number>
  troopHp:            Record<string, number>
  troopTypes:         Record<string, TroopId>
  troopSides:         Record<string, 'attacker' | 'defender'>
  troopPositions:     Record<string, [number, number, number]>
  deadTroops:         Set<string>
  destroyedBuildings: Set<string>
  attackedBuildings:  Set<string>   // buildings hit ≥ once (show HP bar)
  defenseTimers:      Record<string, number>  // building id → cooldown remaining
  templeReinforced:   Set<string>   // temple ids that already released defenders
  projectiles:        ProjectileState[]
}

function buildingCenter(item: PlacedItem): [number, number, number] {
  return [
    item.position[0] + (item.gridW - 1) / 2,
    0,
    item.position[2] + (item.gridH - 1) / 2,
  ]
}

function dist2d(a: [number,number,number], b: [number,number,number]): number {
  return Math.hypot(a[0] - b[0], a[2] - b[2])
}

// Returns true if wallItem lies along the line segment from `from` to `to`
function isWallBlocking(
  wallItem: PlacedItem,
  from: [number,number,number],
  to:   [number,number,number],
): boolean {
  const wc = buildingCenter(wallItem)
  const dx = to[0] - from[0], dz = to[2] - from[2]
  const lenSq = dx * dx + dz * dz
  if (lenSq < 0.001) return false
  const wx = wc[0] - from[0], wz = wc[2] - from[2]
  const t = (wx * dx + wz * dz) / lenSq
  if (t <= 0.05 || t >= 0.95) return false           // not between troop and target
  const perpX = wx - t * dx, perpZ = wz - t * dz
  const threshold = Math.max(wallItem.gridW, wallItem.gridH) * 0.5 + 0.6
  return perpX * perpX + perpZ * perpZ < threshold * threshold
}

// ── Grid helpers ──────────────────────────────────────────────────────────────
// No bounds clamping — placement is allowed across the full canvas
function snapForItem(cx: number, cz: number, w: number, h: number): [number, number, number] {
  return [Math.floor(cx - w / 2) + 0.5, 0, Math.floor(cz - h / 2) + 0.5]
}

function cellKey(cx: number, cz: number) { return `${cx},${cz}` }

function occupiedCells(pos: [number, number, number], w: number, h: number): string[] {
  const bx = Math.round(pos[0] - 0.5), bz = Math.round(pos[2] - 0.5)
  const keys: string[] = []
  for (let dx = 0; dx < w; dx++)
    for (let dz = 0; dz < h; dz++)
      keys.push(cellKey(bx + dx, bz + dz))
  return keys
}

function buildOccupiedSet(items: PlacedItem[]): Set<string> {
  const set = new Set<string>()
  for (const b of items) {
    if (!b.defId) continue
    occupiedCells(b.position, b.gridW, b.gridH).forEach(k => set.add(k))
  }
  return set
}

function hasCollision(pos: [number, number, number], entry: CatalogEntry, occupied: Set<string>): boolean {
  if (!entry.defId) return false
  return occupiedCells(pos, entry.gridW, entry.gridH).some(k => occupied.has(k))
}

// ── Textures ──────────────────────────────────────────────────────────────────
function buildGrassTexture(): THREE.CanvasTexture {
  const S = 1024, cv = document.createElement('canvas')
  cv.width = cv.height = S
  const ctx = cv.getContext('2d')!, rng = () => Math.random()
  ctx.fillStyle = '#5cb83d'; ctx.fillRect(0, 0, S, S)
  for (let p = 0; p < 3; p++) {
    const count = [4000, 6000, 9000][p], rMin = [3, 1.5, 0.5][p], rMax = [10, 5, 2][p]
    const lBase = [22, 30, 38][p], lRange = [14, 16, 14][p]
    for (let i = 0; i < count; i++) {
      const rx = rng() * (rMax - rMin) + rMin, ry = rx * (rng() * 1.8 + 0.5)
      ctx.fillStyle = `hsl(${100 + rng() * 30},${40 + rng() * 30}%,${lBase + rng() * lRange}%)`
      ctx.beginPath(); ctx.ellipse(rng() * S, rng() * S, rx, ry, rng() * Math.PI, 0, Math.PI * 2); ctx.fill()
    }
  }
  const tex = new THREE.CanvasTexture(cv)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(6, 6); return tex
}

function buildWildGrassTexture(): THREE.CanvasTexture {
  const S = 1024, cv = document.createElement('canvas')
  cv.width = cv.height = S
  const ctx = cv.getContext('2d')!, rng = () => Math.random()
  ctx.fillStyle = '#3d8520'; ctx.fillRect(0, 0, S, S)
  for (let i = 0; i < 900; i++) {
    const rx = rng() * 24 + 6, ry = rx * (rng() * 0.5 + 0.15)
    ctx.fillStyle = `hsl(${105 + rng() * 25},${30 + rng() * 20}%,${10 + rng() * 8}%)`
    ctx.beginPath(); ctx.ellipse(rng() * S, rng() * S, rx, ry, rng() * Math.PI, 0, Math.PI * 2); ctx.fill()
  }
  for (let i = 0; i < 5000; i++) {
    const rx = rng() * 8 + 1, ry = rx * (rng() * 1.4 + 0.4)
    ctx.fillStyle = `hsl(${95 + rng() * 30},${38 + rng() * 25}%,${20 + rng() * 18}%)`
    ctx.beginPath(); ctx.ellipse(rng() * S, rng() * S, rx, ry, rng() * Math.PI, 0, Math.PI * 2); ctx.fill()
  }
  const tex = new THREE.CanvasTexture(cv)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(20, 20); return tex
}

function buildGridTexture(): THREE.CanvasTexture {
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
  const tex = new THREE.CanvasTexture(cv)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(GRID_W, GRID_H); return tex
}

// ── Terrain ───────────────────────────────────────────────────────────────────
function OuterTerrain() {
  const tex = useMemo(buildWildGrassTexture, [])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <planeGeometry args={[OUTER_SIZE, OUTER_SIZE]} />
      <meshStandardMaterial map={tex} roughness={0.92} metalness={0} />
    </mesh>
  )
}

// Visual grid (no pointer events — PointerPlane handles those)
function GroundPlane() {
  const grass = useMemo(buildGrassTexture, [])
  const grid  = useMemo(buildGridTexture,  [])
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

// Large invisible plane — handles both build-mode placement and attack-mode spawning
function PointerPlane({ active, onCursor, onPlace, spawnActive, onSpawn }: {
  active:      boolean
  onCursor:    (pos: [number, number] | null) => void
  onPlace:     (x: number, z: number) => void
  spawnActive: boolean
  onSpawn:     (x: number, z: number) => void
}) {
  const anyActive = active || spawnActive
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.001, 0]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (!anyActive) return
        e.stopPropagation()
        if (active) onPlace(e.point.x, e.point.z)
        else        onSpawn(e.point.x, e.point.z)
      }}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        if (!active) return
        onCursor([e.point.x, e.point.z])
      }}
      onPointerLeave={() => { if (active) onCursor(null) }}
    >
      <planeGeometry args={[PLACE_RADIUS, PLACE_RADIUS]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

function GreenBorder() {
  const hw = GRID_W / 2, hh = GRID_H / 2, y = 0.03
  const pts = [[-hw,y,-hh],[hw,y,-hh],[hw,y,hh],[-hw,y,hh],[-hw,y,-hh]]
    .map(([x, _y, z]) => new THREE.Vector3(x, _y, z))
  const geo = new THREE.BufferGeometry().setFromPoints(pts)
  return <primitive object={new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#1a4a10', linewidth: 2 }))} />
}

const SEA_START_Z  = GRID_H / 2
const SEA_DEPTH    = OUTER_SIZE / 2 - SEA_START_Z
const SEA_CENTER_Z = SEA_START_Z + SEA_DEPTH / 2

function OceanPlane() {
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.opacity = 0.84 + Math.sin(clock.getElapsedTime() * 0.7) * 0.06
  })
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, SEA_CENTER_Z]}>
      <planeGeometry args={[OUTER_SIZE, SEA_DEPTH]} />
      <meshStandardMaterial ref={matRef} color="#2a8fcc" roughness={0.04} metalness={0.45} transparent opacity={0.88} />
    </mesh>
  )
}

function DustMotes() {
  const COUNT = 120, mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const data  = useMemo(() => Array.from({ length: COUNT }, () => ({
    x: (Math.random() - 0.5) * 160, y: Math.random() * 5 + 0.3,
    z: (Math.random() - 0.5) * 160, s: Math.random() * 0.4 + 0.1,
  })), [])
  useFrame(({ clock }) => {
    if (!mesh.current) return
    const t = clock.getElapsedTime()
    data.forEach((d, i) => {
      dummy.position.set(d.x + Math.sin(t * d.s + i) * 0.4, d.y + Math.sin(t * d.s * 1.2 + i) * 0.2, d.z + Math.cos(t * d.s + i) * 0.4)
      dummy.scale.setScalar(0.045 + Math.sin(t + i) * 0.012)
      dummy.updateMatrix()
      mesh.current!.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color="#ffe580" transparent opacity={0.18} />
    </instancedMesh>
  )
}

// ── Scene lights ─────────────────────────────────────────────────────────────
function SceneLights({ cfg }: { cfg: LightConfig }) {
  const pos = sunPos(cfg.sun.azimuth, cfg.sun.elevation)
  return (
    <>
      <ambientLight intensity={cfg.ambient.intensity} color={cfg.ambient.color} />
      <hemisphereLight args={[cfg.hemisphere.skyColor as THREE.ColorRepresentation, cfg.hemisphere.groundColor as THREE.ColorRepresentation, cfg.hemisphere.intensity]} />
      <directionalLight
        position={pos} intensity={cfg.sun.intensity} castShadow color={cfg.sun.color}
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-160} shadow-camera-right={160}
        shadow-camera-top={160}  shadow-camera-bottom={-160}
        shadow-bias={-0.0003}    shadow-normalBias={0.04}
      />
      <directionalLight position={[-30, 50, -20]} intensity={cfg.fill.intensity} color={cfg.fill.color} />
      <directionalLight position={[0, 25, 60]}    intensity={0.25}               color="#ffe8b0" />
    </>
  )
}

const SEP_RADIUS        = 1.0
const MAX_SPHERE_PROJ   = 100
const MAX_ARROW_PROJ    = 16
const MAX_FIREBALL_PROJ = 8

// Scratch vectors for projectile orientation (reused each frame, single-threaded JS is safe)
const _projDir  = new THREE.Vector3()
const _projUp   = new THREE.Vector3(0, 1, 0)   // reference for non-arrow projectiles
const _arrowFwd = new THREE.Vector3(0, 0, 1)   // arrow long-axis is Z in the model

// ── Troop HP bar ──────────────────────────────────────────────────────────────
function TroopHpBar({ uid, maxHp, gsRef }: {
  uid: string; maxHp: number; gsRef: React.MutableRefObject<GameStateRef>
}) {
  const groupRef = useRef<THREE.Group>(null)
  const fillRef  = useRef<THREE.Mesh>(null)
  useFrame(({ camera }) => {
    if (!groupRef.current || !fillRef.current) return
    // Always face the camera (billboard)
    groupRef.current.quaternion.copy(camera.quaternion)
    const pct = Math.max(0, Math.min(1, (gsRef.current.troopHp[uid] ?? maxHp) / maxHp))
    fillRef.current.scale.x = Math.max(pct, 0.001)
    fillRef.current.position.x = (pct - 1) * 0.5
    const mat = fillRef.current.material as THREE.MeshBasicMaterial
    mat.color.setHSL(pct * 0.33, 1.0, 0.5)
    mat.needsUpdate = true
  })
  return (
    <group ref={groupRef} position={[0, 2.4, 0]}>
      <mesh renderOrder={999}>
        <planeGeometry args={[1.0, 0.13]} />
        <meshBasicMaterial color="#111" transparent opacity={0.8} depthTest={false} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={fillRef} position={[0, 0, 0.003]} renderOrder={1000}>
        <planeGeometry args={[1.0, 0.09]} />
        <meshBasicMaterial color="#00ff00" depthTest={false} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

// ── Building HP bar — only visible after first hit, bright green → red ────────
function BuildingHpBar({ item, maxHp, gsRef }: {
  item: PlacedItem; maxHp: number; gsRef: React.MutableRefObject<GameStateRef>
}) {
  const groupRef = useRef<THREE.Group>(null)
  const fillRef  = useRef<THREE.Mesh>(null)
  useFrame(({ camera }) => {
    if (!groupRef.current || !fillRef.current) return
    const attacked = gsRef.current.attackedBuildings.has(item.id)
    groupRef.current.visible = attacked
    if (!attacked) return
    // Always face the camera (billboard)
    groupRef.current.quaternion.copy(camera.quaternion)
    const pct = Math.max(0, Math.min(1, (gsRef.current.buildingHp[item.id] ?? maxHp) / maxHp))
    fillRef.current.scale.x = Math.max(pct, 0.001)
    fillRef.current.position.x = (pct - 1) * 1.1
    const mat = fillRef.current.material as THREE.MeshBasicMaterial
    mat.color.setHSL(pct * 0.33, 1.0, 0.5)
    mat.needsUpdate = true
  })
  const cx = item.position[0] + (item.gridW - 1) / 2
  const cz = item.position[2] + (item.gridH - 1) / 2
  return (
    <group ref={groupRef} position={[cx, 7.5, cz]} visible={false}>
      <mesh renderOrder={999}>
        <planeGeometry args={[2.2, 0.28]} />
        <meshBasicMaterial color="#111" transparent opacity={0.82} depthTest={false} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={fillRef} position={[0, 0, 0.003]} renderOrder={1000}>
        <planeGeometry args={[2.2, 0.2]} />
        <meshBasicMaterial color="#00ff44" depthTest={false} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

// ── Projectile renderer — typed pools: spheres, arrows (GLTF), fireballs (GLTF) ─
function ProjectileRenderer({ gsRef }: { gsRef: React.MutableRefObject<GameStateRef> }) {
  const sphereSlots   = useRef<(THREE.Mesh  | null)[]>([])
  const arrowSlots    = useRef<(THREE.Group | null)[]>([])
  const fireballSlots = useRef<(THREE.Group | null)[]>([])

  const { scene: arrowScene }    = useGLTF('/arrow.glb')
  const { scene: fireballScene } = useGLTF('/fireball.glb')

  const arrowClones = useMemo(() =>
    Array.from({ length: MAX_ARROW_PROJ }, () => arrowScene.clone(true)),
  [arrowScene])

  const fireballClones = useMemo(() =>
    Array.from({ length: MAX_FIREBALL_PROJ }, () => {
      const c = fireballScene.clone(true)
      c.traverse(o => {
        const m = o as THREE.Mesh
        if (!m.isMesh) return
        const applyGlow = (mat: THREE.Material) => {
          const nm = (mat as THREE.MeshStandardMaterial).clone()
          nm.emissive = new THREE.Color('#ff4400')
          nm.emissiveIntensity = 3.0
          return nm
        }
        m.material = Array.isArray(m.material) ? m.material.map(applyGlow) : applyGlow(m.material)
      })
      return c
    }),
  [fireballScene])

  useFrame((_, delta) => {
    const gs = gsRef.current
    gs.projectiles = gs.projectiles.filter(p => { p.progress += delta / p.duration; return p.progress < 1 })

    const sphereProjs   = gs.projectiles.filter(p => !p.visual || p.visual === 'sphere')
    const arrowProjs    = gs.projectiles.filter(p => p.visual === 'arrow')
    const fireballProjs = gs.projectiles.filter(p => p.visual === 'fireball')

    for (let i = 0; i < MAX_SPHERE_PROJ; i++) {
      const mesh = sphereSlots.current[i]
      if (!mesh) continue
      const p = sphereProjs[i]
      if (p) {
        const t = p.progress
        mesh.position.set(
          p.from[0] + (p.to[0] - p.from[0]) * t,
          p.from[1] + (p.to[1] - p.from[1]) * t + Math.sin(t * Math.PI) * 2.5,
          p.from[2] + (p.to[2] - p.from[2]) * t,
        )
        mesh.visible = true
        ;(mesh.material as THREE.MeshBasicMaterial).color.set(p.color)
      } else {
        mesh.visible = false
      }
    }

    for (let i = 0; i < MAX_ARROW_PROJ; i++) {
      const group = arrowSlots.current[i]
      if (!group) continue
      const p = arrowProjs[i]
      if (p) {
        const t  = p.progress
        const t2 = Math.min(1, t + 0.01)
        const fx = p.from[0], fy = p.from[1], fz = p.from[2]
        const tx = p.to[0],   ty = p.to[1],   tz = p.to[2]
        const px1 = fx + (tx - fx) * t,  py1 = fy + (ty - fy) * t  + Math.sin(t  * Math.PI) * 2.5, pz1 = fz + (tz - fz) * t
        const px2 = fx + (tx - fx) * t2, py2 = fy + (ty - fy) * t2 + Math.sin(t2 * Math.PI) * 2.5, pz2 = fz + (tz - fz) * t2
        group.position.set(px1, py1, pz1)
        _projDir.set(px2 - px1, py2 - py1, pz2 - pz1)
        if (_projDir.lengthSq() > 0.0001) {
          _projDir.normalize()
          group.quaternion.setFromUnitVectors(_arrowFwd, _projDir)
        }
        group.visible = true
      } else {
        group.visible = false
      }
    }

    for (let i = 0; i < MAX_FIREBALL_PROJ; i++) {
      const group = fireballSlots.current[i]
      if (!group) continue
      const p = fireballProjs[i]
      if (p) {
        const t = p.progress
        group.position.set(
          p.from[0] + (p.to[0] - p.from[0]) * t,
          p.from[1] + (p.to[1] - p.from[1]) * t + Math.sin(t * Math.PI) * 2.5,
          p.from[2] + (p.to[2] - p.from[2]) * t,
        )
        group.visible = true
      } else {
        group.visible = false
      }
    }
  })

  return (
    <>
      {Array.from({ length: MAX_SPHERE_PROJ }, (_, i) => (
        <mesh key={`sp${i}`} ref={el => { sphereSlots.current[i] = el }} renderOrder={500} visible={false}>
          <sphereGeometry args={[0.28, 8, 6]} />
          <meshBasicMaterial color="white" depthTest={false} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
      {arrowClones.map((clone, i) => (
        <group key={`ar${i}`} ref={el => { arrowSlots.current[i] = el }} visible={false} scale={0.7}>
          <primitive object={clone} />
        </group>
      ))}
      {fireballClones.map((clone, i) => (
        <group key={`fb${i}`} ref={el => { fireballSlots.current[i] = el }} visible={false} scale={0.55}>
          <primitive object={clone} />
        </group>
      ))}
    </>
  )
}

// ── Defense system (building AI + temple reinforcements — runs in Canvas) ─────
function DefenseSystem({ gsRef, onSpawnDefender }: {
  gsRef:           React.MutableRefObject<GameStateRef>
  onSpawnDefender: (pos: [number,number,number], type: TroopId) => void
}) {
  useFrame((_, delta) => {
    const gs = gsRef.current
    const attackers = Object.entries(gs.troopPositions).filter(
      ([uid]) => gs.troopSides[uid] === 'attacker' && !gs.deadTroops.has(uid) && (gs.troopHp[uid] ?? 0) > 0
    )
    if (attackers.length === 0) return

    for (const building of gs.buildings) {
      if ((gs.buildingHp[building.id] ?? 0) <= 0) continue
      const bc = buildingCenter(building)

      // ── Temple reinforcements ──────────────────────────────────────────────
      if (building.defId === 'temple' && !gs.templeReinforced.has(building.id)) {
        const close = attackers.some(([, pos]) => dist2d(pos, bc) < TEMPLE_REINFORCE_RADIUS)
        if (close) {
          gs.templeReinforced.add(building.id)
          for (let i = 0; i < TEMPLE_REINFORCE_COUNT; i++) {
            const angle = (i / TEMPLE_REINFORCE_COUNT) * Math.PI * 2
            onSpawnDefender(
              [bc[0] + Math.cos(angle) * 2.5, 0, bc[2] + Math.sin(angle) * 2.5],
              TEMPLE_REINFORCE_TYPES[i] as TroopId,
            )
          }
        }
      }

      // ── Defensive attack ───────────────────────────────────────────────────
      const def = DEFENSE_DEFS[building.defId ?? '']
      if (!def) continue

      // Find nearest attacker in range
      let nearUid: string | null = null, nearPos: [number,number,number] | null = null, nearDist = Infinity
      for (const [uid, pos] of attackers) {
        const d = dist2d(pos, bc)
        if (d < nearDist) { nearUid = uid; nearPos = pos as [number,number,number]; nearDist = d }
      }
      if (!nearUid || !nearPos || nearDist > def.attackRange) continue

      gs.defenseTimers[building.id] = (gs.defenseTimers[building.id] ?? 0) - delta
      if (gs.defenseTimers[building.id] > 0) continue
      gs.defenseTimers[building.id] = def.attackCooldown

      // Damage the troop
      gs.troopHp[nearUid] = Math.max(0, (gs.troopHp[nearUid] ?? 0) - def.attackDamage)

      // Launch projectile for ranged defenses
      if (def.isRanged) {
        gs.projectiles.push({
          id: `${Date.now()}-${Math.random()}`,
          from: [bc[0], 4, bc[2]],
          to:   [nearPos[0], 0.8, nearPos[2]],
          color: def.projColor,
          progress: 0,
          duration: Math.max(0.2, nearDist * 0.04),
        })
      }
    }
  })
  return null
}

// ── Animated troop ────────────────────────────────────────────────────────────
function AnimatedTroop({ troop, gsRef, onDied }: {
  troop:  SpawnedTroop
  gsRef:  React.MutableRefObject<GameStateRef>
  onDied: (uid: string) => void
}) {
  const def       = TROOP_DEFS[troop.type]
  const { scene, animations } = useGLTF(def.path)
  const groupRef  = useRef<THREE.Group>(null)
  const attackTmr = useRef(0)
  const curAnim   = useRef('')
  const deadDone  = useRef(false)

  const clone = useMemo(() => {
    const c = SkeletonUtils.clone(scene) as THREE.Group
    c.traverse(o => { if ((o as THREE.Mesh).isMesh) { o.castShadow = o.receiveShadow = true } })
    return c
  }, [scene])

  const { actions } = useAnimations(animations, groupRef)

  function play(name: string, once = false, syncDuration?: number) {
    if (curAnim.current === name || !actions[name]) return
    actions[curAnim.current]?.fadeOut(0.18)
    const a = actions[name]!.reset().fadeIn(0.18).play()
    if (once) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true }
    // Sync animation speed so one cycle = syncDuration seconds (prevents double-looping)
    if (syncDuration !== undefined) {
      const dur = a.getClip().duration
      if (dur > 0) a.timeScale = dur / syncDuration
    }
    curAnim.current = name
  }

  useEffect(() => {
    const t = setTimeout(() => play(def.anim.idle), 80)
    return () => clearTimeout(t)
  }, [actions]) // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, delta) => {
    const gs = gsRef.current
    const g  = groupRef.current
    if (!g || deadDone.current) return

    const myHp = gs.troopHp[troop.uid] ?? def.maxHp
    if (myHp <= 0) {
      deadDone.current = true
      play(def.anim.death, true)
      setTimeout(() => onDied(troop.uid), 2500)
      return
    }

    // ── Separation physics ─────────────────────────────────────────────────
    let sx = 0, sz = 0
    for (const [uid, oPos] of Object.entries(gs.troopPositions)) {
      if (uid === troop.uid) continue
      const ox = g.position.x - oPos[0], oz = g.position.z - oPos[2]
      const od = Math.hypot(ox, oz)
      if (od > 0 && od < SEP_RADIUS) {
        const str = (SEP_RADIUS - od) / SEP_RADIUS
        sx += (ox / od) * str; sz += (oz / od) * str
      }
    }
    if (sx !== 0 || sz !== 0) {
      const sl = Math.max(Math.hypot(sx, sz), 0.001)
      g.position.x += (sx / sl) * 2.0 * delta
      g.position.z += (sz / sl) * 2.0 * delta
    }

    // ── Defender AI — target nearest attacker troop ────────────────────────
    if (troop.side === 'defender') {
      const enemies = Object.entries(gs.troopPositions).filter(
        ([uid]) => gs.troopSides[uid] === 'attacker' && !gs.deadTroops.has(uid) && (gs.troopHp[uid] ?? 0) > 0
      )
      if (enemies.length === 0) { play(def.anim.idle) }
      else {
        let eid = enemies[0][0], epos = enemies[0][1] as [number,number,number], edist = Infinity
        for (const [uid, pos] of enemies) {
          const d = dist2d([g.position.x, 0, g.position.z], pos as [number,number,number])
          if (d < edist) { eid = uid; epos = pos as [number,number,number]; edist = d }
        }
        const dx = epos[0] - g.position.x, dz = epos[2] - g.position.z
        if (edist > 2) {
          const spd = (def.speed * delta) / Math.max(edist, 0.001)
          g.position.x += dx * spd; g.position.z += dz * spd
          g.rotation.y = Math.atan2(dx, dz)
          play(def.anim.run)
          attackTmr.current = def.attackCooldown * 0.4
        } else {
          g.rotation.y = Math.atan2(dx, dz)
          play(def.anim.attack, false, def.attackCooldown)
          attackTmr.current -= delta
          if (attackTmr.current <= 0) {
            attackTmr.current = def.attackCooldown
            gs.troopHp[eid] = Math.max(0, (gs.troopHp[eid] ?? 0) - def.attackDamage)
          }
        }
      }
      gs.troopPositions[troop.uid] = [g.position.x, 0, g.position.z]
      return
    }

    // ── Attacker AI — go for nearest building; break blocking walls first ─
    const living = gs.buildings.filter(b => b.defId && (gs.buildingHp[b.id] ?? 0) > 0)
    if (living.length === 0) { play(def.anim.idle); return }

    const myPos: [number,number,number] = [g.position.x, 0, g.position.z]

    const innerBuildings = living.filter(b => b.category !== 'Walls')
    const aliveWalls     = living.filter(b => b.category === 'Walls')

    // Pick nearest non-wall building (fall back to nearest wall if all inner buildings gone)
    const primaryPool = innerBuildings.length > 0 ? innerBuildings : aliveWalls
    let nearestBuilding = primaryPool[0], nearestBDist = Infinity
    for (const b of primaryPool) {
      const d = dist2d(myPos, buildingCenter(b))
      if (d < nearestBDist) { nearestBuilding = b; nearestBDist = d }
    }

    // Check if any wall blocks the straight-line path to that building
    let target = nearestBuilding
    if (aliveWalls.length > 0 && innerBuildings.length > 0) {
      const tbc = buildingCenter(nearestBuilding)
      let blockWall: PlacedItem | null = null, blockDist = Infinity
      for (const w of aliveWalls) {
        if (!isWallBlocking(w, myPos, tbc)) continue
        const d = dist2d(myPos, buildingCenter(w))
        if (d < blockDist) { blockWall = w; blockDist = d }
      }
      if (blockWall) target = blockWall
    }
    const bc = buildingCenter(target)
    const dx = bc[0] - g.position.x, dz = bc[2] - g.position.z
    const dst = Math.hypot(dx, dz)

    if (dst > def.attackRange) {
      const spd = (def.speed * delta) / Math.max(dst, 0.001)
      g.position.x += dx * spd; g.position.z += dz * spd
      g.rotation.y = Math.atan2(dx, dz)
      play(def.anim.run)
      attackTmr.current = def.attackCooldown * 0.4
    } else {
      g.rotation.y = Math.atan2(dx, dz)
      play(def.anim.attack, false, def.attackCooldown)
      attackTmr.current -= delta
      if (attackTmr.current <= 0) {
        attackTmr.current = def.attackCooldown

        // Mark building as attacked (shows HP bar)
        gs.attackedBuildings.add(target.id)

        gs.buildingHp[target.id] = Math.max(0, (gs.buildingHp[target.id] ?? 0) - def.attackDamage)
        if (gs.buildingHp[target.id] <= 0) gs.destroyedBuildings.add(target.id)

        // Wizard AoE
        if (def.splashRadius) {
          for (const b of living) {
            if (b.id === target.id) continue
            if (dist2d(buildingCenter(b), bc) <= def.splashRadius) {
              gs.attackedBuildings.add(b.id)
              gs.buildingHp[b.id] = Math.max(0, (gs.buildingHp[b.id] ?? 0) - def.attackDamage * 0.5)
              if (gs.buildingHp[b.id] <= 0) gs.destroyedBuildings.add(b.id)
            }
          }
        }

        // Cleric heals lowest-HP ally
        if (def.healRadius && def.healAmount) {
          let bestUid: string | null = null, bestHp = Infinity
          for (const [uid, hp] of Object.entries(gs.troopHp)) {
            if (uid === troop.uid || gs.deadTroops.has(uid) || hp <= 0) continue
            const tPos = gs.troopPositions[uid]
            if (tPos && dist2d([g.position.x, 0, g.position.z], tPos) <= def.healRadius && hp < bestHp) {
              bestUid = uid; bestHp = hp
            }
          }
          if (bestUid) {
            gs.troopHp[bestUid] = Math.min(
              TROOP_DEFS[gs.troopTypes[bestUid]].maxHp,
              (gs.troopHp[bestUid] ?? 0) + def.healAmount,
            )
          }
        }

        // Projectile for ranged attackers
        if (def.projColor) {
          const visual = troop.type === 'ranger' ? 'arrow'
                       : troop.type === 'dragon' ? 'fireball'
                       : 'sphere'
          gs.projectiles.push({
            id: `${Date.now()}-${Math.random()}`,
            from: [g.position.x, 1.2, g.position.z],
            to:   [bc[0], 2, bc[2]],
            color: def.projColor,
            progress: 0,
            duration: Math.max(0.25, dst * 0.04),
            visual,
          })
        }
      }
    }

    gs.troopPositions[troop.uid] = [g.position.x, 0, g.position.z]
  })

  return (
    <group ref={groupRef} position={troop.initPos}>
      <primitive object={clone} scale={def.renderScale} />
      <TroopHpBar uid={troop.uid} maxHp={def.maxHp} gsRef={gsRef} />
    </group>
  )
}

// ── 3D model helpers ──────────────────────────────────────────────────────────
function Model({ path, position, rotation = [0, 0, 0], scale = 1, onClick }: {
  path:      string
  position:  [number, number, number]
  rotation?: [number, number, number]
  scale?:    number
  onClick?:  (e: ThreeEvent<MouseEvent>) => void
}) {
  const { scene } = useGLTF(path)
  const clone = useMemo(() => {
    const c = scene.clone(true)
    c.traverse(o => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow    = true
        o.receiveShadow = true
      }
    })
    return c
  }, [scene])
  return <primitive object={clone} position={position} rotation={rotation} scale={scale} onClick={onClick} />
}

function GhostItem({ path, position, rotation, scale, w, h, valid }: {
  path: string; position: [number, number, number]
  rotation: number; scale: number; w: number; h: number; valid: boolean
}) {
  const { scene } = useGLTF(path)
  const clone = useMemo(() => {
    const c = scene.clone(true)
    c.traverse(o => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      const tint = (mat: THREE.Material) => {
        const n = (mat as THREE.MeshStandardMaterial).clone()
        n.transparent = true; n.opacity = 0.55
        n.emissive = new THREE.Color(valid ? '#44ff44' : '#ff2200')
        n.emissiveIntensity = 0.35
        return n
      }
      m.material = Array.isArray(m.material) ? m.material.map(tint) : tint(m.material)
    })
    return c
  }, [scene, valid])

  const fx = position[0] + (w - 1) / 2
  const fz = position[2] + (h - 1) / 2

  return (
    <group>
      <primitive object={clone} position={position} rotation={[0, rotation, 0]} scale={scale} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[fx, 0.02, fz]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial color={valid ? '#00ff44' : '#ff2200'} transparent opacity={valid ? 0.2 : 0.32} depthWrite={false} />
      </mesh>
    </group>
  )
}

function PlacedItems({ items, selectedId, canSelect, onSelect }: {
  items:      PlacedItem[]
  selectedId: string | null
  canSelect:  boolean
  onSelect:   (id: string) => void
}) {
  return (
    <>
      {items.map(item => {
        const isSelected = item.id === selectedId
        const fx = item.position[0] + (item.gridW - 1) / 2
        const fz = item.position[2] + (item.gridH - 1) / 2
        return (
          <Suspense key={item.id} fallback={null}>
            <group>
              <Model
                path={item.path}
                position={item.position}
                rotation={[0, item.rotation, 0]}
                scale={item.scale}
                onClick={canSelect ? e => { e.stopPropagation(); onSelect(item.id) } : undefined}
              />
              {isSelected && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[fx, 0.05, fz]}>
                  <planeGeometry args={[item.gridW + 0.3, item.gridH + 0.3]} />
                  <meshBasicMaterial color="#f0c040" transparent opacity={0.35} depthWrite={false} side={THREE.DoubleSide} />
                </mesh>
              )}
            </group>
          </Suspense>
        )
      })}
    </>
  )
}

// ── Camera ────────────────────────────────────────────────────────────────────
function CameraSetup() {
  const { camera } = useThree()
  useEffect(() => { camera.lookAt(0, 0, 0) }, [camera])
  return null
}

// ── Preloads ──────────────────────────────────────────────────────────────────
FULL_CATALOG.forEach(e => useGLTF.preload(e.path))
CATALOG.forEach(b => {
  ([1, 2, 3] as Level[]).forEach(lv => useGLTF.preload(b.pathFor('SecondAge', lv)))
})
TROOP_IDS.forEach(id => useGLTF.preload(TROOP_DEFS[id].path))
useGLTF.preload('/arrow.glb')
useGLTF.preload('/fireball.glb')

// ── UI helpers ────────────────────────────────────────────────────────────────
const PANEL_W = 260

const btn: CSSProperties = {
  padding: '6px 10px', background: '#1e1206', border: '1px solid #6a4820',
  borderRadius: 4, color: '#d8c090', cursor: 'pointer', fontSize: 12,
  fontFamily: 'inherit',
}

// ── Market cards ──────────────────────────────────────────────────────────────
const CARD_BASE = encodeURI('/3D Card Kit - Fantasy [Standard]/Renders/')

const MARKET_CARDS = [
  '0_CardBack','1_Fireball','2_TrenchcoatMushrooms','3_Monk','4_Market',
  '5_Steal','6_King','7_StinkTrap','8_LightningWizard','9_Hypnosis',
  '10_Beehive','11_Polinization','12_Mimic','13_SeaMonster','14_Coin',
  '15_Cult','16_Belltowers','17_Rebirth','18_WaterDragon','19_OceanTreasure',
  '20_Element_Fire','21_Element_Lightning','22_Element_Air','23_Element_Water',
  '24_Element_Dark','25_Element_Earth','26_BloodRing','27_Book',
  '28_RollDice','29_Block','30_Wizard',
].map(f => ({
  src:  `${CARD_BASE}${f}.png`,
  name: f.replace(/^\d+_/, '').replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2'),
}))

function MarketDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(820px, 92vw)', maxHeight: '88vh',
          background: 'rgba(10,5,0,0.97)', border: '2px solid #6a4820',
          borderRadius: 10, display: 'flex', flexDirection: 'column',
          fontFamily: "'Segoe UI', sans-serif",
        }}
      >
        {/* Header */}
        <div style={{
          padding: '12px 18px', borderBottom: '1px solid #4a2e08',
          display: 'flex', alignItems: 'center', flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#f0c040', letterSpacing: 1.4, flex: 1 }}>
            🏪 MARKET
          </span>
          <span style={{ fontSize: 11, color: '#6a4820', marginRight: 14 }}>
            {MARKET_CARDS.length} cards
          </span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#907050',
            cursor: 'pointer', fontSize: 18, lineHeight: 1,
          }}>✕</button>
        </div>

        {/* Card grid */}
        <div style={{
          overflowY: 'auto', padding: 16,
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12,
        }}>
          {MARKET_CARDS.map(card => (
            <div
              key={card.src}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
            >
              <div style={{
                borderRadius: 8, overflow: 'hidden', border: '1px solid #3a2008',
                background: '#0e0800',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1.07)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 18px rgba(240,192,64,0.25)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = ''
                  ;(e.currentTarget as HTMLElement).style.boxShadow = ''
                }}
              >
                <img
                  src={card.src}
                  alt={card.name}
                  style={{ width: '100%', display: 'block' }}
                  loading="lazy"
                />
              </div>
              <span style={{ fontSize: 9, color: '#9a7040', textAlign: 'center', lineHeight: 1.3 }}>
                {card.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ScaleControl({ value, onChange, min = 0.5, max = 20 }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="range" min={min} max={max} step={0.5} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: '#f0c040' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button style={{ ...btn, padding: '2px 7px', fontSize: 14 }}
          onClick={() => onChange(Math.max(min, value - 0.5))}>−</button>
        <span style={{ color: '#f0c040', fontSize: 12, fontWeight: 700, minWidth: 36, textAlign: 'center' }}>
          ×{value.toFixed(1)}
        </span>
        <button style={{ ...btn, padding: '2px 7px', fontSize: 14 }}
          onClick={() => onChange(Math.min(max, value + 0.5))}>+</button>
      </div>
    </div>
  )
}

const expandedCats = new Set<string>(ALL_CATEGORIES)

function CatalogPanel({ selectedId, placementScale, rotation, onSelect, onScaleChange, onSetRotation, onUndo, onClear }: {
  selectedId:     string | null
  placementScale: number
  rotation:       number
  onSelect:       (id: string | null) => void
  onScaleChange:  (v: number) => void
  onSetRotation:  (v: number) => void
  onUndo:         () => void
  onClear:        () => void
}) {
  const [open, setOpen] = useState<Set<string>>(new Set(expandedCats))
  const toggle = (cat: string) => setOpen(prev => {
    const next = new Set(prev)
    next.has(cat) ? next.delete(cat) : next.add(cat)
    return next
  })

  return (
    <>
      {/* Status line */}
      <div style={{ padding: '6px 14px 8px', background: '#0e0800', borderBottom: '1px solid #3a2208', flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: '#907050' }}>
          {selectedId ? `▶ ${CATALOG_MAP_FULL[selectedId]?.name} — click to place` : 'Select an asset below'}
        </div>
      </div>

      {/* Placement controls */}
      {selectedId && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #4a2e08', background: '#120a02', flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: '#8a6030', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Scale</div>
          <ScaleControl value={placementScale} onChange={onScaleChange} />

          <div style={{ fontSize: 10, color: '#8a6030', letterSpacing: 1.5, textTransform: 'uppercase', margin: '10px 0 6px' }}>
            Rotation <span style={{ color: '#5a4020', fontWeight: 400 }}>(R key)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4 }}>
            {[0, 90, 180, 270].map(deg => {
              const rad = deg * Math.PI / 180
              const active = Math.abs(rotation - rad) < 0.01
              return (
                <button key={deg} onClick={() => onSetRotation(rad)} style={{
                  ...btn, textAlign: 'center', padding: '5px 4px', fontSize: 11,
                  background: active ? '#3a2000' : '#0e0800',
                  border: `1px solid ${active ? '#f0c040' : '#3a2a10'}`,
                  color: active ? '#f0c040' : '#8a6040',
                }}>
                  {deg}°
                </button>
              )
            })}
          </div>

          <button style={{ ...btn, width: '100%', marginTop: 8, color: '#e87050', borderColor: '#6a2010' }}
            onClick={() => onSelect(null)}>
            ✕ Cancel placement
          </button>
        </div>
      )}

      {/* Asset list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {ALL_CATEGORIES.map(cat => {
          const entries = FULL_CATALOG.filter(e => e.category === cat)
          if (entries.length === 0) return null
          const isOpen = open.has(cat)
          return (
            <div key={cat}>
              <button
                onClick={() => toggle(cat)}
                style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '8px 14px',
                  background: '#0e0600', border: 'none', borderBottom: '1px solid #2a1a04',
                  color: '#c08040', cursor: 'pointer', fontSize: 10, fontWeight: 700,
                  letterSpacing: 1.8, textTransform: 'uppercase', fontFamily: 'inherit' }}>
                <span style={{ marginRight: 6, fontSize: 9 }}>{isOpen ? '▼' : '▶'}</span>
                {cat}
                <span style={{ marginLeft: 'auto', color: '#5a3810', fontSize: 9 }}>{entries.length}</span>
              </button>
              {isOpen && entries.map(e => {
                const active = selectedId === e.id
                return (
                  <button key={e.id} onClick={() => onSelect(active ? null : e.id)} style={{
                    display: 'flex', alignItems: 'center', width: '100%', padding: '7px 14px 7px 22px',
                    background: active ? '#2e1800' : 'transparent', border: 'none',
                    borderLeft: `3px solid ${active ? '#f0c040' : 'transparent'}`,
                    color: active ? '#f0c040' : '#b89860', cursor: 'pointer', fontSize: 12,
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={el => { if (!active) (el.currentTarget as HTMLElement).style.background = '#180e02' }}
                  onMouseLeave={el => { if (!active) (el.currentTarget as HTMLElement).style.background = 'transparent' }}>
                    <span style={{ flex: 1, textAlign: 'left' }}>{e.name}</span>
                    <span style={{ fontSize: 9, color: active ? '#c08040' : '#5a3810',
                      background: '#1a0e02', border: '1px solid #3a2008', borderRadius: 3,
                      padding: '1px 5px', marginLeft: 6 }}>
                      {e.gridW > 1 || e.gridH > 1 ? `${e.gridW}×${e.gridH}` : `×${e.defaultScale}`}
                    </span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid #5a3810', display: 'flex', gap: 6, flexShrink: 0 }}>
        <button style={{ ...btn, flex: 1 }} onClick={onUndo}>↩ Undo</button>
        <button style={{ ...btn, flex: 1, color: '#e87050', borderColor: '#6a2010' }} onClick={onClear}>⊗ Clear All</button>
      </div>
    </>
  )
}

function ItemPanel({ item, onScaleChange, onRotationChange, onUpgradeLevel, onDelete, onClose }: {
  item:             PlacedItem
  onScaleChange:    (v: number) => void
  onRotationChange: (v: number) => void
  onUpgradeLevel:   () => void
  onDelete:         () => void
  onClose:          () => void
}) {
  const isBuilding = !!item.defId
  const def = isBuilding ? defFor(item.defId!) : null
  const canLevel  = isBuilding && def!.hasLevels && (item.level ?? 1) < 3
  const currentHP = isBuilding ? healthOf(item.defId!, item.age!, item.level!) : null
  const maxHP     = isBuilding ? healthOf(item.defId!, 'SecondAge', 3) || currentHP! : null
  const nextLvHP  = canLevel   ? healthOf(item.defId!, item.age!, (item.level! + 1) as Level) : null

  const rotDeg = Math.round(item.rotation * 180 / Math.PI)

  return (
    <>
      <div style={{ padding: '12px 14px 10px', background: '#0e0800', borderBottom: '1px solid #5a3810', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f0c040' }}>{item.name}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#907050', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
        <div style={{ fontSize: 10, color: '#7a5030', marginTop: 2 }}>{item.category}</div>

        {isBuilding && currentHP !== null && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: '#70b840' }}>♥ HP</span>
              <span style={{ color: '#c0e080', fontWeight: 600 }}>{currentHP.toLocaleString()}</span>
            </div>
            <div style={{ height: 3, background: '#1a1000', borderRadius: 2, overflow: 'hidden', marginTop: 3 }}>
              <div style={{ height: '100%', width: `${Math.min(100, (currentHP / maxHP!) * 100)}%`,
                background: 'linear-gradient(90deg,#40c840,#80f040)', borderRadius: 2 }} />
            </div>
            <div style={{ fontSize: 10, color: '#5a7030', marginTop: 4 }}>
              {item.age === 'FirstAge' ? 'Age I' : 'Age II'}{def!.hasLevels ? ` · Lv ${item.level}` : ''}
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Scale */}
        <div>
          <div style={{ fontSize: 10, color: '#8a6030', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Scale</div>
          <ScaleControl value={item.scale} onChange={onScaleChange} />
        </div>

        {/* Rotation */}
        <div>
          <div style={{ fontSize: 10, color: '#8a6030', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
            Rotation — {rotDeg}°
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4 }}>
            {[0, 90, 180, 270].map(deg => {
              const rad = deg * Math.PI / 180
              const active = Math.abs(item.rotation - rad) < 0.01
              return (
                <button key={deg} onClick={() => onRotationChange(rad)} style={{
                  ...btn, textAlign: 'center', padding: '5px 4px', fontSize: 11,
                  background: active ? '#3a2000' : '#0e0800',
                  border: `1px solid ${active ? '#f0c040' : '#3a2a10'}`,
                  color: active ? '#f0c040' : '#8a6040',
                }}>
                  {deg}°
                </button>
              )
            })}
          </div>
        </div>

        {/* Building upgrades */}
        {isBuilding && def!.hasLevels && (
          <div>
            <div style={{ fontSize: 10, color: '#8a6030', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Level</div>
            <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
              {([1, 2, 3] as Level[]).map(lv => {
                const isActive = item.level === lv, isPast = (item.level ?? 1) > lv
                return (
                  <div key={lv} style={{
                    flex: 1, textAlign: 'center', padding: '4px 3px', borderRadius: 4, fontSize: 11,
                    background: isActive ? '#3a2000' : isPast ? '#1a1200' : '#0e0800',
                    border: `1px solid ${isActive ? '#f0c040' : isPast ? '#6a4820' : '#2a1a08'}`,
                    color: isActive ? '#f0c040' : isPast ? '#7a5020' : '#3a2810',
                  }}>
                    <div style={{ fontWeight: 700 }}>{lv}</div>
                    <div style={{ fontSize: 9, marginTop: 1 }}>{healthOf(item.defId!, item.age!, lv).toLocaleString()}</div>
                  </div>
                )
              })}
            </div>
            <button onClick={onUpgradeLevel} disabled={!canLevel} style={{
              ...btn, width: '100%', textAlign: 'center',
              opacity: canLevel ? 1 : 0.4, cursor: canLevel ? 'pointer' : 'default',
              background: canLevel ? '#2a1800' : '#0e0800',
            }}>
              {canLevel ? `↑ Level ${item.level! + 1} (${nextLvHP!.toLocaleString()} HP)` : 'Max Level'}
            </button>
          </div>
        )}

        {isBuilding && (
          <div style={{ fontSize: 10, color: '#5a6030', padding: '4px 8px', background: '#0a1200', borderRadius: 4, textAlign: 'center' }}>
            Age II
          </div>
        )}

        <button onClick={onDelete} style={{ ...btn, width: '100%', textAlign: 'center', color: '#e87050', borderColor: '#6a2010' }}>
          🗑 Remove
        </button>
      </div>
    </>
  )
}

// ── Attack panel ─────────────────────────────────────────────────────────────
function AttackPanel({ inventory, spawned, selectedType, totalBuildings, destroyedCount, gsRef, onSelectType, onExit }: {
  inventory:      TroopInventory
  spawned:        SpawnedTroop[]
  selectedType:   TroopId
  totalBuildings: number
  destroyedCount: number
  gsRef:          React.MutableRefObject<GameStateRef>
  onSelectType:   (t: TroopId) => void
  onExit:         () => void
}) {
  // Tick every 250ms to refresh alive counts without expensive polling
  const [, tick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => tick(n => n + 1), 250)
    return () => clearInterval(id)
  }, [])

  const aliveByType = Object.fromEntries(
    TROOP_IDS.map(id => [id, spawned.filter(t => t.type === id && !gsRef.current.deadTroops.has(t.uid)).length])
  ) as Record<TroopId, number>

  const remaining = totalBuildings - destroyedCount

  return (
    <>
      {/* Header */}
      <div style={{ padding: '12px 14px 10px', background: '#140000', borderBottom: '1px solid #8a1010', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#ff6040', letterSpacing: 1.4 }}>⚔ ATTACK MODE</div>
        <div style={{ fontSize: 11, color: '#804030', marginTop: 3 }}>
          {remaining > 0 ? `${remaining} building${remaining > 1 ? 's' : ''} remaining` : '🏆 All destroyed!'}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Troop selector */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #2a1008' }}>
          <div style={{ fontSize: 10, color: '#8a4030', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
            Deploy Troop — click on map
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
            {TROOP_IDS.map(id => {
              const def  = TROOP_DEFS[id]
              const cnt  = inventory[id] ?? 0
              const sel  = selectedType === id
              return (
                <button key={id} onClick={() => onSelectType(id)} disabled={cnt === 0} style={{
                  padding: '6px 8px', borderRadius: 5, cursor: cnt > 0 ? 'pointer' : 'not-allowed',
                  background: sel ? '#3a0800' : '#1a0800',
                  border: `1px solid ${sel ? '#ff6040' : '#4a1808'}`,
                  color: cnt === 0 ? '#3a1808' : sel ? '#ff8060' : '#c07050',
                  fontFamily: 'inherit', textAlign: 'left',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700 }}>{def.emoji} {def.name}</div>
                  <div style={{ fontSize: 9, marginTop: 2, color: cnt === 0 ? '#3a1808' : '#7a4030' }}>
                    {cnt} left · {aliveByType[id]} alive
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Stats of selected troop */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #2a1008' }}>
          {(() => {
            const def = TROOP_DEFS[selectedType]
            return (
              <>
                <div style={{ fontSize: 10, color: '#8a4030', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
                  {def.emoji} {def.name} Stats
                </div>
                {([
                  ['HP',       `${def.maxHp}`],
                  ['Speed',    `${def.speed} u/s`],
                  ['Range',    `${def.attackRange} units`],
                  ['Damage',   `${def.attackDamage}/hit`],
                  ['Cooldown', `${def.attackCooldown}s`],
                  ...(def.splashRadius ? [['AoE', `r=${def.splashRadius}`]] : []),
                  ...(def.healAmount   ? [['Heals', `+${def.healAmount} HP`]] : []),
                ] as [string,string][]).map(([k,v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: '#6a3828' }}>{k}</span>
                    <span style={{ color: '#c07050', fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </>
            )
          })()}
        </div>

        {/* Deployed summary */}
        <div style={{ padding: '10px 14px' }}>
          <div style={{ fontSize: 10, color: '#8a4030', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
            Deployed ({spawned.filter(t => !gsRef.current.deadTroops.has(t.uid)).length} alive)
          </div>
          {TROOP_IDS.map(id => {
            const alive = aliveByType[id]
            const dead  = spawned.filter(t => t.type === id && gsRef.current.deadTroops.has(t.uid)).length
            if (alive + dead === 0) return null
            const pct = alive / Math.max(alive + dead, 1)
            return (
              <div key={id} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                  <span style={{ color: '#c07050' }}>{TROOP_DEFS[id].emoji} {TROOP_DEFS[id].name}</span>
                  <span style={{ color: '#6a3828' }}>{alive}/{alive + dead}</span>
                </div>
                <div style={{ height: 3, background: '#1a0800', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct * 100}%`, background: pct > 0.5 ? '#40c040' : pct > 0.25 ? '#c0a020' : '#c04020', transition: 'width 0.3s' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ padding: '10px 14px', borderTop: '1px solid #5a1808', flexShrink: 0 }}>
        <button onClick={onExit} style={{ ...btn, width: '100%', textAlign: 'center', background: '#200a00', borderColor: '#8a3010', color: '#c05030' }}>
          🔨 Back to Build Mode
        </button>
      </div>
    </>
  )
}

// ── Light manager UI ─────────────────────────────────────────────────────────
function LightManager({ cfg, onChange }: { cfg: LightConfig; onChange: (c: LightConfig) => void }) {
  const [open, setOpen] = useState(false)

  const setAmbient  = (p: Partial<LightConfig['ambient']>)    => onChange({ ...cfg, ambient:    { ...cfg.ambient,    ...p } })
  const setSun      = (p: Partial<LightConfig['sun']>)        => onChange({ ...cfg, sun:        { ...cfg.sun,        ...p } })
  const setFill     = (p: Partial<LightConfig['fill']>)       => onChange({ ...cfg, fill:       { ...cfg.fill,       ...p } })
  const setHemi     = (p: Partial<LightConfig['hemisphere']>) => onChange({ ...cfg, hemisphere: { ...cfg.hemisphere, ...p } })

  const row = (label: string, control: React.ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 22 }}>
      <span style={{ fontSize: 10, color: '#7a5a30', width: 64, flexShrink: 0 }}>{label}</span>
      {control}
    </div>
  )

  const slider = (value: number, min: number, max: number, step: number, onChange: (v: number) => void) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1 }}>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: '#f0c040', height: 14 }} />
      <span style={{ fontSize: 10, color: '#c0a060', width: 30, textAlign: 'right', flexShrink: 0 }}>
        {value % 1 === 0 ? value : value.toFixed(2)}
      </span>
    </div>
  )

  const colorPick = (value: string, onChange: (v: string) => void) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        style={{ width: 28, height: 20, border: '1px solid #5a3810', borderRadius: 3, background: 'none', cursor: 'pointer', padding: 1 }} />
      <span style={{ fontSize: 10, color: '#7a5a30' }}>{value}</span>
    </div>
  )

  const section = (label: string, children: React.ReactNode) => (
    <div>
      <div style={{ fontSize: 9, color: '#8a6030', letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 6, borderBottom: '1px solid #2a1a06', paddingBottom: 3 }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
    </div>
  )

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, zIndex: 10, userSelect: 'none',
      fontFamily: "'Segoe UI', sans-serif",
      background: 'rgba(8,4,0,0.93)', border: '1px solid #5a3810',
      borderTop: 'none', borderLeft: 'none', borderBottomRightRadius: 8,
      minWidth: open ? 260 : 0,
    }}>
      {/* Header */}
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
        background: 'none', border: 'none', cursor: 'pointer', width: '100%',
        color: '#f0c040', fontWeight: 700, fontSize: 11, letterSpacing: 1.4,
        fontFamily: 'inherit',
      }}>
        <span>💡</span>
        <span>LIGHTS</span>
        <span style={{ marginLeft: 'auto', color: '#6a4820', fontSize: 9 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ padding: '4px 14px 14px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '80vh', overflowY: 'auto' }}>

          {section('Ambient', <>
            {row('Intensity', slider(cfg.ambient.intensity, 0, 2, 0.05, v => setAmbient({ intensity: v })))}
            {row('Color',     colorPick(cfg.ambient.color, c => setAmbient({ color: c })))}
          </>)}

          {section('Sun', <>
            {row('Intensity', slider(cfg.sun.intensity, 0, 3, 0.05,  v => setSun({ intensity: v })))}
            {row('Azimuth',   slider(cfg.sun.azimuth,   0, 360, 1,  v => setSun({ azimuth: v })))}
            {row('Elevation', slider(cfg.sun.elevation,  5, 89, 1,   v => setSun({ elevation: v })))}
            {row('Color',     colorPick(cfg.sun.color, c => setSun({ color: c })))}
          </>)}

          {section('Sky Fill', <>
            {row('Intensity', slider(cfg.fill.intensity, 0, 2, 0.05, v => setFill({ intensity: v })))}
            {row('Color',     colorPick(cfg.fill.color, c => setFill({ color: c })))}
          </>)}

          {section('Hemisphere', <>
            {row('Intensity', slider(cfg.hemisphere.intensity, 0, 1.5, 0.05, v => setHemi({ intensity: v })))}
            {row('Sky',       colorPick(cfg.hemisphere.skyColor,    c => setHemi({ skyColor: c })))}
            {row('Ground',    colorPick(cfg.hemisphere.groundColor, c => setHemi({ groundColor: c })))}
          </>)}

          {section('Renderer', <>
            {row('Exposure', slider(cfg.exposure, 0.5, 2.5, 0.05, v => onChange({ ...cfg, exposure: v })))}
          </>)}

          <button onClick={() => onChange(DEFAULT_LIGHT)}
            style={{ ...btn, fontSize: 11, textAlign: 'center', marginTop: 2 }}>
            ↺ Reset to Default
          </button>
        </div>
      )}
    </div>
  )
}

// ── Saves panel ──────────────────────────────────────────────────────────────
function SavesPanel({ items, lights, onLoad }: {
  items:   PlacedItem[]
  lights:  LightConfig
  onLoad:  (items: PlacedItem[], lights?: LightConfig) => void
}) {
  const [saves,    setSaves]    = useState<SaveSlot[]>(readSaves)
  const [saveName, setSaveName] = useState('')
  const [flash,    setFlash]    = useState<string | null>(null)

  const showFlash = (msg: string) => {
    setFlash(msg)
    setTimeout(() => setFlash(null), 2000)
  }

  const handleSave = () => {
    const name = saveName.trim() || `Save ${saves.length + 1}`
    const slot: SaveSlot = { id: `${Date.now()}`, name, savedAt: Date.now(), items, lights }
    const next = [slot, ...saves].slice(0, 10)
    writeSaves(next); setSaves(next); setSaveName('')
    showFlash(`Saved "${name}"`)
  }

  const handleLoad = (slot: SaveSlot) => {
    onLoad(slot.items, slot.lights)
    showFlash(`Loaded "${slot.name}"`)
  }

  const handleDelete = (id: string) => {
    const next = saves.filter(s => s.id !== id)
    writeSaves(next); setSaves(next)
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ version: 1, items, lights }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `clash-map-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        const importedItems: PlacedItem[] = data.items ?? data
        if (!Array.isArray(importedItems)) { showFlash('Invalid file'); return }
        onLoad(importedItems, data.lights)
        showFlash(`Imported ${importedItems.length} items`)
      } catch { showFlash('Could not parse file') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const fmtDate = (ts: number) => {
    const d = new Date(ts)
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  }

  return (
    <>
      {/* Save current */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #4a2e08', background: '#120a02', flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: '#8a6030', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
          Save current map ({items.length} items)
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder={`Save ${saves.length + 1}`}
            style={{
              flex: 1, padding: '5px 8px', background: '#0e0800', border: '1px solid #5a3810',
              borderRadius: 4, color: '#d8c090', fontSize: 12, fontFamily: 'inherit',
              outline: 'none',
            }}
          />
          <button onClick={handleSave} style={{ ...btn, padding: '5px 12px', background: '#2a1800', borderColor: '#f0c040', color: '#f0c040', fontWeight: 700 }}>
            Save
          </button>
        </div>

        {flash && (
          <div style={{ marginTop: 6, fontSize: 11, color: '#70d070', textAlign: 'center' }}>{flash}</div>
        )}
      </div>

      {/* Slots list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {saves.length === 0 ? (
          <div style={{ padding: '20px 14px', fontSize: 12, color: '#4a3010', textAlign: 'center' }}>
            No saves yet
          </div>
        ) : saves.map(slot => (
          <div key={slot.id} style={{
            padding: '8px 14px', borderBottom: '1px solid #2a1a04',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: '#d8c090', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {slot.name}
              </div>
              <div style={{ fontSize: 10, color: '#5a3810', marginTop: 2 }}>
                {fmtDate(slot.savedAt)} · {slot.items.length} items
              </div>
            </div>
            <button onClick={() => handleLoad(slot)} style={{ ...btn, padding: '3px 8px', fontSize: 11, color: '#80d080', borderColor: '#2a6020', background: '#0a1a06' }}>
              Load
            </button>
            <button onClick={() => handleDelete(slot.id)} style={{ ...btn, padding: '3px 8px', fontSize: 11, color: '#e87050', borderColor: '#6a2010', background: '#1a0600' }}>
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Export / Import */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid #5a3810', display: 'flex', gap: 6, flexShrink: 0 }}>
        <button onClick={handleExport} style={{ ...btn, flex: 1, fontSize: 11 }}>
          ↓ Export JSON
        </button>
        <label style={{ ...btn, flex: 1, fontSize: 11, textAlign: 'center', cursor: 'pointer' }}>
          ↑ Import JSON
          <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
        </label>
      </div>
    </>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
const CAM: [number, number, number] = [42, 58, 42]

export default function App() {
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null)
  const [selectedItemId,    setSelectedItemId]    = useState<string | null>(null)
  const [rotation,          setRotation]           = useState(0)
  const [placementScale,    setPlacementScale]     = useState(5)
  const [cursor,            setCursor]             = useState<[number, number] | null>(null)
  const [items,             setItems]              = useState<PlacedItem[]>([])
  const [showSaves,         setShowSaves]          = useState(false)
  const [showMarket,        setShowMarket]         = useState(false)
  const [lightConfig,       setLightConfig]        = useState<LightConfig>(DEFAULT_LIGHT)

  // ── Attack mode ──────────────────────────────────────────────────────────────
  const [mode,                 setMode]                 = useState<'build' | 'attack'>('build')
  const [spawnedTroops,        setSpawnedTroops]        = useState<SpawnedTroop[]>([])
  const [selectedTroopType,    setSelectedTroopType]    = useState<TroopId>('warrior')
  const [troopInventory,       setTroopInventory]       = useState<TroopInventory>({} as TroopInventory)
  const [destroyedBuildingIds, setDestroyedBuildingIds] = useState<string[]>([])
  const [totalBuildingCount,   setTotalBuildingCount]   = useState(0)

  const gameStateRef = useRef<GameStateRef>({
    buildings: [], buildingHp: {}, troopHp: {}, troopTypes: {}, troopSides: {},
    troopPositions: {}, deadTroops: new Set(), destroyedBuildings: new Set(),
    attackedBuildings: new Set(), defenseTimers: {}, templeReinforced: new Set(), projectiles: [],
  })

  const selectedEntry = selectedCatalogId ? CATALOG_MAP_FULL[selectedCatalogId] ?? null : null
  const occupiedSet   = useMemo(() => buildOccupiedSet(items), [items])

  const ghostPos = useMemo<[number, number, number] | null>(() => {
    if (!selectedEntry || !cursor) return null
    return snapForItem(cursor[0], cursor[1], selectedEntry.gridW, selectedEntry.gridH)
  }, [selectedEntry, cursor])

  const ghostValid = useMemo(() => {
    if (!ghostPos || !selectedEntry) return true
    return !hasCollision(ghostPos, selectedEntry, occupiedSet)
  }, [ghostPos, selectedEntry, occupiedSet])

  // R key rotates during placement; Escape cancels
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSelectedCatalogId(null); setSelectedItemId(null) }
      if ((e.key === 'r' || e.key === 'R') && selectedCatalogId) {
        setRotation(r => (r + Math.PI / 2) % (Math.PI * 2))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedCatalogId])

  const handleSelectCatalog = (id: string | null) => {
    setSelectedCatalogId(id)
    setSelectedItemId(null)
    setRotation(0)
    if (id) setPlacementScale(CATALOG_MAP_FULL[id]?.defaultScale ?? 5)
  }

  const handlePlace = (x: number, z: number) => {
    if (!selectedEntry) return
    const pos = snapForItem(x, z, selectedEntry.gridW, selectedEntry.gridH)
    if (hasCollision(pos, selectedEntry, occupiedSet)) return
    const newItem: PlacedItem = {
      id:        `${Date.now()}-${Math.random()}`,
      catalogId: selectedEntry.id,
      path:      selectedEntry.path,
      name:      selectedEntry.name,
      category:  selectedEntry.category,
      position:  pos,
      rotation,
      scale:     placementScale,
      gridW:     selectedEntry.gridW,
      gridH:     selectedEntry.gridH,
      ...(selectedEntry.defId ? {
        defId: selectedEntry.defId,
        age:   'SecondAge' as Age,
        level: 1 as Level,
      } : {}),
    }
    setItems(prev => [...prev, newItem])
  }

  const handleScaleItem = (v: number) => setItems(prev =>
    prev.map(it => it.id === selectedItemId ? { ...it, scale: v } : it))

  const handleRotateItem = (v: number) => setItems(prev =>
    prev.map(it => it.id === selectedItemId ? { ...it, rotation: v } : it))

  const handleUpgradeLevel = () => setItems(prev => prev.map(it => {
    if (it.id !== selectedItemId || !it.defId) return it
    const def = defFor(it.defId)
    if (!def.hasLevels || (it.level ?? 1) >= 3) return it
    const newLevel = ((it.level ?? 1) + 1) as Level
    return { ...it, level: newLevel, path: def.pathFor(it.age!, newLevel) }
  }))

  const handleUpgradeAge = () => setItems(prev => prev.map(it => {
    if (it.id !== selectedItemId || it.age === 'SecondAge') return it
    const def = defFor(it.defId!)
    return { ...it, age: 'SecondAge' as Age, level: 1 as Level,
      path: def.pathFor('SecondAge', 1) }
  }))

  const handleDelete = () => {
    setItems(prev => prev.filter(it => it.id !== selectedItemId))
    setSelectedItemId(null)
  }

  const handleLoadSave = (loaded: PlacedItem[], loadedLights?: LightConfig) => {
    setItems(loaded)
    if (loadedLights) setLightConfig(loadedLights)
    setSelectedItemId(null)
    setSelectedCatalogId(null)
    setShowSaves(false)
  }

  // Sync destroyed buildings from game ref to React state every 250ms
  useEffect(() => {
    if (mode !== 'attack') return
    const id = setInterval(() => {
      const gs = gameStateRef.current
      if (gs.destroyedBuildings.size > 0) {
        const ids = [...gs.destroyedBuildings]
        gs.destroyedBuildings.clear()
        setDestroyedBuildingIds(prev => [...new Set([...prev, ...ids])])
      }
    }, 250)
    return () => clearInterval(id)
  }, [mode])

  const enterAttackMode = () => {
    const buildings = items.filter(it => !!it.defId)
    const buildingHp: Record<string, number> = {}
    buildings.forEach(it => { buildingHp[it.id] = healthOf(it.defId!, it.age!, it.level!) })

    const inv = Object.fromEntries(TROOP_IDS.map(id => [id, TROOP_START_COUNT])) as TroopInventory

    gameStateRef.current = {
      buildings, buildingHp, troopHp: {}, troopTypes: {}, troopSides: {},
      troopPositions: {}, deadTroops: new Set(), destroyedBuildings: new Set(),
      attackedBuildings: new Set(), defenseTimers: {}, templeReinforced: new Set(), projectiles: [],
    }

    setTotalBuildingCount(buildings.length)
    setDestroyedBuildingIds([])
    setSpawnedTroops([])
    setTroopInventory(inv)
    setSelectedTroopType('warrior')
    setSelectedCatalogId(null)
    setSelectedItemId(null)
    setMode('attack')
  }

  const exitAttackMode = () => {
    setMode('build')
    setSpawnedTroops([])
    setDestroyedBuildingIds([])
    gameStateRef.current = {
      buildings: [], buildingHp: {}, troopHp: {}, troopTypes: {}, troopSides: {},
      troopPositions: {}, deadTroops: new Set(), destroyedBuildings: new Set(),
      attackedBuildings: new Set(), defenseTimers: {}, templeReinforced: new Set(), projectiles: [],
    }
  }

  const handleSpawnTroop = (x: number, z: number) => {
    const remaining = troopInventory[selectedTroopType] ?? 0
    if (remaining <= 0) return

    const isBat  = selectedTroopType === 'bat'
    const count  = isBat ? Math.min(BAT_SWARM_SIZE, remaining) : 1
    const gs     = gameStateRef.current
    const cx     = Math.round(x - 0.5) + 0.5
    const cz     = Math.round(z - 0.5) + 0.5
    const newTroops: SpawnedTroop[] = []

    for (let i = 0; i < count; i++) {
      const uid = `${Date.now()}-${Math.random()}`
      // Spread bats in a tight ring around the click point
      const angle  = (i / count) * Math.PI * 2
      const spread = isBat ? (i === 0 ? 0 : 1.2) : 0
      const pos: [number, number, number] = [
        cx + Math.cos(angle) * spread,
        0,
        cz + Math.sin(angle) * spread,
      ]
      gs.troopHp[uid]        = TROOP_DEFS[selectedTroopType].maxHp
      gs.troopTypes[uid]     = selectedTroopType
      gs.troopSides[uid]     = 'attacker'
      gs.troopPositions[uid] = pos
      newTroops.push({ uid, type: selectedTroopType, initPos: pos, side: 'attacker' })
    }

    setSpawnedTroops(prev => [...prev, ...newTroops])
    setTroopInventory(prev => ({ ...prev, [selectedTroopType]: prev[selectedTroopType] - count }))
  }

  const handleTroopDied = (uid: string) => {
    gameStateRef.current.deadTroops.add(uid)
    setSpawnedTroops(prev => prev.filter(t => t.uid !== uid))
  }

  const handleSpawnDefender = (pos: [number,number,number], type: TroopId) => {
    const uid = `def-${Date.now()}-${Math.random()}`
    const gs  = gameStateRef.current
    gs.troopHp[uid]        = TROOP_DEFS[type].maxHp
    gs.troopTypes[uid]     = type
    gs.troopSides[uid]     = 'defender'
    gs.troopPositions[uid] = pos
    setSpawnedTroops(prev => [...prev, { uid, type, initPos: pos, side: 'defender' }])
  }

  const selectedItem = items.find(it => it.id === selectedItemId) ?? null

  return (
    <div style={{ width: '100%', height: '100%', background: '#5ba8d4' }}>
      <Canvas
        camera={{ position: CAM, fov: 46, near: 0.5, far: 800 }}
        shadows
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: lightConfig.exposure }}
        style={{ cursor: (selectedEntry || mode === 'attack') ? 'crosshair' : 'grab' }}
      >
        <color attach="background" args={['#7ec8e3']} />
        <fog attach="fog" args={['#b8dff0', 160, 500]} />

        <CameraSetup />
        <OrbitControls
          enabled={mode === 'attack' || !selectedEntry}
          target={[0, 0, 0]}
          minPolarAngle={Math.PI / 5} maxPolarAngle={Math.PI / 2.5}
          minDistance={20} maxDistance={120}
          enablePan panSpeed={0.7} zoomSpeed={0.75} rotateSpeed={0.4}
          screenSpacePanning={false}
        />

        <SceneLights cfg={lightConfig} />

        <OuterTerrain />
        <GroundPlane />
        <PointerPlane
          active={!!selectedEntry}
          onCursor={setCursor}
          onPlace={handlePlace}
          spawnActive={mode === 'attack'}
          onSpawn={handleSpawnTroop}
        />
        <GreenBorder />
        <OceanPlane />
        <DustMotes />

        {/* Hide destroyed buildings in attack mode */}
        <PlacedItems
          items={mode === 'attack' ? items.filter(it => !destroyedBuildingIds.includes(it.id)) : items}
          selectedId={mode === 'build' ? selectedItemId : null}
          canSelect={mode === 'build' && !selectedEntry}
          onSelect={id => { if (!selectedEntry) setSelectedItemId(id) }}
        />

        {/* Building HP bars in attack mode */}
        {mode === 'attack' && items
          .filter(it => it.defId && !destroyedBuildingIds.includes(it.id))
          .map(it => (
            <BuildingHpBar key={it.id} item={it} maxHp={healthOf(it.defId!, it.age!, it.level!)} gsRef={gameStateRef} />
          ))
        }

        {/* Rubble: destroyed non-wall buildings replaced by cut-tree-group debris */}
        {mode === 'attack' && destroyedBuildingIds.map(id => {
          const it = items.find(i => i.id === id)
          if (!it || it.category === 'Walls') return null
          const cx = it.position[0] + (it.gridW - 1) / 2
          const cz = it.position[2] + (it.gridH - 1) / 2
          // 1×1 → scale 1, 5×5 → scale 5
          const rubbleScale = Math.max(it.gridW, it.gridH)
          return (
            <Suspense key={`rubble-${id}`} fallback={null}>
              <Model
                path="/models/Resource_PineTree_Group_Cut.gltf"
                position={[cx, 0, cz]}
                scale={rubbleScale}
              />
            </Suspense>
          )
        })}

        {/* Spawned troops */}
        {mode === 'attack' && spawnedTroops.map(t => (
          <Suspense key={t.uid} fallback={null}>
            <AnimatedTroop troop={t} gsRef={gameStateRef} onDied={handleTroopDied} />
          </Suspense>
        ))}

        {/* Defense AI + projectiles (attack mode only) */}
        {mode === 'attack' && (
          <>
            <DefenseSystem gsRef={gameStateRef} onSpawnDefender={handleSpawnDefender} />
            <Suspense fallback={null}>
              <ProjectileRenderer gsRef={gameStateRef} />
            </Suspense>
          </>
        )}

        {/* Placement ghost (build mode only) */}
        {mode === 'build' && selectedEntry && ghostPos && (
          <Suspense fallback={null}>
            <GhostItem
              path={selectedEntry.path}
              position={ghostPos}
              rotation={rotation}
              scale={placementScale}
              w={selectedEntry.gridW}
              h={selectedEntry.gridH}
              valid={ghostValid}
            />
          </Suspense>
        )}
      </Canvas>

      {/* Sidebar */}
      <div style={{
        position: 'fixed', top: 0, right: 0, width: PANEL_W, height: '100%',
        background: 'rgba(8,4,0,0.95)', borderLeft: '2px solid #5a3810',
        display: 'flex', flexDirection: 'column', zIndex: 10,
        fontFamily: "'Segoe UI', sans-serif", userSelect: 'none',
      }}>
        {/* Persistent top bar */}
        <div style={{
          padding: '10px 14px', background: '#080400', borderBottom: '2px solid #5a3810',
          display: 'flex', alignItems: 'center', flexShrink: 0, gap: 6,
        }}>
          <span style={{ flex: 1, color: mode === 'attack' ? '#ff6040' : '#f0c040', fontWeight: 700, fontSize: 12, letterSpacing: 1.2 }}>
            {mode === 'attack' ? '⚔ ATTACK' : 'MAP DESIGNER'}
          </span>
          {mode === 'build' && (
            <>
              <button
                onClick={() => setShowMarket(true)}
                style={{ ...btn, padding: '4px 8px', fontSize: 10 }}
                title="Market"
              >
                🏪
              </button>
              <button
                onClick={() => { setShowSaves(s => !s); setSelectedCatalogId(null) }}
                style={{ ...btn, padding: '4px 8px', fontSize: 10, background: showSaves ? '#2a1800' : '#1e1206', borderColor: showSaves ? '#f0c040' : '#6a4820', color: showSaves ? '#f0c040' : '#d8c090' }}
              >
                💾
              </button>
            </>
          )}
          <button
            onClick={mode === 'build' ? enterAttackMode : exitAttackMode}
            style={{
              ...btn, padding: '4px 10px', fontSize: 10,
              background: mode === 'attack' ? '#200a00' : '#0a1a00',
              borderColor: mode === 'attack' ? '#ff4020' : '#40a020',
              color: mode === 'attack' ? '#ff6040' : '#60d040',
              fontWeight: 700,
            }}
          >
            {mode === 'attack' ? '🔨 Build' : '⚔ Attack'}
          </button>
        </div>

        {mode === 'attack' ? (
          <AttackPanel
            inventory={troopInventory}
            spawned={spawnedTroops}
            selectedType={selectedTroopType}
            totalBuildings={totalBuildingCount}
            destroyedCount={destroyedBuildingIds.length}
            gsRef={gameStateRef}
            onSelectType={setSelectedTroopType}
            onExit={exitAttackMode}
          />
        ) : showSaves ? (
          <SavesPanel items={items} lights={lightConfig} onLoad={handleLoadSave} />
        ) : selectedItem && !selectedEntry ? (
          <ItemPanel
            item={selectedItem}
            onScaleChange={handleScaleItem}
            onRotationChange={handleRotateItem}
            onUpgradeLevel={handleUpgradeLevel}
            onDelete={handleDelete}
            onClose={() => setSelectedItemId(null)}
          />
        ) : (
          <CatalogPanel
            selectedId={selectedCatalogId}
            placementScale={placementScale}
            rotation={rotation}
            onSelect={handleSelectCatalog}
            onScaleChange={setPlacementScale}
            onSetRotation={setRotation}
            onUndo={() => setItems(p => p.slice(0, -1))}
            onClear={() => { setItems([]); setSelectedItemId(null) }}
          />
        )}
      </div>

      {/* Light manager — top-left */}
      <LightManager cfg={lightConfig} onChange={setLightConfig} />

      {/* Market drawer */}
      {showMarket && <MarketDrawer onClose={() => setShowMarket(false)} />}
    </div>
  )
}
