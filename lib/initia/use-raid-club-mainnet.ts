"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useInterwovenKit } from "@initia/interwovenkit-react"
import { formatEther, isAddress } from "viem"
import { raidDefinitions } from "@/lib/game/data"
import type {
  ActionType,
  ActivityEntry,
  LeaderboardEntry,
  LootItem,
  NativeFeatureStatus,
  PlayerProfile,
  RaidSession,
  RaidTranscriptEntry,
  Screen,
} from "@/lib/game/types"
import { buildMsgCall, defaultBridgeRoute, encodeRaidClubCall, raidClubPublicClient } from "./client"
import { raidClubEnv } from "./config"
import { RAID_TICKET_PRICE_WEI, raidClubAbi } from "./raidclub-abi"

type RawProfile = readonly [
  boolean,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  bigint,
  number,
  bigint,
  number,
  number,
  number,
]

type RawSession = readonly [boolean, number, number, number, number, number, number]
type RawOutcome = readonly [boolean, boolean, number, bigint, number, number, number, number, bigint, bigint]
type RawLeaderboard = readonly [readonly `0x${string}`[], readonly number[], readonly number[], readonly bigint[], readonly bigint[]]

type ChainSnapshot = {
  profile: RawProfile
  session: RawSession
  outcome: RawOutcome
  leaderboard: RawLeaderboard
  balance: bigint
}

type RuntimeControl = {
  label: string
  onClick: () => void
}

type RuntimeModel = {
  mode: "mainnet"
  screen: Screen
  player: PlayerProfile
  inventory: LootItem[]
  raidSession: RaidSession | null
  activity: ActivityEntry[]
  nativeFeatures: NativeFeatureStatus
  leaderboard: LeaderboardEntry[]
  bridgeLabel: string
  ticketLabel: string
  resetLabel: string
  setScreen: (screen: Screen) => void
  bindUsername: (value: string) => void
  mockBridgeIn: () => void
  mintRaidTicket: () => void
  startRaid: (raidId: string) => void
  performRaidAction: (action: ActionType) => void
  returnToBase: () => void
  equipItem: (itemId: string) => void
  resetDemo: () => void
  headerBadges: string[]
  judgePathTitle: string
  judgePath: string[]
  identityTitle: string
  identityHelp: string
  identityActions: RuntimeControl[]
  footerTitle: string
  footerPoints: string[]
}

const basePlayer: PlayerProfile = {
  username: null,
  level: 1,
  xp: 0,
  xpToNext: 120,
  hp: 100,
  maxHp: 100,
  energy: 100,
  maxEnergy: 100,
  tickets: 0,
  coins: 0,
  bridgeBalance: 0,
  winStreak: 0,
  totalLootValue: 0,
  faction: "Interwoven Mainnet",
  gear: {},
}

const initialActivity: ActivityEntry[] = [
  {
    id: crypto.randomUUID(),
    title: "Mainnet runtime armed",
    detail: "Connect a wallet, enable autosign, and register a raider on your MiniEVM rollup.",
    timestamp: "Now",
    tone: "neutral",
  },
]

export function useRaidClubMainnet(): RuntimeModel {
  const [screen, setScreen] = useState<Screen>("base")
  const [player, setPlayer] = useState<PlayerProfile>(basePlayer)
  const [inventory, setInventory] = useState<LootItem[]>([])
  const [raidSession, setRaidSession] = useState<RaidSession | null>(null)
  const [activity, setActivity] = useState<ActivityEntry[]>(initialActivity)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isBusy, setIsBusy] = useState(false)
  const [hasProfile, setHasProfile] = useState(false)
  const [transcript, setTranscript] = useState<RaidTranscriptEntry[]>([])

  const {
    isConnected,
    initiaAddress,
    hexAddress,
    username,
    openBridge,
    openConnect,
    openWallet,
    requestTxBlock,
    autoSign,
  } = useInterwovenKit()

  const walletAddress = isAddress(hexAddress) ? (hexAddress as `0x${string}`) : null
  const autoSignEnabled = autoSign.isEnabledByChain[raidClubEnv.chainId] ?? false

  const pushActivity = useCallback((title: string, detail: string, tone: ActivityEntry["tone"]) => {
    setActivity((current) => [
      {
        id: crypto.randomUUID(),
        title,
        detail,
        timestamp: "Now",
        tone,
      },
      ...current,
    ].slice(0, 12))
  }, [])

  const readChainSnapshot = useCallback(async (): Promise<ChainSnapshot | null> => {
    if (!raidClubPublicClient || !walletAddress || !isAddress(raidClubEnv.contractAddress)) {
      return null
    }

    const [profile, session, outcome, leaderboardData, balance] = await Promise.all([
      raidClubPublicClient.readContract({
        address: raidClubEnv.contractAddress as `0x${string}`,
        abi: raidClubAbi,
        functionName: "getProfile",
        args: [walletAddress],
      }) as Promise<RawProfile>,
      raidClubPublicClient.readContract({
        address: raidClubEnv.contractAddress as `0x${string}`,
        abi: raidClubAbi,
        functionName: "getActiveSession",
        args: [walletAddress],
      }) as Promise<RawSession>,
      raidClubPublicClient.readContract({
        address: raidClubEnv.contractAddress as `0x${string}`,
        abi: raidClubAbi,
        functionName: "getLastOutcome",
        args: [walletAddress],
      }) as Promise<RawOutcome>,
      raidClubPublicClient.readContract({
        address: raidClubEnv.contractAddress as `0x${string}`,
        abi: raidClubAbi,
        functionName: "getLeaderboard",
      }) as Promise<RawLeaderboard>,
      raidClubPublicClient.getBalance({ address: walletAddress }),
    ])

    return { profile, session, outcome, leaderboard: leaderboardData, balance }
  }, [walletAddress])

  const applySnapshot = useCallback(
    (snapshot: ChainSnapshot | null) => {
      if (!snapshot) {
        setPlayer({
          ...basePlayer,
          username: username ?? null,
        })
        setInventory([])
        setLeaderboard([])
        setHasProfile(false)
        setRaidSession(null)
        return
      }

      const nextInventory = buildInventory(snapshot.profile)
      const profileGear = nextInventory.reduce<PlayerProfile["gear"]>((gear, item) => {
        gear[item.slot] = item.id
        return gear
      }, {})

      const nextPlayer: PlayerProfile = {
        username: username ?? null,
        level: toNumber(snapshot.profile[1]),
        xp: toNumber(snapshot.profile[2]),
        xpToNext: toNumber(snapshot.profile[3]),
        hp: snapshot.session[0] ? toNumber(snapshot.session[6]) : toNumber(snapshot.profile[4]),
        maxHp: toNumber(snapshot.profile[4]),
        energy: toNumber(snapshot.profile[6]),
        maxEnergy: toNumber(snapshot.profile[5]),
        tickets: toNumber(snapshot.profile[7]),
        coins: toNumber(snapshot.profile[8]),
        bridgeBalance: Number.parseFloat(formatEther(snapshot.balance)),
        winStreak: toNumber(snapshot.profile[9]),
        totalLootValue: toNumber(snapshot.profile[10]),
        faction: "Interwoven Mainnet",
        gear: profileGear,
      }

      const nextLeaderboard = buildLeaderboard(snapshot.leaderboard, walletAddress, username)
      setPlayer(nextPlayer)
      setInventory(nextInventory)
      setLeaderboard(nextLeaderboard)
      setHasProfile(snapshot.profile[0])

      if (snapshot.session[0]) {
        const raidId = raidDefinitions[toNumber(snapshot.session[1])]?.id ?? "reef-run"
        setRaidSession((current) =>
          buildActiveRaidView({
            raidId,
            enemyHp: toNumber(snapshot.session[4]),
            enemyMaxHp: toNumber(snapshot.session[5]),
            turn: toNumber(snapshot.session[2]),
            actionsUsed: toNumber(snapshot.session[3]),
            player: nextPlayer,
            transcript: current?.status === "active" ? current.transcript : transcript,
            autoSignEnabled,
            message: autoSignEnabled
              ? "Auto-signing is live for MsgCall actions on this rollup."
              : "Enable autosign to remove repeat confirmations from combat.",
          }),
        )
      } else if (!raidSession || raidSession.status === "active") {
        setRaidSession(null)
      }
    },
    [autoSignEnabled, player, raidSession, transcript, username, walletAddress],
  )

  const hydrate = useCallback(async () => {
    const snapshot = await readChainSnapshot()
    applySnapshot(snapshot)
    return snapshot
  }, [applySnapshot, readChainSnapshot])

  useEffect(() => {
    if (!isConnected || !walletAddress) {
      setPlayer({
        ...basePlayer,
        username: username ?? null,
      })
      setInventory([])
      setRaidSession(null)
      setLeaderboard([])
      setHasProfile(false)
      return
    }

    void hydrate()
  }, [hydrate, isConnected, username, walletAddress])

  const runTx = useCallback(
    async (
      functionName: string,
      args: unknown[],
      value: bigint,
      successTitle: string,
      successDetail: string,
      options?: {
        onConfirmed?: (snapshot: ChainSnapshot | null) => void
      },
    ) => {
      if (!isConnected || !initiaAddress) {
        openConnect()
        return
      }

      setIsBusy(true)

      try {
        const txHash = await requestTxBlock({
          chainId: raidClubEnv.chainId,
          messages: [buildMsgCall(encodeRaidClubCall(functionName, args), initiaAddress, value)],
        })

        pushActivity(successTitle, `${successDetail} Tx ${txHash.transactionHash.slice(0, 10)}…`, "success")
        const snapshot = await hydrate()
        options?.onConfirmed?.(snapshot)
      } catch (error) {
        pushActivity("Transaction failed", extractErrorMessage(error), "warning")
      } finally {
        setIsBusy(false)
      }
    },
    [hydrate, initiaAddress, isConnected, openConnect, pushActivity, requestTxBlock],
  )

  const bindUsername = useCallback(() => {
    openWallet()
    pushActivity(
      "Wallet opened",
      "Use Initia Wallet to manage your username profile. This app reads your live username when one is bound.",
      "neutral",
    )
  }, [openWallet, pushActivity])

  const mockBridgeIn = useCallback(() => {
    if (!isConnected) {
      openConnect()
      return
    }

    openBridge(defaultBridgeRoute)
    pushActivity(
      "Bridge modal opened",
      `Route prefilled from ${raidClubEnv.bridgeSrcChainId} into ${raidClubEnv.prettyName}.`,
      "neutral",
    )
  }, [isConnected, openBridge, openConnect, pushActivity])

  const mintRaidTicket = useCallback(() => {
    void runTx(
      "buyTickets",
      [1],
      RAID_TICKET_PRICE_WEI,
      "Ticket minted",
      `1 raid ticket purchased for 0.002 ${raidClubEnv.nativeSymbol}.`,
    )
  }, [runTx])

  const startRaid = useCallback(
    (raidId: string) => {
      const raidIndex = raidDefinitions.findIndex((raid) => raid.id === raidId)
      const raid = raidDefinitions[raidIndex]

      if (raidIndex < 0 || !raid) {
        return
      }

      if (!hasProfile) {
        pushActivity("Register first", "Create your raider before entering the first onchain run.", "warning")
        return
      }

      void runTx("startRaid", [raidIndex], BigInt(0), "Raid started", `${raid.name} opened onchain.`, {
        onConfirmed: (snapshot) => {
          if (!snapshot?.session[0]) {
            return
          }

          const nextTranscript = [
            {
              id: crypto.randomUUID(),
              speaker: "system" as const,
              message: `${raid.name} opened on ${raidClubEnv.prettyName}. ${raid.bossModifier}`,
            },
          ]

          setTranscript(nextTranscript)
          setScreen("raid")
          setRaidSession(
            buildActiveRaidView({
              raidId,
              enemyHp: toNumber(snapshot.session[4]),
              enemyMaxHp: toNumber(snapshot.session[5]),
              turn: toNumber(snapshot.session[2]),
              actionsUsed: toNumber(snapshot.session[3]),
              player: {
                ...player,
                hp: toNumber(snapshot.session[6]),
              },
              transcript: nextTranscript,
              autoSignEnabled,
              message: autoSignEnabled
                ? "Auto-signing granted. Continue chaining actions."
                : "Enable autosign for a smoother repeated-action loop.",
            }),
          )
        },
      })
    },
    [autoSignEnabled, hasProfile, player, pushActivity, runTx],
  )

  const performRaidAction = useCallback(
    (action: ActionType) => {
      if (!raidSession || raidSession.status !== "active" || isBusy) {
        return
      }

      const previousSession = raidSession
      const raid = raidDefinitions.find((entry) => entry.id === raidSession.raidId)

      if (!raid) {
        return
      }

      const playerLine: RaidTranscriptEntry = {
        id: crypto.randomUUID(),
        speaker: "player",
        message: `${capitalize(action)} broadcast to the rollup.`,
      }

      setRaidSession({
        ...raidSession,
        transcript: [...raidSession.transcript, playerLine],
        autoSigning: {
          ...raidSession.autoSigning,
          pending: true,
          lastAction: action,
          message: `Submitting ${action} through MsgCall${autoSignEnabled ? " with autosign" : ""}...`,
        },
      })

      void runTx("performAction", [actionIndex(action)], BigInt(0), "Action confirmed", `${capitalize(action)} resolved onchain.`, {
        onConfirmed: (snapshot) => {
          if (!snapshot) {
            return
          }

          const nextTranscript = [...previousSession.transcript, playerLine]
          const nextPlayer = {
            ...player,
            hp: snapshot.session[0] ? toNumber(snapshot.session[6]) : player.maxHp,
          }

          if (snapshot.session[0]) {
            const enemyLoss = previousSession.enemyHp - toNumber(snapshot.session[4])
            const systemLine: RaidTranscriptEntry = {
              id: crypto.randomUUID(),
              speaker: action === "recover" ? "system" : "enemy",
              message:
                action === "recover"
                  ? `Recovery resolved. Current HP is ${toNumber(snapshot.session[6])}.`
                  : `${raid.enemyName} absorbed ${enemyLoss} damage and answered. Current HP is ${toNumber(snapshot.session[6])}.`,
            }

            const activeTranscript = [...nextTranscript, systemLine]
            setTranscript(activeTranscript)
            setRaidSession(
              buildActiveRaidView({
                raidId: previousSession.raidId,
                enemyHp: toNumber(snapshot.session[4]),
                enemyMaxHp: toNumber(snapshot.session[5]),
                turn: toNumber(snapshot.session[2]),
                actionsUsed: toNumber(snapshot.session[3]),
                player: nextPlayer,
                transcript: activeTranscript,
                autoSignEnabled,
                message: autoSignEnabled
                  ? `${capitalize(action)} auto-signed successfully. Queue the next move.`
                  : `${capitalize(action)} confirmed. Enable autosign to remove extra prompts.`,
              }),
            )
            return
          }

          const rewardItem = buildOutcomeItem(snapshot.outcome)
          const settlementLine: RaidTranscriptEntry = {
            id: crypto.randomUUID(),
            speaker: "system",
            message: snapshot.outcome[1]
              ? `Raid clear confirmed onchain. ${toNumber(snapshot.outcome[3])} coins and ${toNumber(snapshot.outcome[4])} XP credited.`
              : "Raid failed onchain. Resetting to full health for the next run.",
          }
          const finalTranscript = [...nextTranscript, settlementLine]
          setTranscript(finalTranscript)
          setRaidSession({
            raidId: previousSession.raidId,
            enemyName: previousSession.enemyName,
            enemyHp: snapshot.outcome[1] ? 0 : previousSession.enemyHp,
            enemyMaxHp: previousSession.enemyMaxHp,
            turn: previousSession.turn + 1,
            actionsUsed: previousSession.actionsUsed + 1,
            status: snapshot.outcome[1] ? "won" : "lost",
            transcript: finalTranscript,
            rewardCoins: toNumber(snapshot.outcome[3]),
            rewardXp: toNumber(snapshot.outcome[4]),
            rewardItem,
            autoSigning: {
              enabled: autoSignEnabled,
              pending: false,
              lastAction: action,
              message: snapshot.outcome[1]
                ? "Settlement confirmed. Rewards are now live onchain."
                : "Session ended. Return to base and queue another run.",
            },
          })
        },
      })
    },
    [autoSignEnabled, isBusy, player, raidSession, runTx],
  )

  const returnToBase = useCallback(() => {
    setScreen("base")
    setRaidSession(null)
    setTranscript([])
    void hydrate()
  }, [hydrate])

  const registerRaider = useCallback(() => {
    void runTx("register", [], BigInt(0), "Raider registered", "Starter profile and loadout seeded onchain.")
  }, [runTx])

  const enableAutosign = useCallback(async () => {
    try {
      await autoSign.enable(raidClubEnv.chainId)
      pushActivity("Autosign enabled", "MsgCall permission granted for the current rollup.", "success")
    } catch (error) {
      pushActivity("Autosign failed", extractErrorMessage(error), "warning")
    }
  }, [autoSign, pushActivity])

  const disableAutosign = useCallback(async () => {
    try {
      await autoSign.disable(raidClubEnv.chainId)
      pushActivity("Autosign disabled", "Ghost wallet permissions revoked for this rollup.", "neutral")
    } catch (error) {
      pushActivity("Disable failed", extractErrorMessage(error), "warning")
    }
  }, [autoSign, pushActivity])

  const resetDemo = useCallback(() => {
    void hydrate()
    pushActivity("Chain refreshed", "Pulled the latest profile, session, and leaderboard from the rollup.", "neutral")
  }, [hydrate, pushActivity])

  const nativeFeatures = useMemo<NativeFeatureStatus>(
    () => ({
      autoSigningArmed: autoSignEnabled,
      usernamesBound: Boolean(username),
      bridgeConnected: true,
    }),
    [autoSignEnabled, username],
  )

  const headerBadges = useMemo(
    () => [
      `${raidClubEnv.prettyName} mainnet`,
      autoSignEnabled ? "Autosign enabled" : "Autosign pending",
      hasProfile ? "Raider registered" : "Profile missing",
    ],
    [autoSignEnabled, hasProfile],
  )

  const identityActions = useMemo<RuntimeControl[]>(() => {
    if (!isConnected) {
      return [{ label: "Connect wallet", onClick: openConnect }]
    }

    return [
      { label: "Open wallet", onClick: openWallet },
      { label: autoSignEnabled ? "Disable autosign" : "Enable autosign", onClick: autoSignEnabled ? disableAutosign : enableAutosign },
      { label: hasProfile ? "Refresh profile" : "Create raider", onClick: hasProfile ? resetDemo : registerRaider },
    ]
  }, [autoSignEnabled, disableAutosign, enableAutosign, hasProfile, isConnected, openConnect, openWallet, registerRaider, resetDemo])

  const footerPoints = useMemo(() => {
    const points = [
      `Bridge ${raidClubEnv.nativeSymbol} into ${raidClubEnv.prettyName} before minting extra raid tickets.`,
      "Autosign should be enabled before demoing repeated combat actions.",
      "Wallet usernames are read live from Initia Wallet when present.",
    ]

    if (!hasProfile) {
      points.unshift("Register the wallet once to seed a starter loadout and 2 free tickets.")
    }

    if (!autoSignEnabled) {
      points.unshift("Autosign is still off, so combat will require a confirmation per action.")
    }

    return points
  }, [autoSignEnabled, hasProfile])

  return {
    mode: "mainnet",
    screen,
    player,
    inventory,
    raidSession,
    activity,
    nativeFeatures,
    leaderboard,
    bridgeLabel: `Open bridge`,
    ticketLabel: `Mint ticket (0.002 ${raidClubEnv.nativeSymbol})`,
    resetLabel: "Refresh chain state",
    setScreen,
    bindUsername,
    mockBridgeIn,
    mintRaidTicket,
    startRaid,
    performRaidAction,
    returnToBase,
    equipItem: () => pushActivity("Onchain gear", "Best-in-slot gear auto-equips after victory drops.", "neutral"),
    resetDemo,
    headerBadges,
    judgePathTitle: "Mainnet judge path",
    judgePath: [
      "Connect wallet and create a raider profile.",
      "Enable autosign for MsgCall on the rollup.",
      "Open bridge, then mint a raid ticket from live balance.",
      "Run 3-5 onchain actions and show settlement plus leaderboard.",
    ],
    identityTitle: "Mainnet controls",
    identityHelp: isConnected
      ? `${username ?? shortAddress(initiaAddress || hexAddress || "")} connected to ${raidClubEnv.prettyName}.`
      : "Connect a wallet to switch this UI from prototype mode into a live rollup client.",
    identityActions,
    footerTitle: "Mainnet readiness",
    footerPoints,
  }
}

function buildActiveRaidView({
  raidId,
  enemyHp,
  enemyMaxHp,
  turn,
  actionsUsed,
  player,
  transcript,
  autoSignEnabled,
  message,
}: {
  raidId: string
  enemyHp: number
  enemyMaxHp: number
  turn: number
  actionsUsed: number
  player: PlayerProfile
  transcript: RaidTranscriptEntry[]
  autoSignEnabled: boolean
  message: string
}): RaidSession {
  const raid = raidDefinitions.find((entry) => entry.id === raidId) ?? raidDefinitions[0]

  return {
    raidId,
    enemyName: raid.enemyName,
    enemyHp,
    enemyMaxHp,
    turn,
    actionsUsed,
    status: "active",
    transcript,
    rewardCoins: 0,
    rewardXp: 0,
    rewardItem: null,
    autoSigning: {
      enabled: autoSignEnabled,
      pending: false,
      lastAction: null,
      message,
    },
  }
}

function buildInventory(profile: RawProfile): LootItem[] {
  const items = [
    createGearItem("weapon", toNumber(profile[11])),
    createGearItem("charm", toNumber(profile[12])),
    createGearItem("relic", toNumber(profile[13])),
  ].filter(Boolean)

  return items as LootItem[]
}

function createGearItem(slot: LootItem["slot"], power: number) {
  if (power <= 0) {
    return null
  }

  const rarity = rarityFromPower(power)
  const slotNames = {
    weapon: ["Breach Axe", "Emberfang Blade", "Nightglass Edge", "Solar Halberd"],
    charm: ["Signal Band", "Tidecall Sigil", "Warden Coil", "Starwake Seal"],
    relic: ["Pulse Core", "Abyss Lantern", "Voidglass Totem", "Phoenix Archive"],
  } as const
  const rarityIndex = rarity === "Common" ? 0 : rarity === "Rare" ? 1 : rarity === "Epic" ? 2 : 3

  return {
    id: `${slot}-${power}`,
    name: slotNames[slot][rarityIndex],
    slot,
    rarity,
    power,
    description: `Onchain best-in-slot ${slot} currently stored at power ${power}.`,
  } satisfies LootItem
}

function buildOutcomeItem(outcome: RawOutcome): LootItem | null {
  if (!outcome[0] || !outcome[1] || outcome[6] === 0) {
    return null
  }

  const slots: LootItem["slot"][] = ["weapon", "charm", "relic"]
  return createGearItem(slots[toNumber(outcome[5])] ?? "weapon", toNumber(outcome[6]))
}

function buildLeaderboard(raw: RawLeaderboard, walletAddress: `0x${string}` | null, username: string | null | undefined) {
  return raw[0].map<LeaderboardEntry>((address, index) => ({
    id: address,
    username:
      walletAddress && address.toLowerCase() === walletAddress.toLowerCase()
        ? username ?? shortAddress(address)
        : shortAddress(address),
    score: toNumber(raw[4][index]),
    streak: toNumber(raw[2][index]),
    totalLoot: toNumber(raw[3][index]),
    faction: "Interwoven Mainnet",
    highlight: walletAddress ? address.toLowerCase() === walletAddress.toLowerCase() : false,
  }))
}

function rarityFromPower(power: number): LootItem["rarity"] {
  if (power >= 16) return "Legendary"
  if (power >= 11) return "Epic"
  if (power >= 7) return "Rare"
  return "Common"
}

function toNumber(value: bigint | number) {
  return Number(value)
}

function shortAddress(value: string) {
  if (!value) {
    return "wallet pending"
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

function capitalize(value: string) {
  return `${value[0].toUpperCase()}${value.slice(1)}`
}

function actionIndex(action: ActionType) {
  return action === "attack" ? 0 : action === "guard" ? 1 : action === "special" ? 2 : 3
}

function extractErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return "Unknown transaction error."
}
