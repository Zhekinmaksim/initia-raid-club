import type { ActivityEntry, LeaderboardEntry, LootItem, RaidDefinition } from "./types"

const emberfangBlade: LootItem = {
  id: "emberfang-blade",
  name: "Emberfang Blade",
  slot: "weapon",
  rarity: "Rare",
  power: 8,
  description: "A heat-etched saber that turns clean hits into finishing blows.",
}

const tidecallSigil: LootItem = {
  id: "tidecall-sigil",
  name: "Tidecall Sigil",
  slot: "charm",
  rarity: "Epic",
  power: 10,
  description: "A charm that softens boss strikes and bumps payout.",
}

const voidglassTotem: LootItem = {
  id: "voidglass-totem",
  name: "Voidglass Totem",
  slot: "relic",
  rarity: "Legendary",
  power: 14,
  description: "A relic pulled from the breach, still warm from the daily boss.",
}

const ashloopDagger: LootItem = {
  id: "ashloop-dagger",
  name: "Ashloop Dagger",
  slot: "weapon",
  rarity: "Common",
  power: 4,
  description: "Compact steel for short runs and quick clears.",
}

const echoTonic: LootItem = {
  id: "echo-tonic",
  name: "Echo Tonic",
  slot: "charm",
  rarity: "Rare",
  power: 6,
  description: "A tonic that gives some stamina back after a clean run.",
}

export const raidDefinitions: RaidDefinition[] = [
  {
    id: "reef-run",
    name: "Reef Run",
    enemyName: "Coral Marauder",
    difficulty: "Easy",
    synopsis: "Easy run for coins and streaks.",
    theme: "Azure Reef",
    ticketCost: 1,
    energyCost: 12,
    enemyMaxHp: 52,
    rewardRange: [22, 36],
    xpReward: 30,
    bossModifier: "Current drift boosts critical attack damage.",
    lootTable: [ashloopDagger, echoTonic],
  },
  {
    id: "forge-surge",
    name: "Forge Surge",
    enemyName: "Brass Hydra",
    difficulty: "Medium",
    synopsis: "Medium run with better drop odds.",
    theme: "Molten Foundry",
    ticketCost: 1,
    energyCost: 18,
    enemyMaxHp: 80,
    rewardRange: [34, 56],
    xpReward: 48,
    bossModifier: "Heat spikes punish slow turns but reward aggressive specials.",
    lootTable: [emberfangBlade, tidecallSigil],
  },
  {
    id: "eclipse-altar",
    name: "Eclipse Altar",
    enemyName: "Nightglass Warden",
    difficulty: "Boss",
    synopsis: "Daily boss run. Short and punishing.",
    theme: "Black Halo Citadel",
    ticketCost: 2,
    energyCost: 24,
    enemyMaxHp: 104,
    rewardRange: [64, 92],
    xpReward: 78,
    bossModifier: "The warden changes stance every turn, favoring guarded counterplay.",
    lootTable: [tidecallSigil, voidglassTotem],
  },
]

export const starterInventory: LootItem[] = [
  {
    id: "rookie-axe",
    name: "Rookie Breach Axe",
    slot: "weapon",
    rarity: "Common",
    power: 3,
    description: "Starter steel for your first run.",
  },
  {
    id: "signal-band",
    name: "Signal Band",
    slot: "charm",
    rarity: "Common",
    power: 2,
    description: "Keeps your faction mark stable between runs.",
  },
]

export const starterActivity: ActivityEntry[] = [
  {
    id: "seed-1",
    title: "Bridge primed",
    detail: "Mock bridge loaded with 40 INIT for the demo.",
    timestamp: "Just now",
    tone: "neutral",
  },
  {
    id: "seed-2",
    title: "Daily boss online",
    detail: "Nightglass Warden is live with a guarded-counter stance.",
    timestamp: "6m ago",
    tone: "warning",
  },
]

export const rivalLeaderboard: LeaderboardEntry[] = [
  {
    id: "scarlet",
    username: "scarlet.raid",
    score: 1280,
    streak: 7,
    totalLoot: 412,
    faction: "Red Wake",
  },
  {
    id: "hexa",
    username: "hexa.init",
    score: 1170,
    streak: 5,
    totalLoot: 364,
    faction: "Frost Relay",
  },
  {
    id: "morrow",
    username: "morrow.loop",
    score: 1098,
    streak: 4,
    totalLoot: 338,
    faction: "Dusk Choir",
  },
]
