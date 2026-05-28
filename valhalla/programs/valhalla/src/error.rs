use anchor_lang::prelude::*;

#[error_code]
pub enum ClashError {
    // Profile / Level
    #[msg("Max level reached")]
    MaxLevelReached,
    #[msg("Insufficient XP")]
    InsufficientXp,

    // Building placement / upgrades
    #[msg("TC level too low for this building")]
    TcLevelTooLow,
    #[msg("Max building count reached")]
    MaxBuildingCount,
    #[msg("Building slot already occupied")]
    SlotOccupied,
    #[msg("Building not found at given slot")]
    BuildingNotFound,
    #[msg("Building must be purchased from shop first")]
    ShopPurchaseRequired,
    #[msg("Builder not idle")]
    BuilderBusy,
    #[msg("No idle builder available")]
    NoIdleBuilder,
    #[msg("Upgrade not in progress")]
    NoUpgradeInProgress,
    #[msg("Upgrade timer not finished")]
    UpgradeNotReady,
    #[msg("Max upgrade level reached")]
    MaxUpgradeLevel,
    #[msg("Invalid catalog ID")]
    InvalidCatalogId,

    // Resources
    #[msg("Insufficient gold")]
    InsufficientGold,
    #[msg("Insufficient food")]
    InsufficientFood,
    #[msg("Storage full")]
    StorageFull,
    #[msg("Nothing to collect")]
    NothingToCollect,

    // Population
    #[msg("Population cap reached")]
    PopCapReached,
    #[msg("Insufficient troop population")]
    InsufficientTroopPop,

    // Troops
    #[msg("Troop type requires higher barracks level")]
    BarracksLevelTooLow,
    #[msg("Invalid troop type")]
    InvalidTroopType,
    #[msg("Troop already upgraded")]
    TroopAlreadyUpgraded,
    #[msg("Insufficient troops for battle")]
    InsufficientTroops,
    #[msg("Training auth already consumed")]
    AuthAlreadyConsumed,
    #[msg("Training auth nonce mismatch")]
    AuthNonceMismatch,
    #[msg("Training auth expired")]
    AuthExpired,

    // Spells
    #[msg("Invalid spell type")]
    InvalidSpellType,
    #[msg("Spell requires higher market level")]
    MarketLevelTooLow,
    #[msg("Spell inventory full")]
    SpellInventoryFull,
    #[msg("Insufficient spells")]
    InsufficientSpells,
    #[msg("Invalid spell slot")]
    InvalidSpellSlot,

    // Battle
    #[msg("Battle session already active")]
    SessionAlreadyActive,
    #[msg("Battle session not active")]
    SessionNotActive,
    #[msg("Battle already ended")]
    BattleAlreadyEnded,
    #[msg("Invalid star count")]
    InvalidStarCount,
    #[msg("Loot exceeds allowed cap")]
    LootExceedsCap,
    #[msg("Defender not found")]
    DefenderNotFound,
    #[msg("Cannot attack self")]
    CannotAttackSelf,
    #[msg("Attacker map not settled")]
    AttackerMapNotSettled,

    // Delegation / ER
    #[msg("Account must be delegated for this operation")]
    NotDelegated,
    #[msg("Account already delegated")]
    AlreadyDelegated,
    #[msg("Unauthorized caller on ER")]
    UnauthorizedEr,

    // Math
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Arithmetic underflow")]
    Underflow,
}
