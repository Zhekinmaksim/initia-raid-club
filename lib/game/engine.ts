import { raidDefinitions } from "./data"
import type { ActionType, LootItem, PlayerProfile, RaidDefinition, RaidSession } from "./types"

const actionLabels: Record<ActionType, string> = {
  attack: "Attack",
  guard: "Guard",
  special: "Special",
  recover: "Recover",
}

export function getRaidDefinition(raidId: string) {
  return raidDefinitions.find((raid) => raid.id === raidId)
}

export function getGearBonus(player: PlayerProfile, inventory: LootItem[]) {
  return Object.values(player.gear).reduce((total, gearId) => {
    const gear = inventory.find((item) => item.id === gearId)

    return total + (gear?.power ?? 0)
  }, 0)
}

export function createRaidSession(raid: RaidDefinition): RaidSession {
  return {
    raidId: raid.id,
    enemyName: raid.enemyName,
    enemyHp: raid.enemyMaxHp,
    enemyMaxHp: raid.enemyMaxHp,
    turn: 1,
    actionsUsed: 0,
    status: "active",
    rewardCoins: 0,
    rewardXp: 0,
    rewardItem: null,
    transcript: [
      {
        id: crypto.randomUUID(),
        speaker: "system",
        message: `${raid.name} opened. ${raid.bossModifier}`,
      },
    ],
    autoSigning: {
      enabled: true,
      pending: false,
      lastAction: null,
      message: "Auto-signing armed for rapid raid actions.",
    },
  }
}

export function resolveRaidTurn(
  raid: RaidDefinition,
  session: RaidSession,
  player: PlayerProfile,
  inventory: LootItem[],
  action: ActionType,
): { nextSession: RaidSession; nextPlayerHp: number } {
  const gearBonus = getGearBonus(player, inventory)
  const isNightglassDemo = raid.id === "eclipse-altar"
  const actionPower = isNightglassDemo
    ? {
        attack: 24 + Math.ceil(gearBonus * 0.45),
        guard: 14 + Math.ceil(gearBonus * 0.25),
        special: 38 + Math.ceil(gearBonus * 0.65),
        recover: 8,
      }[action]
    : {
        attack: 16 + Math.ceil(gearBonus * 0.45),
        guard: 10 + Math.ceil(gearBonus * 0.2),
        special: 24 + Math.ceil(gearBonus * 0.55),
        recover: 8,
      }[action]
  const playerHeal = action === "recover" ? 12 + Math.ceil(gearBonus * 0.15) : 0
  const enemyBase = raid.difficulty === "Boss" ? 18 : raid.difficulty === "Medium" ? 12 : 8
  const enemyDamage = Math.max(
    4,
    enemyBase +
      session.turn * 2 -
      (action === "guard" ? (isNightglassDemo ? 11 : 7) : 0) -
      (action === "recover" ? 2 : 0),
  )
  const enemyHp = Math.max(0, session.enemyHp - actionPower)
  const nextHp = Math.min(player.maxHp, player.hp - enemyDamage + playerHeal)
  const actionsUsed = session.actionsUsed + 1
  const turn = session.turn + 1
  const transcript: RaidSession["transcript"] = [
    ...session.transcript,
    {
      id: crypto.randomUUID(),
      speaker: "player" as const,
      message: `${actionLabels[action]} lands for ${actionPower} damage.`,
    },
    {
      id: crypto.randomUUID(),
      speaker: action === "recover" ? ("system" as const) : ("enemy" as const),
      message:
        action === "recover"
          ? `Recovery injects ${playerHeal} HP while ${raid.enemyName} still clips you for ${enemyDamage}.`
          : `${raid.enemyName} answers for ${enemyDamage} damage.`,
    },
  ]

  const victory = enemyHp <= 0
  const defeat = !victory && (nextHp <= 0 || actionsUsed >= 5)
  const rewardCoins = victory ? computeRewardCoins(raid, actionsUsed) : 0
  const rewardXp = victory ? raid.xpReward : Math.max(8, Math.floor(raid.xpReward / 4))
  const rewardItem = victory ? selectLoot(raid, actionsUsed) : null
  const status: RaidSession["status"] = victory ? "won" : defeat ? "lost" : "active"
  const finalTranscript: RaidSession["transcript"] =
    status === "active"
      ? transcript
      : [
          ...transcript,
          {
            id: crypto.randomUUID(),
            speaker: "system",
            message:
              status === "won"
                ? `Raid clear secured. Vault pays ${rewardCoins} coins and ${rewardXp} XP.`
                : `Raid collapsed after ${actionsUsed} actions. Retreat and queue another run.`,
          },
        ]

  return {
    nextSession: {
      ...session,
      enemyHp,
      turn,
      actionsUsed,
      status,
      rewardCoins,
      rewardXp,
      rewardItem,
      transcript: finalTranscript,
      autoSigning: {
        enabled: true,
        pending: false,
        lastAction: action,
        message:
          status === "active"
            ? `Auto-signed ${actionLabels[action]}. Queue the next move.`
            : status === "won"
              ? "Raid settled onchain. Claiming rewards into your profile."
              : "Auto-signing halted after raid failure.",
      },
    },
    nextPlayerHp: Math.max(0, nextHp),
  }
}

export function applyProgression(player: PlayerProfile, xpGained: number) {
  let xp = player.xp + xpGained
  let xpToNext = player.xpToNext
  let level = player.level

  while (xp >= xpToNext) {
    xp -= xpToNext
    level += 1
    xpToNext = Math.round(xpToNext * 1.18)
  }

  return { xp, xpToNext, level }
}

function computeRewardCoins(raid: RaidDefinition, actionsUsed: number) {
  const [min, max] = raid.rewardRange
  const efficiencyBonus = Math.max(0, 6 - actionsUsed) * 3

  return max - 6 + efficiencyBonus > max ? max : min + efficiencyBonus
}

function selectLoot(raid: RaidDefinition, actionsUsed: number) {
  const index = Math.min(raid.lootTable.length - 1, Math.max(0, actionsUsed - 2))

  return raid.lootTable[index]
}
