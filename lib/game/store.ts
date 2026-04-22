"use client"

import { create } from "zustand"
import { rivalLeaderboard, starterActivity, starterInventory } from "./data"
import { applyProgression, createRaidSession, getRaidDefinition, resolveRaidTurn } from "./engine"
import type {
  ActionType,
  ActivityEntry,
  LeaderboardEntry,
  LootItem,
  NativeFeatureStatus,
  PlayerProfile,
  RaidSession,
  Screen,
} from "./types"

type GameState = {
  screen: Screen
  player: PlayerProfile
  inventory: LootItem[]
  raidSession: RaidSession | null
  activity: ActivityEntry[]
  nativeFeatures: NativeFeatureStatus
  setScreen: (screen: Screen) => void
  bindUsername: (username: string) => void
  mockBridgeIn: (amount?: number) => void
  mintRaidTicket: () => void
  startRaid: (raidId: string) => void
  performRaidAction: (action: ActionType) => void
  returnToBase: () => void
  equipItem: (itemId: string) => void
  resetDemo: () => void
}

const initialPlayer = (): PlayerProfile => ({
  username: null,
  level: 3,
  xp: 40,
  xpToNext: 120,
  hp: 96,
  maxHp: 100,
  energy: 74,
  maxEnergy: 100,
  tickets: 2,
  coins: 128,
  bridgeBalance: 40,
  winStreak: 2,
  totalLootValue: 54,
  faction: "Obsidian Wake",
  gear: {
    weapon: "rookie-axe",
    charm: "signal-band",
  },
})

const demoPresetPlayer = (): PlayerProfile => ({
  ...initialPlayer(),
  username: "nightglass.raider",
  hp: 100,
  energy: 100,
  tickets: 3,
  bridgeBalance: 30,
})

const demoPresetActivity = (): ActivityEntry[] => [
  {
    id: crypto.randomUUID(),
    title: "Demo preset ready",
    detail: "Nightglass Warden route is primed for a clean recording pass.",
    timestamp: "Now",
    tone: "success",
  },
  {
    id: crypto.randomUUID(),
    title: "Username claimed",
    detail: "nightglass.raider is bound and ready for the featured boss run.",
    timestamp: "Now",
    tone: "success",
  },
  ...starterActivity,
]

export const buildMockLeaderboard = (player: PlayerProfile): LeaderboardEntry[] =>
  [
    {
      id: "player",
      username: player.username ?? "unclaimed.raider",
      score: player.level * 220 + player.winStreak * 30 + player.totalLootValue,
      streak: player.winStreak,
      totalLoot: player.totalLootValue,
      faction: player.faction,
      highlight: true,
    },
    ...rivalLeaderboard,
  ].sort((left, right) => right.score - left.score)

export const useRaidClubStore = create<GameState>((set, get) => ({
  screen: "base",
  player: initialPlayer(),
  inventory: starterInventory,
  raidSession: null,
  activity: starterActivity,
  nativeFeatures: {
    autoSigningArmed: true,
    usernamesBound: false,
    bridgeConnected: true,
  },
  setScreen: (screen) => set({ screen }),
  bindUsername: (username) => {
    const value = username.trim()

    if (!value) {
      return
    }

    set((state) => ({
      player: { ...state.player, username: value },
      nativeFeatures: { ...state.nativeFeatures, usernamesBound: true },
      activity: [
        {
          id: crypto.randomUUID(),
          title: "Username claimed",
          detail: `${value} is now broadcasting across the raid board.`,
          timestamp: "Now",
          tone: "success",
        },
        ...state.activity,
      ],
    }))
  },
  mockBridgeIn: (amount = 25) =>
    set((state) => ({
      player: {
        ...state.player,
        bridgeBalance: state.player.bridgeBalance + amount,
      },
      activity: [
        {
          id: crypto.randomUUID(),
          title: "Bridge settled",
          detail: `${amount} INIT routed into the raid chain without leaving the app.`,
          timestamp: "Now",
          tone: "success",
        },
        ...state.activity,
      ],
    })),
  mintRaidTicket: () =>
    set((state) => {
      if (state.player.bridgeBalance < 10) {
        return {
          activity: [
            {
              id: crypto.randomUUID(),
              title: "Ticket mint blocked",
              detail: "Top up through the bridge before minting another ticket.",
              timestamp: "Now",
              tone: "warning",
            },
            ...state.activity,
          ],
        }
      }

      return {
        player: {
          ...state.player,
          tickets: state.player.tickets + 1,
          bridgeBalance: state.player.bridgeBalance - 10,
        },
        activity: [
          {
            id: crypto.randomUUID(),
            title: "Raid ticket minted",
            detail: "10 INIT converted into one fresh raid pass.",
            timestamp: "Now",
            tone: "success",
          },
          ...state.activity,
        ],
      }
    }),
  startRaid: (raidId) =>
    set((state) => {
      const raid = getRaidDefinition(raidId)

      if (!raid) {
        return state
      }

      if (!state.player.username) {
        return {
          screen: "base",
          activity: [
            {
              id: crypto.randomUUID(),
              title: "Username required",
              detail: "Bind a username before entering the next raid.",
              timestamp: "Now",
              tone: "warning",
            },
            ...state.activity,
          ],
        }
      }

      if (state.player.energy < raid.energyCost || state.player.tickets < raid.ticketCost) {
        return {
          activity: [
            {
              id: crypto.randomUUID(),
              title: "Raid locked",
              detail: "Not enough energy or tickets for that run.",
              timestamp: "Now",
              tone: "warning",
            },
            ...state.activity,
          ],
        }
      }

      return {
        screen: "raid",
        player: {
          ...state.player,
          energy: state.player.energy - raid.energyCost,
          tickets: state.player.tickets - raid.ticketCost,
        },
        raidSession: createRaidSession(raid),
        activity: [
          {
            id: crypto.randomUUID(),
            title: "Raid deployed",
            detail: `${raid.name} opened with auto-signing active.`,
            timestamp: "Now",
            tone: "neutral",
          },
          ...state.activity,
        ],
      }
    }),
  performRaidAction: (action) => {
    const current = get()

    if (!current.raidSession || current.raidSession.status !== "active" || current.raidSession.autoSigning.pending) {
      return
    }

    set((state) => ({
      raidSession: state.raidSession
        ? {
            ...state.raidSession,
            autoSigning: {
              ...state.raidSession.autoSigning,
              pending: true,
              lastAction: action,
              message: `Auto-signing ${action} and broadcasting to the raid chain...`,
            },
          }
        : null,
    }))

    window.setTimeout(() => {
      set((state) => {
        if (!state.raidSession) {
          return state
        }

        const raid = getRaidDefinition(state.raidSession.raidId)

        if (!raid) {
          return state
        }

        const resolution = resolveRaidTurn(raid, state.raidSession, state.player, state.inventory, action)
        const session = resolution.nextSession

        if (session.status === "active") {
          return {
            raidSession: session,
            player: {
              ...state.player,
              hp: resolution.nextPlayerHp,
            },
          }
        }

        const nextHp = session.status === "won" ? Math.min(state.player.maxHp, resolution.nextPlayerHp + 10) : state.player.maxHp
        const progression = applyProgression(state.player, session.rewardXp)
        const rewardInventory = session.rewardItem ? [session.rewardItem, ...state.inventory] : state.inventory
        const totalLootValue = state.player.totalLootValue + (session.rewardItem?.power ?? 0) * 6 + session.rewardCoins

        return {
          raidSession: session,
          inventory: rewardInventory,
          player: {
            ...state.player,
            hp: nextHp,
            coins: state.player.coins + session.rewardCoins,
            level: progression.level,
            xp: progression.xp,
            xpToNext: progression.xpToNext,
            winStreak: session.status === "won" ? state.player.winStreak + 1 : 0,
            totalLootValue,
          },
          activity: [
            {
              id: crypto.randomUUID(),
              title: session.status === "won" ? "Raid cleared" : "Raid failed",
              detail:
                session.status === "won"
                  ? `${raid.name} paid ${session.rewardCoins} coins${session.rewardItem ? ` and ${session.rewardItem.name}` : ""}.`
                  : `${raid.name} reset after five actions. Re-arm and try again.`,
              timestamp: "Now",
              tone: session.status === "won" ? "success" : "warning",
            },
            ...state.activity,
          ],
        }
      })
    }, 700)
  },
  returnToBase: () =>
    set((state) => ({
      screen: "base",
      raidSession: null,
      player: {
        ...state.player,
        hp: state.player.maxHp,
      },
    })),
  equipItem: (itemId) =>
    set((state) => {
      const item = state.inventory.find((entry) => entry.id === itemId)

      if (!item) {
        return state
      }

      return {
        player: {
          ...state.player,
          gear: {
            ...state.player.gear,
            [item.slot]: item.id,
          },
        },
        activity: [
          {
            id: crypto.randomUUID(),
            title: "Gear updated",
            detail: `${item.name} equipped in ${item.slot} slot.`,
            timestamp: "Now",
            tone: "neutral",
          },
          ...state.activity,
        ],
      }
    }),
  resetDemo: () =>
    set({
      screen: "base",
      player: demoPresetPlayer(),
      inventory: starterInventory,
      raidSession: null,
      activity: demoPresetActivity(),
      nativeFeatures: {
        autoSigningArmed: true,
        usernamesBound: true,
        bridgeConnected: true,
      },
    }),
}))
