import type { Metadata } from "next"
import "./globals.css"
import Providers from "./providers"

export const metadata: Metadata = {
  title: "Initia Raid Club",
  description:
    "Async raid game MVP for the Initia hackathon, built around auto-signing, usernames, and demo-first product UX.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-body antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
