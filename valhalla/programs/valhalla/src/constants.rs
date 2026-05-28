use anchor_lang::prelude::*;

// ── PDA Seeds ─────────────────────────────────────────────────────────────────
pub const PROFILE_SEED:    &[u8] = b"profile";
pub const MAP_SEED:        &[u8] = b"map";
pub const BUILDER_SEED:    &[u8] = b"builder";
pub const MINE_SEED:       &[u8] = b"mines";
pub const FARM_SEED:       &[u8] = b"farm";
pub const STORAGE_SEED:    &[u8] = b"storage";
pub const VAULT_SEED:      &[u8] = b"vault";
pub const BARRACKS_SEED:   &[u8] = b"barracks";
pub const UPGRADES_SEED:   &[u8] = b"upgrades";
pub const SPELLS_SEED:     &[u8] = b"spells";
pub const BATTLE_SEED:     &[u8] = b"battle";
pub const TRAIN_AUTH_SEED: &[u8] = b"train_auth";

// ── Catalog IDs — must match frontend config.ts CATALOG indices ───────────────
pub const CATALOG_TOWN_CENTER:  u16 = 0;
pub const CATALOG_HOUSE_1:      u16 = 1;
pub const CATALOG_HOUSE_2:      u16 = 2;
pub const CATALOG_HOUSE_3:      u16 = 3;
pub const CATALOG_FARM:         u16 = 4;
pub const CATALOG_STORAGE:      u16 = 5;
pub const CATALOG_MINE:         u16 = 6;
pub const CATALOG_MARKET:       u16 = 7;
pub const CATALOG_WINDMILL:     u16 = 8;
pub const CATALOG_BARRACKS:     u16 = 9;
pub const CATALOG_ARCHERY:      u16 = 10;
pub const CATALOG_TEMPLE:       u16 = 11;
pub const CATALOG_PORT:         u16 = 12;
pub const CATALOG_WONDER:       u16 = 13;
pub const CATALOG_WALL:         u16 = 14;
pub const CATALOG_WALL_TOWER:   u16 = 15;
pub const CATALOG_WATCH_TOWER:  u16 = 16;
pub const CATALOG_TOWER_HOUSE:  u16 = 17;
pub const CATALOG_DOCK:         u16 = 18;
pub const CATALOG_COUNT:        usize = 19;

// ── Grid ──────────────────────────────────────────────────────────────────────
pub const GRID_W: u8 = 90;
pub const GRID_H: u8 = 72;
pub const MAX_BUILDINGS: usize = 60;

// ── Mine (micro-gold per second; 1 gold = 1_000_000 units) ───────────────────
// 150/hr → 150_000_000 / 3600 = 41_666 units/sec
pub const MINE_RATE: [u64; 3] = [41_666, 97_222, 166_666];
pub const MINE_CAP:  [u64; 3] = [1_500_000_000, 3_000_000_000, 6_000_000_000];

// ── Farm (micro-food per second) ──────────────────────────────────────────────
// 200/hr → 200_000_000 / 3600 = 55_555 units/sec
pub const FARM_RATE: [u64; 3] = [55_555, 111_111, 194_444];
pub const FARM_CAP:  [u64; 3] = [1_000_000_000, 2_500_000_000, 5_000_000_000];

// ── Port (micro-gold per second) ──────────────────────────────────────────────
pub const PORT_RATE: [u64; 3] = [27_777, 69_444, 138_888];

// ── Storage gold capacity ─────────────────────────────────────────────────────
pub const STORAGE_CAP: [u64; 3] = [10_000_000_000, 30_000_000_000, 75_000_000_000];

// ── House population capacity per house ───────────────────────────────────────
pub const HOUSE_POP: [u16; 3] = [10, 15, 20];

// ── Building upgrade costs [Lvl1→2, Lvl2→3] ──────────────────────────────────
pub const TC_UPGRADE_COST:        [u64; 2] = [5_000_000_000,  15_000_000_000];
pub const HOUSE_UPGRADE_COST:     [u64; 2] = [800_000_000,    2_500_000_000];
pub const FARM_UPGRADE_COST:      [u64; 2] = [600_000_000,    1_800_000_000];
pub const STORAGE_UPGRADE_COST:   [u64; 2] = [1_200_000_000,  4_000_000_000];
pub const MINE_UPGRADE_COST:      [u64; 2] = [900_000_000,    2_800_000_000];
pub const MARKET_UPGRADE_COST:    [u64; 2] = [1_500_000_000,  5_000_000_000];
pub const BARRACKS_UPGRADE_COST:  [u64; 2] = [2_000_000_000,  7_000_000_000];
pub const ARCHERY_UPGRADE_COST:   [u64; 2] = [3_000_000_000,  9_000_000_000];
pub const TEMPLE_UPGRADE_COST:    [u64; 2] = [3_500_000_000,  10_000_000_000];
pub const PORT_UPGRADE_COST:      [u64; 2] = [2_500_000_000,  8_000_000_000];
pub const WONDER_UPGRADE_COST:    [u64; 1] = [50_000_000_000];
pub const WATCHTOWER_UPGRADE_COST:[u64; 2] = [1_500_000_000,  4_500_000_000];
pub const WALLTOWER_UPGRADE_COST: [u64; 2] = [1_200_000_000,  3_500_000_000];
pub const TOWERHOUSE_UPGRADE_COST:[u64; 2] = [2_200_000_000,  7_000_000_000];

// ── Build/upgrade times in seconds ────────────────────────────────────────────
pub const TC_BUILD_TIME:          [i64; 2] = [7_200,  28_800];
pub const HOUSE_BUILD_TIME:       [i64; 2] = [1_800,  7_200];
pub const FARM_BUILD_TIME:        [i64; 2] = [1_200,  5_400];
pub const STORAGE_BUILD_TIME:     [i64; 2] = [2_700,  10_800];
pub const MINE_BUILD_TIME:        [i64; 2] = [2_400,  7_200];
pub const MARKET_BUILD_TIME:      [i64; 2] = [3_600,  14_400];
pub const BARRACKS_BUILD_TIME:    [i64; 2] = [5_400,  18_000];
pub const ARCHERY_BUILD_TIME:     [i64; 2] = [9_000,  21_600];
pub const TEMPLE_BUILD_TIME:      [i64; 2] = [7_200,  21_600];
pub const PORT_BUILD_TIME:        [i64; 2] = [5_400,  18_000];
pub const WONDER_BUILD_TIME:      [i64; 1] = [86_400];
pub const WATCHTOWER_BUILD_TIME:  [i64; 2] = [3_600,  9_000];
pub const WALLTOWER_BUILD_TIME:   [i64; 2] = [1_800,  5_400];
pub const TOWERHOUSE_BUILD_TIME:  [i64; 2] = [7_200,  21_600];

// ── Shop one-time building purchases ──────────────────────────────────────────
pub const SHOP_WINDMILL:      u64 = 1_500_000_000;
pub const SHOP_2ND_BARRACKS:  u64 = 3_000_000_000;
pub const SHOP_2ND_STORAGE:   u64 = 2_000_000_000;
pub const SHOP_PORT:          u64 = 4_000_000_000;
pub const SHOP_TEMPLE:        u64 = 3_500_000_000;
pub const SHOP_WONDER:        u64 = 20_000_000_000;
pub const SHOP_WALL_PACK:     u64 = 500_000_000;   // 20 wall segments
pub const SHOP_ARCHERY:       u64 = 1_800_000_000;

// ── Minimum TC level required to place each catalog_id ────────────────────────
pub const TC_GATE: [u8; CATALOG_COUNT] = [
    1, // 0  TownCenter
    1, // 1  House1
    1, // 2  House2
    1, // 3  House3
    1, // 4  Farm
    1, // 5  Storage
    1, // 6  Mine
    2, // 7  Market
    1, // 8  Windmill
    1, // 9  Barracks
    2, // 10 Archery
    2, // 11 Temple
    2, // 12 Port
    3, // 13 Wonder
    1, // 14 Wall
    1, // 15 WallTower
    1, // 16 WatchTower
    3, // 17 TowerHouse
    2, // 18 Dock
];

// ── Catalog IDs that require a shop purchase before placement ─────────────────
// true = must call buy_building first
pub const REQUIRES_SHOP_PURCHASE: [bool; CATALOG_COUNT] = [
    false, // 0  TownCenter     — starter
    false, // 1  House1         — starter
    false, // 2  House2         — starter
    false, // 3  House3         — starter
    false, // 4  Farm           — starter
    false, // 5  Storage        — 1st is starter; 2nd requires SHOP_2ND_STORAGE
    false, // 6  Mine           — starter
    false, // 7  Market         — starter
    true,  // 8  Windmill
    false, // 9  Barracks       — 1st is starter; 2nd requires SHOP_2ND_BARRACKS
    true,  // 10 Archery
    true,  // 11 Temple
    true,  // 12 Port
    true,  // 13 Wonder
    false, // 14 Wall           — bought in packs but allowed by default
    false, // 15 WallTower
    false, // 16 WatchTower     — starter
    false, // 17 TowerHouse     — unlocked at TC3, no purchase needed
    false, // 18 Dock
];

// ── Max number of each building type ─────────────────────────────────────────
pub const MAX_COUNT: [u8; CATALOG_COUNT] = [
    1, // 0  TownCenter
    2, // 1  House1
    2, // 2  House2
    2, // 3  House3
    4, // 4  Farm
    2, // 5  Storage
    3, // 6  Mine
    1, // 7  Market
    1, // 8  Windmill
    2, // 9  Barracks
    1, // 10 Archery
    1, // 11 Temple
    1, // 12 Port
    1, // 13 Wonder
   60, // 14 Wall       — up to extra_walls
    8, // 15 WallTower
    3, // 16 WatchTower
    1, // 17 TowerHouse
    1, // 18 Dock
];

// ── Troop costs ───────────────────────────────────────────────────────────────
// Index: 0=Warrior 1=Monk 2=Rogue 3=Ranger 4=Cleric 5=Wizard 6=Dragon 7=Bat 8=Ghost
pub const TROOP_GOLD: [u64; 9] = [
    100_000_000, 80_000_000,  90_000_000, 110_000_000, 120_000_000,
    200_000_000, 400_000_000, 60_000_000, 160_000_000,
];
pub const TROOP_FOOD: [u64; 9] = [
    20_000_000, 15_000_000, 20_000_000, 25_000_000, 30_000_000,
    35_000_000, 50_000_000, 10_000_000, 25_000_000,
];
// Population slots consumed on deploy (Bat = 4 for swarm)
pub const TROOP_POP_SLOTS: [u32; 9] = [1, 1, 1, 1, 1, 1, 1, 4, 1];

// ── Minimum barracks level to unlock each troop ───────────────────────────────
pub const TROOP_BARRACKS_GATE: [u8; 9] = [
    1, // Warrior
    1, // Monk
    2, // Rogue
    2, // Ranger
    3, // Cleric
    3, // Wizard
    3, // Dragon
    1, // Bat
    2, // Ghost
];

// ── Troop upgrade costs [troop_type][Lvl0→1, Lvl1→2] ─────────────────────────
// (single combined upgrade removes vitality/ferocity/swiftness categories)
pub const TROOP_UPGRADE_COST: [[u64; 2]; 9] = [
    [1_500_000_000, 4_000_000_000],   // Warrior
    [1_200_000_000, 3_200_000_000],   // Monk
    [1_200_000_000, 3_200_000_000],   // Rogue
    [1_400_000_000, 3_800_000_000],   // Ranger
    [1_600_000_000, 4_500_000_000],   // Cleric
    [2_500_000_000, 7_000_000_000],   // Wizard
    [5_000_000_000, 15_000_000_000],  // Dragon
    [800_000_000,   2_200_000_000],   // Bat
    [2_000_000_000, 5_500_000_000],   // Ghost
];
pub const TROOP_MAX_UPGRADE_LEVEL: u8 = 2; // 0=base, 1=tier1, 2=tier2

// ── Spell costs (micro-gold) and market tier required ─────────────────────────
// Indexed 0-29 by spell_type; unused slots = 0 cost / tier 0 (invalid)
pub const SPELL_COST: [u64; 30] = [
    300_000_000,   // 0  Fireball         Tier 1
    200_000_000,   // 1  Coin             Tier 1
    600_000_000,   // 2  TrenchcoatMushrooms Tier 3
    400_000_000,   // 3  Monk             Tier 2
    450_000_000,   // 4  Market           Tier 2
    500_000_000,   // 5  Steal            Tier 2
    0,             // 6  unused
    0,             // 7  unused
    600_000_000,   // 8  Lightning Wizard Tier 2
    0, 0, 0, 0,    // 9-12 unused
    800_000_000,   // 13 Sea Monster      Tier 3
    250_000_000,   // 14 Block            Tier 1
    350_000_000,   // 15 Element:Fire     Tier 1
    450_000_000,   // 16 Belltowers       Tier 2
    700_000_000,   // 17 Rebirth          Tier 2
    1_000_000_000, // 18 Water Dragon     Tier 3
    0,             // 19 unused
    0,             // 20 unused
    500_000_000,   // 21 Element:Lightning Tier 2
    400_000_000,   // 22 Element:Air      Tier 2
    400_000_000,   // 23 Element:Water    Tier 2
    700_000_000,   // 24 Element:Dark     Tier 3
    0,             // 25 unused
    550_000_000,   // 26 BloodRing        Tier 2
    0,             // 27 unused
    0,             // 28 unused
    350_000_000,   // 29 Element:Earth    Tier 1
];

pub const SPELL_TIER: [u8; 30] = [
    1, 1, 3, 2, 2, 2, 0, 0, 2, 0,
    0, 0, 0, 3, 1, 1, 2, 2, 3, 0,
    0, 2, 2, 2, 3, 0, 2, 0, 0, 1,
];

// Market level discount on spell purchases (basis 100 = 0%, 90 = 10%, 80 = 20%)
pub const MARKET_DISCOUNT: [u64; 3] = [100, 90, 80];

// ── Loot ──────────────────────────────────────────────────────────────────────
pub const MINE_LOOT_PCT:    u64 = 50;  // % of mine buffer lootable
pub const STORAGE_LOOT_PCT: u64 = 30;  // % of storage balance lootable
// star_mult[stars] / 100 applied to total loot pool
pub const STAR_MULT: [u64; 4] = [0, 30, 60, 100];

// ── Battle ────────────────────────────────────────────────────────────────────
pub const BATTLE_XP: [u64; 4] = [0, 10, 25, 50]; // XP earned per star count

// ── Leveling ──────────────────────────────────────────────────────────────────
// XP needed to reach next level (index = current level - 1)
pub const XP_TO_NEXT_LEVEL: [u64; 20] = [
    100, 250, 500, 1_000, 2_000,
    4_000, 8_000, 16_000, 32_000, 64_000,
    128_000, 256_000, 512_000, 1_024_000, 2_048_000,
    4_096_000, 8_192_000, 16_384_000, 32_768_000, 65_536_000,
];
pub const MAX_LEVEL: u8 = 20;
pub const MAX_BUILDERS: u8 = 6; // level 5+ capped at 6 builders

// ── Account space allocation (8-byte discriminator + fields + padding) ────────
// PlayerProfile: discriminator(8) + owner(32) + level(1) + xp(4) + builder_count(1)
//   + tc_level(1) + barracks_level(1) + market_level(1) + pop_cap(2) + pop_used(2)
//   + map_delegated(1) + bump(1) + _padding(81) = 136 → round to 256
pub const PROFILE_SPACE:    usize = 256;

// PlayerMap: discriminator(8) + owner(32) + slot_type(50) + slot_level(50)
//   + slot_row(50) + slot_col(50) + in_build_mode(1) + bump(1) + _padding(228) = 470 → 512
pub const MAP_SPACE:        usize = 512;

// BuilderState: discriminator(8) + owner(32) + index(1) + busy(1) + catalog_id(1)
//   + slot_index(1) + new_level(1) + finish_ts(8) + bump(1) + _padding(61) = 115 → 128
pub const BUILDER_SPACE:    usize = 128;

// MineState: discriminator(8) + owner(32) + index(1) + level(1)
//   + last_collect_ts(8) + buffer(8) + bump(1) + _padding(13) = 72 → 96
pub const MINE_SPACE:       usize = 96;

// FarmState: same layout as MineState
pub const FARM_SPACE:       usize = 96;

// StorageState: discriminator(8) + owner(32) + level(1) + gold_balance(8)
//   + food_balance(8) + bump(1) + _padding(13) = 71 → 96
pub const STORAGE_SPACE:    usize = 96;

// LootVault: discriminator(8) + owner(32) + gold_pending(8) + food_pending(8)
//   + bump(1) + _padding(15) = 72 → 96
pub const VAULT_SPACE:      usize = 96;

// TroopBarracks: discriminator(8) + owner(32) + level(1) + counts(18) + battle_counts(18)
//   + consumed_auths vec (4 + 64*8=512) + bump(1) = 594 → 640
pub const BARRACKS_SPACE:   usize = 640;

// TroopUpgrades: discriminator(8) + owner(32) + upgraded(9) + bump(1) + _padding(22) = 72 → 96
pub const UPGRADES_SPACE:   usize = 96;

// SpellHand: discriminator(8) + owner(32) + counts(30) + slotted(5) + bump(1) + _padding(4) = 80 → 96
pub const SPELLS_SPACE:     usize = 96;

// BattleSession: discriminator(8) + attacker(32) + defender(32) + start_ts(8) + end_ts(8)
//   + active(1) + stars(1) + mine_buffers(24) + storage_snapshot(8) + gold_looted(8)
//   + food_looted(8) + troop_counts(18) + spell_counts(5) + bump(1) + _padding(93) = 255 → 256
pub const BATTLE_SPACE:     usize = 256;

// TrainingAuth: discriminator(8) + player(32) + nonce(8) + gold_cost(8) + food_cost(8)
//   + troop_type(1) + quantity(2) + expires_ts(8) + bump(1) + _padding(28) = 104 → 128
pub const TRAIN_AUTH_SPACE: usize = 128;

// ── Helpers ───────────────────────────────────────────────────────────────────

/// Returns (gold_cost, build_time_secs) for upgrading catalog_id to new_level.
/// new_level must be 2 or 3.
pub fn upgrade_cost_and_time(catalog_id: u16, new_level: u8) -> Option<(u64, i64)> {
    if new_level < 2 {
        return None;
    }
    let idx = (new_level - 2) as usize;
    match catalog_id {
        CATALOG_TOWN_CENTER  => TC_UPGRADE_COST.get(idx).map(|&c| (c, TC_BUILD_TIME[idx])),
        CATALOG_HOUSE_1 | CATALOG_HOUSE_2 | CATALOG_HOUSE_3
                             => HOUSE_UPGRADE_COST.get(idx).map(|&c| (c, HOUSE_BUILD_TIME[idx])),
        CATALOG_FARM         => FARM_UPGRADE_COST.get(idx).map(|&c| (c, FARM_BUILD_TIME[idx])),
        CATALOG_STORAGE      => STORAGE_UPGRADE_COST.get(idx).map(|&c| (c, STORAGE_BUILD_TIME[idx])),
        CATALOG_MINE         => MINE_UPGRADE_COST.get(idx).map(|&c| (c, MINE_BUILD_TIME[idx])),
        CATALOG_MARKET       => MARKET_UPGRADE_COST.get(idx).map(|&c| (c, MARKET_BUILD_TIME[idx])),
        CATALOG_BARRACKS     => BARRACKS_UPGRADE_COST.get(idx).map(|&c| (c, BARRACKS_BUILD_TIME[idx])),
        CATALOG_ARCHERY      => ARCHERY_UPGRADE_COST.get(idx).map(|&c| (c, ARCHERY_BUILD_TIME[idx])),
        CATALOG_TEMPLE       => TEMPLE_UPGRADE_COST.get(idx).map(|&c| (c, TEMPLE_BUILD_TIME[idx])),
        CATALOG_PORT         => PORT_UPGRADE_COST.get(idx).map(|&c| (c, PORT_BUILD_TIME[idx])),
        CATALOG_WONDER       => WONDER_UPGRADE_COST.get(idx).map(|&c| (c, WONDER_BUILD_TIME[idx])),
        CATALOG_WATCH_TOWER  => WATCHTOWER_UPGRADE_COST.get(idx).map(|&c| (c, WATCHTOWER_BUILD_TIME[idx])),
        CATALOG_WALL_TOWER   => WALLTOWER_UPGRADE_COST.get(idx).map(|&c| (c, WALLTOWER_BUILD_TIME[idx])),
        CATALOG_TOWER_HOUSE  => TOWERHOUSE_UPGRADE_COST.get(idx).map(|&c| (c, TOWERHOUSE_BUILD_TIME[idx])),
        _ => None,
    }
}

/// Returns the shop purchase cost for a building that requires an explicit purchase.
pub fn shop_cost(catalog_id: u16) -> Option<u64> {
    match catalog_id {
        CATALOG_WINDMILL  => Some(SHOP_WINDMILL),
        CATALOG_ARCHERY   => Some(SHOP_ARCHERY),
        CATALOG_TEMPLE    => Some(SHOP_TEMPLE),
        CATALOG_PORT      => Some(SHOP_PORT),
        CATALOG_WONDER    => Some(SHOP_WONDER),
        _ => None,
    }
}

/// Builders available at player level (level 1 → 2 builders, etc., capped at 6).
pub fn builders_for_level(level: u8) -> u8 {
    (level.saturating_add(1)).min(MAX_BUILDERS)
}

// ── u8 catalog aliases (used in account fields, instruction args) ─────────────
pub const CAT_TOWN_CENTER: u8 = CATALOG_TOWN_CENTER as u8;
pub const CAT_HOUSE:       u8 = CATALOG_HOUSE_1 as u8;  // House1; houses share pop logic
pub const CAT_FARM:        u8 = CATALOG_FARM as u8;
pub const CAT_STORAGE:     u8 = CATALOG_STORAGE as u8;
pub const CAT_GOLD_MINE:   u8 = CATALOG_MINE as u8;
pub const CAT_MARKET:      u8 = CATALOG_MARKET as u8;
pub const CAT_BARRACKS:    u8 = CATALOG_BARRACKS as u8;

// ── Starting resources for new players ───────────────────────────────────────
pub const STARTING_GOLD: u64 = 500_000_000;   // 500 gold (micro-units)
pub const STARTING_FOOD: u64 = 250_000_000;   // 250 food

/// Returns (gold_cost, build_time_secs) for upgrading catalog_id (u8) to new_level.
pub fn upgrade_cost_and_time_u8(catalog_id: u8, new_level: u8) -> Option<(u64, i64)> {
    upgrade_cost_and_time(catalog_id as u16, new_level)
}
