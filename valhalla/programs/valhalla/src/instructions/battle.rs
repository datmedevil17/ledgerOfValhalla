use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::{delegate};
use ephemeral_rollups_sdk::cpi::DelegateConfig;
use crate::{constants::*, error::ClashError, state::*};

// ── initialize_session (mainnet) ──────────────────────────────────────────────
// Snapshots defender's mine buffers and storage balance for loot cap.
pub fn initialize_session(ctx: Context<InitializeSession>) -> Result<()> {
    require!(
        ctx.accounts.attacker.key() != ctx.accounts.defender_profile.owner,
        ClashError::CannotAttackSelf
    );

    let now = Clock::get()?.unix_timestamp;

    // Snapshot defender mine buffers (up to 3 mines, passed as optional accounts)
    let mine_buffers = [
        ctx.accounts.defender_mine0.as_ref().map_or(0, |m| m.accrued(now)),
        ctx.accounts.defender_mine1.as_ref().map_or(0, |m| m.accrued(now)),
        ctx.accounts.defender_mine2.as_ref().map_or(0, |m| m.accrued(now)),
    ];
    let storage_snapshot = ctx.accounts.defender_storage.gold_balance;

    // Copy attacker's slotted spells
    let spell_counts = ctx.accounts.attacker_spells.slotted;

    // Copy attacker's battle_counts
    let troop_counts = ctx.accounts.attacker_barracks.battle_counts;
    let has_troops = troop_counts.iter().any(|&c| c > 0);
    require!(has_troops, ClashError::InsufficientTroops);

    let session = &mut ctx.accounts.session;
    session.attacker       = ctx.accounts.attacker.key();
    session.defender       = ctx.accounts.defender_profile.owner;
    session.start_ts       = now;
    session.end_ts         = 0;
    session.active         = true;
    session.stars          = 0;
    session.mine_buffers   = mine_buffers;
    session.storage_snapshot = storage_snapshot;
    session.gold_looted    = 0;
    session.food_looted    = 0;
    session.troop_counts   = troop_counts;
    session.spell_counts   = spell_counts;
    session.bump           = ctx.bumps.session;
    session._padding       = [0u8; 93];

    Ok(())
}

#[derive(Accounts)]
pub struct InitializeSession<'info> {
    #[account(mut)]
    pub attacker: Signer<'info>,
    #[account(seeds = [PROFILE_SEED, attacker.key().as_ref()], bump)]
    pub attacker_profile: Account<'info, PlayerProfile>,
    #[account(seeds = [BARRACKS_SEED, attacker.key().as_ref()], bump = attacker_barracks.bump)]
    pub attacker_barracks: Account<'info, TroopBarracks>,
    #[account(seeds = [SPELLS_SEED, attacker.key().as_ref()], bump = attacker_spells.bump)]
    pub attacker_spells: Account<'info, SpellHand>,

    /// Defender accounts (read-only)
    pub defender_profile: Account<'info, PlayerProfile>,
    pub defender_storage: Account<'info, StorageState>,
    pub defender_mine0: Option<Account<'info, MineState>>,
    pub defender_mine1: Option<Account<'info, MineState>>,
    pub defender_mine2: Option<Account<'info, MineState>>,

    #[account(
        init,
        payer = attacker,
        space = BATTLE_SPACE,
        seeds = [BATTLE_SEED, attacker.key().as_ref()],
        bump
    )]
    pub session: Account<'info, BattleSession>,
    pub system_program: Program<'info, System>,
}

// ── delegate_session (mainnet → public ER) ────────────────────────────────────
pub fn delegate_session(ctx: Context<DelegateSession>) -> Result<()> {
    ctx.accounts.delegate_session(
        &ctx.accounts.attacker,
        &[BATTLE_SEED, ctx.accounts.attacker.key().as_ref()],
        DelegateConfig::default(),
    )?;
    Ok(())
}

#[delegate]
#[derive(Accounts)]
pub struct DelegateSession<'info> {
    #[account(mut)]
    pub attacker: Signer<'info>,
    /// CHECK: delegated via sdk
    #[account(mut, del)]
    pub session: UncheckedAccount<'info>,
    pub owner_program: Program<'info, crate::program::Valhalla>,
    pub delegation_program: Program<'info, ephemeral_rollups_sdk::anchor::DelegationProgram>,
    pub system_program: Program<'info, System>,
}

// ── spawn_troops (public ER) ──────────────────────────────────────────────────
// Validates troop counts against barracks.battle_counts (mainnet read-only).
pub fn spawn_troops(ctx: Context<SpawnTroops>, troop_type: u8, count: u16) -> Result<()> {
    let session = &mut ctx.accounts.session;
    require!(session.active, ClashError::SessionNotActive);

    let tt = troop_type as usize;
    require!(tt < 9, ClashError::InvalidTroopType);
    require!(
        count <= session.troop_counts[tt],
        ClashError::InsufficientTroops
    );

    session.troop_counts[tt] = session.troop_counts[tt]
        .checked_sub(count)
        .ok_or(ClashError::Underflow)?;

    Ok(())
}

#[derive(Accounts)]
pub struct SpawnTroops<'info> {
    #[account(mut)]
    pub attacker: Signer<'info>,
    #[account(mut, seeds = [BATTLE_SEED, attacker.key().as_ref()], bump = session.bump)]
    pub session: Account<'info, BattleSession>,
}

// ── use_spell (public ER) ─────────────────────────────────────────────────────
pub fn use_spell(ctx: Context<UseSpell>, slot: u8) -> Result<()> {
    let session = &mut ctx.accounts.session;
    require!(session.active, ClashError::SessionNotActive);
    require!(slot < 5, ClashError::InvalidSpellSlot);

    let remaining = session.spell_counts[slot as usize];
    require!(remaining > 0, ClashError::InsufficientSpells);
    session.spell_counts[slot as usize] = remaining - 1;

    Ok(())
}

#[derive(Accounts)]
pub struct UseSpell<'info> {
    #[account(mut)]
    pub attacker: Signer<'info>,
    #[account(mut, seeds = [BATTLE_SEED, attacker.key().as_ref()], bump = session.bump)]
    pub session: Account<'info, BattleSession>,
}

// ── end_battle (public ER) ────────────────────────────────────────────────────
// Attacker submits final results; session locked for settle.
pub fn end_battle(
    ctx: Context<EndBattle>,
    stars: u8,
    gold_looted: u64,
    food_looted: u64,
) -> Result<()> {
    let session = &mut ctx.accounts.session;
    require!(session.active, ClashError::SessionNotActive);
    require!(stars <= 3, ClashError::InvalidStarCount);

    session.active      = false;
    session.end_ts      = Clock::get()?.unix_timestamp;
    session.stars       = stars;
    session.gold_looted = gold_looted;
    session.food_looted = food_looted;

    Ok(())
}

#[derive(Accounts)]
pub struct EndBattle<'info> {
    #[account(mut)]
    pub attacker: Signer<'info>,
    #[account(mut, seeds = [BATTLE_SEED, attacker.key().as_ref()], bump = session.bump)]
    pub session: Account<'info, BattleSession>,
}

// ── settle_battle (mainnet, after undelegate) ─────────────────────────────────
// Validates loot cap, grants XP, deposits loot into attacker's vault.
pub fn settle_battle(ctx: Context<SettleBattle>) -> Result<()> {
    let session = &ctx.accounts.session;
    require!(!session.active, ClashError::SessionNotActive);
    require!(session.end_ts > 0, ClashError::BattleAlreadyEnded);

    let stars = session.stars;
    let star_mult = STAR_MULT[stars as usize] as u64;

    // Loot cap = (50% mine buffers + 30% storage) × star_multiplier
    let mine_total: u64 = session.mine_buffers.iter().sum();
    let mine_share = mine_total
        .checked_mul(MINE_LOOT_PCT as u64)
        .ok_or(ClashError::Overflow)?
        / 100;
    let storage_share = session.storage_snapshot
        .checked_mul(STORAGE_LOOT_PCT as u64)
        .ok_or(ClashError::Overflow)?
        / 100;
    let base_cap = mine_share.checked_add(storage_share).ok_or(ClashError::Overflow)?;
    let loot_cap = base_cap
        .checked_mul(star_mult)
        .ok_or(ClashError::Overflow)?
        / 100;

    require!(session.gold_looted <= loot_cap, ClashError::LootExceedsCap);

    // Deduct loot from defender storage (clamped to what they have)
    let defender_storage = &mut ctx.accounts.defender_storage;
    let actual_gold = session.gold_looted.min(defender_storage.gold_balance);
    let actual_food = session.food_looted.min(defender_storage.food_balance);
    defender_storage.gold_balance = defender_storage.gold_balance
        .saturating_sub(actual_gold);
    defender_storage.food_balance = defender_storage.food_balance
        .saturating_sub(actual_food);

    // Deposit into attacker vault
    let vault = &mut ctx.accounts.attacker_vault;
    vault.gold_pending = vault.gold_pending
        .checked_add(actual_gold)
        .ok_or(ClashError::Overflow)?;
    vault.food_pending = vault.food_pending
        .checked_add(actual_food)
        .ok_or(ClashError::Overflow)?;

    // Grant XP
    let xp_gain = BATTLE_XP[stars as usize];
    let profile = &mut ctx.accounts.attacker_profile;
    profile.xp = profile.xp.saturating_add(xp_gain as u32);

    // Level-up loop
    loop {
        let lvl = profile.level as usize;
        if lvl >= MAX_LEVEL as usize { break; }
        if profile.xp < XP_TO_NEXT_LEVEL[lvl] as u32 { break; }
        profile.xp -= XP_TO_NEXT_LEVEL[lvl] as u32;
        profile.level += 1;
        profile.builder_count = builders_for_level(profile.level);
    }

    Ok(())
}

#[derive(Accounts)]
pub struct SettleBattle<'info> {
    #[account(mut)]
    pub attacker: Signer<'info>,
    #[account(mut, seeds = [PROFILE_SEED, attacker.key().as_ref()], bump = attacker_profile.bump)]
    pub attacker_profile: Account<'info, PlayerProfile>,
    #[account(mut, seeds = [VAULT_SEED, attacker.key().as_ref()], bump = attacker_vault.bump)]
    pub attacker_vault: Account<'info, LootVault>,
    #[account(
        mut,
        seeds = [BATTLE_SEED, attacker.key().as_ref()],
        bump = session.bump,
        constraint = !session.active @ ClashError::SessionNotActive
    )]
    pub session: Account<'info, BattleSession>,
    #[account(mut, seeds = [STORAGE_SEED, session.defender.as_ref()], bump = defender_storage.bump)]
    pub defender_storage: Account<'info, StorageState>,
}

// ── claim_loot (mainnet) ──────────────────────────────────────────────────────
// Moves pending loot from vault into attacker's storage.
pub fn claim_loot(ctx: Context<ClaimLoot>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let storage = &mut ctx.accounts.storage;

    let cap = STORAGE_CAP[(storage.level.saturating_sub(1) as usize).min(STORAGE_CAP.len() - 1)];
    let gold_space = cap.saturating_sub(storage.gold_balance);
    let food_space = cap.saturating_sub(storage.food_balance);

    let gold_claim = vault.gold_pending.min(gold_space);
    let food_claim = vault.food_pending.min(food_space);

    storage.gold_balance = storage.gold_balance
        .checked_add(gold_claim)
        .ok_or(ClashError::Overflow)?;
    storage.food_balance = storage.food_balance
        .checked_add(food_claim)
        .ok_or(ClashError::Overflow)?;

    vault.gold_pending = vault.gold_pending.saturating_sub(gold_claim);
    vault.food_pending = vault.food_pending.saturating_sub(food_claim);

    Ok(())
}

#[derive(Accounts)]
pub struct ClaimLoot<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut, seeds = [STORAGE_SEED, player.key().as_ref()], bump = storage.bump)]
    pub storage: Account<'info, StorageState>,
    #[account(mut, seeds = [VAULT_SEED, player.key().as_ref()], bump = vault.bump)]
    pub vault: Account<'info, LootVault>,
}

// ── close_session (mainnet) ───────────────────────────────────────────────────
pub fn close_session(_ctx: Context<CloseSession>) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
pub struct CloseSession<'info> {
    #[account(mut)]
    pub attacker: Signer<'info>,
    #[account(
        mut,
        close = attacker,
        seeds = [BATTLE_SEED, attacker.key().as_ref()],
        bump = session.bump,
        constraint = !session.active @ ClashError::SessionNotActive,
        constraint = session.attacker == attacker.key() @ ClashError::UnauthorizedEr
    )]
    pub session: Account<'info, BattleSession>,
}
