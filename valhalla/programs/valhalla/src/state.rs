use anchor_lang::prelude::*;
use crate::constants::*;

// ── PlayerProfile ─────────────────────────────────────────────────────────────
// 128 bytes on-chain
#[account]
pub struct PlayerProfile {
    pub owner: Pubkey,      // 32
    pub level: u8,          // 1
    pub xp: u32,            // 4
    pub builder_count: u8,  // 1  — mirrors builders_for_level(level)

    // Cached derived fields (recomputed on save_map / sync_profile)
    pub tc_level: u8,       // 1
    pub barracks_level: u8, // 1
    pub market_level: u8,   // 1

    pub pop_cap: u16,       // 2  — sum of all house slots
    pub pop_used: u16,      // 2  — sum of deployed troop pop costs

    pub map_delegated: bool, // 1
    pub bump: u8,            // 1
    // fields = 47 bytes; PROFILE_SPACE = 256; padding = 256 - 8 - 47 = 201
    pub _padding: [u8; 201],
}

// ── PlayerMap ─────────────────────────────────────────────────────────────────
// 512 bytes on-chain
// Stores a flat 50-slot grid. Each cell = 10 bytes.
// slot_type[i]: catalog_id (0 = empty)
// slot_level[i]: building level (1-based after placement)
// slot_pos[i]: (row, col) packed as u8 each
#[account]
pub struct PlayerMap {
    pub owner: Pubkey,         // 32
    pub slot_type: [u8; 50],   // 50
    pub slot_level: [u8; 50],  // 50
    pub slot_row: [u8; 50],    // 50
    pub slot_col: [u8; 50],    // 50
    pub in_build_mode: bool,   // 1
    pub bump: u8,              // 1
    // 284 bytes used; 228 padding
    pub _padding: [u8; 228],
}

impl PlayerMap {
    pub fn find_slot(&self, catalog_id: u8) -> Option<usize> {
        self.slot_type.iter().position(|&t| t == catalog_id)
    }

    pub fn count_type(&self, catalog_id: u8) -> u8 {
        self.slot_type.iter().filter(|&&t| t == catalog_id).count() as u8
    }

    pub fn empty_slot(&self) -> Option<usize> {
        self.slot_type.iter().position(|&t| t == 0)
    }
}

// ── BuilderState ──────────────────────────────────────────────────────────────
// 107 bytes on-chain; one PDA per builder index (0..MAX_BUILDERS)
#[account]
pub struct BuilderState {
    pub owner: Pubkey,       // 32
    pub index: u8,           // 1
    pub busy: bool,          // 1
    pub catalog_id: u8,      // 1  — which building type being upgraded
    pub slot_index: u8,      // 1  — which map slot
    pub new_level: u8,       // 1  — target level after upgrade
    pub finish_ts: i64,      // 8  — unix timestamp when done
    pub bump: u8,            // 1
    // 46 bytes used; 61 padding
    pub _padding: [u8; 61],
}

// ── MineState ─────────────────────────────────────────────────────────────────
// 64 bytes on-chain; one PDA per mine instance (0..MAX_COUNT[CAT_GOLD_MINE])
#[account]
pub struct MineState {
    pub owner: Pubkey,       // 32
    pub index: u8,           // 1
    pub level: u8,           // 1  — mirrors map slot level
    pub last_collect_ts: i64,// 8
    pub buffer: u64,         // 8  — accumulated gold (micro-units)
    pub bump: u8,            // 1
    // 51 bytes; 13 padding
    pub _padding: [u8; 13],
}

impl MineState {
    pub fn accrued(&self, now: i64) -> u64 {
        let rate = MINE_RATE[self.level.saturating_sub(1) as usize];
        let cap  = MINE_CAP [self.level.saturating_sub(1) as usize];
        let elapsed = (now - self.last_collect_ts).max(0) as u64;
        let accrued = rate.saturating_mul(elapsed);
        self.buffer.saturating_add(accrued).min(cap)
    }
}

// ── FarmState ─────────────────────────────────────────────────────────────────
#[account]
pub struct FarmState {
    pub owner: Pubkey,
    pub index: u8,
    pub level: u8,
    pub last_harvest_ts: i64,
    pub buffer: u64,
    pub bump: u8,
    pub _padding: [u8; 13],
}

impl FarmState {
    pub fn accrued(&self, now: i64) -> u64 {
        let rate = FARM_RATE[self.level.saturating_sub(1) as usize];
        let cap  = FARM_CAP [self.level.saturating_sub(1) as usize];
        let elapsed = (now - self.last_harvest_ts).max(0) as u64;
        let accrued = rate.saturating_mul(elapsed);
        self.buffer.saturating_add(accrued).min(cap)
    }
}

// ── StorageState ──────────────────────────────────────────────────────────────
#[account]
pub struct StorageState {
    pub owner: Pubkey,
    pub level: u8,
    pub gold_balance: u64,  // micro-units
    pub food_balance: u64,
    pub bump: u8,
    pub _padding: [u8; 13],
}

// ── LootVault ─────────────────────────────────────────────────────────────────
// Holds pending loot for attacker until claim_loot is called
#[account]
pub struct LootVault {
    pub owner: Pubkey,
    pub gold_pending: u64,
    pub food_pending: u64,
    pub bump: u8,
    pub _padding: [u8; 15],
}

// ── TroopBarracks ─────────────────────────────────────────────────────────────
// 256 bytes on-chain
// counts[i] = number of trained troops of type i (0..9)
#[account]
pub struct TroopBarracks {
    pub owner: Pubkey,         // 32
    pub level: u8,             // 1  — barracks building level
    pub counts: [u16; 9],      // 18 — trained troops per type
    pub battle_counts: [u16; 9],// 18 — subset committed for battle
    pub consumed_auths: Vec<u64>, // 4+N*8 — nonces used in this ER session
    pub bump: u8,              // 1
}

impl TroopBarracks {
    pub fn space(max_auths: usize) -> usize {
        8 + 32 + 1 + 18 + 18 + (4 + max_auths * 8) + 1
    }
}

// ── TroopUpgrades ─────────────────────────────────────────────────────────────
// upgraded[i] = true if troop type i has been upgraded (single level per type)
#[account]
pub struct TroopUpgrades {
    pub owner: Pubkey,
    pub upgraded: [bool; 9],
    pub bump: u8,
    pub _padding: [u8; 22],
}

// ── SpellHand ─────────────────────────────────────────────────────────────────
// counts[i] = number of spells of type i (0..30)
#[account]
pub struct SpellHand {
    pub owner: Pubkey,
    pub counts: [u8; 30],
    pub slotted: [u8; 5],  // up to 5 active spell slots for battle
    pub bump: u8,
    pub _padding: [u8; 4],
}

// ── BattleSession ─────────────────────────────────────────────────────────────
// Created on mainnet, delegated to public ER for battle execution
#[account]
pub struct BattleSession {
    pub attacker: Pubkey,     // 32
    pub defender: Pubkey,     // 32
    pub start_ts: i64,        // 8
    pub end_ts: i64,          // 8  — 0 until battle ends
    pub active: bool,         // 1
    pub stars: u8,            // 1  — 0-3 awarded

    // Snapshots taken at session init for loot cap
    pub mine_buffers: [u64; 3], // 24  — defender mines at start (capped 3)
    pub storage_snapshot: u64,  // 8   — defender storage.gold_balance at start

    // Running loot total (accumulated on ER via use_spell/end_battle)
    pub gold_looted: u64,     // 8
    pub food_looted: u64,     // 8

    // Troop counts committed to this battle (from TroopBarracks.battle_counts)
    pub troop_counts: [u16; 9], // 18

    // Active spells from SpellHand.slotted
    pub spell_counts: [u8; 5],  // 5

    pub bump: u8,             // 1
    // total ≈ 163; padding to BATTLE_SPACE
    pub _padding: [u8; 93],
}

// ── TrainingAuth ──────────────────────────────────────────────────────────────
// Created on mainnet by authorize_training; read on private ER; closed after undelegation
#[account]
pub struct TrainingAuth {
    pub player: Pubkey,       // 32
    pub nonce: u64,           // 8
    pub gold_cost: u64,       // 8
    pub food_cost: u64,       // 8
    pub troop_type: u8,       // 1
    pub quantity: u16,        // 2
    pub expires_ts: i64,      // 8
    pub bump: u8,             // 1
    // 68 bytes; 28 padding
    pub _padding: [u8; 28],
}
