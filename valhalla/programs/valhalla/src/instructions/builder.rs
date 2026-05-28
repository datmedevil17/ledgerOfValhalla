use anchor_lang::prelude::*;
use crate::{constants::*, error::ClashError, state::*};

// ── start_upgrade ─────────────────────────────────────────────────────────────
// Costs gold from storage; assigns a free builder; sets finish_ts.
pub fn start_upgrade(
    ctx: Context<StartUpgrade>,
    slot_index: u8,
    catalog_id: u8,
) -> Result<()> {
    require!(
        !ctx.accounts.profile.map_delegated,
        ClashError::AlreadyDelegated
    );
    require!(!ctx.accounts.builder.busy, ClashError::BuilderBusy);

    let map = &mut ctx.accounts.map;
    let si = slot_index as usize;
    require!(si < 50 && map.slot_type[si] == catalog_id, ClashError::BuildingNotFound);

    let current_level = map.slot_level[si];
    let new_level = current_level
        .checked_add(1)
        .ok_or(ClashError::Overflow)?;

    let (cost, duration) = upgrade_cost_and_time_u8(catalog_id, new_level)
        .ok_or(ClashError::MaxUpgradeLevel)?;

    let tc_level = ctx.accounts.profile.tc_level;
    require!(TC_GATE[catalog_id as usize] <= tc_level, ClashError::TcLevelTooLow);

    let storage = &mut ctx.accounts.storage;
    require!(storage.gold_balance >= cost, ClashError::InsufficientGold);
    storage.gold_balance = storage.gold_balance
        .checked_sub(cost)
        .ok_or(ClashError::Underflow)?;

    let now = Clock::get()?.unix_timestamp;
    let builder = &mut ctx.accounts.builder;
    builder.busy = true;
    builder.catalog_id = catalog_id;
    builder.slot_index = slot_index;
    builder.new_level = new_level;
    builder.finish_ts = now + duration;

    Ok(())
}

#[derive(Accounts)]
#[instruction(slot_index: u8, catalog_id: u8)]
pub struct StartUpgrade<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(seeds = [PROFILE_SEED, player.key().as_ref()], bump = profile.bump)]
    pub profile: Account<'info, PlayerProfile>,
    #[account(mut, seeds = [MAP_SEED, player.key().as_ref()], bump = map.bump)]
    pub map: Account<'info, PlayerMap>,
    #[account(mut, seeds = [STORAGE_SEED, player.key().as_ref()], bump = storage.bump)]
    pub storage: Account<'info, StorageState>,
    /// Builder index provided in instruction via seeds
    #[account(
        mut,
        constraint = !builder.busy @ ClashError::BuilderBusy,
        constraint = builder.owner == player.key() @ ClashError::UnauthorizedEr
    )]
    pub builder: Account<'info, BuilderState>,
}

// ── complete_upgrade ──────────────────────────────────────────────────────────
pub fn complete_upgrade(ctx: Context<CompleteUpgrade>) -> Result<()> {
    let builder = &mut ctx.accounts.builder;
    require!(builder.busy, ClashError::NoUpgradeInProgress);

    let now = Clock::get()?.unix_timestamp;
    require!(now >= builder.finish_ts, ClashError::UpgradeNotReady);

    let si = builder.slot_index as usize;
    let new_level = builder.new_level;
    let catalog_id = builder.catalog_id;

    let map = &mut ctx.accounts.map;
    require!(map.slot_type[si] == catalog_id, ClashError::BuildingNotFound);
    map.slot_level[si] = new_level;

    // Sync mine/farm/storage levels if applicable
    match catalog_id {
        CAT_GOLD_MINE => {
            if let Some(mine) = ctx.accounts.mine.as_mut() {
                mine.level = new_level;
            }
        }
        CAT_FARM => {
            if let Some(farm) = ctx.accounts.farm.as_mut() {
                farm.level = new_level;
            }
        }
        CAT_STORAGE => {
            ctx.accounts.storage.level = new_level;
        }
        CAT_BARRACKS => {
            ctx.accounts.barracks.level = new_level;
            ctx.accounts.profile.barracks_level =
                ctx.accounts.profile.barracks_level.max(new_level);
        }
        _ => {}
    }

    // Recompute TC / market level cached fields
    if catalog_id == CAT_TOWN_CENTER {
        ctx.accounts.profile.tc_level =
            ctx.accounts.profile.tc_level.max(new_level);
    }
    if catalog_id == CAT_MARKET {
        ctx.accounts.profile.market_level =
            ctx.accounts.profile.market_level.max(new_level);
    }

    builder.busy = false;
    builder.catalog_id = 0;
    builder.slot_index = 0;
    builder.new_level = 0;
    builder.finish_ts = 0;

    Ok(())
}

#[derive(Accounts)]
pub struct CompleteUpgrade<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut, seeds = [PROFILE_SEED, player.key().as_ref()], bump = profile.bump)]
    pub profile: Account<'info, PlayerProfile>,
    #[account(mut, seeds = [MAP_SEED, player.key().as_ref()], bump = map.bump)]
    pub map: Account<'info, PlayerMap>,
    #[account(mut, seeds = [STORAGE_SEED, player.key().as_ref()], bump = storage.bump)]
    pub storage: Account<'info, StorageState>,
    #[account(mut, seeds = [BARRACKS_SEED, player.key().as_ref()], bump = barracks.bump)]
    pub barracks: Account<'info, TroopBarracks>,
    #[account(
        mut,
        constraint = builder.owner == player.key() @ ClashError::UnauthorizedEr,
        constraint = builder.busy @ ClashError::NoUpgradeInProgress
    )]
    pub builder: Account<'info, BuilderState>,
    // Optional accounts for building-type sync
    pub mine: Option<Account<'info, MineState>>,
    pub farm: Option<Account<'info, FarmState>>,
}

// ── cancel_upgrade ────────────────────────────────────────────────────────────
// Refunds 50% of the gold cost.
pub fn cancel_upgrade(ctx: Context<CancelUpgrade>) -> Result<()> {
    let builder = &ctx.accounts.builder;
    require!(builder.busy, ClashError::NoUpgradeInProgress);

    let catalog_id = builder.catalog_id;
    let new_level = builder.new_level;

    let refund = if let Some((cost, _)) = upgrade_cost_and_time_u8(catalog_id, new_level) {
        cost / 2
    } else {
        0
    };

    ctx.accounts.storage.gold_balance = ctx.accounts.storage.gold_balance
        .checked_add(refund)
        .ok_or(ClashError::Overflow)?;

    let builder = &mut ctx.accounts.builder;
    builder.busy = false;
    builder.catalog_id = 0;
    builder.slot_index = 0;
    builder.new_level = 0;
    builder.finish_ts = 0;

    Ok(())
}

#[derive(Accounts)]
pub struct CancelUpgrade<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut, seeds = [STORAGE_SEED, player.key().as_ref()], bump = storage.bump)]
    pub storage: Account<'info, StorageState>,
    #[account(
        mut,
        constraint = builder.owner == player.key() @ ClashError::UnauthorizedEr,
        constraint = builder.busy @ ClashError::NoUpgradeInProgress
    )]
    pub builder: Account<'info, BuilderState>,
}
