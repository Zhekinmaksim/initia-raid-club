"use client"

import { useRef, useState } from "react"
import { RaidClubBrandMark } from "@/components/raid-club-logo"
import { ActivityLog } from "@/features/profile/activity-log"
import { HomeBase } from "@/features/profile/home-base"
import { InventoryPanel } from "@/features/inventory/inventory-panel"
import { LeaderboardPanel } from "@/features/leaderboard/leaderboard-panel"
import { RaidPanel } from "@/features/raid/raid-panel"
import { raidDefinitions } from "@/lib/game/data"
import { isMainnetRuntimeConfigured } from "@/lib/initia/config"
import { useRaidClubMainnet } from "@/lib/initia/use-raid-club-mainnet"
import { buildMockLeaderboard, useRaidClubStore } from "@/lib/game/store"
import type { ActionType, ActivityEntry, LeaderboardEntry, LootItem, NativeFeatureStatus, PlayerProfile, RaidSession, Screen } from "@/lib/game/types"

const tabs: Array<{ id: Screen; label: string }> = [
  { id: "base", label: "Base" },
  { id: "raid", label: "Raid" },
  { id: "inventory", label: "Inventory" },
  { id: "leaderboard", label: "Board" },
  { id: "log", label: "Log" },
]

export function RaidClubApp() {
  return isMainnetRuntimeConfigured ? <MainnetRaidClubApp /> : <MockRaidClubApp />
}

type ControlAction = {
  label: string
  onClick: () => void
}

type ShellRuntime = {
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
  quickStartDemo?: () => void
  headerBadges: string[]
  judgePathTitle: string
  judgePath: string[]
  identityTitle: string
  identityHelp: string
  identityMode: "input" | "actions"
  identityPlaceholder?: string
  identityButtonLabel?: string
  identityActions?: ControlAction[]
  footerTitle: string
  footerPoints: string[]
}

function MockRaidClubApp() {
  const [usernameDraft, setUsernameDraft] = useState("")
  const screen = useRaidClubStore((s) => s.screen)
  const player = useRaidClubStore((s) => s.player)
  const inventory = useRaidClubStore((s) => s.inventory)
  const raidSession = useRaidClubStore((s) => s.raidSession)
  const activity = useRaidClubStore((s) => s.activity)
  const nativeFeatures = useRaidClubStore((s) => s.nativeFeatures)
  const setScreen = useRaidClubStore((s) => s.setScreen)
  const bindUsername = useRaidClubStore((s) => s.bindUsername)
  const mockBridgeIn = useRaidClubStore((s) => s.mockBridgeIn)
  const mintRaidTicket = useRaidClubStore((s) => s.mintRaidTicket)
  const startRaid = useRaidClubStore((s) => s.startRaid)
  const performRaidAction = useRaidClubStore((s) => s.performRaidAction)
  const returnToBase = useRaidClubStore((s) => s.returnToBase)
  const equipItem = useRaidClubStore((s) => s.equipItem)
  const resetDemo = useRaidClubStore((s) => s.resetDemo)
  const leaderboard = buildMockLeaderboard(player)
  const quickStartDemo = () => {
    const state = useRaidClubStore.getState()
    if (!state.player.username) state.bindUsername("nightglass.raider")
    const latest = useRaidClubStore.getState()
    if (latest.player.tickets < 2) {
      if (latest.player.bridgeBalance < 20) state.mockBridgeIn(25)
      const missing = Math.max(0, 2 - useRaidClubStore.getState().player.tickets)
      for (let i = 0; i < missing; i++) useRaidClubStore.getState().mintRaidTicket()
    }
    useRaidClubStore.getState().startRaid("eclipse-altar")
    window.setTimeout(() => useRaidClubStore.getState().performRaidAction("guard"), 800)
    window.setTimeout(() => useRaidClubStore.getState().performRaidAction("attack"), 1800)
    window.setTimeout(() => useRaidClubStore.getState().performRaidAction("special"), 3000)
  }

  const runtime: ShellRuntime = {
    screen, player, inventory, raidSession, activity, nativeFeatures, leaderboard,
    bridgeLabel: "Bridge in 25",
    ticketLabel: "Mint ticket",
    resetLabel: "Reset demo",
    setScreen,
    bindUsername: (v) => { bindUsername(v); setUsernameDraft("") },
    mockBridgeIn: () => mockBridgeIn(),
    mintRaidTicket, startRaid, performRaidAction, returnToBase, equipItem, resetDemo, quickStartDemo,
    headerBadges: ["InterwovenKit", "Auto-sign", "60s demo"],
    judgePathTitle: "Judge path",
    judgePath: [
      "Connect a wallet and claim a handle.",
      "Bridge in, mint one ticket, enter a raid.",
      "Play 3-5 auto-signed turns.",
      "Show loot, then open the leaderboard.",
    ],
    identityTitle: "Username setup",
    identityHelp: "Demo handle flow. Replace with initia-usernames in live mode.",
    identityMode: "input",
    identityPlaceholder: "raid.handle",
    identityButtonLabel: "Claim username",
    footerTitle: "Still mocked",
    footerPoints: [
      "Swap the local handle flow for initia-usernames.",
      "Send ticket mint, raid start, and raid turns through InterwovenKit.",
      "Read loot and outcomes from the deployed appchain.",
    ],
  }

  return <RaidClubShell runtime={runtime} usernameDraft={usernameDraft} setUsernameDraft={setUsernameDraft} />
}

function MainnetRaidClubApp() {
  const runtime = useRaidClubMainnet()
  return <RaidClubShell runtime={{ ...runtime, identityMode: "actions" }} usernameDraft="" setUsernameDraft={() => undefined} />
}

/* ─── Compact stat row ─── */
function StatCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.06] py-1.5 last:border-b-0">
      <span className="text-[12px] text-[#9b9387]">{label}</span>
      <span className={`text-[14px] tabular-nums ${accent ? "text-[#d7b37b]" : "text-[#f3eee4]"}`}>{value}</span>
    </div>
  )
}

function RaidClubShell({
  runtime,
  usernameDraft,
  setUsernameDraft,
}: {
  runtime: ShellRuntime
  usernameDraft: string
  setUsernameDraft: (v: string) => void
}) {
  const identityInputRef = useRef<HTMLInputElement>(null)

  const focusIdentityStrip = () => {
    runtime.setScreen("base")
    window.requestAnimationFrame(() => {
      identityInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      if (runtime.identityMode === "input" && !runtime.player.username) {
        identityInputRef.current?.focus()
        identityInputRef.current?.select()
      }
    })
  }

  const openManualIdentityFlow = () => {
    const handle = usernameDraft.trim() || "nightglass.raider"
    setUsernameDraft(handle)
    focusIdentityStrip()
    window.requestAnimationFrame(() => {
      identityInputRef.current?.focus()
      identityInputRef.current?.select()
    })
  }

  const useHandleSuggestion = (v: string) => {
    setUsernameDraft(v)
    window.requestAnimationFrame(() => {
      identityInputRef.current?.focus()
      identityInputRef.current?.select()
    })
  }

  const content = (() => {
    if (runtime.screen === "raid") return <RaidPanel session={runtime.raidSession} player={runtime.player} onAction={runtime.performRaidAction} onReturn={runtime.returnToBase} />
    if (runtime.screen === "inventory") return <InventoryPanel inventory={runtime.inventory} player={runtime.player} onEquip={runtime.equipItem} />
    if (runtime.screen === "leaderboard") return <LeaderboardPanel entries={runtime.leaderboard} />
    if (runtime.screen === "log") return <ActivityLog activity={runtime.activity} />
    return (
      <HomeBase
        player={runtime.player}
        nativeFeatures={runtime.nativeFeatures}
        onBridgeIn={runtime.mockBridgeIn}
        onMintTicket={runtime.mintRaidTicket}
        onSelectRaid={(raidId) => {
          const raid = raidDefinitions.find((entry) => entry.id === raidId)

          if (!raid) {
            return
          }

          if (!runtime.player.username) {
            openManualIdentityFlow()
            return
          }

          if (runtime.player.tickets < raid.ticketCost || runtime.player.energy < raid.energyCost) {
            runtime.setScreen("base")
            return
          }

          runtime.startRaid(raidId)
        }}
        bridgeLabel={runtime.bridgeLabel}
        ticketLabel={runtime.ticketLabel}
      />
    )
  })()

  const runtimeMode = runtime.identityMode === "actions" ? "Mainnet" : "Demo"
  const connectAction = runtime.identityActions?.find((a) => a.label.toLowerCase().includes("connect wallet"))
  const createRaiderAction = runtime.identityActions?.find((a) => a.label.toLowerCase().includes("create raider"))
  const enableAutosignAction = runtime.identityActions?.find((a) => a.label.toLowerCase().includes("enable autosign"))
  const hasActiveRaid = runtime.raidSession?.status === "active"
  const hasCompletedRaid = runtime.raidSession?.status === "won" || runtime.raidSession?.status === "lost" || runtime.activity.some((e) => /raid (cleared|failed|deployed|started)/i.test(e.title))

  const onboardingSteps = runtime.identityMode === "actions"
    ? [
        { label: "Connect wallet", done: !connectAction },
        { label: "Create raider", done: !createRaiderAction },
        { label: "Enable autosign", done: !enableAutosignAction },
        { label: "First raid", done: hasCompletedRaid || hasActiveRaid },
      ]
    : [
        { label: "Username", done: Boolean(runtime.player.username) },
        { label: "Home base", done: runtime.screen === "base" },
        { label: "First raid", done: hasCompletedRaid || hasActiveRaid },
        { label: "Leaderboard", done: runtime.screen === "leaderboard" },
      ]

  const featuredRaid = raidDefinitions.find((r) => r.id === "eclipse-altar") ?? raidDefinitions[0]
  const handleSuggestions = ["nightglass.raider", "obsidian.loop", "blackhalo.init"]

  const primaryAction = (() => {
    if (runtime.identityMode === "actions") {
      if (connectAction) return { title: "Connect wallet", detail: "Connect to move from demo into the live rollup.", buttonLabel: connectAction.label, onClick: connectAction.onClick, secondaryLabel: "Open controls", onSecondaryClick: () => runtime.setScreen("base" as Screen) }
      if (createRaiderAction) return { title: "Create raider", detail: "Create your onchain raider once.", buttonLabel: createRaiderAction.label, onClick: createRaiderAction.onClick }
      if (enableAutosignAction) return { title: "Enable autosign", detail: "Turn on autosign before combat.", buttonLabel: enableAutosignAction.label, onClick: enableAutosignAction.onClick }
      if (runtime.player.tickets < 1) return { title: "Get a ticket", detail: "Bridge in if needed, then mint one ticket.", buttonLabel: runtime.player.bridgeBalance > 0 ? runtime.ticketLabel : runtime.bridgeLabel, onClick: runtime.player.bridgeBalance > 0 ? runtime.mintRaidTicket : runtime.mockBridgeIn, secondaryLabel: runtime.player.bridgeBalance > 0 ? "Open bridge" : undefined, onSecondaryClick: runtime.player.bridgeBalance > 0 ? runtime.mockBridgeIn : undefined }
      if (hasActiveRaid) return { title: "Continue raid", detail: "A run is already in progress.", buttonLabel: "Open raid", onClick: () => runtime.setScreen("raid") }
      return { title: "Start featured raid", detail: "Open the Nightglass Warden run.", buttonLabel: "Start Nightglass Warden", onClick: () => { runtime.setScreen("base"); runtime.startRaid("eclipse-altar") }, secondaryLabel: "Leaderboard", onSecondaryClick: () => runtime.setScreen("leaderboard") }
    }
    if (!runtime.player.username) return { title: runtime.quickStartDemo ? "Play Nightglass Warden" : "Claim username", detail: runtime.quickStartDemo ? "Start the boss run and watch three turns resolve." : "Set a handle before you enter.", buttonLabel: runtime.quickStartDemo ? "Play 20s boss run" : "Claim username", onClick: runtime.quickStartDemo ?? (() => runtime.bindUsername(usernameDraft || "nightglass.raider")), secondaryLabel: runtime.quickStartDemo ? "Manual claim" : undefined, onSecondaryClick: runtime.quickStartDemo ? openManualIdentityFlow : undefined }
    if (hasActiveRaid) return { title: "Continue raid", detail: "Finish the current run.", buttonLabel: "Open raid", onClick: () => runtime.setScreen("raid") }
    return { title: runtime.quickStartDemo ? "Run the boss" : "Start featured raid", detail: runtime.quickStartDemo ? "Quick 20-second boss pass." : "Open the featured boss run.", buttonLabel: runtime.quickStartDemo ? "Play 20s boss run" : "Start Nightglass Warden", onClick: runtime.quickStartDemo ?? (() => { runtime.setScreen("base"); runtime.startRaid("eclipse-altar") }), secondaryLabel: "Home base", onSecondaryClick: () => runtime.setScreen("base") }
  })()

  const openFeaturedRaid = () => {
    if (runtime.identityMode === "actions" && (connectAction || createRaiderAction || enableAutosignAction)) {
      primaryAction.onClick()
      return
    }

    if (!runtime.player.username) {
      openManualIdentityFlow()
      return
    }

    if (runtime.player.tickets < featuredRaid.ticketCost || runtime.player.energy < featuredRaid.energyCost) {
      runtime.setScreen("base")
      return
    }

    runtime.startRaid("eclipse-altar")
  }

  const openInterwovenPath = () => {
    if (runtime.identityMode === "actions") {
      const walletAction = connectAction ?? runtime.identityActions?.find((action) => action.label.toLowerCase().includes("wallet"))
      if (walletAction) {
        walletAction.onClick()
        return
      }
    }

    if (!runtime.player.username) {
      openManualIdentityFlow()
      return
    }

    focusIdentityStrip()
  }

  const openAutosignPath = () => {
    if (runtime.identityMode === "actions") {
      const autosignAction = runtime.identityActions?.find((action) => action.label.toLowerCase().includes("autosign"))
      if (autosignAction) {
        autosignAction.onClick()
        return
      }
    }

    if (hasActiveRaid) {
      runtime.setScreen("raid")
      return
    }

    if (runtime.quickStartDemo) {
      runtime.quickStartDemo()
      return
    }

    runtime.setScreen("base")
  }

  const openDemoPath = () => {
    if (hasActiveRaid) {
      runtime.setScreen("raid")
      return
    }

    if (runtime.quickStartDemo) {
      runtime.quickStartDemo()
      return
    }

    if (connectAction || createRaiderAction || enableAutosignAction) {
      primaryAction.onClick()
      return
    }

    openFeaturedRaid()
  }

  const headerControls = [
    { label: "InterwovenKit", hint: runtime.headerBadges[0] ?? "Wallet and identity flow", onClick: openInterwovenPath },
    { label: "Auto-sign", hint: runtime.headerBadges[1] ?? "Autosign and combat actions", onClick: openAutosignPath },
    { label: "60s demo", hint: runtime.headerBadges[2] ?? "Fast featured raid path", onClick: openDemoPath },
  ]

  return (
    <main className="raid-shell relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-noise" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 pb-6 pt-3 md:px-6 xl:px-8">

        {/* ═══ Top bar ═══ */}
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-2.5">
          <div className="flex items-center gap-2 text-[12px] text-[#9f978b]">
            <span className="section-code text-[#d7b37b]">Initia Raid Club</span>
            <span className="text-white/20">·</span>
            <span>{runtimeMode}</span>
            <span className="text-white/20">·</span>
            <span>S1</span>
          </div>
          <div className="flex items-center gap-2">
            {headerControls.map((control) => (
              <button
                key={control.label}
                type="button"
                title={control.hint}
                onClick={control.onClick}
                className="rounded-full border border-white/[0.06] px-2.5 py-1 text-[12px] text-[#91897d] transition hover:border-white/16 hover:text-white"
              >
                {control.label}
              </button>
            ))}
            <button onClick={runtime.resetDemo} className="ml-1 text-[12px] text-[#91897d] transition hover:text-white">{runtime.resetLabel}</button>
          </div>
        </header>

        {/* ═══ Masthead ═══ */}
        <section className="grid items-start gap-4 border-b border-white/[0.08] py-4 lg:grid-cols-[1fr_240px]">
          <div className="flex items-start gap-3">
            <RaidClubBrandMark className="hidden h-14 w-14 shrink-0 md:flex" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-3">
                <h1 className="editorial-title text-[2.4rem] leading-[0.9] text-[#f3eee4] md:text-[3rem]">Initia Raid Club</h1>
                <span className="section-code text-[10px] text-[#d7b37b]">Obsidian Wake</span>
              </div>
              <p className="mt-1.5 max-w-lg text-[15px] leading-6 text-[#c2baae]">
                Beat the boss in 5 actions. Claim a handle, spend a ticket, and go straight into the fight.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button onClick={primaryAction.onClick} className="rounded-full bg-[#f3eee4] px-4 py-2.5 text-[13px] font-medium text-[#111] transition hover:bg-white">{primaryAction.buttonLabel}</button>
                {primaryAction.secondaryLabel && primaryAction.onSecondaryClick ? (
                  <button onClick={primaryAction.onSecondaryClick} className="rounded-full border border-white/10 px-4 py-2.5 text-[13px] text-[#a29b91] transition hover:border-white/20 hover:text-white">{primaryAction.secondaryLabel}</button>
                ) : null}
                <span className="text-[14px] text-[#91897d]">{primaryAction.detail}</span>
              </div>
            </div>
          </div>

          {/* Player card */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-3">
            <div className="flex items-center justify-between pb-1.5">
              <span className="section-code text-[9px] text-[#6f695f]">Pilot</span>
              <span className="text-[13px] text-[#f3eee4]">{runtime.player.username ?? "—"}</span>
            </div>
            <StatCell label="Lv" value={`${runtime.player.level}`} />
            <StatCell label="Tickets" value={`${runtime.player.tickets}`} accent />
            <StatCell label="Coins" value={`${runtime.player.coins}`} />
            <StatCell label="INIT" value={`${runtime.player.bridgeBalance}`} />
            <StatCell label="Streak" value={`${runtime.player.winStreak}`} accent />
          </div>
        </section>

        {/* ═══ Onboarding + Identity strip ═══ */}
        <section className="grid items-start gap-4 border-b border-white/[0.08] py-3 md:grid-cols-[1fr_1fr]">
          <div className="flex flex-wrap items-center gap-1.5">
            {onboardingSteps.map((step, i) => (
              <div key={step.label} className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] ${step.done ? "border-[#d7b37b]/20 bg-[rgba(215,179,123,0.05)] text-[#d7b37b]" : "border-white/[0.06] text-[#968d81]"}`}>
                <span className="font-medium">{i + 1}</span>
                <span>{step.label}</span>
                {step.done ? <span className="text-[10px]">✓</span> : null}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {runtime.identityMode === "input" && !runtime.player.username ? (
              <>
                <input ref={identityInputRef} value={usernameDraft} onChange={(e) => setUsernameDraft(e.target.value)} placeholder={runtime.identityPlaceholder} className="min-w-0 flex-1 border-b border-white/10 bg-transparent py-1.5 text-[14px] text-white outline-none placeholder:text-[#8f877c]" />
                <button onClick={() => runtime.bindUsername(usernameDraft || "nightglass.raider")} className="shrink-0 rounded-full bg-[#f3eee4] px-3.5 py-2 text-[12px] font-medium text-[#111] hover:bg-white">Claim</button>
                <div className="flex w-full gap-1">
                  {handleSuggestions.map((h) => (
                    <button key={h} onClick={() => useHandleSuggestion(h)} className="rounded-full border border-white/[0.05] px-2.5 py-1 text-[11px] text-[#91897d] hover:text-white">{h}</button>
                  ))}
                </div>
              </>
            ) : runtime.identityMode === "actions" ? (
              runtime.identityActions?.map((a) => (
                <button key={a.label} onClick={a.onClick} className="rounded-full border border-white/10 px-3.5 py-2 text-[12px] text-[#a29b91] hover:text-white">{a.label}</button>
              ))
            ) : (
              <span className="text-[13px] text-[#b3aa9d]">{runtime.player.username}</span>
            )}
            <div className="flex w-full gap-3 text-[12px]">
              <span className={runtime.nativeFeatures.autoSigningArmed ? "text-sky-300/80" : "text-[#4a4640]"}>Autosign {runtime.nativeFeatures.autoSigningArmed ? "✓" : "—"}</span>
              <span className={runtime.nativeFeatures.usernamesBound ? "text-emerald-300/80" : "text-[#4a4640]"}>User {runtime.nativeFeatures.usernamesBound ? "✓" : "—"}</span>
              <span className={runtime.nativeFeatures.bridgeConnected ? "text-amber-300/80" : "text-[#4a4640]"}>Bridge {runtime.nativeFeatures.bridgeConnected ? "✓" : "—"}</span>
            </div>
          </div>
        </section>

        {/* ═══ Main: sidebar + tabs ═══ */}
        <section className="mt-3 grid flex-1 items-start gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">

          {/* Sidebar */}
          <aside className="space-y-3">
            <div className="rounded-xl border border-white/[0.07] bg-[radial-gradient(circle_at_top_left,rgba(215,179,123,0.07),transparent_52%)] p-3.5">
              <div className="flex items-center justify-between">
                <p className="section-code text-[9px] text-[#6f695f]">Featured boss</p>
                <span className="rounded-full border border-[#d7b37b]/25 px-2 py-px text-[9px] uppercase tracking-[0.14em] text-[#d7b37b]">{featuredRaid.difficulty}</span>
              </div>
              <h3 className="editorial-title mt-2 text-[1.3rem] leading-[0.92] text-[#f3eee4]">{featuredRaid.enemyName}</h3>
              <p className="mt-1.5 text-[13px] leading-5 text-[#a9a193]">{featuredRaid.synopsis}</p>
              <img src="/nightglass-warden-sigil.png" alt="Nightglass Warden" className="mx-auto mt-3 h-[112px] w-full rounded-[18px] object-contain opacity-90" />
              <div className="mt-2">
                <StatCell label="HP" value={`${featuredRaid.enemyMaxHp}`} />
                <StatCell label="Cost" value={`${featuredRaid.ticketCost}t / ${featuredRaid.energyCost}e`} />
                <StatCell label="Reward" value={`${featuredRaid.rewardRange[0]}–${featuredRaid.rewardRange[1]}`} accent />
                <StatCell label="XP" value={`${featuredRaid.xpReward}`} />
              </div>
              <button onClick={openFeaturedRaid} className="mt-2.5 w-full rounded-lg bg-white/[0.04] py-2 text-center text-[12px] text-[#d7b37b] transition hover:bg-white/[0.08]">Enter boss lane →</button>
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-white/[0.012] p-3.5">
              <p className="section-code text-[9px] text-[#6f695f]">Drops</p>
              <div className="mt-2 space-y-2">
                {featuredRaid.lootTable.map((item) => (
                  <div key={item.id} className="border-b border-white/[0.05] pb-2 last:border-b-0 last:pb-0">
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="text-[13px] text-[#f3eee4]">{item.name}</span>
                      <span className="text-[11px] text-[#d7b37b]">+{item.power}</span>
                    </div>
                    <p className="mt-0.5 text-[12px] leading-5 text-[#a9a193]">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-white/[0.012] p-3.5">
              <p className="section-code text-[9px] text-[#6f695f]">Rules</p>
              <div className="mt-2 space-y-1.5 text-[13px] leading-6 text-[#c2baae]">
                <p><span className="text-[#d7b37b]">1</span> Spend a ticket to enter</p>
                <p><span className="text-[#d7b37b]">2</span> 5 actions max</p>
                <p><span className="text-[#d7b37b]">3</span> Kill boss before timeout</p>
                <p><span className="text-[#d7b37b]">4</span> Clears pay permanent progress</p>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="min-w-0 space-y-4">
            <nav className="flex gap-0.5 border-b border-white/[0.08]">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => runtime.setScreen(tab.id)} className={`relative px-3.5 py-2.5 text-[13px] transition ${runtime.screen === tab.id ? "text-[#f3eee4] after:absolute after:bottom-0 after:left-1.5 after:right-1.5 after:h-px after:bg-[#d7b37b]" : "text-[#6f695f] hover:text-[#a29b91]"}`}>{tab.label}</button>
              ))}
            </nav>
            {content}
          </div>
        </section>

        {/* ═══ Footer ═══ */}
        <footer className="mt-6 border-t border-white/[0.06] pt-3">
          <div className="flex flex-wrap items-start justify-between gap-4 text-[11px] text-[#6f695f]">
            <div>
              <p className="section-code text-[9px]">{runtime.footerTitle}</p>
              <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1">
                {runtime.footerPoints.map((p) => (
                  <p key={p} className="max-w-[280px] leading-4">{p}</p>
                ))}
              </div>
            </div>
            <p className="text-[10px]">Initia Raid Club · MiniEVM · S1</p>
          </div>
        </footer>
      </div>
    </main>
  )
}
