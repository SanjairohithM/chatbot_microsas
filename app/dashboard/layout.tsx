

"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useRouter } from "next/navigation"

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  const handleCreateBotClick = () => {
    // This will trigger the create bot dialog in the dashboard page
    // We'll use a custom event to communicate between layout and page
    window.dispatchEvent(new CustomEvent('openCreateBotDialog'))
  }

  return (
    <DashboardLayout onCreateBotClick={handleCreateBotClick}>
      {children}
    </DashboardLayout>
  )
}



