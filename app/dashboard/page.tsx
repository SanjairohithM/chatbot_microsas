"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sidebar } from "@/components/dashboard/sidebar"
import { BotCard } from "@/components/dashboard/bot-card"
import { CreateBotDialog } from "@/components/dashboard/create-bot-dialog"
import { useAuth } from "@/hooks/use-auth"
import type { Bot as BotType } from "@/lib/types"
import { mockBots } from "@/lib/mock-data"
import { Plus, Search } from "lucide-react"

export default function DashboardPage() {
  const [bots, setBots] = useState<BotType[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingBot, setEditingBot] = useState<BotType | null>(null)
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth")
      return
    }

    // Load mock data
    setBots(mockBots.filter((bot) => bot.user_id === user?.id))
  }, [user, isLoading, router])

  const filteredBots = bots.filter(
    (bot) =>
      bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bot.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleCreateBot = (botData: Partial<BotType>) => {
    const newBot: BotType = {
      id: Math.max(...bots.map((b) => b.id), 0) + 1,
      user_id: user!.id,
      status: "draft",
      is_deployed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...botData,
    } as BotType

    setBots([...bots, newBot])
  }

  const handleEditBot = (bot: BotType) => {
    setEditingBot(bot)
    setIsCreateDialogOpen(true)
  }

  const handleUpdateBot = (botData: Partial<BotType>) => {
    if (!editingBot) return

    setBots(
      bots.map((bot) =>
        bot.id === editingBot.id ? { ...bot, ...botData, updated_at: new Date().toISOString() } : bot,
      ),
    )
    setEditingBot(null)
  }

  const handleDeleteBot = (botId: number) => {
    setBots(bots.filter((bot) => bot.id !== botId))
  }

  const handleToggleStatus = (botId: number, status: "active" | "inactive") => {
    setBots(bots.map((bot) => (bot.id === botId ? { ...bot, status, updated_at: new Date().toISOString() } : bot)))
  }

  const handleChat = (bot: BotType) => {
    // Navigate to chat page with the selected bot
    router.push(`/dashboard/chat?botId=${bot.id}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <div className="lg:pl-64">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Bots</h1>
              <p className="text-muted-foreground mt-1">Manage and configure your AI chatbots</p>
            </div>

            <Button onClick={() => setIsCreateDialogOpen(true)} className="sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create Bot
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bots..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Bots Grid */}
          {filteredBots.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-muted/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No bots found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search terms." : "Get started by creating your first AI chatbot."}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Bot
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredBots.map((bot) => (
                <BotCard
                  key={bot.id}
                  bot={bot}
                  onEdit={handleEditBot}
                  onDelete={handleDeleteBot}
                  onToggleStatus={handleToggleStatus}
                  onChat={handleChat}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateBotDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open)
          if (!open) setEditingBot(null)
        }}
        onSave={editingBot ? handleUpdateBot : handleCreateBot}
        editingBot={editingBot}
      />
    </div>
  )
}
