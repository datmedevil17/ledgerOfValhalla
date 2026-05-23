export interface DefenseDef {
  attackRange:    number
  attackDamage:   number
  attackCooldown: number
  isRanged:       boolean
  projColor:      string
}

// Keyed by building defId from config.ts
export const DEFENSE_DEFS: Partial<Record<string, DefenseDef>> = {
  'watch-tower': { attackRange: 9,  attackDamage: 22, attackCooldown: 1.4, isRanged: true,  projColor: '#ffee44' },
  'archery':     { attackRange: 11, attackDamage: 18, attackCooldown: 1.2, isRanged: true,  projColor: '#ff8833' },
  'barracks':    { attackRange: 4,  attackDamage: 35, attackCooldown: 2.0, isRanged: false, projColor: '#888888' },
  'wall-tower':  { attackRange: 7,  attackDamage: 20, attackCooldown: 1.5, isRanged: true,  projColor: '#ffdd55' },
  'tower-house': { attackRange: 6,  attackDamage: 28, attackCooldown: 1.8, isRanged: true,  projColor: '#aacc44' },
}

export const TEMPLE_REINFORCE_RADIUS  = 12   // units — attackers trigger reinforcements at this range
export const TEMPLE_REINFORCE_COUNT   = 4
export const TEMPLE_REINFORCE_TYPES   = ['warrior', 'monk', 'warrior', 'monk'] as const
