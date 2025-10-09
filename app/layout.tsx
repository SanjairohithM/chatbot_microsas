import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { SessionAuthProvider } from "@/components/session-auth-provider"
import { Suspense } from "react"
import { Inter, Space_Grotesk, Playfair_Display, Outfit } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
})

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-playfair",
})

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
})

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
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${playfairDisplay.variable} ${outfit.variable} font-sans bg-background text-foreground antialiased`}>
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-background text-foreground">Loading...</div>}>
          <SessionAuthProvider>{children}</SessionAuthProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
