use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::{delegate, commit};
use ephemeral_rollups_sdk::cpi::DelegateConfig;
use ephemeral_rollups_sdk::ephem::commit_and_undelegate_accounts;
use crate::{constants::*, error::ClashError, state::*};

// ── Helpers ───────────────────────────────────────────────────────────────────

fn recompute_derived(map: &PlayerMap, profile: &mut PlayerProfile) {
    let mut tc_level: u8 = 0;
    let mut barracks_level: u8 = 0;
    let mut market_level: u8 = 0;
    let mut pop_cap: u16 = 0;

    for i in 0..50usize {
        let cid = map.slot_type[i];
        let lvl = map.slot_level[i];
        if cid == 0 { continue; }
        match cid {
            CAT_TOWN_CENTER  => tc_level = tc_level.max(lvl),
            CAT_BARRACKS     => barracks_level = barracks_level.max(lvl),
            CAT_MARKET       => market_level = market_level.max(lvl),
            CAT_HOUSE        => {
                let idx = (lvl.saturating_sub(1) as usize).min(HOUSE_POP.len() - 1);
                pop_cap = pop_cap.saturating_add(HOUSE_POP[idx] as u16);
            }
            _ => {}
        }
    }

    profile.tc_level = tc_level;
    profile.barracks_level = barracks_level;
    profile.market_level = market_level;
    profile.pop_cap = pop_cap;
    profile.builder_count = builders_for_level(profile.level);
}

// ── save_map (mainnet) ────────────────────────────────────────────────────────
// Player directly places / moves buildings on mainnet (no build mode ER).

pub fn save_map(
    ctx: Context<SaveMap>,
    slot_type: [u8; 50],
    slot_level: [u8; 50],
    slot_row: [u8; 50],
    slot_col: [u8; 50],
) -> Result<()> {
    require!(!ctx.accounts.profile.map_delegated, ClashError::AlreadyDelegated);

    // Validate TC exists and placement rules
    let tc_level = ctx.accounts.profile.tc_level.max(1);
    for i in 0..50usize {
        let cid = slot_type[i];
        if cid == 0 { continue; }
        require!(
            (cid as usize) < TC_GATE.len() && TC_GATE[cid as usize] <= tc_level,
            ClashError::TcLevelTooLow
        );
        let max = MAX_COUNT[cid as usize];
        let count = slot_type.iter().filter(|&&t| t == cid).count() as u8;
        require!(count <= max, ClashError::MaxBuildingCount);
    }

    let map = &mut ctx.accounts.map;
    map.slot_type  = slot_type;
    map.slot_level = slot_level;
    map.slot_row   = slot_row;
    map.slot_col   = slot_col;

    recompute_derived(map, &mut ctx.accounts.profile);
    Ok(())
}

#[derive(Accounts)]
pub struct SaveMap<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut, seeds = [PROFILE_SEED, player.key().as_ref()], bump = profile.bump)]
    pub profile: Account<'info, PlayerProfile>,
    #[account(mut, seeds = [MAP_SEED, player.key().as_ref()], bump = map.bump)]
    pub map: Account<'info, PlayerMap>,
}

// ── delegate_map (mainnet → public ER) ───────────────────────────────────────

pub fn delegate_map(ctx: Context<DelegateMap>) -> Result<()> {
    require!(!ctx.accounts.profile.map_delegated, ClashError::AlreadyDelegated);
    ctx.accounts.profile.map_delegated = true;
    // map.in_build_mode is set via save_map_er on the ER side

    ctx.accounts.delegate_map(
        &ctx.accounts.player,
        &[MAP_SEED, ctx.accounts.player.key().as_ref()],
        DelegateConfig::default(),
    )?;

    Ok(())
}

#[delegate]
#[derive(Accounts)]
pub struct DelegateMap<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut, seeds = [PROFILE_SEED, player.key().as_ref()], bump = profile.bump)]
    pub profile: Account<'info, PlayerProfile>,
    /// CHECK: delegated via sdk
    #[account(mut, del)]
    pub map: UncheckedAccount<'info>,
    pub owner_program: Program<'info, crate::program::Valhalla>,
    pub delegation_program: Program<'info, ephemeral_rollups_sdk::anchor::DelegationProgram>,
    pub system_program: Program<'info, System>,
}

// ── save_map_er (runs on ER) ──────────────────────────────────────────────────

pub fn save_map_er(
    ctx: Context<SaveMapEr>,
    slot_type: [u8; 50],
    slot_level: [u8; 50],
    slot_row: [u8; 50],
    slot_col: [u8; 50],
) -> Result<()> {
    let map = &mut ctx.accounts.map;
    require!(map.in_build_mode, ClashError::NotDelegated);

    let tc_level = ctx.accounts.profile.tc_level.max(1);
    for i in 0..50usize {
        let cid = slot_type[i];
        if cid == 0 { continue; }
        require!(
            (cid as usize) < TC_GATE.len() && TC_GATE[cid as usize] <= tc_level,
            ClashError::TcLevelTooLow
        );
        let max = MAX_COUNT[cid as usize];
        let count = slot_type.iter().filter(|&&t| t == cid).count() as u8;
        require!(count <= max, ClashError::MaxBuildingCount);
    }

    map.slot_type  = slot_type;
    map.slot_level = slot_level;
    map.slot_row   = slot_row;
    map.slot_col   = slot_col;
    Ok(())
}

#[derive(Accounts)]
pub struct SaveMapEr<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(seeds = [PROFILE_SEED, player.key().as_ref()], bump = profile.bump)]
    pub profile: Account<'info, PlayerProfile>,
    #[account(mut, seeds = [MAP_SEED, player.key().as_ref()], bump = map.bump)]
    pub map: Account<'info, PlayerMap>,
}

// ── undelegate_map (ER → mainnet commit) ─────────────────────────────────────

pub fn undelegate_map(ctx: Context<UndelegateMap>) -> Result<()> {
    let map_ai = ctx.accounts.map.to_account_info();
    commit_and_undelegate_accounts(
        &ctx.accounts.player.to_account_info(),
        vec![&map_ai],
        &ctx.accounts.magic_context,
        &ctx.accounts.magic_program.to_account_info(),
        None,
    )?;
    Ok(())
}

#[commit]
#[derive(Accounts)]
pub struct UndelegateMap<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    /// CHECK: committed via sdk
    #[account(mut)]
    pub map: UncheckedAccount<'info>,
}

// ── sync_profile (mainnet, after undelegate) ──────────────────────────────────

pub fn sync_profile(ctx: Context<SyncProfile>) -> Result<()> {
    require!(!ctx.accounts.map.in_build_mode, ClashError::AlreadyDelegated);
    ctx.accounts.profile.map_delegated = false;
    recompute_derived(&ctx.accounts.map, &mut ctx.accounts.profile);
    Ok(())
}

#[derive(Accounts)]
pub struct SyncProfile<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut, seeds = [PROFILE_SEED, player.key().as_ref()], bump = profile.bump)]
    pub profile: Account<'info, PlayerProfile>,
    #[account(seeds = [MAP_SEED, player.key().as_ref()], bump = map.bump)]
    pub map: Account<'info, PlayerMap>,
}
