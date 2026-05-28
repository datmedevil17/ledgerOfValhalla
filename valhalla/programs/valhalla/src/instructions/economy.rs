use anchor_lang::prelude::*;
use crate::{constants::*, error::ClashError, state::*};

// ── collect_mine ──────────────────────────────────────────────────────────────
// Sweeps accumulated gold from a MineState into StorageState.
pub fn collect_mine(ctx: Context<CollectMine>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let mine = &mut ctx.accounts.mine;

    let earned = mine.accrued(now);
    require!(earned > 0, ClashError::NothingToCollect);

    let storage = &mut ctx.accounts.storage;
    let cap = STORAGE_CAP[(storage.level.saturating_sub(1) as usize).min(STORAGE_CAP.len() - 1)];
    let space_left = cap.saturating_sub(storage.gold_balance);
    let deposit = earned.min(space_left);

    storage.gold_balance = storage.gold_balance
        .checked_add(deposit)
        .ok_or(ClashError::Overflow)?;

    mine.buffer = 0;
    mine.last_collect_ts = now;

    Ok(())
}

#[derive(Accounts)]
pub struct CollectMine<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut, seeds = [STORAGE_SEED, player.key().as_ref()], bump = storage.bump)]
    pub storage: Account<'info, StorageState>,
    #[account(
        mut,
        constraint = mine.owner == player.key() @ ClashError::UnauthorizedEr
    )]
    pub mine: Account<'info, MineState>,
}

// ── harvest_food ──────────────────────────────────────────────────────────────
pub fn harvest_food(ctx: Context<HarvestFood>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let farm = &mut ctx.accounts.farm;

    let earned = farm.accrued(now);
    require!(earned > 0, ClashError::NothingToCollect);

    let storage = &mut ctx.accounts.storage;
    let cap = STORAGE_CAP[(storage.level.saturating_sub(1) as usize).min(STORAGE_CAP.len() - 1)];
    let space_left = cap.saturating_sub(storage.food_balance);
    let deposit = earned.min(space_left);

    storage.food_balance = storage.food_balance
        .checked_add(deposit)
        .ok_or(ClashError::Overflow)?;

    farm.buffer = 0;
    farm.last_harvest_ts = now;

    Ok(())
}

#[derive(Accounts)]
pub struct HarvestFood<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut, seeds = [STORAGE_SEED, player.key().as_ref()], bump = storage.bump)]
    pub storage: Account<'info, StorageState>,
    #[account(
        mut,
        constraint = farm.owner == player.key() @ ClashError::UnauthorizedEr
    )]
    pub farm: Account<'info, FarmState>,
}

// ── collect_port ──────────────────────────────────────────────────────────────
// Port produces gold over time at PORT_RATE; uses MineState PDA with a distinct index.
pub fn collect_port(ctx: Context<CollectPort>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let port = &mut ctx.accounts.port;

    let rate = PORT_RATE[(port.level.saturating_sub(1) as usize).min(PORT_RATE.len() - 1)];
    let elapsed = (now - port.last_collect_ts).max(0) as u64;
    let earned = rate.saturating_mul(elapsed).saturating_add(port.buffer);

    require!(earned > 0, ClashError::NothingToCollect);

    let storage = &mut ctx.accounts.storage;
    let cap = STORAGE_CAP[(storage.level.saturating_sub(1) as usize).min(STORAGE_CAP.len() - 1)];
    let space_left = cap.saturating_sub(storage.gold_balance);
    let deposit = earned.min(space_left);

    storage.gold_balance = storage.gold_balance
        .checked_add(deposit)
        .ok_or(ClashError::Overflow)?;

    port.buffer = 0;
    port.last_collect_ts = now;

    Ok(())
}

#[derive(Accounts)]
pub struct CollectPort<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut, seeds = [STORAGE_SEED, player.key().as_ref()], bump = storage.bump)]
    pub storage: Account<'info, StorageState>,
    /// Port is stored as a MineState with a designated index (e.g. index 10)
    #[account(
        mut,
        constraint = port.owner == player.key() @ ClashError::UnauthorizedEr
    )]
    pub port: Account<'info, MineState>,
}

// ── init_mine ─────────────────────────────────────────────────────────────────
// Called when a Gold Mine is placed on the map for the first time.
pub fn init_mine(ctx: Context<InitMine>, index: u8) -> Result<()> {
    let mine = &mut ctx.accounts.mine;
    mine.owner = ctx.accounts.player.key();
    mine.index = index;
    mine.level = 1;
    mine.last_collect_ts = Clock::get()?.unix_timestamp;
    mine.buffer = 0;
    mine.bump = ctx.bumps.mine;
    mine._padding = [0u8; 13];
    Ok(())
}

#[derive(Accounts)]
#[instruction(index: u8)]
pub struct InitMine<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        init,
        payer = player,
        space = MINE_SPACE,
        seeds = [MINE_SEED, player.key().as_ref(), &[index]],
        bump
    )]
    pub mine: Account<'info, MineState>,
    pub system_program: Program<'info, System>,
}

// ── init_farm ─────────────────────────────────────────────────────────────────
pub fn init_farm(ctx: Context<InitFarm>, index: u8) -> Result<()> {
    let farm = &mut ctx.accounts.farm;
    farm.owner = ctx.accounts.player.key();
    farm.index = index;
    farm.level = 1;
    farm.last_harvest_ts = Clock::get()?.unix_timestamp;
    farm.buffer = 0;
    farm.bump = ctx.bumps.farm;
    farm._padding = [0u8; 13];
    Ok(())
}

#[derive(Accounts)]
#[instruction(index: u8)]
pub struct InitFarm<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        init,
        payer = player,
        space = FARM_SPACE,
        seeds = [FARM_SEED, player.key().as_ref(), &[index]],
        bump
    )]
    pub farm: Account<'info, FarmState>,
    pub system_program: Program<'info, System>,
}
