import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { SessionAuthProvider } from "@/components/session-auth-provider"
import { Suspense } from "react"
import { Poppins } from "next/font/google"
import "./globals.css"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
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
    <html lang="en">
      <body className={`${poppins.variable} font-sans`}>
        <Suspense fallback={<div>Loading...</div>}>
          <SessionAuthProvider>{children}</SessionAuthProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
