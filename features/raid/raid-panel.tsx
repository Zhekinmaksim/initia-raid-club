import { Panel } from "@/components/panel"
import { ProgressBar } from "@/components/progress-bar"
import { getRaidDefinition } from "@/lib/game/engine"
import type { ActionType, PlayerProfile, RaidSession } from "@/lib/game/types"

const actionDeck: Array<{ id: ActionType; label: string; description: string }> = [
  { id: "attack", label: "Attack", description: "Low-cost damage." },
  { id: "guard", label: "Guard", description: "Safer turn. Take less damage." },
  { id: "special", label: "Special", description: "Heavy burst. Best used to finish." },
  { id: "recover", label: "Recover", description: "Recover some HP." },
]

type RaidPanelProps = {
  session: RaidSession | null
  player: PlayerProfile
  onAction: (action: ActionType) => void
  onReturn: () => void
}

export function RaidPanel({ session, player, onAction, onReturn }: RaidPanelProps) {
  if (!session) {
    return (
      <Panel eyebrow="Raid Feed" title="No raid active">
        <p className="text-sm leading-7 text-[#c7c0b5]">Pick a raid from the base to open the live combat view.</p>
      </Panel>
    )
  }

  const raid = getRaidDefinition(session.raidId)

  if (!raid) {
    return null
  }

  const actionDisabled = session.status !== "active" || session.autoSigning.pending

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <Panel eyebrow="Live Raid" title={raid.name} accent="orange">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#8f877c]">
              <span>{raid.theme}</span>
              <span>/</span>
              <span>{raid.difficulty}</span>
              <span>/</span>
              <span>Turn {session.turn}</span>
            </div>

            <div className="grid gap-3 border-t border-white/10 pt-4 md:grid-cols-3">
              <div>
                <p className="section-code text-[10px] text-[#8f877c]">Goal</p>
                <p className="mt-2 text-sm leading-7 text-[#c7c0b5]">
                  For the featured boss demo, clear the fight in three turns: guard, attack, special.
                </p>
              </div>
              <div>
                <p className="section-code text-[10px] text-[#8f877c]">Fail state</p>
                <p className="mt-2 text-sm leading-7 text-[#c7c0b5]">You lose if your HP hits zero or the boss is still up after turn five.</p>
              </div>
              <div>
                <p className="section-code text-[10px] text-[#8f877c]">Reward</p>
                <p className="mt-2 text-sm leading-7 text-[#c7c0b5]">A clear pays coins, XP, and sometimes gear.</p>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="section-code text-[10px] text-[#8f877c]">Enemy</p>
                  <p className="editorial-title mt-3 text-[2.3rem] leading-none text-[#f3eee4]">{session.enemyName}</p>
                </div>
                <p className="max-w-xs text-right text-sm leading-7 text-[#a29b91]">{raid.bossModifier}</p>
              </div>
              <div className="mt-4">
                <ProgressBar value={session.enemyHp} max={session.enemyMaxHp} tone="orange" label="Enemy HP" />
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="section-code text-[10px] text-[#8f877c]">Raider</p>
                  <p className="editorial-title mt-3 text-[2.3rem] leading-none text-[#f3eee4]">{player.username ?? "Unbound user"}</p>
                </div>
                <p className="text-sm text-[#a29b91]">{player.coins} coins</p>
              </div>
              <div className="mt-4">
                <ProgressBar value={player.hp} max={player.maxHp} tone="rose" label="Player HP" />
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="section-code text-[10px] text-[#8f877c]">Auto-signing status</p>
              <p className="mt-3 text-sm leading-7 text-[#c7c0b5]">{session.autoSigning.message}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {actionDeck.map((action, index) => (
                <button
                  key={action.id}
                  onClick={() => onAction(action.id)}
                  disabled={actionDisabled}
                  className="paper-panel p-4 text-left transition enabled:hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <p className="section-code text-[10px] text-[#8f877c]">0{index + 1}</p>
                  <p className="editorial-title mt-3 text-[1.9rem] leading-none text-[#f3eee4]">{action.label}</p>
                  <p className="mt-3 text-sm leading-7 text-[#c7c0b5]">{action.description}</p>
                </button>
              ))}
            </div>

            {session.status !== "active" ? (
              <button onClick={onReturn} className="text-left text-sm text-[#d7b37b] underline underline-offset-4">
                Return to base
              </button>
            ) : null}
          </div>
        </Panel>

        <Panel eyebrow="Raid Transcript" title="Chain feed" accent="blue">
          <div className="space-y-3">
            {session.transcript.map((entry) => (
              <div
                key={entry.id}
                className={`border-b pb-4 ${
                  entry.speaker === "player"
                    ? "border-white/10"
                    : entry.speaker === "enemy"
                      ? "border-white/10"
                      : "border-white/10"
                }`}
              >
                <p className="section-code text-[10px] text-[#8f877c]">{entry.speaker}</p>
                <p className="mt-3 text-sm leading-7 text-[#d3cbbf]">{entry.message}</p>
              </div>
            ))}
          </div>

          {session.status !== "active" ? (
            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="section-code text-[10px] text-[#8f877c]">Settlement</p>
              <p className="mt-3 text-sm leading-7 text-[#d3cbbf]">
                {session.status === "won"
                  ? `Clear confirmed. ${session.rewardCoins} coins and ${session.rewardXp} XP added${session.rewardItem ? `, plus ${session.rewardItem.name}.` : "."}`
                  : "Run failed. HP refills on return so you can go again."}
              </p>
            </div>
          ) : null}
        </Panel>
      </div>
    </div>
  )
}
