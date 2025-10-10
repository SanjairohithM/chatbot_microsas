

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
    // Navigate to the new chatbot creation page
    router.push('/dashboard/create-chatbot')
  }

  return (
    <DashboardLayout onCreateBotClick={handleCreateBotClick}>
      {children}
    </DashboardLayout>
  )
}



