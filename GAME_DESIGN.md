# Clash — Game Design Document

## Table of Contents
1. [Game Overview](#1-game-overview)
2. [Map & World Layout](#2-map--world-layout)
3. [Buildings — Complete Reference](#3-buildings--complete-reference)
4. [Economy System](#4-economy-system)
5. [Upgrade System](#5-upgrade-system)
6. [Troop System](#6-troop-system)
7. [Troop Upgrade System](#7-troop-upgrade-system)
8. [Defense Buildings](#8-defense-buildings)
9. [Spells — Shop Cards](#9-spells--shop-cards)
10. [The Shop](#10-the-shop)
11. [Attack System (Raid Mode)](#11-attack-system)
12. [Win & Loss Conditions](#12-win--loss-conditions)
13. [Progression Loop Summary](#13-progression-loop-summary)
14. [Battle Mode — Stake & Fight](#14-battle-mode--stake--fight)

---

## 1. Game Overview

Clash is a 3D base-building and real-time strategy game. The player builds and upgrades a village on a grid map, produces resources, trains troops, and defends against or launches attacks on enemy bases. The game revolves around a gold-based economy that drives building construction, upgrades, and troop training. Spells are consumable cards purchased from the Shop that give tactical advantages during battle.

The game has two distinct combat modes:
- **Raid Mode** — Asynchronous single-player attack on an AI-defended enemy base. Standard loot-and-pillage loop.
- **Battle Mode** — Live synchronous 1v1 PvP. Both players stake real currency (SOL), set formations, and fight in a shared arena. Winner takes the pot.

---

## 2. Map & World Layout

### Grid
- **Playable area:** 90 × 72 grid cells
- **Cell size:** 1 unit
- Each building occupies a rectangular footprint of N × M cells (defined in config)
- The outer boundary (1200 units) contains sea/ocean — no building possible there

### Zones
| Zone | Description |
|------|-------------|
| Village Core | Center area — Town Center, Storage, Houses, Market |
| Resource Zone | Surrounding area — Farms, Mines (Gold deposits), Windmill |
| Military Zone | Barracks, Archery Range, Temple |
| Perimeter | Walls, Wall Towers, Watch Towers, Tower Houses |
| Coastal | Port, Dock — unlock sea-based trade |

### Terrain
- Flat grass grid (main village area)
- Ocean/sea (lower third of outer boundary)
- Decorative: Pine Trees, Tree Groups, Rocks, Mountains (non-buildable, clearable)

### Clearable Obstacles
Resources like `Resource_PineTree`, `Resource_Rock_1/2/3`, `Resource_Gold_1/2/3`, and `Resource_Tree_Group_Cut` occupy grid cells. Players spend Gold to clear them, revealing buildable land underneath. Clearing a gold rock yields a small coin bonus.

---

## 3. Buildings — Complete Reference

### 3.1 Town Center
**Model:** `TownCenter_SecondAge_Level1/2/3`  
**Footprint:** 4 × 4  
**Levels:** 3  
**Builders Required:** Lvl 1→2: **2 Builders** | Lvl 2→3: **3 Builders**

The heart of the village. Upgrading the Town Center unlocks higher-level buildings across the entire village. Nothing upgrades beyond the current Town Center level cap. Because it requires multiple builders, you must invest in Houses before you can upgrade it.

| Level | HP | Unlocks |
|-------|-----|---------|
| 1 | 1500 | All Lvl 1 buildings, 1st Barracks, 1st Watch Tower |
| 2 | 2500 | All Lvl 2 buildings, Archery Range, Temple Lvl 1, Port |
| 3 | 4000 | All Lvl 3 buildings, Wonder, 2nd Barracks, Tower House |

**Upgrade Cost:** 5,000 Gold (Lvl 1→2), 15,000 Gold (Lvl 2→3)  
**Upgrade Time:** 2h (Lvl 1→2), 8h (Lvl 2→3)

> The TC Lvl 1→2 upgrade locks out 2 of your builders for its duration. Plan around this — upgrade Houses and Mines first so you have income while TC is being upgraded.

---

### 3.2 Houses
**Model:** `Houses_SecondAge_1/2/3_Level1/2/3` (3 house types, 3 levels each)  
**Footprint:** 2 × 2  
**Levels:** 3  
**Max count per player:** 6 (2 of each type)  
**Builders Required to build/upgrade:** 1

Houses provide two things: **Population Capacity** (army size) and **Builder Slots** (construction workers). Builders are not purchased — they are earned directly from your houses. The more houses you build and the higher their level, the more parallel construction you can run.

| Level | HP | Population Cap (per house) | Upgrade Cost | Upgrade Time |
|-------|-----|---------------------------|-------------|--------------|
| 1 | 400 | 10 | — | — |
| 2 | 700 | 15 | 800 Gold | 30m |
| 3 | 1100 | 20 | 2,500 Gold | 2h |

Total max population at 6 × Lvl 3 houses: **120 troops**

#### Builder Slots from Houses

| Houses Owned | Average House Level | Builders Unlocked |
|-------------|--------------------|--------------------|
| 1 house | Any | 1 (default) |
| 2 houses | Any | 2 |
| 4 houses | Lvl 2+ average | 3 |
| 6 houses | Lvl 2+ average | 4 |
| 6 houses | All Lvl 3 | 5 |

> This is the core progression gate. You cannot upgrade the Town Center to Lvl 2 without 2 Builders, which requires 2 Houses. You cannot build the Wonder without 4 Builders, which requires 6 houses at Lvl 2+. Build houses first — they unlock everything else.

**Average house level** is the mean of all placed houses rounded down. Example: 4 houses at (3, 3, 2, 1) = avg 2.25 → counts as Lvl 2.

---

### 3.3 Farm
**Model:** `Farm_SecondAge_Level1/2/3` + wheat variants  
**Footprint:** 3 × 3  
**Levels:** 3  
**Max count:** 4

Farms generate **Food** — a secondary resource used as a prerequisite for training certain troop types (Warrior, Monk, Cleric). Food is consumed on troop training, not on upgrade.

| Level | HP | Food/hour | Food Cap | Upgrade Cost | Upgrade Time |
|-------|-----|-----------|----------|-------------|--------------|
| 1 | 350 | 200 | 1,000 | — | — |
| 2 | 600 | 400 | 2,500 | 600 Gold | 20m |
| 3 | 950 | 700 | 5,000 | 1,800 Gold | 1.5h |

> **Food is NOT gold.** It is a production gating resource. If a player has insufficient food, certain barracks cannot queue troops.

---

### 3.4 Storage
**Model:** `Storage_SecondAge_Level1/2/3`  
**Footprint:** 3 × 3  
**Levels:** 3  
**Max count:** 2

Storage holds the player's accumulated **Gold**. The Gold cap is defined by total Storage capacity. Gold mined beyond cap is lost.

| Level | HP | Gold Capacity | Upgrade Cost | Upgrade Time |
|-------|-----|--------------|-------------|--------------|
| 1 | 600 | 10,000 | — | — |
| 2 | 1,000 | 30,000 | 1,200 Gold | 45m |
| 3 | 1,600 | 75,000 | 4,000 Gold | 3h |

**2 × Lvl 3 Storages = 150,000 Gold cap**

> When a Storage is destroyed in battle, the attacker loots a percentage of its held gold. Prioritising Storage protection is strategically important.

---

### 3.5 Gold Mine (Resource_Gold)
**Model:** `Resource_Gold_1/2/3`  
**Footprint:** 2 × 2  
**Levels:** 3 (represented by the Gold rock variant cleared or upgraded in-place)  
**Max count:** 3

Gold Mines are the primary income source. They continuously generate Gold over time that collects in the mine until collected by the player (or raided).

| Level | HP | Gold/hour | Mine Capacity (collect buffer) | Upgrade Cost | Upgrade Time |
|-------|-----|-----------|-------------------------------|-------------|--------------|
| 1 | 400 | 150 | 1,500 | — | — |
| 2 | 700 | 350 | 3,000 | 900 Gold | 40m |
| 3 | 1,100 | 600 | 6,000 | 2,800 Gold | 2h |

**Collection mechanic:** Gold sits in the mine buffer. The player taps/clicks to collect it into Storage. If the mine is full and uncollected, it stops generating until collected. Attackers can raid the mine buffer directly (not Storage) up to 50% of what's currently buffered.

**3 × Lvl 3 Mines = 1,800 Gold/hour passive income**

---

### 3.6 Market
**Model:** `Market_SecondAge_Level1/2/3`  
**Footprint:** 3 × 3  
**Levels:** 3  
**Max count:** 1

The Market provides the **Shop** interface. It is where players browse and buy:
- New buildings (placed on the map)
- Spell cards (consumables used in battle)
- Troop upgrade scrolls

Higher Market levels unlock better items in the shop and give a discount on spell card prices.

| Level | HP | Shop Tier Unlocked | Spell Discount | Upgrade Cost | Upgrade Time |
|-------|-----|-------------------|---------------|-------------|--------------|
| 1 | 500 | Tier 1 spells + basic buildings | 0% | — | — |
| 2 | 800 | Tier 2 spells + advanced buildings | 10% | 1,500 Gold | 1h |
| 3 | 1,200 | Tier 3 spells + all buildings | 20% | 5,000 Gold | 4h |

---

### 3.7 Windmill
**Model:** `Windmill_SecondAge`  
**Footprint:** 2 × 2  
**Levels:** 1 (no upgrades)  
**Max count:** 1

The Windmill passively doubles Food output from all Farms while active. If the Windmill is destroyed in battle, Farms revert to base output until repaired.

| HP | Effect |
|----|--------|
| 450 | × 2 multiplier to all Farm Food/hour |

---

### 3.8 Barracks
**Model:** `Barracks_SecondAge_Level1/2/3`  
**Footprint:** 3 × 3  
**Levels:** 3  
**Max count:** 2 (2nd unlocked at Town Center Lvl 3)

Barracks are the military training hub. Troops are queued here and trained over time. Each Barracks trains independently — having 2 Barracks halves the time to fill an army.

| Level | HP | Troop Slots (queue) | Training Speed Bonus | Unlocks | Upgrade Cost | Upgrade Time |
|-------|-----|--------------------|--------------------|---------|-------------|--------------|
| 1 | 800 | 5 | +0% | Warrior, Monk, Bat | — | — |
| 2 | 1,400 | 8 | +20% faster | + Rogue, Ranger, Ghost | 2,000 Gold | 1.5h |
| 3 | 2,200 | 12 | +50% faster | + Cleric, Wizard, Dragon | 7,000 Gold | 5h |

**Training mechanic:**
- Each troop has a base training time (see Troop System section)
- The queue is sequential per Barracks; two Barracks run queues in parallel
- Food is consumed when training starts (not on completion)
- Troops deploy from the Barracks position into the army camp

---

### 3.9 Archery Range
**Model:** `Archery_SecondAge_Level1/2/3`  
**Footprint:** 3 × 3  
**Levels:** 3  
**Unlocked at:** Town Center Lvl 2

The Archery Range is a secondary military building for training ranged-specialist troops faster and at reduced Food cost.

| Level | HP | Ranged Troop Training Bonus | Upgrade Cost | Upgrade Time |
|-------|-----|----------------------------|-------------|--------------|
| 1 | 700 | −10% training time for Ranger | — | 1,800 Gold |
| 2 | 1,200 | −25% training time for Ranger, unlocks Ranger Lvl 2 upgrades | 3,000 Gold | 2.5h |
| 3 | 1,800 | −40% training time, unlocks Ranger Lvl 3 upgrades | 9,000 Gold | 6h |

---

### 3.10 Temple
**Model:** `Temple_SecondAge_Level1/2/3`  
**Footprint:** 3 × 3  
**Levels:** 3  
**Unlocked at:** Town Center Lvl 2  
**Builders Required:** Build: **2 Builders** | Lvl 2→3 upgrade: **3 Builders**

The Temple is a unique defense building. When enemies enter a 20-unit radius, it **spawns 4 reinforcement defender units** (Warriors and Monks) that fight for the village. Reinforcements respawn after a cooldown.

| Level | HP | Reinforcement HP Bonus | Reinforcement Damage Bonus | Cooldown | Upgrade Cost | Upgrade Time |
|-------|-----|----------------------|--------------------------|----------|-------------|--------------|
| 1 | 900 | Base stats | Base stats | 120s | — | — |
| 2 | 1,500 | +30% HP | +20% damage | 90s | 3,500 Gold | 2h |
| 3 | 2,400 | +60% HP | +50% damage | 60s | 10,000 Gold | 6h |

---

### 3.11 Port
**Model:** `Port_SecondAge_Level1/2/3` + `Dock_FirstAge`  
**Footprint:** 4 × 3 (coastal placement required)  
**Levels:** 3  
**Unlocked at:** Town Center Lvl 2  
**Builders Required:** Build: **2 Builders** | Lvl 3 upgrade: **2 Builders**

The Port enables **sea trade** — a secondary gold income stream. It generates trade income passively, separate from Gold Mines.

| Level | HP | Gold/hour (Trade) | Sea Troop Unlock | Upgrade Cost | Upgrade Time |
|-------|-----|------------------|-----------------|-------------|--------------|
| 1 | 600 | 100 | — | — | — |
| 2 | 1,000 | 250 | Ghost (sea deployment) | 2,500 Gold | 1.5h |
| 3 | 1,600 | 500 | Dragon (sea deployment) | 8,000 Gold | 5h |

---

### 3.12 Wonder
**Model:** `Wonder_SecondAge_Level1/2`  
**Footprint:** 4 × 4  
**Levels:** 2  
**Unlocked at:** Town Center Lvl 3  
**Builders Required:** Build Lvl 1: **4 Builders** | Upgrade to Lvl 2: **4 Builders**

The Wonder is the prestige/endgame building. Requiring all 4 builders simultaneously, you cannot start it until all 6 Houses are at Lvl 2+. Building and upgrading it is expensive and time-consuming. When fully upgraded to Level 2 and defended for a set time, it triggers a **Victory condition**.

> While the Wonder is being built (4 builders occupied), no other construction or upgrades can happen. This is a deliberate all-in commitment — plan your village to be fully upgraded before breaking ground.

| Level | HP | Effect | Build Cost | Build Time |
|-------|-----|--------|-----------|-----------|
| 1 | 3,000 | +10% to all resource production | 20,000 Gold | 12h |
| 2 | 5,000 | +20% all production, Victory trigger active | 50,000 Gold | 24h |

---

### 3.13 Walls & Wall Towers
**Models:** `Wall_SecondAge`, `WallTowers_SecondAge`, `WallTowers_Door_SecondAge`, `WallTowers_DoorClosed_SecondAge`  
**Footprint:** 1 × 1 (Wall), 1 × 1 (Wall Tower)  
**Levels:** 1 (no upgrades — use quantity for scaling)

Walls block ground troop pathing, forcing troops around or through Wall Tower gates. Flying units ignore walls.

| Type | HP | Notes |
|------|-----|-------|
| Wall segment | 500 | Blocks pathing |
| Wall Tower | 700 | Higher HP node at corners |
| Wall Door (open) | 600 | Ground troops can pass through |
| Wall Door (closed) | 900 | Must be destroyed to pass |

---

## 4. Economy System

### 4.1 Resource Types

| Resource | Source | Used For |
|---------|--------|---------|
| **Gold** | Mines, Port, Market trade, loot from raids | Everything — builds, upgrades, troop training, spell purchase |
| **Food** | Farms (boosted by Windmill) | Gating cost for training troops |

### 4.2 Gold Flow Diagram

```
Gold Mines (passive/hr)
        +
Port Trade (passive/hr)
        +
Raid Loot (from attacking other bases)
        ↓
   [Storage Capacity Cap]
        ↓
Spend on:
  → Building Construction
  → Building Upgrades
  → Troop Training
  → Spell Cards (from Market/Shop)
  → Clearing Obstacles
  → Troop Upgrades (via scrolls)
```

### 4.3 Gold Income Rates (All Max Level)

| Source | Gold/hour |
|--------|-----------|
| 3 × Lvl 3 Gold Mines | 1,800 |
| Lvl 3 Port | 500 |
| Lvl 3 Wonder bonus (+20%) | +460 |
| **Total Passive** | **~2,760/hr** |

Raid loot varies: attackers can steal up to **50% of Mine buffers** + **30% of Storage** on a successful 3-star raid.

### 4.4 Storage Protection Strategy

- Spreading Gold across 2 Storages reduces total exposure per building
- The Town Center acts as a small emergency vault: holds 500/1000/2000 Gold (Lvl 1/2/3) that is NOT lootable
- Spending Gold regularly (keep Storage near 0) is the best protection

### 4.5 Food Economy

Food has no carry-over cost — it is consumed when training begins. The only Food management required is ensuring Farms are producing faster than troops are trained.

| Troop | Food Cost |
|-------|----------|
| Bat (×4 swarm) | 10 |
| Monk | 15 |
| Warrior | 20 |
| Rogue | 20 |
| Ranger | 25 |
| Ghost | 25 |
| Cleric | 30 |
| Wizard | 35 |
| Dragon | 50 |

---

## 5. Upgrade System

### 5.1 Core Rules

- **Every upgrade costs Gold and takes real time** (no instant upgrades by default)
- **Only 1 building can be upgrading at a time** per available Builder slot
- **Builders are earned through Houses** — the more houses you own and the higher their level, the more builders you unlock (see §3.2)
- **Some buildings require multiple builders simultaneously** — they consume that many builder slots for the entire duration
- **Town Center level gates all other buildings** — nothing can exceed Town Center's level

### 5.2 Upgrade Sequence (Recommended)

```
Phase 1 (Town Center Lvl 1 — 1 Builder available):
  → Build all 6 Houses (2 of each type) at Lvl 1          [unlocks 4 Builders]
  → Upgrade Mines to Lvl 2 (income)
  → Build both Storages → upgrade to Lvl 2 (capacity)
  → Upgrade Barracks to Lvl 2 (better troops)
  → Upgrade Houses to Lvl 2 (army cap + edge toward 5th Builder)
  → Upgrade Farms to Lvl 2 (food support)
  → Now you have 4 Builders → start TC Lvl 1→2 upgrade (2 builders, 2 remain free)

Phase 2 (Town Center Lvl 2 — up to 4 Builders):
  → Build Market → unlock Shop
  → Build Temple (2 builders) → defense
  → Build Archery Range
  → Build Port (2 builders) → sea income
  → Upgrade Mines to Lvl 3
  → Upgrade Storages to Lvl 3
  → Upgrade all 6 Houses to Lvl 3                          [unlocks 5th Builder]
  → Now queue TC Lvl 2→3 upgrade (3 builders, 2 remain free)

Phase 3 (Town Center Lvl 3 — 5 Builders):
  → Upgrade Barracks to Lvl 3 → all troops available
  → Build 2nd Barracks → faster training
  → Max all defenses
  → Build Wonder (4 builders, 1 remains free for small jobs)
  → Upgrade Wonder to Lvl 2 → prestige/win path
```

### 5.3 Builder System

Builders are earned by building and upgrading Houses — they cannot be purchased. Each builder is a construction worker that handles one upgrade or construction job at a time. Some buildings require multiple builders working together simultaneously.

#### Builder Unlock Table

| Builders Available | Requirement |
|-------------------|-------------|
| 1 | Default — always available |
| 2 | Own 2 Houses (any level) |
| 3 | Own 4 Houses, average Lvl 2+ |
| 4 | Own 6 Houses, average Lvl 2+ |
| 5 | Own all 6 Houses at Lvl 3 |

#### Builder Slots Required per Building

| Building | Slots to Build / Upgrade |
|----------|--------------------------|
| House (any level) | 1 |
| Farm (any level) | 1 |
| Gold Mine (any level) | 1 |
| Storage (any level) | 1 |
| Market (any level) | 1 |
| Windmill | 1 |
| Watch Tower / Wall Tower | 1 |
| Barracks Lvl 1→2 | 1 |
| Barracks Lvl 2→3 | 2 |
| Archery Range (any level) | 1 |
| Town Center Lvl 1→2 | **2** |
| Town Center Lvl 2→3 | **3** |
| Temple (build) | **2** |
| Temple Lvl 2→3 | **3** |
| Port (build) | **2** |
| Port Lvl 2→3 | **2** |
| Wonder Lvl 1 (build) | **4** |
| Wonder Lvl 1→2 | **4** |

> Multi-builder jobs lock all consumed builder slots for their full duration. If a 2-builder job is running and you only have 2 builders total, nothing else can be started until it completes.

#### Builder Strategy

Because Houses gate your builders, the optimal early loop is:
1. Build all 6 Houses first (even at Lvl 1 — get 4 builders)
2. Upgrade houses to Lvl 2 to reach 5 builders
3. Now you can queue the TC upgrade (2 builders) while still having 3 free for other jobs

### 5.4 Upgrade Cancel

- Upgrades can be cancelled at any time
- 50% Gold refund on cancel (no time refund)
- All builder slots from a cancelled job are immediately freed

---

## 6. Troop System

### 6.1 All Troops

| # | Troop | HP | Damage | Range | Speed | Type | Training Cost | Training Time |
|---|-------|----|--------|-------|-------|------|--------------|--------------|
| 1 | Warrior | 300 | 45 | Melee | 3.5 | Ground | 100 Gold + 20 Food | 45s |
| 2 | Monk | 200 | 30 | Melee | 5.5 | Ground | 80 Gold + 15 Food | 30s |
| 3 | Rogue | 150 | 55 | Melee | 7.0 | Ground | 90 Gold + 20 Food | 35s |
| 4 | Ranger | 180 | 35 | 9 | 4.0 | Ground | 110 Gold + 25 Food | 50s |
| 5 | Cleric | 220 | 25 | 6 (heal) | 4.0 | Ground | 120 Gold + 30 Food | 55s |
| 6 | Wizard | 140 | 70 (splash 3) | 11 | 3.5 | Ground | 200 Gold + 35 Food | 90s |
| 7 | Dragon | 420 | 80 (splash 2.5) | 9 | 4.5 | Flying | 400 Gold + 50 Food | 3m |
| 8 | Bat (×4) | 75 | 20 | Melee | 9.0 | Flying | 60 Gold + 10 Food | 20s |
| 9 | Ghost | 190 | 48 | 8.5 | 6.0 | Flying | 160 Gold + 25 Food | 70s |

**Unlock gates:**
- Barracks Lvl 1: Warrior, Monk, Bat
- Barracks Lvl 2: + Rogue, Ranger, Ghost
- Barracks Lvl 3: + Cleric, Wizard, Dragon

### 6.2 Troop Targeting Logic

1. **Ground troops:** Move to nearest structure (prefer resource buildings if no defender in path)
2. **Flying troops:** Beeline to Town Center, ignoring walls and terrain
3. **Ranger / Ghost:** Maintain minimum range (5 units for Ranger), kite backwards if target too close
4. **Cleric:** Prioritizes healing nearby low-HP allies over attacking
5. **Wizard:** Targets clusters — picks position with highest splash-hit count

### 6.3 Cleric Healing
- Heals 15 HP per 6 seconds to all allies within 6 units
- Does not self-heal
- Continues healing while enemies are present (attack + heal simultaneously)

### 6.4 Bat Swarm Mechanic
- Deploying 1 "Bat" spawns a swarm of **4 individual Bats**
- All 4 spawn at the deployment point and spread to different targets
- Bats die fast but overwhelm single-target defenses by splitting fire

---

## 7. Troop Upgrade System

Troops are upgraded through **Upgrade Scrolls** purchased from the Shop (Market required). Each scroll permanently buffs one troop type across all future uses.

### 7.1 Upgrade Categories

Each troop has 3 upgrade categories:

| Category | Effect | Max Tier |
|----------|--------|---------|
| **Vitality** | +HP (health pool increase) | 3 |
| **Ferocity** | +Damage per hit | 3 |
| **Swiftness** | +Movement speed | 2 |

### 7.2 Per-Troop Upgrade Table

#### Warrior
| Tier | Vitality (HP) | Ferocity (Dmg) | Swiftness (Spd) | Cost (each) |
|------|--------------|---------------|----------------|-------------|
| Lvl 1→2 | 300 → 390 (+30%) | 45 → 58 (+29%) | 3.5 → 3.9 | 1,500 Gold |
| Lvl 2→3 | 390 → 510 (+31%) | 58 → 75 (+29%) | 3.9 → 4.3 | 4,000 Gold |

#### Monk
| Tier | Vitality (HP) | Ferocity (Dmg) | Swiftness (Spd) | Cost (each) |
|------|--------------|---------------|----------------|-------------|
| Lvl 1→2 | 200 → 260 | 30 → 39 | 5.5 → 6.1 | 1,200 Gold |
| Lvl 2→3 | 260 → 340 | 39 → 50 | 6.1 → 6.7 | 3,200 Gold |

#### Rogue
| Tier | Vitality (HP) | Ferocity (Dmg) | Swiftness (Spd) | Cost (each) |
|------|--------------|---------------|----------------|-------------|
| Lvl 1→2 | 150 → 195 | 55 → 71 | 7.0 → 7.7 | 1,200 Gold |
| Lvl 2→3 | 195 → 255 | 71 → 92 | 7.7 → 8.4 | 3,200 Gold |

#### Ranger
| Tier | Vitality (HP) | Ferocity (Dmg) | Swiftness (Spd) | Cost (each) |
|------|--------------|---------------|----------------|-------------|
| Lvl 1→2 | 180 → 234 | 35 → 45 | 4.0 → 4.4 | 1,400 Gold |
| Lvl 2→3 | 234 → 305 | 45 → 58 | 4.4 → 4.8 | 3,800 Gold |

#### Cleric
| Tier | Vitality (HP) | Ferocity (Dmg + Heal) | Swiftness (Spd) | Cost (each) |
|------|--------------|----------------------|----------------|-------------|
| Lvl 1→2 | 220 → 286 | 25 → 32 / heal 15→19 | 4.0 → 4.4 | 1,600 Gold |
| Lvl 2→3 | 286 → 372 | 32 → 42 / heal 19→25 | 4.4 → 4.8 | 4,500 Gold |

#### Wizard
| Tier | Vitality (HP) | Ferocity (Dmg + Splash) | Swiftness (Spd) | Cost (each) |
|------|--------------|------------------------|----------------|-------------|
| Lvl 1→2 | 140 → 182 | 70 → 91 / splash 3→3.5 | 3.5 → 3.9 | 2,500 Gold |
| Lvl 2→3 | 182 → 237 | 91 → 118 / splash 3.5→4.0 | 3.9 → 4.3 | 7,000 Gold |

#### Dragon
| Tier | Vitality (HP) | Ferocity (Dmg + Splash) | Swiftness (Spd) | Cost (each) |
|------|--------------|------------------------|----------------|-------------|
| Lvl 1→2 | 420 → 546 | 80 → 104 / splash 2.5→3 | 4.5 → 5.0 | 5,000 Gold |
| Lvl 2→3 | 546 → 710 | 104 → 135 / splash 3→3.5 | 5.0 → 5.5 | 15,000 Gold |

#### Bat (per individual Bat in swarm)
| Tier | Vitality (HP) | Ferocity (Dmg) | Swiftness (Spd) | Cost (each) |
|------|--------------|---------------|----------------|-------------|
| Lvl 1→2 | 75 → 98 | 20 → 26 | 9.0 → 9.8 | 800 Gold |
| Lvl 2→3 | 98 → 127 | 26 → 34 | 9.8 → 10.6 | 2,200 Gold |

#### Ghost
| Tier | Vitality (HP) | Ferocity (Dmg) | Swiftness (Spd) | Cost (each) |
|------|--------------|---------------|----------------|-------------|
| Lvl 1→2 | 190 → 247 | 48 → 62 | 6.0 → 6.6 | 2,000 Gold |
| Lvl 2→3 | 247 → 321 | 62 → 81 | 6.6 → 7.2 | 5,500 Gold |

### 7.3 Upgrade Rules
- Upgrades are **permanent and global** — every future instance of that troop is buffed
- Each category (Vitality / Ferocity / Swiftness) upgrades independently
- Upgrading a category costs Gold and is instant (no build time)
- Requires the corresponding troop to be unlocked (Barracks level prerequisite)
- **Max combined upgrade level per troop:** 8 (3 Vitality + 3 Ferocity + 2 Swiftness)

---

## 8. Defense Buildings

### 8.1 Defense Stats

| Building | HP | Range | Damage/hit | Cooldown | Target | Model |
|----------|----|-------|------------|----------|--------|-------|
| Watch Tower | 900 | 9 | 22 | 1.4s | Ground + Air | WatchTower_SecondAge |
| Archery | 800 | 11 | 18 | 1.2s | Ground (prefer ground) | Archery_SecondAge |
| Barracks (defense) | 1,200 | 4 (melee) | 35 | 2.0s | Ground only | Barracks_SecondAge |
| Wall Tower | 700 | 7 | 20 | 1.5s | Ground + Air | WallTowers_SecondAge |
| Tower House | 1,000 | 6 | 28 | 1.8s | Ground + Air | TowerHouse_SecondAge |
| Temple | 900 | 20 (spawn) | Spawn 4 units | 60–120s | Any in radius | Temple_SecondAge |

### 8.2 Defense Projectiles

| Defense | Projectile | Visual |
|---------|-----------|--------|
| Watch Tower | Arrow | `arrow.glb` |
| Archery | Arrow | `arrow.glb` |
| Wall Tower | Arrow | `arrow.glb` |
| Tower House | Fireball | `fireball.glb` |
| Barracks | Melee (no projectile) | — |

### 8.3 Defense Upgrade Costs (per level)

| Building | Lvl 1→2 Cost | Lvl 2→3 Cost | Effect of Upgrade |
|----------|-------------|-------------|-------------------|
| Watch Tower | 1,500 Gold | 4,500 Gold | +25% damage, +1 range |
| Archery | 1,800 Gold | 5,000 Gold | +25% damage, +15% attack speed |
| Barracks (def) | 2,000 Gold | 6,000 Gold | +30% damage, +1 range |
| Wall Tower | 1,200 Gold | 3,500 Gold | +20% damage, +1 range |
| Tower House | 2,200 Gold | 7,000 Gold | +25% damage, fires 2x fireball |

---

## 9. Spells — Shop Cards

Spells are **single-use consumable cards** deployed during battle. They are purchased from the Market/Shop before battle. Each player can hold a **hand of 5 spell cards** going into battle. Unused cards are retained.

### 9.1 Spell Card List

All spell renders are located in `client/public/spells/Renders/`.

#### Tier 1 Spells (Market Lvl 1)

| # | Spell | Cost | Effect | Duration |
|---|-------|------|--------|---------|
| 1 | **Fireball** | 300 Gold | Deals 200 damage to all units in a 3-unit radius at target point | Instant |
| 2 | **Coin** | 200 Gold | Instantly adds 500 Gold to Storage | Instant |
| 14 | **Block** | 250 Gold | Summons a temporary wall segment at target location (lasts 30s or destroyed) | 30s |
| 15 | **Element: Fire** | 350 Gold | Ignites all ground units in 4-unit radius — deals 30 DPS burn for 5s | 5s |
| 29 | **Element: Earth** | 350 Gold | Creates a rock barrier wall (3 segments) that blocks pathing for 20s | 20s |

#### Tier 2 Spells (Market Lvl 2)

| # | Spell | Cost | Effect | Duration |
|---|-------|------|--------|---------|
| 3 | **Monk** | 400 Gold | Instantly deploys 3 Monks at target location | Instant |
| 4 | **Market** | 450 Gold | Generates 800 Gold + 200 Food over 10 seconds | 10s |
| 5 | **Steal** | 500 Gold | Steals 300 Gold from the nearest enemy Mine buffer | Instant |
| 8 | **Lightning Wizard** | 600 Gold | Deploys a temporary powerful Wizard (2× stats) for 30s | 30s |
| 16 | **Belltowers** | 450 Gold | Stuns all enemy units in 5-unit radius for 3s (no damage) | 3s |
| 17 | **Rebirth** | 700 Gold | Revives the last 3 destroyed friendly troops at 50% HP | Instant |
| 21 | **Element: Lightning** | 500 Gold | Calls a lightning strike — 400 damage to a single target, chains to 2 nearby (150 each) | Instant |
| 22 | **Element: Air** | 400 Gold | Tornado pushes all units in 5-unit radius outward 8 units, interrupting attacks | Instant |
| 23 | **Element: Water** | 400 Gold | Floods target 4×4 area — slows all units inside by 60% for 8s | 8s |
| 26 | **BloodRing** | 550 Gold | All friendly troops in 5-unit radius deal 50% lifesteal for 10s | 10s |

#### Tier 3 Spells (Market Lvl 3)

| # | Spell | Cost | Effect | Duration |
|---|-------|------|--------|---------|
| 2 | **TrenchcoatMushrooms** | 600 Gold | Deploys 5 disguised units that look like mushrooms — attack nearest defense when revealed | 20s |
| 13 | **Sea Monster** | 800 Gold | Summons a Sea Monster at coastal edge — attacks with AoE splash (50 dmg, 4-unit radius) | 45s |
| 15 | **Cult** | 750 Gold | Converts one enemy defense building to fight for you for 20s | 20s |
| 18 | **Water Dragon** | 1,000 Gold | Deploys a Water Dragon (flying) with 600 HP, 100 splash damage for 60s | 60s |
| 24 | **Element: Dark** | 700 Gold | Shrouds a 6×6 area in darkness — defenses in area cannot target troops for 8s | 8s |
| 30 | **Wizard** | 800 Gold | Deploys a permanent Wizard troop at target location for this battle | Battle duration |

### 9.2 Spell Hand Rules
- Max **5 cards** in hand before battle
- Cards are placed in the hand from the Shop (purchased, then slotted)
- During battle, cards are played by clicking a card then clicking the map
- Used cards are consumed (gone after battle)
- Unused cards carry over to the next battle
- Each card can only be in hand **once** (no duplicates per hand slot)

---

## 10. The Shop

The Shop is accessed via the **Market building** on the map. Higher Market level unlocks more items.

### 10.1 Shop Tabs

| Tab | Contents |
|-----|---------|
| **Spells** | All available spell cards (filtered by Market tier) |
| **Buildings** | New buildings to place on map |
| **Upgrades** | Troop upgrade scrolls (Vitality / Ferocity / Swiftness per troop) |
| **Builders** | 2nd Builder slot purchase |

### 10.2 New Buildings from Shop

These buildings are not placed by default — they must be bought from the Shop and placed on the map:

| Building | Cost | Requires | Effect |
|----------|------|---------|--------|
| Windmill | 1,500 Gold | TC Lvl 1 | × 2 Farm food output |
| 2nd Barracks | 3,000 Gold | TC Lvl 3 | Parallel troop training |
| 2nd Storage | 2,000 Gold | TC Lvl 1 | Increased Gold cap |
| Port | 4,000 Gold | TC Lvl 2, Coastal cell | Sea trade income |
| Temple | 3,500 Gold | TC Lvl 2 | Spawns defender units |
| Wonder | 20,000 Gold | TC Lvl 3 | Prestige + win path |
| Extra Wall Pack (×20) | 500 Gold | TC Lvl 1 | Additional wall segments |

> **Note:** Builders are no longer sold in the Shop. They are earned through Houses (see §5.3).

### 10.3 Shop Economy Discount

Market level gives a flat discount on **Spell cards only** (not buildings or upgrades):

| Market Level | Spell Discount |
|-------------|---------------|
| Lvl 1 | 0% |
| Lvl 2 | −10% |
| Lvl 3 | −20% |

---

## 11. Attack System

The attack system is a **Clash of Clans-style synchronous raid**. The attacker deploys troops and spells in real time against a snapshot of the defender's base. The defender is offline during the attack; defenses fight automatically via AI.

---

### 11.1 Pre-Battle Preparation

Before launching an attack the player must:

1. **Fill the army** — Queue troops in Barracks until the desired composition is ready. Troops cost Gold + Food and take time to train. The army is held in the Army Camp (population cap = sum of all House capacities).
2. **Stock a spell hand** — Visit the Shop (Market building) and purchase up to 5 spell cards. Cards sit in the hand until used or the next session.
3. **Check resources** — Collect Mine buffers into Storage. Loot from a raid goes directly into Storage, so having space matters.

| Army Camp Slot Usage | Notes |
|---------------------|-------|
| Each troop occupies 1 slot | Dragon = 1 slot, Bat deploy = 4 slots (swarm) |
| Army resets after every attack | Troops used in battle are consumed; dead troops are lost |
| Untrained troops do not carry over | Queue must be filled before each raid |

---

### 11.2 Finding a Target (Matchmaking)

The player clicks **"Find Attack"** from the main village UI.

- The system shows a **random enemy base** of similar Town Center level
- The player can **scout the base for free** — pan and zoom the enemy map before committing
- If the base looks unfavorable, click **"Next"** to skip to another base (costs **100 Gold** per skip after the first free skip)
- Once the player clicks **"Attack!"** the battle begins and cannot be backed out of

**Matchmaking criteria:**

| Factor | Rule |
|--------|------|
| Town Center level | Match ±1 TC level from attacker |
| Shield status | Shielded bases cannot be matched |
| Same player | Cannot attack own base |
| Recent battles | Same base cannot be matched again within 4 hours |

---

### 11.3 Battle Start & Timer

- A **3-minute battle timer** starts the moment the first troop is deployed
- The player has unlimited time to study the map before deploying the first unit
- When the timer expires, all remaining troops and active spells are removed; the battle ends with whatever stars were earned
- If all buildings are destroyed before the timer, the battle ends immediately with 3 stars

**Battle UI elements:**

| Element | Description |
|---------|-------------|
| Timer bar | Countdown from 3:00, turns red at 0:30 |
| Star indicators | 3 star slots at top — fill as conditions are met |
| Troop tray | Bottom row showing available units to deploy |
| Spell hand | Up to 5 card slots, click to activate then click map to cast |
| Loot counter | Live running total of Gold looted so far |

---

### 11.4 Troop Deployment

Troops are deployed by clicking/tapping along the **perimeter edge** of the enemy map. Ground troops cannot be placed inside the base.

**Deployment rules:**

| Rule | Detail |
|------|--------|
| Deployment zone | Any cell on the outer 2-cell border of the playable grid |
| Deploy order | Click troop in tray → click target cell on map |
| Batch deploy | Hold and drag to place multiple of the same troop along a line |
| No recall | Troops cannot be retrieved once placed |
| Troop AI takes over | After placement troops act autonomously per their targeting logic (see §6.2) |
| Flying troops | Can be deployed anywhere on the perimeter edge, ignore walls |
| Ground troops | Enter from deployment point, pathfind around walls |

**Deployment strategy tips (embedded in game as hints):**

- Deploy tanks (Warriors, Dragon) first to soak defense fire, then deploy DPS troops behind them
- Funnel troops through a gap — destroy two buildings at the corners first to channel the army inward
- Use Rogues or Bats to distract single-target defenses while heavy troops push through
- Deploy Cleric behind the frontline so it heals without being targeted first
- Flying troops (Dragon, Ghost, Bat) skip walls entirely — send them at the Town Center directly

---

### 11.5 Spell Usage During Battle

Spells are cast from the **spell hand** (bottom-right HUD) while the battle is running.

| Step | Action |
|------|--------|
| 1 | Click a spell card in your hand to select it |
| 2 | A targeting reticle appears on the map |
| 3 | Move reticle to desired location, click to cast |
| 4 | Card is consumed immediately on cast |
| 5 | Effect resolves (instant or timed per spell definition) |

- Spells can target **anywhere on the enemy map** (not restricted to perimeter)
- Spells cannot be cancelled after the cast click
- AoE spells (Fireball, Elements) hit both enemy units and friendly troops in range — friendly fire is live

---

### 11.6 Looting System

Loot is the primary incentive for attacking. It is stolen from the **defender's stored resources**.

#### Loot Pool Calculation

| Source | Lootable Amount |
|--------|----------------|
| Each Gold Mine buffer | Up to **50%** of the gold currently sitting uncollected in the mine |
| Each Storage building | Up to **30%** of the gold currently held in that storage |
| Town Center vault | **0%** — Town Center gold is never lootable |

> Example: Defender has 2 Mines each holding 3,000 Gold, and 1 Storage with 20,000 Gold.  
> Loot pool = (3,000 × 50%) + (3,000 × 50%) + (20,000 × 30%) = 1,500 + 1,500 + 6,000 = **9,000 Gold total available**

#### Loot Earned Per Building Destroyed

Loot is granted **incrementally** as resource buildings are destroyed — not as a lump sum at the end.

| Building Destroyed | Loot Granted |
|-------------------|-------------|
| Gold Mine | 100% of that mine's loot share |
| Storage | 100% of that storage's loot share |
| Any non-resource building | 0 Gold loot (no loot from defenses, houses, etc.) |

This means an attacker can earn partial loot by destroying only the resource buildings, even if they fail to 3-star.

#### Loot Scale by Star Rating

The **final loot received** is multiplied by star rating after the battle:

| Stars | Loot Multiplier |
|-------|----------------|
| 0 Stars | 0% — no loot (attack failed) |
| 1 Star | 30% of loot pool |
| 2 Stars | 60% of loot pool |
| 3 Stars | 100% of loot pool |

> The building-destroyed incremental loot and the star multiplier interact: you earn loot as buildings fall, but the final payout is capped at the star tier. If you destroy both Storages (earning their loot share) but only achieve 1 star, you still only receive 30% of the total pool.

#### Loot Cap & Storage Overflow

- Looted Gold is added directly to the **attacker's Storage**
- If attacker's Storage is full, excess loot is lost — always ensure Storage has room before raiding
- The attacker's **Storage capacity** is not changed by the raid; only the defender's holdings are reduced

---

### 11.7 Post-Battle Report

After the battle ends (timer expires or all buildings destroyed), a **Battle Report** screen is shown:

| Field | Description |
|-------|-------------|
| Stars earned | 0 / 1 / 2 / 3 stars with animated reveal |
| % destruction | Exact percentage of buildings destroyed |
| Gold looted | Total Gold transferred to attacker's Storage |
| Troops used | Roster of troops deployed (consumed) |
| Replay button | Watch full replay of the battle |

The defender receives a **Defense Report** the next time they log in, showing:
- Who attacked (player name)
- Stars earned by attacker
- Loot taken
- Replay of the attack

---

### 11.8 Attack Cooldown & Shield System

| State | Duration | Effect |
|-------|----------|--------|
| Post-raid shield (defender) | 12 hours | Defender cannot be attacked by anyone |
| Emergency shield trigger | Activates if Town Center HP drops below 20% during defense | Grants 4-hour shield even if attacker retreats |
| Attacker cooldown | None | Attacker can attack again immediately after battle report |
| Nexted base cooldown | 4 hours | Same base won't appear in matchmaking for 4 hours |

**Shield break rule:** If the shielded player **launches an attack**, their shield is immediately removed. Shields only protect passive offline bases.

---

### 11.9 Attack Strategy Reference

Quick reference for common attack compositions:

| Strategy | Troops | Spells | Goal |
|----------|--------|--------|------|
| **Warrior Rush** | 20 Warriors + 10 Monks + 5 Clerics | Fireball × 2, Rebirth | Brute-force 1-2 star, tank through defenses |
| **Dragon Blitz** | 5 Dragons + 10 Bats | Lightning Wizard, Element: Dark | Fast 3-star vs under-defended bases |
| **Rogue Snipe** | 15 Rogues + 5 Rangers | Steal × 2, Element: Fire | Loot-focused — destroy Mines/Storages only |
| **Ghost Raid** | 10 Ghosts + 8 Rangers + 4 Wizards | Element: Dark, Belltowers | Flank over walls, disable defenses with darkness |
| **Spell Spam** | 5 Warriors (distraction) | Sea Monster, Water Dragon, Fireball ×3 | Spell-heavy nuke run on clustered defenses |

---

## 12. Win & Loss Conditions

### 12.1 Attacking (Raid Mode)

| Stars | Condition |
|-------|-----------|
| 1 Star | Destroy the Town Center |
| 2 Stars | Destroy 50% of all buildings |
| 3 Stars | Destroy 100% of all buildings |

**Loot earned scales with stars:** 1★ = 30% loot, 2★ = 60% loot, 3★ = 100% loot of the available pool.

Available loot pool = 50% of Mine buffers + 30% of each Storage.

### 12.2 Defending

- Player receives a battle report showing which buildings were destroyed, who attacked, and how much loot was taken
- A **Shield** is applied for 12 hours after being raided (no one can attack during shield)
- The Town Center can trigger an emergency shield if HP drops below 20%

### 12.3 Wonder Victory (Campaign/PvE mode)

If the player builds and defends a Lvl 2 Wonder for **10 consecutive minutes** in a single defense session, they win the campaign chapter.

---

## 13. Progression Loop Summary

```
[Passive Income Loop]
Mines + Port → Gold → Storage (capped)
                          ↓
              Spend on Upgrades / Buildings / Troops

[Battle Loop]
Train Troops → Pick Spells from Shop → Attack Enemy Base
      ↓
  Earn Loot → Back to Storage → Fund Upgrades

[Upgrade Loop]
Town Center Lvl → Unlocks Buildings → Unlocks Troop Tiers
                        ↓
              Building Upgrades → Better Income / Defense
                        ↓
              Troop Scrolls → Permanent Stat Gains
                        ↓
              Higher-Tier Spells → Tactical Depth

[Endgame]
Wonder Built → Defend for 10 minutes → Chapter Victory
        or
Max all buildings + troops → Full 3-star raids → Leaderboard
```

### 13.1 Session Rhythm (Typical Play)

1. **Open game** → Collect Mine buffers
2. **Check Builder** → Start/complete upgrade
3. **Queue troops** in Barracks
4. **Visit Shop** → Buy spell cards for hand
5. **Launch raid** → Deploy troops + spells → earn loot
6. **Return loot** to Storage → queue next upgrade
7. **Log off** → Mines accumulate passively

This loop is designed to work in 5–10 minute active sessions with passive income bridging offline time.

---

---

## 14. Battle Mode — Stake & Fight

Battle Mode is the live PvP system where two players wager real currency, deploy armies in formation, and fight in a shared arena until one side is eliminated.

---

### 14.1 Overview

| Property | Detail |
|----------|--------|
| Players | 2 (direct challenge or open matchmaking) |
| Stake | Both players stake equal amounts of SOL |
| Winner payout | 95% of total pot (5% protocol fee) |
| Battlefield | Neutral arena — not either player's village |
| Mode | Synchronous, both players active simultaneously |
| Army source | Pre-trained troops from the player's Barracks queue |
| Duration | Up to 5 minutes; if timer expires, side with most surviving troops wins |

---

### 14.2 Pre-Battle Lobby

After both players accept the challenge:

1. **Stake confirmation** — Both players sign an on-chain transaction locking their agreed stake into a smart contract escrow. Neither player can back out once funds are locked.
2. **Army selection** — Each player selects which troops from their trained army to bring. The army must be pre-trained (no training happens in the lobby). Troops chosen here are **consumed** win or lose.
3. **Spell hand** — Each player selects up to 5 spell cards from their hand. Same cards as Raid Mode.
4. **Formation phase** — 60-second window to arrange troops on the formation grid (see §14.3).

---

### 14.3 Formation System

Before the battle starts, each player arranges their army on their half of the battlefield using a **formation grid**. The grid is 10 × 6 cells per player side.

#### Formation Rows

| Row | Name | Distance from front line | Notes |
|-----|------|--------------------------|-------|
| 1 (front) | Vanguard | 0 units | Takes first contact — best for Warriors, Monks |
| 2 | Midline | 3 units | Support troops — Rogues, Rangers |
| 3 | Backline | 6 units | Ranged + healers — Wizards, Clerics, Rangers |
| 4 (rear) | Reserve | 9 units | Troops held back for manual reinforcement spawning |

#### Formation Columns

The battlefield is 10 cells wide. Players can split their formation into:
- **Left Flank** (cols 1–3)
- **Center** (cols 4–7)
- **Right Flank** (cols 8–10)

Flying troops (Dragon, Ghost, Bat) are placed on a separate **Air Lane** layer above the grid and fly over ground formations.

#### Named Formation Presets

Players can save and load named presets:

| Preset Name | Description |
|-------------|-------------|
| **Phalanx** | Warriors and Monks packed tightly in Vanguard, Clerics in Midline |
| **Arrow** | Narrow center spike — Rangers and Rogues flanked by Warriors |
| **Split Flank** | Two mirrored pushes on left and right, empty center |
| **Sky Hammer** | All flying units in Air Lane, minimal ground as distraction |
| **Balanced** | Even spread across all rows and columns |

> Custom formations can be built freely within the grid during the 60-second window. Named presets are just starting points.

---

### 14.4 Battle Start

When the formation timer expires, both armies advance simultaneously toward the center dividing line.

**Engagement rules:**
- Ground troops march forward from their row position and engage the first enemy they reach
- Flying troops move at full speed toward the enemy backline first
- Clerics heal nearest friendly troops within range
- Troops target enemies using the same AI logic as Raid Mode (see §6.2)
- No walls or base structures on the battlefield — pure open-field combat

---

### 14.5 Reinforcement Spawning

Players do not just watch — they actively spawn reinforcements throughout the battle from their **Reserve Pool**.

#### Reserve Pool

The Reserve Pool is the portion of the player's trained army **not placed on the initial formation grid**. Players deliberately hold troops back in the Reserve section during formation to use as mid-battle reinforcements.

| Rule | Detail |
|------|--------|
| Reserve cap | Up to 40% of your total army can be held in reserve |
| Spawn location | Player's own spawn edge (behind their backline) |
| Spawn cost | 0 Gold — troops were already trained. Deploying is free. |
| Spawn rate limit | Max 8 troops per 10-second window (anti-spam) |
| Army population limit | Total troops on field + reserve cannot exceed your House population cap |

**Spawn mechanic:**
1. Click a troop type from the reserve tray (bottom HUD)
2. Click a position on your own side of the battlefield to spawn
3. Troop enters the field and immediately advances

Flying units can be spawned anywhere on the player's air lane.

#### Strategic Use of Reserves

- Hold Dragon and Wizard in reserve — deploy once enemy frontline is thinned
- Spawn Clerics mid-battle when your Vanguard is taking heavy damage
- Counter-spawn Bats to distract enemy Dragons threatening your backline

---

### 14.6 Spell Usage in Battle Mode

Spell casting works identically to Raid Mode (§11.5) with one difference: **spells can target anywhere on the battlefield**, including the enemy formation and your own side (for support spells like Rebirth or BloodRing).

Friendly fire is active — Fireball and Element spells hit your own troops if cast carelessly.

---

### 14.7 Victory Conditions

| Condition | Winner |
|-----------|--------|
| All enemy troops eliminated | Player with surviving troops |
| Timer expires (5 minutes) | Player with more troops alive (HP-weighted count) |
| Both sides wipe simultaneously | Draw — both stakes refunded |

On a Draw, the smart contract returns both stakes in full (no fee charged).

---

### 14.8 Stake & Payout (On-Chain)

Battle Mode is backed by a Solana smart contract that holds stakes and distributes the payout.

#### Stake Flow

```
Player A signs → locks X SOL into escrow
Player B signs → locks X SOL into escrow
       ↓
   Battle runs (off-chain simulation, result hash submitted)
       ↓
   Smart contract verifies result signature from game server
       ↓
  Winner receives 0.95 × (2X SOL)
  Protocol treasury receives 0.05 × (2X SOL)
```

#### Stake Tiers (Suggested Lobbies)

| Tier | Stake | Payout to winner |
|------|-------|-----------------|
| Practice | 0.01 SOL | 0.019 SOL |
| Standard | 0.1 SOL | 0.19 SOL |
| High Stakes | 1 SOL | 1.9 SOL |
| Whale | Custom (min 1 SOL, max 100 SOL) | 1.9× stake |

> Practice tier uses the same code path and smart contract — it is not a simulation. Results are final.

#### Anti-Cheat

- Battle result is computed server-side and signed with the game server's private key
- Smart contract only releases funds on receipt of a valid signed result
- Players cannot manipulate outcome through client modification
- Disputes (disconnect, server error): if either player disconnects for >30 seconds with no reconnect, the remaining player is awarded the win and payout

---

### 14.9 Battle Mode Matchmaking

Players can enter Battle Mode in two ways:

| Method | Detail |
|--------|--------|
| **Open Challenge** | Post a challenge at any stake tier — any player of similar TC level can accept |
| **Direct Challenge** | Invite a specific player by wallet address or in-game name |

Matchmaking filter: TC level ±1 (same as Raid Mode). Players outside this range cannot join your open challenge.

---

### 14.10 Post-Battle Report (Battle Mode)

After the battle ends:

| Field | Description |
|-------|-------------|
| Winner / Loser | Large result card |
| Troops lost (both sides) | Side-by-side comparison |
| Spells cast | List of cards played |
| SOL transferred | Amount won or lost |
| Transaction link | Solana Explorer link to payout tx |
| Replay button | Watch full battle replay |

Troops consumed in Battle Mode are **permanently gone** — the same as Raid Mode. Spells used are consumed. Players must re-train and re-stock before their next Battle.

---

### 14.11 Battle Mode in the Progression Loop

```
[Battle Mode Loop]
Train Troops → Pick Formation + Spells → Find/Accept Challenge
        ↓
  Stake SOL (on-chain escrow)
        ↓
  Formation Phase (60s) → Battle (up to 5min)
  Spawn reinforcements mid-battle, cast spells
        ↓
  Win → 1.9× SOL payout → Fund village upgrades
  Lose → SOL gone → Train new army → Rematch
```

Battle Mode creates a second high-variance economy track alongside Raid Mode:
- Raid Mode = steady incremental gold income with low downside risk
- Battle Mode = high-risk high-reward SOL swings, requires a strong trained army

Both tracks share the same troops, Houses (army cap), Barracks (training), and spell system — Battle Mode is not a separate game mode but a natural extension of the base-building loop.

---

*End of Game Design Document*
