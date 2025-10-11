"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { BotCard } from "@/components/dashboard/bot-card"
import { CreateBotDialog } from "@/components/dashboard/create-bot-dialog"
import { DeleteBotDialog } from "@/components/dashboard/delete-bot-dialog"
import { useAuth } from "@/hooks/use-auth"
import type { Bot as BotType, KnowledgeDocument } from "@/lib/types"
import { mockBots } from "@/lib/mock-data"
import { Plus, Search, Bot } from "lucide-react"

export default function DashboardPage() {
  const [bots, setBots] = useState<BotType[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingBot, setEditingBot] = useState<BotType | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [botToDelete, setBotToDelete] = useState<BotType | null>(null)
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

  // Listen for custom event from layout to open create bot dialog
  useEffect(() => {
    const handleOpenCreateBotDialog = () => {
      setIsCreateDialogOpen(true)
    }

    window.addEventListener('openCreateBotDialog', handleOpenCreateBotDialog)
    
    return () => {
      window.removeEventListener('openCreateBotDialog', handleOpenCreateBotDialog)
    }
  }, [])

  const filteredBots = bots.filter(
    (bot) =>
      bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bot.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleCreateBot = async (botData: Partial<BotType>, documents?: KnowledgeDocument[]) => {
    try {
      console.log(`[Dashboard] 🚀 Starting bot creation for user: ${user!.id}`)
      console.log(`[Dashboard] Bot data:`, botData)
      
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

      console.log(`[Dashboard] API response status: ${response.status}`)

      if (!response.ok) {
        const errorData = await response.json()
        console.error(`[Dashboard] ❌ API error:`, errorData)
        throw new Error(errorData.message || errorData.error || 'Failed to create bot')
      }

      const result = await response.json()
      const newBot = result.data
      
      console.log(`[Dashboard] ✅ Bot created successfully with ID: ${newBot.id}`)
      console.log(`[Dashboard] Bot data:`, newBot)

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

      // Handle website scraping if website_url is provided
      console.log(`[Dashboard] Checking for website data in botData:`, {
        hasWebsiteUrl: !!(botData as any).website_url,
        hasWebsiteContent: !!(botData as any).website_content,
        websiteUrl: (botData as any).website_url,
        websiteContentLength: (botData as any).website_content?.length
      })
      
      if ((botData as any).website_url && (botData as any).website_content) {
        try {
          console.log(`[Dashboard] 🌐 Starting website scraping for bot ${newBot.id}`)
          console.log(`[Dashboard] Website URL: ${(botData as any).website_url}`)
          console.log(`[Dashboard] Website content length: ${(botData as any).website_content.length}`)
          
          const scrapeResponse = await fetch('/api/scrape-website', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: (botData as any).website_url,
              botId: newBot.id
            })
          })

          console.log(`[Dashboard] Scrape response status: ${scrapeResponse.status}`)

          if (scrapeResponse.ok) {
            const scrapeResult = await scrapeResponse.json()
            console.log(`[Dashboard] ✅ Website scraping completed for bot ${newBot.id}`)
            console.log(`[Dashboard] Pinecone stored: ${scrapeResult.data.pineconeStored}`)
            console.log(`[Dashboard] Document created: ${scrapeResult.data.document ? 'Yes' : 'No'}`)
          } else {
            const errorText = await scrapeResponse.text()
            console.error(`[Dashboard] ❌ Failed to scrape and store website:`, errorText)
          }
        } catch (scrapeError) {
          console.error(`[Dashboard] ❌ Error scraping website:`, scrapeError)
        }
      } else {
        console.log(`[Dashboard] No website URL provided, skipping scraping`)
        console.log(`[Dashboard] BotData keys:`, Object.keys(botData))
      }

      setBots([...bots, newBot])
      console.log(`[Dashboard] ✅ Bot added to local state successfully`)
    } catch (error) {
      console.error('[Dashboard] ❌ Error creating bot:', error)
      console.error('[Dashboard] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      // Re-throw the error so the dialog can handle it
      throw error
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

      // Handle website scraping if website_url is provided and different from current
      if ((botData as any).website_url && (botData as any).website_content && (botData as any).website_url !== (editingBot as any).website_url) {
        try {
          console.log(`[Dashboard] Scraping website for bot ${editingBot.id}: ${(botData as any).website_url}`)
          
          const scrapeResponse = await fetch('/api/scrape-website', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: (botData as any).website_url,
              botId: editingBot.id
            })
          })

          if (scrapeResponse.ok) {
            const scrapeResult = await scrapeResponse.json()
            console.log(`[Dashboard] Website scraped and stored for bot ${editingBot.id}:`, scrapeResult.data.pineconeStored)
          } else {
            console.error('Failed to scrape and store website:', await scrapeResponse.text())
          }
        } catch (scrapeError) {
          console.error('Error scraping website:', scrapeError)
        }
      }

      setBots(bots.map((bot) => (bot.id === editingBot.id ? updatedBot : bot)))
      setEditingBot(null)
    } catch (error) {
      console.error('Error updating bot:', error)
      // You could show a toast notification here
    }
  }

  const handleDeleteBot = async (botId: number) => {
    const bot = bots.find(b => b.id === botId)
    if (bot) {
      setBotToDelete(bot)
      setIsDeleteDialogOpen(true)
    }
  }

  const handleConfirmDelete = async (botId: number) => {
    try {
      const response = await fetch(`/api/bots/${botId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        // Remove bot from local state
        setBots(bots.filter((bot) => bot.id !== botId))
        console.log('Bot deleted successfully')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete bot')
      }
    } catch (error) {
      console.error('Error deleting bot:', error)
      throw error // Re-throw to be handled by the dialog
    }
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="p-6 bg-blue-100 rounded-3xl w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          </div>
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Main Content Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bots</h1>
        <p className="text-gray-600 text-lg">Manage and configure your AI chatbots</p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search bots..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Bots Grid */}
      {filteredBots.length === 0 ? (
        <div className="text-center py-16">
          <div className="p-6 bg-blue-100 rounded-3xl w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <Plus className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-2xl font-semibold mb-3 text-gray-800">No bots found</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchQuery ? "Try adjusting your search terms." : "Get started by creating your first AI chatbot."}
          </p>
          {!searchQuery && (
            <Button 
              onClick={() => {
                console.log('🎯 Create Bot button clicked!')
                setIsCreateDialogOpen(true)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Bot
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
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

      {/* Create Bot Dialog */}
      <CreateBotDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          console.log('🔄 Dialog open state changing to:', open)
          setIsCreateDialogOpen(open)
          if (!open) {
            setEditingBot(null)
          }
        }}
        onSave={handleCreateBot}
        editingBot={editingBot}
      />

      {/* Delete Bot Dialog */}
      <DeleteBotDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        bot={botToDelete}
      />
    </div>
  )
}
