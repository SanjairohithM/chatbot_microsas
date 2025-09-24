"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/dashboard/sidebar"
import { ConversationSidebar } from "@/components/dashboard/conversation-sidebar"
import { ChatMessage } from "@/components/dashboard/chat-message"
import { ChatInput } from "@/components/dashboard/chat-input"
import { useAuth } from "@/hooks/use-auth"
import { useChat } from "@/hooks/use-chat"
import type { Bot, Conversation, Message } from "@/lib/types"
import { mockBots, mockConversations } from "@/lib/mock-data"
import { MessageSquare, Settings, Play } from "lucide-react"

// Mock messages for demonstration
const mockMessages: Message[] = [
  {
    id: 1,
    conversation_id: 1,
    role: "system",
    content: "Conversation started",
    created_at: "2024-01-21T09:00:00Z",
  },
  {
    id: 2,
    conversation_id: 1,
    role: "user",
    content: "Hi, I'm looking for a gaming laptop under $1500",
    created_at: "2024-01-21T09:00:30Z",
  },
  {
    id: 3,
    conversation_id: 1,
    role: "assistant",
    content:
      "I'd be happy to help you find a gaming laptop under $1500. Based on our current inventory, I recommend the following options:\n\n1) Gaming Pro X15 - $1299\n2) PowerBook Gaming - $1399\n\nBoth offer excellent performance for gaming. Would you like more details about either of these models?",
    tokens_used: 45,
    response_time_ms: 850,
    created_at: "2024-01-21T09:00:35Z",
  },
]

export default function ChatPage() {
  const [bots, setBots] = useState<Bot[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedBotId, setSelectedBotId] = useState<string>("")
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { user, isLoading: authLoading } = useAuth()
  const { sendMessageWithBot, isLoading: chatLoading, error: chatError } = useChat({
    onError: (error) => {
      console.error('Chat error:', error)
      // You could show a toast notification here
    }
  })
  const router = useRouter()
  const searchParams = useSearchParams()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth")
      return
    }

    // Load bots and conversations from API
    const loadData = async () => {
      if (!user) return

      try {
        // Load user's active bots
        const botsResponse = await fetch(`/api/bots?userId=${user.id}&status=active`)
        if (botsResponse.ok) {
          const botsResult = await botsResponse.json()
          setBots(botsResult.data)
          
          // Auto-select bot from URL parameter or first available bot
          const botIdFromUrl = searchParams.get('botId')
          if (botIdFromUrl && botsResult.data.find((bot: Bot) => bot.id.toString() === botIdFromUrl)) {
            setSelectedBotId(botIdFromUrl)
          } else if (botsResult.data.length > 0 && !selectedBotId) {
            setSelectedBotId(botsResult.data[0].id.toString())
          }
        }

        // Load conversations
        const conversationsResponse = await fetch(`/api/conversations?userId=${user.id}`)
        if (conversationsResponse.ok) {
          const conversationsResult = await conversationsResponse.json()
          setConversations(conversationsResult.data)
        }
      } catch (error) {
        console.error('Failed to load chat data:', error)
        // Fallback to mock data for development
        const userBots = mockBots.filter((bot) => bot.user_id === user.id && bot.status === "active")
        setBots(userBots)
        const botIds = userBots.map((bot) => bot.id)
        const userConversations = mockConversations.filter((conv) => botIds.includes(conv.bot_id))
        setConversations(userConversations)
      }
    }

    loadData()
  }, [user, authLoading, router, selectedBotId, searchParams])

  useEffect(() => {
    // Load messages for selected conversation
    const loadMessages = async () => {
      if (selectedConversationId) {
        try {
          const response = await fetch(`/api/conversations/${selectedConversationId}/messages`)
          if (response.ok) {
            const result = await response.json()
            setMessages(result.data)
          } else {
            console.error('Failed to load messages')
            setMessages([])
          }
        } catch (error) {
          console.error('Error loading messages:', error)
          setMessages([])
        }
      } else {
        setMessages([])
      }
    }

    loadMessages()
  }, [selectedConversationId])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const selectedBot = bots.find((bot) => bot.id === Number.parseInt(selectedBotId))
  const selectedConversation = conversations.find((conv) => conv.id === selectedConversationId)

  const handleNewConversation = async () => {
    if (!selectedBot || !user) return

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botId: selectedBot.id,
          userId: user.id,
          title: 'New Conversation',
          isTest: false
        }),
      })

      if (response.ok) {
        const result = await response.json()
        const newConversation = result.data
        
        setConversations([newConversation, ...conversations])
        setSelectedConversationId(newConversation.id)
        setMessages([])
      } else {
        console.error('Failed to create conversation')
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
    }
  }

  const handleSendMessage = async (content: string, imageUrl?: string) => {
    if (!selectedBot || !user) return

    console.log('Sending message:', { content, imageUrl, selectedBot: selectedBot.id, userId: user.id, conversationId: selectedConversationId })

    // Add user message to UI immediately
    const userMessage: Message = {
      id: Date.now(), // Temporary ID
      conversation_id: selectedConversationId || 0,
      role: "user",
      content,
      image_url: imageUrl,
      created_at: new Date().toISOString(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setIsLoading(true)

    try {
      // Send message to API
      console.log('Calling sendMessageWithBot with:', { updatedMessages, selectedBot, userId: user.id, selectedConversationId })
      const response = await sendMessageWithBot(
        updatedMessages, 
        selectedBot, 
        user.id, 
        selectedConversationId
      )

      console.log('Received response from API:', response)

      // Add assistant response
      const assistantMessage: Message = {
        id: response.messageId || Date.now() + 1,
        conversation_id: response.conversationId || selectedConversationId || 0,
        role: "assistant",
        content: response.message,
        image_analysis: response.image_analysis,
        tokens_used: response.usage?.total_tokens,
        response_time_ms: response.response_time_ms,
        created_at: new Date().toISOString(),
      }

      console.log('Adding assistant message to UI:', assistantMessage)
      setMessages((prev) => [...prev, assistantMessage])

      // Update conversation ID if it was created
      if (response.conversationId && response.conversationId !== selectedConversationId) {
        console.log('Updating conversation ID from', selectedConversationId, 'to', response.conversationId)
        setSelectedConversationId(response.conversationId)
      }

      // Update conversation title if it's the first user message
      if (selectedConversation?.title === "New Conversation") {
        const newTitle = content.length > 50 ? content.substring(0, 50) + "..." : content
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === (response.conversationId || selectedConversationId)
              ? { ...conv, title: newTitle, updated_at: new Date().toISOString() }
              : conv,
          ),
        )
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now() + 2,
        conversation_id: selectedConversationId || 0,
        role: "assistant",
        content: "Sorry, I encountered an error while processing your request. Please try again.",
        created_at: new Date().toISOString(),
      }
      
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteConversation = async (conversationId: number) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setConversations(conversations.filter((conv) => conv.id !== conversationId))
        if (selectedConversationId === conversationId) {
          setSelectedConversationId(null)
          setMessages([])
        }
      } else {
        console.error('Failed to delete conversation')
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
  }

  const handleRenameConversation = async (conversationId: number, newTitle: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle }),
      })

      if (response.ok) {
        const result = await response.json()
        setConversations(
          conversations.map((conv) =>
            conv.id === conversationId ? result.data : conv,
          ),
        )
      } else {
        console.error('Failed to rename conversation')
      }
    } catch (error) {
      console.error('Error renaming conversation:', error)
    }
  }

  if (authLoading) {
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

      <div className="lg:pl-64 flex h-screen">
        {/* Conversation Sidebar */}
        <ConversationSidebar
          conversations={conversations.filter((conv) => conv.bot_id === Number.parseInt(selectedBotId))}
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-lg font-semibold">Chat & Test</h1>
                  <p className="text-sm text-muted-foreground">Test your bots in real-time</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Select value={selectedBotId} onValueChange={setSelectedBotId}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select a bot" />
                  </SelectTrigger>
                  <SelectContent>
                    {bots.map((bot) => (
                      <SelectItem key={bot.id} value={bot.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span>{bot.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {bot.model}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedBot && (
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Chat Content */}
          {!selectedBot ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No active bots</h3>
                <p className="text-muted-foreground mb-4">Create and activate a bot to start testing.</p>
                <Button onClick={() => router.push("/dashboard")}>
                  <Play className="h-4 w-4 mr-2" />
                  Go to Bots
                </Button>
              </div>
            </div>
          ) : !selectedConversationId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
                <p className="text-muted-foreground mb-4">
                  Create a new conversation to test your bot: <strong>{selectedBot.name}</strong>
                </p>
                <Button onClick={handleNewConversation}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  New Conversation
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="max-w-4xl mx-auto">
                  {messages.map((message, index) => (
                    <ChatMessage key={message.id} message={message} isLast={index === messages.length - 1} />
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 mb-4">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
                      </div>
                      <div className="bg-muted rounded-lg px-4 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.1s]"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Chat Input */}
              <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading || chatLoading} disabled={!selectedBot} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
