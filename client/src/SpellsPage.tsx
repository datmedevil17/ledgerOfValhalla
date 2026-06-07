import { useState, useCallback, useEffect, type MouseEvent } from 'react'
import { useTxToast, TxToastContainer, TX_TOAST_STYLES } from './TxToast'
import rawData from '../public/clash-map-1779534012265.json'
import { FinalMapCanvas, type FinalPlacedItem, type FinalLightCfg } from './FinalMap'
import { LightningStrike } from './LightningStrike'
import { FireCircle } from './FireCircle'
import { FireballDrop } from './FireballDrop'
import LiquidEther from './LiquidEther'
import LightPillar from './LightPillar'
import { LightningWizardDrop } from './LightningWizardDrop'
import { MonkDrop } from './MonkDrop'

// ── Map data (same source as /final page) ────────────────────────────────────
const MAP_ITEMS = rawData.items as unknown as FinalPlacedItem[]
const MAP_CFG = rawData.lights as FinalLightCfg

// ── Types ─────────────────────────────────────────────────────────────────────
type SpellCtx = 'battle' | 'home'
type TargetMode = 'aoe-circle' | 'aoe-square' | 'point' | 'auto'

interface SpellDef {
  id: string; num: number; name: string; tier: 1 | 2 | 3
  cost: number; ctx: SpellCtx; targetMode: TargetMode
  aoeRadius?: number; color: string; glow: string
  duration: string; desc: string; flavor: string
  img: string | null; emoji: string
}

interface ActiveEffect {
  key: string; spellId: string
  x: number; y: number  // viewport px
  r: number             // aoe radius in px (aoeRadius * PX_PER_UNIT)
  color: string; seed: number
}

// 1 world-unit ≈ 22px at default camera zoom
const PX_PER_UNIT = 22

// ── Spell definitions ─────────────────────────────────────────────────────────
const SPELLS: SpellDef[] = [
  // Battle ─────────────────────────────────────────────────────────────────────
  {
    id: 'fireball', num: 1, name: 'Fireball', tier: 1, cost: 300, ctx: 'battle', targetMode: 'aoe-circle', aoeRadius: 3,
    color: '#ff4400', glow: '#ff8855', duration: 'Instant',
    desc: '200 damage to all units in a 3-unit radius. Friendly fire active.',
    flavor: 'Best paired with Element: Air to cluster enemies first.',
    img: '/spells/Renders/1_Fireball.png', emoji: '🔥'
  },

  {
    id: 'trenchcoat', num: 2, name: 'TrenchcoatMushrooms', tier: 3, cost: 600, ctx: 'battle', targetMode: 'point',
    color: '#44cc44', glow: '#88ff88', duration: '20s',
    desc: '5 units appear disguised as mushrooms — defenses ignore them. On reveal each attacks the nearest defense.',
    flavor: 'Deploy inside the perimeter while tanks draw tower fire.',
    img: '/spells/Renders/2_TrenchcoatMushrooms.png', emoji: '🍄'
  },

  {
    id: 'monk', num: 3, name: 'Monk', tier: 2, cost: 400, ctx: 'battle', targetMode: 'point',
    color: '#ffaa33', glow: '#ffdd99', duration: 'Instant',
    desc: 'Instantly deploys 3 Monks at the target point, bypassing the training queue.',
    flavor: 'Great mid-battle reinforcement when the front line thins.',
    img: '/spells/Renders/3_Monk.png', emoji: '🥋'
  },

  {
    id: 'steal', num: 5, name: 'Steal', tier: 2, cost: 500, ctx: 'battle', targetMode: 'auto',
    color: '#ffdd00', glow: '#ffee88', duration: 'Instant',
    desc: 'Auto-targets the nearest enemy Mine buffer — steals 300 Gold into your loot counter.',
    flavor: 'Use before troops deploy to lock in loot on a partial raid.',
    img: '/spells/Renders/5_Steal.png', emoji: '💰'
  },

  {
    id: 'lightning-wizard', num: 8, name: 'Lightning Wizard', tier: 2, cost: 600, ctx: 'battle', targetMode: 'point',
    color: '#8844ff', glow: '#cc99ff', duration: '30s',
    desc: 'Deploys a temporary Wizard with 2× stats (280 HP, 140 dmg, splash 4). Vanishes at 30s.',
    flavor: 'Blue electric variant — keep it away from AoE damage.',
    img: '/spells/Renders/8_LightningWizard.png', emoji: '⚡'
  },

  {
    id: 'rebirth', num: 17, name: 'Rebirth', tier: 2, cost: 700, ctx: 'battle', targetMode: 'auto',
    color: '#aaffcc', glow: '#ccffdd', duration: 'Instant',
    desc: 'Revives the last 3 friendly troops that died, at 50% HP, at their death positions.',
    flavor: 'Most valuable right after your tanks collapse in a chokepoint.',
    img: '/spells/Renders/17_Rebirth.png', emoji: '✨'
  },

  {
    id: 'element-fire', num: 20, name: 'Element: Fire', tier: 1, cost: 350, ctx: 'battle', targetMode: 'aoe-circle', aoeRadius: 4,
    color: '#ff6600', glow: '#ffaa44', duration: '5s',
    desc: 'Burns all units in a 4-unit radius for 30 DPS over 5 seconds.',
    flavor: 'Stack with Element: Water for burn uptime on slowed targets.',
    img: '/spells/Renders/20_Element_Fire.png', emoji: '🌋'
  },

  {
    id: 'element-lightning', num: 21, name: 'Element: Lightning', tier: 2, cost: 500, ctx: 'battle', targetMode: 'point',
    color: '#ccff00', glow: '#eeff88', duration: 'Instant',
    desc: '400 damage to primary target. Chains to 2 nearby units for 150 each automatically.',
    flavor: 'Best single-target nuke. Excellent vs Temple reinforcements.',
    img: '/spells/Renders/21_Element_Lightning.png', emoji: '⚡'
  },

  {
    id: 'element-air', num: 22, name: 'Element: Air', tier: 2, cost: 400, ctx: 'battle', targetMode: 'aoe-circle', aoeRadius: 5,
    color: '#aaddff', glow: '#ddeeff', duration: 'Instant',
    desc: 'Tornado pushes all units in 5-unit radius outward 8 units, interrupting attacks.',
    flavor: 'Scatter Temple reinforcements before they engage your troops.',
    img: '/spells/Renders/22_Element_Air.png', emoji: '🌪️'
  },

  {
    id: 'element-dark', num: 24, name: 'Element: Dark', tier: 3, cost: 700, ctx: 'battle', targetMode: 'aoe-square', aoeRadius: 6,
    color: '#9900cc', glow: '#cc44ff', duration: '8s',
    desc: 'Blinds all defense buildings in a 6×6 grid area for 8 seconds — they cannot target troops.',
    flavor: 'Send your main force through the blinded zone immediately.',
    img: '/spells/Renders/24_Element_Dark.png', emoji: '🌑'
  },

  {
    id: 'wizard', num: 30, name: 'Wizard', tier: 3, cost: 800, ctx: 'battle', targetMode: 'point',
    color: '#cc44ff', glow: '#ee88ff', duration: 'Battle',
    desc: 'Deploys a permanent Wizard troop at the target point for the rest of the battle.',
    flavor: 'Unlike Lightning Wizard, this one never disappears.',
    img: '/spells/Renders/30_Wizard.png', emoji: '🔮'
  },

  // Home ───────────────────────────────────────────────────────────────────────
  {
    id: 'market', num: 4, name: 'Market', tier: 2, cost: 450, ctx: 'home', targetMode: 'auto',
    color: '#ffaa00', glow: '#ffdd88', duration: '10s',
    desc: '+800 Gold and +200 Food generated over 10 seconds.',
    flavor: 'Cast near Storage cap — surplus gold is lost on overflow.',
    img: '/spells/Renders/4_Market.png', emoji: '🏪'
  },

  {
    id: 'coin', num: 14, name: 'Coin', tier: 1, cost: 200, ctx: 'home', targetMode: 'auto',
    color: '#ffdd00', glow: '#ffeeaa', duration: 'Instant',
    desc: 'Instantly deposits 500 Gold into your Storage.',
    flavor: 'Best early-game when 500g funds the next upgrade.',
    img: '/spells/Renders/14_Coin.png', emoji: '🪙'
  },

  {
    id: 'polinization', num: 11, name: 'Polinization', tier: 1, cost: 300, ctx: 'home', targetMode: 'auto',
    color: '#88ff44', glow: '#bbff88', duration: '2h',
    desc: 'All Farms produce at 3× rate for 2 hours. Stacks with Windmill.',
    flavor: 'With Windmill active: 6× total Farm output.',
    img: null, emoji: '🌸'
  },

  {
    id: 'ocean-treasure', num: 19, name: 'Ocean Treasure', tier: 2, cost: 400, ctx: 'home', targetMode: 'auto',
    color: '#00aaff', glow: '#88ddff', duration: 'Instant',
    desc: 'Treasure washes up at your Port — 1,200–2,400 Gold (random). Requires Port built.',
    flavor: 'Higher Market level improves the gold range.',
    img: null, emoji: '💎'
  },

  {
    id: 'book', num: 27, name: 'Book', tier: 2, cost: 500, ctx: 'home', targetMode: 'auto',
    color: '#ddaa44', glow: '#ffcc88', duration: 'Instant',
    desc: 'Reduces remaining upgrade time on your active builder job by 30 minutes.',
    flavor: 'Most impactful in the last hour of a long upgrade.',
    img: null, emoji: '📚'
  },

  {
    id: 'roll-dice', num: 28, name: 'Roll Dice', tier: 1, cost: 150, ctx: 'home', targetMode: 'auto',
    color: '#ff8844', glow: '#ffbb88', duration: 'Instant',
    desc: 'Random effect: +300–1500 Gold, Food burst, −15 min builder, or dud.',
    flavor: 'Cheapest card at 150g. A fun gambling filler slot.',
    img: null, emoji: '🎲'
  },
]

// ── CSS keyframes ─────────────────────────────────────────────────────────────
const STYLES = `
@keyframes fx-expand      { 0%{transform:translate(-50%,-50%) scale(0);opacity:1} 100%{transform:translate(-50%,-50%) scale(1);opacity:0} }
@keyframes fx-screen-flash{ 0%{opacity:.55} 8%{opacity:.55} 100%{opacity:0} }
@keyframes fx-expand-fire { 0%{transform:translate(-50%,-50%) scale(0);opacity:1} 50%{opacity:.9} 100%{transform:translate(-50%,-50%) scale(1.4);opacity:0} }
@keyframes fx-spark       { 0%{transform:translate(-50%,-50%);opacity:1} 100%{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy)));opacity:0} }
@keyframes fx-float       { 0%{transform:translate(-50%,0);opacity:1} 100%{transform:translate(-50%,-55px);opacity:0} }
@keyframes fx-bolt        { 0%,100%{opacity:0} 8%,18%,28%{opacity:1} 13%,23%{opacity:.1} }
@keyframes fx-chain       { 0%{opacity:0;transform:translate(-50%,-50%) scaleX(0);transform-origin:left center} 25%{opacity:1;transform:translate(-50%,-50%) scaleX(1)} 80%{opacity:1} 100%{opacity:0} }
@keyframes fx-tornado     { 0%{transform:translate(-50%,-50%) scale(0) rotate(0deg);opacity:0} 20%{opacity:.9} 100%{transform:translate(-50%,-50%) scale(2.2) rotate(600deg);opacity:0} }
@keyframes fx-dark        { 0%{transform:translate(-50%,-50%) scaleY(0);opacity:0} 18%{transform:translate(-50%,-50%) scaleY(1);opacity:.88} 80%{opacity:.88} 100%{opacity:0} }
@keyframes fx-dark-ether  { 0%{opacity:0;transform:scale(0)} 12%{opacity:1;transform:scale(1)} 80%{opacity:.92} 100%{opacity:0;transform:scale(1)} }
@keyframes fx-portal      { 0%{transform:translate(-50%,-50%) scale(0) rotateX(65deg);opacity:0} 30%{transform:translate(-50%,-50%) scale(1) rotateX(0deg);opacity:1} 75%{opacity:.8} 100%{transform:translate(-50%,-50%) scale(.15) rotateX(65deg);opacity:0} }
@keyframes fx-emerge      { 0%{transform:translate(-50%,-50%) translateY(16px) scale(0);opacity:0} 55%{transform:translate(-50%,-50%) translateY(0) scale(1.1);opacity:1} 100%{transform:translate(-50%,-50%) scale(1);opacity:1} }
@keyframes fx-ghost       { 0%{transform:translate(-50%,-50%) translateY(14px);opacity:0;filter:blur(5px)} 40%{opacity:.7;filter:blur(1px)} 100%{transform:translate(-50%,-50%) translateY(-28px);opacity:0;filter:blur(0)} }
@keyframes fx-pollen      { 0%{transform:translateY(-50%) scaleX(0);opacity:0;transform-origin:0 50%} 15%{opacity:1} 85%{opacity:1} 100%{transform:translateY(-50%) scaleX(1);opacity:0} }
@keyframes fx-chest       { 0%{transform:translate(-50%,-50%) translateY(40px);opacity:0} 28%{transform:translate(-50%,-50%) translateY(0);opacity:1} 55%{transform:translate(-50%,-50%) translateY(-10px)} 78%{transform:translate(-50%,-50%) translateY(0);opacity:1} 100%{opacity:0} }
@keyframes fx-book        { 0%{transform:translate(-50%,-50%);opacity:1} 40%{transform:translate(-50%,-50%) translateY(-22px) rotate(10deg)} 100%{transform:translate(-50%,-50%) translateY(-44px) rotate(-6deg);opacity:0} }
@keyframes fx-dice        { 0%{transform:translate(-50%,-50%) scale(0) rotate(0deg);opacity:0} 18%{opacity:1} 70%{transform:translate(-50%,-50%) scale(1.2) rotate(700deg)} 100%{transform:translate(-50%,-50%) scale(1) rotate(900deg)} }
@keyframes fx-result      { 0%{transform:translate(-50%,-50%) scale(0);opacity:0} 35%{transform:translate(-50%,-50%) scale(1.25);opacity:1} 70%{transform:translate(-50%,-50%) scale(1);opacity:1} 100%{opacity:0} }
@keyframes fx-mush-reveal { 0%,55%{transform:translate(-50%,-50%) scale(1)} 70%{transform:translate(-50%,-50%) scale(1.5) rotate(-15deg)} 100%{transform:translate(-50%,-50%) scale(0);opacity:0} }
@keyframes fx-coin-fly    { 0%{transform:translate(-50%,-50%);opacity:1} 100%{transform:translate(160px,-110px);opacity:0} }
@keyframes fx-flame       { 0%,100%{transform:translate(-50%,-50%) scaleY(1) rotate(-4deg)} 50%{transform:translate(-50%,-50%) scaleY(1.4) rotate(5deg)} }
@keyframes reticle-pulse  { 0%,100%{opacity:.88} 50%{opacity:.35} }
@keyframes card-glow      { 0%,100%{box-shadow:0 0 14px 2px var(--glow,#fff5)} 50%{box-shadow:0 0 28px 6px var(--glow,#fff5)} }
@keyframes hud-slide-in   { 0%{transform:translateY(100%);opacity:0} 100%{transform:translateY(0);opacity:1} }
@keyframes info-slide-in  { 0%{transform:translateX(-30px);opacity:0} 100%{transform:translateX(0);opacity:1} }
@keyframes casting-ring   { 0%{transform:translate(-50%,-50%) scale(1);opacity:.6} 100%{transform:translate(-50%,-50%) scale(2);opacity:0} }
@keyframes fx-strike-drop { 0%{clip-path:inset(0 0 100% 0);opacity:0} 12%{opacity:1;clip-path:inset(0 0 0% 0)} 72%{opacity:1} 100%{opacity:0;clip-path:inset(0 0 0% 0)} }
@keyframes fx-impact-flash{ 0%{transform:translate(-50%,-50%) scale(0);opacity:1} 40%{transform:translate(-50%,-50%) scale(1.6);opacity:.9} 100%{transform:translate(-50%,-50%) scale(3);opacity:0} }
@keyframes fx-ground-ring { 0%{transform:translate(-50%,-50%) scale(0) rotateX(75deg);opacity:.9} 100%{transform:translate(-50%,-50%) scale(1) rotateX(75deg);opacity:0} }
`

// ── Deterministic pseudo-random ───────────────────────────────────────────────
function rnd(seed: number, i: number): number {
  let h = Math.abs((seed * 9301 + i * 49297 + 233280) % 1000003)
  return (h % 1000) / 1000
}

// ── CastEffect ────────────────────────────────────────────────────────────────
function CastEffect({ e }: { e: ActiveEffect }) {
  const at = (extra: React.CSSProperties): React.CSSProperties => ({
    position: 'fixed', left: e.x, top: e.y, pointerEvents: 'none', ...extra,
  })

  switch (e.spellId) {

    case 'fireball':
      return <>
        {/* OGL fireball — falling animated fire orb + explosion */}
        <FireballDrop x={e.x} y={e.y} radius={e.r + 50} duration={2200} />
        <div style={{
          position: 'fixed', left: e.x, top: e.y - 32,
          transform: 'translate(-50%,0)', pointerEvents: 'none', zIndex: 42,
          color: '#ff6600', fontWeight: 900, fontSize: 22,
          textShadow: '0 0 12px #ff2200',
          animation: 'fx-float 1.1s ease-out .9s forwards', opacity: 0,
        }}>-200</div>
      </>

    case 'element-fire':
      return <div style={at({})}>
        <div style={{
          position: 'absolute', width: e.r * 2, height: e.r * 2, borderRadius: '50%',
          background: `radial-gradient(circle, #ff440055 0%, #ff660033 55%, transparent 80%)`,
          border: `2px dashed #ff8800`, transform: 'translate(-50%,-50%)',
          animation: 'fx-expand-fire 1.8s ease-out forwards'
        }} />
        {Array.from({ length: 12 }).map((_, i) => {
          const ang = rnd(e.seed, i) * Math.PI * 2
          const r2 = e.r * (.2 + rnd(e.seed, i + 20) * .75)
          return <div key={i} style={{
            position: 'absolute',
            left: Math.cos(ang) * r2, top: Math.sin(ang) * r2,
            transform: 'translate(-50%,-50%)',
            fontSize: 20 + Math.round(rnd(e.seed, i + 40) * 12),
            animation: `fx-flame ${.35 + rnd(e.seed, i + 60) * .35}s ease-in-out ${i * .07}s infinite`,
          }}>🔥</div>
        })}
        <div style={{
          position: 'absolute', top: -14, left: 0, transform: 'translate(-50%,0)',
          color: '#ff8800', fontWeight: 800, fontSize: 15, textShadow: '0 0 8px #ff4400',
          animation: 'fx-float 1.8s ease-out .1s forwards', opacity: 0
        }}>BURNING 30 DPS · 5s</div>
      </div>

    case 'element-air':
      return <div style={at({})}>
        <div style={{
          position: 'absolute', width: e.r * 2, height: e.r * 2, borderRadius: '50%',
          border: `3px solid ${e.color}99`,
          background: `radial-gradient(circle, ${e.color}22 0%, transparent 70%)`,
          transform: 'translate(-50%,-50%)',
          animation: 'fx-tornado 1.4s ease-out forwards',
          boxShadow: `0 0 30px ${e.color}55`
        }} />
        {[0, 60, 120, 180, 240, 300].map((deg, i) => {
          const rad = deg * Math.PI / 180, mid = e.r * .65
          return <div key={i} style={{
            position: 'absolute',
            left: Math.cos(rad) * mid, top: Math.sin(rad) * mid,
            transform: `translate(-50%,-50%) rotate(${deg}deg)`,
            color: '#aaddff', fontSize: 22, fontWeight: 900,
            ['--dx' as any]: `${Math.cos(rad) * e.r * .85}px`,
            ['--dy' as any]: `${Math.sin(rad) * e.r * .85}px`,
            animation: `fx-spark 1.1s ease-out ${i * .07}s forwards`
          }}>→</div>
        })}
        <div style={{
          position: 'absolute', top: -14, left: 0, transform: 'translate(-50%,0)',
          color: '#aaddff', fontWeight: 800, fontSize: 15,
          animation: 'fx-float 1.4s ease-out .1s forwards', opacity: 0
        }}>💨 PUSH — 8 units</div>
      </div>

    case 'element-dark': {
      const size = e.r * 2.8
      const colW = 180   // column width
      return <>
        {/* Thick dark ether column falling vertically from sky */}
        <div style={{
          position: 'fixed',
          left: e.x - colW / 2, top: 0,
          width: colW, height: e.y,
          pointerEvents: 'none', zIndex: 40,
          animation: 'fx-strike-drop 1.2s ease-in forwards',
          mixBlendMode: 'screen',
        }}>
          <LiquidEther
            colors={['#000000', '#0d0020', '#1a0033', '#4400aa', '#7700cc', '#aa33ff']}
            autoDemo={true} autoSpeed={0.4} autoIntensity={2.8}
            mouseForce={40} resolution={0.25} cursorSize={200}
          />
        </div>

        {/* Pool spreads at impact point after column lands */}
        <div style={{
          position: 'fixed',
          left: e.x - size / 2, top: e.y - size / 2,
          width: size, height: size,
          borderRadius: '50%', overflow: 'hidden',
          pointerEvents: 'none', zIndex: 40,
          opacity: 0,
          animation: 'fx-dark-ether 8s ease-out .9s forwards',
        }}>
          <LiquidEther
            colors={['#000000', '#0a0015', '#1a0033', '#2d0060', '#7700cc', '#cc44ff']}
            autoDemo={true} autoSpeed={0.7} autoIntensity={3.5}
            mouseForce={35} resolution={0.35} cursorSize={120}
          />
        </div>

        {/* Vignette ring at impact */}
        <div style={{
          position: 'fixed', left: e.x, top: e.y,
          width: size, height: size, borderRadius: '50%',
          pointerEvents: 'none', zIndex: 41,
          transform: 'translate(-50%,-50%)',
          boxShadow: '0 0 60px 20px #3d006688 inset, 0 0 30px 8px #9900cc44',
          animation: 'fx-dark 8s ease-out .9s forwards', opacity: 0,
        }} />

        <div style={{
          position: 'fixed', left: e.x, top: e.y - size / 2 - 18,
          transform: 'translate(-50%,0)', pointerEvents: 'none', zIndex: 42,
          color: '#cc44ff', fontWeight: 800, fontSize: 15,
          textShadow: '0 0 10px #cc44ff',
          animation: 'fx-float 1s ease-out 1.2s forwards', opacity: 0,
        }}>BLIND · 8s</div>
      </>
    }

    case 'element-lightning': {
      return <>
        {/* Full-screen white flash on impact */}
        <div style={{
          position: 'fixed', inset: 0, zIndex: 38, pointerEvents: 'none',
          background: '#ffffff',
          animation: 'fx-screen-flash .5s ease-out forwards',
        }} />

        {/* SVG recursive-displacement bolt from sky to click point */}
        <LightningStrike toX={e.x} toY={e.y} hue={270} branchCount={5} duration={1500} />

        {/* Damage label anchored at cast point */}
        <div style={{
          position: 'fixed', left: e.x, top: e.y - 30,
          transform: 'translate(-50%,0)', pointerEvents: 'none', zIndex: 42,
          color: '#cc44ff', fontWeight: 900, fontSize: 20,
          textShadow: '0 0 14px #cc44ff, 0 0 4px #fff',
          animation: 'fx-float 1.2s ease-out .3s forwards', opacity: 0,
        }}>-400 chain -150</div>
      </>
    }

    case 'trenchcoat': {
      // LightPillar beams down → troops in area double
      const pillarW = 160, pillarH = Math.max(e.y, 200)
      return <>
        {/* Pillar descends from sky to click point */}
        <div style={{
          position: 'fixed',
          left: e.x - pillarW / 2, top: 0,
          width: pillarW, height: pillarH,
          pointerEvents: 'none', zIndex: 40,
          animation: 'fx-strike-drop 2.5s ease-out forwards',
        }}>
          <LightPillar
            topColor="#00ffaa" bottomColor="#44ff88"
            intensity={1.4} glowAmount={0.008}
            pillarWidth={2.2} pillarHeight={0.5}
            noiseIntensity={0.35} rotationSpeed={0.5}
            mixBlendMode="screen" quality="medium"
          />
        </div>

        {/* Impact glow at the click point */}
        <div style={{
          position: 'fixed', left: e.x, top: e.y,
          width: 120, height: 120, borderRadius: '50%',
          transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 41,
          background: 'radial-gradient(circle, #aaffcc88 0%, transparent 70%)',
          animation: 'fx-impact-flash .8s ease-out .2s forwards', opacity: 0,
          boxShadow: '0 0 40px 12px #44ff8866',
        }} />

        {/* x2 TROOPS label */}
        <div style={{
          position: 'fixed', left: e.x, top: e.y - 36,
          transform: 'translate(-50%,0)', pointerEvents: 'none', zIndex: 42,
          color: '#44ffaa', fontWeight: 900, fontSize: 24,
          textShadow: '0 0 16px #00ff88, 0 0 4px #fff',
          animation: 'fx-float 1.4s ease-out .6s forwards', opacity: 0,
        }}>×2 TROOPS</div>
      </>
    }

    case 'lightning-wizard':
      return <LightningWizardDrop x={e.x} y={e.y} />

    case 'monk':
      // 3 actual Monk.gltf characters deployed with attack animations
      return <MonkDrop x={e.x} y={e.y} />

    case 'wizard': {
      return <div style={at({})}>
        <div style={{
          position: 'absolute', width: 60, height: 60, borderRadius: '50%',
          background: `radial-gradient(circle, ${e.color}99, transparent)`,
          border: `2px solid ${e.color}`, transform: 'translate(-50%,-50%)',
          animation: 'fx-portal 1s ease-out forwards',
          boxShadow: `0 0 20px ${e.color}`
        }} />
        <div style={{
          position: 'absolute',
          transform: 'translate(-50%,-50%)', fontSize: 30,
          filter: `drop-shadow(0 0 8px ${e.color})`,
          animation: `fx-emerge .7s ease-out .3s forwards`, opacity: 0
        }}>🔮</div>
      </div>
    }

    case 'steal':
      return <div style={at({})}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            position: 'absolute', fontSize: 28,
            transform: 'translate(-50%,-50%)',
            animation: `fx-coin-fly 1s ease-in ${i * .13}s forwards`
          }}>🪙</div>
        ))}
        <div style={{
          position: 'absolute', top: -18, left: 0, transform: 'translate(-50%,0)',
          color: '#ffdd00', fontWeight: 900, fontSize: 20, textShadow: '0 0 10px #ff8800',
          animation: 'fx-float 1.1s ease-out .4s forwards', opacity: 0
        }}>+300 💰</div>
      </div>

    case 'rebirth':
      return <div style={at({})}>
        {[[-40, 0], [0, -28], [40, 0]].map(([dx, dy], i) => (
          <div key={i} style={{
            position: 'absolute', left: dx, top: dy,
            transform: 'translate(-50%,-50%)', fontSize: 32,
            filter: `drop-shadow(0 0 10px ${e.color})`,
            animation: `fx-ghost 2s ease-out ${i * .22}s forwards`, opacity: 0
          }}>👻</div>
        ))}
        <div style={{
          position: 'absolute', top: -22, left: 0, transform: 'translate(-50%,0)',
          color: e.color, fontWeight: 800, fontSize: 15,
          animation: 'fx-float 1.1s ease-out .8s forwards', opacity: 0
        }}>✨ REVIVED ×3 · 50% HP</div>
      </div>

    // ── Home effects ──────────────────────────────────────────────────────────

    case 'market':
      return <div style={at({})}>
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: (rnd(e.seed, i) - .5) * 160, top: -20 - rnd(e.seed, i + 20) * 50,
            transform: 'translate(-50%,-50%)', fontSize: 16 + Math.round(rnd(e.seed, i + 40) * 10),
            ['--dx' as any]: `${(rnd(e.seed, i + 60) - .5) * 70}px`,
            ['--dy' as any]: `${-25 - rnd(e.seed, i + 80) * 50}px`,
            animation: `fx-spark 1.4s ease-out ${i * .07}s forwards`
          }}>
            {i % 3 === 0 ? '🌾' : i % 3 === 1 ? '🪙' : '💰'}
          </div>
        ))}
        <div style={{
          position: 'absolute', top: -30, left: 0, transform: 'translate(-50%,0)',
          color: '#ffaa00', fontWeight: 900, fontSize: 20, textShadow: '0 0 10px #ff8800',
          animation: 'fx-float 1.6s ease-out .2s forwards', opacity: 0
        }}>+800💰 +200🌾</div>
      </div>

    case 'coin':
      return <div style={at({})}>
        <div style={{
          position: 'absolute', fontSize: 52,
          transform: 'translate(-50%,-50%)',
          animation: 'fx-coin-fly 1.3s ease-in-out forwards'
        }}>🪙</div>
        <div style={{
          position: 'absolute', top: -22, left: 0, transform: 'translate(-50%,0)',
          color: '#ffdd00', fontWeight: 900, fontSize: 22, textShadow: '0 0 10px #ffaa00',
          animation: 'fx-float 1.3s ease-out .5s forwards', opacity: 0
        }}>+500 💰</div>
      </div>

    case 'polinization':
      return <div style={{
        position: 'fixed', left: 0, top: e.y, width: '100vw', height: 0,
        pointerEvents: 'none'
      }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, width: '100%', height: 50,
          background: `linear-gradient(to right, transparent, #88ff4466, #88ff44bb, #88ff4466, transparent)`,
          animation: 'fx-pollen 2s ease-in-out forwards'
        }} />
        <div style={{
          position: 'absolute', left: '50%', top: -40, transform: 'translate(-50%,0)',
          color: '#88ff44', fontWeight: 800, fontSize: 18,
          animation: 'fx-float 1s ease-out .4s forwards', opacity: 0
        }}>🌸 3× FARM · 2 Hours</div>
      </div>

    case 'ocean-treasure': {
      const prizes = ['+1,200💰', '+1,800💰', '+2,400💰', '+1,500💰', '+900💰']
      const prize = prizes[Math.floor(rnd(e.seed, 0) * prizes.length)]
      return <div style={at({})}>
        <div style={{
          position: 'absolute', fontSize: 46,
          transform: 'translate(-50%,-50%)',
          animation: 'fx-chest 2.8s ease-out forwards'
        }}>🎁</div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute', fontSize: 18,
            transform: 'translate(-50%,-50%)',
            ['--dx' as any]: `${(rnd(e.seed, i + 10) - .5) * 100}px`,
            ['--dy' as any]: `${-25 - rnd(e.seed, i + 20) * 50}px`,
            animation: `fx-spark 1.1s ease-out ${.6 + i * .1}s forwards`
          }}>🪙</div>
        ))}
        <div style={{
          position: 'absolute', top: -28, left: 0, transform: 'translate(-50%,0)',
          color: '#00aaff', fontWeight: 900, fontSize: 22, textShadow: '0 0 10px #0088ff',
          animation: 'fx-result 2.2s ease-out .9s forwards', opacity: 0
        }}>{prize}</div>
      </div>
    }

    case 'book':
      return <div style={at({})}>
        <div style={{
          position: 'absolute', fontSize: 44,
          transform: 'translate(-50%,-50%)',
          animation: 'fx-book 1.7s ease-out forwards'
        }}>📚</div>
        <div style={{
          position: 'absolute', top: -26, left: 0, transform: 'translate(-50%,0)',
          color: '#ddaa44', fontWeight: 900, fontSize: 20, textShadow: '0 0 8px #aa7700',
          animation: 'fx-float 1.4s ease-out .35s forwards', opacity: 0
        }}>⏩ −30 min</div>
      </div>

    case 'roll-dice': {
      const outcomes = [
        { label: 'DUD…', color: '#888' },
        { label: '+500 💰', color: '#ffdd00' },
        { label: '+1,500 💰', color: '#ffaa00' },
        { label: 'FOOD BURST! 🌾', color: '#88ff44' },
        { label: '−15 min ⏩', color: '#aaddff' },
      ]
      const o = outcomes[Math.floor(rnd(e.seed, 0) * outcomes.length)]
      return <div style={at({})}>
        <div style={{
          position: 'absolute', fontSize: 52,
          transform: 'translate(-50%,-50%)',
          animation: 'fx-dice 1.7s ease-out forwards'
        }}>🎲</div>
        <div style={{
          position: 'absolute', top: -30, left: 0, transform: 'translate(-50%,0)',
          color: o.color, fontWeight: 900, fontSize: 20, textShadow: `0 0 10px ${o.color}`,
          animation: 'fx-result 2s ease-out 1.3s forwards', opacity: 0
        }}>{o.label}</div>
      </div>
    }

    default:
      return <div style={at({})}>
        <div style={{
          position: 'absolute', width: 40, height: 40, borderRadius: '50%',
          background: e.color, transform: 'translate(-50%,-50%)',
          animation: 'fx-expand .8s ease-out forwards'
        }} />
      </div>
  }
}

// ── Targeting reticle (fixed-position, follows mouse) ─────────────────────────
function Reticle({ spell, x, y }: { spell: SpellDef; x: number; y: number }) {
  const r = (spell.aoeRadius ?? 0) * PX_PER_UNIT
  const base: React.CSSProperties = {
    position: 'fixed', pointerEvents: 'none',
    animation: 'reticle-pulse 1s ease-in-out infinite',
  }

  if (spell.targetMode === 'aoe-circle') {
    const d = r * 2
    return <>
      <div style={{
        ...base, left: x - r, top: y - r, width: d, height: d, borderRadius: '50%',
        border: `2px solid ${spell.color}`, background: `${spell.color}18`,
        boxShadow: `0 0 20px ${spell.color}66`
      }} />
      {/* Expanding ring pulse */}
      <div style={{
        position: 'fixed', left: x - r, top: y - r, width: d, height: d,
        borderRadius: '50%', border: `1px solid ${spell.color}66`,
        animation: 'casting-ring 1.2s ease-out infinite', pointerEvents: 'none'
      }} />
    </>
  }

  if (spell.targetMode === 'aoe-square') {
    const side = r * 1.42
    return <div style={{
      ...base, left: x - side / 2, top: y - side / 2, width: side, height: side,
      border: `2px solid ${spell.color}`, background: `${spell.color}18`,
      boxShadow: `0 0 20px ${spell.color}66`
    }} />
  }

  if (spell.targetMode === 'point') {
    const arm = 28
    return <>
      <div style={{
        position: 'fixed', left: x - arm, top: y - 1, width: arm * 2, height: 2,
        background: `${spell.color}cc`, pointerEvents: 'none'
      }} />
      <div style={{
        position: 'fixed', left: x - 1, top: y - arm, width: 2, height: arm * 2,
        background: `${spell.color}cc`, pointerEvents: 'none'
      }} />
      <div style={{
        ...base, left: x - 10, top: y - 10, width: 20, height: 20, borderRadius: '50%',
        border: `2px solid ${spell.color}`,
        boxShadow: `0 0 10px ${spell.color}`
      }} />
    </>
  }

  return null
}

// ── Spell info panel (top-left HUD) ──────────────────────────────────────────
function SpellInfoPanel({ spell, onCancel }: { spell: SpellDef; onCancel: () => void }) {
  const tierLabel = { 1: 'T1', 2: 'T2', 3: 'T3' }[spell.tier]
  const tierColor = { 1: '#aaa', 2: '#66aaff', 3: '#ffaa22' }[spell.tier]
  const modeLabel = {
    'aoe-circle': `AoE · ${spell.aoeRadius}-unit radius`,
    'aoe-square': `AoE · ${spell.aoeRadius}×${spell.aoeRadius} grid`,
    'point': 'Point target',
    'auto': 'Auto-cast',
  }[spell.targetMode]

  const hint = spell.targetMode === 'auto'
    ? 'Click anywhere on the map to cast'
    : spell.targetMode === 'point'
      ? 'Move to aim · click to cast · can cast multiple times'
      : `Move to aim — ${spell.aoeRadius}-unit radius · click to cast`

  return (
    <div style={{
      position: 'fixed', top: 16, left: 16, zIndex: 30, width: 280,
      background: 'rgba(6,4,14,0.92)', border: `1px solid ${spell.color}55`,
      borderRadius: 12, overflow: 'hidden',
      boxShadow: `0 8px 32px #00000088, 0 0 0 1px ${spell.color}22`,
      animation: 'info-slide-in .2s ease-out forwards'
    }}>

      {/* Color bar */}
      <div style={{ height: 3, background: `linear-gradient(to right, ${spell.color}, ${spell.glow})` }} />

      <div style={{ padding: '12px 14px', display: 'flex', gap: 12 }}>
        {/* Art */}
        <div style={{
          width: 68, height: 86, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
          border: `1px solid ${spell.color}55`,
          background: spell.img ? 'transparent' : `linear-gradient(160deg, #1a1a2e, #0f3460)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {spell.img
            ? <img src={spell.img} alt={spell.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 34 }}>{spell.emoji}</span>
          }
        </div>

        {/* Stats */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{spell.name}</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            <span style={{
              background: tierColor, color: '#000', fontSize: 9,
              fontWeight: 900, borderRadius: 3, padding: '1px 5px'
            }}>{tierLabel}</span>
            <span style={{
              background: spell.ctx === 'battle' ? '#4a0011' : '#003311',
              color: spell.ctx === 'battle' ? '#ff9999' : '#99ff99',
              fontSize: 9, fontWeight: 700, borderRadius: 3, padding: '1px 5px',
              border: `1px solid ${spell.ctx === 'battle' ? '#ff446644' : '#44ff6644'}`
            }}>
              {spell.ctx === 'battle' ? '⚔️ Battle' : '🏠 Home'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[['Cost', `${spell.cost}g`], ['Duration', spell.duration], ['Targeting', modeLabel]]
              .map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 6 }}>
                  <span style={{ fontSize: 10, color: '#666', width: 54 }}>{k}</span>
                  <span style={{ fontSize: 10, color: '#bbb' }}>{v}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Description */}
      <div style={{ padding: '0 14px 10px' }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, color: '#ccc', lineHeight: 1.5 }}>{spell.desc}</p>
        <p style={{ margin: '0 0 8px', fontSize: 10, color: '#666', fontStyle: 'italic', lineHeight: 1.4 }}>{spell.flavor}</p>
        <div style={{
          padding: '6px 8px', background: `${spell.color}18`, borderRadius: 6,
          border: `1px solid ${spell.color}33`, fontSize: 10, color: spell.color,
          lineHeight: 1.4
        }}>{hint}</div>
      </div>

      {/* Cancel */}
      <button onClick={onCancel} style={{
        width: '100%', padding: '7px', background: '#ffffff0a',
        border: 'none', borderTop: '1px solid #ffffff12',
        color: '#666', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
      }}>ESC — Cancel spell</button>
    </div>
  )
}

// ── Individual HUD card ───────────────────────────────────────────────────────
function HUDCard({ spell, selected, onClick }: {
  spell: SpellDef; selected: boolean; onClick: () => void
}) {
  const tierColor = { 1: '#aaa', 2: '#66aaff', 3: '#ffaa22' }[spell.tier]

  return (
    <button onClick={onClick} style={{
      position: 'relative', width: 74, height: 92,
      border: 'none', padding: 0, cursor: 'pointer', background: 'none',
      borderRadius: 9, flexShrink: 0,
      outline: selected ? `2px solid ${spell.color}` : '1px solid #ffffff22',
      outlineOffset: 2,
      transform: selected ? 'translateY(-8px) scale(1.08)' : 'scale(1)',
      transition: 'all .15s ease',
      ['--glow' as any]: spell.glow,
      animation: selected ? 'card-glow 1.4s ease-in-out infinite' : 'none',
    }}>
      {/* Body */}
      <div style={{
        width: '100%', height: '100%', borderRadius: 9, overflow: 'hidden',
        background: spell.img ? 'transparent' : `linear-gradient(160deg,#1a1a2e,#0f3460)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 3
      }}>
        {spell.img
          ? <img src={spell.img} alt={spell.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 9 }} />
          : <>
            <span style={{ fontSize: 28 }}>{spell.emoji}</span>
            <span style={{
              fontSize: 7.5, color: '#ccc', textAlign: 'center',
              padding: '0 4px', lineHeight: 1.2
            }}>{spell.name}</span>
          </>
        }
      </div>

      {/* Tier dot */}
      <div style={{
        position: 'absolute', top: 4, right: 4, width: 14, height: 14,
        borderRadius: '50%', background: tierColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 8, fontWeight: 900, color: '#000'
      }}>
        {spell.tier}
      </div>

      {/* Cost */}
      <div style={{
        position: 'absolute', bottom: 4, left: 0, right: 0, textAlign: 'center',
        background: '#000c', color: spell.color, fontSize: 9, fontWeight: 800,
        padding: '1px 0'
      }}>
        {spell.cost}g
      </div>

      {/* Selected glow overlay */}
      {selected && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 9,
          background: `linear-gradient(135deg, ${spell.color}33, transparent)`,
          pointerEvents: 'none'
        }} />
      )}
    </button>
  )
}

// ── Bottom spell HUD ──────────────────────────────────────────────────────────
function SpellHUD({ spells, selected, onSelect }: {
  spells: SpellDef[]
  selected: SpellDef | null
  onSelect: (s: SpellDef) => void
}) {
  const battle = spells.filter(s => s.ctx === 'battle')
  const home = spells.filter(s => s.ctx === 'home')

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20,
      background: 'linear-gradient(to top, rgba(4,2,10,.97) 60%, transparent)',
      padding: '12px 16px 14px',
      animation: 'hud-slide-in .3s ease-out forwards'
    }}>

      {/* Section labels + cards */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>

        {/* Battle spells */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{
            fontSize: 9, fontWeight: 700, color: '#ff6644', letterSpacing: 1.5,
            textTransform: 'uppercase', paddingLeft: 2
          }}>⚔️ Battle</div>
          <div style={{
            display: 'flex', gap: 6, overflowX: 'auto',
            scrollbarWidth: 'none', paddingBottom: 2
          }}>
            {battle.map(s => (
              <HUDCard key={s.id} spell={s} selected={selected?.id === s.id}
                onClick={() => onSelect(s)} />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, alignSelf: 'stretch', background: '#ffffff18', marginTop: 18 }} />

        {/* Home spells */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{
            fontSize: 9, fontWeight: 700, color: '#66ff88', letterSpacing: 1.5,
            textTransform: 'uppercase', paddingLeft: 2
          }}>🏠 Home</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {home.map(s => (
              <HUDCard key={s.id} spell={s} selected={selected?.id === s.id}
                onClick={() => onSelect(s)} />
            ))}
          </div>
        </div>

        {/* Right: hint */}
        <div style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center',
          paddingTop: 20, paddingRight: 4
        }}>
          {selected
            ? <div style={{ fontSize: 11, color: '#666', textAlign: 'right', lineHeight: 1.6 }}>
              Orbit disabled while targeting<br />
              <span style={{ color: '#444' }}>ESC to cancel · click map to cast</span>
            </div>
            : <div style={{ fontSize: 11, color: '#444', textAlign: 'right', lineHeight: 1.6 }}>
              Select a spell to begin<br />
              <span style={{ color: '#333' }}>Orbit & zoom freely</span>
            </div>
          }
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SpellsPage() {
  const [selected, setSelected] = useState<SpellDef | null>(null)
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null)
  const [effects, setEffects] = useState<ActiveEffect[]>([])
  const { toasts: txToasts, fire: fireTxToast } = useTxToast()

  // ESC to cancel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const spawn = useCallback((x: number, y: number) => {
    if (!selected) return
    const key = Math.random().toString(36).slice(2)
    const seed = Math.floor(Math.random() * 999999)
    const r = (selected.aoeRadius ?? 0) * PX_PER_UNIT
    const eff: ActiveEffect = { key, spellId: selected.id, x, y, r, color: selected.color, seed }
    setEffects(prev => [...prev, eff])
    setTimeout(() => setEffects(prev => prev.filter(e => e.key !== eff.key)), 3600)
  }, [selected])

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    setMouse({ x: e.clientX, y: e.clientY })
  }

  const handleCast = (e: MouseEvent<HTMLDivElement>) => {
    if (!selected) return
    spawn(e.clientX, e.clientY)
    fireTxToast()
  }

  const handleSelect = (spell: SpellDef) => {
    setSelected(prev => prev?.id === spell.id ? null : spell)
    setEffects([])
  }

  const overlayActive = selected !== null

  return (
    <>
      <style>{STYLES + TX_TOAST_STYLES}</style>

      <TxToastContainer toasts={txToasts} />

      <div style={{ position: 'relative', width: '100%', height: '100%' }}>

        {/* Layer 1 — Real 3D map */}
        <FinalMapCanvas items={MAP_ITEMS} cfg={MAP_CFG} hideHUD />

        {/* Layer 2 — Transparent spell interaction overlay
            pointer-events: all when spell active (blocks OrbitControls)
            pointer-events: none when idle (OrbitControls works normally) */}
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 10,
            pointerEvents: overlayActive ? 'all' : 'none',
            cursor: !selected ? 'default'
              : selected.targetMode === 'auto' ? 'pointer' : 'crosshair',
          }}
          onMouseMove={handleMove}
          onMouseLeave={() => setMouse(null)}
          onClick={handleCast}
        >
          {/* Reticle */}
          {selected && mouse && selected.targetMode !== 'auto' && (
            <Reticle spell={selected} x={mouse.x} y={mouse.y} />
          )}

          {/* Cast effects */}
          {effects.map(e => <CastEffect key={e.key} e={e} />)}

          {/* Auto-spell "click anywhere" hint */}
          {selected?.targetMode === 'auto' && (
            <div style={{
              position: 'fixed', top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
              pointerEvents: 'none', textAlign: 'center'
            }}>
              <div style={{
                fontSize: 14, color: `${selected.color}cc`,
                fontWeight: 700, textShadow: `0 0 12px ${selected.color}`,
                animation: 'reticle-pulse 1.2s ease-in-out infinite'
              }}>
                Click anywhere to cast {selected.name}
              </div>
            </div>
          )}
        </div>

        {/* Layer 3 — Spell info panel */}
        {selected && (
          <SpellInfoPanel spell={selected} onCancel={() => setSelected(null)} />
        )}

        {/* Layer 4 — Bottom HUD */}
        <SpellHUD spells={SPELLS} selected={selected} onSelect={handleSelect} />
      </div>
    </>
  )
}
