"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { MessageSquare, Send, X, Minimize2, Maximize2, Copy, ExternalLink } from 'lucide-react'
import type { Bot, Message } from '@/lib/types'

interface ChatbotWidgetProps {
  bot: Bot
  isOpen: boolean
  onToggle: () => void
  onSendMessage: (message: string) => Promise<void>
  messages: Message[]
  isLoading: boolean
}

export function ChatbotWidget({ 
  bot, 
  isOpen, 
  onToggle, 
  onSendMessage, 
  messages, 
  isLoading 
}: ChatbotWidgetProps) {
  const [inputValue, setInputValue] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return
    
    const message = inputValue.trim()
    setInputValue('')
    await onSendMessage(message)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <Button
          onClick={onToggle}
          className="rounded-full w-14 h-14 shadow-lg"
          style={{ backgroundColor: bot.primary_color || '#3b82f6' }}
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      ) : (
        <Card 
          className={`w-80 shadow-xl border-0 transition-all duration-300 ${
            isMinimized ? 'h-16' : 'h-96'
          }`}
          style={{ 
            borderColor: bot.primary_color || '#3b82f6',
            borderWidth: '2px'
          }}
        >
          <CardHeader 
            className="p-3 pb-2"
            style={{ backgroundColor: bot.primary_color || '#3b82f6' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: bot.secondary_color || '#1e40af' }}
                >
                  {bot.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <CardTitle className="text-white text-sm font-medium">
                    {bot.name}
                  </CardTitle>
                  <div className="text-xs text-white/80">Online</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-6 w-6 p-0 text-white hover:bg-white/20"
                >
                  {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="h-6 w-6 p-0 text-white hover:bg-white/20"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {!isMinimized && (
            <CardContent className="p-0 flex flex-col h-full">
              {/* Messages */}
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center py-4">
                      <div className="text-sm text-muted-foreground">
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
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                          style={
                            message.role === 'user'
                              ? { backgroundColor: bot.primary_color || '#3b82f6' }
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
                      <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.1s]"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-3 border-t">
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
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    size="sm"
                    style={{ backgroundColor: bot.primary_color || '#3b82f6' }}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}

// Widget Embed Code Generator
export function WidgetEmbedCode({ bot }: { bot: Bot }) {
  const embedCode = `<!-- Chatbot Widget for ${bot.name} -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${window.location.origin}/widget/${bot.id}.js';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>

<!-- Standard iframe embed -->
<iframe 
  src="${window.location.origin}/embed/${bot.id}" 
  width="350" 
  height="500" 
  frameborder="0"
  style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"
  title="${bot.name} Chatbot">
</iframe>

<!-- Floating chat button (perfect for external websites) -->
<iframe 
  src="${window.location.origin}/embed/${bot.id}/mobile" 
  width="80px" 
  height="80px" 
  frameborder="0"
  style="position: fixed; bottom: 20px; right: 20px; z-index: 9999; border: none;"
  title="${bot.name} Chat Button">
</iframe>`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(embedCode)
      // You could show a toast notification here
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          Embed Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Widget Embed Code</label>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>
          <ScrollArea className="h-32 w-full rounded border p-3">
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
              {embedCode}
            </pre>
          </ScrollArea>
        </div>
        
        <div className="p-3 bg-muted rounded-lg">
          <h4 className="font-medium text-sm mb-2">Integration Options:</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div>• <strong>JavaScript Widget:</strong> Interactive floating chat widget</div>
            <div>• <strong>Iframe Embed:</strong> Fixed chat window for specific pages</div>
            <div>• <strong>API Integration:</strong> Custom implementation using REST API</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
