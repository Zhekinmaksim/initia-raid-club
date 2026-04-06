import { Panel } from "@/components/panel"
import type { LootItem, PlayerProfile } from "@/lib/game/types"

type InventoryPanelProps = {
  inventory: LootItem[]
  player: PlayerProfile
  onEquip: (itemId: string) => void
}

const rarityClasses = {
  Common: "border-white/10 text-[#d3cbbf]",
  Rare: "border-white/10 text-[#d3cbbf]",
  Epic: "border-white/10 text-[#d3cbbf]",
  Legendary: "border-white/10 text-[#d3cbbf]",
}

export function InventoryPanel({ inventory, player, onEquip }: InventoryPanelProps) {
  if (inventory.length === 0) {
    return (
      <Panel eyebrow="Inventory" title="Loadout and drops" accent="green">
        <div className="border-t border-white/10 pt-4">
          <p className="editorial-title text-[2rem] text-[#f3eee4]">No gear synced yet</p>
          <p className="mt-3 text-sm leading-7 text-[#c7c0b5]">
            Clear a raid to get your first onchain upgrade. In demo mode, use the mock loop until the contract is live.
          </p>
        </div>
      </Panel>
    )
  }

  return (
    <Panel eyebrow="Inventory" title="Loadout and drops" accent="green">
      <div className="grid gap-4 lg:grid-cols-2">
        {inventory.map((item) => {
          const equipped = player.gear[item.slot] === item.id

          return (
            <div key={item.id} className={`paper-panel p-5 ${rarityClasses[item.rarity]}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="section-code text-[10px] text-[#8f877c]">{item.rarity}</p>
                  <h3 className="editorial-title mt-3 text-[2rem] leading-none">{item.name}</h3>
                </div>
                <span className="text-xs uppercase tracking-[0.14em] text-[#8f877c]">
                  {item.slot}
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-[#c7c0b5]">{item.description}</p>
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                <p className="text-sm text-[#d3cbbf]">Power +{item.power}</p>
                <button
                  onClick={() => onEquip(item.id)}
                  className={`text-sm transition ${
                    equipped
                      ? "text-[#f3eee4]"
                      : "text-[#d7b37b]"
                  }`}
                >
                  {equipped ? "Equipped" : "Equip"}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
