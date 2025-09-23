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

    // Load bots from API
    const loadBots = async () => {
      if (!user) return
      
      try {
        const response = await fetch(`/api/bots?userId=${user.id}`)
        if (response.ok) {
          const result = await response.json()
          setBots(result.data)
        } else {
          console.error('Failed to load bots')
          // Fallback to mock data for development
          setBots(mockBots.filter((bot) => bot.user_id === user.id))
        }
      } catch (error) {
        console.error('Error loading bots:', error)
        // Fallback to mock data for development
        setBots(mockBots.filter((bot) => bot.user_id === user.id))
      }
    }

    loadBots()
  }, [user, isLoading, router])

  const filteredBots = bots.filter(
    (bot) =>
      bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bot.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleCreateBot = async (botData: Partial<BotType>) => {
    try {
      const response = await fetch('/api/bots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user!.id,
          ...botData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create bot')
      }

      const result = await response.json()
      const newBot = result.data

      setBots([...bots, newBot])
    } catch (error) {
      console.error('Error creating bot:', error)
      // You could show a toast notification here
    }
  }

  const handleEditBot = (bot: BotType) => {
    setEditingBot(bot)
    setIsCreateDialogOpen(true)
  }

  const handleUpdateBot = async (botData: Partial<BotType>) => {
    if (!editingBot) return

    try {
      const response = await fetch(`/api/bots/${editingBot.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(botData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update bot')
      }

      const result = await response.json()
      const updatedBot = result.data

      setBots(bots.map((bot) => (bot.id === editingBot.id ? updatedBot : bot)))
      setEditingBot(null)
    } catch (error) {
      console.error('Error updating bot:', error)
      // You could show a toast notification here
    }
  }

  const handleDeleteBot = (botId: number) => {
    setBots(bots.filter((bot) => bot.id !== botId))
  }

  const handleToggleStatus = async (botId: number, status: "active" | "inactive") => {
    try {
      console.log('Updating bot status:', { botId, status })
      
      const response = await fetch(`/api/bots/${botId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        throw new Error(errorData.error || 'Failed to update bot status')
      }

      const result = await response.json()
      console.log('Update result:', result)
      const updatedBot = result.data

      setBots(bots.map((bot) => (bot.id === botId ? updatedBot : bot)))
      console.log('Bot status updated successfully')
    } catch (error) {
      console.error('Error updating bot status:', error)
      // You could show a toast notification here
    }
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
