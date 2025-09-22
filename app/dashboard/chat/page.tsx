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

    // Load mock data
    const userBots = mockBots.filter((bot) => bot.user_id === user?.id && bot.status === "active")
    setBots(userBots)

    // Load conversations for user's bots
    const botIds = userBots.map((bot) => bot.id)
    const userConversations = mockConversations.filter((conv) => botIds.includes(conv.bot_id))
    setConversations(userConversations)

    // Auto-select bot from URL parameter or first available bot
    const botIdFromUrl = searchParams.get('botId')
    if (botIdFromUrl && userBots.find(bot => bot.id.toString() === botIdFromUrl)) {
      setSelectedBotId(botIdFromUrl)
    } else if (userBots.length > 0 && !selectedBotId) {
      setSelectedBotId(userBots[0].id.toString())
    }
  }, [user, authLoading, router, selectedBotId, searchParams])

  useEffect(() => {
    // Load messages for selected conversation
    if (selectedConversationId) {
      const conversationMessages = mockMessages.filter((msg) => msg.conversation_id === selectedConversationId)
      setMessages(conversationMessages)
    } else {
      setMessages([])
    }
  }, [selectedConversationId])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const selectedBot = bots.find((bot) => bot.id === Number.parseInt(selectedBotId))
  const selectedConversation = conversations.find((conv) => conv.id === selectedConversationId)

  const handleNewConversation = () => {
    if (!selectedBot) return

    const newConversation: Conversation = {
      id: Math.max(...conversations.map((c) => c.id), 0) + 1,
      bot_id: selectedBot.id,
      user_id: user!.id,
      title: "New Conversation",
      is_test: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setConversations([newConversation, ...conversations])
    setSelectedConversationId(newConversation.id)

    // Add system message
    const systemMessage: Message = {
      id: Math.max(...messages.map((m) => m.id), 0) + 1,
      conversation_id: newConversation.id,
      role: "system",
      content: "Test conversation started",
      created_at: new Date().toISOString(),
    }

    setMessages([systemMessage])
  }

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId || !selectedBot) return

    // Add user message
    const userMessage: Message = {
      id: Math.max(...messages.map((m) => m.id), 0) + 1,
      conversation_id: selectedConversationId,
      role: "user",
      content,
      created_at: new Date().toISOString(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setIsLoading(true)

    try {
      // Send message to DeepSeek API
      const response = await sendMessageWithBot(updatedMessages, selectedBot)

      // Add assistant response
      const assistantMessage: Message = {
        id: Math.max(...messages.map((m) => m.id), userMessage.id) + 1,
        conversation_id: selectedConversationId,
        role: "assistant",
        content: response.message,
        tokens_used: response.usage?.total_tokens,
        response_time_ms: undefined, // Could be calculated if needed
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Update conversation title if it's the first user message
      if (selectedConversation?.title === "New Conversation") {
        const newTitle = content.length > 50 ? content.substring(0, 50) + "..." : content
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === selectedConversationId
              ? { ...conv, title: newTitle, updated_at: new Date().toISOString() }
              : conv,
          ),
        )
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      
      // Add error message
      const errorMessage: Message = {
        id: Math.max(...messages.map((m) => m.id), userMessage.id) + 1,
        conversation_id: selectedConversationId,
        role: "assistant",
        content: "Sorry, I encountered an error while processing your request. Please try again.",
        created_at: new Date().toISOString(),
      }
      
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteConversation = (conversationId: number) => {
    setConversations(conversations.filter((conv) => conv.id !== conversationId))
    if (selectedConversationId === conversationId) {
      setSelectedConversationId(null)
      setMessages([])
    }
  }

  const handleRenameConversation = (conversationId: number, newTitle: string) => {
    setConversations(
      conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, title: newTitle, updated_at: new Date().toISOString() } : conv,
      ),
    )
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
