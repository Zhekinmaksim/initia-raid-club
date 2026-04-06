import type { ReactNode } from "react"

type PanelProps = {
  title?: string
  eyebrow?: string
  accent?: "blue" | "orange" | "green"
  className?: string
  children: ReactNode
}

const accentStyles = {
  blue: "border-white/10",
  orange: "border-white/10",
  green: "border-white/10",
}

const accentBars = {
  blue: "bg-[#f3eee4]",
  orange: "bg-[#d7b37b]",
  green: "bg-[#d7b37b]",
}

export function Panel({ title, eyebrow, accent = "blue", className = "", children }: PanelProps) {
  return (
    <section
      className={`panel-sheen paper-panel p-6 ${accentStyles[accent]} ${className}`}
    >
      {(eyebrow || title) && (
        <header className="mb-6 flex items-start gap-4 border-b border-white/10 pb-4">
          <div className={`mt-1 h-10 w-px ${accentBars[accent]}`} />
          <div>
            {eyebrow ? <p className="section-code text-[10px] text-[#a29b91]">{eyebrow}</p> : null}
            {title ? <h2 className="mt-2 editorial-title text-[2rem] leading-none text-[#f3eee4]">{title}</h2> : null}
          </div>
        </header>
      )}
      {children}
    </section>
  )
}
