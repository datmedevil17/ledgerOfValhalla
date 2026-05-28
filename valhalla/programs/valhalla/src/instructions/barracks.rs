use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::{delegate, commit};
use ephemeral_rollups_sdk::cpi::DelegateConfig;
use ephemeral_rollups_sdk::ephem::commit_and_undelegate_accounts;
use crate::{constants::*, error::ClashError, state::*};

// ── authorize_training (mainnet) ──────────────────────────────────────────────
// Burns gold+food from storage; creates TrainingAuth PDA for private ER consumption.
pub fn authorize_training(
    ctx: Context<AuthorizeTraining>,
    troop_type: u8,
    quantity: u16,
    nonce: u64,
    expires_in: i64, // seconds from now
) -> Result<()> {
    let tt = troop_type as usize;
    require!(tt < 9, ClashError::InvalidTroopType);

    let barracks_level = ctx.accounts.profile.barracks_level;
    require!(barracks_level >= TROOP_BARRACKS_GATE[tt], ClashError::BarracksLevelTooLow);

    let gold_per = TROOP_GOLD[tt];
    let food_per = TROOP_FOOD[tt];
    let gold_cost = gold_per
        .checked_mul(quantity as u64)
        .ok_or(ClashError::Overflow)?;
    let food_cost = food_per
        .checked_mul(quantity as u64)
        .ok_or(ClashError::Overflow)?;

    let storage = &mut ctx.accounts.storage;
    require!(storage.gold_balance >= gold_cost, ClashError::InsufficientGold);
    require!(storage.food_balance >= food_cost, ClashError::InsufficientFood);
    storage.gold_balance = storage.gold_balance
        .checked_sub(gold_cost)
        .ok_or(ClashError::Underflow)?;
    storage.food_balance = storage.food_balance
        .checked_sub(food_cost)
        .ok_or(ClashError::Underflow)?;

    let now = Clock::get()?.unix_timestamp;
    let auth = &mut ctx.accounts.auth;
    auth.player     = ctx.accounts.player.key();
    auth.nonce      = nonce;
    auth.gold_cost  = gold_cost;
    auth.food_cost  = food_cost;
    auth.troop_type = troop_type;
    auth.quantity   = quantity;
    auth.expires_ts = now + expires_in;
    auth.bump       = ctx.bumps.auth;
    auth._padding   = [0u8; 28];

    Ok(())
}

#[derive(Accounts)]
#[instruction(troop_type: u8, quantity: u16, nonce: u64)]
pub struct AuthorizeTraining<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(seeds = [PROFILE_SEED, player.key().as_ref()], bump = profile.bump)]
    pub profile: Account<'info, PlayerProfile>,
    #[account(mut, seeds = [STORAGE_SEED, player.key().as_ref()], bump = storage.bump)]
    pub storage: Account<'info, StorageState>,
    #[account(
        init,
        payer = player,
        space = TRAIN_AUTH_SPACE,
        seeds = [TRAIN_AUTH_SEED, player.key().as_ref(), &nonce.to_le_bytes()],
        bump
    )]
    pub auth: Account<'info, TrainingAuth>,
    pub system_program: Program<'info, System>,
}

// ── delegate_barracks (mainnet → private ER) ──────────────────────────────────
// Delegates the barracks to the ephemeral rollup. For private ER access control,
// the permission program CPI should be called here using the SDK's access-control
// feature (CreatePermissionCpiBuilder). Wired when the exact SDK path is confirmed.
pub fn delegate_barracks(ctx: Context<DelegateBarracks>) -> Result<()> {
    ctx.accounts.delegate_barracks(
        &ctx.accounts.player,
        &[BARRACKS_SEED, ctx.accounts.player.key().as_ref()],
        DelegateConfig::default(),
    )?;
    Ok(())
}

#[delegate]
#[derive(Accounts)]
pub struct DelegateBarracks<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    /// CHECK: delegated via sdk
    #[account(mut, del)]
    pub barracks: UncheckedAccount<'info>,
    pub owner_program: Program<'info, crate::program::Valhalla>,
    pub delegation_program: Program<'info, ephemeral_rollups_sdk::anchor::DelegationProgram>,
    pub system_program: Program<'info, System>,
}

// ── train_troops (private ER) ─────────────────────────────────────────────────
// Reads TrainingAuth (mainnet read-only), adds troops, marks nonce consumed.
pub fn train_troops(ctx: Context<TrainTroops>) -> Result<()> {
    let auth = &ctx.accounts.auth;
    let now = Clock::get()?.unix_timestamp;
    require!(now <= auth.expires_ts, ClashError::AuthExpired);

    let barracks = &mut ctx.accounts.barracks;
    require!(
        !barracks.consumed_auths.contains(&auth.nonce),
        ClashError::AuthAlreadyConsumed
    );

    let tt = auth.troop_type as usize;
    barracks.counts[tt] = barracks.counts[tt]
        .checked_add(auth.quantity)
        .ok_or(ClashError::Overflow)?;

    barracks.consumed_auths.push(auth.nonce);

    Ok(())
}

#[derive(Accounts)]
pub struct TrainTroops<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut, seeds = [BARRACKS_SEED, player.key().as_ref()], bump = barracks.bump)]
    pub barracks: Account<'info, TroopBarracks>,
    /// Mainnet account; read-only on ER
    #[account(
        constraint = auth.player == player.key() @ ClashError::UnauthorizedEr
    )]
    pub auth: Account<'info, TrainingAuth>,
}

// ── mark_for_battle (private ER) ──────────────────────────────────────────────
// Reserves a subset of troops for the upcoming battle.
pub fn mark_for_battle(
    ctx: Context<MarkForBattle>,
    battle_counts: [u16; 9],
) -> Result<()> {
    let barracks = &mut ctx.accounts.barracks;
    for i in 0..9usize {
        require!(
            battle_counts[i] <= barracks.counts[i],
            ClashError::InsufficientTroops
        );
    }
    barracks.battle_counts = battle_counts;
    Ok(())
}

#[derive(Accounts)]
pub struct MarkForBattle<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut, seeds = [BARRACKS_SEED, player.key().as_ref()], bump = barracks.bump)]
    pub barracks: Account<'info, TroopBarracks>,
}

// ── commit_barracks (ER → mainnet commit) ────────────────────────────────────
pub fn commit_barracks(ctx: Context<CommitBarracks>) -> Result<()> {
    let barracks_ai = ctx.accounts.barracks.to_account_info();
    commit_and_undelegate_accounts(
        &ctx.accounts.player.to_account_info(),
        vec![&barracks_ai],
        &ctx.accounts.magic_context,
        &ctx.accounts.magic_program.to_account_info(),
        None,
    )?;
    Ok(())
}

#[commit]
#[derive(Accounts)]
pub struct CommitBarracks<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    /// CHECK: committed via sdk
    #[account(mut)]
    pub barracks: UncheckedAccount<'info>,
}

// ── undelegate_barracks (mainnet) ─────────────────────────────────────────────
// Called after commit; clears consumed_auths.
pub fn undelegate_barracks(ctx: Context<UndelegateBarracks>) -> Result<()> {
    ctx.accounts.barracks.consumed_auths.clear();
    Ok(())
}

#[derive(Accounts)]
pub struct UndelegateBarracks<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut, seeds = [BARRACKS_SEED, player.key().as_ref()], bump = barracks.bump)]
    pub barracks: Account<'info, TroopBarracks>,
}

// ── deduct_deployed (mainnet) ──────────────────────────────────────────────────
// After battle settles, subtract battle_counts from total counts.
pub fn deduct_deployed(ctx: Context<DeductDeployed>) -> Result<()> {
    let barracks = &mut ctx.accounts.barracks;
    for i in 0..9usize {
        barracks.counts[i] = barracks.counts[i]
            .saturating_sub(barracks.battle_counts[i]);
    }
    barracks.battle_counts = [0u16; 9];
    Ok(())
}

#[derive(Accounts)]
pub struct DeductDeployed<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut, seeds = [BARRACKS_SEED, player.key().as_ref()], bump = barracks.bump)]
    pub barracks: Account<'info, TroopBarracks>,
}

// ── close_training_auth (mainnet) ─────────────────────────────────────────────
pub fn close_training_auth(_ctx: Context<CloseTrainingAuth>) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct CloseTrainingAuth<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        mut,
        close = player,
        constraint = auth.player == player.key() @ ClashError::UnauthorizedEr
    )]
    pub auth: Account<'info, TrainingAuth>,
}
