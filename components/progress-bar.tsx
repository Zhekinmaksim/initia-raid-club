type ProgressBarProps = {
  value: number
  max: number
  tone?: "blue" | "orange" | "green" | "rose"
  label?: string
}

const toneStyles = {
  blue: "from-[#f3eee4] to-[#d7b37b]",
  orange: "from-[#d7b37b] to-[#f3eee4]",
  green: "from-[#d7b37b] to-[#f3eee4]",
  rose: "from-[#d7b37b] to-[#f3eee4]",
}

export function ProgressBar({ value, max, tone = "blue", label }: ProgressBarProps) {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100))

  return (
    <div className="space-y-2">
      {label ? <div className="flex justify-between text-xs text-[#8f877c]"><span>{label}</span><span>{value}/{max}</span></div> : null}
      <div className="h-2 rounded-full bg-white/10">
        <div
          className={`h-2 rounded-full bg-gradient-to-r ${toneStyles[tone]} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
