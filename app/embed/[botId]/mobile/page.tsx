"use client"

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Send, MessageSquare, X } from 'lucide-react'
import type { Bot, Message } from '@/lib/types'

export default function MobileEmbedPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const botId = params.botId as string
  
  const [bot, setBot] = useState<Bot | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [conversationId, setConversationId] = useState<number | null>(null)
  
  // Get theme configuration from URL params
  const themeParam = searchParams.get('theme')
  let theme = {
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    showAvatar: true,
    showTitle: true
  }
  
  if (themeParam) {
    try {
      theme = { ...theme, ...JSON.parse(decodeURIComponent(themeParam)) }
    } catch (e) {
      console.error('Invalid theme parameter:', e)
    }
  }

  useEffect(() => {
    // Load bot information
    const loadBot = async () => {
      try {
        const response = await fetch(`/api/bots/${botId}`)
        if (response.ok) {
          const result = await response.json()
          setBot(result.data)
        }
      } catch (error) {
        console.error('Error loading bot:', error)
      }
    }

    if (botId) {
      loadBot()
    }
  }, [botId])

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading || !bot) return
    
    const message = inputValue.trim()
    setInputValue('')
    setIsLoading(true)
    
    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      conversation_id: conversationId || 0,
      role: 'user',
      content: message,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botId: parseInt(botId),
          message: message,
          conversationId: conversationId
        })
      })

      const data = await response.json()
      
      if (data.success) {
        const assistantMessage: Message = {
          id: Date.now() + 1,
          conversation_id: data.conversationId || conversationId || 0,
          role: 'assistant',
          content: data.message,
          created_at: new Date().toISOString()
        }
        setMessages(prev => [...prev, assistantMessage])
        
        if (data.conversationId) {
          setConversationId(data.conversationId)
        }
      } else {
        const errorMessage: Message = {
          id: Date.now() + 1,
          conversation_id: conversationId || 0,
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          created_at: new Date().toISOString()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: Date.now() + 1,
        conversation_id: conversationId || 0,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!bot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chatbot...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent relative">
      {/* Chat Icon - Always visible */}
      {!isOpen && (
        <div 
          className="fixed bottom-6 right-6 z-50"
          style={{ 
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999
          }}
        >
          <Button
            onClick={() => setIsOpen(true)}
            className="rounded-full w-14 h-14 shadow-lg hover:scale-105 transition-transform"
            style={{ backgroundColor: theme.primaryColor }}
          >
            <MessageSquare className="h-6 w-6 text-white" />
          </Button>
        </div>
      )}

      {/* Chat Window - Opens in center, not in button space */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="w-full max-w-md h-[600px] bg-white rounded-lg shadow-2xl transform transition-transform duration-300 ease-out"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="h-full border-0 shadow-none rounded-lg">
              <CardHeader 
                className="p-4 pb-3"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {theme.showAvatar && (
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                        style={{ backgroundColor: theme.secondaryColor }}
                      >
                        {bot.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {theme.showTitle && (
                      <div>
                        <CardTitle className="text-white text-sm font-medium">
                          {bot.name}
                        </CardTitle>
                        <div className="text-xs text-white/80">Online</div>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 p-0 text-white hover:bg-white/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-0 flex flex-col h-full">
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-sm text-gray-600">
                          Hi! I'm {bot.name}. How can I help you today?
                        </div>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                              message.role === 'user'
                                ? 'text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                            style={
                              message.role === 'user'
                                ? { backgroundColor: theme.primaryColor }
                                : {}
                            }
                          >
                            {message.content}
                          </div>
                        </div>
                      ))
                    )}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!inputValue.trim() || isLoading}
                      size="sm"
                      style={{ backgroundColor: theme.primaryColor }}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
