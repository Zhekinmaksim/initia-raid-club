import { Panel } from "@/components/panel"
import type { LeaderboardEntry } from "@/lib/game/types"

type LeaderboardPanelProps = {
  entries: LeaderboardEntry[]
}

export function LeaderboardPanel({ entries }: LeaderboardPanelProps) {
  return (
    <Panel eyebrow="Leaderboard" title="Raid standings" accent="blue">
      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className="grid gap-3 border-b border-white/10 pb-4 md:grid-cols-[64px_1fr_auto]"
          >
            <div className="editorial-title text-[2.2rem] leading-none text-[#d7b37b]">
              {index + 1}
            </div>
            <div>
              <p className="editorial-title text-[2rem] leading-none text-[#f3eee4]">{entry.username}</p>
              <p className="mt-2 text-sm text-[#c7c0b5]">
                {entry.faction} | streak {entry.streak} | loot {entry.totalLoot}
              </p>
            </div>
            <div className="text-right">
              <p className="section-code text-[10px] text-[#8f877c]">Score</p>
              <p className="editorial-title mt-3 text-[2rem] text-[#f3eee4]">{entry.score}</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}
