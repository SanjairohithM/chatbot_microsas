import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { SessionAuthProvider } from "@/components/session-auth-provider"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Convox",
  description: "Convox is a platform for building and deploying chatbots.",
  generator: "convox.ai",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans bg-background text-foreground antialiased">
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-background text-foreground">Loading...</div>}>
          <SessionAuthProvider>{children}</SessionAuthProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
