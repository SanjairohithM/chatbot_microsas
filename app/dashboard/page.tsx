"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sidebar } from "@/components/dashboard/sidebar"
import { BotCard } from "@/components/dashboard/bot-card"
import { CreateBotDialog } from "@/components/dashboard/create-bot-dialog"
import { useAuth } from "@/hooks/use-auth"
import type { Bot as BotType, KnowledgeDocument } from "@/lib/types"
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

  const handleCreateBot = async (botData: Partial<BotType>, documents?: KnowledgeDocument[]) => {
    try {
      // First, create the bot
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

      // If documents were uploaded, save them to the database
      if (documents && documents.length > 0) {
        try {
          const documentPromises = documents.map(async doc => {
            const response = await fetch('/api/knowledge-documents', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                bot_id: newBot.id,
                title: doc.title,
                content: doc.content,
                file_url: doc.file_url,
                file_type: doc.file_type,
                file_size: doc.file_size,
                status: 'processing'
              })
            })
            
            if (response.ok) {
              const result = await response.json()
              const savedDoc = result.data
              
              // Process the document if it has a file URL
              if (savedDoc.file_url && savedDoc.file_url !== '') {
                try {
                  await fetch('/api/documents/process', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      documentId: savedDoc.id
                    })
                  })
                } catch (processError) {
                  console.error('Error processing document:', processError)
                }
              }
            }
          })

          await Promise.all(documentPromises)
          console.log('All documents saved and processed successfully')
        } catch (docError) {
          console.error('Error saving documents:', docError)
          // Bot was created successfully, but documents failed
          // You could show a warning notification here
        }
      }

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="p-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl w-20 h-20 mx-auto flex items-center justify-center shadow-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
          <p className="text-slate-600 text-lg font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Sidebar />

      <div className="lg:pl-64">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                My Bots
              </h1>
              <p className="text-slate-600 text-lg">Manage and configure your AI chatbots</p>
            </div>

            <Button 
              onClick={() => setIsCreateDialogOpen(true)} 
              className="sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Bot
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Search bots..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-white/80 backdrop-blur-sm border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl shadow-sm"
              />
            </div>
          </div>

          {/* Bots Grid */}
          {filteredBots.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative">
                <div className="p-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-lg">
                  <Plus className="h-10 w-10 text-blue-600" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-slate-800">No bots found</h3>
              <p className="text-slate-600 mb-6 text-lg max-w-md mx-auto">
                {searchQuery ? "Try adjusting your search terms." : "Get started by creating your first AI chatbot."}
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  size="lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Bot
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
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
