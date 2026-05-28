use anchor_lang::prelude::*;
use crate::{constants::*, state::*};

pub fn initialize_player(ctx: Context<InitializePlayer>) -> Result<()> {
    let profile = &mut ctx.accounts.profile;
    profile.owner = ctx.accounts.player.key();
    profile.level = 1;
    profile.xp = 0;
    profile.builder_count = builders_for_level(1);
    profile.tc_level = 1;
    profile.barracks_level = 0;
    profile.market_level = 0;
    profile.pop_cap = 0;
    profile.pop_used = 0;
    profile.map_delegated = false;
    profile.bump = ctx.bumps.profile;
    profile._padding = [0u8; 201];

    let map = &mut ctx.accounts.map;
    map.owner = ctx.accounts.player.key();
    map.slot_type = [0u8; 50];
    map.slot_level = [0u8; 50];
    map.slot_row = [0u8; 50];
    map.slot_col = [0u8; 50];
    map.in_build_mode = false;
    map.bump = ctx.bumps.map;
    map._padding = [0u8; 228];

    // Place Town Center (catalog_id=0) at slot 0, position (5,5), level 1
    map.slot_type[0] = CAT_TOWN_CENTER;
    map.slot_level[0] = 1;
    map.slot_row[0] = 5;
    map.slot_col[0] = 5;

    let storage = &mut ctx.accounts.storage;
    storage.owner = ctx.accounts.player.key();
    storage.level = 1;
    storage.gold_balance = STARTING_GOLD;
    storage.food_balance = STARTING_FOOD;
    storage.bump = ctx.bumps.storage;
    storage._padding = [0u8; 13];

    let vault = &mut ctx.accounts.vault;
    vault.owner = ctx.accounts.player.key();
    vault.gold_pending = 0;
    vault.food_pending = 0;
    vault.bump = ctx.bumps.vault;
    vault._padding = [0u8; 15];

    let barracks = &mut ctx.accounts.barracks;
    barracks.owner = ctx.accounts.player.key();
    barracks.level = 0;
    barracks.counts = [0u16; 9];
    barracks.battle_counts = [0u16; 9];
    barracks.consumed_auths = Vec::new();
    barracks.bump = ctx.bumps.barracks;

    let upgrades = &mut ctx.accounts.upgrades;
    upgrades.owner = ctx.accounts.player.key();
    upgrades.upgraded = [false; 9];
    upgrades.bump = ctx.bumps.upgrades;
    upgrades._padding = [0u8; 22];

    let spells = &mut ctx.accounts.spells;
    spells.owner = ctx.accounts.player.key();
    spells.counts = [0u8; 30];
    spells.slotted = [255u8; 5]; // 255 = empty
    spells.bump = ctx.bumps.spells;
    spells._padding = [0u8; 4];

    // Initialize builders (index 0 and 1 for level-1 players)
    let b0 = &mut ctx.accounts.builder0;
    b0.owner = ctx.accounts.player.key();
    b0.index = 0;
    b0.busy = false;
    b0.catalog_id = 0;
    b0.slot_index = 0;
    b0.new_level = 0;
    b0.finish_ts = 0;
    b0.bump = ctx.bumps.builder0;
    b0._padding = [0u8; 61];

    let b1 = &mut ctx.accounts.builder1;
    b1.owner = ctx.accounts.player.key();
    b1.index = 1;
    b1.busy = false;
    b1.catalog_id = 0;
    b1.slot_index = 0;
    b1.new_level = 0;
    b1.finish_ts = 0;
    b1.bump = ctx.bumps.builder1;
    b1._padding = [0u8; 61];

    Ok(())
}

// Box the large accounts (PlayerMap = 512B, TroopBarracks = 640B) to keep the
// stack frame under the 4096-byte BPF limit.
#[derive(Accounts)]
pub struct InitializePlayer<'info> {
    #[account(mut)]
    pub player: Signer<'info>,

    #[account(
        init,
        payer = player,
        space = PROFILE_SPACE,
        seeds = [PROFILE_SEED, player.key().as_ref()],
        bump
    )]
    pub profile: Box<Account<'info, PlayerProfile>>,

    #[account(
        init,
        payer = player,
        space = MAP_SPACE,
        seeds = [MAP_SEED, player.key().as_ref()],
        bump
    )]
    pub map: Box<Account<'info, PlayerMap>>,

    #[account(
        init,
        payer = player,
        space = STORAGE_SPACE,
        seeds = [STORAGE_SEED, player.key().as_ref()],
        bump
    )]
    pub storage: Box<Account<'info, StorageState>>,

    #[account(
        init,
        payer = player,
        space = VAULT_SPACE,
        seeds = [VAULT_SEED, player.key().as_ref()],
        bump
    )]
    pub vault: Box<Account<'info, LootVault>>,

    #[account(
        init,
        payer = player,
        space = BARRACKS_SPACE,
        seeds = [BARRACKS_SEED, player.key().as_ref()],
        bump
    )]
    pub barracks: Box<Account<'info, TroopBarracks>>,

    #[account(
        init,
        payer = player,
        space = UPGRADES_SPACE,
        seeds = [UPGRADES_SEED, player.key().as_ref()],
        bump
    )]
    pub upgrades: Box<Account<'info, TroopUpgrades>>,

    #[account(
        init,
        payer = player,
        space = SPELLS_SPACE,
        seeds = [SPELLS_SEED, player.key().as_ref()],
        bump
    )]
    pub spells: Box<Account<'info, SpellHand>>,

    #[account(
        init,
        payer = player,
        space = BUILDER_SPACE,
        seeds = [BUILDER_SEED, player.key().as_ref(), &[0u8]],
        bump
    )]
    pub builder0: Box<Account<'info, BuilderState>>,

    #[account(
        init,
        payer = player,
        space = BUILDER_SPACE,
        seeds = [BUILDER_SEED, player.key().as_ref(), &[1u8]],
        bump
    )]
    pub builder1: Box<Account<'info, BuilderState>>,

    pub system_program: Program<'info, System>,
}
