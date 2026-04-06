import { parseAbi } from "viem"

export const raidClubAbi = parseAbi([
  "function TICKET_PRICE() view returns (uint256)",
  "function register()",
  "function buyTickets(uint32 quantity) payable",
  "function startRaid(uint8 raidType)",
  "function performAction(uint8 actionType)",
  "function getProfile(address player) view returns (bool registered, uint32 level, uint32 xp, uint32 xpToNext, uint32 maxHp, uint32 maxEnergy, uint32 energy, uint32 tickets, uint64 coins, uint32 winStreak, uint64 totalLootValue, uint16 weaponPower, uint16 charmPower, uint16 relicPower)",
  "function getActiveSession(address player) view returns (bool active, uint8 raidType, uint8 turn, uint8 actionsUsed, uint32 enemyHp, uint32 enemyMaxHp, uint32 playerHp)",
  "function getLastOutcome(address player) view returns (bool exists, bool won, uint8 raidType, uint64 coins, uint32 xp, uint8 slot, uint16 power, uint8 rarity, uint64 score, uint64 totalLootValue)",
  "function getLeaderboard() view returns (address[] players, uint32[] levels, uint32[] streaks, uint64[] totalLootValues, uint64[] scores)",
])

export const RAID_TICKET_PRICE_WEI = BigInt("2000000000000000")
