// ─────────────────────────────────────────────────────────────────────────────
// Building configuration — grid footprints, HP scaling across ages and levels
// ─────────────────────────────────────────────────────────────────────────────

export type Age      = 'FirstAge' | 'SecondAge'
export type Level    = 1 | 2 | 3
export type Category = 'Town' | 'Military' | 'Walls' | 'Special'

export interface GridSize {
  w: number  // width  in grid cells
  h: number  // height in grid cells
}

// Health keyed by age then level.
// Buildings without levels only have the key `1` (treated as the single tier).
export type HealthMap = {
  FirstAge?:  { 1?: number; 2?: number; 3?: number }
  SecondAge?: { 1?: number; 2?: number; 3?: number }
}

export interface BuildingConfig {
  id:        string
  name:      string
  category:  Category
  scale:     number     // Three.js render scale
  grid:      GridSize
  gridFor?:  (age: Age, level: Level) => GridSize
  hasLevels: boolean    // false → only level-1 entry exists per age
  maxLevel?: 1 | 2 | 3 // defaults to 3 when hasLevels is true
  pathFor:   (age: Age, level: Level) => string
  health:    HealthMap
}

// ─────────────────────────────────────────────────────────────────────────────
// Catalogue
// ─────────────────────────────────────────────────────────────────────────────

export const CATALOG: BuildingConfig[] = [

  // ── Town ────────────────────────────────────────────────────────────────────

  {
    id: 'town-center', name: 'Town Center', category: 'Town', scale: 5,
    grid: { w: 4, h: 4 }, hasLevels: true,
    pathFor: (a, l) => `/models/TownCenter_${a}_Level${l}.gltf`,
    health: {
      FirstAge:  { 1: 2500, 2: 3250, 3: 4200 },
      SecondAge: { 1: 5500, 2: 7000, 3: 9000 },
    },
  },

  {
    id: 'house-1', name: 'House I', category: 'Town', scale: 4,
    grid: { w: 2, h: 2 }, hasLevels: true,
    pathFor: (a, l) => `/models/Houses_${a}_1_Level${l}.gltf`,
    health: {
      FirstAge:  { 1: 400,  2: 520,  3: 680  },
      SecondAge: { 1: 850,  2: 1100, 3: 1400 },
    },
  },

  {
    id: 'house-2', name: 'House II', category: 'Town', scale: 4,
    grid: { w: 2, h: 2 }, hasLevels: true,
    gridFor: (a, l) => l === 1 ? { w: 2, h: 2 } : l === 2 ? { w: 3, h: 3 } : { w: 4, h: 4 },
    pathFor: (a, l) => `/models/Houses_${a}_2_Level${l}.gltf`,
    health: {
      FirstAge:  { 1: 420,  2: 550,  3: 700  },
      SecondAge: { 1: 900,  2: 1150, 3: 1450 },
    },
  },

  {
    id: 'house-3', name: 'House III', category: 'Town', scale: 4,
    grid: { w: 2, h: 2 }, hasLevels: true,
    gridFor: (a, l) => l >= 2 ? { w: 4, h: 4 } : { w: 2, h: 2 },
    pathFor: (a, l) => `/models/Houses_${a}_3_Level${l}.gltf`,
    health: {
      FirstAge:  { 1: 450,  2: 580,  3: 750  },
      SecondAge: { 1: 950,  2: 1200, 3: 1550 },
    },
  },

  {
    id: 'farm', name: 'Farm', category: 'Town', scale: 4,
    grid: { w: 2, h: 2 }, hasLevels: true,
    gridFor: (a, l) => l === 1 ? { w: 2, h: 2 } : l === 2 ? { w: 3, h: 3 } : { w: 4, h: 4 },
    pathFor: (a, l) => `/models/Farm_${a}_Level${l}.gltf`,
    health: {
      FirstAge:  { 1: 600,  2: 780,  3: 1000 },
      SecondAge: { 1: 1250, 2: 1600, 3: 2050 },
    },
  },

  {
    id: 'storage', name: 'Storage', category: 'Town', scale: 4,
    grid: { w: 4, h: 4 }, hasLevels: true,
    // Filename typo in the asset pack for FirstAge Level 3
    pathFor: (a, l) =>
      a === 'FirstAge' && l === 3
        ? `/models/Storage_FirstAge_Leve3.gltf`
        : `/models/Storage_${a}_Level${l}.gltf`,
    health: {
      FirstAge:  { 1: 800,  2: 1050, 3: 1350 },
      SecondAge: { 1: 1700, 2: 2200, 3: 2800 },
    },
  },

  {
    id: 'market', name: 'Market', category: 'Town', scale: 4,
    grid: { w: 3, h: 3 }, hasLevels: true,
    pathFor: (a, l) => `/models/Market_${a}_Level${l}.gltf`,
    health: {
      FirstAge:  { 1: 550,  2: 700,  3: 900  },
      SecondAge: { 1: 1100, 2: 1400, 3: 1800 },
    },
  },

  {
    id: 'windmill', name: 'Windmill', category: 'Town', scale: 4,
    grid: { w: 2, h: 2 }, hasLevels: false,
    pathFor: (a) => `/models/Windmill_${a}.gltf`,
    health: {
      FirstAge:  { 1: 500  },
      SecondAge: { 1: 1050 },
    },
  },

  {
    id: 'wonder', name: 'Wonder', category: 'Town', scale: 5,
    grid: { w: 5, h: 5 }, hasLevels: true, maxLevel: 2,
    pathFor: (a, l) => `/models/Wonder_${a}_Level${l + 1}.gltf`,
    health: {
      FirstAge:  { 1: 4000, 2: 5200  },
      SecondAge: { 1: 8500, 2: 11000 },
    },
  },

  // ── Military ─────────────────────────────────────────────────────────────────

  {
    id: 'barracks', name: 'Barracks', category: 'Military', scale: 4,
    grid: { w: 3, h: 3 }, hasLevels: true,
    pathFor: (a, l) => `/models/Barracks_${a}_Level${l}.gltf`,
    health: {
      FirstAge:  { 1: 900,  2: 1150, 3: 1500 },
      SecondAge: { 1: 1900, 2: 2450, 3: 3150 },
    },
  },

  {
    id: 'archery', name: 'Archery', category: 'Military', scale: 4,
    grid: { w: 3, h: 3 }, hasLevels: true,
    gridFor: (a, l) => l >= 2 ? { w: 4, h: 4 } : { w: 3, h: 3 },
    pathFor: (a, l) => `/models/Archery_${a}_Level${l}.gltf`,
    health: {
      FirstAge:  { 1: 700,  2: 900,  3: 1150 },
      SecondAge: { 1: 1450, 2: 1900, 3: 2400 },
    },
  },

  {
    id: 'watch-tower', name: 'Watch Tower', category: 'Military', scale: 4,
    grid: { w: 2, h: 2 }, hasLevels: true,
    pathFor: (a, l) => `/models/WatchTower_${a}_Level${l}.gltf`,
    health: {
      FirstAge:  { 1: 600,  2: 780,  3: 1000 },
      SecondAge: { 1: 1250, 2: 1600, 3: 2050 },
    },
  },

  {
    id: 'tower-house', name: 'Tower House', category: 'Military', scale: 4,
    grid: { w: 3, h: 3 }, hasLevels: false,
    pathFor: (a) => `/models/TowerHouse_${a}.gltf`,
    health: {
      FirstAge:  { 1: 1000 },
      SecondAge: { 1: 2100 },
    },
  },

  // ── Walls ────────────────────────────────────────────────────────────────────

  {
    id: 'wall', name: 'Wall', category: 'Walls', scale: 3,
    grid: { w: 1, h: 1 }, hasLevels: false,
    pathFor: (a) => `/models/Wall_${a}.gltf`,
    health: {
      FirstAge:  { 1: 300 },
      SecondAge: { 1: 700 },
    },
  },


  // ── Special ──────────────────────────────────────────────────────────────────

  {
    id: 'temple', name: 'Temple', category: 'Special', scale: 5,
    grid: { w: 3, h: 3 }, hasLevels: true,
    pathFor: (a, l) => `/models/Temple_${a}_Level${l}.gltf`,
    health: {
      FirstAge:  { 1: 1400, 2: 1800, 3: 2350 },
      SecondAge: { 1: 2900, 2: 3800, 3: 4900 },
    },
  },

  {
    id: 'port', name: 'Port', category: 'Special', scale: 5,
    grid: { w: 4, h: 4 }, hasLevels: true,
    pathFor: (a, l) => `/models/Port_${a}_Level${l}.gltf`,
    health: {
      FirstAge:  { 1: 1100, 2: 1450, 3: 1850 },
      SecondAge: { 1: 2300, 2: 3000, 3: 3850 },
    },
  },

  {
    id: 'dock', name: 'Dock', category: 'Special', scale: 4,
    grid: { w: 3, h: 2 }, hasLevels: false,
    pathFor: () => `/models/Dock_FirstAge.gltf`,
    health: {
      FirstAge: { 1: 800 },
    },
  },

]

// ── Lookup helpers ─────────────────────────────────────────────────────────────

export const CATALOG_MAP: Record<string, BuildingConfig> =
  Object.fromEntries(CATALOG.map(b => [b.id, b]))

export function defFor(id: string): BuildingConfig {
  const def = CATALOG_MAP[id]
  if (!def) throw new Error(`Unknown building id: ${id}`)
  return def
}

export function pathOf(defId: string, age: Age, level: Level): string {
  return defFor(defId).pathFor(age, level)
}

export function gridSizeOf(defId: string, age: Age, level: Level): GridSize {
  const def = defFor(defId)
  return def.gridFor ? def.gridFor(age, level) : def.grid
}

export function healthOf(defId: string, age: Age, level: Level, gridMultiplier: number = 1): number {
  const map = defFor(defId).health
  return (map[age]?.[level] ?? map.FirstAge?.[1] ?? 0) * gridMultiplier
}

export function maxLevel(defId: string, age: Age): Level {
  const map = defFor(defId).health
  const levels = Object.keys(map[age] ?? {}).map(Number)
  return (levels.length > 0 ? Math.max(...levels) : 1) as Level
}

export const CATEGORIES: Category[] = ['Town', 'Military', 'Walls', 'Special']
