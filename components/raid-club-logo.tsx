type RaidClubBrandMarkProps = {
  className?: string
}

export function RaidClubBrandMark({ className = "" }: RaidClubBrandMarkProps) {
  return (
    <div
      className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-[24px] border border-[#d7b37b]/18 bg-[#0f0d0a] shadow-[0_10px_30px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.04)] ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(243,238,228,0.05),transparent_26%),radial-gradient(circle_at_50%_100%,rgba(215,179,123,0.12),transparent_38%)]" />
      <img src="/nightglass-warden-sigil.png" alt="Initia Raid Club mark" className="relative h-full w-full object-cover" />
    </div>
  )
}
