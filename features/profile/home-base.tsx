import { Panel } from "@/components/panel"
import { ProgressBar } from "@/components/progress-bar"
import { raidDefinitions } from "@/lib/game/data"
import type { NativeFeatureStatus, PlayerProfile } from "@/lib/game/types"

type HomeBaseProps = {
  player: PlayerProfile
  nativeFeatures: NativeFeatureStatus
  onBridgeIn: () => void
  onMintTicket: () => void
  onSelectRaid: (raidId: string) => void
  bridgeLabel?: string
  ticketLabel?: string
}

export function HomeBase({
  player,
  nativeFeatures,
  onBridgeIn,
  onMintTicket,
  onSelectRaid,
  bridgeLabel = "Bridge in 25",
  ticketLabel = "Mint ticket",
}: HomeBaseProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Panel eyebrow="Home Base" title="Command Deck" accent="orange">
          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="border-t border-white/10 pt-4">
              <p className="section-code text-[10px] text-[#8f877c]">Raid identity</p>
              <p className="editorial-title mt-4 text-[3rem] leading-[0.92] text-[#f3eee4]">{player.username ?? "Claim username"}</p>
              <p className="mt-3 text-[15px] leading-7 text-[#d0c8bb]">{player.faction} faction, level {player.level}.</p>

              <dl className="mt-5 grid gap-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                  <dt className="text-[#8f877c]">Auto-signing</dt>
                  <dd className="text-[#f3eee4]">{nativeFeatures.autoSigningArmed ? "Armed" : "Offline"}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                  <dt className="text-[#8f877c]">Usernames</dt>
                  <dd className="text-[#f3eee4]">{nativeFeatures.usernamesBound ? "Bound" : "Pending"}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                  <dt className="text-[#8f877c]">Bridge</dt>
                  <dd className="text-[#f3eee4]">{nativeFeatures.bridgeConnected ? "Ready" : "Offline"}</dd>
                </div>
              </dl>
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="section-code text-[10px] text-[#8f877c]">Quick treasury actions</p>
              <p className="mt-4 text-[15px] leading-7 text-[#d0c8bb]">Top up, mint a ticket, and go again.</p>
              <div className="mt-5 flex flex-col gap-3">
                <button
                  onClick={onBridgeIn}
                  className="border-b border-white/10 pb-3 text-left text-[15px] text-[#d7b37b] transition hover:text-[#f3eee4]"
                >
                  {bridgeLabel}
                </button>
                <button
                  onClick={onMintTicket}
                  className="border-b border-white/10 pb-3 text-left text-[15px] text-[#d7b37b] transition hover:text-[#f3eee4]"
                >
                  {ticketLabel}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="border-t border-white/10 pt-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="section-code text-[10px] text-[#8f877c]">Health</p>
                  <p className="editorial-title mt-3 text-[2.1rem] text-[#f3eee4]">{player.hp}</p>
                </div>
                <p className="text-[13px] text-[#a9a193]">combat ready</p>
              </div>
              <div className="mt-4">
                <ProgressBar value={player.hp} max={player.maxHp} tone="rose" />
              </div>
            </div>
            <div className="border-t border-white/10 pt-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="section-code text-[10px] text-[#8f877c]">Energy</p>
                  <p className="editorial-title mt-3 text-[2.1rem] text-[#f3eee4]">{player.energy}</p>
                </div>
                <p className="text-[13px] text-[#a9a193]">{player.tickets} tickets live</p>
              </div>
              <div className="mt-4">
                <ProgressBar value={player.energy} max={player.maxEnergy} tone="green" />
              </div>
            </div>
            <div className="border-t border-white/10 pt-4">
              <p className="section-code text-[10px] text-[#8f877c]">Bridge treasury</p>
              <p className="editorial-title mt-3 text-[2.1rem] text-[#f3eee4]">{player.bridgeBalance} INIT</p>
              <p className="mt-2 text-[15px] leading-7 text-[#d0c8bb]">Enough for another demo run.</p>
            </div>
          </div>
        </Panel>

        <Panel eyebrow="Featured Operation" title="Nightglass Warden" accent="blue">
          <div className="border-t border-white/10 pt-4">
            <p className="section-code text-[10px] text-[#8f877c]">Daily boss</p>
            <p className="mt-4 text-[15px] leading-7 text-[#d0c8bb]">A short boss run tuned for a 45-second demo. Guard once, push twice, then finish on special.</p>

            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="section-code text-[10px] text-[#8f877c]">Modifier</p>
              <p className="mt-3 text-[15px] leading-7 text-[#d0c8bb]">The boss changes stance every turn. Wait for the opening.</p>
            </div>

            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="section-code text-[10px] text-[#8f877c]">How one run works</p>
              <div className="mt-4 space-y-3 text-[15px] leading-7 text-[#d0c8bb]">
                <p>1. Claim a handle, then pick a raid.</p>
                <p>2. Starting a raid spends tickets and energy.</p>
                <p>3. You get up to 5 turns: attack, guard, special, or recover.</p>
                <p>4. Win by dropping the boss HP to zero before turn five ends.</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-4 border-t border-white/10 pt-4 text-xs text-[#c7c0b5]">
              <span>1-2 tickets</span>
              <span>12-24 energy</span>
              <span>coins + XP + gear</span>
            </div>
          </div>

          <button
            onClick={() => onSelectRaid("eclipse-altar")}
            className="mt-5 text-[15px] text-[#d7b37b] underline underline-offset-4"
          >
            Enter boss lane
          </button>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {raidDefinitions.map((raid) => (
          <button
            key={raid.id}
            onClick={() => onSelectRaid(raid.id)}
            className="paper-panel p-5 text-left transition hover:border-white/20"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-code text-[10px] text-[#8f877c]">{raid.theme}</p>
                <h3 className="editorial-title mt-4 text-[2.1rem] leading-[0.92] text-[#f3eee4]">{raid.name}</h3>
              </div>
              <span className="text-[13px] text-[#a9a193]">{raid.difficulty}</span>
            </div>
            <p className="mt-4 text-[15px] leading-7 text-[#d0c8bb]">{raid.synopsis}</p>
            <div className="mt-5 grid grid-cols-3 gap-4 border-t border-white/10 pt-3 text-xs text-[#c7c0b5]">
              <span>{raid.ticketCost} ticket</span>
              <span>{raid.energyCost} energy</span>
              <span>{raid.xpReward} XP</span>
            </div>
            <p className="mt-5 text-[13px] uppercase tracking-[0.16em] text-[#d7b37b]">Deploy raid</p>
          </button>
        ))}
      </div>
    </div>
  )
}
