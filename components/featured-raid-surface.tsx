"use client"

import { useMemo, useState } from "react"
import type { RaidDefinition } from "@/lib/game/types"

type EncounterStep = {
  label: string
  detail: string
}

type FeaturedRaidSurfaceProps = {
  raid: RaidDefinition
  openingSequence: EncounterStep[]
}

type EncounterState = {
  turn: number
  stance: string
  enemyHp: number
  playerHp: number
  recommendedAction: string
  threat: string
  payoff: string
  note: string
  directive: EncounterStep
}

export function FeaturedRaidSurface({ raid, openingSequence }: FeaturedRaidSurfaceProps) {
  const encounterStates = useMemo<EncounterState[]>(
    () => [
      {
        turn: 1, stance: "Guarded", enemyHp: raid.enemyMaxHp, playerHp: 100,
        recommendedAction: "Guard", threat: "High", payoff: "Locked",
        note: "The warden opens armored. Defensive tempo, not greed.",
        directive: openingSequence[0],
      },
      {
        turn: 2, stance: "Counter", enemyHp: Math.max(raid.enemyMaxHp - 26, 0), playerHp: 91,
        recommendedAction: "Attack", threat: "Medium",
        payoff: `${Math.round((raid.rewardRange[0] + raid.rewardRange[1]) / 2)} coins`,
        note: "Shell cracks for one beat. Push the counter hit.",
        directive: openingSequence[1],
      },
      {
        turn: 3, stance: "Breach", enemyHp: Math.max(raid.enemyMaxHp - 58, 0), playerHp: 84,
        recommendedAction: "Special", threat: "Committed",
        payoff: `${raid.rewardRange[1]} coins`,
        note: "Take the burst line and cash out before stance resets.",
        directive: openingSequence[2],
      },
    ],
    [openingSequence, raid.enemyMaxHp, raid.rewardRange],
  )

  const [activeIndex, setActiveIndex] = useState(0)
  const s = encounterStates[activeIndex]
  const ehp = Math.max(0, Math.min(100, (s.enemyHp / raid.enemyMaxHp) * 100))

  return (
    <div className="mt-4 rounded-2xl border border-white/[0.08] bg-black/20 p-4">
      {/* Turn selector */}
      <div className="flex gap-1.5">
        {encounterStates.map((state, i) => (
          <button
            key={state.turn}
            onClick={() => setActiveIndex(i)}
            className={`flex-1 rounded-lg border px-3 py-2 text-left transition ${
              i === activeIndex
                ? "border-[#d7b37b]/30 bg-[rgba(215,179,123,0.08)]"
                : "border-white/[0.06] hover:border-white/10"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`editorial-title text-[1.1rem] leading-none ${i === activeIndex ? "text-[#d7b37b]" : "text-[#4a4640]"}`}>{state.turn}</span>
              <span className={`text-[11px] uppercase tracking-[0.14em] ${i === activeIndex ? "text-[#f3eee4]" : "text-[#8f877c]"}`}>{state.recommendedAction}</span>
            </div>
            <p className="mt-1.5 text-[13px] text-[#aaa294]">{state.stance}</p>
          </button>
        ))}
      </div>

      {/* Active state */}
      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_140px]">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[#d7b37b]/25 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[#d7b37b]">{s.stance}</span>
            <span className="text-[13px] text-[#9b9387]">Turn {s.turn} of 5</span>
          </div>
          <p className="mt-2 text-[15px] leading-6 text-[#f3eee4]">{s.directive.label}</p>
          <p className="mt-1.5 text-[14px] leading-6 text-[#b8afa1]">{s.note}</p>

          {/* Compact metrics row */}
          <div className="mt-3 flex flex-wrap gap-3 text-[13px]">
            <div>
              <span className="text-[#8f877c]">Boss </span>
              <span className="text-[#f3eee4]">{s.enemyHp}</span>
            </div>
            <div>
              <span className="text-[#8f877c]">Pilot </span>
              <span className="text-[#f3eee4]">{s.playerHp}</span>
            </div>
            <div>
              <span className="text-[#8f877c]">Threat </span>
              <span className="text-[#f3eee4]">{s.threat}</span>
            </div>
            <div>
              <span className="text-[#8f877c]">Payout </span>
              <span className="text-[#d7b37b]">{s.payoff}</span>
            </div>
          </div>

          {/* HP bar */}
          <div className="mt-2 h-1.5 rounded-full bg-white/[0.06]">
            <div className="h-1.5 rounded-full bg-gradient-to-r from-[#d7b37b] to-[#f3eee4] transition-all duration-500" style={{ width: `${ehp}%` }} />
          </div>
        </div>

        {/* Sigil thumbnail */}
        <div className="flex flex-col items-center rounded-xl border border-white/[0.06] bg-black/20 p-2.5">
          <img src="/nightglass-warden-sigil.png" alt="Warden sigil" className="h-[78px] w-full object-contain opacity-90" />
          <span className="mt-1.5 text-[11px] uppercase tracking-[0.14em] text-[#9b9387]">{s.stance}</span>
        </div>
      </div>
    </div>
  )
}
