export type Screen = "base" | "raid" | "inventory" | "leaderboard" | "log"

export type ActionType = "attack" | "guard" | "special" | "recover"

export type Difficulty = "Easy" | "Medium" | "Boss"

export type Rarity = "Common" | "Rare" | "Epic" | "Legendary"

export type GearSlot = "weapon" | "charm" | "relic"

export type LootItem = {
  id: string
  name: string
  slot: GearSlot
  rarity: Rarity
  power: number
  description: string
}

export type RaidDefinition = {
  id: string
  name: string
  enemyName: string
  difficulty: Difficulty
  synopsis: string
  theme: string
  ticketCost: number
  energyCost: number
  enemyMaxHp: number
  rewardRange: [number, number]
  xpReward: number
  bossModifier: string
  lootTable: LootItem[]
}

export type ActivityEntry = {
  id: string
  title: string
  detail: string
  timestamp: string
  tone: "success" | "warning" | "neutral"
}

export type RaidTranscriptEntry = {
  id: string
  speaker: "player" | "system" | "enemy"
  message: string
}

export type AutoSigningState = {
  enabled: boolean
  pending: boolean
  lastAction: ActionType | null
  message: string
}

export type RaidSession = {
  raidId: string
  enemyName: string
  enemyHp: number
  enemyMaxHp: number
  turn: number
  actionsUsed: number
  status: "active" | "won" | "lost"
  transcript: RaidTranscriptEntry[]
  rewardCoins: number
  rewardXp: number
  rewardItem: LootItem | null
  autoSigning: AutoSigningState
}

export type PlayerProfile = {
  username: string | null
  level: number
  xp: number
  xpToNext: number
  hp: number
  maxHp: number
  energy: number
  maxEnergy: number
  tickets: number
  coins: number
  bridgeBalance: number
  winStreak: number
  totalLootValue: number
  faction: string
  gear: Partial<Record<GearSlot, string>>
}

export type NativeFeatureStatus = {
  autoSigningArmed: boolean
  usernamesBound: boolean
  bridgeConnected: boolean
}

export type LeaderboardEntry = {
  id: string
  username: string
  score: number
  streak: number
  totalLoot: number
  faction: string
  highlight?: boolean
}
