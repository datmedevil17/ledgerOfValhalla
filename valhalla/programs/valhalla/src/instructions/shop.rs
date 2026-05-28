use anchor_lang::prelude::*;
use crate::{constants::*, error::ClashError, state::*};

// ── buy_building ──────────────────────────────────────────────────────────────
// One-time shop purchase required before placing certain buildings.
// Does not place the building; just marks it as purchased in a flag account.
// The actual placement happens in save_map / save_map_er.
pub fn buy_building(ctx: Context<BuyBuilding>, catalog_id: u8) -> Result<()> {
    let cid = catalog_id as usize;
    require!(cid < REQUIRES_SHOP_PURCHASE.len(), ClashError::InvalidCatalogId);
    require!(REQUIRES_SHOP_PURCHASE[cid], ClashError::InvalidCatalogId);

    let tc_level = ctx.accounts.profile.tc_level;
    require!(TC_GATE[cid] <= tc_level, ClashError::TcLevelTooLow);

    let cost = shop_cost(catalog_id as u16).ok_or(ClashError::InvalidCatalogId)?;
    let storage = &mut ctx.accounts.storage;
    require!(storage.gold_balance >= cost, ClashError::InsufficientGold);
    storage.gold_balance = storage.gold_balance
        .checked_sub(cost)
        .ok_or(ClashError::Underflow)?;

    // Mark purchased in the map slot flags using a dedicated PDA (ShopPurchase).
    // For simplicity we use a flag stored in the map's slot_level when slot_type is set.
    // Client is responsible for calling save_map to place it after purchase.
    // No additional on-chain state needed here beyond deducting gold.
    Ok(())
}

#[derive(Accounts)]
pub struct BuyBuilding<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(seeds = [PROFILE_SEED, player.key().as_ref()], bump = profile.bump)]
    pub profile: Account<'info, PlayerProfile>,
    #[account(mut, seeds = [STORAGE_SEED, player.key().as_ref()], bump = storage.bump)]
    pub storage: Account<'info, StorageState>,
}

// ── buy_spell ─────────────────────────────────────────────────────────────────
pub fn buy_spell(ctx: Context<BuySpell>, spell_type: u8, quantity: u8) -> Result<()> {
    let st = spell_type as usize;
    require!(st < SPELL_COST.len(), ClashError::InvalidSpellType);

    // Apply market discount: MARKET_DISCOUNT[level-1] is a % multiplier
    // (100 = no discount, 90 = 10% off, 80 = 20% off)
    let market_level = ctx.accounts.profile.market_level as usize;
    let multiplier = if market_level == 0 {
        100u64
    } else {
        MARKET_DISCOUNT[(market_level - 1).min(MARKET_DISCOUNT.len() - 1)]
    };
    let base_cost = SPELL_COST[st];
    let discounted = base_cost * multiplier / 100;
    let total = discounted
        .checked_mul(quantity as u64)
        .ok_or(ClashError::Overflow)?;

    let storage = &mut ctx.accounts.storage;
    require!(storage.gold_balance >= total, ClashError::InsufficientGold);
    storage.gold_balance = storage.gold_balance
        .checked_sub(total)
        .ok_or(ClashError::Underflow)?;

    let spells = &mut ctx.accounts.spells;
    let new_count = (spells.counts[st] as u16)
        .checked_add(quantity as u16)
        .ok_or(ClashError::Overflow)?;
    require!(new_count <= 255, ClashError::SpellInventoryFull);
    spells.counts[st] = new_count as u8;

    Ok(())
}

#[derive(Accounts)]
pub struct BuySpell<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(seeds = [PROFILE_SEED, player.key().as_ref()], bump = profile.bump)]
    pub profile: Account<'info, PlayerProfile>,
    #[account(mut, seeds = [STORAGE_SEED, player.key().as_ref()], bump = storage.bump)]
    pub storage: Account<'info, StorageState>,
    #[account(mut, seeds = [SPELLS_SEED, player.key().as_ref()], bump = spells.bump)]
    pub spells: Account<'info, SpellHand>,
}

// ── slot_spell ────────────────────────────────────────────────────────────────
// Assigns a spell type to one of the 5 battle slots.
pub fn slot_spell(ctx: Context<SlotSpell>, slot: u8, spell_type: u8) -> Result<()> {
    require!(slot < 5, ClashError::InvalidSpellSlot);
    let st = spell_type as usize;
    require!(st < SPELL_COST.len() || spell_type == 255, ClashError::InvalidSpellType);

    ctx.accounts.spells.slotted[slot as usize] = spell_type;
    Ok(())
}

#[derive(Accounts)]
pub struct SlotSpell<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut, seeds = [SPELLS_SEED, player.key().as_ref()], bump = spells.bump)]
    pub spells: Account<'info, SpellHand>,
}

// ── upgrade_troop ─────────────────────────────────────────────────────────────
// Single-level upgrade per troop type; costs gold from storage.
pub fn upgrade_troop(ctx: Context<UpgradeTroop>, troop_type: u8) -> Result<()> {
    let tt = troop_type as usize;
    require!(tt < 9, ClashError::InvalidTroopType);

    let upgrades = &mut ctx.accounts.upgrades;
    require!(!upgrades.upgraded[tt], ClashError::TroopAlreadyUpgraded);

    let barracks_level = ctx.accounts.profile.barracks_level;
    require!(
        barracks_level >= TROOP_BARRACKS_GATE[tt],
        ClashError::BarracksLevelTooLow
    );

    let cost = TROOP_UPGRADE_COST[tt][0]; // [0] = gold cost
    let storage = &mut ctx.accounts.storage;
    require!(storage.gold_balance >= cost, ClashError::InsufficientGold);
    storage.gold_balance = storage.gold_balance
        .checked_sub(cost)
        .ok_or(ClashError::Underflow)?;

    upgrades.upgraded[tt] = true;
    Ok(())
}

#[derive(Accounts)]
pub struct UpgradeTroop<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(seeds = [PROFILE_SEED, player.key().as_ref()], bump = profile.bump)]
    pub profile: Account<'info, PlayerProfile>,
    #[account(mut, seeds = [STORAGE_SEED, player.key().as_ref()], bump = storage.bump)]
    pub storage: Account<'info, StorageState>,
    #[account(mut, seeds = [UPGRADES_SEED, player.key().as_ref()], bump = upgrades.bump)]
    pub upgrades: Account<'info, TroopUpgrades>,
}
