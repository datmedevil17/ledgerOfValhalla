export type TroopId = 'warrior' | 'monk' | 'rogue' | 'ranger' | 'cleric' | 'wizard' | 'dragon' | 'bat' | 'ghost'

export interface TroopAnimMap {
  idle:   string
  run:    string
  attack: string
  hit:    string
  death:  string
}

export interface TroopDef {
  id:             TroopId
  name:           string
  emoji:          string
  path:           string
  maxHp:          number
  speed:          number
  attackRange:    number
  minRange?:      number   // ranged units back away when closer than this
  attackDamage:   number
  attackCooldown: number
  renderScale:    number
  projColor?:     string   // undefined = melee (no projectile)
  isFlying?:      boolean  // flies over walls and buildings
  anim:           TroopAnimMap
  splashRadius?:  number
  healRadius?:    number
  healAmount?:    number
}

export const TROOP_DEFS: Record<TroopId, TroopDef> = {
  warrior: {
    id: 'warrior', name: 'Warrior', emoji: '⚔️',
    path: '/glTF/Warrior.gltf',
    maxHp: 300, speed: 3.5, attackRange: 2.5, attackDamage: 45, attackCooldown: 1.2,
    renderScale: 0.7,
    anim: { idle: 'Idle', run: 'Run', attack: 'Sword_Attack', hit: 'RecieveHit', death: 'Death' },
  },
  monk: {
    id: 'monk', name: 'Monk', emoji: '🥋',
    path: '/glTF/Monk.gltf',
    maxHp: 200, speed: 5.5, attackRange: 2.0, attackDamage: 30, attackCooldown: 0.7,
    renderScale: 0.7,
    anim: { idle: 'Idle', run: 'Run', attack: 'Attack', hit: 'RecieveHit', death: 'Death' },
  },
  rogue: {
    id: 'rogue', name: 'Rogue', emoji: '🗡️',
    path: '/glTF/Rogue.gltf',
    maxHp: 150, speed: 7.0, attackRange: 2.0, attackDamage: 55, attackCooldown: 1.0,
    renderScale: 0.7,
    anim: { idle: 'Idle', run: 'Run', attack: 'Dagger_Attack', hit: 'RecieveHit', death: 'Death' },
  },
  ranger: {
    id: 'ranger', name: 'Ranger', emoji: '🏹',
    path: '/glTF/Ranger.gltf',
    maxHp: 180, speed: 4.0, attackRange: 9.0, minRange: 5.0, attackDamage: 35, attackCooldown: 1.5,
    renderScale: 0.7, projColor: '#ff8844',
    anim: { idle: 'Idle', run: 'Run', attack: 'Bow_Shoot', hit: 'RecieveHit', death: 'Death' },
  },
  cleric: {
    id: 'cleric', name: 'Cleric', emoji: '✨',
    path: '/glTF/Cleric.gltf',
    maxHp: 220, speed: 4.0, attackRange: 6.0, minRange: 3.5, attackDamage: 25, attackCooldown: 1.8,
    renderScale: 0.7, projColor: '#ffcc44',
    anim: { idle: 'Idle', run: 'Run', attack: 'Staff_Attack', hit: 'RecieveHit', death: 'Death' },
    healRadius: 6, healAmount: 15,
  },
  wizard: {
    id: 'wizard', name: 'Wizard', emoji: '🔮',
    path: '/glTF/Wizard.gltf',
    maxHp: 140, speed: 3.5, attackRange: 11.0, minRange: 7.0, attackDamage: 70, attackCooldown: 1.5,
    renderScale: 0.7, projColor: '#cc44ff',
    anim: { idle: 'Idle', run: 'Run', attack: 'Spell1', hit: 'RecieveHit', death: 'Death' },
    splashRadius: 3,
  },
  dragon: {
    id: 'dragon', name: 'Dragon', emoji: '🐉',
    path: '/Dragon_Evolved.gltf',
    maxHp: 420, speed: 4.5, attackRange: 9.0, minRange: 5.0, attackDamage: 80, attackCooldown: 2.0,
    renderScale: 0.6, projColor: '#ff4400', isFlying: true,
    anim: { idle: 'Flying_Idle', run: 'Fast_Flying', attack: 'Punch', hit: 'HitReact', death: 'Death' },
    splashRadius: 2.5,
  },
  bat: {
    id: 'bat', name: 'Bat', emoji: '🦇',
    path: '/Bat.glb',
    maxHp: 75, speed: 9.0, attackRange: 5.0, minRange: 2.5, attackDamage: 20, attackCooldown: 0.55,
    renderScale: 0.38, projColor: '#9933ff', isFlying: true,
    anim: { idle: 'Bat_Flying', run: 'Bat_Flying', attack: 'Bat_Attack', hit: 'Bat_Hit', death: 'Bat_Death' },
  },
  ghost: {
    id: 'ghost', name: 'Ghost', emoji: '💀',
    path: '/Ghost_Skull.gltf',
    maxHp: 190, speed: 6.0, attackRange: 8.5, minRange: 4.5, attackDamage: 48, attackCooldown: 1.6,
    renderScale: 0.6, projColor: '#110022', isFlying: true,
    anim: { idle: 'Flying_Idle', run: 'Fast_Flying', attack: 'Punch', hit: 'HitReact', death: 'Death' },
  },
}

export const TROOP_IDS: TroopId[] = ['warrior', 'monk', 'rogue', 'ranger', 'cleric', 'wizard', 'dragon', 'bat', 'ghost']
export const TROOP_START_COUNT = 50
export const BAT_SWARM_SIZE = 4   // bats spawned per click
