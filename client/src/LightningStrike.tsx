import { useMemo } from 'react'

// ── Point type ────────────────────────────────────────────────────────────────
interface Pt { x: number; y: number }

// ── Recursive midpoint displacement ───────────────────────────────────────────
// Each pass splits every segment at its midpoint and nudges it sideways.
// `roughness` controls the horizontal jag; `roughness * 0.18` keeps it thin vertically.
function displaceOnce(pts: Pt[], roughness: number): Pt[] {
  const out: Pt[] = [pts[0]]
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1]
    out.push(
      { x: (a.x + b.x) / 2 + (Math.random() - 0.5) * roughness,
        y: (a.y + b.y) / 2 + (Math.random() - 0.5) * roughness * 0.18 },
      b,
    )
  }
  return out
}

function buildBolt(x1: number, y1: number, x2: number, y2: number,
                   roughness: number, passes: number): Pt[] {
  let pts: Pt[] = [{ x: x1, y: y1 }, { x: x2, y: y2 }]
  for (let i = 0; i < passes; i++) {
    pts = displaceOnce(pts, roughness)
    roughness *= 0.52
  }
  return pts
}

function toD(pts: Pt[]): string {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface LightningStrikeProps {
  /** Viewport X of the target (click point) */
  toX: number
  /** Viewport Y of the target (click point) */
  toY: number
  /** How many secondary branches to draw (default 4) */
  branchCount?: number
  /** Primary bolt hue shift (default purple ~270°) */
  hue?: number
  /** Total animation duration in ms (default 1400) */
  duration?: number
}

// ── Component ─────────────────────────────────────────────────────────────────
export function LightningStrike({
  toX, toY,
  branchCount = 4,
  hue = 270,
  duration = 1400,
}: LightningStrikeProps) {
  const W = window.innerWidth
  const H = window.innerHeight

  const { mainD, branches } = useMemo(() => {
    // Bolt starts just above the viewport, slightly randomised left/right
    const startX = toX + (Math.random() - 0.5) * 60
    const startY = -10
    const main = buildBolt(startX, startY, toX, toY, 90, 7)

    // Branches: pick random mid-points, shoot out sideways
    const br: string[] = []
    const step = Math.max(1, Math.floor(main.length / (branchCount + 1)))
    for (let b = 0; b < branchCount; b++) {
      const idx = Math.min(step * (b + 1), main.length - 2)
      const pivot = main[idx]
      const angle = (Math.random() - 0.5) * 1.2   // radians left/right
      const len   = 45 + Math.random() * 90
      const bx2   = pivot.x + Math.sin(angle) * len
      const by2   = pivot.y + Math.cos(angle) * len * 1.6   // mostly downward
      br.push(toD(buildBolt(pivot.x, pivot.y, bx2, by2, 28, 4)))
    }

    return { mainD: toD(main), branches: br }
  }, [toX, toY, branchCount])  // stable per cast

  const uid = useMemo(() => Math.random().toString(36).slice(2), [])
  const glowId  = `lg-${uid}`
  const impactId = `li-${uid}`

  const dur  = `${duration}ms`
  const fade = `lightning-fade-${uid}`

  return (
    <>
      {/* Inject per-instance keyframe so duration is dynamic */}
      <style>{`
        @keyframes ${fade} {
          0%   { opacity: 1 }
          15%  { opacity: 1 }
          80%  { opacity: 0.6 }
          100% { opacity: 0 }
        }
      `}</style>

      <svg
        style={{
          position: 'fixed', top: 0, left: 0,
          width: '100vw', height: '100vh',
          pointerEvents: 'none', zIndex: 40,
          overflow: 'visible',
          animation: `${fade} ${dur} ease-out forwards`,
        }}
        viewBox={`0 0 ${W} ${H}`}
      >
        <defs>
          {/* Glow filter */}
          <filter id={glowId} x="-50%" y="-20%" width="200%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur5" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur12" />
            <feMerge>
              <feMergeNode in="blur12" />
              <feMergeNode in="blur5"  />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Radial gradient for impact bloom */}
          <radialGradient id={impactId} cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="1" />
            <stop offset="35%"  stopColor={`hsl(${hue},90%,70%)`} stopOpacity="0.9" />
            <stop offset="100%" stopColor={`hsl(${hue},80%,40%)`} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ── Main bolt — 3 layered strokes for glow depth ── */}
        {/* Outer diffuse glow */}
        <path d={mainD} stroke={`hsl(${hue},80%,45%)`} strokeWidth="18"
          strokeOpacity="0.28" fill="none" strokeLinecap="round"
          filter={`url(#${glowId})`} />
        {/* Mid glow */}
        <path d={mainD} stroke={`hsl(${hue},90%,65%)`} strokeWidth="7"
          strokeOpacity="0.75" fill="none" strokeLinecap="round"
          filter={`url(#${glowId})`} />
        {/* Bright white core */}
        <path d={mainD} stroke="#ffffff" strokeWidth="2.5"
          strokeOpacity="0.95" fill="none" strokeLinecap="round" />

        {/* ── Branches ── */}
        {branches.map((d, i) => (
          <g key={i}>
            <path d={d} stroke={`hsl(${hue},80%,55%)`} strokeWidth="5"
              strokeOpacity="0.4" fill="none" strokeLinecap="round"
              filter={`url(#${glowId})`} />
            <path d={d} stroke={`hsl(${hue},90%,75%)`} strokeWidth="2"
              strokeOpacity="0.65" fill="none" strokeLinecap="round" />
            <path d={d} stroke="#ffffff" strokeWidth="0.8"
              strokeOpacity="0.8" fill="none" strokeLinecap="round" />
          </g>
        ))}

        {/* ── Impact bloom at target ── */}
        {/* Outer shockwave */}
        <circle cx={toX} cy={toY} r="70" fill="none"
          stroke={`hsl(${hue},90%,60%)`} strokeWidth="2" strokeOpacity="0.5"
          filter={`url(#${glowId})`} />
        {/* Core radial bloom */}
        <circle cx={toX} cy={toY} r="55"
          fill={`url(#${impactId})`} />
        {/* Tight bright core */}
        <circle cx={toX} cy={toY} r="14"
          fill="#ffffff" fillOpacity="0.9"
          filter={`url(#${glowId})`} />

        {/* Ground ellipse (perspective flattening) */}
        <ellipse cx={toX} cy={toY + 4} rx="80" ry="18"
          stroke={`hsl(${hue},90%,65%)`} strokeWidth="1.5"
          strokeOpacity="0.5" fill="none"
          filter={`url(#${glowId})`} />
      </svg>
    </>
  )
}
