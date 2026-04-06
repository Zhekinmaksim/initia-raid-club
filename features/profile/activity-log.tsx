import { Panel } from "@/components/panel"
import type { ActivityEntry } from "@/lib/game/types"

type ActivityLogProps = {
  activity: ActivityEntry[]
}

const toneClasses = {
  success: "border-white/10",
  warning: "border-white/10",
  neutral: "border-white/10",
}

export function ActivityLog({ activity }: ActivityLogProps) {
  return (
    <Panel eyebrow="Activity" title="Recent chain events">
      <div className="space-y-3">
        {activity.map((entry) => (
          <div key={entry.id} className={`border-b pb-4 ${toneClasses[entry.tone]}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-[#f3eee4]">{entry.title}</p>
              <span className="section-code text-[10px] text-[#8f877c]">{entry.timestamp}</span>
            </div>
            <p className="mt-3 text-sm leading-7 text-[#c7c0b5]">{entry.detail}</p>
          </div>
        ))}
      </div>
    </Panel>
  )
}
