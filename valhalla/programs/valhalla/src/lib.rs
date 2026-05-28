pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::ephemeral;

pub use constants::*;
pub use error::*;
pub use state::*;
use instructions::*;

declare_id!("F43KEBNRX7AkbAjvW4LQq9A698yrp6Uh6kDsKjfqAMXz");

#[ephemeral]
#[program]
pub mod valhalla {
    use super::*;

    // ── Player initialisation ─────────────────────────────────────────────────
    pub fn initialize_player(ctx: Context<InitializePlayer>) -> Result<()> {
        init::initialize_player(ctx)
    }

    // ── Map (mainnet) ─────────────────────────────────────────────────────────
    pub fn save_map(
        ctx: Context<SaveMap>,
        slot_type: [u8; 50],
        slot_level: [u8; 50],
        slot_row: [u8; 50],
        slot_col: [u8; 50],
    ) -> Result<()> {
        map::save_map(ctx, slot_type, slot_level, slot_row, slot_col)
    }

    pub fn sync_profile(ctx: Context<SyncProfile>) -> Result<()> {
        map::sync_profile(ctx)
    }

    // ── Map (ER build mode) ───────────────────────────────────────────────────
    pub fn delegate_map(ctx: Context<DelegateMap>) -> Result<()> {
        map::delegate_map(ctx)
    }

    pub fn save_map_er(
        ctx: Context<SaveMapEr>,
        slot_type: [u8; 50],
        slot_level: [u8; 50],
        slot_row: [u8; 50],
        slot_col: [u8; 50],
    ) -> Result<()> {
        map::save_map_er(ctx, slot_type, slot_level, slot_row, slot_col)
    }

    pub fn undelegate_map(ctx: Context<UndelegateMap>) -> Result<()> {
        map::undelegate_map(ctx)
    }

    // ── Resource production ───────────────────────────────────────────────────
    pub fn init_mine(ctx: Context<InitMine>, index: u8) -> Result<()> {
        economy::init_mine(ctx, index)
    }

    pub fn init_farm(ctx: Context<InitFarm>, index: u8) -> Result<()> {
        economy::init_farm(ctx, index)
    }

    pub fn collect_mine(ctx: Context<CollectMine>) -> Result<()> {
        economy::collect_mine(ctx)
    }

    pub fn harvest_food(ctx: Context<HarvestFood>) -> Result<()> {
        economy::harvest_food(ctx)
    }

    pub fn collect_port(ctx: Context<CollectPort>) -> Result<()> {
        economy::collect_port(ctx)
    }

    // ── Building upgrades ─────────────────────────────────────────────────────
    pub fn start_upgrade(ctx: Context<StartUpgrade>, slot_index: u8, catalog_id: u8) -> Result<()> {
        builder::start_upgrade(ctx, slot_index, catalog_id)
    }

    pub fn complete_upgrade(ctx: Context<CompleteUpgrade>) -> Result<()> {
        builder::complete_upgrade(ctx)
    }

    pub fn cancel_upgrade(ctx: Context<CancelUpgrade>) -> Result<()> {
        builder::cancel_upgrade(ctx)
    }

    // ── Shop ──────────────────────────────────────────────────────────────────
    pub fn buy_building(ctx: Context<BuyBuilding>, catalog_id: u8) -> Result<()> {
        shop::buy_building(ctx, catalog_id)
    }

    pub fn buy_spell(ctx: Context<BuySpell>, spell_type: u8, quantity: u8) -> Result<()> {
        shop::buy_spell(ctx, spell_type, quantity)
    }

    pub fn slot_spell(ctx: Context<SlotSpell>, slot: u8, spell_type: u8) -> Result<()> {
        shop::slot_spell(ctx, slot, spell_type)
    }

    pub fn upgrade_troop(ctx: Context<UpgradeTroop>, troop_type: u8) -> Result<()> {
        shop::upgrade_troop(ctx, troop_type)
    }

    // ── Barracks / troop training (private ER) ────────────────────────────────
    pub fn authorize_training(
        ctx: Context<AuthorizeTraining>,
        troop_type: u8,
        quantity: u16,
        nonce: u64,
        expires_in: i64,
    ) -> Result<()> {
        barracks::authorize_training(ctx, troop_type, quantity, nonce, expires_in)
    }

    pub fn delegate_barracks(ctx: Context<DelegateBarracks>) -> Result<()> {
        barracks::delegate_barracks(ctx)
    }

    pub fn train_troops(ctx: Context<TrainTroops>) -> Result<()> {
        barracks::train_troops(ctx)
    }

    pub fn mark_for_battle(ctx: Context<MarkForBattle>, battle_counts: [u16; 9]) -> Result<()> {
        barracks::mark_for_battle(ctx, battle_counts)
    }

    pub fn commit_barracks(ctx: Context<CommitBarracks>) -> Result<()> {
        barracks::commit_barracks(ctx)
    }

    pub fn undelegate_barracks(ctx: Context<UndelegateBarracks>) -> Result<()> {
        barracks::undelegate_barracks(ctx)
    }

    pub fn deduct_deployed(ctx: Context<DeductDeployed>) -> Result<()> {
        barracks::deduct_deployed(ctx)
    }

    pub fn close_training_auth(ctx: Context<CloseTrainingAuth>) -> Result<()> {
        barracks::close_training_auth(ctx)
    }

    // ── Battle (public ER) ────────────────────────────────────────────────────
    pub fn initialize_session(ctx: Context<InitializeSession>) -> Result<()> {
        battle::initialize_session(ctx)
    }

    pub fn delegate_session(ctx: Context<DelegateSession>) -> Result<()> {
        battle::delegate_session(ctx)
    }

    pub fn spawn_troops(ctx: Context<SpawnTroops>, troop_type: u8, count: u16) -> Result<()> {
        battle::spawn_troops(ctx, troop_type, count)
    }

    pub fn use_spell(ctx: Context<UseSpell>, slot: u8) -> Result<()> {
        battle::use_spell(ctx, slot)
    }

    pub fn end_battle(
        ctx: Context<EndBattle>,
        stars: u8,
        gold_looted: u64,
        food_looted: u64,
    ) -> Result<()> {
        battle::end_battle(ctx, stars, gold_looted, food_looted)
    }

    pub fn settle_battle(ctx: Context<SettleBattle>) -> Result<()> {
        battle::settle_battle(ctx)
    }

    pub fn claim_loot(ctx: Context<ClaimLoot>) -> Result<()> {
        battle::claim_loot(ctx)
    }

    pub fn close_session(ctx: Context<CloseSession>) -> Result<()> {
        battle::close_session(ctx)
    }
}
